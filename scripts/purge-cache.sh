#!/usr/bin/env bash
set -uo pipefail

usage() {
  echo "Usage: $0 [--files url1,url2]" >&2
}

warn() {
  echo "WARNING: $*" >&2
}

info() {
  echo "$*" >&2
}

resolve_auth_token() {
  if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
    AUTH_TOKEN="$CLOUDFLARE_API_TOKEN"
    AUTH_TOKEN_SOURCE="env:CLOUDFLARE_API_TOKEN"
    return 0
  fi

  if ! command -v npx >/dev/null 2>&1; then
    return 1
  fi

  if ! npx wrangler whoami >/dev/null 2>&1; then
    return 1
  fi

  auth_json="$(npx wrangler auth token --json 2>/dev/null)" || return 1
  AUTH_TOKEN="$(printf '%s' "$auth_json" | jq -r '.token // ""' 2>/dev/null)"
  token_type="$(printf '%s' "$auth_json" | jq -r '.type // "unknown"' 2>/dev/null)"

  if [ -z "$AUTH_TOKEN" ] || [ "$AUTH_TOKEN" = "null" ]; then
    return 1
  fi

  AUTH_TOKEN_SOURCE="wrangler:${token_type}"
  return 0
}

FILES_ARG=""
AUTH_TOKEN=""
AUTH_TOKEN_SOURCE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --files)
      if [ $# -lt 2 ]; then
        usage
        exit 2
      fi
      FILES_ARG="$2"
      shift 2
      ;;
    -*)
      usage
      exit 2
      ;;
    *)
      usage
      exit 2
      ;;
  esac
done

if ! resolve_auth_token; then
  warn "No Cloudflare auth available; skipping cache purge"
  exit 0
fi

CF_ZONE_ID="$(
  curl -sf --max-time 10 \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    "https://api.cloudflare.com/client/v4/zones?name=spike.land" \
    | jq -r '.result[0].id // ""' 2>/dev/null
)" || CF_ZONE_ID=""

if [ -z "$CF_ZONE_ID" ]; then
  warn "Could not resolve zone ID for spike.land; skipping cache purge"
  exit 0
fi

payload='{"purge_everything":true}'
purge_target="entire cache"

if [ -n "$FILES_ARG" ]; then
  files_json="$(
    printf '%s' "$FILES_ARG" \
      | tr ',' '\n' \
      | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' \
      | jq -Rsc 'split("\n") | map(select(length > 0))'
  )" || files_json="[]"

  if [ "$files_json" = "[]" ]; then
    warn "No valid file URLs were provided; skipping selective purge"
    exit 0
  fi

  payload="$(jq -nc --argjson files "$files_json" '{files: $files}')" || payload=""
  if [ -z "$payload" ]; then
    warn "Failed to build selective purge payload; skipping cache purge"
    exit 0
  fi

  purge_target="selected files"
fi

echo "Purging Cloudflare ${purge_target}..."
info "Auth source: ${AUTH_TOKEN_SOURCE}"

response="$(
  curl -sS --max-time 20 \
    -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload"
)" || {
  warn "Cache purge API call failed (non-fatal)"
  exit 0
}

success="$(printf '%s' "$response" | jq -r '.success // false' 2>/dev/null)" || success="false"
if [ "$success" != "true" ]; then
  errors="$(printf '%s' "$response" | jq -c '.errors // []' 2>/dev/null)" || errors="[]"
  if [ "$AUTH_TOKEN_SOURCE" = "wrangler:oauth" ] && printf '%s' "$errors" | jq -e '.[]? | select(.code == 10000)' >/dev/null 2>&1; then
    warn "Wrangler OAuth login cannot purge zone cache via this API. Set CLOUDFLARE_API_TOKEN with Cache Purge permission for explicit purge."
    exit 0
  fi
  warn "Cloudflare cache purge was not accepted: ${errors}"
  exit 0
fi

echo "Cache purge requested successfully."
