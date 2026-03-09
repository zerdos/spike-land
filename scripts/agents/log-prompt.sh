#!/usr/bin/env bash
set -euo pipefail

AGENT="${1:-}"
MODE="${2:-}"
PROMPT="${3:-}"

if [ -z "$AGENT" ] || [ -z "$PROMPT" ]; then
  echo "Usage: bash scripts/agents/log-prompt.sh <agent> <mode> <prompt>" >&2
  exit 1
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
HISTORY_DIR="$ROOT/.prompt-history"
FILE="$HISTORY_DIR/${AGENT}.md"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
TITLE="$(printf '%s' "$AGENT" | awk '{ print toupper(substr($0, 1, 1)) substr($0, 2) }')"

mkdir -p "$HISTORY_DIR"

if [ ! -f "$FILE" ]; then
  printf '# %s Prompt History\n\n' "$TITLE" >"$FILE"
fi

{
  printf '## %s\n' "$TIMESTAMP"
  printf -- '- cwd: `%s`\n' "$PWD"
  if [ -n "$MODE" ]; then
    printf -- '- mode: `%s`\n' "$MODE"
  fi
  if [ -n "${PROMPT_REPO:-}" ]; then
    printf -- '- repo: `%s`\n' "$PROMPT_REPO"
  fi
  printf '\n```text\n%s\n```\n\n' "$PROMPT"
} >>"$FILE"
