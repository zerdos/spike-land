import { useCallback, useEffect, useState } from "react";

function Sun() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="-11 -11 22 22"
      aria-hidden="true"
      style={{ overflow: "visible", color: "var(--accent)" }}
    >
      <circle r="5" fill="currentColor" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const c = Math.cos(r),
          s = Math.sin(r);
        return (
          <line
            key={deg}
            x1={c * 7}
            y1={s * 7}
            x2={c * 10.5}
            y2={s * 10.5}
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function Moon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="-11 -11 22 22"
      aria-hidden="true"
      style={{ overflow: "visible", color: "var(--accent)" }}
    >
      <path d="M0,-8 A8,8 0 1,0 8,0 A5.5,5.5 0 1,1 0,-8 Z" fill="currentColor" />
    </svg>
  );
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme-preference") {
        const dark = e.newValue === "dark";
        setIsDark(dark);
        document.documentElement.classList.toggle("dark", dark);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleToggle = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme-preference", next ? "dark" : "light");
  }, [isDark]);

  const cssVars = isDark
    ? {
        "--trk": "#1a2137",
        "--trk-border": "rgba(255,255,255,.12)",
        "--accent": "#a6b4ff",
        "--thumb": "#e4e8f8",
        "--shad": "rgba(77,111,255,.45)",
        "--glow": "rgba(77,111,255,.22)",
      }
    : {
        "--trk": "#e4ddd0",
        "--trk-border": "rgba(0,0,0,.18)",
        "--accent": "#b87400",
        "--thumb": "#fffdf8",
        "--shad": "rgba(184,116,0,.35)",
        "--glow": "rgba(240,165,0,.28)",
      };

  return (
    <>
      <style>{`
        .theme-toggle {
          position: relative;
          width: 64px;
          height: 32px;
          border-radius: 999px;
          background: var(--trk);
          border: 1px solid var(--trk-border);
          cursor: pointer;
          padding: 0;
          box-shadow: inset 0 1px 2px rgba(0,0,0,.12);
          transition: background 0.25s ease, border-color 0.25s ease;
        }
        .theme-toggle:hover { filter: brightness(1.04); }
        .theme-toggle:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .toggle-halo {
          position: absolute;
          inset: -4px;
          border-radius: 999px;
          background: radial-gradient(circle, var(--glow) 0%, transparent 70%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .theme-toggle:hover .toggle-halo { opacity: 1; }
        .toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--thumb);
          box-shadow: 0 1px 3px var(--shad), 0 0 0 1px rgba(0,0,0,.06);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          transition: transform 0.25s cubic-bezier(.2,.8,.2,1);
        }
        .theme-toggle[aria-pressed="true"] .toggle-thumb {
          transform: translateX(32px);
        }
      `}</style>
      <button
        className="theme-toggle"
        onClick={handleToggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={isDark}
        style={{ ...(cssVars as React.CSSProperties), visibility: mounted ? "visible" : "hidden" }}
      >
        <div className="toggle-halo" />
        <div className="toggle-thumb">{isDark ? <Moon /> : <Sun />}</div>
      </button>
    </>
  );
}
