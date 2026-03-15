import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SPRING_CONFIGS, TYPOGRAPHY } from "../../../core-logic/constants";
import { NEWCOMB_COLORS } from "../../../core-logic/newcomb-constants";

export function Scene06_CancerCure() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: SPRING_CONFIGS.gentle, durationInFrames: 60 });
  const glowPulse = interpolate(frame % 90, [0, 45, 90], [0.6, 1, 0.6]);

  const lines = [
    { text: "Chemistry × AI × The Invisible Graph", delay: 60 },
    { text: "Cancer isn't one disease.", delay: 180 },
    { text: "It's a thousand decision trees.", delay: 300 },
    { text: "A thousand invisible graphs.", delay: 420 },
    { text: "The AI sees them all.", delay: 540 },
    { text: "The chemist understands the chemistry.", delay: 660 },
  ];

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
        position: "relative",
      }}
    >
      {/* Radial glow background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${NEWCOMB_COLORS.cureGlow}15 0%, transparent 60%)`,
          opacity: glowPulse,
        }}
      />

      {/* Announcement header */}
      <div
        style={{
          fontSize: 18,
          color: NEWCOMB_COLORS.cureGlow,
          opacity: titleIn,
          letterSpacing: 8,
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        Announcement
      </div>

      <h2
        style={{
          fontSize: 52,
          fontWeight: 800,
          color: COLORS.textPrimary,
          opacity: titleIn,
          textAlign: "center",
          marginBottom: 60,
          lineHeight: 1.2,
          textShadow: `0 0 40px ${NEWCOMB_COLORS.cureGlow}40`,
        }}
      >
        Curing All Cancers
      </h2>

      {/* Progressive reveal lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 800 }}>
        {lines.map((line) => {
          const lineIn = spring({
            frame: frame - line.delay,
            fps,
            config: SPRING_CONFIGS.gentle,
            durationInFrames: 40,
          });

          return (
            <div
              key={line.text}
              style={{
                fontSize: 28,
                color: COLORS.textPrimary,
                opacity: Math.max(0, lineIn),
                transform: `translateY(${(1 - Math.max(0, lineIn)) * 15}px)`,
                textAlign: "center",
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>

      {/* Final tagline */}
      <div
        style={{
          marginTop: 50,
          fontSize: 36,
          fontWeight: 800,
          color: NEWCOMB_COLORS.cureGlow,
          opacity: Math.max(
            0,
            spring({
              frame: frame - 780,
              fps,
              config: SPRING_CONFIGS.bouncy,
              durationInFrames: 60,
            }),
          ),
          textShadow: `0 0 30px ${NEWCOMB_COLORS.cureGlow}`,
        }}
      >
        One box. One decision. A thousand graphs traversed.
      </div>
    </AbsoluteFill>
  );
}
