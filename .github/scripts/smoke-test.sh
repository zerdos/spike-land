#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://spike.land}"
FAILED=0

check() {
  local name="$1" url="$2" expected_content="${3:-}"
  local status
  status=$(curl -s -o /tmp/smoke-body -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  if [[ "$status" != "200" ]]; then
    echo "FAIL: $name — HTTP $status ($url)"
    FAILED=$((FAILED + 1))
    return
  fi
  if [[ -n "$expected_content" ]]; then
    if ! grep -qi "$expected_content" /tmp/smoke-body; then
      echo "FAIL: $name — missing content '$expected_content' ($url)"
      FAILED=$((FAILED + 1))
      return
    fi
  fi
  echo "OK:   $name"
}

echo "=== spike.land smoke tests ==="
echo "Target: $BASE_URL"
echo ""

# Core health
check "Health endpoint"       "$BASE_URL/health"
check "API health"            "$BASE_URL/api/health"

# Frontend pages
check "Homepage"              "$BASE_URL/"                    "spike"
check "Vibe Code editor"      "$BASE_URL/vibe-code"           "editor"
check "App store"             "$BASE_URL/apps"                "app"
check "Learn hub"             "$BASE_URL/learn"               "topic"

# Persona pages (sample)
check "Zoltan persona"        "$BASE_URL/zoltan"              "RadixChat"
check "Arnold persona"        "$BASE_URL/arnold"              "RadixChat"
check "Erdos persona"         "$BASE_URL/erdos"               "RadixChat"

# API endpoints
check "Store apps API"        "$BASE_URL/api/apps"
check "LearnIt API"           "$BASE_URL/api/learnit"

# Transpiler
check "Transpiler health"     "https://esbuild.spikeland.workers.dev"

# Status page (if exists)
check "Status page"           "$BASE_URL/status" || true

echo ""
if [[ $FAILED -gt 0 ]]; then
  echo "RESULT: $FAILED smoke test(s) FAILED"
  exit 1
else
  echo "RESULT: All smoke tests passed"
fi
