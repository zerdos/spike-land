#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: bash scripts/agents/claude-plan.sh \"prompt\"" >&2
  echo "   or: echo \"prompt\" | bash scripts/agents/claude-plan.sh" >&2
}

if ! command -v claude >/dev/null 2>&1; then
  echo "claude CLI not found on PATH." >&2
  exit 1
fi

if [ "$#" -gt 0 ]; then
  PROMPT="$*"
elif [ ! -t 0 ]; then
  PROMPT="$(cat)"
else
  usage
  exit 1
fi

OUTPUT_FORMAT="${CLAUDE_OUTPUT_FORMAT:-text}"
MODEL="${CLAUDE_MODEL:-}"

PROMPT_REPO="$(git remote get-url origin 2>/dev/null | sed -E 's#^git@github.com:##; s#^https://github.com/##; s#\.git$##' || true)"
PROMPT_REPO="$PROMPT_REPO" bash scripts/agents/log-prompt.sh claude "plan" "$PROMPT"

ARGS=(-p --permission-mode plan --output-format "$OUTPUT_FORMAT")
if [ -n "$MODEL" ]; then
  ARGS+=(--model "$MODEL")
fi

exec env -u CLAUDECODE claude "${ARGS[@]}" "$PROMPT"
