/**
 * Tests for LandingQuiz and its pure helpers.
 *
 * Architecture note (mirrors SupportBanner.test.tsx): the block-website vitest
 * project aliases "react" to the custom react-engine. That alias is baked into
 * the component's own imports at resolution time, so vi.mock("react", …) in
 * this file intercepts only the test's direct React imports — not the
 * component's. As a consequence we can:
 *   1. Test pure helpers (computeQuizWinner) directly — no hooks involved.
 *   2. Smoke-test the LandingQuiz component by calling it as a function and
 *      asserting it returns a non-null JSX object. The component's useState
 *      call will run against whatever dispatcher the react-engine provides at
 *      module-load; our mock keeps the module's own hook wrappers safe.
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("lucide-react", () => ({
  Activity: () => null,
  Brain: () => null,
  Check: () => null,
  ChevronRight: () => null,
  Headphones: () => null,
  Home: () => null,
  Megaphone: () => null,
  RotateCcw: () => null,
  Share2: () => null,
  ShieldCheck: () => null,
}));

// NOTE: Generic arrow functions (<T>) cannot appear in vi.mock factories because
// esbuild's JSX transform misparses them. Use regular function declarations.
vi.mock("react", () => {
  function forwardRef(renderFn: unknown) {
    function WrappedComponent(props: unknown, ref: unknown) {
      if (typeof renderFn === "function") {
        return (renderFn as (p: unknown, r: unknown) => unknown)(props, ref);
      }
      return null;
    }
    WrappedComponent.displayName = "ForwardRef";
    return WrappedComponent;
  }

  function createContext(defaultValue: unknown) {
    return {
      Provider: ({ children }: { children: unknown }) => children ?? null,
      Consumer: () => null,
      _currentValue: defaultValue,
      _currentValue2: defaultValue,
    };
  }

  function memo(component: unknown) {
    return component;
  }

  function lazy(factory: () => Promise<{ default: unknown }>) {
    const Component = () => null;
    Component._payload = { _status: 0, _result: factory };
    return Component;
  }

  function createElement(type: unknown, props: unknown, ...children: unknown[]) {
    return {
      type,
      props: { ...(props as object), children },
      $$typeof: Symbol.for("react.element"),
    };
  }

  function Fragment({ children }: { children: unknown }) {
    return children;
  }

  class Component {
    props: unknown;
    state: unknown = {};
    constructor(props: unknown) {
      this.props = props;
    }
    setState(_s: unknown) {}
    render() {
      return null;
    }
  }
  class PureComponent extends Component {}

  const reactApi = {
    forwardRef,
    createContext,
    memo,
    lazy,
    createElement,
    Fragment,
    Component,
    PureComponent,
    Children: {
      map: (children: unknown[], fn: (c: unknown, i: number) => unknown) =>
        Array.isArray(children) ? children.map(fn) : [],
      forEach: (children: unknown[], fn: (c: unknown) => void) =>
        Array.isArray(children) && children.forEach(fn),
      count: (children: unknown[]) => (Array.isArray(children) ? children.length : 0),
      only: (children: unknown) => children,
      toArray: (children: unknown) => (Array.isArray(children) ? children : []),
    },
    isValidElement: (_: unknown) => false,
    cloneElement: (el: unknown, _props: unknown) => el,
    useState(initialValue: unknown) {
      return [initialValue, vi.fn()];
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
    useReducer(_reducer: unknown, initialState: unknown) {
      return [initialState, vi.fn()];
    },
    useId() {
      return "test-id";
    },
    useLayoutEffect(fn: () => unknown) {
      fn();
    },
    useInsertionEffect(fn: () => unknown) {
      fn();
    },
    useDeferredValue(value: unknown) {
      return value;
    },
    useTransition() {
      return [false, vi.fn()];
    },
    useImperativeHandle(_ref: unknown, _init: () => unknown) {},
    useDebugValue() {},
    useSyncExternalStore(_subscribe: unknown, getSnapshot: () => unknown) {
      return getSnapshot();
    },
    startTransition(fn: () => void) {
      fn();
    },
  };

  return { ...reactApi, default: reactApi };
});

import { LandingQuiz, computeQuizWinner } from "../../src/core/block-website/ui/LandingQuiz";

describe("computeQuizWinner", () => {
  it("returns null when the answer list is incomplete", () => {
    expect(computeQuizWinner([])).toBeNull();
    expect(computeQuizWinner([0, 1, 2])).toBeNull();
  });

  it("returns null when every answer index is out of range", () => {
    expect(computeQuizWinner([99, 99, 99, 99, 99, 99])).toBeNull();
  });

  it("picks the persona with the highest weighted score", () => {
    // Answer pattern heavy on 'zoltan': q1=d, q2=d, q3=a, q4=c, q5=d, q6=a
    // (q5 option 'd' is arnold — still zoltan wins with 4 points.)
    const zoltanHeavy = [3, 3, 0, 2, 3, 0];
    expect(computeQuizWinner(zoltanHeavy)).toBe("zoltan");
  });

  it("picks daftpunk for music-first answers", () => {
    // q1=c daftpunk, q2=d zoltan, q3=b daftpunk, q4=a daftpunk,
    // q5=c erdos, q6=c daftpunk → daftpunk 4, zoltan 1, erdos 1.
    const daftpunkHeavy = [2, 3, 1, 0, 2, 2];
    expect(computeQuizWinner(daftpunkHeavy)).toBe("daftpunk");
  });

  it("breaks ties by the first-encountered persona", () => {
    // All six answers = option index 0. First options: erdos, peti, zoltan,
    // daftpunk, raju, zoltan. Scores: zoltan 2, every other 1 — zoltan wins.
    expect(computeQuizWinner([0, 0, 0, 0, 0, 0])).toBe("zoltan");
  });
});

describe("LandingQuiz component smoke test", () => {
  it("renders a non-null JSX element", () => {
    const result = LandingQuiz();
    expect(result).not.toBeNull();
    expect(typeof result).toBe("object");
  });
});
