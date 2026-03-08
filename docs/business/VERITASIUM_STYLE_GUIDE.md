# Veritasium Style Guide

This guide defines the visual system for Veritasium-style educational videos,
interactive explainers, and story-driven demos in spike.land.

The key change from the older version of this document is simple: Veritasium is
not a separate visual brand. It is a presentation mode layered on top of the
same semantic design tokens the product already uses.

Use this guide alongside:

- `packages/spike-app/app.css` for the public-facing spike.land token model
- `packages/code/index.css` for the richer semantic/HSL token set used by more
  cinematic interfaces
- `src/media/educational-videos/core-logic/constants.ts` for the current
  Remotion/media fallback constants

## Core Positioning

Veritasium mode should feel:

- Precise, not decorative
- Cinematic, but still product-adjacent
- High-contrast, but not neon-chaos
- Analytical, not corporate
- Animated with purpose, not constant motion for its own sake

The visual goal is to make complex systems feel legible. Every panel, glow,
chart, label, and transition should help the viewer understand a mechanism.

## Token-First Rule

Do not invent a one-off palette for a new video or demo.

Start with semantic roles:

- `background`
- `foreground`
- `card`
- `muted`
- `border`
- `primary`
- `accent`
- `success`
- `warning`
- `destructive`
- `info`

Then map those roles into the implementation surface you are using:

- Web UI: consume CSS variables directly
- Interactive blog demos: use the same semantic roles via Tailwind utilities
- Remotion/video: map semantic roles into `COLORS` and `VERITASIUM_COLORS`
  once, near the composition boundary

Hardcoded hex values are acceptable only inside the current media adapter layer
when CSS variables are unavailable. They should not be the design language.

## Source Of Truth

### Public Brand Typography

spike.land's public-facing design system uses:

- `Rubik` for body, UI, and display typography
- `JetBrains Mono` for code, terminals, formulas, and technical labels

That is the target voice for new Veritasium work.

### Semantic Color System

The codebase already defines consistent semantic roles for:

- surfaces
- text
- borders
- accent emphasis
- destructive/error states
- success/warning/info states

When you need a richer cinematic palette, prefer extending those same semantic
roles instead of switching to unrelated colors.

### Media Layer Reality

The current Remotion/video layer still contains older literals such as `Inter`
and direct hex values in `src/media/educational-videos/core-logic/constants.ts`
and individual components.

Treat that as implementation debt, not design intent.

For new work:

- prefer `Rubik` over `Inter`
- prefer semantic token names over raw hexes
- route repeated typography or color choices through shared constants instead of
  duplicating them in scene components

## Token Mapping

Use this mapping when translating product tokens into educational video or demo
surfaces.

| Semantic role | Product token family | Current media fallback | Usage |
| ------------- | -------------------- | ---------------------- | ----- |
| Background | `--color-background` | `COLORS.darkBg` | Full-frame canvas, scene base |
| Foreground | `--color-foreground` | `COLORS.textPrimary` | Main titles, key labels, important values |
| Card | `--color-card` | `COLORS.darkCard` | Panels, overlays, comparison blocks |
| Muted | `--color-muted` | secondary surface or low-emphasis fill | Sub-panels, inactive chips, low-energy regions |
| Muted foreground | `--color-muted-foreground` | `COLORS.textSecondary` / `COLORS.textMuted` | Captions, helper labels, axes, annotations |
| Border | `--color-border` | `COLORS.darkBorder` | Dividers, chart rules, card outlines |
| Primary | `--color-primary` | `COLORS.purple` or `VERITASIUM_COLORS.planning` | Primary emphasis, highlighted system state, CTA energy |
| Accent | `--color-accent` or `--color-info` | `COLORS.cyan` / `VERITASIUM_COLORS.transpiling` | Flow lines, active paths, data movement, attention focus |
| Success | `--color-success` | `VERITASIUM_COLORS.published` / `VERITASIUM_COLORS.learning` | Correct outcomes, stable wins, confidence growth |
| Warning | `--color-warning` | `VERITASIUM_COLORS.fixing` / `VERITASIUM_COLORS.candidate` | Friction, review loops, unresolved work |
| Destructive | `--color-destructive` | `VERITASIUM_COLORS.failed` | Failures, regressions, blocked states |

If you need one practical default for video work, use:

- neutral surfaces from the dark semantic palette
- one cool accent for flow or attention
- one warm accent for friction or warning
- green only for genuine success

Do not run three or four accent systems in parallel unless the scene is
explicitly comparing categories.

## Typography

### Primary Rules

- Use `Rubik` for titles, UI labels, chapter cards, and explanatory copy.
- Use `JetBrains Mono` for code, terminal text, formulas, metrics, URLs, and
  token-like data.
- Use weight and scale before using color to create hierarchy.
- Use italics sparingly. Veritasium energy comes from clarity and rhythm, not
  slanting every heading.

### Recommended Scale

| Role | Guidance |
| ---- | -------- |
| Hero title | Heavy, tight tracking, large enough to dominate frame composition |
| Section title | Bold, compact, strong contrast against background |
| Body explainer copy | Medium weight, generous line height, high readability |
| Labels and annotations | Slightly smaller, muted foreground, never tiny for the sake of style |
| Code and formulas | Mono, slightly tighter spacing, aligned cleanly to grid |

### Anti-Patterns

- Do not introduce `Inter`, `Arial`, or random system fonts in new media work.
- Do not mix multiple display fonts in a single scene.
- Do not use mono for paragraphs.
- Do not rely on all-caps everywhere to create importance.

## Color Strategy

### Neutral First

Most of the frame should be built from neutral surfaces:

- background
- card
- muted
- border
- foreground

That keeps explanations readable and gives accents room to matter.

### Accent With Meaning

Accent color should encode state, flow, or significance.

Good uses:

- showing an active path through a system
- highlighting the winning branch in a comparison
- marking the current loop, node, or step
- signaling success, warning, or failure

Bad uses:

- coloring every box differently for variety
- turning all labels into bright accents
- using glows as wallpaper

### Veritasium State Palette

These media-specific accents are still useful, but they should be treated as
semantic overlays, not the base palette.

| Narrative state | Current fallback |
| --------------- | ---------------- |
| Planning | `VERITASIUM_COLORS.planning` |
| Generating | `VERITASIUM_COLORS.generating` |
| Transpiling | `VERITASIUM_COLORS.transpiling` |
| Fixing | `VERITASIUM_COLORS.fixing` |
| Learning | `VERITASIUM_COLORS.learning` |
| Published | `VERITASIUM_COLORS.published` |
| Failed | `VERITASIUM_COLORS.failed` |
| Candidate note | `VERITASIUM_COLORS.candidate` |
| Active note | `VERITASIUM_COLORS.active` |
| Deprecated note | `VERITASIUM_COLORS.deprecated` |

Use them when the state itself is the subject of the scene. Otherwise, stay on
the base token system.

## Layout And Components

### Reusable Media Layers

The repo already has three clear component tiers:

- `src/media/educational-videos/ui/` for reusable animation cores
- `src/media/educational-videos/video/components/` for video-only building
  blocks
- `src/core/block-website/ui/` and `src/core/block-website/animation-ui/` for
  interactive blog/demo variants

Design new components so they can be ported across those tiers with minimal
visual drift.

### Component Rules

- Cards should feel structural: strong silhouette, clear border, deliberate
  padding.
- Charts should be quiet by default and loud only at the point of insight.
- Split screens should compare one idea against another, not create clutter.
- Browser frames and code blocks should remain mostly neutral; accent the active
  element, not the whole window.
- Glassmorphism is allowed as an overlay treatment, not as the default texture
  for every surface.

## Motion

Motion should explain change.

Use animation to communicate:

- progression
- causality
- transformation
- attention direction
- state activation

Avoid animation that exists only to prove the scene is animated.

### Timing Guidance

The broader codebase already uses named timing tiers such as:

- fast
- normal
- slow

Mirror that logic in videos:

- fast for hover-like feedback or quick reveals
- normal for panel transitions and emphasis changes
- slow for scene shifts, camera moves, or conceptual transitions

### Spring Guidance

The existing media layer already exposes spring presets such as:

- `smooth`
- `snappy`
- `gentle`
- `slow`

Preferred defaults:

- use `smooth` or `gentle` for analytical diagrams
- use `snappy` for discrete state changes
- use `slow` for scene-scale transitions
- avoid `bouncy` for serious explanatory sequences unless the idea itself is
  playful

## Implementation Guidance

When creating a new scene, component, or demo:

1. Start from semantic roles, not raw colors.
2. Pick the minimum accent set required by the idea.
3. Use `Rubik` plus `JetBrains Mono`.
4. Keep surfaces neutral and layered.
5. Animate only what clarifies the explanation.
6. Centralize repeated palette and typography decisions.

A good Veritasium-style asset should feel like it belongs in the same family as
the spike.land product, blog demos, and educational video library, even when it
is more cinematic than the core app.

## Quick Review Checklist

Before shipping a new scene or demo, check:

- Does this use semantic roles instead of arbitrary colors?
- Does the frame rely on neutral surfaces before accents?
- Is `Rubik` used for normal copy and labels?
- Is `JetBrains Mono` reserved for technical content?
- Does every bright color communicate meaning?
- Does the motion explain a concept rather than decorate it?
- Could this visual language sit next to the rest of spike.land without feeling
  off-brand?
