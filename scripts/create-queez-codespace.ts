#!/usr/bin/env tsx
/**
 * create-queez-codespace.ts — Reproducible scaffold for /apps/queez
 *
 * One-shot script that posts the exact `apps_create` payload used to spin up
 * the Queez dashboard codespace. Commit this file so the codespace can be
 * recreated deterministically (spike.land app source lives in D1, not in this
 * repo — this script is the source of truth for the creation prompt).
 *
 * Usage:
 *   SPIKE_LAND_API_URL=https://spike.land \
 *   SPIKE_LAND_TOKEN=<bearer> \
 *   tsx scripts/create-queez-codespace.ts
 *
 * The Queez app receives a `codespace` and `task` via search params and drives
 * a quiz-style planning interview against the queez_start / queez_answer MCP
 * tools registered in spike-land-mcp. On PASS it streams a synthesized plan
 * via /v1/thread into an AgentChatPanel. If `return` is supplied, the plan is
 * posted back to window.opener via postMessage (see scripts doc in the app).
 */

const QUEEZ_CODESPACE_ID = "queez";
const QUEEZ_TEMPLATE_ID = "dashboard";

/**
 * The prompt is kept verbose on purpose — the dashboard generator needs to
 * know the exact URL schema, the two MCP tools to call, and the UI components
 * to reuse. Any drift from this prompt should be reflected back here so the
 * next re-scaffold stays honest.
 */
const QUEEZ_PROMPT = `Build a parameterized dashboard app named "Queez" — a quiz-style interactive planner that runs a BAZDMEG-style planning interview for any spike.land app.

URL SCHEMA (all via searchParams on the app's route):
  - codespace  (required) — target app slug; passed as codespace_id to the MCP tool
  - task       (required) — free-text description of what the user wants to plan for that app
  - return     (optional) — URL of the parent window; when set, postMessage the final plan to window.opener instead of rendering inline

If codespace or task is missing, render a small inline form that asks for them and updates the URL via history.replaceState before starting.

MCP WIRING (call these tools over the spike.land MCP endpoint the app already has configured):
  1. On start, call queez_start({ codespace_id, task_description: task }). Persist the returned sessionId in component state. Render the firstRound using the <QuizRound /> component from @/ui/components/quiz/QuizRound — pass each question (3 per round, 4 options each) and collect the user's 3 answers as a tuple [0..3, 0..3, 0..3].
  2. On submit, call queez_answer({ session_id: sessionId, answers }). Update the mastery progress bar from the returned progress[] array (6 concepts: file_awareness, test_strategy, edge_cases, dependency_chain, failure_modes, verification).
  3. Based on verdict:
     - "CONTINUE"            → render nextRound in <QuizRound />
     - "FAIL_LOW_SCORE"      → show the recommendation + a "Retry" button that calls queez_start again
     - "FAIL_CONTRADICTIONS" → same, but emphasise the contradictions[] list
     - "PASS"                → stream a synthesised plan via POST /v1/thread, render it in <AgentChatPanel /> from @/ui/components/AgentChatPanel. System message: "You are a senior engineer synthesising a plan for the user's task. The user has just passed a 6-concept understanding check for app '<appName>'. Produce a step-by-step plan grounded in the quiz answers."

RETURN BEHAVIOUR:
  - If searchParams.return is a valid URL and window.opener exists, on PASS post { type: "queez:plan", plan, sessionId, codespaceId } to window.opener via postMessage and close the window after a 200ms delay.
  - Otherwise, render the plan inline in the AgentChatPanel.

UX NOTES:
  - Show the app name, tagline, and category (from queez_start's response appContext) in a header so the user sees what they're planning for.
  - Show "Round N" and a mastery progress bar (mastered / total concepts).
  - Show contradictions as warning chips — don't hide them.
  - Preserve state across refresh by writing sessionId to sessionStorage.

DO NOT build any of this yourself if a shadcn-ui primitive or the existing QuizRound / AgentChatPanel components already cover it — import them.`;

interface AppsCreatePayload {
  prompt: string;
  codespaceId: string;
  templateId: string;
}

const payload: AppsCreatePayload = {
  prompt: QUEEZ_PROMPT,
  codespaceId: QUEEZ_CODESPACE_ID,
  templateId: QUEEZ_TEMPLATE_ID,
};

async function main(): Promise<void> {
  const apiUrl = process.env["SPIKE_LAND_API_URL"];
  const token = process.env["SPIKE_LAND_TOKEN"];

  if (!apiUrl || !token) {
    console.error("Missing env: set SPIKE_LAND_API_URL and SPIKE_LAND_TOKEN.");
    console.error("");
    console.error("Dry-run payload:");
    console.error(JSON.stringify(payload, null, 2));
    process.exit(1);
  }

  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/apps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`apps_create failed (${res.status}): ${text}`);
    process.exit(1);
  }

  console.log(text);
  console.log("");
  console.log(
    `Visit: ${apiUrl.replace(/\/$/, "")}/apps/${QUEEZ_CODESPACE_ID}?codespace=<id>&task=<desc>`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
