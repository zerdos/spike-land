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
import {
  ERDOS_COLORS,
  SIXTEEN_FRAMEWORKS,
  AUDIT_VERDICTS,
} from "../../../core-logic/erdos-constants";
import { ChalkParticles, WordReveal, GlowDivider } from "../../components/ui/ErdosHelpers";
import { fadeIn } from "../../lib/animations";

function TheCircle({ delay, showVerdicts }: { delay: number; showVerdicts: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cx = 960;
  const cy = 500;
  const R = 310;

  return (
    <div style={{ position: "relative", width: 1920, height: 1000 }}>
      {/* Background ring */}
      <svg width={1920} height={1000} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Faint outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={R + 50}
          fill="none"
          stroke={`${ERDOS_COLORS.chalk}10`}
          strokeWidth={1}
          strokeDasharray="3 6"
        />
        {/* Inner ring */}
        <circle
          cx={cx}
          cy={cy}
          r={R - 50}
          fill="none"
          stroke={`${ERDOS_COLORS.chalk}08`}
          strokeWidth={1}
        />

        {/* Connection lines between adjacent nodes */}
        {SIXTEEN_FRAMEWORKS.map((_, i) => {
          const nextI = (i + 1) % 16;
          const a1 = (i / 16) * Math.PI * 2 - Math.PI / 2;
          const a2 = (nextI / 16) * Math.PI * 2 - Math.PI / 2;
          const x1 = cx + Math.cos(a1) * R;
          const y1 = cy + Math.sin(a1) * R;
          const x2 = cx + Math.cos(a2) * R;
          const y2 = cy + Math.sin(a2) * R;
          const p = spring({
            frame: frame - delay - 5 - i * 3,
            fps,
            config: SPRING_CONFIGS.gentle,
          });
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={interpolate(p, [0, 1], [x1, x2])}
              y2={interpolate(p, [0, 1], [y1, y2])}
              stroke={`${ERDOS_COLORS.chalk}18`}
              strokeWidth={0.8}
            />
          );
        })}
      </svg>

      {/* Framework nodes */}
      {SIXTEEN_FRAMEWORKS.map((fw, i) => {
        const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * R;
        const y = cy + Math.sin(angle) * R;
        const nodeP = spring({ frame: frame - delay - i * 3, fps, config: SPRING_CONFIGS.snappy });

        const verdict = showVerdicts ? AUDIT_VERDICTS.find((v) => v.index === i) : undefined;
        const verdictDelay = delay + 16 * 3 + 40;
        const verdictIdx = verdict ? AUDIT_VERDICTS.indexOf(verdict) : 0;
        const verdictP = verdict
          ? spring({
              frame: frame - verdictDelay - verdictIdx * 15,
              fps,
              config: SPRING_CONFIGS.bouncy,
            })
          : 0;

        const isPass = verdict?.verdict === "pass";
        const nodeColor =
          verdict && verdictP > 0.5
            ? isPass
              ? ERDOS_COLORS.verdictPass
              : ERDOS_COLORS.verdictFail
            : ERDOS_COLORS.graphEdge;

        const glowPulse = Math.sin((frame - delay) * 0.05 + i * 0.4) * 0.3 + 0.7;

        // Label position (slightly outside the ring)
        const labelR = R + 48;
        const lx = cx + Math.cos(angle) * labelR;
        const ly = cy + Math.sin(angle) * labelR;

        return (
          <div key={fw.name}>
            {/* Node circle */}
            <div
              style={{
                position: "absolute",
                left: x - 30,
                top: y - 30,
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: `${nodeColor}25`,
                border: `2px solid ${nodeColor}80`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${nodeP})`,
                opacity: interpolate(nodeP, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
                boxShadow:
                  verdict && verdictP > 0.5 ? `0 0 ${20 * glowPulse}px ${nodeColor}60` : "none",
                zIndex: 5,
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  color: nodeColor,
                  fontFamily: "serif",
                }}
              >
                {fw.icon}
              </span>
            </div>

            {/* Framework name label */}
            <div
              style={{
                position: "absolute",
                left: lx,
                top: ly,
                transform: "translate(-50%, -50%)",
                fontSize: 11,
                color: ERDOS_COLORS.chalk,
                opacity: interpolate(nodeP, [0, 0.5], [0, 0.7], { extrapolateRight: "clamp" }),
                whiteSpace: "nowrap",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {fw.name}
            </div>

            {/* Verdict badge */}
            {verdict && verdictP > 0.1 && (
              <div
                style={{
                  position: "absolute",
                  left: x + 16,
                  top: y - 40,
                  fontSize: 22,
                  fontWeight: 900,
                  color: isPass ? ERDOS_COLORS.verdictPass : ERDOS_COLORS.verdictFail,
                  transform: `scale(${verdictP})`,
                  filter: `drop-shadow(0 0 8px ${isPass ? ERDOS_COLORS.verdictPass : ERDOS_COLORS.verdictFail}80)`,
                  zIndex: 10,
                }}
              >
                {isPass ? "✓" : "✗"}
              </div>
            )}

            {/* Verdict label */}
            {verdict && verdictP > 0.5 && (
              <div
                style={{
                  position: "absolute",
                  left: x,
                  top: y + 36,
                  transform: "translateX(-50%)",
                  fontSize: 10,
                  color: isPass ? ERDOS_COLORS.verdictPass : ERDOS_COLORS.verdictFail,
                  opacity: interpolate(verdictP, [0.5, 1], [0, 0.9], { extrapolateRight: "clamp" }),
                  whiteSpace: "nowrap",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                {verdict.label}
              </div>
            )}
          </div>
        );
      })}

      {/* Center text */}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy,
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          opacity: fadeIn(frame - delay, fps, 0.5, 30),
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: ERDOS_COLORS.goldProof,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
          }}
        >
          The Audit
        </div>
        <div style={{ fontSize: 40, fontFamily: "serif", color: ERDOS_COLORS.chalk, opacity: 0.2 }}>
          ∮
        </div>
      </div>
    </div>
  );
}

export const Scene05_SixteenMathematicians: FC = () => {
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
      <ChalkParticles count={16} opacity={0.6} />

      {/* ── Part 1: Erdős quote (0–240) ── */}
      <Sequence from={0} durationInFrames={240}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            padding: "0 160px",
          }}
        >
          <GlowDivider delay={8} maxWidth={800} color={ERDOS_COLORS.goldProof} />
          <div style={{ textAlign: "center" }}>
            <WordReveal
              text={`"Show me the space. Show me the map.`}
              delay={18}
              stagger={5}
              fontSize={50}
              color={ERDOS_COLORS.chalk}
              italic
            />
          </div>
          <div style={{ textAlign: "center" }}>
            <WordReveal
              text={`Show me the contraction constant."`}
              delay={75}
              stagger={5}
              fontSize={50}
              color={ERDOS_COLORS.goldProof}
              italic
            />
          </div>
          <GlowDivider delay={8} maxWidth={800} color={ERDOS_COLORS.goldProof} />
        </AbsoluteFill>
      </Sequence>

      {/* ── Part 2: 16-node circle (240–840) ── */}
      <Sequence from={240} durationInFrames={600}>
        <AbsoluteFill>
          <TheCircle delay={250} showVerdicts />

          {/* Verdict summary bar at bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 40,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 50,
              opacity: fadeIn(frame - 240, fps, 0.4, 200),
            }}
          >
            {[
              { label: "3 Failed", color: ERDOS_COLORS.verdictFail, icon: "✗" },
              { label: "3 Passed", color: ERDOS_COLORS.verdictPass, icon: "✓" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22, color: item.color, fontWeight: 900 }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: 18, color: item.color, fontWeight: 700 }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ── Part 3: Erdős verdict (840–1200) ── */}
      <Sequence from={840} durationInFrames={360}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            padding: "0 180px",
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: ERDOS_COLORS.goldProof,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              opacity: fadeIn(frame - 840, fps, 0.4, 0),
            }}
          >
            The Verdict
          </div>
          <div style={{ textAlign: "center" }}>
            <WordReveal
              text={`"You have pointed at the mountain`}
              delay={856}
              stagger={5}
              fontSize={44}
              color={ERDOS_COLORS.chalk}
              italic
            />
          </div>
          <div style={{ textAlign: "center" }}>
            <WordReveal
              text={`and said 'there is gold up there.'"`}
              delay={900}
              stagger={5}
              fontSize={44}
              color={ERDOS_COLORS.chalk}
              italic
            />
          </div>
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <WordReveal
              text="Go mine it."
              delay={960}
              stagger={12}
              fontSize={72}
              color={ERDOS_COLORS.goldProof}
            />
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
