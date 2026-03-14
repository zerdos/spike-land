import { useEffect, useRef, useState } from "react";

// ── Hooks ────────────────────────────────────────────────────────────

export function useIntersectionOnce(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, visible]);
  return { ref, visible };
}

export function useCounter(end: number, duration: number, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const start = performance.now();
    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
    const tick = (now: number) => {
      const elapsed = Math.min((now - start) / duration, 1);
      setCount(Math.round(easeOutExpo(elapsed) * end));
      if (elapsed < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, active]);
  return count;
}

// ── Types ────────────────────────────────────────────────────────────

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

// ── Brand constants ──────────────────────────────────────────────────

export const BRAND = {
  name: "Lumeva Barber",
  tagline: "Behaviorally Informed Branding for Barbershops",
  email: "hello@lumevabarber.com",
  accentColor: "amber",
} as const;

// ── Reusable Tailwind class strings ──────────────────────────────────

export const SECTION_CLASSES = {
  dark: "bg-neutral-950 text-white",
  darker: "bg-black text-white",
  card: "bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 rounded-2xl",
  cardHover:
    "hover:border-amber-500/30 hover:shadow-amber-500/5 hover:shadow-lg transition-all duration-300",
} as const;
