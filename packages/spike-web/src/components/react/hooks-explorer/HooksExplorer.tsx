import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useContext,
  useReducer,
  createContext,
  memo,
  type ReactNode,
  type CSSProperties,
  type Dispatch,
} from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

type SectionId =
  | "useState"
  | "useEffect"
  | "useRef"
  | "useMemo"
  | "useCallback"
  | "useContext"
  | "useReducer"
  | "edge";

interface NavItem {
  id: SectionId;
  label: string;
  hook: string;
  icon: string;
  color: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { id: "useState", label: "The Whiteboard", hook: "useState", icon: "📋", color: "#3b82f6" },
  { id: "useEffect", label: "The Motion Sensor", hook: "useEffect", icon: "💡", color: "#3b82f6" },
  { id: "useRef", label: "The Sticky Note", hook: "useRef", icon: "📌", color: "#3b82f6" },
  { id: "useMemo", label: "The Recipe Card", hook: "useMemo", icon: "🧾", color: "#3b82f6" },
  { id: "useCallback", label: "The Phone Number", hook: "useCallback", icon: "📞", color: "#3b82f6" },
  { id: "useContext", label: "The Office Radio", hook: "useContext", icon: "📻", color: "#3b82f6" },
  { id: "useReducer", label: "The Vending Machine", hook: "useReducer", icon: "🎰", color: "#3b82f6" },
  { id: "edge", label: "Edge as MCP Server", hook: "Edge Workers", icon: "⚡", color: "#10b981" },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = {
  shell: {
    display: "flex",
    flexDirection: "column" as const,
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#e5e5e5",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    borderBottom: "1px solid #1f2937",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#0d0d0d",
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
  },
  headerLogo: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#e5e5e5",
    letterSpacing: "-0.5px",
  },
  headerSlash: { color: "#4b5563", margin: "0 4px" },
  headerTitle: { fontSize: "16px", color: "#9ca3af" },
  body: { display: "flex", flex: 1 },
  sidebar: {
    width: "260px",
    minWidth: "260px",
    borderRight: "1px solid #1f2937",
    background: "#0d0d0d",
    padding: "16px 0",
    position: "sticky" as const,
    top: "57px",
    height: "calc(100vh - 57px)",
    overflowY: "auto" as const,
  },
  sidebarSection: {
    padding: "0 12px",
    marginBottom: "8px",
  },
  sidebarLabel: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    padding: "8px 12px 4px",
  },
  navBtn: (active: boolean, color: string): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    background: active ? `${color}18` : "transparent",
    color: active ? color : "#9ca3af",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: active ? 600 : 400,
    textAlign: "left" as const,
    transition: "all 0.15s",
    borderLeft: active ? `2px solid ${color}` : "2px solid transparent",
  }),
  navIcon: { fontSize: "14px", width: "18px", textAlign: "center" as const },
  navHook: { fontFamily: "monospace", fontSize: "11px", color: "#4b5563", marginLeft: "auto" },
  main: { flex: 1, padding: "40px", maxWidth: "900px" },
  sectionTitle: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#f9fafb",
    marginBottom: "8px",
    letterSpacing: "-0.5px",
  },
  hookBadge: (color: string): CSSProperties => ({
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "20px",
    background: `${color}20`,
    color: color,
    fontSize: "12px",
    fontFamily: "monospace",
    fontWeight: 600,
    marginBottom: "24px",
    border: `1px solid ${color}40`,
  }),
  analogyCard: (color: string): CSSProperties => ({
    background: `${color}0a`,
    border: `1px solid ${color}25`,
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
  }),
  analogyTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: "8px",
  },
  analogyText: { fontSize: "14px", color: "#d1d5db", lineHeight: 1.7 },
  demoCard: {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
  },
  demoTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: "16px",
  },
  codeBlock: {
    background: "#0a0a0a",
    border: "1px solid #1f2937",
    borderRadius: "8px",
    padding: "16px",
    fontFamily: '"Fira Code", "Cascadia Code", monospace',
    fontSize: "13px",
    lineHeight: 1.6,
    overflowX: "auto" as const,
    marginBottom: "24px",
  },
  edgeCard: (color: string): CSSProperties => ({
    background: `${color}0a`,
    border: `1px solid ${color}25`,
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "40px",
  }),
  btn: (variant: "primary" | "secondary" | "danger" = "primary"): CSSProperties => ({
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    transition: "all 0.15s",
    background:
      variant === "primary" ? "#3b82f6" : variant === "danger" ? "#ef4444" : "#1f2937",
    color: variant === "secondary" ? "#9ca3af" : "#fff",
  }),
  row: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap" as const,
  },
  counter: {
    fontSize: "48px",
    fontWeight: 700,
    color: "#3b82f6",
    fontVariantNumeric: "tabular-nums",
    minWidth: "80px",
    textAlign: "center" as const,
  },
  pill: (color: string): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "20px",
    background: `${color}20`,
    color: color,
    fontSize: "12px",
    fontWeight: 600,
    border: `1px solid ${color}40`,
  }),
  divider: {
    border: "none",
    borderTop: "1px solid #1f2937",
    margin: "24px 0",
  },
  mobileMenuBtn: {
    display: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #1f2937",
    background: "transparent",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: "18px",
  },
};

// ─── Syntax-highlighting helpers ─────────────────────────────────────────────

type Token = { text: string; color: string };

function tokenize(code: string): Token[] {
  const keywords = /\b(const|let|function|return|if|else|true|false|null|undefined|export|default|import|from|type|interface|async|await|switch|case|break|of|new)\b/g;
  const hooks = /\b(useState|useEffect|useRef|useMemo|useCallback|useContext|useReducer|createContext|memo|dispatch)\b/g;
  const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
  const comments = /(\/\/[^\n]*)/g;
  const numbers = /\b(\d+)\b/g;
  const jsx = /(<\/?[A-Z][A-Za-z]*(?:\s[^>]*)?\s*\/?>)/g;

  // Build a list of [start, end, color] ranges
  type Range = { start: number; end: number; color: string };
  const ranges: Range[] = [];

  const addRanges = (re: RegExp, color: string) => {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(code)) !== null) {
      ranges.push({ start: m.index, end: m.index + m[0].length, color });
    }
  };

  addRanges(comments, "#6b7280");
  addRanges(strings, "#86efac");
  addRanges(hooks, "#93c5fd");
  addRanges(keywords, "#c084fc");
  addRanges(numbers, "#fbbf24");
  addRanges(jsx, "#67e8f9");

  // Sort and de-overlap (first wins)
  ranges.sort((a, b) => a.start - b.start);

  const tokens: Token[] = [];
  let pos = 0;

  for (const r of ranges) {
    if (r.start < pos) continue; // overlapped — skip
    if (r.start > pos) {
      tokens.push({ text: code.slice(pos, r.start), color: "#e5e5e5" });
    }
    tokens.push({ text: code.slice(r.start, r.end), color: r.color });
    pos = r.end;
  }

  if (pos < code.length) {
    tokens.push({ text: code.slice(pos), color: "#e5e5e5" });
  }

  return tokens;
}

function Code({ children }: { children: string }) {
  const tokens = useMemo(() => tokenize(children), [children]);
  return (
    <pre style={s.codeBlock}>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: t.color }}>
          {t.text}
        </span>
      ))}
    </pre>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function AnalogyCard({ color, icon, text }: { color: string; icon: string; text: string }) {
  return (
    <div style={s.analogyCard(color)}>
      <div style={s.analogyTitle}>Real-life analogy</div>
      <div style={{ ...s.analogyText, display: "flex", gap: "10px" }}>
        <span style={{ fontSize: "20px", flexShrink: 0 }}>{icon}</span>
        <span>{text}</span>
      </div>
    </div>
  );
}

function EdgeCard({ color, text }: { color: string; text: string }) {
  return (
    <div style={s.edgeCard(color)}>
      <div style={{ ...s.analogyTitle, color }}>Edge / MCP analogy</div>
      <div style={{ ...s.analogyText, display: "flex", gap: "10px" }}>
        <span style={{ fontSize: "20px", flexShrink: 0 }}>⚡</span>
        <span>{text}</span>
      </div>
    </div>
  );
}

// ─── Section 1: useState ─────────────────────────────────────────────────────

function UseStateDemo() {
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState<number[]>([0]);

  const increment = () => {
    setCount((c) => {
      const next = c + 1;
      setHistory((h) => [...h.slice(-6), next]);
      return next;
    });
  };

  const decrement = () => {
    setCount((c) => {
      const next = c - 1;
      setHistory((h) => [...h.slice(-6), next]);
      return next;
    });
  };

  const reset = () => {
    setCount(0);
    setHistory([0]);
  };

  return (
    <div>
      <div style={s.demoTitle}>Interactive Demo</div>
      <div style={{ ...s.row, justifyContent: "center", marginBottom: "20px" }}>
        <button style={s.btn("secondary")} onClick={decrement}>− Decrease</button>
        <div style={s.counter}>{count}</div>
        <button style={s.btn("primary")} onClick={increment}>+ Increase</button>
      </div>
      <div style={{ ...s.row, justifyContent: "center", marginBottom: "16px" }}>
        <button style={s.btn("secondary")} onClick={reset}>Reset</button>
      </div>

      {/* Whiteboard visualization */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px", fontWeight: 600 }}>
          WHITEBOARD STATE HISTORY
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {history.map((v, i) => (
            <div
              key={i}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 700,
                background: i === history.length - 1 ? "#3b82f620" : "#ffffff08",
                color: i === history.length - 1 ? "#3b82f6" : "#6b7280",
                border: i === history.length - 1 ? "1px solid #3b82f640" : "1px solid #1f2937",
                transition: "all 0.3s",
              }}
            >
              {v}
            </div>
          ))}
          <div style={{ fontSize: "12px", color: "#6b7280" }}>← current</div>
        </div>
      </div>

      <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.6 }}>
        Each call to <span style={{ color: "#93c5fd", fontFamily: "monospace" }}>setCount</span>{" "}
        erases the old value and writes a new one — exactly like erasing a whiteboard.
        React re-renders the component so the UI reflects the new state.
      </div>
    </div>
  );
}

const USE_STATE_CODE = `const [count, setCount] = useState(0);

// Reading state — anyone can see the whiteboard
console.log(count); // 0

// Writing new state — erase & rewrite
setCount(count + 1); // 1

// Functional update — safe when new value depends on old
setCount(prev => prev + 1); // always correct`;

// ─── Section 2: useEffect ────────────────────────────────────────────────────

function TimerWidget() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);

    // Cleanup — "motion sensor turns off"
    return () => clearInterval(id);
  }, [running]); // dependency: only re-subscribe when `running` changes

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          background: "#0a0a0a",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
          border: `1px solid ${running ? "#3b82f640" : "#1f2937"}`,
          transition: "border-color 0.3s",
        }}
      >
        <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px", fontWeight: 600 }}>
          {running ? "⚡ EFFECT ACTIVE — timer running" : "⏸ EFFECT CLEANED UP — timer paused"}
        </div>
        <div style={{ fontSize: "48px", fontWeight: 700, color: running ? "#3b82f6" : "#4b5563", fontVariantNumeric: "tabular-nums" }}>
          {elapsed}s
        </div>
      </div>

      <div style={s.row}>
        <button
          style={s.btn(running ? "danger" : "primary")}
          onClick={() => setRunning((r) => !r)}
        >
          {running ? "⏸ Pause (cleanup runs)" : "▶ Resume (effect re-runs)"}
        </button>
        <button style={s.btn("secondary")} onClick={() => { setElapsed(0); }}>
          Reset counter
        </button>
      </div>

      <div
        style={{
          background: "#111827",
          borderRadius: "8px",
          padding: "12px 16px",
          fontSize: "12px",
          color: "#6b7280",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "#9ca3af" }}>Dependency array: </strong>
        <span style={{ fontFamily: "monospace", color: "#86efac" }}>[running]</span>
        <br />
        Effect fires when <code style={{ color: "#93c5fd" }}>running</code> changes.
        Cleanup fires before re-running OR when component unmounts.
      </div>
    </div>
  );
}

function UseEffectDemo() {
  const [mounted, setMounted] = useState(true);

  return (
    <div>
      <div style={s.demoTitle}>Interactive Demo</div>
      <div style={{ marginBottom: "16px" }}>
        <button
          style={s.btn(mounted ? "danger" : "primary")}
          onClick={() => setMounted((m) => !m)}
        >
          {mounted ? "Unmount component (all effects cleaned up)" : "Mount component (effects run)"}
        </button>
      </div>
      {mounted ? (
        <TimerWidget />
      ) : (
        <div
          style={{
            background: "#111827",
            border: "1px dashed #374151",
            borderRadius: "8px",
            padding: "32px",
            textAlign: "center",
            color: "#4b5563",
            fontSize: "14px",
          }}
        >
          Component unmounted. All effects cleaned up (intervals cleared).
          <br />
          <span style={{ fontSize: "12px" }}>Click "Mount" to restore.</span>
        </div>
      )}
    </div>
  );
}

const USE_EFFECT_CODE = `useEffect(() => {
  // Effect body — runs after render when deps change
  // Like the motion sensor triggering the light
  const id = setInterval(() => {
    setElapsed(e => e + 1);
  }, 1000);

  // Cleanup — like the light turning off when you leave
  return () => clearInterval(id);

}, [running]); // Dependency array — "what to watch"
// []          → run once on mount, cleanup on unmount
// [dep]       → re-run whenever dep changes
// no array    → run after every render (rare)`;

// ─── Section 3: useRef ───────────────────────────────────────────────────────

function UseRefDemo() {
  const [stateRenders, setStateRenders] = useState(0);
  const [stateTyped, setStateTyped] = useState(0);

  const refRenders = useRef(0);
  const refTyped = useRef(0);

  // Count renders via ref — doesn't cause re-renders itself
  refRenders.current += 1;

  const handleRefInput = () => {
    refTyped.current += 1;
    // No setState call — no re-render triggered
  };

  const handleStateInput = () => {
    setStateTyped((n) => n + 1);
    setStateRenders((n) => n + 1);
  };

  const forceReadRef = () => {
    // Force a render to show ref values
    setStateRenders((n) => n + 1);
  };

  return (
    <div>
      <div style={s.demoTitle}>Interactive Demo — Ref vs State re-renders</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* Ref side */}
        <div
          style={{
            background: "#0a0a0a",
            border: "1px solid #1f2937",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px", fontWeight: 600 }}>
            📌 useRef (sticky note)
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
            Tracks keystrokes privately. No re-renders.
          </div>
          <input
            placeholder="Type here..."
            onInput={handleRefInput}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #374151",
              background: "#1f2937",
              color: "#e5e5e5",
              fontSize: "13px",
              marginBottom: "12px",
            }}
          />
          <div style={{ fontSize: "13px", color: "#9ca3af" }}>
            Keystrokes tracked: <strong style={{ color: "#fbbf24" }}>{refTyped.current}</strong>
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            ⚠ Value won't update until something else causes a render
          </div>
        </div>

        {/* State side */}
        <div
          style={{
            background: "#0a0a0a",
            border: "1px solid #3b82f640",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <div style={{ fontSize: "11px", color: "#3b82f6", marginBottom: "8px", fontWeight: 600 }}>
            📋 useState (whiteboard)
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
            Tracks keystrokes and re-renders each time.
          </div>
          <input
            placeholder="Type here..."
            onInput={handleStateInput}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #374151",
              background: "#1f2937",
              color: "#e5e5e5",
              fontSize: "13px",
              marginBottom: "12px",
            }}
          />
          <div style={{ fontSize: "13px", color: "#9ca3af" }}>
            Keystrokes tracked: <strong style={{ color: "#3b82f6" }}>{stateTyped}</strong>
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            ✓ Always live — every keystroke = re-render
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#111827",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ fontSize: "13px", color: "#9ca3af" }}>
          Component has rendered:{" "}
          <strong style={{ color: "#f9fafb" }}>{refRenders.current}</strong> times
          <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "8px" }}>
            (ref box shows {refTyped.current} keystrokes at last render)
          </span>
        </div>
        <button style={s.btn("secondary")} onClick={forceReadRef}>
          Force render to read ref
        </button>
      </div>
    </div>
  );
}

const USE_REF_CODE = `const renderCount = useRef(0);
const inputValue = useRef('');

// Reading a ref — no re-render
console.log(renderCount.current); // always current

// Writing a ref — no re-render triggered
renderCount.current += 1;  // silent, like a sticky note
inputValue.current = e.target.value;

// Common uses:
// - Storing DOM references
// - Tracking previous values
// - Holding mutable values that don't affect UI`;

// ─── Section 4: useMemo ──────────────────────────────────────────────────────

function fib(n: number): number {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

function UseMemoDemo() {
  const [n, setN] = useState(30);
  const [tick, setTick] = useState(0);
  const [useMemoEnabled, setUseMemoEnabled] = useState(true);
  const [lastComputeTime, setLastComputeTime] = useState(0);
  const [cacheHit, setCacheHit] = useState(false);
  const prevNRef = useRef(-1);

  // Without memo — recomputes on every render
  const computedWithoutMemo = (() => {
    const t0 = performance.now();
    const result = fib(n);
    const duration = performance.now() - t0;
    return { result, duration };
  })();

  // With memo — only recomputes when n changes
  const computedWithMemo = useMemo(() => {
    const isHit = prevNRef.current === n;
    prevNRef.current = n;
    const t0 = performance.now();
    const result = fib(n);
    const duration = performance.now() - t0;
    setCacheHit(isHit);
    setLastComputeTime(duration);
    return { result, duration };
  }, [n]);

  const displayed = useMemoEnabled ? computedWithMemo : computedWithoutMemo;

  return (
    <div>
      <div style={s.demoTitle}>Interactive Demo — Fibonacci Calculator</div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px", fontWeight: 600 }}>
            INPUT (n)
          </div>
          <input
            type="range"
            min={1}
            max={40}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            style={{ width: "160px", accentColor: "#3b82f6" }}
          />
          <span style={{ marginLeft: "8px", fontFamily: "monospace", color: "#fbbf24", fontSize: "18px" }}>
            {n}
          </span>
        </div>
        <div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "13px",
              color: "#9ca3af",
            }}
          >
            <input
              type="checkbox"
              checked={useMemoEnabled}
              onChange={(e) => setUseMemoEnabled(e.target.checked)}
              style={{ accentColor: "#3b82f6", width: "14px", height: "14px" }}
            />
            useMemo enabled
          </label>
        </div>
        <button style={s.btn("secondary")} onClick={() => setTick((t) => t + 1)}>
          Force re-render (tick: {tick})
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            background: "#0a0a0a",
            borderRadius: "8px",
            padding: "16px",
            border: "1px solid #1f2937",
          }}
        >
          <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "12px", fontWeight: 600 }}>
            RESULT
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#f9fafb", marginBottom: "8px", wordBreak: "break-all" }}>
            {displayed.result.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>
            fib({n})
          </div>
        </div>

        <div
          style={{
            background: "#0a0a0a",
            borderRadius: "8px",
            padding: "16px",
            border: `1px solid ${useMemoEnabled && cacheHit ? "#10b98140" : "#f59e0b40"}`,
          }}
        >
          <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "12px", fontWeight: 600 }}>
            COMPUTATION STATUS
          </div>
          {useMemoEnabled ? (
            cacheHit ? (
              <>
                <div style={{ ...s.pill("#10b981"), marginBottom: "8px" }}>
                  <span>✓</span> Cache hit — napkin reused!
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  n didn&apos;t change → memo returned cached value instantly.
                  Re-render (tick) didn&apos;t recompute.
                </div>
              </>
            ) : (
              <>
                <div style={{ ...s.pill("#f59e0b"), marginBottom: "8px" }}>
                  <span>⟳</span> Computed in {lastComputeTime.toFixed(2)}ms
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  n changed → memo recomputed and cached the new value.
                </div>
              </>
            )
          ) : (
            <>
              <div style={{ ...s.pill("#ef4444"), marginBottom: "8px" }}>
                <span>⟳</span> Recomputed every render ({computedWithoutMemo.duration.toFixed(2)}ms)
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                No memo → recalculated even when n didn&apos;t change.
                Hit "Force re-render" to see the waste.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const USE_MEMO_CODE = `// Without useMemo — recalculates on EVERY render
const result = fib(n); // slow if n is large

// With useMemo — recalculates ONLY when n changes
const result = useMemo(() => fib(n), [n]);
// ↑ The "napkin" — only recalculate if the bill (n) changes

// Common pattern: expensive filtering/sorting
const filtered = useMemo(
  () => items.filter(i => i.category === activeTab),
  [items, activeTab]
);`;

// ─── Section 5: useCallback ──────────────────────────────────────────────────

let childRenderCount = 0;

const ExpensiveChild = memo(function ExpensiveChild({
  onAction,
  label,
}: {
  onAction: () => void;
  label: string;
}) {
  childRenderCount += 1;
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setFlash(true);
    const id = setTimeout(() => setFlash(false), 600);
    return () => clearTimeout(id);
  }, [onAction]); // flash when onAction reference changes

  return (
    <div
      style={{
        background: flash ? "#3b82f620" : "#0a0a0a",
        border: `1px solid ${flash ? "#3b82f6" : "#1f2937"}`,
        borderRadius: "8px",
        padding: "12px 16px",
        transition: "all 0.3s",
        fontSize: "13px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#9ca3af" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {flash && (
            <span style={{ ...s.pill("#3b82f6"), fontSize: "11px" }}>re-rendered!</span>
          )}
          <button style={{ ...s.btn("primary"), padding: "4px 10px", fontSize: "12px" }} onClick={onAction}>
            Call handler
          </button>
        </div>
      </div>
    </div>
  );
});

function UseCallbackDemo() {
  const [parentTick, setParentTick] = useState(0);
  const [actionCount, setActionCount] = useState(0);
  const [memoEnabled, setMemoEnabled] = useState(true);

  // Stable reference with useCallback
  const stableHandler = useCallback(() => {
    setActionCount((n) => n + 1);
  }, []); // no deps — same function forever

  // New reference every render (unstable)
  const unstableHandler = () => {
    setActionCount((n) => n + 1);
  };

  const handler = memoEnabled ? stableHandler : unstableHandler;

  return (
    <div>
      <div style={s.demoTitle}>Interactive Demo — Stable vs unstable handler references</div>

      <div style={{ ...s.row, marginBottom: "16px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontSize: "13px",
            color: "#9ca3af",
          }}
        >
          <input
            type="checkbox"
            checked={memoEnabled}
            onChange={(e) => setMemoEnabled(e.target.checked)}
            style={{ accentColor: "#3b82f6", width: "14px", height: "14px" }}
          />
          useCallback enabled
        </label>
        <button style={s.btn("secondary")} onClick={() => setParentTick((t) => t + 1)}>
          Re-render parent (tick: {parentTick})
        </button>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <ExpensiveChild
          onAction={handler}
          label={
            memoEnabled
              ? "Child with useCallback — stable phone number"
              : "Child without useCallback — new card every render"
          }
        />
      </div>

      <div
        style={{
          background: "#111827",
          borderRadius: "8px",
          padding: "12px 16px",
          fontSize: "12px",
          color: "#6b7280",
          lineHeight: 1.6,
        }}
      >
        {memoEnabled ? (
          <>
            <span style={{ color: "#10b981" }}>✓ useCallback active.</span> Handler reference is
            stable. Re-rendering parent does NOT re-render the child (it sees the same "phone
            number"). The blue flash only appears when the handler actually changes.
          </>
        ) : (
          <>
            <span style={{ color: "#ef4444" }}>✗ No useCallback.</span> Every parent render
            creates a new function reference. Even though the logic is identical, the child sees a
            "new contact card" and re-renders unnecessarily. Hit "Re-render parent" to see it flash.
          </>
        )}
        <br />
        <br />
        Action calls handled: <strong style={{ color: "#f9fafb" }}>{actionCount}</strong>
      </div>
    </div>
  );
}

const USE_CALLBACK_CODE = `// Without useCallback — new function every render
const handleClick = () => doSomething(id);
// Child with React.memo still re-renders: sees a "new" function

// With useCallback — same function reference across renders
const handleClick = useCallback(
  () => doSomething(id),
  [id] // only recreate when id changes
);
// Child with React.memo skips re-render: same "phone number"

// Pair with React.memo on the child
const Child = memo(function Child({ onClick }) {
  return <button onClick={onClick}>Action</button>;
});`;

// ─── Section 6: useContext ───────────────────────────────────────────────────

type Theme = "dark" | "light";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

function DeepComponent({ depth, name }: { depth: number; name: string }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  return (
    <div
      style={{
        background: isDark ? "#0a0a0a" : "#f8fafc",
        border: `1px solid ${isDark ? "#1f2937" : "#e2e8f0"}`,
        borderRadius: "8px",
        padding: "12px",
        marginLeft: depth > 0 ? "16px" : "0",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: isDark ? "#9ca3af" : "#64748b",
          marginBottom: "6px",
        }}
      >
        {name}
        <span
          style={{
            marginLeft: "8px",
            padding: "2px 6px",
            borderRadius: "4px",
            background: isDark ? "#1f2937" : "#e2e8f0",
            fontFamily: "monospace",
            fontSize: "10px",
          }}
        >
          theme: &quot;{theme}&quot;
        </span>
      </div>
      <div style={{ fontSize: "11px", color: isDark ? "#4b5563" : "#94a3b8" }}>
        useContext(ThemeContext) — no prop drilling needed
      </div>
    </div>
  );
}

function UseContextDemo() {
  const [tick, setTick] = useState(0);

  return (
    <div>
      <div style={s.demoTitle}>Interactive Demo — Theme context across nested components</div>
      <ThemeProvider>
        <ContextInner tick={tick} onTick={() => setTick((t) => t + 1)} />
      </ThemeProvider>
    </div>
  );
}

// Separate to use the context inside ThemeProvider
function ContextInner({ tick, onTick }: { tick: number; onTick: () => void }) {
  const { theme, toggle } = useContext(ThemeContext);

  return (
    <div>
      <div style={{ ...s.row, marginBottom: "16px" }}>
        <button style={s.btn("primary")} onClick={toggle}>
          Toggle theme (currently: {theme})
        </button>
        <button style={s.btn("secondary")} onClick={onTick}>
          Irrelevant re-render (tick: {tick})
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <DeepComponent depth={0} name="Layout (Level 1)" />
        <div style={{ paddingLeft: "16px" }}>
          <DeepComponent depth={1} name="Sidebar (Level 2)" />
          <div style={{ paddingLeft: "16px", marginTop: "8px" }}>
            <DeepComponent depth={2} name="MenuItem (Level 3)" />
            <div style={{ paddingLeft: "16px", marginTop: "8px" }}>
              <DeepComponent depth={3} name="Icon (Level 4)" />
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: "12px",
          fontSize: "12px",
          color: "#6b7280",
          lineHeight: 1.6,
        }}
      >
        No props passed between levels — all components tune into the same context "radio station."
        Change the theme and every component updates simultaneously.
      </div>
    </div>
  );
}

const USE_CONTEXT_CODE = `// 1. Create the context (the radio station)
const ThemeContext = createContext({ theme: 'dark', toggle: () => {} });

// 2. Provide it high in the tree (the transmitter)
function App() {
  const [theme, setTheme] = useState('dark');
  const toggle = useCallback(() =>
    setTheme(t => t === 'dark' ? 'light' : 'dark'), []);
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <Layout />
    </ThemeContext.Provider>
  );
}

// 3. Consume anywhere — no prop drilling (tune in from anywhere)
function DeepMenuItem() {
  const { theme } = useContext(ThemeContext);
  return <div data-theme={theme}>...</div>;
}`;

// ─── Section 7: useReducer ───────────────────────────────────────────────────

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface CartState {
  items: CartItem[];
  discount: number;
  couponApplied: string | null;
}

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "INCREMENT"; id: string }
  | { type: "DECREMENT"; id: string }
  | { type: "APPLY_COUPON"; code: string }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, qty: 1 }] };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "INCREMENT":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, qty: i.qty + 1 } : i
        ),
      };
    case "DECREMENT":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, qty: Math.max(0, i.qty - 1) } : i
        ).filter((i) => i.qty > 0),
      };
    case "APPLY_COUPON": {
      const codes: Record<string, number> = { SPIKE10: 10, HOOKS20: 20, EDGE50: 50 };
      const discount = codes[action.code.toUpperCase()] ?? 0;
      return { ...state, discount, couponApplied: discount > 0 ? action.code.toUpperCase() : null };
    }
    case "CLEAR":
      return { items: [], discount: 0, couponApplied: null };
    default:
      return state;
  }
}

const CATALOG: CartItem[] = [
  { id: "a", name: "React Hooks Course", price: 49, qty: 0 },
  { id: "b", name: "Edge Workers Guide", price: 29, qty: 0 },
  { id: "c", name: "TypeScript Mastery", price: 39, qty: 0 },
];

function DispatchBadge({ action }: { action: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const id = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(id);
  }, [action]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        background: "#1f2937",
        border: "1px solid #374151",
        borderRadius: "8px",
        padding: "8px 14px",
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#86efac",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "all 0.3s",
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      dispatch({action})
    </div>
  );
}

function UseReducerDemo() {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    discount: 0,
    couponApplied: null,
  });
  const [couponInput, setCouponInput] = useState("");
  const [lastAction, setLastAction] = useState("");

  const typedDispatch = (action: CartAction) => {
    dispatch(action);
    setLastAction(JSON.stringify(action));
  };

  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountAmt = (subtotal * state.discount) / 100;
  const total = subtotal - discountAmt;

  return (
    <div>
      <div style={s.demoTitle}>Interactive Demo — Shopping cart with useReducer</div>
      <DispatchBadge action={lastAction} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Catalog */}
        <div>
          <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "10px", fontWeight: 600 }}>
            CATALOG (press a button to dispatch)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {CATALOG.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#0a0a0a",
                  border: "1px solid #1f2937",
                  borderRadius: "8px",
                  padding: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "13px", color: "#e5e5e5" }}>{item.name}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>${item.price}</div>
                </div>
                <button
                  style={{ ...s.btn("primary"), padding: "4px 10px", fontSize: "12px" }}
                  onClick={() => typedDispatch({ type: "ADD_ITEM", item })}
                >
                  + Add
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px", fontWeight: 600 }}>
              COUPON (try: SPIKE10, HOOKS20, EDGE50)
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="SPIKE10"
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #374151",
                  background: "#1f2937",
                  color: "#e5e5e5",
                  fontSize: "13px",
                  fontFamily: "monospace",
                }}
              />
              <button
                style={{ ...s.btn("primary"), padding: "6px 12px" }}
                onClick={() => {
                  typedDispatch({ type: "APPLY_COUPON", code: couponInput });
                  setCouponInput("");
                }}
              >
                Apply
              </button>
            </div>
            {state.couponApplied && (
              <div style={{ fontSize: "12px", color: "#10b981", marginTop: "6px" }}>
                ✓ {state.couponApplied} applied — {state.discount}% off
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div>
          <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "10px", fontWeight: 600 }}>
            CART STATE
          </div>
          <div
            style={{
              background: "#0a0a0a",
              border: "1px solid #1f2937",
              borderRadius: "8px",
              padding: "12px",
              minHeight: "120px",
              marginBottom: "12px",
            }}
          >
            {state.items.length === 0 ? (
              <div style={{ color: "#4b5563", fontSize: "13px", textAlign: "center", paddingTop: "24px" }}>
                Cart is empty. Add items from the catalog.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {state.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#9ca3af" }}>{item.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "4px",
                          border: "1px solid #374151",
                          background: "#1f2937",
                          color: "#9ca3af",
                          cursor: "pointer",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onClick={() => typedDispatch({ type: "DECREMENT", id: item.id })}
                      >
                        −
                      </button>
                      <span style={{ color: "#f9fafb", minWidth: "20px", textAlign: "center" }}>
                        {item.qty}
                      </span>
                      <button
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "4px",
                          border: "1px solid #374151",
                          background: "#1f2937",
                          color: "#9ca3af",
                          cursor: "pointer",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onClick={() => typedDispatch({ type: "INCREMENT", id: item.id })}
                      >
                        +
                      </button>
                      <span style={{ color: "#6b7280", minWidth: "48px", textAlign: "right" }}>
                        ${item.price * item.qty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              background: "#111827",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "13px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280", marginBottom: "4px" }}>
              <span>Subtotal</span>
              <span>${subtotal}</span>
            </div>
            {state.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981", marginBottom: "4px" }}>
                <span>Discount ({state.discount}%)</span>
                <span>−${discountAmt.toFixed(2)}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#f9fafb",
                fontWeight: 700,
                borderTop: "1px solid #1f2937",
                paddingTop: "8px",
                marginTop: "8px",
              }}
            >
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            style={{ ...s.btn("secondary"), marginTop: "8px", width: "100%" }}
            onClick={() => typedDispatch({ type: "CLEAR" })}
          >
            Clear cart
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: "16px",
          background: "#0a0a0a",
          border: "1px solid #1f2937",
          borderRadius: "8px",
          padding: "12px",
        }}
      >
        <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px", fontWeight: 600 }}>
          CURRENT STATE (JSON)
        </div>
        <pre style={{ fontSize: "12px", color: "#86efac", fontFamily: "monospace", lineHeight: 1.5, overflow: "auto" }}>
          {JSON.stringify(state, null, 2)}
        </pre>
      </div>
    </div>
  );
}

const USE_REDUCER_CODE = `type Action =
  | { type: 'ADD_ITEM'; item: Item }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'APPLY_COUPON'; code: string };

// The reducer — like the vending machine's internal logic
function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.item] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    default:
      return state;
  }
}

// In your component — dispatch = press the vending machine button
const [state, dispatch] = useReducer(cartReducer, initialState);
dispatch({ type: 'ADD_ITEM', item: selectedItem });`;

// ─── Section 8: Edge Workers as MCP ──────────────────────────────────────────

const MCP_TOOL_DEF = `// MCP Tool Definition
{
  "name": "get_weather",
  "description": "Get current weather for a location",
  "inputSchema": {
    "type": "object",
    "properties": {
      "location": { "type": "string" }
    },
    "required": ["location"]
  }
}

// MCP tool handler
server.tool("get_weather", async ({ location }) => {
  const data = await fetch(\`/api/weather?q=\${location}\`);
  return { content: [{ type: "text", text: await data.text() }] };
});`;

const WORKER_EQUIVALENT = `// Equivalent Cloudflare Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // fetch() handler = MCP tools/call endpoint
    if (url.pathname === '/weather') {
      const location = url.searchParams.get('q');

      // env bindings = MCP server capabilities
      // env.KV  → MCP resource (KV storage)
      // env.DB  → MCP resource (D1 database)
      // env.AI  → MCP capability (Workers AI)

      const cached = await env.KV.get(\`weather:\${location}\`);
      if (cached) return new Response(cached);

      const data = await fetchWeatherAPI(location);
      await env.KV.put(\`weather:\${location}\`, data, { expirationTtl: 300 });
      return new Response(data);
    }

    return new Response('Not found', { status: 404 });
  }
};`;

type EdgeTool = {
  label: string;
  workerConcept: string;
  mcpConcept: string;
  color: string;
  description: string;
};

const EDGE_CONCEPTS: EdgeTool[] = [
  {
    label: "fetch() handler",
    workerConcept: "export default { async fetch() {} }",
    mcpConcept: "tools/call endpoint",
    color: "#3b82f6",
    description:
      "Every Worker export is an entry point — exactly like an MCP server exposing its tool invocation endpoint.",
  },
  {
    label: "env bindings",
    workerConcept: "env.KV, env.DB, env.AI",
    mcpConcept: "server capabilities",
    color: "#8b5cf6",
    description:
      "Environment bindings are injected at runtime — like MCP server capabilities declared in the manifest. No import, no instantiation, just use them.",
  },
  {
    label: "Durable Objects",
    workerConcept: "class MyDO extends DurableObject {}",
    mcpConcept: "stateful MCP sessions",
    color: "#f59e0b",
    description:
      "Each Durable Object instance is a singleton with its own memory — identical to an MCP server managing a persistent conversation session.",
  },
  {
    label: "KV / D1 / R2",
    workerConcept: "env.KV.get(), env.DB.prepare()",
    mcpConcept: "MCP resources",
    color: "#10b981",
    description:
      "Storage primitives in Workers map directly to MCP resource types: KV → text resources, D1 → structured resources, R2 → blob resources.",
  },
  {
    label: "Service bindings",
    workerConcept: "env.AUTH_SERVICE.fetch()",
    mcpConcept: "server-to-server composition",
    color: "#ec4899",
    description:
      "Service bindings let Workers call each other with zero network overhead — this is MCP server-to-server tool delegation, but faster.",
  },
];

function EdgeDemo() {
  const [activeToolIdx, setActiveToolIdx] = useState(0);
  const [showWorker, setShowWorker] = useState(false);
  const active = EDGE_CONCEPTS[activeToolIdx];

  return (
    <div>
      <div style={s.demoTitle}>Interactive — Click a concept to see the mapping</div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {EDGE_CONCEPTS.map((c, i) => (
          <button
            key={i}
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              border: `1px solid ${i === activeToolIdx ? c.color : "#374151"}`,
              background: i === activeToolIdx ? `${c.color}20` : "transparent",
              color: i === activeToolIdx ? c.color : "#6b7280",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              transition: "all 0.15s",
            }}
            onClick={() => setActiveToolIdx(i)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div
        style={{
          background: "#0a0a0a",
          border: `1px solid ${active.color}40`,
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: "16px",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              background: "#111827",
              borderRadius: "8px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "10px", color: "#6b7280", marginBottom: "6px", fontWeight: 600 }}>
              CLOUDFLARE WORKERS
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                color: active.color,
                fontWeight: 600,
              }}
            >
              {active.workerConcept}
            </div>
          </div>
          <div style={{ fontSize: "18px", color: "#374151" }}>↔</div>
          <div
            style={{
              background: "#111827",
              borderRadius: "8px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "10px", color: "#6b7280", marginBottom: "6px", fontWeight: 600 }}>
              MCP PROTOCOL
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                color: "#10b981",
                fontWeight: 600,
              }}
            >
              {active.mcpConcept}
            </div>
          </div>
        </div>
        <div style={{ fontSize: "13px", color: "#9ca3af", lineHeight: 1.7 }}>
          {active.description}
        </div>
      </div>

      <div style={{ ...s.row, marginBottom: "16px" }}>
        <button
          style={s.btn(!showWorker ? "primary" : "secondary")}
          onClick={() => setShowWorker(false)}
        >
          MCP tool definition
        </button>
        <button
          style={s.btn(showWorker ? "primary" : "secondary")}
          onClick={() => setShowWorker(true)}
        >
          Equivalent Worker code
        </button>
      </div>

      <Code>{showWorker ? WORKER_EQUIVALENT : MCP_TOOL_DEF}</Code>
    </div>
  );
}

// ─── Section content map ──────────────────────────────────────────────────────

interface SectionProps {
  id: SectionId;
}

function SectionContent({ id }: SectionProps) {
  switch (id) {
    case "useState":
      return (
        <>
          <AnalogyCard
            color="#3b82f6"
            icon="📋"
            text="A whiteboard in your kitchen. You write a number on it. Anyone can read it. When you erase and write a new number, everyone sees the update instantly. useState is that whiteboard — read it anywhere in your component, replace the value and React re-renders so everyone sees the new value."
          />
          <div style={s.demoCard}>
            <UseStateDemo />
          </div>
          <Code>{USE_STATE_CODE}</Code>
          <EdgeCard
            color="#10b981"
            text="In a Cloudflare Worker, this is like KV storage — you write a value, and the next request reads the updated value. The difference: Workers are stateless between requests, so for truly shared state you reach for KV or Durable Objects. useState lives only in browser memory for the lifetime of the component."
          />
        </>
      );

    case "useEffect":
      return (
        <>
          <AnalogyCard
            color="#3b82f6"
            icon="💡"
            text="A motion sensor light in your hallway. It watches for movement (the dependency array). When movement happens, it triggers the light (the effect body runs). When you leave the room, the sensor turns the light off (the cleanup function). Change the sensitivity and it resets itself — just like changing a dependency causes the effect to re-subscribe."
          />
          <div style={s.demoCard}>
            <UseEffectDemo />
          </div>
          <Code>{USE_EFFECT_CODE}</Code>
          <EdgeCard
            color="#10b981"
            text="In Cloudflare Workers, this is like a Durable Object alarm — env.DO.setAlarm(Date.now() + 5000). It fires when conditions change, runs your handler, and you can cancel it with deleteAlarm(). The cleanup is explicit in Workers (delete the alarm), while React automates it via the return function."
          />
        </>
      );

    case "useRef":
      return (
        <>
          <AnalogyCard
            color="#3b82f6"
            icon="📌"
            text="A sticky note on your monitor. You can write on it and read it whenever you want, but changing the note doesn't make anyone look up from their work. It's your private scratch pad — mutable, always readable, but completely invisible to React's render cycle. Perfect for values that need to persist between renders without causing them."
          />
          <div style={s.demoCard}>
            <UseRefDemo />
          </div>
          <Code>{USE_REF_CODE}</Code>
          <EdgeCard
            color="#10b981"
            text="In Workers, this is like a variable in your Worker's module scope — it persists across the handler function call within a single isolate lifetime but doesn't trigger anything. Use it for caching database connections, memoizing expensive initializations, or holding a reference to a WebSocket. Unlike useState, writing to it is a silent operation."
          />
        </>
      );

    case "useMemo":
      return (
        <>
          <AnalogyCard
            color="#3b82f6"
            icon="🧾"
            text="You calculated the tip at dinner once. You wrote it on a napkin. If the bill doesn't change, you just look at the napkin — you don't pull out a calculator again. That napkin is useMemo: the result of an expensive computation, kept until the inputs that produced it change. Change the bill, recalculate, write a new napkin."
          />
          <div style={s.demoCard}>
            <UseMemoDemo />
          </div>
          <Code>{USE_MEMO_CODE}</Code>
          <EdgeCard
            color="#10b981"
            text={"In edge architecture, this is caching — Cache API or CDN. \"Don't recompute if the inputs haven't changed\" is exactly the cache-key principle: hash the inputs, return the cached output if the hash matches. useMemo is in-memory memoization scoped to a component. In Workers, you'd use cache.match(cacheKey) and cache.put(cacheKey, response)."}
          />
        </>
      );

    case "useCallback":
      return (
        <>
          <AnalogyCard
            color="#3b82f6"
            icon="📞"
            text='You give your friend your phone number. If you hand them the SAME card every time you meet, they know nothing changed. But if you write it on a NEW card each visit (even with the same number), their phone sees "new contact info" and triggers an update. useCallback gives React the same card — a stable function reference that lets optimized child components skip unnecessary re-renders.'
          />
          <div style={s.demoCard}>
            <UseCallbackDemo />
          </div>
          <Code>{USE_CALLBACK_CODE}</Code>
          <EdgeCard
            color="#10b981"
            text="In MCP servers, this is like tool handler registration. You define handlers once at server startup — not recreated per request. If you called server.tool() on every incoming request, you'd waste initialization time and potentially leak memory. useCallback solves the same problem: define the function once, reuse the reference unless dependencies genuinely change."
          />
        </>
      );

    case "useContext":
      return (
        <>
          <AnalogyCard
            color="#3b82f6"
            icon="📻"
            text="An office radio that everyone can hear. You don't hand a speaker to each person — you broadcast once and every radio in the office receives it. Change the station (update context), every radio updates. useContext is that broadcast mechanism: provide a value high in the tree, consume it at any depth without threading props through every intermediate component."
          />
          <div style={s.demoCard}>
            <UseContextDemo />
          </div>
          <Code>{USE_CONTEXT_CODE}</Code>
          <EdgeCard
            color="#10b981"
            text="In Cloudflare Workers, this is environment bindings (env.DB, env.KV, env.AI). Every route handler and middleware in your Worker receives the same env object without you passing it through each layer. The Hono framework context (c.env) follows the same pattern — inject once at the edge, consume at any handler depth."
          />
        </>
      );

    case "useReducer":
      return (
        <>
          <AnalogyCard
            color="#3b82f6"
            icon="🎰"
            text="A vending machine. Its current display is the state. When you press button B7, you're dispatching an action. The machine's internal circuitry (the reducer function) processes that action — checks your money, checks inventory, updates the display, maybe dispenses something. You can't reach inside and manually change the display. Everything goes through the machine's logic."
          />
          <div style={s.demoCard}>
            <UseReducerDemo />
          </div>
          <Code>{USE_REDUCER_CODE}</Code>
          <EdgeCard
            color="#10b981"
            text="In Durable Objects, the state machine pattern is exactly useReducer. An RPC method call is the dispatched action. The Durable Object's method body is the reducer. The persisted storage is the current state. The key insight: you never mutate state directly — you always go through a defined action, making the state transition auditable and testable."
          />
        </>
      );

    case "edge":
      return (
        <>
          <div
            style={{
              background: "#10b98110",
              border: "1px solid #10b98130",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#10b981",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "8px",
              }}
            >
              Core Insight
            </div>
            <div style={{ fontSize: "14px", color: "#d1d5db", lineHeight: 1.8 }}>
              A Cloudflare Worker is, architecturally, an MCP server. Both models share the same
              fundamental contract: receive a structured request, execute a capability, return a
              structured response. The difference is transport and protocol — Workers speak HTTP,
              MCP servers speak JSON-RPC over stdio or SSE. The mental model is identical.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            {[
              {
                worker: "fetch() handler",
                mcp: "tools/call",
                desc: "Entry point for a single unit of work",
              },
              {
                worker: "env bindings",
                mcp: "server capabilities",
                desc: "Injected dependencies — no imports needed",
              },
              {
                worker: "Durable Objects",
                mcp: "stateful sessions",
                desc: "Singleton with persistent memory and RPC",
              },
              {
                worker: "KV / D1 / R2",
                mcp: "resources",
                desc: "Structured, text, and blob data layers",
              },
              {
                worker: "Service bindings",
                mcp: "server composition",
                desc: "Call another server's tools directly",
              },
              {
                worker: "Wrangler routes",
                mcp: "tool name routing",
                desc: "Map request paths to capability handlers",
              },
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  background: "#0a0a0a",
                  border: "1px solid #1f2937",
                  borderRadius: "8px",
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "11px",
                      color: "#3b82f6",
                      background: "#3b82f610",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {row.worker}
                  </span>
                  <span style={{ color: "#374151", fontSize: "12px" }}>→</span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "11px",
                      color: "#10b981",
                      background: "#10b98110",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {row.mcp}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{row.desc}</div>
              </div>
            ))}
          </div>

          <div style={s.demoCard}>
            <EdgeDemo />
          </div>
        </>
      );

    default:
      return null;
  }
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function HooksExplorer() {
  const [active, setActive] = useState<SectionId>("useState");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);

  const activeItem = NAV_ITEMS.find((n) => n.id === active)!;
  const isEdge = active === "edge";

  const handleNav = useCallback((id: SectionId) => {
    setActive(id);
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Responsive: collapse sidebar on small screens initially
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    if (mq.matches) setSidebarOpen(false);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(!e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div style={s.shell}>
      {/* Header */}
      <header style={s.header}>
        <button
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid #1f2937",
            background: "transparent",
            color: "#9ca3af",
            cursor: "pointer",
            fontSize: "16px",
            lineHeight: 1,
          }}
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <div style={s.headerLogo}>
          spike.land
        </div>
        <span style={s.headerSlash}>/</span>
        <span style={s.headerTitle}>Hooks Explorer</span>
      </header>

      <div style={s.body}>
        {/* Sidebar */}
        {sidebarOpen && (
          <nav style={s.sidebar} aria-label="Hook sections">
            <div style={s.sidebarLabel}>React Hooks</div>
            <div style={s.sidebarSection}>
              {NAV_ITEMS.filter((n) => n.id !== "edge").map((item) => (
                <button
                  key={item.id}
                  style={s.navBtn(active === item.id, item.color)}
                  onClick={() => handleNav(item.id)}
                >
                  <span style={s.navIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                  <span style={s.navHook}>{item.hook}</span>
                </button>
              ))}
            </div>
            <div style={s.sidebarLabel}>Platform</div>
            <div style={s.sidebarSection}>
              {NAV_ITEMS.filter((n) => n.id === "edge").map((item) => (
                <button
                  key={item.id}
                  style={s.navBtn(active === item.id, "#10b981")}
                  onClick={() => handleNav(item.id)}
                >
                  <span style={s.navIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        )}

        {/* Main content */}
        <main
          ref={mainRef}
          style={{ ...s.main, overflowY: "auto", maxHeight: "calc(100vh - 57px)" }}
        >
          {/* Section header */}
          <div style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "28px" }}>{activeItem.icon}</span>
            <h1 style={s.sectionTitle}>{activeItem.label}</h1>
          </div>
          <div style={s.hookBadge(isEdge ? "#10b981" : "#3b82f6")}>
            {activeItem.hook}
          </div>

          <hr style={s.divider} />

          <SectionContent id={active} />

          {/* Navigation footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: "24px",
              borderTop: "1px solid #1f2937",
              marginTop: "8px",
            }}
          >
            {(() => {
              const idx = NAV_ITEMS.findIndex((n) => n.id === active);
              const prev = NAV_ITEMS[idx - 1];
              const next = NAV_ITEMS[idx + 1];
              return (
                <>
                  <div>
                    {prev && (
                      <button
                        style={{ ...s.btn("secondary"), display: "flex", alignItems: "center", gap: "6px" }}
                        onClick={() => handleNav(prev.id)}
                      >
                        ← {prev.hook}
                      </button>
                    )}
                  </div>
                  <div>
                    {next && (
                      <button
                        style={{ ...s.btn("primary"), display: "flex", alignItems: "center", gap: "6px" }}
                        onClick={() => handleNav(next.id)}
                      >
                        {next.hook} →
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </main>
      </div>
    </div>
  );
}
