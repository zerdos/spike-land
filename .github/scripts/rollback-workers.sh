#!/usr/bin/env bash
# rollback-workers.sh — Automated rollback for one or all Cloudflare Workers
# in this monorepo. Resolves the previous deployment automatically by parsing
# `npx wrangler deployments list --json` with jq.
#
# Usage:
#   rollback-workers.sh --worker <name|all> [--version <id>] [--yes]
#
# Flags:
#   --worker <name|all>  Target worker (wrangler `name = "..."`) or "all".
#   --version <id>       Optional explicit deployment/version id to roll back
#                        to. Defaults to the deployment immediately preceding
#                        the current one (i.e., the previous deploy).
#   --yes                Skip the interactive y/N confirmation. Required for
#                        running this script unattended in CI.
#   -h | --help          Print this usage text and exit 0.
#
# Examples:
#   ./.github/scripts/rollback-workers.sh --worker spike-edge
#   ./.github/scripts/rollback-workers.sh --worker all --yes
#   ./.github/scripts/rollback-workers.sh --worker mcp-auth --version 123abc
#
# Requirements:
#   - bash 3.2+ (POSIX-friendly, works on macOS default bash and CI bash 5)
#   - jq                 (parsing wrangler JSON output)
#   - npx + wrangler     (deployments list / rollback)
#   - CLOUDFLARE_API_TOKEN env var with Workers Scripts: Edit permission.
#
# Exit codes:
#   0  All targeted rollbacks succeeded.
#   1  Argument / environment error, or one or more rollbacks failed.
#   2  User declined the confirmation prompt.
#
# Safety:
#   `wrangler rollback` is a live traffic switch. The script always prints the
#   full plan (worker, package directory, current version, target version)
#   first, then prompts for explicit y/N confirmation unless --yes is passed.

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration — keep in sync with packages/*/wrangler.toml `name = "..."`.
#
# Two parallel arrays (avoids requiring bash 4 associative arrays):
#   WORKER_NAMES[i]  — wrangler service name as published to Cloudflare
#   WORKER_DIRS[i]   — package directory (relative to repo root)
# ---------------------------------------------------------------------------

WORKER_NAMES=(
  esbuild
  mcp-auth
  spike-land-mcp
  spike-review
  image-studio-mcp
  spike-chat
  spike-notepad
  spike-land
  spike-edge
)

WORKER_DIRS=(
  packages/transpile
  packages/mcp-auth
  packages/spike-land-mcp
  packages/spike-review
  packages/image-studio-worker
  packages/spike-chat
  packages/spike-notepad
  packages/spike-land-backend
  packages/spike-edge
)

# Deploy waves (rollback runs in reverse order: wave 2 first, then wave 1)
# so we never leave a new wave-2 worker pointing at an old wave-1 dep.
WAVE1_WORKERS=(
  esbuild
  mcp-auth
  spike-land-mcp
  spike-review
  image-studio-mcp
  spike-chat
  spike-notepad
)

WAVE2_WORKERS=(
  spike-land
  spike-edge
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

log() { echo "[rollback] $*"; }
err() { echo "[rollback] ERROR: $*" >&2; }

usage() {
  sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    err "Required command not found on PATH: $cmd"
    exit 1
  fi
}

require_token() {
  if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
    err "CLOUDFLARE_API_TOKEN is not set. Cannot roll back."
    exit 1
  fi
}

# Resolve absolute repo root (parent of .github/scripts/).
script_dir() { cd "$(dirname "${BASH_SOURCE[0]}")" && pwd; }
repo_root()  { cd "$(script_dir)/../.." && pwd; }

# lookup_dir <worker-name> -> echoes directory or empty string.
lookup_dir() {
  local needle="$1"
  local i
  for i in "${!WORKER_NAMES[@]}"; do
    if [ "${WORKER_NAMES[$i]}" = "$needle" ]; then
      printf '%s\n' "${WORKER_DIRS[$i]}"
      return 0
    fi
  done
  return 1
}

# describe_worker <name> -> echoes "<dir>" on stdout, or returns 1.
describe_worker() {
  local name="$1"
  local dir
  if ! dir="$(lookup_dir "$name")" || [ -z "$dir" ]; then
    err "Unknown worker '$name'. Update WORKER_NAMES/WORKER_DIRS in $(basename "$0")."
    return 1
  fi
  local root
  root="$(repo_root)"
  if [ ! -d "$root/$dir" ]; then
    err "Package directory '$dir' not found in repo root '$root'."
    return 1
  fi
  printf '%s\n' "$dir"
}

# list_deployments_json <worker-dir> -> JSON array of deployments (newest first).
list_deployments_json() {
  local dir="$1"
  ( cd "$(repo_root)/$dir" && npx --yes wrangler deployments list --json )
}

# resolve_versions <worker-dir>
# Echoes "<current-id> <previous-id>". Wrangler returns deployments newest
# first; index 0 = current/active, index 1 = previous deployment.
resolve_versions() {
  local dir="$1"
  local json
  if ! json="$(list_deployments_json "$dir" 2>/dev/null)"; then
    err "Failed to list deployments in '$dir'."
    return 1
  fi

  local count
  count="$(printf '%s' "$json" | jq 'length' 2>/dev/null || echo 0)"
  if [ -z "$count" ] || [ "$count" -lt 2 ]; then
    err "Worker in '$dir' has fewer than 2 deployments (count=${count:-0}); nothing to roll back to."
    return 1
  fi

  local current previous
  current="$(printf '%s' "$json" | jq -r '.[0].id // .[0].version_id // .[0].deployment_id // empty')"
  previous="$(printf '%s' "$json" | jq -r '.[1].id // .[1].version_id // .[1].deployment_id // empty')"
  if [ -z "$current" ] || [ -z "$previous" ]; then
    err "Could not parse deployment ids from wrangler JSON output."
    return 1
  fi
  printf '%s %s\n' "$current" "$previous"
}

# rollback_worker <name> <version-id>
# Performs the actual rollback. Returns 0 on success, 1 on failure.
rollback_worker() {
  local name="$1"
  local version="$2"
  local dir
  if ! dir="$(describe_worker "$name")"; then
    return 1
  fi

  log "Rolling back '$name' (dir: $dir) -> $version"
  if ( cd "$(repo_root)/$dir" \
        && npx --yes wrangler rollback "$version" \
             --message "automated rollback via rollback-workers.sh" ); then
    log "  '$name' rolled back successfully."
    return 0
  else
    local rc=$?
    err "  '$name' rollback failed (exit $rc)."
    return 1
  fi
}

# ---------------------------------------------------------------------------
# Argument parsing (long flags only)
# ---------------------------------------------------------------------------

WORKER_ARG=""
VERSION_ARG=""
ASSUME_YES=0

while [ $# -gt 0 ]; do
  case "$1" in
    --worker)
      [ $# -ge 2 ] || { err "--worker requires a value"; exit 1; }
      WORKER_ARG="$2"
      shift 2
      ;;
    --version)
      [ $# -ge 2 ] || { err "--version requires a value"; exit 1; }
      VERSION_ARG="$2"
      shift 2
      ;;
    --yes|-y)
      ASSUME_YES=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      err "Unknown argument: $1"
      usage >&2
      exit 1
      ;;
  esac
done

if [ -z "$WORKER_ARG" ]; then
  err "Missing required flag: --worker <name|all>"
  usage >&2
  exit 1
fi

require_cmd jq
require_cmd npx
require_token

# ---------------------------------------------------------------------------
# Build target list
# ---------------------------------------------------------------------------

TARGETS=()
if [ "$WORKER_ARG" = "all" ]; then
  if [ -n "$VERSION_ARG" ]; then
    err "--version cannot be combined with --worker all (versions are per-worker)."
    exit 1
  fi
  TARGETS=( "${WAVE2_WORKERS[@]}" "${WAVE1_WORKERS[@]}" )
else
  if ! lookup_dir "$WORKER_ARG" >/dev/null; then
    err "Unknown worker '$WORKER_ARG'. Known workers:"
    for n in "${WORKER_NAMES[@]}"; do err "  - $n"; done
    exit 1
  fi
  TARGETS=( "$WORKER_ARG" )
fi

# ---------------------------------------------------------------------------
# Plan: resolve target versions for each worker before any rollback runs.
# We build parallel arrays (no associative arrays) to track plan state.
# ---------------------------------------------------------------------------

PLAN_DIRS=()
PLAN_CURRENT=()
PLAN_TARGET=()
PLAN_FAIL=0

log "Resolving rollback plan for ${#TARGETS[@]} worker(s)..."
for w in "${TARGETS[@]}"; do
  dir=""
  if ! dir="$(describe_worker "$w")"; then
    PLAN_DIRS+=( "?" )
    PLAN_CURRENT+=( "(unresolved)" )
    PLAN_TARGET+=( "(unresolved)" )
    PLAN_FAIL=1
    continue
  fi
  PLAN_DIRS+=( "$dir" )

  if [ -n "$VERSION_ARG" ]; then
    PLAN_CURRENT+=( "(unknown — explicit --version supplied)" )
    PLAN_TARGET+=( "$VERSION_ARG" )
  else
    versions=""
    if versions="$(resolve_versions "$dir")"; then
      PLAN_CURRENT+=( "$(printf '%s' "$versions" | awk '{print $1}')" )
      PLAN_TARGET+=( "$(printf '%s' "$versions" | awk '{print $2}')" )
    else
      PLAN_CURRENT+=( "(unresolved)" )
      PLAN_TARGET+=( "(unresolved)" )
      PLAN_FAIL=1
    fi
  fi
done

echo
echo "=========================================================================="
echo " Rollback plan"
echo "=========================================================================="
printf ' %-22s %-32s %-16s -> %s\n' "WORKER" "DIR" "CURRENT" "TARGET"
i=0
for w in "${TARGETS[@]}"; do
  printf ' %-22s %-32s %-16s -> %s\n' \
    "$w" "${PLAN_DIRS[$i]}" "${PLAN_CURRENT[$i]}" "${PLAN_TARGET[$i]}"
  i=$((i + 1))
done
echo "=========================================================================="
echo

if [ "$PLAN_FAIL" -ne 0 ]; then
  err "One or more workers could not be planned. Aborting before any rollback."
  exit 1
fi

# ---------------------------------------------------------------------------
# Confirmation
# ---------------------------------------------------------------------------

if [ "$ASSUME_YES" -ne 1 ]; then
  printf "Proceed with rollback? [y/N] "
  REPLY=""
  read -r REPLY || REPLY=""
  case "$REPLY" in
    y|Y|yes|YES) ;;
    *) err "Aborted by user."; exit 2 ;;
  esac
fi

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

FAIL_COUNT=0
SUCCESS_LIST=()
SUCCESS_TARGETS=()
FAIL_LIST=()
FAIL_TARGETS=()

i=0
for w in "${TARGETS[@]}"; do
  if rollback_worker "$w" "${PLAN_TARGET[$i]}"; then
    SUCCESS_LIST+=( "$w" )
    SUCCESS_TARGETS+=( "${PLAN_TARGET[$i]}" )
  else
    FAIL_LIST+=( "$w" )
    FAIL_TARGETS+=( "${PLAN_TARGET[$i]}" )
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  i=$((i + 1))
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo
echo "=========================================================================="
echo " Rollback summary"
echo "=========================================================================="
echo " Succeeded (${#SUCCESS_LIST[@]}):"
i=0
for w in ${SUCCESS_LIST[@]+"${SUCCESS_LIST[@]}"}; do
  echo "   - $w -> ${SUCCESS_TARGETS[$i]}"
  i=$((i + 1))
done
echo " Failed    (${#FAIL_LIST[@]}):"
i=0
for w in ${FAIL_LIST[@]+"${FAIL_LIST[@]}"}; do
  echo "   - $w (target was ${FAIL_TARGETS[$i]})"
  i=$((i + 1))
done
echo "=========================================================================="

if [ "$FAIL_COUNT" -gt 0 ]; then
  err "$FAIL_COUNT worker(s) failed to roll back. See logs above."
  err "Manual recovery: cd packages/<dir> && npx wrangler rollback <id> --message '...'"
  exit 1
fi

log "All targeted workers rolled back successfully."
exit 0
