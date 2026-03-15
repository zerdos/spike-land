import { type FC } from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TYPOGRAPHY, SPRING_CONFIGS } from "../../../core-logic/constants";
import { ERDOS_COLORS } from "../../../core-logic/erdos-constants";
import { ChalkParticles, WordReveal, GlowDivider } from "../../components/ui/ErdosHelpers";
import { GradientMesh } from "../../components/branding/GradientMesh";
import { fadeIn } from "../../lib/animations";

/** Enhanced CSS 3-D Möbius strip with color gradient segments */
function EnhancedMobius({
  delay = 0,
  morphProgress = 0,
}: {
  delay?: number;
  morphProgress?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entryP = spring({ frame: frame - delay, fps, config: SPRING_CONFIGS.gentle });
  const rotation = (frame - delay) * 0.7;
  const glowPulse = Math.sin((frame - delay) * 0.05) * 0.35 + 0.65;

  const segments = 32;
  const R = 160; // major radius

  // Color gradient along the strip: purple → cyan → purple
  const segmentColor = (t: number): string => {
    const hue = 260 + t * 180; // 260 (purple) → 440 (cyan-ish)
    return `hsl(${hue}, 80%, 60%)`;
  };

  return (
    <div
      style={{
        width: 500,
        height: 400,
        perspective: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: interpolate(entryP, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <div
        style={{
          position: "relative",
          width: 400,
          height: 300,
          transformStyle: "preserve-3d",
          transform: `
            rotateX(20deg)
            rotateY(${rotation}deg)
            scale(${interpolate(entryP, [0, 1], [0.4, 1])})
            ${morphProgress > 0 ? `scaleX(${interpolate(morphProgress, [0, 1], [1, 1.5])})` : ""}
          `,
        }}
      >
        {Array.from({ length: segments }, (_, i) => {
          const t = i / segments;
          const angle = t * Math.PI * 2;
          const twist = t * Math.PI; // half-twist per loop

          const x = R * Math.cos(angle);
          const z = R * Math.sin(angle);
          const segW = (2 * Math.PI * R) / segments + 3;
          const color = segmentColor(t);
          const opacity = 0.75 + Math.sin(t * Math.PI * 4) * 0.15;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: segW,
                height: 28,
                marginLeft: -segW / 2,
                marginTop: -14,
                background: `linear-gradient(${twist * (180 / Math.PI) + 90}deg, ${color}cc, ${color}40)`,
                borderRadius: 3,
                transform: `
                  translate3d(${x}px, 0px, ${z}px)
                  rotateZ(${twist * (180 / Math.PI)}deg)
                  rotateY(${angle * (180 / Math.PI)}deg)
                `,
                boxShadow: `0 0 ${10 * glowPulse}px ${color}60`,
                opacity,
                backfaceVisibility: "visible",
              }}
            />
          );
        })}
      </div>

      {/* Infinity overlay during morph */}
      {morphProgress > 0.5 && (
        <div
          style={{
            position: "absolute",
            fontSize: 140,
            color: ERDOS_COLORS.mobiusGlow,
            fontFamily: "serif",
            opacity: interpolate(morphProgress, [0.5, 1], [0, 0.8], { extrapolateRight: "clamp" }),
            filter: `blur(${interpolate(morphProgress, [0.5, 1], [12, 0])}px)`,
            textShadow: `0 0 40px ${ERDOS_COLORS.mobiusGlow}80, 0 0 80px ${ERDOS_COLORS.mobiusGlow}40`,
          }}
        >
          ∞
        </div>
      )}
    </div>
  );
}

export const Scene06_MobiusStrip: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const morphStart = 620;
  const morphProgress = interpolate(frame, [morphStart, morphStart + 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: ERDOS_COLORS.blackboard,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        overflow: "hidden",
      }}
    >
      <GradientMesh animationSpeed={0.008} opacity={0.25} />
      <ChalkParticles count={14} opacity={0.5} />

      {/* ── Part 1: Title + Strip (0–600) ── */}
      <Sequence from={0} durationInFrames={600}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: 14,
              color: ERDOS_COLORS.mobiusGlow,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              opacity: fadeIn(frame, fps, 0.4, 5),
            }}
          >
            The Surviving Framework
          </div>
          <WordReveal
            text="Möbius Topology"
            delay={15}
            stagger={14}
            fontSize={80}
            color={ERDOS_COLORS.chalk}
          />

          {/* The strip */}
          <EnhancedMobius delay={25} />

          {/* Caption */}
          <div
            style={{
              opacity: fadeIn(frame, fps, 0.5, 120),
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 26,
                color: ERDOS_COLORS.chalk,
                opacity: 0.8,
                letterSpacing: "0.02em",
              }}
            >
              After one traversal, observer and observed swap.
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Part 2: Morph to Infinity (600–900) ── */}
      <Sequence from={600} durationInFrames={300}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 30,
          }}
        >
          <EnhancedMobius delay={0} morphProgress={morphProgress} />

          <div
            style={{
              opacity: fadeIn(frame - 600, fps, 0.5, 90),
              textAlign: "center",
            }}
          >
            <GlowDivider delay={690} maxWidth={600} color={ERDOS_COLORS.mobiusGlow} />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Part 3: Strange loop conclusion (900–1200) ── */}
      <Sequence from={900} durationInFrames={300}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 30,
            padding: "0 160px",
          }}
        >
          {/* Large infinity */}
          <div
            style={{
              fontSize: 100,
              color: ERDOS_COLORS.mobiusGlow,
              fontFamily: "serif",
              opacity: fadeIn(frame - 900, fps, 0.5, 0),
              filter: `drop-shadow(0 0 30px ${ERDOS_COLORS.mobiusGlow}80)`,
              lineHeight: 1,
            }}
          >
            ∞
          </div>

          <div style={{ textAlign: "center" }}>
            <WordReveal
              text="The strange loop is not a circle."
              delay={915}
              stagger={5}
              fontSize={40}
              color={ERDOS_COLORS.chalk}
            />
          </div>
          <div style={{ textAlign: "center" }}>
            <WordReveal
              text="It is a Möbius strip."
              delay={960}
              stagger={8}
              fontSize={52}
              color={ERDOS_COLORS.mobiusGlow}
            />
          </div>
          <div
            style={{
              opacity: fadeIn(frame - 900, fps, 0.5, 120),
              textAlign: "center",
              maxWidth: 1100,
            }}
          >
            <WordReveal
              text="Something genuinely changes when you go around once."
              delay={1040}
              stagger={4}
              fontSize={30}
              color={ERDOS_COLORS.chalk}
              bold={false}
              italic
            />
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
