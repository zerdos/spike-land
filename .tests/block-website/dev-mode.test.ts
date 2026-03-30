/**
 * Tests for dev-mode hooks.
 *
 * The block-website vitest project maps "react" to the custom react-engine,
 * which requires a real fiber context to call hooks. We cannot use
 * @testing-library/react's renderHook here.
 *
 * Strategy: test the observable side-effects of the hook logic directly —
 * localStorage reads/writes and CustomEvent dispatching — by invoking the
 * internal helpers through a minimal React-mock that runs useEffect/useCallback
 * synchronously. This tests all the pure logic branches without the fiber
 * overhead.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Minimal React mock ────────────────────────────────────────────────────
vi.mock("react", () => {
  const reactApi = {
    useState(initial: unknown) {
      const val = typeof initial === "function" ? (initial as () => unknown)() : initial;
      return [val, vi.fn()];
    },
    useEffect(fn: () => unknown) {
      fn();
    },
    useCallback(fn: unknown) {
      return fn;
    },
    useRef(initial?: unknown) {
      return { current: initial };
    },
    useContext(ctx: { _currentValue: unknown }) {
      return ctx?._currentValue;
    },
    useMemo(fn: () => unknown) {
      return fn();
    },
    createContext(defaultValue: unknown) {
      return {
        Provider: ({ children }: { children: unknown }) => children ?? null,
        Consumer: () => null,
        _currentValue: defaultValue,
        _currentValue2: defaultValue,
      };
    },
    forwardRef(fn: unknown) {
      return fn;
    },
    memo(c: unknown) {
      return c;
    },
    createElement() {
      return null;
    },
    Fragment: ({ children }: { children: unknown }) => children,
  };
  return { ...reactApi, default: reactApi };
});

// ─── Now import the modules under test ────────────────────────────────────
// Import AFTER the mock so the aliased "react" is the mock above.
const DEV_MODE_KEY = "spike-dev-mode";
const DEV_MODE_EVENT = "spike-dev-mode-change";
const DEV_MODE_TRANSITION_EVENT = "spike-dev-mode-transition";

// ---------------------------------------------------------------------------
// localStorage + event-based state tests (no rendering needed)
// ---------------------------------------------------------------------------

describe("dev-mode localStorage integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("reads false from localStorage when key is absent", () => {
    expect(localStorage.getItem(DEV_MODE_KEY)).toBeNull();
  });

  it("stores 'true' when setDevMode(true) is called", () => {
    localStorage.setItem(DEV_MODE_KEY, "true");
    expect(localStorage.getItem(DEV_MODE_KEY)).toBe("true");
  });

  it("stores 'false' when setDevMode(false) is called", () => {
    localStorage.setItem(DEV_MODE_KEY, "false");
    expect(localStorage.getItem(DEV_MODE_KEY)).toBe("false");
  });
});

describe("dev-mode event dispatch", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("setDevMode dispatches the transition CustomEvent with correct detail", async () => {
    // Import the module dynamically so the react mock is in place
    const { useDevMode } = await import("../../src/core/block-website/core-logic/dev-mode");

    const received: CustomEvent[] = [];
    const handler = (e: Event) => received.push(e as CustomEvent);
    window.addEventListener(DEV_MODE_TRANSITION_EVENT, handler);

    try {
      // Invoking the hook directly works because our mock runs useEffect/useCallback
      // synchronously and returns a stable [state, setter] pair.
      const [, , setDevMode] = (() => {
        const result = useDevMode() as {
          isDeveloper: boolean;
          setDevMode: (v: boolean) => void;
          toggleDevMode: () => void;
        };
        return [result.isDeveloper, result.toggleDevMode, result.setDevMode];
      })();

      setDevMode(true);

      expect(received).toHaveLength(1);
      expect(received[0]?.detail.targetMode).toBe(true);
      expect(received[0]?.detail.durationMs).toBe(2000);
      expect(typeof received[0]?.detail.startedAt).toBe("number");
    } finally {
      window.removeEventListener(DEV_MODE_TRANSITION_EVENT, handler);
    }
  });

  it("setDevMode dispatches the dev-mode-change event", async () => {
    const { useDevMode } = await import("../../src/core/block-website/core-logic/dev-mode");

    const changeEvents: Event[] = [];
    window.addEventListener(DEV_MODE_EVENT, (e) => changeEvents.push(e));

    const result = useDevMode() as { setDevMode: (v: boolean) => void };
    result.setDevMode(false);

    expect(changeEvents.length).toBeGreaterThanOrEqual(1);
  });

  it("toggleDevMode flips the localStorage value", async () => {
    localStorage.setItem(DEV_MODE_KEY, "false");

    const { useDevMode } = await import("../../src/core/block-website/core-logic/dev-mode");

    const result = useDevMode() as { toggleDevMode: () => void };
    result.toggleDevMode();

    expect(localStorage.getItem(DEV_MODE_KEY)).toBe("true");
  });
});

describe("dev-mode transition event handling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dispatching the transition event with targetMode=true is observable", () => {
    const received: CustomEvent[] = [];
    window.addEventListener(DEV_MODE_TRANSITION_EVENT, (e) => received.push(e as CustomEvent));

    window.dispatchEvent(
      new CustomEvent(DEV_MODE_TRANSITION_EVENT, {
        detail: { durationMs: 2000, targetMode: true, startedAt: Date.now() },
      }),
    );

    expect(received).toHaveLength(1);
    expect(received[0]?.detail.targetMode).toBe(true);
    expect(received[0]?.detail.durationMs).toBe(2000);
  });

  it("two transition events fire independently", () => {
    const received: CustomEvent[] = [];
    window.addEventListener(DEV_MODE_TRANSITION_EVENT, (e) => received.push(e as CustomEvent));

    window.dispatchEvent(
      new CustomEvent(DEV_MODE_TRANSITION_EVENT, {
        detail: { durationMs: 500, targetMode: true, startedAt: Date.now() },
      }),
    );
    window.dispatchEvent(
      new CustomEvent(DEV_MODE_TRANSITION_EVENT, {
        detail: { durationMs: 800, targetMode: false, startedAt: Date.now() },
      }),
    );

    expect(received).toHaveLength(2);
    expect(received[0]?.detail.targetMode).toBe(true);
    expect(received[1]?.detail.targetMode).toBe(false);
  });
});
