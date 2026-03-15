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
import { ERDOS_COLORS, ERDOS_COLLABORATORS } from "../../../core-logic/erdos-constants";
import { ChalkParticles, WordReveal, GlowRing } from "../../components/ui/ErdosHelpers";
import { fadeIn } from "../../lib/animations";

const INNER = ERDOS_COLLABORATORS.slice(0, 8);
const OUTER = ERDOS_COLLABORATORS.slice(8);

function CosmicGraph({ delay }: { delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cx = 960;
  const cy = 460;
  const r1 = 190;
  const r2 = 360;

  const ring1P = spring({ frame: frame - delay - 5, fps, config: SPRING_CONFIGS.slow });
  const ring2P = spring({ frame: frame - delay - 35, fps, config: SPRING_CONFIGS.slow });

  const centerP = spring({ frame: frame - delay, fps, config: SPRING_CONFIGS.bouncy });
  const glowPulse = Math.sin((frame - delay) * 0.07) * 0.4 + 0.6;

  return (
    <div style={{ position: "relative", width: 1920, height: 920 }}>
      {/* SVG for rings + edges */}
      <svg width={1920} height={920} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Dashed distance rings */}
        <circle
          cx={cx}
          cy={cy}
          r={r1 * ring1P}
          fill="none"
          stroke={`${ERDOS_COLORS.goldProof}50`}
          strokeWidth={1}
          strokeDasharray="6 4"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r2 * ring2P}
          fill="none"
          stroke={`${ERDOS_COLORS.graphEdge}40`}
          strokeWidth={1}
          strokeDasharray="6 4"
        />

        {/* Edges to inner ring */}
        {INNER.map((_, i) => {
          const angle = (i / INNER.length) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(angle) * r1;
          const y = cy + Math.sin(angle) * r1;
          const p = spring({
            frame: frame - delay - 18 - i * 4,
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
              stroke={`${ERDOS_COLORS.goldProof}70`}
              strokeWidth={1.5}
              opacity={interpolate(p, [0, 0.3], [0, 0.7], { extrapolateRight: "clamp" })}
            />
          );
        })}

        {/* Edges to outer ring */}
        {OUTER.map((_, i) => {
          const innerIdx = i % INNER.length;
          const innerAngle = (innerIdx / INNER.length) * Math.PI * 2 - Math.PI / 2;
          const nearX = cx + Math.cos(innerAngle) * r1;
          const nearY = cy + Math.sin(innerAngle) * r1;
          const outerAngle = (i / OUTER.length) * Math.PI * 2 - Math.PI / 3;
          const farX = cx + Math.cos(outerAngle) * r2;
          const farY = cy + Math.sin(outerAngle) * r2;
          const p = spring({
            frame: frame - delay - 70 - i * 4,
            fps,
            config: SPRING_CONFIGS.gentle,
          });
          return (
            <line
              key={i}
              x1={nearX}
              y1={nearY}
              x2={interpolate(p, [0, 1], [nearX, farX])}
              y2={interpolate(p, [0, 1], [nearY, farY])}
              stroke={`${ERDOS_COLORS.graphEdge}50`}
              strokeWidth={1}
              opacity={interpolate(p, [0, 0.3], [0, 0.5], { extrapolateRight: "clamp" })}
            />
          );
        })}
      </svg>

      {/* Center: Erdős gold star */}
      <div
        style={{
          position: "absolute",
          left: cx - 36,
          top: cy - 36,
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ERDOS_COLORS.goldProof}, #8B6914)`,
          boxShadow: `0 0 ${40 * glowPulse}px ${ERDOS_COLORS.goldProof}90, 0 0 80px ${ERDOS_COLORS.goldProof}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${interpolate(centerP, [0, 1], [0, 1])})`,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 800, color: "#000" }}>Erdős</span>
      </div>

      {/* Distance "1" label */}
      <div
        style={{
          position: "absolute",
          left: cx + r1 + 18,
          top: cy - 16,
          opacity: fadeIn(frame - delay, fps, 0.4, 35),
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: ERDOS_COLORS.goldProof,
            fontFamily: TYPOGRAPHY.fontFamily.mono,
          }}
        >
          1
        </div>
      </div>

      {/* Distance "2" label */}
      <div
        style={{
          position: "absolute",
          left: cx + r2 + 18,
          top: cy - 16,
          opacity: fadeIn(frame - delay, fps, 0.4, 65),
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: ERDOS_COLORS.graphEdge,
            fontFamily: TYPOGRAPHY.fontFamily.mono,
          }}
        >
          2
        </div>
      </div>

      {/* Inner ring nodes */}
      {INNER.map((name, i) => {
        const angle = (i / INNER.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * r1;
        const y = cy + Math.sin(angle) * r1;
        const p = spring({ frame: frame - delay - 22 - i * 4, fps, config: SPRING_CONFIGS.snappy });
        const labelR = r1 + 34;
        const lx = cx + Math.cos(angle) * labelR;
        const ly = cy + Math.sin(angle) * labelR;
        const nodePulse = Math.sin((frame - delay) * 0.06 + i) * 0.3 + 0.7;

        return (
          <div key={name}>
            <div
              style={{
                position: "absolute",
                left: x - 20,
                top: y - 20,
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${ERDOS_COLORS.goldProof}cc, ${ERDOS_COLORS.goldProof}60)`,
                boxShadow: `0 0 ${14 * nodePulse}px ${ERDOS_COLORS.goldProof}60`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${p})`,
                opacity: interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
                zIndex: 5,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: "#000" }}>1</span>
            </div>
            {/* Label */}
            <div
              style={{
                position: "absolute",
                left: lx,
                top: ly,
                transform: "translate(-50%, -50%)",
                fontSize: 11,
                color: ERDOS_COLORS.chalk,
                opacity: interpolate(p, [0, 0.5], [0, 0.75], { extrapolateRight: "clamp" }),
                whiteSpace: "nowrap",
                fontWeight: 600,
              }}
            >
              {name}
            </div>
          </div>
        );
      })}

      {/* Outer ring nodes */}
      {OUTER.map((name, i) => {
        const angle = (i / OUTER.length) * Math.PI * 2 - Math.PI / 3;
        const x = cx + Math.cos(angle) * r2;
        const y = cy + Math.sin(angle) * r2;
        const p = spring({ frame: frame - delay - 74 - i * 4, fps, config: SPRING_CONFIGS.snappy });
        const labelR = r2 + 30;
        const lx = cx + Math.cos(angle) * labelR;
        const ly = cy + Math.sin(angle) * labelR;

        return (
          <div key={name}>
            <div
              style={{
                position: "absolute",
                left: x - 16,
                top: y - 16,
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: `${ERDOS_COLORS.graphEdge}cc`,
                boxShadow: `0 0 10px ${ERDOS_COLORS.graphEdge}50`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${p})`,
                opacity: interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
                zIndex: 5,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, color: "#000" }}>2</span>
            </div>
            <div
              style={{
                position: "absolute",
                left: lx,
                top: ly,
                transform: "translate(-50%, -50%)",
                fontSize: 10,
                color: ERDOS_COLORS.chalk,
                opacity: interpolate(p, [0, 0.5], [0, 0.6], { extrapolateRight: "clamp" }),
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const Scene02_ErdosNumber: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0d1a0d",
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        overflow: "hidden",
      }}
    >
      <ChalkParticles count={18} opacity={0.5} />

      {/* ── Part 1: Title (0–100) ── */}
      <Sequence from={0} durationInFrames={100}>
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
              fontSize: 16,
              color: ERDOS_COLORS.goldProof,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              opacity: fadeIn(frame, fps, 0.4, 5),
            }}
          >
            The Original Social Network
          </div>
          <WordReveal
            text="The Erdős Number"
            delay={12}
            stagger={10}
            fontSize={88}
            color={ERDOS_COLORS.chalk}
          />
        </AbsoluteFill>
      </Sequence>

      {/* ── Part 2: Cosmic graph (100–620) ── */}
      <Sequence from={100} durationInFrames={520}>
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CosmicGraph delay={108} />
        </AbsoluteFill>
      </Sequence>

      {/* ── Part 3: Handshakes text (620–750) ── */}
      <Sequence from={620} durationInFrames={130}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <GlowRing size={120} color={ERDOS_COLORS.goldProof} />
          <div style={{ marginTop: 30, textAlign: "center" }}>
            <WordReveal
              text="Your Erdős number is how many handshakes separate you from the source."
              delay={630}
              stagger={4}
              fontSize={34}
              color={ERDOS_COLORS.chalk}
            />
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
