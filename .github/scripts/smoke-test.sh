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

# More persona pages
check "Einstein persona"      "$BASE_URL/einstein"             "RadixChat"
check "Daft Punk persona"     "$BASE_URL/daftpunk"             "RadixChat"
check "Peti persona"          "$BASE_URL/peti"                 "RadixChat"

# API endpoints
check "Store apps API"        "$BASE_URL/api/apps"
check "LearnIt API"           "$BASE_URL/api/learnit"

# MCP endpoint health
check "MCP tools endpoint"    "$BASE_URL/api/mcp/tools" || true

# Transpiler (POST-only endpoint — validates code editor works)
check_transpiler() {
  local status
  status=$(curl -s -o /tmp/smoke-body -w "%{http_code}" --max-time 10 \
    -X POST -H "Content-Type: text/plain" -H "TR_ORIGIN: https://spike.land" \
    -d 'export default function App() { return <div>Hello</div>; }' \
    "https://esbuild.spikeland.workers.dev" 2>/dev/null || echo "000")
  if [[ "$status" != "200" ]]; then
    echo "FAIL: Transpiler — HTTP $status"
    FAILED=$((FAILED + 1))
    return
  fi
  # Verify output contains transpiled JS (not an error page)
  if ! grep -q "function" /tmp/smoke-body; then
    echo "FAIL: Transpiler — output does not contain transpiled code"
    FAILED=$((FAILED + 1))
    return
  fi
  echo "OK:   Transpiler (JSX → JS)"
}
check_transpiler

# Persona chat SSE (validates AI chat pipeline)
check_chat_sse() {
  local status
  status=$(curl -s -o /tmp/smoke-body -w "%{http_code}" --max-time 15 \
    -H "Accept: text/event-stream" \
    "$BASE_URL/api/spike-chat?message=hello&persona=zoltan" 2>/dev/null || echo "000")
  if [[ "$status" == "200" ]]; then
    echo "OK:   Persona chat SSE"
  elif [[ "$status" == "401" || "$status" == "403" ]]; then
    echo "SKIP: Persona chat SSE (auth required)"
  else
    echo "FAIL: Persona chat SSE — HTTP $status"
    FAILED=$((FAILED + 1))
  fi
}
check_chat_sse

# Status page (if exists)
check "Status page"           "$BASE_URL/status" || true

echo ""
if [[ $FAILED -gt 0 ]]; then
  echo "RESULT: $FAILED smoke test(s) FAILED"
  exit 1
else
  echo "RESULT: All smoke tests passed"
fi
