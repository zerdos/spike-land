#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

FIX_MODE=0
BASE_REF="HEAD"
HEAD_REF="WORKTREE"

while [ $# -gt 0 ]; do
  case "$1" in
    --fix)
      FIX_MODE=1
      shift
      ;;
    --base)
      BASE_REF="$2"
      shift 2
      ;;
    --head)
      HEAD_REF="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

get_changed_files() {
  if [[ "$HEAD_REF" == "WORKTREE" ]]; then
    local tracked
    local untracked
    tracked=$(git -C "$REPO_ROOT" diff --name-only "$BASE_REF")
    untracked=$(git -C "$REPO_ROOT" ls-files --others --exclude-standard)
    printf "%s\n%s\n" "$tracked" "$untracked" | awk 'NF' | sort -u
  else
    git -C "$REPO_ROOT" diff --name-only "$BASE_REF" "$HEAD_REF"
  fi
}

LINT_FILES=()
while IFS= read -r path; do
  [[ -n "$path" ]] || continue
  case "$path" in
    *.js|*.jsx|*.mjs|*.cjs|*.ts|*.tsx)
      ;;
    *)
      continue
      ;;
  esac

  if [[ -f "$REPO_ROOT/$path" ]]; then
    LINT_FILES+=("$path")
  fi
done < <(get_changed_files)

if [[ ${#LINT_FILES[@]} -eq 0 ]]; then
  echo "No ESLint-relevant changes detected. Skipping lint."
  exit 0
fi

cd "$REPO_ROOT"
if [[ "$FIX_MODE" -eq 1 ]]; then
  echo "==> Lint-fixing ${#LINT_FILES[@]} changed file(s)..." >&2
  yarn eslint --fix --no-error-on-unmatched-pattern --no-warn-ignored "${LINT_FILES[@]}"
else
  echo "==> Lint-checking ${#LINT_FILES[@]} changed file(s)..." >&2
  yarn eslint --no-error-on-unmatched-pattern --no-warn-ignored "${LINT_FILES[@]}"
fi
