#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: bash scripts/agents/jules-new.sh [--repo owner/repo] \"prompt\"" >&2
  echo "   or: echo \"prompt\" | bash scripts/agents/jules-new.sh [--repo owner/repo]" >&2
}

if ! command -v jules >/dev/null 2>&1; then
  echo "jules CLI not found on PATH." >&2
  exit 1
fi

REPO="${JULES_REPO:-}"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo)
      if [ "$#" -lt 2 ]; then
        usage
        exit 1
      fi
      REPO="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    *)
      break
      ;;
  esac
done

if [ "$#" -gt 0 ]; then
  PROMPT="$*"
elif [ ! -t 0 ]; then
  PROMPT="$(cat)"
else
  usage
  exit 1
fi

if [ -z "$REPO" ] && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
  if [ -n "$REMOTE_URL" ]; then
    REPO="$(printf '%s\n' "$REMOTE_URL" | sed -E 's#^git@github.com:##; s#^https://github.com/##; s#\.git$##')"
  fi
fi

if [ -z "$REPO" ]; then
  echo "Could not determine a GitHub repo slug. Pass --repo owner/repo or set JULES_REPO." >&2
  exit 1
fi

CONNECTED_REPOS="$(jules remote list --repo 2>/dev/null || true)"
if ! printf '%s\n' "$CONNECTED_REPOS" | grep -Fxq "$REPO"; then
  echo "Jules repo '$REPO' is not connected for this account." >&2
  if [ -n "$CONNECTED_REPOS" ]; then
    echo "Connected repos:" >&2
    printf '%s\n' "$CONNECTED_REPOS" >&2
  fi
  exit 1
fi

PROMPT_REPO="$REPO" bash scripts/agents/log-prompt.sh jules "async" "$PROMPT"

exec jules new --repo "$REPO" "$PROMPT"
