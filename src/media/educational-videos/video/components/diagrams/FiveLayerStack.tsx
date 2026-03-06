import { type FC } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING_CONFIGS } from "../../../core-logic/constants";
import { FiveLayerStackCore } from "../../../ui/FiveLayerStackCore";

type FiveLayerStackProps = {
  /** How many layers to reveal (1-5), bottom to top */
  revealCount?: number;
  delay?: number;
};

export const FiveLayerStack: FC<FiveLayerStackProps> = ({ revealCount = 5, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  return <FiveLayerStackCore revealCount={revealCount} progress={progress} />;
};
