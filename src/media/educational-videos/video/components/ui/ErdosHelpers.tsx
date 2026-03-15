/**
 * Shared visual helpers for the "From Paul Erdős to Zoltan Erdős" video.
 */
import { interpolate, spring, useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";
import { TYPOGRAPHY, SPRING_CONFIGS } from "../../../core-logic/constants";
import { ERDOS_COLORS } from "../../../core-logic/erdos-constants";

const MATH_SYMBOLS = [
  "∑",
  "π",
  "∫",
  "Δ",
  "∞",
  "√",
  "θ",
  "λ",
  "∈",
  "∀",
  "∃",
  "≡",
  "Ω",
  "φ",
  "ψ",
  "α",
  "β",
  "γ",
  "ε",
  "ζ",
  "δ",
  "η",
  "μ",
  "ξ",
  "ρ",
  "σ",
  "τ",
  "υ",
  "χ",
  "⊕",
];

/** Floating chalk-style math symbols drifting across the blackboard */
export function ChalkParticles({ count = 28, opacity = 1 }: { count?: number; opacity?: number }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {Array.from({ length: count }, (_, i) => {
        const seed = i * 7919;
        const x = (seed * 13 + 7) % 100;
        const baseY = (seed * 17 + 3) % 100;
        const driftX = Math.sin(frame * 0.004 + seed * 0.3) * 3;
        const driftY = Math.cos(frame * 0.003 + seed * 0.2) * 2;
        const symOpacity = (Math.sin(frame * 0.012 + seed) * 0.07 + 0.07) * opacity;
        const size = 12 + (seed % 22);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x + driftX}%`,
              top: `${baseY + driftY}%`,
              fontSize: size,
              color: ERDOS_COLORS.chalk,
              opacity: Math.max(0, symOpacity),
              fontFamily: "serif",
              userSelect: "none",
              transform: `rotate(${(seed % 30) - 15}deg)`,
            }}
          >
            {MATH_SYMBOLS[i % MATH_SYMBOLS.length]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

type WordRevealProps = {
  text: string;
  delay?: number;
  stagger?: number;
  fontSize?: number;
  color?: string;
  center?: boolean;
  bold?: boolean;
  italic?: boolean;
};

/** Word-by-word spring reveal with bounce */
export function WordReveal({
  text,
  delay = 0,
  stagger = 5,
  fontSize = 60,
  color = ERDOS_COLORS.chalk,
  center = true,
  bold = true,
  italic = false,
}: WordRevealProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.28em",
        justifyContent: center ? "center" : "flex-start",
        alignItems: "baseline",
      }}
    >
      {words.map((word, i) => {
        const p = spring({
          frame: frame - delay - i * stagger,
          fps,
          config: SPRING_CONFIGS.bouncy,
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
              transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px) scale(${interpolate(p, [0, 1], [0.7, 1])})`,
              color,
              fontSize,
              fontWeight: bold ? 800 : 400,
              fontStyle: italic ? "italic" : "normal",
              fontFamily: TYPOGRAPHY.fontFamily.sans,
              lineHeight: 1.25,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

/** Animated horizontal divider line */
export function GlowDivider({
  delay = 0,
  maxWidth = 700,
  color = ERDOS_COLORS.goldProof,
}: {
  delay?: number;
  maxWidth?: number;
  color?: string;
}) {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [delay, delay + 45], [0, maxWidth], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        width: w,
        height: 2,
        backgroundColor: color,
        boxShadow: `0 0 10px ${color}80`,
        borderRadius: 1,
      }}
    />
  );
}

/** Large glowing counter number */
export function BigCounter({
  target,
  delay = 0,
  suffix = "",
  fontSize = 120,
  color = ERDOS_COLORS.goldProof,
}: {
  target: number;
  delay?: number;
  suffix?: string;
  fontSize?: number;
  color?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: SPRING_CONFIGS.bouncy });
  const elapsed = Math.max(0, frame - delay);
  const secs = elapsed / fps;
  const value = Math.round(Math.min(secs * (target / 2), target));
  const glow = Math.sin(elapsed * 0.05) * 0.3 + 0.7;

  return (
    <div
      style={{
        fontSize,
        fontWeight: 900,
        color,
        fontFamily: TYPOGRAPHY.fontFamily.mono,
        transform: `scale(${interpolate(p, [0, 1], [0.3, 1])})`,
        opacity: interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
        filter: `drop-shadow(0 0 ${30 * glow}px ${color}80)`,
        lineHeight: 1,
      }}
    >
      {value.toLocaleString()}
      {suffix}
    </div>
  );
}

/** Radial light rays emanating from center */
export function LightRays({
  delay = 0,
  color = ERDOS_COLORS.goldProof,
  count = 12,
}: {
  delay?: number;
  color?: string;
  count?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: SPRING_CONFIGS.slow });

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 0,
        height: 0,
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 360;
        const length = interpolate(p, [0, 1], [0, 280]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: length,
              height: 1.5,
              backgroundColor: color,
              opacity: 0.18,
              transformOrigin: "left center",
              transform: `rotate(${angle}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

/** Pulsing glow ring */
export function GlowRing({
  size,
  color,
  delay = 0,
}: {
  size: number;
  color: string;
  delay?: number;
}) {
  const frame = useCurrentFrame();
  const pulse = Math.sin((frame - delay) * 0.06) * 0.4 + 0.6;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${color}60`,
        boxShadow: `0 0 ${20 * pulse}px ${color}40, inset 0 0 ${10 * pulse}px ${color}20`,
      }}
    />
  );
}
