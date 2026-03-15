import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SPRING_CONFIGS, TYPOGRAPHY } from "../../../core-logic/constants";
import { NEWCOMB_COLORS } from "../../../core-logic/newcomb-constants";

const STEPS = [
  "Omega is almost always right.",
  "One-boxers → £1,000,000",
  "Two-boxers → £1,000",
  "Expected utility: the evidence is overwhelming.",
];

export function Scene03_OneBoxArgument() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: SPRING_CONFIGS.gentle, durationInFrames: 30 });
  const winReveal = spring({
    frame: frame - 600,
    fps,
    config: SPRING_CONFIGS.bouncy,
    durationInFrames: 60,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.darkBg,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 100,
      }}
    >
      <h2
        style={{
          fontSize: 42,
          color: NEWCOMB_COLORS.oneBox,
          opacity: titleIn,
          marginBottom: 60,
          fontWeight: 800,
        }}
      >
        The One-Boxer
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }}>
        {STEPS.map((step, i) => {
          const stepIn = spring({
            frame: frame - 90 - i * 120,
            fps,
            config: SPRING_CONFIGS.gentle,
            durationInFrames: 40,
          });
          return (
            <div
              key={step}
              style={{
                fontSize: 28,
                color: COLORS.textPrimary,
                opacity: Math.max(0, stepIn),
                transform: `translateX(${(1 - Math.max(0, stepIn)) * 40}px)`,
                padding: "16px 24px",
                borderLeft: `4px solid ${NEWCOMB_COLORS.oneBox}`,
                backgroundColor: "rgba(34, 197, 94, 0.05)",
                borderRadius: "0 8px 8px 0",
              }}
            >
              {step}
            </div>
          );
        })}
      </div>

      {/* The punchline */}
      <div
        style={{
          marginTop: 60,
          fontSize: 36,
          fontWeight: 800,
          color: NEWCOMB_COLORS.oneBox,
          opacity: Math.max(0, winReveal),
          transform: `scale(${0.8 + Math.max(0, winReveal) * 0.2})`,
          textShadow: `0 0 20px ${NEWCOMB_COLORS.oneBox}`,
        }}
      >
        And it wins.
      </div>
    </AbsoluteFill>
  );
}
