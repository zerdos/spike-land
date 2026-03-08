/**
 * Video configuration constants
 */
export const VIDEO_CONFIG = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 11194, // ~6m13s (audio-driven)
} as const;

/**
 * Vibe Coding Paradox — Scene Durations (frames @ 30fps)
 * Audio-driven: ceil(audioDuration * 30) + 30 (~1s buffer)
 */
export const VCP_DURATIONS = {
  hook: 1514, // ~50.5s (audio: 49.5s)
  physicsOfAttention: 1708, // ~56.9s (audio: 55.9s)
  beforeState: 574, // ~19.1s (audio: 18.1s)
  fiveLayerStack: 1520, // ~50.7s (audio: 49.6s)
  fixLoop: 1237, // ~41.2s (audio: 40.2s)
  agentMemory: 1238, // ~41.3s (audio: 40.3s)
  skillMatching: 1039, // ~34.6s (audio: 33.6s)
  metaBuild: 671, // ~22.4s (audio: 21.4s)
  results: 917, // ~30.6s (audio: 29.5s)
  endCard: 776, // ~25.9s (audio: 24.8s)
} as const;

export const VCP_TIMING = {
  totalFrames: 11194, // ~6m13s (audio-driven)
  fps: 30,
  transitionFrames: 20,
} as const;

/**
 * Media color tokens aligned with spike.land's semantic dark theme.
 *
 * Keep the semantic names as the source of truth and preserve the older
 * aliases (`darkBg`, `textPrimary`, `cyan`, etc.) for compatibility with the
 * existing scene/component library.
 */
const MEDIA_THEME = {
  background: "hsl(224 71% 4%)",
  foreground: "hsl(210 40% 98%)",
  card: "hsl(222 47% 7%)",
  muted: "hsl(222 47% 11%)",
  mutedForeground: "hsl(215 20% 65%)",
  border: "hsl(217 33% 17%)",
  primary: "hsl(263 70% 50%)",
  accent: "hsl(187 100% 50%)",
  destructive: "hsl(0 84% 60%)",
  success: "hsl(150 90% 35%)",
  warning: "hsl(45 90% 45%)",
  info: "hsl(187 100% 50%)",
  fuchsia: "hsl(322 81% 55%)",
  gold: "hsl(48 89% 47%)",
} as const;

export const COLORS = {
  // Semantic surface + text roles
  background: MEDIA_THEME.background,
  foreground: MEDIA_THEME.foreground,
  card: MEDIA_THEME.card,
  muted: MEDIA_THEME.muted,
  mutedForeground: MEDIA_THEME.mutedForeground,
  border: MEDIA_THEME.border,
  primary: MEDIA_THEME.primary,
  accent: MEDIA_THEME.accent,
  destructive: MEDIA_THEME.destructive,
  success: MEDIA_THEME.success,
  warning: MEDIA_THEME.warning,
  info: MEDIA_THEME.info,

  // Compatibility aliases for the existing media components
  darkBg: MEDIA_THEME.background,
  darkCard: MEDIA_THEME.card,
  darkBorder: MEDIA_THEME.border,
  textPrimary: MEDIA_THEME.foreground,
  textSecondary: MEDIA_THEME.mutedForeground,
  textMuted: MEDIA_THEME.mutedForeground,
  cyan: MEDIA_THEME.accent,
  fuchsia: MEDIA_THEME.fuchsia,
  purple: MEDIA_THEME.primary,
  amber: MEDIA_THEME.warning,
  gold: MEDIA_THEME.gold,
  error: MEDIA_THEME.destructive,

  // Chart colors for A/B testing
  variantA: MEDIA_THEME.accent,
  variantB: MEDIA_THEME.fuchsia,
} as const;

/**
 * Typography scale
 */
export const TYPOGRAPHY = {
  fontFamily: {
    sans: '"Rubik", ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
    "6xl": 60,
  },
} as const;

/**
 * Spring configurations for different animation feels
 */
export const SPRING_CONFIGS = {
  smooth: { damping: 200 },
  snappy: { damping: 20, stiffness: 200 },
  bouncy: { damping: 8 },
  heavy: { damping: 15, stiffness: 80, mass: 2 },
  gentle: { damping: 14, stiffness: 100 },
  slow: { damping: 40, stiffness: 60 },
} as const;

/**
 * Veritasium-specific color accents (reused for VCP)
 */
export const VERITASIUM_COLORS = {
  // Agent states
  planning: COLORS.primary,
  generating: "hsl(221 83% 53%)",
  transpiling: COLORS.accent,
  fixing: COLORS.warning,
  learning: COLORS.success,
  published: COLORS.success,
  failed: COLORS.destructive,

  // Note lifecycle
  candidate: COLORS.warning,
  active: COLORS.success,
  deprecated: COLORS.mutedForeground,

  // Laplace formula
  bayesian: "hsl(262 83% 58%)",

  // Flywheel
  flywheel: COLORS.accent,
} as const;
