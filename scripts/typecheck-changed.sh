#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BASE_REF="HEAD"
HEAD_REF="WORKTREE"

while [ $# -gt 0 ]; do
  case "$1" in
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

ROOT_TYPECHECK=0
WORKSPACES=()

while IFS= read -r path; do
  [[ -n "$path" ]] || continue

  case "$path" in
    package.json|tsconfig*.json|eslint.config.*|vitest.config.*|scripts/*.ts|src/core/*|src/edge-api/*|src/mcp-tools/*|src/cli/*|src/utilities/*)
      ROOT_TYPECHECK=1
      ;;
  esac

  case "$path" in
    packages/*/*)
      workspace_dir=$(echo "$path" | cut -d'/' -f1-2)
      if [[ -f "$REPO_ROOT/$workspace_dir/package.json" ]]; then
        WORKSPACES+=("$workspace_dir")
      fi
      ;;
    src/monaco-editor/*)
      if [[ -f "$REPO_ROOT/src/monaco-editor/package.json" ]]; then
        WORKSPACES+=("src/monaco-editor")
      fi
      ;;
  esac
done < <(get_changed_files)

if [[ "$ROOT_TYPECHECK" -eq 1 ]]; then
  cd "$REPO_ROOT"
  echo "==> Running root typecheck..." >&2
  yarn typecheck
fi

mapfile -t UNIQUE_WORKSPACES < <(printf "%s\n" "${WORKSPACES[@]}" | awk 'NF' | sort -u)

RAN_WORKSPACE_CHECK=0
for workspace_dir in "${UNIQUE_WORKSPACES[@]}"; do
  if [[ ! -f "$REPO_ROOT/$workspace_dir/package.json" ]]; then
    continue
  fi

  has_typecheck=$(node -e "const pkg=require(process.argv[1]); console.log(pkg.scripts && pkg.scripts.typecheck ? 'yes' : 'no');" "$REPO_ROOT/$workspace_dir/package.json")
  if [[ "$has_typecheck" != "yes" ]]; then
    continue
  fi

  workspace_name=$(node -e "const pkg=require(process.argv[1]); console.log(pkg.name);" "$REPO_ROOT/$workspace_dir/package.json")
  if [[ -z "$workspace_name" ]]; then
    continue
  fi

  cd "$REPO_ROOT"
  echo "==> Running typecheck for $workspace_name..." >&2
  yarn workspace "$workspace_name" run typecheck
  RAN_WORKSPACE_CHECK=1
done

if [[ "$ROOT_TYPECHECK" -eq 0 && "$RAN_WORKSPACE_CHECK" -eq 0 ]]; then
  echo "No typecheck-relevant changes detected. Skipping typecheck."
fi
