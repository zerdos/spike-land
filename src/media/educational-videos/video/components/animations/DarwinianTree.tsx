import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SPRING_CONFIGS } from "../../../core-logic/constants";
import { DarwinianTreeCore } from "../../../ui/DarwinianTreeCore";

type DarwinianTreeProps = {
  generations?: number; // 1-3
  delay?: number;
};

export function DarwinianTree({ generations = 3, delay = 0 }: DarwinianTreeProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  return (
    <AbsoluteFill style={{ background: COLORS.darkBg }}>
      <DarwinianTreeCore generations={generations} progress={progress} />
    </AbsoluteFill>
  );
}
