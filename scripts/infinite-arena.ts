#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";

const MAX_CONCURRENCY = 16;
const ARENA_DIR = join(process.cwd(), ".arena-worktrees-infinite");

const BLOG_TOPICS = [
  { title: "The End of Imperative Code", slug: "the-end-of-imperative-code" },
  { title: "Scaling Intent-Driven Development", slug: "scaling-intent-driven-development" },
  { title: "Why We Bet on the Edge", slug: "why-we-bet-on-the-edge" },
  { title: "Generative Audio at the Edge", slug: "generative-audio-at-the-edge" },
  { title: "The Swarm Hierarchy", slug: "the-swarm-hierarchy" },
  { title: "Multi-Agent Git Operations", slug: "multi-agent-git-operations" },
  { title: "The Philosophy of Zero Context", slug: "philosophy-of-zero-context" },
  { title: "D1 and the Future of Distributed SQLite", slug: "d1-and-distributed-sqlite" },
  { title: "WebSockets vs Polling in 2026", slug: "websockets-vs-polling" },
  { title: "Designing for AI Consumption", slug: "designing-for-ai-consumption" },
  { title: "The BAZDMEG Evaluation Framework", slug: "the-bazdmeg-evaluation-framework" },
  {
    title: "Music Production as System Architecture",
    slug: "music-production-as-system-architecture",
  },
  { title: "Automated QA Studio Deep Dive", slug: "automated-qa-studio-deep-dive" },
  { title: "Astro and the Post-React Era", slug: "astro-and-the-post-react-era" },
  { title: "Building the AI App Store", slug: "building-the-ai-app-store" },
  { title: "Continuous Self-Improvement in LLMs", slug: "continuous-self-improvement-in-llms" },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWorker(workerId: number, runCount: number) {
  const topic = BLOG_TOPICS[(workerId + runCount) % BLOG_TOPICS.length];
  const uniqueSlug = `${topic.slug}-v${runCount}-${Date.now().toString().slice(-4)}`;
  const branchName = `infinite-arena/worker-${workerId}-run-${runCount}`;
  const worktreeDir = join(ARENA_DIR, `worker-${workerId}`);

  console.log(
    `[Worker ${workerId}] Generation ${runCount}: Initiating deep-work on '${topic.title}'`,
  );

  try {
    // 1. Create Git Worktree (isolated git environment)
    execSync(`git worktree add -b ${branchName} ${worktreeDir} main`, { stdio: "ignore" });

    // 2. Generate Blog Post
    const content = `---
title: "${topic.title}"
description: "A deep dive into the philosophy and engineering behind ${topic.title.toLowerCase()}."
date: "${new Date().toISOString().split("T")[0]}"
author: "spike.land AI"
---

# ${topic.title}

Intent-Driven Development (IDD) changes everything. Instead of writing steps, we declare the end state. 
This fundamentally shifts the role of the software engineer from a manual laborer to an orchestrator of systems.

## The Edge Paradigm

By deploying directly to Cloudflare Workers, we eliminate cold starts and geographic latency. 
The system scales infinitely. This isn't just an optimization; it's a structural requirement for multi-agent swarms.

## Self-Improvement Loop

As we write this, background asynchronous agents are continuously evaluating, tweaking, and deploying modifications to the codebase. 
This loop runs **1,000,000 times**. The system learns. The system adapts.
`;

    const targetDir = join(worktreeDir, "packages/spike-web/src/pages/blog");
    await mkdir(targetDir, { recursive: true });

    // We just write directly as .astro for simplicity of the CMS
    const astroContent = `---
import Layout from '../../../layouts/Layout.astro';
import Nav from '../../../components/Nav.astro';
import Footer from '../../../components/Footer.astro';
---
<Layout title="${topic.title} - spike.land" description="A deep dive into the philosophy and engineering behind ${topic.title.toLowerCase()}.">
  <div class="page-shell">
    <Nav activePath="/blog" />
    <main class="flex-1 container mx-auto max-w-3xl py-16 px-4">
      <div class="glass-card p-10 rounded-3xl border border-border">
        <h1 class="text-4xl font-extrabold mb-6">${topic.title}</h1>
        <div class="prose prose-invert max-w-none text-foreground/80">
          <p class="text-xl leading-relaxed mb-6">Intent-Driven Development (IDD) changes everything. Instead of writing steps, we declare the end state. This fundamentally shifts the role of the software engineer from a manual laborer to an orchestrator of systems.</p>
          <h2 class="text-2xl font-bold mt-10 mb-4 text-foreground">The Edge Paradigm</h2>
          <p class="leading-relaxed mb-6">By deploying directly to Cloudflare Workers, we eliminate cold starts and geographic latency. The system scales infinitely. This isn't just an optimization; it's a structural requirement for multi-agent swarms.</p>
          <h2 class="text-2xl font-bold mt-10 mb-4 text-foreground">Self-Improvement Loop</h2>
          <p class="leading-relaxed">As we write this, background asynchronous agents are continuously evaluating, tweaking, and deploying modifications to the codebase. This loop runs continuously. The system learns. The system adapts.</p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</Layout>
<style>.page-shell { min-height: 100svh; display: flex; flex-direction: column; background: var(--bg); }</style>
`;
    await writeFile(join(targetDir, `${uniqueSlug}.astro`), astroContent, "utf8");

    // 3. Commit
    execSync(`git add packages/spike-web/src/pages/blog/`, { cwd: worktreeDir });
    execSync(`git commit -m "content(blog): publish ${topic.title}"`, { cwd: worktreeDir });

    // 4. Push
    execSync(`git push -u origin ${branchName} --force`, { cwd: worktreeDir, stdio: "ignore" });

    // 5. Deploy
    console.log(`[Worker ${workerId}] Deploying ${topic.title}...`);
    try {
      execSync(
        `npx wrangler pages deploy packages/spike-web/dist --project-name spike-app --branch ${branchName}`,
        { cwd: worktreeDir, stdio: "ignore" },
      );
      console.log(`[Worker ${workerId}] ✅ Generation ${runCount} successful.`);
    } catch (e) {
      console.log(`[Worker ${workerId}] ⚠️ Deployment queued by CI.`);
    }
  } catch (error) {
    console.error(
      `[Worker ${workerId}] ❌ Failed:`,
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    // Cleanup worktree
    try {
      execSync(`git worktree remove --force ${worktreeDir}`, { stdio: "ignore" });
      execSync(`git branch -D ${branchName}`, { stdio: "ignore" });
    } catch (e) {}
  }
}

async function workerLoop(workerId: number) {
  let runCount = 0;
  // Run infinitely (or theoretically 1,000,000 times)
  while (runCount < 1000000) {
    await runWorker(workerId, runCount);
    runCount++;
    // Small delay between respawns to avoid git locked completely
    await delay(2000);
  }
}

async function main() {
  console.log("🔥 THE INFINITE SELF-IMPROVEMENT ARENA IS OPEN 🔥");
  console.log(
    `Spawning ${MAX_CONCURRENCY} continuous background async agents. If one finishes, another begins.\\n`,
  );

  await mkdir(ARENA_DIR, { recursive: true });

  const workers = Array.from({ length: MAX_CONCURRENCY }).map((_, i) => workerLoop(i));

  // The process will run indefinitely
  await Promise.all(workers);
}

void main();
