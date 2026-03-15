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
import { ERDOS_COLORS } from "../../../core-logic/erdos-constants";
import { WordReveal, GlowDivider } from "../../components/ui/ErdosHelpers";
import { fadeIn } from "../../lib/animations";

/** Mini radial graph for comparison panels */
function MiniGraph({
  cx,
  cy,
  radius,
  nodeColor,
  edgeColor,
  centerLabel,
  nodeCount,
  delay,
}: {
  cx: number;
  cy: number;
  radius: number;
  nodeColor: string;
  edgeColor: string;
  centerLabel: string;
  nodeCount: number;
  delay: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const centerP = spring({ frame: frame - delay, fps, config: SPRING_CONFIGS.bouncy });
  const glowPulse = Math.sin((frame - delay) * 0.07) * 0.35 + 0.65;

  return (
    <svg width={cx * 2} height={cy * 2}>
      {/* Edges */}
      {Array.from({ length: nodeCount }, (_, i) => {
        const angle = (i / nodeCount) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const p = spring({ frame: frame - delay - 12 - i * 3, fps, config: SPRING_CONFIGS.gentle });
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={interpolate(p, [0, 1], [cx, x])}
            y2={interpolate(p, [0, 1], [cy, y])}
            stroke={edgeColor}
            strokeWidth={1.2}
            opacity={interpolate(p, [0, 0.4], [0, 0.5], { extrapolateRight: "clamp" })}
          />
        );
      })}
      {/* Center */}
      <circle
        cx={cx}
        cy={cy}
        r={interpolate(centerP, [0, 1], [0, 26])}
        fill={nodeColor}
        opacity={0.9}
        style={{ filter: `drop-shadow(0 0 ${14 * glowPulse}px ${nodeColor})` }}
      />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={11} fontWeight={800} fill="#000">
        {centerLabel}
      </text>
      {/* Outer nodes */}
      {Array.from({ length: nodeCount }, (_, i) => {
        const angle = (i / nodeCount) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const p = spring({ frame: frame - delay - 15 - i * 3, fps, config: SPRING_CONFIGS.snappy });
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={interpolate(p, [0, 1], [0, 14])}
            fill={nodeColor}
            opacity={0.7}
          />
        );
      })}
    </svg>
  );
}

export const Scene04_StrangeLoopConnection: FC = () => {
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
      {/* Subtle background grid */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(${ERDOS_COLORS.chalk}08 1px, transparent 1px),
            linear-gradient(90deg, ${ERDOS_COLORS.chalk}08 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* ── Part 1: Title (0–120) ── */}
      <Sequence from={0} durationInFrames={120}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: ERDOS_COLORS.mobiusGlow,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              opacity: fadeIn(frame, fps, 0.4, 5),
            }}
          >
            Hofstadter · Strange Loop · spike.land
          </div>
          <WordReveal
            text="From Erdős to Here"
            delay={15}
            stagger={12}
            fontSize={90}
            color={ERDOS_COLORS.chalk}
          />
        </AbsoluteFill>
      </Sequence>

      {/* ── Part 2: Side-by-side comparison (120–780) ── */}
      <Sequence from={120} durationInFrames={660}>
        <AbsoluteFill style={{ display: "flex", flexDirection: "row" }}>
          {/* Left: Math World */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
              background: `linear-gradient(135deg, ${ERDOS_COLORS.blackboard}, #0d1800)`,
              borderRight: `1px solid ${ERDOS_COLORS.chalk}15`,
              padding: "40px 60px",
              opacity: fadeIn(frame - 120, fps, 0.5, 0),
            }}
          >
            <div
              style={{
                fontSize: 13,
                letterSpacing: "0.35em",
                color: ERDOS_COLORS.goldProof,
                textTransform: "uppercase",
              }}
            >
              Mathematics · 1913–1996
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: ERDOS_COLORS.chalk }}>
              Erdős Collaboration Graph
            </div>
            <MiniGraph
              cx={230}
              cy={230}
              radius={180}
              nodeColor={ERDOS_COLORS.goldProof}
              edgeColor={`${ERDOS_COLORS.goldProof}80`}
              centerLabel="Erdős"
              nodeCount={12}
              delay={145}
            />
            <div
              style={{
                fontSize: 16,
                color: ERDOS_COLORS.chalk,
                opacity: 0.6,
                textAlign: "center",
                maxWidth: 340,
                lineHeight: 1.5,
              }}
            >
              511 collaborators · 1,525 papers
              <br />
              Grows by co-authorship
            </div>
          </div>

          {/* Center portal */}
          <div
            style={{
              width: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              flexShrink: 0,
            }}
          >
            {/* Vertical gradient line */}
            <div
              style={{
                width: 2,
                height: "70%",
                background: `linear-gradient(180deg, transparent, ${ERDOS_COLORS.mobiusGlow}80, transparent)`,
              }}
            />
            {/* Center symbol */}
            <div
              style={{
                position: "absolute",
                width: 50,
                height: 50,
                borderRadius: "50%",
                backgroundColor: ERDOS_COLORS.blackboard,
                border: `2px solid ${ERDOS_COLORS.mobiusGlow}80`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                color: ERDOS_COLORS.mobiusGlow,
                boxShadow: `0 0 20px ${ERDOS_COLORS.mobiusGlow}40`,
                opacity: fadeIn(frame - 120, fps, 0.4, 30),
              }}
            >
              ∞
            </div>
          </div>

          {/* Right: Digital World */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
              background: `linear-gradient(135deg, ${ERDOS_COLORS.blackboard}, #001018)`,
              borderLeft: `1px solid ${ERDOS_COLORS.chalk}15`,
              padding: "40px 60px",
              opacity: fadeIn(frame - 120, fps, 0.5, 15),
            }}
          >
            <div
              style={{
                fontSize: 13,
                letterSpacing: "0.35em",
                color: COLORS.cyan,
                textTransform: "uppercase",
              }}
            >
              spike.land · 2024–present
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: ERDOS_COLORS.chalk }}>
              MCP Tool Graph
            </div>
            <MiniGraph
              cx={230}
              cy={230}
              radius={180}
              nodeColor={COLORS.cyan}
              edgeColor={`${COLORS.cyan}70`}
              centerLabel="MCP"
              nodeCount={12}
              delay={160}
            />
            <div
              style={{
                fontSize: 16,
                color: ERDOS_COLORS.chalk,
                opacity: 0.6,
                textAlign: "center",
                maxWidth: 340,
                lineHeight: 1.5,
              }}
            >
              80+ tools · self-describing system
              <br />
              Grows by composition
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Part 3: Equation morphing (780–1000) ── */}
      <Sequence from={780} durationInFrames={220}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 36,
          }}
        >
          <GlowDivider delay={785} maxWidth={800} color={ERDOS_COLORS.mobiusGlow} />

          {/* Math equation */}
          <div
            style={{
              opacity: fadeIn(frame - 780, fps, 0.5, 0),
              transform: `translateY(${interpolate(
                spring({ frame: frame - 780, fps, config: SPRING_CONFIGS.gentle }),
                [0, 1],
                [20, 0],
              )}px)`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontFamily: TYPOGRAPHY.fontFamily.mono,
                color: ERDOS_COLORS.goldProof,
                letterSpacing: "0.06em",
              }}
            >
              d(you, Erdős) = min hops in G
            </div>
          </div>

          <div style={{ fontSize: 32, color: ERDOS_COLORS.chalk, opacity: 0.4 }}>⟶</div>

          {/* Contact function */}
          <div
            style={{
              opacity: fadeIn(frame - 780, fps, 0.5, 60),
              transform: `translateY(${interpolate(
                spring({ frame: frame - 840, fps, config: SPRING_CONFIGS.gentle }),
                [0, 1],
                [20, 0],
              )}px)`,
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontFamily: TYPOGRAPHY.fontFamily.mono,
                color: COLORS.cyan,
                letterSpacing: "0.06em",
              }}
            >
              Contact₁(S, you, t; m) = 1
            </div>
          </div>

          <GlowDivider delay={785} maxWidth={800} color={ERDOS_COLORS.mobiusGlow} />
        </AbsoluteFill>
      </Sequence>

      {/* ── Part 4: Summary (1000–1200) ── */}
      <Sequence from={1000} durationInFrames={200}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            padding: "0 160px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <WordReveal
              text="Erdős measured how ideas travel."
              delay={1010}
              stagger={5}
              fontSize={40}
              color={ERDOS_COLORS.chalk}
            />
          </div>
          <div style={{ textAlign: "center" }}>
            <WordReveal
              text="We measured whether they arrive."
              delay={1055}
              stagger={4}
              fontSize={40}
              color={COLORS.cyan}
            />
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
