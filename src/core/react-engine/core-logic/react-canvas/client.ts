// React Canvas Client - createCanvasRoot entry point
// Renders React components to Canvas 2D using pretext for text measurement

import type { ReactNode } from "../react/ReactTypes.js";
import {
  createCanvasHostConfig,
  type CanvasContainer,
  type CanvasNode,
} from "../host-config/CanvasHostConfig.js";
import { createContainer, updateContainer } from "../reconciler/ReactFiberReconciler.js";

export interface CanvasRoot {
  render(children: ReactNode): void;
  unmount(): void;
  /** Access the scene graph root for inspection/testing */
  getSceneGraph(): CanvasNode;
  /** Force a re-layout and repaint */
  repaint(): void;
  /** Resize the canvas and re-layout */
  resize(width: number, height: number): void;
}

export interface CreateCanvasRootOptions {
  /** Default font size in pixels (default: 16) */
  fontSize?: number;
  /** Default font family (default: "Inter") */
  fontFamily?: string;
  /** Default line height in pixels (default: 22) */
  lineHeight?: number;
  /** Callback after each commit/repaint */
  onCommit?: () => void;
}

function buildFont(fontSize: number, fontFamily: string): string {
  return `400 ${fontSize}px ${fontFamily}`;
}

export function createCanvasRoot(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  options?: CreateCanvasRootOptions,
): CanvasRoot {
  const fontSize = options?.fontSize ?? 16;
  const fontFamily = options?.fontFamily ?? "Inter";
  const lineHeight = options?.lineHeight ?? 22;
  const defaultFont = buildFont(fontSize, fontFamily);

  const width = canvas.width;
  const height = canvas.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("createCanvasRoot: Failed to get 2d context from canvas");
  }

  const root: CanvasNode = {
    type: "__root__",
    props: {},
    style: {},
    children: [],
    parent: null,
    computedX: 0,
    computedY: 0,
    computedWidth: width,
    computedHeight: height,
  };

  const container: CanvasContainer = {
    canvas,
    ctx: ctx as CanvasRenderingContext2D,
    root,
    width,
    height,
    defaultFont,
    defaultFontSize: fontSize,
    defaultFontFamily: fontFamily,
    defaultLineHeight: lineHeight,
    onCommit: options?.onCommit,
  };

  const hostConfig = createCanvasHostConfig();
  const fiberRoot = createContainer(container, hostConfig);

  return {
    render(children: ReactNode): void {
      updateContainer(children, fiberRoot);
    },

    unmount(): void {
      updateContainer(null, fiberRoot);
    },

    getSceneGraph(): CanvasNode {
      return root;
    },

    repaint(): void {
      // Trigger a resetAfterCommit manually
      hostConfig.resetAfterCommit(container);
    },

    resize(newWidth: number, newHeight: number): void {
      canvas.width = newWidth;
      canvas.height = newHeight;
      container.width = newWidth;
      container.height = newHeight;
      root.computedWidth = newWidth;
      root.computedHeight = newHeight;
      hostConfig.resetAfterCommit(container);
    },
  };
}
