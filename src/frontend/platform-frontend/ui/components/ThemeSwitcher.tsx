import { useCallback, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { triggerViewTransition } from "@spike-land-ai/block-website/core";
import type { ThemePreference } from "../hooks/useDarkMode";

// ─── Icons ───────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#f0a500"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.5" fill="#f0a500" stroke="none" />
      <line x1="12" y1="2" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="6.76" y2="6.76" />
      <line x1="17.24" y1="17.24" x2="19.07" y2="19.07" />
      <line x1="4.93" y1="19.07" x2="6.76" y2="17.24" />
      <line x1="17.24" y1="6.76" x2="19.07" y2="4.93" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#c8cfee" stroke="none" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// ─── Main ThemeSwitcher ──────────────────────────────────────────────────────

interface ThemeSwitcherProps {
  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;
}

export function ThemeSwitcher({ theme, setTheme }: ThemeSwitcherProps) {
  const isDark = theme === "dark";
  const prefersReduced = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [rip, setRip] = useState(false);

  const handleToggle = useCallback(() => {
    setRip(false);
    requestAnimationFrame(() => setRip(true));

    const newTheme: ThemePreference = isDark ? "light" : "dark";
    const doToggle = () => setTheme(newTheme);

    if (prefersReduced) {
      doToggle();
      return;
    }
    triggerViewTransition(buttonRef, doToggle);
  }, [isDark, setTheme, prefersReduced]);

  const cssVars = isDark
    ? {
        "--trk": "#141b30",
        "--accent": "#4d6fff",
        "--thumb": "#e4e8f8",
        "--shad": "rgba(77,111,255,.55)",
        "--glow": "rgba(77,111,255,.18)",
      }
    : {
        "--trk": "#e4ddd0",
        "--accent": "#f0a500",
        "--thumb": "#fffdf8",
        "--shad": "rgba(240,165,0,.40)",
        "--glow": "rgba(240,165,0,.22)",
      };

  return (
    <button
      ref={buttonRef}
      className="toggle-insp"
      onClick={handleToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      style={cssVars as React.CSSProperties}
    >
      <div className="insp-halo" />
      <div key={rip ? 1 : 0} className={`insp-rip${rip ? " go" : ""}`} />
      {/* CSS transition replaces spring physics — see .toggle-insp .insp-thumb in app.css */}
      <div className="insp-thumb" style={{ left: isDark ? 5 : 41 }}>
        {isDark ? <MoonIcon /> : <SunIcon />}
      </div>
    </button>
  );
}

// ─── View Transition CSS (injected once) ─────────────────────────────────────
if (typeof document !== "undefined") {
  const id = "theme-switcher-vt-styles";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation: none;
        mix-blend-mode: normal;
      }
    `;
    document.head.appendChild(style);
  }
}
