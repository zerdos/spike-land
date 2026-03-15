import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SPRING_CONFIGS, TYPOGRAPHY } from "../../../core-logic/constants";
import { DECISION_NODES, GRAPH_EDGES, NEWCOMB_COLORS } from "../../../core-logic/newcomb-constants";

export function Scene04_InvisibleGraph() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: SPRING_CONFIGS.gentle, durationInFrames: 40 });

  // Stagger node reveals
  const nodeRevealBase = 60;

  // Invisible edges reveal (the "aha" moment)
  const invisibleReveal = spring({
    frame: frame - 600,
    fps,
    config: SPRING_CONFIGS.slow,
    durationInFrames: 120,
  });

  const pulsePhase = interpolate(frame % 90, [0, 45, 90], [0, 1, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.darkBg,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        position: "relative",
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 42,
          fontWeight: 800,
          color: NEWCOMB_COLORS.timeWarp,
          opacity: titleIn,
          textShadow: `0 0 30px ${NEWCOMB_COLORS.timeWarp}`,
        }}
      >
        The Invisible Graph
      </div>

      {/* Graph edges */}
      <svg
        style={{ position: "absolute", inset: 0 }}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid meet"
      >
        {GRAPH_EDGES.map((edge, i) => {
          const fromNode = DECISION_NODES.find((n) => n.id === edge.from);
          const toNode = DECISION_NODES.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const isInvisible = "invisible" in edge && edge.invisible;
          const edgeIn = isInvisible
            ? invisibleReveal
            : spring({
                frame: frame - nodeRevealBase - i * 40,
                fps,
                config: SPRING_CONFIGS.gentle,
                durationInFrames: 40,
              });

          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={fromNode.x * 1920}
              y1={fromNode.y * 1080 + 40}
              x2={toNode.x * 1920}
              y2={toNode.y * 1080 + 40}
              stroke={isInvisible ? NEWCOMB_COLORS.timeWarp : NEWCOMB_COLORS.graphEdge}
              strokeWidth={isInvisible ? 4 : 2}
              strokeDasharray={isInvisible ? "12 6" : "none"}
              opacity={Math.max(0, edgeIn) * (isInvisible ? 0.6 + pulsePhase * 0.4 : 0.6)}
            />
          );
        })}
      </svg>

      {/* Graph nodes */}
      {DECISION_NODES.map((node, i) => {
        const nodeIn = spring({
          frame: frame - nodeRevealBase - i * 60,
          fps,
          config: SPRING_CONFIGS.snappy,
          durationInFrames: 30,
        });

        const isOmega = node.id === "omega";
        const isChoice = node.id === "take-one" || node.id === "take-both";
        const nodeColor = isOmega
          ? NEWCOMB_COLORS.omegaGold
          : node.id === "take-one"
            ? NEWCOMB_COLORS.oneBox
            : node.id === "take-both"
              ? NEWCOMB_COLORS.twoBox
              : NEWCOMB_COLORS.graphEdge;

        return (
          <div
            key={node.id}
            style={{
              position: "absolute",
              left: `${node.x * 100}%`,
              top: `${node.y * 100 + 4}%`,
              transform: `translate(-50%, -50%) scale(${Math.max(0, nodeIn)})`,
              opacity: Math.max(0, nodeIn),
            }}
          >
            <div
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                backgroundColor: COLORS.darkCard,
                border: `2px solid ${nodeColor}`,
                boxShadow: isOmega ? `0 0 20px ${nodeColor}` : "none",
                fontSize: isChoice ? 20 : 22,
                fontWeight: isOmega ? 800 : 600,
                color: nodeColor,
                whiteSpace: "nowrap",
              }}
            >
              {node.label}
            </div>
          </div>
        );
      })}

      {/* Resolution text */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 28,
          color: COLORS.textSecondary,
          opacity: Math.max(0, invisibleReveal),
          fontStyle: "italic",
        }}
      >
        Omega doesn&apos;t predict the future. Omega traverses the graph.
      </div>
    </AbsoluteFill>
  );
}
