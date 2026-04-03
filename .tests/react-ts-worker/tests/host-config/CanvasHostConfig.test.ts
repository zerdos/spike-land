import { describe, expect, it, vi } from "vitest";

// Mock @chenglou/pretext since it requires OffscreenCanvas/DOM canvas
// which jsdom doesn't provide. We simulate text measurement.
vi.mock("@chenglou/pretext", () => ({
  prepareWithSegments: vi.fn((text: string, _font: string) => ({
    __mocked: true,
    text,
    segments: [{ text, width: text.length * 8 }],
  })),
  layoutWithLines: vi.fn((prepared: { text: string }, maxWidth: number, lineHeight: number) => {
    const charWidth = 8;
    const textLen = prepared.text.length * charWidth;
    const lineCount = Math.max(1, Math.ceil(textLen / maxWidth));
    const lines = [];
    const charsPerLine = Math.floor(maxWidth / charWidth);
    for (let i = 0; i < lineCount; i++) {
      const start = i * charsPerLine;
      const lineText = prepared.text.slice(start, start + charsPerLine);
      lines.push({
        text: lineText,
        width: Math.min(textLen - i * maxWidth, maxWidth),
        start: { segmentIndex: 0, graphemeIndex: start },
        end: { segmentIndex: 0, graphemeIndex: start + lineText.length },
      });
    }
    return { height: lineCount * lineHeight, lineCount, lines };
  }),
}));

import {
  createCanvasHostConfig,
  layoutTree,
  type CanvasContainer,
  type CanvasHostContext,
  type CanvasNode,
} from "../../../../src/core/react-engine/core-logic/host-config/CanvasHostConfig.js";

// ── Canvas 2D mock for jsdom ──────────────────────────────────────

function createMockCtx(): CanvasRenderingContext2D {
  return {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textBaseline: "alphabetic",
    globalAlpha: 1,
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arcTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    measureText: vi.fn((text: string) => ({
      width: text.length * 8,
      actualBoundingBoxAscent: 12,
      actualBoundingBoxDescent: 4,
      fontBoundingBoxAscent: 14,
      fontBoundingBoxDescent: 4,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: text.length * 8,
    })),
  } as unknown as CanvasRenderingContext2D;
}

// ── Test helpers ───────────────────────────────────────────────────

function makeContainer(width = 800, height = 600): CanvasContainer {
  const ctx = createMockCtx();

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

  return {
    canvas: { width, height } as unknown as HTMLCanvasElement,
    ctx,
    root,
    width,
    height,
    defaultFont: "400 16px Inter",
    defaultFontSize: 16,
    defaultFontFamily: "Inter",
    defaultLineHeight: 22,
  };
}

const defaultHostContext: CanvasHostContext = {
  font: "400 16px Inter",
  fontSize: 16,
  fontFamily: "Inter",
  lineHeight: 22,
};

describe("CanvasHostConfig", () => {
  const config = createCanvasHostConfig();

  describe("createInstance", () => {
    it("creates a canvas node with type and props", () => {
      const container = makeContainer();
      const node = config.createInstance(
        "div",
        { style: { backgroundColor: "#f00", width: 200 } },
        container,
        defaultHostContext,
      );
      expect(node.type).toBe("div");
      expect(node.style.backgroundColor).toBe("#f00");
      expect(node.style.width).toBe(200);
      expect(node.children).toEqual([]);
    });

    it("creates a node without style prop", () => {
      const container = makeContainer();
      const node = config.createInstance("span", {}, container, defaultHostContext);
      expect(node.type).toBe("span");
      expect(node.style).toEqual({});
    });
  });

  describe("createTextInstance", () => {
    it("creates a text node with content", () => {
      const container = makeContainer();
      const text = config.createTextInstance("hello world", container, defaultHostContext);
      expect(text.type).toBe("__text__");
      expect(text.content).toBe("hello world");
      expect(text.prepared).toBeNull();
    });
  });

  describe("tree mutations", () => {
    it("appendChild adds child to parent node", () => {
      const container = makeContainer();
      const parent = config.createInstance("div", {}, container, defaultHostContext);
      const child = config.createInstance("span", {}, container, defaultHostContext);
      config.appendChild(parent, child);
      expect(parent.children).toContain(child);
      expect(child.parent).toBe(parent);
    });

    it("appendChildToContainer adds child to root", () => {
      const container = makeContainer();
      const child = config.createInstance("div", {}, container, defaultHostContext);
      config.appendChildToContainer(container, child);
      expect(container.root.children).toContain(child);
      expect(child.parent).toBe(container.root);
    });

    it("appendInitialChild adds child", () => {
      const container = makeContainer();
      const parent = config.createInstance("div", {}, container, defaultHostContext);
      const child = config.createInstance("span", {}, container, defaultHostContext);
      config.appendInitialChild(parent, child);
      expect(parent.children).toContain(child);
    });

    it("insertBefore inserts before reference", () => {
      const container = makeContainer();
      const parent = config.createInstance("div", {}, container, defaultHostContext);
      const child1 = config.createInstance("span", {}, container, defaultHostContext);
      const child2 = config.createInstance("span", {}, container, defaultHostContext);
      config.appendChild(parent, child2);
      config.insertBefore(parent, child1, child2);
      expect(parent.children[0]).toBe(child1);
      expect(parent.children[1]).toBe(child2);
    });

    it("insertInContainerBefore inserts before reference in container root", () => {
      const container = makeContainer();
      const child1 = config.createInstance("span", {}, container, defaultHostContext);
      const child2 = config.createInstance("span", {}, container, defaultHostContext);
      config.appendChildToContainer(container, child2);
      config.insertInContainerBefore(container, child1, child2);
      expect(container.root.children[0]).toBe(child1);
    });

    it("removeChild removes child from parent", () => {
      const container = makeContainer();
      const parent = config.createInstance("div", {}, container, defaultHostContext);
      const child = config.createInstance("span", {}, container, defaultHostContext);
      config.appendChild(parent, child);
      config.removeChild(parent, child);
      expect(parent.children).not.toContain(child);
      expect(child.parent).toBeNull();
    });

    it("removeChildFromContainer removes from root", () => {
      const container = makeContainer();
      const child = config.createInstance("div", {}, container, defaultHostContext);
      config.appendChildToContainer(container, child);
      config.removeChildFromContainer(container, child);
      expect(container.root.children).not.toContain(child);
    });
  });

  describe("commitUpdate", () => {
    it("updates node props and style", () => {
      const container = makeContainer();
      const node = config.createInstance(
        "div",
        { style: { fill: "#f00" } },
        container,
        defaultHostContext,
      );
      config.commitUpdate(
        node,
        "div",
        { style: { fill: "#f00" } },
        { style: { fill: "#0f0", fontSize: 24 } },
      );
      expect(node.style.fill).toBe("#0f0");
      expect(node.style.fontSize).toBe(24);
    });
  });

  describe("commitTextUpdate", () => {
    it("updates text content and invalidates prepared", () => {
      const container = makeContainer();
      const text = config.createTextInstance("old", container, defaultHostContext);
      // Simulate having prepared data
      text.prepared = {} as never;
      config.commitTextUpdate(text, "old", "new text");
      expect(text.content).toBe("new text");
      expect(text.prepared).toBeNull();
    });
  });

  describe("resetTextContent", () => {
    it("removes text children from node", () => {
      const container = makeContainer();
      const node = config.createInstance("div", {}, container, defaultHostContext);
      const text = config.createTextInstance("hello", container, defaultHostContext);
      const child = config.createInstance("span", {}, container, defaultHostContext);
      node.children.push(text, child);
      config.resetTextContent(node);
      expect(node.children).toEqual([child]);
    });
  });

  describe("shouldSetTextContent", () => {
    it("returns true for string children", () => {
      expect(config.shouldSetTextContent("div", { children: "hello" })).toBe(true);
    });

    it("returns true for number children", () => {
      expect(config.shouldSetTextContent("div", { children: 42 })).toBe(true);
    });

    it("returns false for object children", () => {
      expect(config.shouldSetTextContent("div", { children: {} })).toBe(false);
    });

    it("returns false for no children", () => {
      expect(config.shouldSetTextContent("div", {})).toBe(false);
    });
  });

  describe("host context", () => {
    it("getRootHostContext returns font defaults from container", () => {
      const container = makeContainer();
      const ctx = config.getRootHostContext(container);
      expect(ctx.font).toBe("400 16px Inter");
      expect(ctx.fontSize).toBe(16);
      expect(ctx.fontFamily).toBe("Inter");
      expect(ctx.lineHeight).toBe(22);
    });

    it("getChildHostContext returns parent context", () => {
      const ctx = config.getChildHostContext(defaultHostContext, "div");
      expect(ctx).toBe(defaultHostContext);
    });
  });

  describe("lifecycle", () => {
    it("prepareForCommit returns null", () => {
      expect(config.prepareForCommit(makeContainer())).toBeNull();
    });

    it("finalizeInitialChildren returns false", () => {
      const container = makeContainer();
      const node = config.createInstance("div", {}, container, defaultHostContext);
      expect(config.finalizeInitialChildren(node, "div", {}, defaultHostContext)).toBe(false);
    });

    it("prepareUpdate returns true when props changed", () => {
      const container = makeContainer();
      const node = config.createInstance("div", {}, container, defaultHostContext);
      expect(
        config.prepareUpdate(node, "div", { title: "old" }, { title: "new" }, defaultHostContext),
      ).toBe(true);
    });

    it("prepareUpdate returns null when props unchanged", () => {
      const container = makeContainer();
      const node = config.createInstance("div", {}, container, defaultHostContext);
      expect(
        config.prepareUpdate(node, "div", { title: "same" }, { title: "same" }, defaultHostContext),
      ).toBeNull();
    });
  });

  describe("clearContainer", () => {
    it("clears root children and canvas", () => {
      const container = makeContainer();
      const child = config.createInstance("div", {}, container, defaultHostContext);
      container.root.children.push(child);
      config.clearContainer(container);
      expect(container.root.children).toEqual([]);
    });
  });

  describe("resetAfterCommit", () => {
    it("calls onCommit callback", () => {
      const container = makeContainer();
      container.onCommit = vi.fn();
      config.resetAfterCommit(container);
      expect(container.onCommit).toHaveBeenCalled();
    });

    it("clears the canvas before repaint", () => {
      const container = makeContainer();
      const clearSpy = vi.spyOn(container.ctx, "clearRect");
      config.resetAfterCommit(container);
      expect(clearSpy).toHaveBeenCalledWith(0, 0, 800, 600);
    });
  });

  describe("timing", () => {
    it("getCurrentTime returns a number", () => {
      expect(typeof config.getCurrentTime()).toBe("number");
    });

    it("scheduleMicrotask calls the function", async () => {
      const fn = vi.fn();
      config.scheduleMicrotask(fn);
      await Promise.resolve();
      expect(fn).toHaveBeenCalled();
    });
  });

  describe("feature flags", () => {
    it("supports mutation", () => {
      expect(config.supportsMutation).toBe(true);
    });

    it("is not primary renderer", () => {
      expect(config.isPrimaryRenderer).toBe(false);
    });
  });
});

describe("layoutTree", () => {
  it("computes layout for a simple node with text child", () => {
    const container = makeContainer();
    const config = createCanvasHostConfig();
    const node = config.createInstance(
      "div",
      { style: { width: 300, padding: 10 } },
      container,
      defaultHostContext,
    );
    const text = config.createTextInstance("Hello world", container, defaultHostContext);
    node.children.push(text);

    const result = layoutTree(node, 0, 0, 300, defaultHostContext);
    expect(result.width).toBe(300);
    expect(result.height).toBeGreaterThan(0);
    expect(node.computedX).toBe(0);
    expect(node.computedY).toBe(0);
    expect(node.computedWidth).toBe(300);
  });

  it("handles empty node", () => {
    const container = makeContainer();
    const config = createCanvasHostConfig();
    const node = config.createInstance(
      "div",
      { style: { width: 200, padding: 16 } },
      container,
      defaultHostContext,
    );

    const result = layoutTree(node, 10, 20, 200, defaultHostContext);
    expect(node.computedX).toBe(10);
    expect(node.computedY).toBe(20);
    expect(result.height).toBe(32); // padding top + padding bottom
  });

  it("uses explicit x/y from style", () => {
    const container = makeContainer();
    const config = createCanvasHostConfig();
    const node = config.createInstance(
      "div",
      { style: { x: 50, y: 100, width: 200 } },
      container,
      defaultHostContext,
    );

    layoutTree(node, 0, 0, 200, defaultHostContext);
    expect(node.computedX).toBe(50);
    expect(node.computedY).toBe(100);
  });

  it("handles nested nodes", () => {
    const container = makeContainer();
    const config = createCanvasHostConfig();
    const parent = config.createInstance(
      "div",
      { style: { width: 400, padding: 20 } },
      container,
      defaultHostContext,
    );
    const child = config.createInstance(
      "div",
      { style: { padding: 10 } },
      container,
      defaultHostContext,
    );
    const text = config.createTextInstance("Nested text content", container, defaultHostContext);
    child.children.push(text);
    parent.children.push(child);

    const result = layoutTree(parent, 0, 0, 400, defaultHostContext);
    expect(result.width).toBe(400);
    expect(result.height).toBeGreaterThan(40); // parent padding + child padding + text
    expect(child.computedX).toBe(20); // parent padding left
  });
});
