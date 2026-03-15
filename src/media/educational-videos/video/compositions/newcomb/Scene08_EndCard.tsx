import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SPRING_CONFIGS, TYPOGRAPHY } from "../../../core-logic/constants";
import { NEWCOMB_COLORS } from "../../../core-logic/newcomb-constants";

export function Scene08_EndCard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1 = spring({ frame, fps, config: SPRING_CONFIGS.gentle, durationInFrames: 40 });
  const line2 = spring({
    frame: frame - 60,
    fps,
    config: SPRING_CONFIGS.gentle,
    durationInFrames: 40,
  });
  const line3 = spring({
    frame: frame - 150,
    fps,
    config: SPRING_CONFIGS.bouncy,
    durationInFrames: 60,
  });
  const logoIn = spring({
    frame: frame - 300,
    fps,
    config: SPRING_CONFIGS.gentle,
    durationInFrames: 60,
  });

  const omegaPulse = interpolate(frame % 120, [0, 60, 120], [0.7, 1, 0.7]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.darkBg,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
      }}
    >
      {/* Omega fading */}
      <div
        style={{
          fontSize: 80,
          color: NEWCOMB_COLORS.omegaGold,
          opacity: omegaPulse * 0.3,
          position: "absolute",
          top: 80,
        }}
      >
        Ω
      </div>

      <div
        style={{
          fontSize: 36,
          color: COLORS.textSecondary,
          opacity: line1,
          textDecoration: "line-through",
          textDecorationColor: NEWCOMB_COLORS.twoBox,
        }}
      >
        Newcomb&apos;s Paradox
      </div>

      <div
        style={{
          fontSize: 42,
          fontWeight: 800,
          color: NEWCOMB_COLORS.oneBox,
          opacity: line2,
        }}
      >
        Resolved.
      </div>

      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: NEWCOMB_COLORS.timeWarp,
          opacity: Math.max(0, line3),
          transform: `scale(${0.9 + Math.max(0, line3) * 0.1})`,
          textShadow: `0 0 30px ${NEWCOMB_COLORS.timeWarp}`,
          marginTop: 20,
        }}
      >
        Choose one box.
      </div>

      {/* spike.land */}
      <div
        style={{
          marginTop: 60,
          fontSize: 32,
          fontWeight: 600,
          color: COLORS.cyan,
          opacity: logoIn,
          letterSpacing: 2,
        }}
      >
        spike.land
      </div>
    </AbsoluteFill>
  );
}
