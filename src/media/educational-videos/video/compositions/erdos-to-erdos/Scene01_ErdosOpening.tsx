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
import {
  ChalkParticles,
  WordReveal,
  GlowDivider,
  BigCounter,
  LightRays,
} from "../../components/ui/ErdosHelpers";
import { fadeIn } from "../../lib/animations";

export const Scene01_ErdosOpening: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow camera zoom throughout
  const zoom = interpolate(frame, [0, 900], [1.0, 1.03], {
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
      <ChalkParticles count={30} />

      <div style={{ width: "100%", height: "100%", transform: `scale(${zoom})` }}>
        {/* ── Part 1: The Quote (0–420) ── */}
        <Sequence from={0} durationInFrames={420}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 36,
              padding: "0 160px",
            }}
          >
            <GlowDivider delay={8} maxWidth={900} />

            {/* Huge italic quote */}
            <div style={{ textAlign: "center", maxWidth: 1400 }}>
              <WordReveal
                text='"A mathematician is a machine for turning coffee into theorems."'
                delay={18}
                stagger={5}
                fontSize={66}
                color={ERDOS_COLORS.chalk}
                italic
              />
            </div>

            {/* Attribution */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                opacity: fadeIn(frame, fps, 0.7, 160),
                transform: `translateY(${interpolate(
                  spring({ frame: frame - 160, fps, config: SPRING_CONFIGS.smooth }),
                  [0, 1],
                  [20, 0],
                )}px)`,
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 2,
                  backgroundColor: ERDOS_COLORS.goldProof,
                  boxShadow: `0 0 8px ${ERDOS_COLORS.goldProof}`,
                }}
              />
              <div
                style={{
                  fontSize: 28,
                  color: ERDOS_COLORS.goldProof,
                  fontStyle: "italic",
                  letterSpacing: "0.04em",
                }}
              >
                Paul Erdős, 1913–1996
              </div>
              <div
                style={{
                  width: 50,
                  height: 2,
                  backgroundColor: ERDOS_COLORS.goldProof,
                  boxShadow: `0 0 8px ${ERDOS_COLORS.goldProof}`,
                }}
              />
            </div>

            <GlowDivider delay={8} maxWidth={900} />
          </AbsoluteFill>
        </Sequence>

        {/* ── Part 2: Stats (420–720) ── */}
        <Sequence from={420} durationInFrames={300}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 60,
            }}
          >
            {/* "The Numbers" header */}
            <div
              style={{
                fontSize: 22,
                color: ERDOS_COLORS.goldProof,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                opacity: fadeIn(frame - 420, fps, 0.5, 0),
              }}
            >
              The Numbers
            </div>

            {/* Two giant counters */}
            <div style={{ display: "flex", gap: 160, alignItems: "flex-end" }}>
              {/* Papers */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  opacity: fadeIn(frame - 420, fps, 0.4, 10),
                }}
              >
                <BigCounter
                  target={1525}
                  delay={430}
                  fontSize={130}
                  color={ERDOS_COLORS.goldProof}
                />
                <div
                  style={{
                    fontSize: 24,
                    color: ERDOS_COLORS.chalk,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    opacity: 0.8,
                  }}
                >
                  papers
                </div>
              </div>

              {/* Vertical divider */}
              <div
                style={{
                  width: 1,
                  height: 160,
                  background: `linear-gradient(180deg, transparent, ${ERDOS_COLORS.chalk}30, transparent)`,
                }}
              />

              {/* Collaborators */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  opacity: fadeIn(frame - 420, fps, 0.4, 25),
                }}
              >
                <BigCounter
                  target={511}
                  delay={445}
                  fontSize={130}
                  color={ERDOS_COLORS.graphEdge}
                />
                <div
                  style={{
                    fontSize: 24,
                    color: ERDOS_COLORS.chalk,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    opacity: 0.8,
                  }}
                >
                  collaborators
                </div>
              </div>
            </div>

            {/* Erdős number badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                backgroundColor: `${ERDOS_COLORS.goldProof}15`,
                border: `1px solid ${ERDOS_COLORS.goldProof}50`,
                borderRadius: 40,
                padding: "12px 32px",
                opacity: fadeIn(frame - 420, fps, 0.5, 80),
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: ERDOS_COLORS.goldProof,
                }}
              />
              <div style={{ fontSize: 20, color: ERDOS_COLORS.goldProof, letterSpacing: "0.12em" }}>
                ERDŐS NUMBER — THE ORIGINAL COLLABORATION GRAPH
              </div>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: ERDOS_COLORS.goldProof,
                }}
              />
            </div>
          </AbsoluteFill>
        </Sequence>

        {/* ── Part 3: God's Book (720–900) ── */}
        <Sequence from={720} durationInFrames={180}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 50,
            }}
          >
            {/* Glowing book */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: fadeIn(frame - 720, fps, 0.6, 0),
              }}
            >
              <LightRays delay={722} color={ERDOS_COLORS.goldProof} count={16} />
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  width: 110,
                  height: 130,
                  background: `linear-gradient(145deg, ${ERDOS_COLORS.goldProof}, #8B6914, ${ERDOS_COLORS.goldProof})`,
                  borderRadius: 6,
                  boxShadow: `
                    0 0 60px ${ERDOS_COLORS.goldProof}80,
                    0 0 120px ${ERDOS_COLORS.goldProof}40,
                    inset 2px 0 6px rgba(255,255,255,0.3)
                  `,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${interpolate(
                    spring({ frame: frame - 720, fps, config: SPRING_CONFIGS.bouncy }),
                    [0, 1],
                    [0.2, 1],
                  )})`,
                }}
              >
                <div style={{ fontSize: 44 }}>📖</div>
              </div>
            </div>

            {/* Text */}
            <div style={{ textAlign: "center", maxWidth: 1000 }}>
              <WordReveal
                text="He believed the best proofs existed in God's Book."
                delay={740}
                stagger={4}
                fontSize={40}
                color={ERDOS_COLORS.chalk}
              />
            </div>
          </AbsoluteFill>
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
