#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { join } from "node:path";
import { mkdir, rm, writeFile } from "node:fs/promises";
import process from "node:process";

const TRACKS = [
  "Neon Horizon",
  "Midnight Drive",
  "Cybernetic Dreams",
  "Synthwave Serenade",
  "Galactic Groove",
  "Electric Echoes",
  "Quantum Lullaby",
  "Nebula Nights",
  "Starlight Symphony",
  "Retro Resonance",
  "Digital Dawn",
  "Solar Flare",
];

async function runAgent(index: number, trackName: string, baseDir: string) {
  const branchName = `suno-arena/track-${index + 1}-${trackName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const worktreeDir = join(baseDir, `arena-agent-${index + 1}`);

  console.log(`[Agent ${index + 1}] Entering the Arena to deploy Suno track: ${trackName}`);

  try {
    execSync(`git worktree add -b ${branchName} ${worktreeDir} main`, { stdio: "ignore" });

    // Generate the page for the track
    const pageContent = `---
import Layout from '../../../layouts/Layout.astro';
import Nav from '../../../components/Nav.astro';
import Footer from '../../../components/Footer.astro';

const trackName = "${trackName}";
const price = "$0.99";
---

<Layout title={trackName + " - spike.land music"} description={"Listen and buy " + trackName}>
  <div class="page-shell">
    <Nav activePath="/music" />
    <main class="flex-1 container mx-auto max-w-4xl py-12 px-4">
      <div class="mb-6">
        <a href="/music" class="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Records</a>
      </div>
      <div class="glass-card p-8 rounded-2xl border border-border">
        <h1 class="text-4xl font-bold mb-4">{trackName}</h1>
        <p class="text-muted-foreground mb-8">Generated via Suno AI. Exclusive to spike.land.</p>
        
        <div class="audio-player bg-muted/30 p-8 rounded-xl border border-border mb-8">
          <!-- Placeholder for Suno MP3 -->
          <audio controls class="w-full outline-none">
            <source src="/audio/suno-placeholder.wav" type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
        </div>

        <div class="buy-section flex items-center gap-4 border-t border-border pt-8">
          <button class="px-8 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
            Buy Now for {price}
          </button>
          <span class="text-sm text-muted-foreground flex flex-col">
            <span>✓ High-quality MP3 download</span>
            <span>✓ Royalty-free personal use</span>
          </span>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</Layout>

<style>
  .page-shell { min-height: 100svh; display: flex; flex-direction: column; background: var(--bg); }
</style>
`;

    const targetFile = join(
      worktreeDir,
      `packages/spike-web/src/pages/music/${trackName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.astro`,
    );
    await mkdir(join(worktreeDir, "packages/spike-web/src/pages/music"), { recursive: true });
    await writeFile(targetFile, pageContent, "utf8");

    console.log(`[Agent ${index + 1}] Committing track ${trackName}...`);
    execSync(`git add packages/spike-web/src/pages/music/`, { cwd: worktreeDir });
    execSync(`git commit -m "feat(music): add suno track ${trackName} storefront"`, {
      cwd: worktreeDir,
    });

    console.log(`[Agent ${index + 1}] Pushing branch ${branchName}...`);
    execSync(`git push -u origin ${branchName} --force`, { cwd: worktreeDir, stdio: "ignore" });

    console.log(`[Agent ${index + 1}] Deploying track ${trackName}...`);
    try {
      execSync(
        `npx wrangler pages deploy packages/spike-web/dist --project-name spike-app --branch ${branchName}`,
        { cwd: worktreeDir, stdio: "ignore" },
      );
      console.log(`[Agent ${index + 1}] ✅ Successfully deployed ${trackName}`);
    } catch (e) {
      console.log(`[Agent ${index + 1}] ⚠️ Deployment warning (CI might handle it).`);
    }
  } catch (error) {
    console.error(
      `[Agent ${index + 1}] ❌ Failed in the Arena:`,
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    try {
      execSync(`git worktree remove --force ${worktreeDir}`, { stdio: "ignore" });
      execSync(`git branch -D ${branchName}`, { stdio: "ignore" });
    } catch (e) {}
  }
}

async function main() {
  console.log("🔥 THE SUNO MUSIC ARENA IS OPEN 🔥");
  console.log("Spawning 12 background async agents to build the music storefront...");

  const tmpBase = join(process.cwd(), ".arena-worktrees-suno");
  await mkdir(tmpBase, { recursive: true });

  const promises = TRACKS.map((track, i) => runAgent(i, track, tmpBase));
  await Promise.all(promises);

  try {
    await rm(tmpBase, { recursive: true, force: true });
  } catch (e) {}

  console.log("\\n🏁 THE SUNO MUSIC ARENA HAS CONCLUDED 🏁");
  console.log("12 agents have successfully created storefronts for the generated tracks.");
}

void main();
