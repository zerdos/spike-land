/**
 * Browser Adapter Interface
 *
 * Abstracts browser automation backends (Playwright, Puppeteer, etc.)
 * so tools and narration work identically across runtimes.
 */

import type { AccessibilityNode } from "./types.js";

export interface BrowserPage {
  goto(url: string, opts?: { waitUntil?: string }): Promise<unknown>;
  title(): Promise<string>;
  url(): string;
  screenshot(opts?: {
    fullPage?: boolean;
    encoding?: "base64" | "binary";
    type?: "png" | "jpeg";
  }): Promise<string | Buffer>;
  evaluate(fn: string | ((...args: unknown[]) => unknown)): Promise<unknown>;
  setViewportSize(size: { width: number; height: number }): Promise<void>;
  close(): Promise<void>;
  isClosed(): boolean;
  keyboard: {
    press(key: string): Promise<void>;
    type(text: string): Promise<void>;
  };
  getByRole(
    role: string,
    opts?: { name?: string | RegExp },
  ): {
    click(): Promise<void>;
    fill(text: string): Promise<void>;
    clear(): Promise<void>;
    selectOption(value: string): Promise<string[]>;
  };
  mouse: {
    wheel(deltaX: number, deltaY: number): Promise<void>;
  };
  viewportSize(): { width: number; height: number } | null;
  getAccessibilityTree(): Promise<AccessibilityNode | null>;
}

export interface BrowserAdapter {
  launch(): Promise<void>;
  newPage(): Promise<BrowserPage>;
  isConnected(): boolean;
  close(): Promise<void>;
}

// ─── Shared CDP → AccessibilityNode conversion ──────────────────────────────

export interface CdpAxNode {
  nodeId: string;
  childIds?: string[];
  role?: { value?: string };
  name?: { value?: string };
  value?: { value?: string | number };
  properties?: Array<{ name: string; value: { value?: unknown } }>;
}

export function rebuildTree(nodes: CdpAxNode[]): AccessibilityNode | null {
  const nodeMap = new Map<string, AccessibilityNode>();

  for (const cdpNode of nodes) {
    const nodeName = cdpNode.name?.value;
    const nodeValue = cdpNode.value?.value?.toString();
    const node: AccessibilityNode = {
      role: cdpNode.role?.value || "generic",
      ...(nodeName !== undefined ? { name: nodeName } : {}),
      ...(nodeValue !== undefined ? { value: nodeValue } : {}),
    };

    if (cdpNode.properties) {
      for (const prop of cdpNode.properties) {
        switch (prop.name) {
          case "checked":
            node.checked =
              prop.value.value === "true"
                ? true
                : prop.value.value === "mixed"
                  ? "mixed"
                  : false;
            break;
          case "disabled":
            node.disabled = !!prop.value.value;
            break;
          case "expanded":
            node.expanded = !!prop.value.value;
            break;
          case "selected":
            node.selected = !!prop.value.value;
            break;
          case "pressed":
            node.pressed =
              prop.value.value === "true"
                ? true
                : prop.value.value === "mixed"
                  ? "mixed"
                  : false;
            break;
          case "level":
            node.level = Number(prop.value.value);
            break;
        }
      }
    }

    nodeMap.set(cdpNode.nodeId, node);
  }

  for (const cdpNode of nodes) {
    const node = nodeMap.get(cdpNode.nodeId);
    if (node && cdpNode.childIds) {
      node.children = cdpNode.childIds
        .map((id) => nodeMap.get(id))
        .filter((n): n is AccessibilityNode => !!n);
    }
  }

  const firstNodeId = nodes[0]?.nodeId;
  return firstNodeId ? nodeMap.get(firstNodeId) ?? null : null;
}
