import { motion, useReducedMotion } from "framer-motion";

/**
 * Content silhouette placeholders — approximate shapes of real UI elements
 * that "data waves" reveal during Phase 3.
 */
const WAVE_ITEMS = [
  { width: "w-48", height: "h-6", x: -120, delay: 0 },
  { width: "w-64", height: "h-4", x: 80, delay: 0.08 },
  { width: "w-36", height: "h-8", x: -60, delay: 0.16 },
  { width: "w-56", height: "h-4", x: 100, delay: 0.24 },
  { width: "w-40", height: "h-6", x: -90, delay: 0.32 },
];

const SPIKE_EASE = [0.16, 1, 0.3, 1] as const;

export function SpikeLoad() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div role="status" aria-label="Loading" className="flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"
          aria-hidden="true"
        />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Loading"
      className="relative flex min-h-[60vh] items-center justify-center overflow-hidden"
    >
      <span className="sr-only">Loading...</span>

      {/* Phase 1: Glowing dot */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute bottom-[20%] h-2 w-2 rounded-full bg-[#00f0ff]"
        style={{
          boxShadow: "0 0 20px 8px rgba(0, 240, 255, 0.4), 0 0 60px 20px rgba(0, 240, 255, 0.15)",
        }}
      />

      {/* Phase 2: The Spike — shoots upward */}
      <motion.div
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{
          scaleY: { duration: 0.6, delay: 0.3, ease: SPIKE_EASE as unknown as number[] },
          opacity: { duration: 0.15, delay: 0.3 },
        }}
        className="absolute bottom-[20%] h-[40vh] w-[2px] origin-bottom"
        style={{
          background:
            "linear-gradient(to top, transparent 0%, #00f0ff 30%, rgba(0, 240, 255, 0.6) 70%, transparent 100%)",
        }}
      >
        {/* Scanline overlay */}
        <div
          className="absolute inset-0 animate-[scan_1.2s_linear_infinite]"
          style={{
            background: "linear-gradient(transparent 50%, rgba(0, 240, 255, 0.2) 50%)",
            backgroundSize: "100% 6px",
          }}
        />

        {/* Glow aura */}
        <div
          className="absolute inset-0 -mx-4 blur-md"
          style={{
            background:
              "linear-gradient(to top, transparent 0%, rgba(0, 240, 255, 0.15) 40%, transparent 100%)",
          }}
        />
      </motion.div>

      {/* Phase 3: Data waves — horizontal silhouettes */}
      {WAVE_ITEMS.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scaleX: 0, y: 20 }}
          animate={{ opacity: 0.3, scaleX: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.9 + item.delay,
            ease: SPIKE_EASE as unknown as number[],
          }}
          className={`absolute rounded-sm ${item.width} ${item.height}`}
          style={{
            left: `calc(50% + ${item.x}px)`,
            top: `calc(30% + ${i * 48}px)`,
            background:
              i % 2 === 0
                ? "linear-gradient(90deg, rgba(0, 240, 255, 0.15), rgba(0, 240, 255, 0.05))"
                : "linear-gradient(90deg, rgba(74, 102, 243, 0.15), rgba(74, 102, 243, 0.05))",
          }}
        />
      ))}

      {/* Pulsing dot at the base for continuous feedback */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 1.4,
          ease: "easeInOut",
        }}
        className="absolute bottom-[18%] h-1 w-1 rounded-full bg-[#00f0ff]"
      />
    </div>
  );
}
