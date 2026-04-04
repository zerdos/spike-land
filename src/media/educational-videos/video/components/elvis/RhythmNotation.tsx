import { type FC } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ELVIS_BPM, ELVIS_COLORS } from "../../../core-logic/elvis-constants";

interface RhythmNotationProps {
  /** Number of bars to display */
  bars?: number;
  /** Scroll speed in pixels per frame */
  scrollSpeed?: number;
  /** Height of the notation area */
  height?: number;
  /** Whether to highlight the current beat */
  showPlayhead?: boolean;
}

/**
 * Musical rhythm notation scrolling horizontally.
 * Shows kick, snare, and hi-hat patterns as a grid that scrolls
 * left with a playhead tracking the current beat.
 *
 * Used in the Daft Punk scene of Elvis Emotion.
 */
export const RhythmNotation: FC<RhythmNotationProps> = ({
  bars = 8,
  scrollSpeed = 2,
  height = 120,
  showPlayhead = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const beatsPerBar = 4;
  const subdivisionsPerBeat = 4; // 16th notes
  const totalSteps = bars * beatsPerBar * subdivisionsPerBeat;
  const stepWidth = 28;
  const totalWidth = totalSteps * stepWidth;

  // Scroll position
  const scrollX = frame * scrollSpeed;

  // Current step (synced to BPM)
  const secondsPerStep = 60 / ELVIS_BPM / subdivisionsPerBeat;
  const currentStep = Math.floor(frame / fps / secondsPerStep) % totalSteps;

  // Pattern definitions (16 steps per bar, repeating)
  const kickPattern = [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0];
  const snarePattern = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
  const hihatPattern = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];

  const tracks = [
    { name: "HH", pattern: hihatPattern, color: ELVIS_COLORS.white, y: 0 },
    { name: "SD", pattern: snarePattern, color: ELVIS_COLORS.pink, y: 1 },
    { name: "KD", pattern: kickPattern, color: ELVIS_COLORS.gold, y: 2 },
  ];

  const rowHeight = height / 3;
  const dotRadius = 6;

  return (
    <div
      style={{
        width: "100%",
        height,
        overflow: "hidden",
        position: "relative",
        opacity: 0.8,
      }}
    >
      {/* Track labels */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 36,
          height,
          zIndex: 2,
          background: `linear-gradient(90deg, ${ELVIS_COLORS.bgDeep}, transparent)`,
        }}
      >
        {tracks.map((track) => (
          <div
            key={track.name}
            style={{
              height: rowHeight,
              display: "flex",
              alignItems: "center",
              paddingLeft: 4,
              fontFamily: "monospace",
              fontSize: 10,
              fontWeight: 700,
              color: track.color,
              opacity: 0.6,
            }}
          >
            {track.name}
          </div>
        ))}
      </div>

      {/* Scrolling grid */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 0,
          width: totalWidth,
          height,
          transform: `translateX(${-scrollX % totalWidth}px)`,
        }}
      >
        {tracks.map((track) =>
          Array.from({ length: totalSteps }, (_, stepIdx) => {
            const stepInBar = stepIdx % (beatsPerBar * subdivisionsPerBeat);
            const isActive = track.pattern[stepInBar] === 1;
            const isCurrent = stepIdx === currentStep;
            const isBeatLine = stepInBar % subdivisionsPerBeat === 0;

            return (
              <div
                key={`${track.name}-${stepIdx}`}
                style={{
                  position: "absolute",
                  left: stepIdx * stepWidth,
                  top: track.y * rowHeight,
                  width: stepWidth,
                  height: rowHeight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderLeft: isBeatLine ? `1px solid rgba(255,255,255,0.08)` : "none",
                }}
              >
                {isActive && (
                  <div
                    style={{
                      width: dotRadius * 2,
                      height: dotRadius * 2,
                      borderRadius: "50%",
                      backgroundColor: isCurrent ? "#fff" : track.color,
                      opacity: isCurrent ? 1 : 0.5,
                      boxShadow: isCurrent
                        ? `0 0 12px ${track.color}, 0 0 24px ${track.color}`
                        : "none",
                      transform: isCurrent ? "scale(1.5)" : "scale(1)",
                      transition: "transform 0.05s, opacity 0.05s",
                    }}
                  />
                )}
              </div>
            );
          }),
        )}
      </div>

      {/* Playhead */}
      {showPlayhead && (
        <div
          style={{
            position: "absolute",
            left: 40 + (currentStep * stepWidth - (scrollX % totalWidth)),
            top: 0,
            width: 2,
            height,
            backgroundColor: ELVIS_COLORS.gold,
            opacity: 0.6,
            boxShadow: `0 0 8px ${ELVIS_COLORS.gold}`,
            zIndex: 3,
          }}
        />
      )}
    </div>
  );
};
