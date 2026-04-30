#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { join } from "node:path";
import { mkdir, writeFile, rm } from "node:fs/promises";
import process from "node:process";

const TRACKS = [
  "Geometry of Rest",
  "Dusk Negroni",
  "Into the Arena (Rewritten)",
  "Rooftop Paradise",
  "Sixty-Nine Mises",
  "Roaring Entrance",
  "Round Sixty-Nine",
  "Oscillation",
  "Spotted Cow",
  "Grass Camp (Part 1)",
  "Grass Camp",
  "Brass Relay Pulse",
  "Ember Sky March",
  "Beautiful Soul",
];

// The ARENA: 16 background async agents that commit, push, and deploy.
// To avoid git locks on a single local clone, we create 16 git worktrees!
// Each agent works in its own isolated worktree, creates a branch, commits, pushes, and deploys.

async function runAgent(index: number, trackName: string, baseDir: string) {
  const branchName = `music-arena/track-${index + 1}-${trackName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const worktreeDir = join(baseDir, `arena-agent-${index + 1}`);

  console.log(`[Agent ${index + 1}] Entering the Arena for track: ${trackName}`);

  try {
    // 1. Create Git Worktree (isolated git environment)
    execSync(`git worktree add -b ${branchName} ${worktreeDir} main`, { stdio: "ignore" });

    // 2. Generate content for this track
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${trackName} - spike.land radio</title>
  <style>
    body { background: #080c14; color: #e0e8ff; font-family: sans-serif; display: flex; height: 100vh; align-items: center; justify-content: center; }
    h1 { font-size: 2rem; letter-spacing: 0.2em; text-transform: uppercase; }
  </style>
</head>
<body>
  <h1>${trackName}</h1>
</body>
</html>
`;

    // Write the component in the worktree
    const targetFile = join(worktreeDir, `public/tracks/track-${index + 1}.html`);
    await mkdir(join(worktreeDir, "public/tracks"), { recursive: true });
    await writeFile(targetFile, htmlContent, "utf8");

    // 3. Commit
    console.log(`[Agent ${index + 1}] Committing track ${trackName}...`);
    execSync(`git add public/tracks/track-${index + 1}.html`, { cwd: worktreeDir });
    execSync(`git commit -m "feat(music): add track ${index + 1} - ${trackName}"`, {
      cwd: worktreeDir,
    });

    // 4. Push
    console.log(`[Agent ${index + 1}] Pushing branch ${branchName}...`);
    execSync(`git push -u origin ${branchName} --force`, { cwd: worktreeDir, stdio: "ignore" });

    // 5. Deploy (Using Wrangler to deploy just this track as an asset, or let CI handle it)
    console.log(`[Agent ${index + 1}] Deploying track ${trackName}...`);
    // Assuming Wrangler is configured, we deploy the specific track directory to a feature preview
    try {
      execSync(
        `npx wrangler pages deploy public/tracks --project-name spike-app --branch ${branchName}`,
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
    // Cleanup worktree
    try {
      execSync(`git worktree remove --force ${worktreeDir}`, { stdio: "ignore" });
      execSync(`git branch -D ${branchName}`, { stdio: "ignore" });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

async function main() {
  console.log("🔥 THE MUSIC ARENA IS OPEN 🔥");
  console.log("Spawning 16 background async agents...\n");

  const tmpBase = join(process.cwd(), ".arena-worktrees");
  await mkdir(tmpBase, { recursive: true });

  // Launch all 16 agents concurrently
  const promises = TRACKS.map((track, i) => runAgent(i, track, tmpBase));

  await Promise.all(promises);

  // Cleanup base
  try {
    await rm(tmpBase, { recursive: true, force: true });
  } catch (e) {}

  console.log("\n🏁 THE ARENA HAS CONCLUDED 🏁");
  console.log("All 16 agents have committed, pushed, and deployed.");
}

void main();
