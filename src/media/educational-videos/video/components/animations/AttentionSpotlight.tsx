import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING_CONFIGS } from "../../../core-logic/constants";
import { AttentionSpotlightCore } from "../../../ui/AttentionSpotlightCore";

type AttentionSpotlightProps = {
  tokenCount: number;
  delay?: number;
};

export function AttentionSpotlight({ tokenCount, delay = 0 }: AttentionSpotlightProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      <AttentionSpotlightCore tokenCount={tokenCount} progress={progress} />
    </AbsoluteFill>
  );
}
