#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: bash scripts/agents/gemini-test-quality.sh \"task\"" >&2
  echo "   or: echo \"task\" | bash scripts/agents/gemini-test-quality.sh" >&2
}

if [ "$#" -gt 0 ]; then
  TASK="$*"
elif [ ! -t 0 ]; then
  TASK="$(cat)"
else
  usage
  exit 1
fi

MODEL="${GEMINI_TEST_MODEL:-gemini-3-flash}"
APPROVAL_MODE="${GEMINI_TEST_APPROVAL_MODE:-plan}"
ALLOW_FALLBACK="${GEMINI_TEST_ALLOW_DEFAULT_MODEL_FALLBACK:-1}"

PROMPT="$(cat <<EOF
You are improving test quality and coverage in the spike-land-ai repo.

Primary goals:
- Reach 100% coverage for the touched business logic, including branches.
- Improve assertion quality, not just line coverage.
- Prefer extracting pure logic from worker, router, and framework shells into testable modules.
- Keep external dependencies minimal.
- Do not add new third-party dependencies unless the existing toolchain cannot reasonably solve the problem.
- Prefer Vitest, existing helpers, local fakes, and small in-repo utilities over heavier mocks.

Required output:
1. Coverage gaps and weak assertions you found.
2. Exact code and test changes you recommend.
3. Whether any dependency addition is justified; default is "no".
4. Exact commands to verify.

Task:
$TASK
EOF
)"

PROMPT_REPO="$(git remote get-url origin 2>/dev/null | sed -E 's#^git@github.com:##; s#^https://github.com/##; s#\\.git$##' || true)"
PROMPT_REPO="$PROMPT_REPO" bash scripts/agents/log-prompt.sh gemini "test-quality" "$PROMPT"

if AGENT_SKIP_PROMPT_LOG=1 GEMINI_APPROVAL_MODE="$APPROVAL_MODE" GEMINI_MODEL="$MODEL" \
  bash scripts/agents/gemini-plan.sh "$PROMPT"; then
  exit 0
fi

if [ "$ALLOW_FALLBACK" = "1" ]; then
  echo "Preferred Gemini model '$MODEL' failed; retrying with the Gemini CLI default model." >&2
  exec env AGENT_SKIP_PROMPT_LOG=1 GEMINI_APPROVAL_MODE="$APPROVAL_MODE" GEMINI_MODEL= \
    bash scripts/agents/gemini-plan.sh "$PROMPT"
fi

exit 1
