#!/usr/bin/env bash
# verify-d1.sh — sanity check that the spike-chat D1 database has the
# expected schema. Run after `wrangler d1 migrations apply`.
#
# Usage:
#   bash packages/spike-chat/scripts/verify-d1.sh           # remote (default)
#   bash packages/spike-chat/scripts/verify-d1.sh --local   # local .wrangler state

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DB_NAME="spike-chat"

MODE="--remote"
if [[ "${1:-}" == "--local" ]]; then
  MODE="--local"
fi

EXPECTED_TABLES=(
  channels
  channel_members
  messages
  read_cursors
  bookmarks
  pins
  reactions
  webhooks
  agent_profiles
  slash_commands
)

cd "${PKG_DIR}"

echo "Running schema sanity check against ${DB_NAME} (${MODE})..."

# Capture wrangler output. --json gives a stable parseable shape.
RAW_OUTPUT="$(wrangler d1 execute "${DB_NAME}" "${MODE}" \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name" \
  --json 2>&1)" || {
    echo "ERROR: wrangler d1 execute failed:" >&2
    echo "${RAW_OUTPUT}" >&2
    exit 1
}

MISSING=()
for tbl in "${EXPECTED_TABLES[@]}"; do
  if ! grep -q "\"name\":[[:space:]]*\"${tbl}\"" <<<"${RAW_OUTPUT}"; then
    MISSING+=("${tbl}")
  fi
done

if (( ${#MISSING[@]} > 0 )); then
  echo "FAIL: missing tables in ${DB_NAME} (${MODE}):" >&2
  for t in "${MISSING[@]}"; do
    echo "  - ${t}" >&2
  done
  echo "" >&2
  echo "Run: wrangler d1 migrations apply ${DB_NAME} ${MODE}" >&2
  exit 1
fi

echo "OK: all ${#EXPECTED_TABLES[@]} expected tables present in ${DB_NAME} (${MODE})."
