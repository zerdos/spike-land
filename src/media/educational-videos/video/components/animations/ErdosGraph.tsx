import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING_CONFIGS } from "../../../core-logic/constants";
import { ERDOS_COLORS, ERDOS_COLLABORATORS } from "../../../core-logic/erdos-constants";

type ErdosGraphProps = {
  delay?: number;
  showNumbers?: boolean;
  highlightNode?: string | null;
  extraNode?: { label: string; color: string } | null;
};

export function ErdosGraph({
  delay = 0,
  showNumbers = true,
  highlightNode = null,
  extraNode = null,
}: ErdosGraphProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const centerX = 480;
  const centerY = 270;
  const radius = 200;
  const collaborators = ERDOS_COLLABORATORS;

  // Center node (Erdős) entry
  const centerProgress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.bouncy,
  });

  return (
    <div
      style={{
        position: "relative",
        width: 960,
        height: 540,
      }}
    >
      {/* Edges */}
      <svg width={960} height={540} style={{ position: "absolute", top: 0, left: 0 }}>
        {collaborators.map((_, i) => {
          const angle = (i / collaborators.length) * Math.PI * 2 - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          const edgeProgress = spring({
            frame: frame - delay - 10 - i * 3,
            fps,
            config: SPRING_CONFIGS.gentle,
          });
          const lineOpacity = interpolate(edgeProgress, [0, 0.5], [0, 0.6], {
            extrapolateRight: "clamp",
          });

          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={interpolate(edgeProgress, [0, 1], [centerX, x])}
              y2={interpolate(edgeProgress, [0, 1], [centerY, y])}
              stroke={ERDOS_COLORS.graphEdge}
              strokeWidth={1.5}
              opacity={lineOpacity}
            />
          );
        })}

        {/* Extra node edge */}
        {extraNode &&
          (() => {
            const extraAngle =
              ((collaborators.length + 0.5) / (collaborators.length + 1)) * Math.PI * 2 -
              Math.PI / 2;
            const extraX = centerX + Math.cos(extraAngle) * (radius + 60);
            const extraY = centerY + Math.sin(extraAngle) * (radius + 60);
            const nearestAngle =
              ((collaborators.length - 1) / collaborators.length) * Math.PI * 2 - Math.PI / 2;
            const nearX = centerX + Math.cos(nearestAngle) * radius;
            const nearY = centerY + Math.sin(nearestAngle) * radius;
            const extraEdgeProgress = spring({
              frame: frame - delay - 60,
              fps,
              config: SPRING_CONFIGS.gentle,
            });

            return (
              <>
                <line
                  x1={nearX}
                  y1={nearY}
                  x2={interpolate(extraEdgeProgress, [0, 1], [nearX, extraX])}
                  y2={interpolate(extraEdgeProgress, [0, 1], [nearY, extraY])}
                  stroke={extraNode.color}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  opacity={interpolate(extraEdgeProgress, [0, 0.3], [0, 0.8], {
                    extrapolateRight: "clamp",
                  })}
                />
              </>
            );
          })()}
      </svg>

      {/* Center Erdős node */}
      <div
        style={{
          position: "absolute",
          left: centerX - 30,
          top: centerY - 30,
          width: 60,
          height: 60,
          borderRadius: "50%",
          backgroundColor: ERDOS_COLORS.goldProof,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${centerProgress})`,
          boxShadow: `0 0 20px ${ERDOS_COLORS.goldProof}80`,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: "#000" }}>Erdős</span>
      </div>

      {/* Collaborator nodes */}
      {collaborators.map((name, i) => {
        const angle = (i / collaborators.length) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const nodeProgress = spring({
          frame: frame - delay - 15 - i * 3,
          fps,
          config: SPRING_CONFIGS.snappy,
        });
        const isHighlighted = highlightNode === name;

        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: x - 20,
              top: y - 20,
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: isHighlighted ? ERDOS_COLORS.goldProof : ERDOS_COLORS.graphEdge,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${nodeProgress})`,
              opacity: interpolate(nodeProgress, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
              boxShadow: isHighlighted ? `0 0 15px ${ERDOS_COLORS.goldProof}60` : "none",
            }}
          >
            {showNumbers && <span style={{ fontSize: 16, fontWeight: 700, color: "#000" }}>1</span>}
          </div>
        );
      })}

      {/* Collaborator labels */}
      {collaborators.map((name, i) => {
        const angle = (i / collaborators.length) * Math.PI * 2 - Math.PI / 2;
        const labelRadius = radius + 35;
        const x = centerX + Math.cos(angle) * labelRadius;
        const y = centerY + Math.sin(angle) * labelRadius;
        const labelProgress = spring({
          frame: frame - delay - 20 - i * 3,
          fps,
          config: SPRING_CONFIGS.smooth,
        });

        return (
          <div
            key={`label-${name}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              fontSize: 11,
              color: ERDOS_COLORS.chalk,
              opacity: interpolate(labelProgress, [0, 0.5], [0, 0.8], {
                extrapolateRight: "clamp",
              }),
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </div>
        );
      })}

      {/* Extra node */}
      {extraNode &&
        (() => {
          const extraAngle =
            ((collaborators.length + 0.5) / (collaborators.length + 1)) * Math.PI * 2 - Math.PI / 2;
          const extraX = centerX + Math.cos(extraAngle) * (radius + 60);
          const extraY = centerY + Math.sin(extraAngle) * (radius + 60);
          const extraProgress = spring({
            frame: frame - delay - 60,
            fps,
            config: SPRING_CONFIGS.bouncy,
          });
          const glowPulse = Math.sin((frame - delay - 60) * 0.08) * 0.4 + 0.6;

          return (
            <div
              style={{
                position: "absolute",
                left: extraX - 25,
                top: extraY - 25,
                width: 50,
                height: 50,
                borderRadius: "50%",
                backgroundColor: extraNode.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${extraProgress})`,
                boxShadow: `0 0 ${20 * glowPulse}px ${extraNode.color}80`,
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 700, color: "#000" }}>
                {extraNode.label}
              </span>
            </div>
          );
        })()}
    </div>
  );
}
