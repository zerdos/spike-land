import { motion, useReducedMotion } from "framer-motion";

export function SpikeLoad() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-5"
    >
      <span className="sr-only">Loading…</span>

      {shouldReduceMotion ? (
        /* Static spinner for reduced-motion preference */
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-500/20 border-t-indigo-500" />
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
          className="relative flex h-12 w-12 items-center justify-center"
        >
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-md" />
          {/* Spinning ring */}
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-400/25 border-t-indigo-500" />
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: shouldReduceMotion ? 0 : 0.25, duration: 0.4 }}
        aria-hidden="true"
        className="text-[0.7rem] font-medium tracking-[0.18em] text-muted-foreground/50 uppercase"
      >
        spike.land
      </motion.p>
    </div>
  );
}
