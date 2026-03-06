import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FiveLayerStackCore } from "../../../ui/FiveLayerStackCore";
import { SPRING_CONFIGS } from "../../../core-logic/constants";

export function Scene03_Stack() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.gentle,
    durationInFrames: 90,
  });

  return (
    <AbsoluteFill className="bg-black p-20">
      <FiveLayerStackCore progress={progress} revealCount={5} className="w-full h-full" />
    </AbsoluteFill>
  );
}
