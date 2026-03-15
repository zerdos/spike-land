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
  LightRays,
} from "../../components/ui/ErdosHelpers";
import { fadeIn } from "../../lib/animations";

const THEOREMS = [
  {
    title: "Ramsey Theory",
    greek: "R(r,s)",
    desc: "Complete disorder is impossible. Given enough structure, patterns always emerge.",
    color: ERDOS_COLORS.goldProof,
  },
  {
    title: "Probabilistic Method",
    greek: "∃ x: P(x)>0",
    desc: "Prove a mathematical object exists without constructing it — pure existence.",
    color: ERDOS_COLORS.mobiusGlow,
  },
  {
    title: "Prime Gaps",
    greek: "pₙ₊₁ − pₙ",
    desc: "There are always primes close together, closer than you expect.",
    color: ERDOS_COLORS.graphEdge,
  },
];

export const Scene03_TheBook: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: ERDOS_COLORS.blackboard,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        overflow: "hidden",
      }}
    >
      <ChalkParticles count={22} />

      {/* ── Part 1: The Book Quote (0–240) ── */}
      <Sequence from={0} durationInFrames={240}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            padding: "0 140px",
          }}
        >
          {/* Glowing book icon */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: fadeIn(frame, fps, 0.5, 0),
            }}
          >
            <LightRays delay={0} color={ERDOS_COLORS.goldProof} count={10} />
            <div
              style={{
                position: "relative",
                zIndex: 2,
                width: 80,
                height: 96,
                background: `linear-gradient(145deg, ${ERDOS_COLORS.goldProof}, #705208)`,
                borderRadius: 4,
                boxShadow: `0 0 40px ${ERDOS_COLORS.goldProof}80`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                transform: `scale(${spring({ frame, fps, config: SPRING_CONFIGS.bouncy })})`,
              }}
            >
              📖
            </div>
          </div>

          <GlowDivider delay={20} maxWidth={700} />

          <div style={{ textAlign: "center", maxWidth: 1300 }}>
            <WordReveal
              text={`"You don't have to believe in God, but you should believe in The Book."`}
              delay={28}
              stagger={4}
              fontSize={52}
              color={ERDOS_COLORS.chalk}
              italic
            />
          </div>

          <GlowDivider delay={20} maxWidth={700} />
        </AbsoluteFill>
      </Sequence>

      {/* ── Part 2: Theorem Cards (240–600) ── */}
      <Sequence from={240} durationInFrames={360}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: ERDOS_COLORS.goldProof,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              opacity: fadeIn(frame - 240, fps, 0.4, 0),
            }}
          >
            Proofs from The Book
          </div>

          {/* Three theorem cards */}
          <div style={{ display: "flex", gap: 40, alignItems: "stretch" }}>
            {THEOREMS.map((theorem, i) => {
              const cardDelay = 255 + i * 20;
              const cardP = spring({
                frame: frame - cardDelay,
                fps,
                config: SPRING_CONFIGS.snappy,
              });
              const glowIntensity = Math.sin((frame - cardDelay) * 0.05 + i) * 0.3 + 0.7;

              return (
                <div
                  key={theorem.title}
                  style={{
                    width: 380,
                    background: `linear-gradient(145deg, ${ERDOS_COLORS.blackboard}ee, #0d1a0d)`,
                    border: `1px solid ${theorem.color}60`,
                    borderRadius: 12,
                    padding: "32px 30px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    transform: `scale(${interpolate(cardP, [0, 1], [0.7, 1])}) translateY(${interpolate(cardP, [0, 1], [40, 0])}px)`,
                    opacity: interpolate(cardP, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
                    boxShadow: `0 0 ${20 * glowIntensity}px ${theorem.color}30`,
                  }}
                >
                  {/* Greek expression */}
                  <div
                    style={{
                      fontSize: 36,
                      fontFamily: "serif",
                      color: theorem.color,
                      filter: `drop-shadow(0 0 10px ${theorem.color}80)`,
                      textAlign: "center",
                    }}
                  >
                    {theorem.greek}
                  </div>

                  <div
                    style={{
                      height: 1,
                      backgroundColor: `${theorem.color}40`,
                    }}
                  />

                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: theorem.color,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {theorem.title}
                  </div>

                  <div
                    style={{
                      fontSize: 15,
                      color: ERDOS_COLORS.chalk,
                      lineHeight: 1.6,
                      opacity: 0.8,
                    }}
                  >
                    {theorem.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Part 3: The Method (600–750) ── */}
      <Sequence from={600} durationInFrames={150}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 1100 }}>
            <WordReveal
              text="He didn't just solve problems."
              delay={610}
              stagger={5}
              fontSize={46}
              color={ERDOS_COLORS.chalk}
            />
          </div>
          <div style={{ textAlign: "center", maxWidth: 1100 }}>
            <WordReveal
              text="He created the method for solving problems."
              delay={650}
              stagger={4}
              fontSize={46}
              color={ERDOS_COLORS.goldProof}
            />
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
