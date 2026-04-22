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
  Atom: () => null,
  Brain: () => null,
  Check: () => null,
  ChevronRight: () => null,
  Compass: () => null,
  Crown: () => null,
  Eye: () => null,
  Feather: () => null,
  Flame: () => null,
  Gift: () => null,
  GraduationCap: () => null,
  Home: () => null,
  Languages: () => null,
  Leaf: () => null,
  Lightbulb: () => null,
  Megaphone: () => null,
  MessageCircle: () => null,
  Rocket: () => null,
  RotateCcw: () => null,
  Scale: () => null,
  ScrollText: () => null,
  Share2: () => null,
  ShieldCheck: () => null,
  Sparkles: () => null,
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

  it("picks arendt when two answers point at her (Q2.4 + Q5.3)", () => {
    // q1=c peti, q2=d arendt, q3=b kant, q4=a zoltan, q5=c arendt, q6=c erdos
    // arendt: 2, everyone else: 1. Winner: arendt.
    const arendtHeavy = [2, 3, 1, 0, 2, 2];
    expect(computeQuizWinner(arendtHeavy)).toBe("arendt");
  });

  it("picks erdos when first-option / last-option cadence points at the framework builder", () => {
    // All first options except Q6: [0,0,0,0,0,2]
    // Q1.0 erdos, Q2.0 spinoza, Q3.0 wittgenstein, Q4.0 zoltan,
    // Q5.0 plato, Q6.2 erdos → erdos has 2, others 1. Winner: erdos.
    expect(computeQuizWinner([0, 0, 0, 0, 0, 2])).toBe("erdos");
  });

  it("picks confucius for slow-and-steady answers (Q4.1 + Q6.0)", () => {
    // Q1.1 socrates, Q2.1 camus, Q3.1 kant, Q4.1 confucius,
    // Q5.0 plato, Q6.0 confucius → confucius has 2, others 1.
    expect(computeQuizWinner([1, 1, 1, 1, 0, 0])).toBe("confucius");
  });

  it("breaks ties by the first-encountered persona across six distinct winners", () => {
    // Six unique personas, one point each. Tie → first encountered wins.
    // Q1.0 erdos is the first persona seen → erdos.
    expect(computeQuizWinner([0, 0, 0, 0, 0, 0])).toBe("erdos");
  });
});

describe("LandingQuiz component smoke test", () => {
  it("renders a non-null JSX element", () => {
    const result = LandingQuiz();
    expect(result).not.toBeNull();
    expect(typeof result).toBe("object");
  });
});
