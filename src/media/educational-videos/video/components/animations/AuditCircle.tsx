import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING_CONFIGS } from "../../../core-logic/constants";
import {
  ERDOS_COLORS,
  SIXTEEN_FRAMEWORKS,
  AUDIT_VERDICTS,
} from "../../../core-logic/erdos-constants";

type AuditCircleProps = {
  delay?: number;
  showVerdicts?: boolean;
};

export function AuditCircle({ delay = 0, showVerdicts = true }: AuditCircleProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cx = 540;
  const cy = 300;
  const radius = 240;

  return (
    <div style={{ position: "relative", width: 1080, height: 600 }}>
      {/* Connection lines (subtle) */}
      <svg width={1080} height={600} style={{ position: "absolute", top: 0, left: 0 }}>
        {SIXTEEN_FRAMEWORKS.map((_, i) => {
          const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          const nextAngle = ((i + 1) / 16) * Math.PI * 2 - Math.PI / 2;
          const nx = cx + Math.cos(nextAngle) * radius;
          const ny = cy + Math.sin(nextAngle) * radius;
          const lineProgress = spring({
            frame: frame - delay - 5 - i * 4,
            fps,
            config: SPRING_CONFIGS.gentle,
          });

          return (
            <line
              key={`line-${i}`}
              x1={x}
              y1={y}
              x2={interpolate(lineProgress, [0, 1], [x, nx])}
              y2={interpolate(lineProgress, [0, 1], [y, ny])}
              stroke={ERDOS_COLORS.chalk}
              strokeWidth={1}
              opacity={interpolate(lineProgress, [0, 0.3], [0, 0.2], { extrapolateRight: "clamp" })}
            />
          );
        })}
      </svg>

      {/* Framework nodes */}
      {SIXTEEN_FRAMEWORKS.map((fw, i) => {
        const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        const nodeProgress = spring({
          frame: frame - delay - i * 4,
          fps,
          config: SPRING_CONFIGS.snappy,
        });

        // Check if this node has a verdict
        const verdict = showVerdicts ? AUDIT_VERDICTS.find((v) => v.index === i) : undefined;
        const verdictDelay = delay + 16 * 4 + 30; // After all nodes appear
        const verdictProgress = verdict
          ? spring({
              frame: frame - verdictDelay - AUDIT_VERDICTS.indexOf(verdict) * 12,
              fps,
              config: SPRING_CONFIGS.bouncy,
            })
          : 0;

        const nodeColor = verdict
          ? verdict.verdict === "pass"
            ? ERDOS_COLORS.verdictPass
            : ERDOS_COLORS.verdictFail
          : ERDOS_COLORS.graphEdge;

        const borderColor = interpolate(verdictProgress, [0, 1], [0, 1]);

        return (
          <div key={fw.name}>
            {/* Node circle */}
            <div
              style={{
                position: "absolute",
                left: x - 28,
                top: y - 28,
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: `${ERDOS_COLORS.blackboard}ee`,
                border: `2px solid ${borderColor > 0.5 ? nodeColor : ERDOS_COLORS.graphEdge}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${nodeProgress})`,
                boxShadow: verdictProgress > 0.5 ? `0 0 12px ${nodeColor}60` : "none",
                transition: "box-shadow 0.3s",
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  color: borderColor > 0.5 ? nodeColor : ERDOS_COLORS.chalk,
                  fontWeight: 600,
                }}
              >
                {fw.icon}
              </span>
            </div>

            {/* Label */}
            <div
              style={{
                position: "absolute",
                left: x,
                top: y + 34,
                transform: "translateX(-50%)",
                fontSize: 10,
                color: ERDOS_COLORS.chalk,
                opacity: interpolate(nodeProgress, [0, 0.5], [0, 0.7], {
                  extrapolateRight: "clamp",
                }),
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              {fw.name}
            </div>

            {/* Verdict badge */}
            {verdict && verdictProgress > 0.1 && (
              <div
                style={{
                  position: "absolute",
                  left: x + 18,
                  top: y - 36,
                  transform: `scale(${verdictProgress})`,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {verdict.verdict === "pass" ? "✓" : "✗"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
