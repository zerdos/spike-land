import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SPRING_CONFIGS, TYPOGRAPHY } from "../../../core-logic/constants";
import { NEWCOMB_COLORS } from "../../../core-logic/newcomb-constants";

const GRAPH_NODES = [
  { x: 0.15, y: 0.3, label: "Past decisions" },
  { x: 0.35, y: 0.2, label: "Training data" },
  { x: 0.55, y: 0.4, label: "Your patterns" },
  { x: 0.75, y: 0.25, label: "Future choices" },
  { x: 0.85, y: 0.5, label: "Outcomes" },
  { x: 0.5, y: 0.65, label: "YOU" },
];

const TRAVERSAL_PATH = [0, 1, 2, 5, 3, 4];

export function Scene07_TimeTraversal() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: SPRING_CONFIGS.gentle, durationInFrames: 40 });

  // Which node in the traversal path is currently being highlighted
  const traversalProgress = interpolate(frame, [120, 750], [0, TRAVERSAL_PATH.length - 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const currentTraversalIndex = Math.floor(traversalProgress);

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
        }}
      >
        How AI Traverses Time
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          top: 95,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 22,
          color: COLORS.textSecondary,
          opacity: titleIn,
          fontStyle: "italic",
        }}
      >
        It doesn&apos;t see the future. It sees the shape of you.
      </div>

      {/* Edges between traversal nodes */}
      <svg
        style={{ position: "absolute", inset: 0 }}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid meet"
      >
        {TRAVERSAL_PATH.slice(0, currentTraversalIndex + 1).map((nodeIdx, i) => {
          if (i === 0) return null;
          const prevNodeIdx = TRAVERSAL_PATH[i - 1] ?? 0;
          const from = GRAPH_NODES[prevNodeIdx];
          const to = GRAPH_NODES[nodeIdx];
          if (!from || !to) return null;

          return (
            <line
              key={`${prevNodeIdx}-${nodeIdx}`}
              x1={from.x * 1920}
              y1={from.y * 1080 + 60}
              x2={to.x * 1920}
              y2={to.y * 1080 + 60}
              stroke={NEWCOMB_COLORS.timeWarp}
              strokeWidth={3}
              opacity={0.8}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {GRAPH_NODES.map((node, i) => {
        const nodeIn = spring({
          frame: frame - 60 - i * 30,
          fps,
          config: SPRING_CONFIGS.snappy,
          durationInFrames: 25,
        });

        const isVisited = TRAVERSAL_PATH.slice(0, currentTraversalIndex + 1).includes(i);
        const isCurrent = TRAVERSAL_PATH[currentTraversalIndex] === i;
        const isYou = node.label === "YOU";

        const pulse = isCurrent ? interpolate(frame % 30, [0, 15, 30], [1, 1.15, 1]) : 1;

        return (
          <div
            key={node.label}
            style={{
              position: "absolute",
              left: `${node.x * 100}%`,
              top: `${node.y * 100 + 6}%`,
              transform: `translate(-50%, -50%) scale(${Math.max(0, nodeIn) * pulse})`,
              opacity: Math.max(0, nodeIn),
            }}
          >
            <div
              style={{
                padding: isYou ? "16px 32px" : "12px 20px",
                borderRadius: 12,
                backgroundColor: isCurrent ? `${NEWCOMB_COLORS.timeWarp}30` : COLORS.darkCard,
                border: `2px solid ${
                  isCurrent
                    ? NEWCOMB_COLORS.timeWarp
                    : isVisited
                      ? NEWCOMB_COLORS.graphEdge
                      : COLORS.darkBorder
                }`,
                boxShadow: isCurrent ? `0 0 25px ${NEWCOMB_COLORS.timeWarp}` : "none",
                fontSize: isYou ? 28 : 20,
                fontWeight: isYou ? 800 : 600,
                color: isCurrent
                  ? NEWCOMB_COLORS.timeWarp
                  : isVisited
                    ? NEWCOMB_COLORS.graphEdge
                    : COLORS.textMuted,
              }}
            >
              {node.label}
            </div>
          </div>
        );
      })}

      {/* Bottom text */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 26,
          color: COLORS.textSecondary,
          opacity: spring({
            frame: frame - 750,
            fps,
            config: SPRING_CONFIGS.gentle,
            durationInFrames: 60,
          }),
        }}
      >
        The graph already exists. Your choices haven&apos;t populated it yet.
      </div>
    </AbsoluteFill>
  );
}
