// Canvas Host Config - implements HostConfig for Canvas 2D rendering
// Uses @chenglou/pretext for DOM-free text measurement and layout

import {
  prepareWithSegments,
  layoutWithLines,
  type PreparedTextWithSegments,
} from "@chenglou/pretext";
import type { HostConfig } from "./HostConfigInterface.js";

// ── Canvas scene graph node types ──────────────────────────────────

export interface CanvasStyle {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: number;
  textAlign?: "left" | "center" | "right";
  backgroundColor?: string;
  borderRadius?: number;
  opacity?: number;
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
}

export interface CanvasNode {
  type: string;
  props: Record<string, unknown>;
  style: CanvasStyle;
  children: Array<CanvasNode | CanvasTextNode>;
  parent: CanvasNode | null;
  // Computed layout (set during layout pass)
  computedX: number;
  computedY: number;
  computedWidth: number;
  computedHeight: number;
}

export interface CanvasTextNode {
  type: "__text__";
  content: string;
  parent: CanvasNode | null;
  // Pretext prepared data for measurement
  prepared: PreparedTextWithSegments | null;
}

export interface CanvasHostContext {
  font: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
}

export interface CanvasContainer {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  root: CanvasNode;
  width: number;
  height: number;
  defaultFont: string;
  defaultFontSize: number;
  defaultFontFamily: string;
  defaultLineHeight: number;
  onCommit: (() => void) | undefined;
}

// ── Helpers ────────────────────────────────────────────────────────

function isTextNode(node: CanvasNode | CanvasTextNode): node is CanvasTextNode {
  return node.type === "__text__";
}

function buildFont(
  style: CanvasStyle,
  defaults: { fontSize: number; fontFamily: string; fontWeight?: string },
): string {
  const weight = style.fontWeight || defaults.fontWeight || "400";
  const size = style.fontSize || defaults.fontSize;
  const family = style.fontFamily || defaults.fontFamily;
  return `${weight} ${size}px ${family}`;
}

function createNode(type: string, props: Record<string, unknown>): CanvasNode {
  const style = (props["style"] as CanvasStyle) || {};
  return {
    type,
    props,
    style,
    children: [],
    parent: null,
    computedX: 0,
    computedY: 0,
    computedWidth: 0,
    computedHeight: 0,
  };
}

function removeFromParent(child: CanvasNode | CanvasTextNode, parent: CanvasNode): void {
  const idx = parent.children.indexOf(child);
  if (idx !== -1) parent.children.splice(idx, 1);
  child.parent = null;
}

// ── Layout engine ──────────────────────────────────────────────────

function getPadding(style: CanvasStyle): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  const p = style.padding || 0;
  return {
    top: style.paddingTop ?? p,
    right: style.paddingRight ?? p,
    bottom: style.paddingBottom ?? p,
    left: style.paddingLeft ?? p,
  };
}

export function layoutTree(
  node: CanvasNode,
  x: number,
  y: number,
  maxWidth: number,
  ctx: CanvasHostContext,
): { width: number; height: number } {
  const style = node.style;
  const pad = getPadding(style);

  node.computedX = style.x ?? x;
  node.computedY = style.y ?? y;
  node.computedWidth = style.width ?? maxWidth;

  const innerWidth = node.computedWidth - pad.left - pad.right;
  let cursorY = pad.top;

  const childCtx: CanvasHostContext = {
    font: buildFont(style, ctx),
    fontSize: style.fontSize || ctx.fontSize,
    fontFamily: style.fontFamily || ctx.fontFamily,
    lineHeight: style.lineHeight || ctx.lineHeight,
  };

  for (const child of node.children) {
    if (isTextNode(child)) {
      // Use pretext for text measurement
      if (child.content.length > 0) {
        const font = childCtx.font;
        child.prepared = prepareWithSegments(child.content, font);
        const result = layoutWithLines(child.prepared, innerWidth, childCtx.lineHeight);
        cursorY += result.height;
      }
    } else {
      const childResult = layoutTree(
        child,
        node.computedX + pad.left,
        node.computedY + cursorY,
        innerWidth,
        childCtx,
      );
      cursorY += childResult.height;
    }
  }

  node.computedHeight = style.height ?? cursorY + pad.bottom;

  return { width: node.computedWidth, height: node.computedHeight };
}

// ── Paint engine ───────────────────────────────────────────────────

export function paintTree(
  node: CanvasNode,
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  hostCtx: CanvasHostContext,
): void {
  const style = node.style;
  const pad = getPadding(style);

  // Save state for opacity
  if (style.opacity !== undefined && style.opacity < 1) {
    ctx.save();
    ctx.globalAlpha *= style.opacity;
  }

  // Draw background
  if (style.backgroundColor) {
    ctx.fillStyle = style.backgroundColor;
    if (style.borderRadius) {
      roundRect(
        ctx,
        node.computedX,
        node.computedY,
        node.computedWidth,
        node.computedHeight,
        style.borderRadius,
      );
      ctx.fill();
    } else {
      ctx.fillRect(node.computedX, node.computedY, node.computedWidth, node.computedHeight);
    }
  }

  // Draw border
  if (style.stroke) {
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = style.strokeWidth || 1;
    if (style.borderRadius) {
      roundRect(
        ctx,
        node.computedX,
        node.computedY,
        node.computedWidth,
        node.computedHeight,
        style.borderRadius,
      );
      ctx.stroke();
    } else {
      ctx.strokeRect(node.computedX, node.computedY, node.computedWidth, node.computedHeight);
    }
  }

  // Paint children
  const childCtx: CanvasHostContext = {
    font: buildFont(style, hostCtx),
    fontSize: style.fontSize || hostCtx.fontSize,
    fontFamily: style.fontFamily || hostCtx.fontFamily,
    lineHeight: style.lineHeight || hostCtx.lineHeight,
  };

  let textY = node.computedY + pad.top;

  for (const child of node.children) {
    if (isTextNode(child)) {
      if (child.prepared) {
        const innerWidth = node.computedWidth - pad.left - pad.right;
        const { lines } = layoutWithLines(child.prepared, innerWidth, childCtx.lineHeight);
        ctx.fillStyle = style.fill || "#000";
        ctx.font = childCtx.font;
        ctx.textBaseline = "top";

        const textX = node.computedX + pad.left;
        for (const line of lines) {
          let lineX = textX;
          if (style.textAlign === "center") {
            lineX = textX + (innerWidth - line.width) / 2;
          } else if (style.textAlign === "right") {
            lineX = textX + innerWidth - line.width;
          }
          ctx.fillText(line.text, lineX, textY);
          textY += childCtx.lineHeight;
        }
      }
    } else {
      paintTree(child, ctx, childCtx);
      textY = child.computedY + child.computedHeight;
    }
  }

  // Restore opacity
  if (style.opacity !== undefined && style.opacity < 1) {
    ctx.restore();
  }
}

function roundRect(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── CanvasHostConfig ───────────────────────────────────────────────

export function createCanvasHostConfig(): HostConfig<
  string,
  Record<string, unknown>,
  CanvasContainer,
  CanvasNode,
  CanvasTextNode,
  CanvasHostContext,
  boolean
> {
  return {
    supportsMutation: true,
    isPrimaryRenderer: false,

    createInstance(
      type: string,
      props: Record<string, unknown>,
      _rootContainer: CanvasContainer,
      _hostContext: CanvasHostContext,
    ): CanvasNode {
      return createNode(type, props);
    },

    createTextInstance(
      text: string,
      _rootContainer: CanvasContainer,
      _hostContext: CanvasHostContext,
    ): CanvasTextNode {
      return {
        type: "__text__",
        content: text,
        parent: null,
        prepared: null,
      };
    },

    appendChild(parent: CanvasNode | CanvasContainer, child: CanvasNode | CanvasTextNode): void {
      const p = "root" in parent ? (parent as CanvasContainer).root : (parent as CanvasNode);
      child.parent = p;
      p.children.push(child);
    },

    appendChildToContainer(container: CanvasContainer, child: CanvasNode | CanvasTextNode): void {
      child.parent = container.root;
      container.root.children.push(child);
    },

    appendInitialChild(parent: CanvasNode, child: CanvasNode | CanvasTextNode): void {
      child.parent = parent;
      parent.children.push(child);
    },

    insertBefore(
      parent: CanvasNode | CanvasContainer,
      child: CanvasNode | CanvasTextNode,
      before: CanvasNode | CanvasTextNode,
    ): void {
      const p = "root" in parent ? (parent as CanvasContainer).root : (parent as CanvasNode);
      child.parent = p;
      const idx = p.children.indexOf(before);
      if (idx !== -1) {
        p.children.splice(idx, 0, child);
      } else {
        p.children.push(child);
      }
    },

    insertInContainerBefore(
      container: CanvasContainer,
      child: CanvasNode | CanvasTextNode,
      before: CanvasNode | CanvasTextNode,
    ): void {
      child.parent = container.root;
      const idx = container.root.children.indexOf(before);
      if (idx !== -1) {
        container.root.children.splice(idx, 0, child);
      } else {
        container.root.children.push(child);
      }
    },

    removeChild(parent: CanvasNode | CanvasContainer, child: CanvasNode | CanvasTextNode): void {
      const p = "root" in parent ? (parent as CanvasContainer).root : (parent as CanvasNode);
      removeFromParent(child, p);
    },

    removeChildFromContainer(container: CanvasContainer, child: CanvasNode | CanvasTextNode): void {
      removeFromParent(child, container.root);
    },

    commitUpdate(
      instance: CanvasNode,
      _type: string,
      _oldProps: Record<string, unknown>,
      newProps: Record<string, unknown>,
    ): void {
      instance.props = newProps;
      instance.style = (newProps["style"] as CanvasStyle) || {};
    },

    commitTextUpdate(textInstance: CanvasTextNode, _oldText: string, newText: string): void {
      textInstance.content = newText;
      textInstance.prepared = null; // invalidate — will be re-prepared on next layout
    },

    resetTextContent(instance: CanvasNode): void {
      instance.children = instance.children.filter((c) => !isTextNode(c));
    },

    shouldSetTextContent(_type: string, props: Record<string, unknown>): boolean {
      return typeof props["children"] === "string" || typeof props["children"] === "number";
    },

    getRootHostContext(_rootContainer: CanvasContainer): CanvasHostContext {
      const c = _rootContainer;
      return {
        font: c.defaultFont,
        fontSize: c.defaultFontSize,
        fontFamily: c.defaultFontFamily,
        lineHeight: c.defaultLineHeight,
      };
    },

    getChildHostContext(parentHostContext: CanvasHostContext, _type: string): CanvasHostContext {
      return parentHostContext;
    },

    prepareForCommit(_container: CanvasContainer): Record<string, unknown> | null {
      return null;
    },

    resetAfterCommit(container: CanvasContainer): void {
      // Re-layout and repaint the entire tree
      const hostCtx: CanvasHostContext = {
        font: container.defaultFont,
        fontSize: container.defaultFontSize,
        fontFamily: container.defaultFontFamily,
        lineHeight: container.defaultLineHeight,
      };

      layoutTree(container.root, 0, 0, container.width, hostCtx);

      // Clear and repaint
      container.ctx.clearRect(0, 0, container.width, container.height);
      paintTree(container.root, container.ctx, hostCtx);

      container.onCommit?.();
    },

    finalizeInitialChildren(
      _instance: CanvasNode,
      _type: string,
      _props: Record<string, unknown>,
      _hostContext: CanvasHostContext,
    ): boolean {
      return false;
    },

    prepareUpdate(
      _instance: CanvasNode,
      _type: string,
      oldProps: Record<string, unknown>,
      newProps: Record<string, unknown>,
      _hostContext: CanvasHostContext,
    ): boolean | null {
      for (const key in oldProps) {
        if (key === "children" || key === "key" || key === "ref") continue;
        if (oldProps[key] !== newProps[key]) return true;
      }
      for (const key in newProps) {
        if (key === "children" || key === "key" || key === "ref") continue;
        if (!(key in oldProps)) return true;
      }
      return null;
    },

    clearContainer(container: CanvasContainer): void {
      container.root.children = [];
      container.ctx.clearRect(0, 0, container.width, container.height);
    },

    getCurrentTime(): number {
      return performance.now();
    },

    scheduleMicrotask(fn: () => void): void {
      queueMicrotask(fn);
    },
  };
}
