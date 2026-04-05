# Agent Playbook

This note records a local benchmark run on March 9, 2026 for `claude`, `gemini`, and `jules` from `/Users/z/Developer/spike-land-ai`.

## Environment

- `claude` 2.1.71: authenticated and usable locally
- `gemini` 0.32.1: authenticated and usable locally
- `jules` v0.1.42: authenticated, but `spike-land-ai/spike-land` is not connected in Jules

## Benchmark

| Agent | Small task | Practical task | What it showed |
| --- | --- | --- | --- |
| Claude | Correct repo-inspection JSON in 21.6s | Correct temp file write in 15.3s | Best default local development agent here |
| Gemini | Correct workspace mismatch, but could not answer dirty-worktree status in plan mode; 46.4s | Correct temp file write in 31.8s | Useful, but noisier and less predictable than Claude |
| Jules | Session creation succeeded in 5.7s on `spike-land-ai/demo-repository`; trivial patch completed on the remote repo | Not usable against this repo until the repo is connected in Jules | Best for async delegation, not for local dirty-tree work |

## Findings

- The root `package.json` and `README.md` in the umbrella repo disagree about workspace layout.
- Claude handled the local repository context best, including dirty files.
- Gemini can write local files successfully, but startup stderr is noisy because of local MCP discovery and config warnings.
- Jules operates on connected remote repositories, so it does not see this local checkout's unstaged changes.

## Recommended Roles

- Claude: first choice for scoped code edits, debugging, repo inspection, and fast local iteration.
- Gemini: first choice for test-quality work, coverage closure, assertion tightening, and dependency slimming.
- Jules: async parallel worker for independent tasks on repos that are already connected in Jules. Avoid it for work that depends on local uncommitted changes.

## Quality Defaults

- Target 100% coverage on touched business logic, including branches.
- Do not chase synthetic coverage by padding brittle integration tests. Extract pure logic from framework shells and test that directly.
- Default to no new third-party dependencies for test work. Prefer Vitest, existing helpers, local fakes, and small in-repo utilities.
- Use Gemini for the review loop when the goal is better tests, stronger assertions, or fewer dependencies.

## Helper Commands

- `yarn agent:claude:plan "Inspect package.json and README.md for workspace mismatches"`
- `yarn agent:gemini:plan "Review the changed files for obvious bugs"`
- `yarn agent:status`
- `yarn agent:triage:outage`
- `yarn agent:jules:repos`
- `yarn agent:jules:sessions`
- `yarn agent:jules:new --repo spike-land-ai/demo-repository "Create a smoke-test note and stop"`

## Orchestration

The first orchestrator lives at `scripts/agents/orchestrate.ts` in the umbrella repo.

- `status` verifies agent availability, auth state, and Jules repo connectivity.
- `triage-outage` gathers a live production baseline, fans out read-only prompts to Claude and Gemini in parallel, queues Jules if the repo is connected, and writes a merged incident brief plus raw artifacts under `.prompt-history/runs/<date>/<run-id>/`.

## Next Step

If you want Jules in the normal loop for this repo, connect `spike-land-ai/spike-land` in Jules first. Until then, treat Jules as available for other connected repos only.
