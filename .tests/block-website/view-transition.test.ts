import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { triggerViewTransition } from "../../src/core/block-website/core-logic/view-transition";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeButtonRef(rect: Partial<DOMRect> = {}): React.RefObject<HTMLElement> {
  const defaultRect: DOMRect = {
    top: 100,
    left: 200,
    width: 80,
    height: 40,
    right: 280,
    bottom: 140,
    x: 200,
    y: 100,
    toJSON: () => ({}),
  };
  const element = {
    getBoundingClientRect: () => ({ ...defaultRect, ...rect }),
  } as unknown as HTMLElement;

  return { current: element } as React.RefObject<HTMLElement>;
}

// ---------------------------------------------------------------------------
// triggerViewTransition — fallback path (no API)
// ---------------------------------------------------------------------------

describe("triggerViewTransition — fallback (no startViewTransition)", () => {
  it("calls callback immediately when startViewTransition is not available", () => {
    const callback = vi.fn();
    const ref = makeButtonRef();

    // Ensure the API is absent on the document
    const doc = document as Document & { startViewTransition?: unknown };
    const original = doc.startViewTransition;
    delete doc.startViewTransition;

    try {
      triggerViewTransition(ref, callback);
      expect(callback).toHaveBeenCalledOnce();
    } finally {
      if (original !== undefined) doc.startViewTransition = original;
    }
  });

  it("calls callback immediately when buttonRef.current is null", () => {
    const callback = vi.fn();
    const nullRef = { current: null } as React.RefObject<HTMLElement>;

    const doc = document as Document & { startViewTransition?: unknown };
    const original = doc.startViewTransition;
    delete doc.startViewTransition;

    try {
      triggerViewTransition(nullRef, callback);
      expect(callback).toHaveBeenCalledOnce();
    } finally {
      if (original !== undefined) doc.startViewTransition = original;
    }
  });
});

// ---------------------------------------------------------------------------
// triggerViewTransition — View Transition API present
// ---------------------------------------------------------------------------

describe("triggerViewTransition — with startViewTransition", () => {
  let originalStartViewTransition: unknown;
  let readyResolve: () => void;
  let capturedTransitionCallback: (() => void) | null = null;

  beforeEach(() => {
    readyResolve = () => {};
    capturedTransitionCallback = null;

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };
    originalStartViewTransition = doc.startViewTransition;

    doc.startViewTransition = (cb: () => void) => {
      capturedTransitionCallback = cb;
      return {
        ready: new Promise<void>((resolve) => {
          readyResolve = resolve;
        }),
      };
    };

    // Stub window dimensions for predictable geometry
    vi.stubGlobal("innerWidth", 1000);
    vi.stubGlobal("innerHeight", 800);

    // jsdom does not implement Element.prototype.animate — define it on the
    // documentElement instance so the spy has something to wrap.
    if (typeof document.documentElement.animate !== "function") {
      Object.defineProperty(document.documentElement, "animate", {
        configurable: true,
        value: vi.fn().mockReturnValue({ cancel: vi.fn() }),
      });
    } else {
      vi.spyOn(document.documentElement, "animate").mockReturnValue({
        cancel: vi.fn(),
      } as unknown as Animation);
    }
  });

  afterEach(() => {
    const doc = document as Document & { startViewTransition?: unknown };
    doc.startViewTransition = originalStartViewTransition as typeof doc.startViewTransition;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("invokes startViewTransition instead of calling callback directly", () => {
    const callback = vi.fn();
    const ref = makeButtonRef({ top: 100, left: 200, width: 80, height: 40 });

    triggerViewTransition(ref, callback);

    // The callback is not called synchronously — it's deferred through startViewTransition
    expect(capturedTransitionCallback).not.toBeNull();
  });

  it("calls the user callback inside the transition callback", () => {
    const callback = vi.fn();
    const ref = makeButtonRef({ top: 100, left: 200, width: 80, height: 40 });

    triggerViewTransition(ref, callback);

    // Simulate startViewTransition executing its inner callback
    capturedTransitionCallback?.();
    expect(callback).toHaveBeenCalledOnce();
  });

  it("triggers documentElement.animate once the ready promise resolves", async () => {
    const callback = vi.fn();
    const ref = makeButtonRef({ top: 100, left: 200, width: 80, height: 40 });

    triggerViewTransition(ref, callback);

    readyResolve();
    // Flush microtasks
    await Promise.resolve();

    const animateMock = document.documentElement.animate as unknown as ReturnType<typeof vi.fn>;
    expect(animateMock).toHaveBeenCalledOnce();
  });

  it("passes clipPath keyframes to animate", async () => {
    const callback = vi.fn();
    const ref = makeButtonRef({ top: 100, left: 200, width: 80, height: 40 });

    triggerViewTransition(ref, callback);
    readyResolve();
    await Promise.resolve();

    const animateMock = document.documentElement.animate as unknown as ReturnType<typeof vi.fn>;
    const animateArgs = animateMock.mock.calls[0];
    const keyframes = animateArgs?.[0] as { clipPath: string[] } | null;
    expect(keyframes?.clipPath).toHaveLength(2);
    expect(keyframes?.clipPath[0]).toMatch(/^circle\(0px at/);
    expect(keyframes?.clipPath[1]).toMatch(/^circle\(\d+(\.\d+)?px at/);
  });
});
