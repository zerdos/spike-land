import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SPRING_CONFIGS, TYPOGRAPHY } from "../../../core-logic/constants";
import { NEWCOMB_COLORS } from "../../../core-logic/newcomb-constants";

export function Scene01_Hook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: SPRING_CONFIGS.gentle, durationInFrames: 40 });
  const boxAIn = spring({
    frame: frame - 30,
    fps,
    config: SPRING_CONFIGS.snappy,
    durationInFrames: 30,
  });
  const boxBIn = spring({
    frame: frame - 60,
    fps,
    config: SPRING_CONFIGS.snappy,
    durationInFrames: 30,
  });
  const questionIn = spring({
    frame: frame - 120,
    fps,
    config: SPRING_CONFIGS.gentle,
    durationInFrames: 60,
  });

  const omegaPulse = interpolate(frame % 60, [0, 30, 60], [0.8, 1, 0.8]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.darkBg,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      {/* Omega symbol */}
      <div
        style={{
          fontSize: 120,
          opacity: titleIn,
          transform: `scale(${omegaPulse})`,
          color: NEWCOMB_COLORS.omegaGold,
          textShadow: `0 0 40px ${NEWCOMB_COLORS.omegaGold}`,
          marginBottom: 20,
        }}
      >
        Ω
      </div>

      <h1
        style={{
          fontSize: 48,
          color: COLORS.textPrimary,
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 30}px)`,
          marginBottom: 60,
          textAlign: "center",
        }}
      >
        Newcomb&apos;s Paradox
      </h1>

      {/* Two boxes */}
      <div style={{ display: "flex", gap: 80, marginBottom: 60 }}>
        {/* Box A — transparent */}
        <div
          style={{
            width: 280,
            height: 200,
            border: `3px solid ${NEWCOMB_COLORS.twoBox}`,
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: Math.max(0, boxAIn),
            transform: `scale(${Math.max(0, boxAIn)})`,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
          }}
        >
          <div style={{ fontSize: 18, color: COLORS.textSecondary, marginBottom: 8 }}>
            Box A (transparent)
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, color: NEWCOMB_COLORS.twoBox }}>£1,000</div>
        </div>

        {/* Box B — opaque */}
        <div
          style={{
            width: 280,
            height: 200,
            border: `3px solid ${NEWCOMB_COLORS.oneBox}`,
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: Math.max(0, boxBIn),
            transform: `scale(${Math.max(0, boxBIn)})`,
            backgroundColor: "rgba(34, 197, 94, 0.1)",
          }}
        >
          <div style={{ fontSize: 18, color: COLORS.textSecondary, marginBottom: 8 }}>
            Box B (opaque)
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, color: NEWCOMB_COLORS.oneBox }}>
            £1,000,000
          </div>
          <div style={{ fontSize: 14, color: COLORS.textMuted }}>or £0</div>
        </div>
      </div>

      {/* Question */}
      <div
        style={{
          fontSize: 36,
          color: NEWCOMB_COLORS.omegaGold,
          opacity: Math.max(0, questionIn),
          transform: `translateY(${(1 - Math.max(0, questionIn)) * 20}px)`,
          fontStyle: "italic",
        }}
      >
        What do you do?
      </div>
    </AbsoluteFill>
  );
}
