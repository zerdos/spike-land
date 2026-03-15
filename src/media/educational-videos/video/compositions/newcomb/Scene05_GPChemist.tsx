import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SPRING_CONFIGS, TYPOGRAPHY } from "../../../core-logic/constants";
import { GP_APPLICATIONS, NEWCOMB_COLORS } from "../../../core-logic/newcomb-constants";

export function Scene05_GPChemist() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: SPRING_CONFIGS.gentle, durationInFrames: 40 });
  const subtitleIn = spring({
    frame: frame - 40,
    fps,
    config: SPRING_CONFIGS.gentle,
    durationInFrames: 40,
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
        padding: 80,
      }}
    >
      {/* GP intro */}
      <div
        style={{
          fontSize: 28,
          color: NEWCOMB_COLORS.chemistAmber,
          opacity: titleIn,
          marginBottom: 8,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        Case Study
      </div>

      <h2
        style={{
          fontSize: 56,
          color: COLORS.textPrimary,
          opacity: titleIn,
          fontWeight: 800,
          marginBottom: 8,
        }}
      >
        Gian Pierre
      </h2>

      <div
        style={{
          fontSize: 24,
          color: COLORS.textSecondary,
          opacity: subtitleIn,
          marginBottom: 60,
          fontStyle: "italic",
        }}
      >
        A chemist from Brighton who chose one box
      </div>

      {/* Application cards */}
      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center" }}>
        {GP_APPLICATIONS.map((app, i) => {
          const cardIn = spring({
            frame: frame - 150 - i * 90,
            fps,
            config: SPRING_CONFIGS.snappy,
            durationInFrames: 30,
          });

          const isAnnounced = app.status === "announced";

          return (
            <div
              key={app.name}
              style={{
                width: 240,
                padding: "24px 20px",
                borderRadius: 16,
                backgroundColor: COLORS.darkCard,
                border: `2px solid ${isAnnounced ? NEWCOMB_COLORS.cureGlow : NEWCOMB_COLORS.oneBox}`,
                opacity: Math.max(0, cardIn),
                transform: `translateY(${(1 - Math.max(0, cardIn)) * 30}px)`,
                textAlign: "center",
                boxShadow: isAnnounced ? `0 0 30px ${NEWCOMB_COLORS.cureGlow}` : "none",
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: isAnnounced ? NEWCOMB_COLORS.cureGlow : COLORS.textPrimary,
                  marginBottom: 8,
                }}
              >
                {app.name}
              </div>
              <div style={{ fontSize: 16, color: COLORS.textMuted, marginBottom: 12 }}>
                {app.domain}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: isAnnounced ? NEWCOMB_COLORS.cureGlow : NEWCOMB_COLORS.oneBox,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                {app.status === "shipped" ? "✓ SHIPPED" : "◆ ANNOUNCED"}
              </div>
            </div>
          );
        })}
      </div>

      {/* One-box message */}
      <div
        style={{
          marginTop: 50,
          fontSize: 22,
          color: COLORS.textSecondary,
          opacity: spring({
            frame: frame - 600,
            fps,
            config: SPRING_CONFIGS.gentle,
            durationInFrames: 60,
          }),
        }}
      >
        The invisible graph predicted he&apos;d choose one box. Because of who he is.
      </div>
    </AbsoluteFill>
  );
}
