#!/usr/bin/env node
/**
 * Generate abstract SVG hero images for blog posts that are missing them.
 * Each SVG is a unique generative composition based on a hash of the slug.
 */

import { readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(__dirname, "..", "content", "blog");
const IMAGES_DIR = join(__dirname, "..", "content", "blog-images");

// Simple hash function for deterministic randomness from slug
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Seeded pseudo-random generator
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Color palettes — each blog gets one based on its hash
const PALETTES = [
  // Deep blue / cyan
  ["#0f172a", "#1e293b", "#0ea5e9", "#06b6d4", "#22d3ee", "#67e8f9"],
  // Purple / violet
  ["#1e1b4b", "#312e81", "#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd"],
  // Emerald / green
  ["#022c22", "#064e3b", "#059669", "#10b981", "#34d399", "#6ee7b7"],
  // Amber / orange
  ["#1c1917", "#292524", "#d97706", "#f59e0b", "#fbbf24", "#fcd34d"],
  // Rose / pink
  ["#1c1917", "#27272a", "#e11d48", "#f43f5e", "#fb7185", "#fda4af"],
  // Indigo / blue
  ["#0c0a09", "#1c1917", "#4f46e5", "#6366f1", "#818cf8", "#a5b4fc"],
  // Teal / mint
  ["#042f2e", "#134e4a", "#0d9488", "#14b8a6", "#2dd4bf", "#5eead4"],
  // Slate / steel
  ["#0f172a", "#1e293b", "#475569", "#64748b", "#94a3b8", "#cbd5e1"],
];

interface BlogMeta {
  slug: string;
  title: string;
  heroImage: string;
  heroPrompt: string;
  category: string;
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result: Record<string, string> = {};
  for (const line of match[1]!.split("\n")) {
    const m = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (m) result[m[1]!] = m[2]!;
  }
  return result;
}

function generateSVG(slug: string, title: string, _prompt: string, category: string): string {
  const h = hash(slug);
  const rand = seededRandom(h);
  const palette = PALETTES[h % PALETTES.length]!;
  const bg1 = palette[0]!;
  const bg2 = palette[1]!;
  const accent1 = palette[2]!;
  const accent2 = palette[3]!;
  const accent3 = palette[4]!;
  const light = palette[5]!;

  const W = 1200;
  const H = 630;

  // Choose composition style based on hash
  const style = h % 6;

  let shapes = "";

  if (style === 0) {
    // Geometric circles
    for (let i = 0; i < 12; i++) {
      const cx = rand() * W;
      const cy = rand() * H;
      const r = 30 + rand() * 180;
      const color = [accent1, accent2, accent3, light][Math.floor(rand() * 4)]!;
      const opacity = 0.08 + rand() * 0.2;
      shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="${opacity.toFixed(2)}" />\n`;
    }
    // Accent rings
    for (let i = 0; i < 5; i++) {
      const cx = rand() * W;
      const cy = rand() * H;
      const r = 50 + rand() * 120;
      const color = [accent1, accent2][Math.floor(rand() * 2)]!;
      shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${(1 + rand() * 2).toFixed(1)}" opacity="${(0.15 + rand() * 0.3).toFixed(2)}" />\n`;
    }
  } else if (style === 1) {
    // Diagonal lines / rays
    const cx = W * (0.3 + rand() * 0.4);
    const cy = H * (0.3 + rand() * 0.4);
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + rand() * 0.1;
      const len = 200 + rand() * 600;
      const x2 = cx + Math.cos(angle) * len;
      const y2 = cy + Math.sin(angle) * len;
      const color = [accent1, accent2, accent3][Math.floor(rand() * 3)]!;
      shapes += `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${(0.5 + rand() * 2).toFixed(1)}" opacity="${(0.1 + rand() * 0.25).toFixed(2)}" />\n`;
    }
    // Central glow
    shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="80" fill="${accent1}" opacity="0.15" filter="url(#glow)" />\n`;
  } else if (style === 2) {
    // Grid of dots
    const spacing = 40 + Math.floor(rand() * 30);
    for (let x = spacing; x < W; x += spacing) {
      for (let y = spacing; y < H; y += spacing) {
        const jx = x + (rand() - 0.5) * 10;
        const jy = y + (rand() - 0.5) * 10;
        const dist = Math.sqrt((jx - W / 2) ** 2 + (jy - H / 2) ** 2);
        const maxDist = Math.sqrt((W / 2) ** 2 + (H / 2) ** 2);
        const size = 1 + (1 - dist / maxDist) * 4;
        const opacity = 0.1 + (1 - dist / maxDist) * 0.4;
        const color = dist < maxDist * 0.4 ? accent1 : dist < maxDist * 0.7 ? accent2 : accent3;
        shapes += `<circle cx="${jx.toFixed(1)}" cy="${jy.toFixed(1)}" r="${size.toFixed(1)}" fill="${color}" opacity="${opacity.toFixed(2)}" />\n`;
      }
    }
  } else if (style === 3) {
    // Flowing waves
    for (let w = 0; w < 8; w++) {
      const yBase = 80 + w * 70;
      const color = [accent1, accent2, accent3, light][w % 4]!;
      let d = `M 0 ${yBase}`;
      for (let x = 0; x <= W; x += 20) {
        const y =
          yBase + Math.sin((x / W) * Math.PI * (2 + rand() * 3) + w * 0.7) * (30 + rand() * 50);
        d += ` L ${x} ${y.toFixed(1)}`;
      }
      shapes += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${(1 + rand() * 2).toFixed(1)}" opacity="${(0.12 + rand() * 0.2).toFixed(2)}" />\n`;
    }
  } else if (style === 4) {
    // Hexagonal mesh
    const size = 40 + Math.floor(rand() * 20);
    const rows = Math.ceil(H / (size * 1.5)) + 1;
    const cols = Math.ceil(W / (size * Math.sqrt(3))) + 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = col * size * Math.sqrt(3) + (row % 2 ? (size * Math.sqrt(3)) / 2 : 0);
        const cy = row * size * 1.5;
        if (rand() > 0.6) continue;
        const color = [accent1, accent2, accent3][Math.floor(rand() * 3)]!;
        const opacity = 0.05 + rand() * 0.2;
        const points = Array.from({ length: 6 }, (_, i) => {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          return `${(cx + size * 0.9 * Math.cos(angle)).toFixed(1)},${(cy + size * 0.9 * Math.sin(angle)).toFixed(1)}`;
        }).join(" ");
        shapes += `<polygon points="${points}" fill="${color}" opacity="${opacity.toFixed(2)}" />\n`;
      }
    }
  } else {
    // Abstract blobs
    for (let i = 0; i < 6; i++) {
      const cx = rand() * W;
      const cy = rand() * H;
      const rx = 80 + rand() * 200;
      const ry = 60 + rand() * 150;
      const rot = rand() * 360;
      const color = [accent1, accent2, accent3, light][Math.floor(rand() * 4)]!;
      shapes += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="${color}" opacity="${(0.06 + rand() * 0.15).toFixed(2)}" />\n`;
    }
  }

  // Category badge
  const catLabel = category || "spike.land";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="100%" stop-color="${bg2}" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="30" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="textShadow">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="${bg1}" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)" />

  <!-- Generative shapes -->
  ${shapes}

  <!-- Vignette -->
  <rect width="${W}" height="${H}" fill="url(#bg)" opacity="0.3" />

  <!-- Category badge -->
  <rect x="48" y="40" width="${catLabel.length * 10 + 24}" height="28" rx="14" fill="${accent1}" opacity="0.9" />
  <text x="${48 + 12}" y="59" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" letter-spacing="1.5" text-transform="uppercase" fill="white">${escapeXml(catLabel.toUpperCase())}</text>

  <!-- Title -->
  <text x="48" y="${H - 80}" font-family="system-ui, -apple-system, sans-serif" font-size="42" font-weight="800" fill="white" filter="url(#textShadow)" letter-spacing="-1">
    ${wrapTitle(title, 38)
      .map((line, i) => `<tspan x="48" dy="${i === 0 ? 0 : 50}">${escapeXml(line)}</tspan>`)
      .join("\n    ")}
  </text>

  <!-- spike.land watermark -->
  <text x="${W - 48}" y="${H - 24}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="${accent3}" opacity="0.6" text-anchor="end">spike.land</text>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapTitle(title: string, maxChars: number): string[] {
  const words = title.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length + word.length + 1 > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3); // max 3 lines
}

// Main
const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));
let generated = 0;
let skipped = 0;

for (const file of files) {
  const content = readFileSync(join(BLOG_DIR, file), "utf-8");
  const meta = parseFrontmatter(content);
  const slug = meta.slug;
  const heroImage = meta.heroImage;
  const title = meta.title || slug || file.replace(".mdx", "");
  const category = meta.category || "";
  const heroPrompt = meta.heroPrompt || "";

  if (!slug || !heroImage) continue;

  // Determine target path
  const ext = heroImage.split(".").pop() || "svg";
  const targetDir = join(IMAGES_DIR, slug);
  const targetFile = join(targetDir, `hero.${ext}`);

  if (existsSync(targetFile)) {
    skipped++;
    continue;
  }

  // Only generate SVGs — skip png/jpg (those need actual image generation)
  // But we CAN generate SVGs for all of them as a fallback
  mkdirSync(targetDir, { recursive: true });

  const svg = generateSVG(slug, title, heroPrompt, category);
  // Always write as .svg regardless of the frontmatter extension
  const svgPath = join(targetDir, "hero.svg");
  writeFileSync(svgPath, svg, "utf-8");
  generated++;
  console.log(`Generated: ${slug}/hero.svg`);
}

console.log(`\nDone. Generated: ${generated}, Skipped (existing): ${skipped}`);
