import { execSync } from "node:child_process";
import { isVerbose } from "./verbose.js";

const exec = (cmd: string): string =>
  execSync(cmd, { encoding: "utf-8", cwd: process.cwd() }).trim();

function log(msg: string): void {
  if (isVerbose()) console.log(`    [git] ${msg}`);
}

/** Current branch name */
export function currentBranch(): string {
  return exec("git branch --show-current");
}

/** Fetch latest from origin (and upstream if configured) */
export function fetchLatest(): void {
  log("fetching origin...");
  execSync("git fetch origin", { cwd: process.cwd(), stdio: "pipe" });
  try {
    execSync("git remote get-url upstream", {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    log("fetching upstream...");
    execSync("git fetch upstream", { cwd: process.cwd(), stdio: "pipe" });
  } catch {
    // no upstream remote — fine
  }
}

/** Rebase current branch onto origin/main. Returns true on success. */
export function rebaseOntoMain(): boolean {
  const branch = currentBranch();
  log(`rebasing ${branch} onto origin/main...`);
  try {
    execSync("git rebase origin/main", {
      cwd: process.cwd(),
      stdio: "pipe",
      timeout: 60_000,
    });
    log("rebase succeeded");
    return true;
  } catch {
    log("rebase failed — aborting");
    try {
      execSync("git rebase --abort", { cwd: process.cwd(), stdio: "pipe" });
    } catch {
      // already clean
    }
    return false;
  }
}

/**
 * Ensure we're on main and up-to-date with origin.
 * If on a feature branch, merge main into it first.
 * Returns false if sync failed (manual resolution needed).
 */
export function syncWithMain(): boolean {
  fetchLatest();
  const branch = currentBranch();

  if (branch === "main") {
    // Fast-forward main to origin/main
    log("on main — pulling latest...");
    try {
      execSync("git pull --rebase origin main", {
        cwd: process.cwd(),
        stdio: "pipe",
        timeout: 60_000,
      });
      log("main is up to date");
      return true;
    } catch {
      log("pull --rebase failed — aborting");
      try {
        execSync("git rebase --abort", { cwd: process.cwd(), stdio: "pipe" });
      } catch {
        // already clean
      }
      return false;
    }
  }

  // On feature branch — rebase onto latest main
  return rebaseOntoMain();
}

/** Check if current branch is behind origin/main */
export function isBehindMain(): boolean {
  try {
    const behind = exec("git rev-list --count HEAD..origin/main");
    return parseInt(behind, 10) > 0;
  } catch {
    return false;
  }
}

/** Number of commits ahead of origin/main */
export function commitsAheadOfMain(): number {
  try {
    const ahead = exec("git rev-list --count origin/main..HEAD");
    return parseInt(ahead, 10);
  } catch {
    return 0;
  }
}

/**
 * Squash-merge a feature branch into main and delete it.
 * Call this after the loop completes on a feature branch.
 */
export function squashIntoMain(branchName: string, message: string): boolean {
  log(`squash-merging ${branchName} into main...`);
  try {
    execSync("git checkout main", { cwd: process.cwd(), stdio: "pipe" });
    execSync(`git merge --squash ${branchName}`, {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const escaped = message.replace(/'/g, "'\\''");
    execSync(`git commit -m '${escaped}'`, { cwd: process.cwd(), stdio: "pipe" });
    execSync(`git branch -D ${branchName}`, { cwd: process.cwd(), stdio: "pipe" });
    log("squash-merge complete");
    return true;
  } catch (err) {
    log(`squash-merge failed: ${err}`);
    return false;
  }
}
