#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: bash scripts/agents/gemini-plan.sh \"prompt\"" >&2
  echo "   or: echo \"prompt\" | bash scripts/agents/gemini-plan.sh" >&2
}

if ! command -v gemini >/dev/null 2>&1; then
  echo "gemini CLI not found on PATH." >&2
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

APPROVAL_MODE="${GEMINI_APPROVAL_MODE:-plan}"
OUTPUT_FORMAT="${GEMINI_OUTPUT_FORMAT:-text}"
MODEL="${GEMINI_MODEL:-}"
INCLUDE_DIRECTORIES="${GEMINI_INCLUDE_DIRECTORIES:-}"

PROMPT_REPO="$(git remote get-url origin 2>/dev/null | sed -E 's#^git@github.com:##; s#^https://github.com/##; s#\.git$##' || true)"
if [ "${AGENT_SKIP_PROMPT_LOG:-0}" != "1" ]; then
  PROMPT_REPO="$PROMPT_REPO" bash scripts/agents/log-prompt.sh gemini "$APPROVAL_MODE" "$PROMPT"
fi

ARGS=(--approval-mode "$APPROVAL_MODE" --output-format "$OUTPUT_FORMAT" -p "$PROMPT")
if [ -n "$MODEL" ]; then
  ARGS=(-m "$MODEL" "${ARGS[@]}")
fi
if [ -n "$INCLUDE_DIRECTORIES" ]; then
  ARGS+=(--include-directories "$INCLUDE_DIRECTORIES")
fi

STDOUT_FILE="$(mktemp)"
STDERR_FILE="$(mktemp)"
trap 'rm -f "$STDOUT_FILE" "$STDERR_FILE"' EXIT

filter_noise() {
  sed \
    -e '/^Loaded cached credentials\.$/d' \
    -e '/^MCP issues detected\. Run \/mcp list for status\.$/d' \
    -e '/^Skill ".*" from ".*" is overriding the built-in skill\.$/d' \
    -e '/^Both GOOGLE_API_KEY and GEMINI_API_KEY are set\..*$/d'
}

if gemini "${ARGS[@]}" >"$STDOUT_FILE" 2>"$STDERR_FILE"; then
  filter_noise <"$STDOUT_FILE"
  if [ "${GEMINI_SHOW_WARNINGS:-0}" = "1" ] && [ -s "$STDERR_FILE" ]; then
    cat "$STDERR_FILE" >&2
  fi
  exit 0
fi

if [ -s "$STDERR_FILE" ]; then
  cat "$STDERR_FILE" >&2
fi
if [ -s "$STDOUT_FILE" ]; then
  cat "$STDOUT_FILE"
fi
exit 1
