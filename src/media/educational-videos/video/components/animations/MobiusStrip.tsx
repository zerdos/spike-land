import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SPRING_CONFIGS } from "../../../core-logic/constants";
import { ERDOS_COLORS } from "../../../core-logic/erdos-constants";

type MobiusStripProps = {
  delay?: number;
  morphToInfinity?: boolean;
  morphStartFrame?: number;
};

export function MobiusStrip({
  delay = 0,
  morphToInfinity = false,
  morphStartFrame = 600,
}: MobiusStripProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entryProgress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.gentle,
  });

  const rotation = (frame - delay) * 0.8;

  // Morph progress toward infinity symbol
  const morphProgress = morphToInfinity
    ? interpolate(frame, [morphStartFrame, morphStartFrame + 60], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const glowIntensity = Math.sin((frame - delay) * 0.05) * 0.3 + 0.7;

  // Generate strip segments as a set of divs forming a twisted band
  const segments = 24;
  const stripWidth = 400;
  const stripHeight = 160;

  return (
    <div
      style={{
        perspective: 1000,
        width: stripWidth,
        height: stripHeight + 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: interpolate(entryProgress, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <div
        style={{
          position: "relative",
          width: stripWidth,
          height: stripHeight,
          transformStyle: "preserve-3d",
          transform: `
            rotateY(${rotation}deg)
            scale(${interpolate(entryProgress, [0, 1], [0.5, 1])})
            ${morphProgress > 0 ? `scaleX(${interpolate(morphProgress, [0, 1], [1, 1.4])})` : ""}
          `,
        }}
      >
        {Array.from({ length: segments }, (_, i) => {
          const t = i / segments;
          const angle = t * Math.PI * 2;
          // Möbius: half-twist = the local frame rotates by π over one full loop
          const twist = t * Math.PI;

          // Parametric position on a torus-like path
          const R = stripWidth * 0.35; // major radius
          const x = R * Math.cos(angle);
          const z = R * Math.sin(angle);
          const y = 0;

          // Morph toward figure-8 (lemniscate)
          const lemniscateScale = 0.7;
          const denom = 1 + Math.sin(angle) * Math.sin(angle);
          const lx = (R * lemniscateScale * Math.cos(angle)) / denom;
          const lz = (R * lemniscateScale * Math.sin(angle) * Math.cos(angle)) / denom;

          const finalX = interpolate(morphProgress, [0, 1], [x, lx]);
          const finalZ = interpolate(morphProgress, [0, 1], [z, lz]);

          const segmentWidth = (2 * Math.PI * R) / segments + 2; // slight overlap

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: segmentWidth,
                height: 30,
                marginLeft: -segmentWidth / 2,
                marginTop: -15,
                background: `linear-gradient(${
                  twist * (180 / Math.PI)
                }deg, ${ERDOS_COLORS.mobiusGlow}cc, ${ERDOS_COLORS.mobiusGlow}40)`,
                borderRadius: 4,
                transform: `
                  translate3d(${finalX}px, ${y}px, ${finalZ}px)
                  rotateZ(${twist * (180 / Math.PI)}deg)
                  rotateY(${angle * (180 / Math.PI)}deg)
                `,
                boxShadow: `0 0 ${12 * glowIntensity}px ${ERDOS_COLORS.mobiusGlow}50`,
                backfaceVisibility: "visible",
              }}
            />
          );
        })}
      </div>

      {/* Infinity symbol overlay during morph */}
      {morphProgress > 0.5 && (
        <div
          style={{
            position: "absolute",
            fontSize: 120,
            color: ERDOS_COLORS.mobiusGlow,
            opacity: interpolate(morphProgress, [0.5, 1], [0, 0.6], { extrapolateRight: "clamp" }),
            filter: `blur(${interpolate(morphProgress, [0.5, 1], [8, 0])}px)`,
            textShadow: `0 0 30px ${ERDOS_COLORS.mobiusGlow}80`,
          }}
        >
          ∞
        </div>
      )}
    </div>
  );
}
