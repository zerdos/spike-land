import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";

const WAVE_ITEMS = [
  { width: "12rem", height: "1.5rem", x: -120, delay: 0 },
  { width: "16rem", height: "1rem", x: 80, delay: 0.08 },
  { width: "9rem", height: "2rem", x: -60, delay: 0.16 },
  { width: "14rem", height: "1rem", x: 100, delay: 0.24 },
  { width: "10rem", height: "1.5rem", x: -90, delay: 0.32 },
];

const SPIKE_EASE = [0.16, 1, 0.3, 1];

function SpikeLoad() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0a0a0a",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "4px solid #333",
            borderTopColor: "#00f0ff",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        background: "#0a0a0a",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Phase 1: Glowing dot */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          position: "absolute",
          bottom: "20%",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#00f0ff",
          boxShadow: "0 0 20px 8px rgba(0, 240, 255, 0.4), 0 0 60px 20px rgba(0, 240, 255, 0.15)",
        }}
      />

      {/* Phase 2: The Spike */}
      <motion.div
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{
          scaleY: { duration: 0.6, delay: 0.3, ease: SPIKE_EASE },
          opacity: { duration: 0.15, delay: 0.3 },
        }}
        style={{
          position: "absolute",
          bottom: "20%",
          height: "40vh",
          width: 2,
          transformOrigin: "bottom",
          background:
            "linear-gradient(to top, transparent 0%, #00f0ff 30%, rgba(0, 240, 255, 0.6) 70%, transparent 100%)",
        }}
      >
        {/* Scanline overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(transparent 50%, rgba(0, 240, 255, 0.2) 50%)",
            backgroundSize: "100% 6px",
            animation: "scan 1.2s linear infinite",
          }}
        />
        {/* Glow aura */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            marginLeft: -16,
            marginRight: -16,
            filter: "blur(12px)",
            background:
              "linear-gradient(to top, transparent 0%, rgba(0, 240, 255, 0.15) 40%, transparent 100%)",
          }}
        />
      </motion.div>

      {/* Phase 3: Data waves */}
      {WAVE_ITEMS.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scaleX: 0, y: 20 }}
          animate={{ opacity: 0.35, scaleX: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 + item.delay, ease: SPIKE_EASE }}
          style={{
            position: "absolute",
            width: item.width,
            height: item.height,
            borderRadius: 2,
            left: `calc(50% + ${item.x}px)`,
            top: `calc(30% + ${i * 48}px)`,
            background:
              i % 2 === 0
                ? "linear-gradient(90deg, rgba(0, 240, 255, 0.2), rgba(0, 240, 255, 0.05))"
                : "linear-gradient(90deg, rgba(74, 102, 243, 0.2), rgba(74, 102, 243, 0.05))",
          }}
        />
      ))}

      {/* Pulsing dot */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 1.4, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: "18%",
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "#00f0ff",
        }}
      />
    </div>
  );
}

export default function SpikeLoadDemo() {
  const [key, setKey] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [autoReveal, setAutoReveal] = useState(true);

  const replay = () => {
    setShowContent(false);
    setKey((k) => k + 1);
    if (autoReveal) {
      setTimeout(() => setShowContent(true), 2000);
    }
  };

  // Auto-reveal on first mount
  useState(() => {
    if (autoReveal) {
      setTimeout(() => setShowContent(true), 2000);
    }
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", background: "#0a0a0a" }}>
      <AnimatePresence mode="wait">
        {!showContent ? (
          <motion.div
            key={`spike-${key}`}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: "absolute", inset: 0, zIndex: 10 }}
          >
            <SpikeLoad />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
              color: "#e0e0e0",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <h1 style={{ fontSize: 48, fontWeight: 700, color: "#00f0ff", letterSpacing: -1 }}>
              spike.land
            </h1>
            <p style={{ fontSize: 18, opacity: 0.6 }}>Content loaded. The system is awake.</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
                maxWidth: 600,
                width: "100%",
                padding: "0 24px",
              }}
            >
              {["MCP Tools", "App Store", "AI Chat"].map((label) => (
                <div
                  key={label}
                  style={{
                    background: "rgba(0, 240, 255, 0.05)",
                    border: "1px solid rgba(0, 240, 255, 0.15)",
                    borderRadius: 12,
                    padding: "24px 16px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 14, opacity: 0.7 }}>{label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <button
          onClick={replay}
          style={{
            background: "#00f0ff",
            color: "#0a0a0a",
            border: "none",
            padding: "10px 24px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Replay
        </button>
        <button
          onClick={() => setShowContent((s) => !s)}
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "#e0e0e0",
            border: "1px solid rgba(255,255,255,0.2)",
            padding: "10px 24px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          {showContent ? "Show Loader" : "Reveal Content"}
        </button>
        <label
          style={{ color: "#888", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
        >
          <input
            type="checkbox"
            checked={autoReveal}
            onChange={(e) => setAutoReveal(e.target.checked)}
          />
          Auto-reveal (2s)
        </label>
      </div>
    </div>
  );
}
