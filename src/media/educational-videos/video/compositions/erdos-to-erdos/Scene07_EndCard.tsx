import { type FC } from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, TYPOGRAPHY, SPRING_CONFIGS } from "../../../core-logic/constants";
import { ERDOS_COLORS, ERDOS_COLLABORATORS } from "../../../core-logic/erdos-constants";
import { WordReveal, GlowDivider, LightRays } from "../../components/ui/ErdosHelpers";
import { SpikeLandLogo } from "../../components/branding/SpikeLandLogo";
import { GradientMesh } from "../../components/branding/GradientMesh";
import { fadeIn } from "../../lib/animations";

const TEXT_LINES = [
  { text: "Paul Erdős: 1,525 papers.", color: ERDOS_COLORS.goldProof, delay: 0 },
  { text: "Zoltan Erdős: 80+ MCP tools.", color: COLORS.cyan, delay: 55 },
  { text: "Different Book. Same method.", color: ERDOS_COLORS.chalk, delay: 120 },
  { text: "The system that describes itself.", color: ERDOS_COLORS.mobiusGlow, delay: 195 },
  {
    text: "The audit that is itself a vertex in the graph.",
    color: ERDOS_COLORS.chalk,
    delay: 270,
  },
];

function FinalGraph({ delay }: { delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cx = 960;
  const cy = 520;
  const R = 280;
  const collab = ERDOS_COLLABORATORS;
  const zDelay = delay + 70;
  const zP = spring({ frame: frame - zDelay, fps, config: SPRING_CONFIGS.bouncy });
  const zPulse = Math.sin((frame - zDelay) * 0.08) * 0.4 + 0.6;

  // Extra "Z" node position — slightly beyond the ring
  const zAngle = ((collab.length - 0.5) / collab.length) * Math.PI * 2 - Math.PI / 2;
  const zX = cx + Math.cos(zAngle) * (R + 80);
  const zY = cy + Math.sin(zAngle) * (R + 80);
  const nearAngle = ((collab.length - 1) / collab.length) * Math.PI * 2 - Math.PI / 2;
  const nearX = cx + Math.cos(nearAngle) * R;
  const nearY = cy + Math.sin(nearAngle) * R;

  return (
    <div style={{ position: "relative", width: 1920, height: 1040 }}>
      <svg width={1920} height={1040} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Edges from center */}
        {collab.map((_, i) => {
          const angle = (i / collab.length) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(angle) * R;
          const y = cy + Math.sin(angle) * R;
          const p = spring({
            frame: frame - delay - 12 - i * 2,
            fps,
            config: SPRING_CONFIGS.gentle,
          });
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={interpolate(p, [0, 1], [cx, x])}
              y2={interpolate(p, [0, 1], [cy, y])}
              stroke={`${ERDOS_COLORS.goldProof}60`}
              strokeWidth={1.2}
              opacity={interpolate(p, [0, 0.3], [0, 0.5], { extrapolateRight: "clamp" })}
            />
          );
        })}

        {/* Z node connection (dashed cyan) */}
        <line
          x1={nearX}
          y1={nearY}
          x2={interpolate(zP, [0, 1], [nearX, zX])}
          y2={interpolate(zP, [0, 1], [nearY, zY])}
          stroke={COLORS.cyan}
          strokeWidth={2}
          strokeDasharray="8 5"
          opacity={interpolate(zP, [0, 0.3], [0, 0.85], { extrapolateRight: "clamp" })}
        />
      </svg>

      {/* Erdős center */}
      <div
        style={{
          position: "absolute",
          left: cx - 34,
          top: cy - 34,
          width: 68,
          height: 68,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ERDOS_COLORS.goldProof}, #705210)`,
          boxShadow: `0 0 40px ${ERDOS_COLORS.goldProof}80`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${spring({ frame: frame - delay, fps, config: SPRING_CONFIGS.bouncy })})`,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 800, color: "#000" }}>Erdős</span>
      </div>

      {/* Collaborator nodes */}
      {collab.map((name, i) => {
        const angle = (i / collab.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * R;
        const y = cy + Math.sin(angle) * R;
        const p = spring({ frame: frame - delay - 15 - i * 2, fps, config: SPRING_CONFIGS.snappy });

        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: x - 18,
              top: y - 18,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: `${ERDOS_COLORS.goldProof}cc`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${p})`,
              opacity: interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
              zIndex: 5,
            }}
          />
        );
      })}

      {/* "Z" node */}
      <div
        style={{
          position: "absolute",
          left: zX - 32,
          top: zY - 32,
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.cyan}, ${COLORS.cyan}80)`,
          boxShadow: `0 0 ${30 * zPulse}px ${COLORS.cyan}90, 0 0 60px ${COLORS.cyan}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${zP})`,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 22, fontWeight: 900, color: "#000" }}>Z</span>
      </div>

      {/* Label for Z */}
      <div
        style={{
          position: "absolute",
          left: zX,
          top: zY + 40,
          transform: "translateX(-50%)",
          fontSize: 14,
          color: COLORS.cyan,
          fontWeight: 700,
          opacity: interpolate(zP, [0, 0.5], [0, 0.9], { extrapolateRight: "clamp" }),
          letterSpacing: "0.06em",
          whiteSpace: "nowrap",
        }}
      >
        Connected by Strange Loop
      </div>
    </div>
  );
}

export const Scene07_EndCard: FC = () => {
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
      {/* ── Part 1: Graph with Z node (0–480) ── */}
      <Sequence from={0} durationInFrames={480}>
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FinalGraph delay={10} />
        </AbsoluteFill>

        {/* Top label */}
        <div
          style={{
            position: "absolute",
            top: 50,
            left: "50%",
            transform: "translateX(-50%)",
            opacity: fadeIn(frame, fps, 0.5, 20),
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: ERDOS_COLORS.goldProof,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            The Graph Grows
          </div>
        </div>
      </Sequence>

      {/* ── Part 2: Text sequence (480–960) ── */}
      <Sequence from={480} durationInFrames={480}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 22,
            padding: "0 180px",
          }}
        >
          <GlowDivider delay={485} maxWidth={900} color={ERDOS_COLORS.goldProof} />

          {TEXT_LINES.map((line, i) => {
            const lineDelay = 492 + line.delay;
            const lineP = spring({ frame: frame - lineDelay, fps, config: SPRING_CONFIGS.snappy });
            const isLarge = i === 2;

            return (
              <div
                key={line.text}
                style={{
                  opacity: interpolate(lineP, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
                  transform: `translateX(${interpolate(lineP, [0, 1], [-40, 0])}px)`,
                  textAlign: "center",
                  maxWidth: 1300,
                }}
              >
                <div
                  style={{
                    fontSize: isLarge ? 44 : 34,
                    fontWeight: isLarge ? 900 : 700,
                    color: line.color,
                    fontFamily: TYPOGRAPHY.fontFamily.sans,
                    filter: isLarge ? `drop-shadow(0 0 12px ${line.color}60)` : "none",
                    letterSpacing: isLarge ? "0.02em" : "normal",
                  }}
                >
                  {line.text}
                </div>
              </div>
            );
          })}

          <GlowDivider delay={800} maxWidth={900} color={COLORS.cyan} />
        </AbsoluteFill>
      </Sequence>

      {/* ── Part 3: Logo + final line (960–1200) ── */}
      <Sequence from={960} durationInFrames={240}>
        <AbsoluteFill>
          <GradientMesh animationSpeed={0.015} opacity={0.5} />

          {/* Rays from center */}
          <AbsoluteFill
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ position: "relative" }}>
              <LightRays delay={962} color={ERDOS_COLORS.goldProof} count={20} />
              <div style={{ position: "relative", zIndex: 2 }}>
                {/* invisible spacer to center the rays */}
                <div style={{ width: 1, height: 1 }} />
              </div>
            </div>
          </AbsoluteFill>

          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 40,
            }}
          >
            <SpikeLandLogo size={150} delay={968} />

            <div style={{ textAlign: "center" }}>
              <WordReveal
                text="The structure is real."
                delay={1010}
                stagger={10}
                fontSize={54}
                color={ERDOS_COLORS.goldProof}
              />
            </div>

            <div
              style={{
                fontSize: 18,
                color: ERDOS_COLORS.chalk,
                opacity: fadeIn(frame - 960, fps, 0.5, 120) * 0.5,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              spike.land
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
