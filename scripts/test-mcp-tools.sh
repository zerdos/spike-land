#!/bin/bash
# MCP Tool Testing Script — uses internal auth + MCP session flow
# Corrected param names based on actual Zod schemas
BASE="http://localhost:8790/mcp"
INTERNAL_SECRET="local-dev-internal-secret-12345"
TEST_USER_ID="test-user-001"
PASS=0
FAIL=0
SKIP=0
ERRORS=""
CALL_COUNT=0
BATCH_SIZE=110  # Pause after this many calls to avoid rate limiting (limit is 120/60s)

# Step 0: Ensure test user exists in D1
echo "=== Ensuring test user exists ==="
cd packages/spike-land-mcp 2>/dev/null || true
NOW=$(date +%s)000
npx wrangler d1 execute spike-land-mcp --local --command="INSERT OR IGNORE INTO users (id, email, name, role, created_at, updated_at) VALUES ('$TEST_USER_ID', 'test@spike.land', 'Test User', 'admin', $NOW, $NOW);" 2>/dev/null
npx wrangler d1 execute spike-land-mcp --local --command="INSERT OR IGNORE INTO subscriptions (id, user_id, status, plan, created_at, updated_at) VALUES ('sub-test-001', '$TEST_USER_ID', 'active', 'pro', $NOW, $NOW);" 2>/dev/null
cd - >/dev/null 2>&1 || true
echo "Test user ensured."

# Step 1: Initialize session with internal auth
echo "=== Initializing MCP Session ==="
SESSION_ID=$(curl -s -D - -o /tmp/mcp_init_body -X POST "$BASE" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-Internal-Secret: $INTERNAL_SECRET" \
  -H "X-User-Id: $TEST_USER_ID" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test-harness","version":"1.0"}}}' 2>/dev/null \
  | grep -i "^mcp-session-id:" | sed 's/^[^:]*: *//' | tr -d '\r\n')
echo "Session ID: $SESSION_ID"
echo "Init response: $(cat /tmp/mcp_init_body)"

if [ -z "$SESSION_ID" ]; then
  echo "ERROR: No session ID returned. Cannot proceed."
  exit 1
fi

# Step 2: Send initialized notification
curl -s -X POST "$BASE" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "X-Internal-Secret: $INTERNAL_SECRET" \
  -H "X-User-Id: $TEST_USER_ID" \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}' > /dev/null

rate_limit_check() {
  CALL_COUNT=$((CALL_COUNT + 1))
  if [ $((CALL_COUNT % BATCH_SIZE)) -eq 0 ]; then
    echo ""
    echo "--- Rate limit pause (${CALL_COUNT} calls so far, sleeping 62s) ---"
    sleep 62
  fi
}

call_tool() {
  local name="$1"
  local args="$2"
  rate_limit_check
  local result
  result=$(curl -s -X POST "$BASE" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -H "Mcp-Session-Id: $SESSION_ID" \
    -H "X-Internal-Secret: $INTERNAL_SECRET" \
    -H "X-User-Id: $TEST_USER_ID" \
    -d "{\"jsonrpc\":\"2.0\",\"id\":$((RANDOM)),\"method\":\"tools/call\",\"params\":{\"name\":\"$name\",\"arguments\":$args}}" 2>&1)

  # Check for JSON-RPC level error
  local has_rpc_error
  has_rpc_error=$(echo "$result" | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin)
  if 'error' in d:
    msg=d['error'].get('message','') if isinstance(d['error'],dict) else str(d['error'])
    print('ERROR:' + msg)
  elif d.get('result',{}).get('isError'):
    content=d['result'].get('content',[])
    text=content[0].get('text','unknown') if content else 'unknown'
    # Truncate long errors
    if len(text) > 200: text = text[:200] + '...'
    print('TOOL_ERROR:' + text)
  else:
    content=d.get('result',{}).get('content',[])
    text=content[0].get('text','') if content else ''
    if len(text) > 100: text = text[:100] + '...'
    print('OK:' + text)
except Exception as e:
  print('PARSE_ERROR:' + str(e))
" 2>/dev/null)

  local status="${has_rpc_error%%:*}"
  local msg="${has_rpc_error#*:}"

  case "$status" in
    OK)
      echo "PASS: $name"
      PASS=$((PASS + 1))
      ;;
    TOOL_ERROR)
      # Expected errors for test data (not found, etc) vs real bugs
      if echo "$msg" | grep -qiE "not found|no .* found|does not exist|invalid.*id|unknown|no results|empty|no .* yet|no .* available|not indexed|not configured|no active|no messages|no agents|no secrets|no reminders|no .* entries|no workspaces|no apps|0 app|no skills|no reactions|no logs|no audit|no plan|no session|no sandbox|no set|no topology|no deployment|no variant|no experiment"; then
        echo "PASS (expected error for test data): $name -> ${msg:0:80}"
        PASS=$((PASS + 1))
      else
        echo "FAIL: $name -> $msg"
        FAIL=$((FAIL + 1))
        ERRORS="$ERRORS\n$name: $msg"
      fi
      ;;
    ERROR)
      if echo "$msg" | grep -qi "Unknown tool"; then
        echo "MISSING: $name -> tool not registered"
        FAIL=$((FAIL + 1))
        ERRORS="$ERRORS\n$name: MISSING - tool not registered"
      elif echo "$msg" | grep -qi "disabled"; then
        echo "DISABLED: $name -> tool disabled (needs enable_category)"
        FAIL=$((FAIL + 1))
        ERRORS="$ERRORS\n$name: DISABLED"
      elif echo "$msg" | grep -qi "rate.limit\|too many"; then
        echo "RATE_LIMITED: $name"
        SKIP=$((SKIP + 1))
      else
        echo "FAIL: $name -> $msg"
        FAIL=$((FAIL + 1))
        ERRORS="$ERRORS\n$name: $msg"
      fi
      ;;
    *)
      echo "FAIL: $name -> $has_rpc_error"
      FAIL=$((FAIL + 1))
      ERRORS="$ERRORS\n$name: $has_rpc_error"
      ;;
  esac
}

echo ""
echo "=== Testing All Tools ==="

# --- Gateway Meta (always enabled) ---
echo ""
echo "--- Gateway Meta (8 tools) ---"
call_tool "search_tools" '{"query":"auth","limit":5,"semantic":false}'
call_tool "list_categories" '{}'
call_tool "enable_category" '{"category":"auth"}'
call_tool "get_balance" '{}'
call_tool "get_status" '{}'
call_tool "get_tool_help" '{"tool_name":"search_tools"}'
call_tool "search_tools_by_stability" '{"stability":"stable","limit":5}'
call_tool "list_tool_versions" '{"tool_name":"search_tools"}'

# Enable all categories we need for testing
echo ""
echo "--- Enabling all categories ---"
for cat in auth workspaces billing vault storage reminders permissions marketplace bootstrap apps arbor create learnit skill-store mcp-registry store store-install store-search store-skills store-ab bazdmeg observability reactions audit orchestration orchestrator swarm swarm-monitoring agents agent-inbox capabilities chat dm ai-gateway business-analysis tts environment settings blog crdt netsim; do
  call_tool "enable_category" "{\"category\":\"$cat\"}"
done

# --- Auth ---
echo ""
echo "--- Auth (4 tools) ---"
call_tool "auth_check_session" '{}'
call_tool "auth_check_route_access" '{"path":"/settings"}'
call_tool "auth_signup" '{}'
call_tool "auth_get_profile" '{}'

# --- Workspaces ---
echo ""
echo "--- Workspaces (4 tools) ---"
call_tool "workspaces_list" '{}'
call_tool "workspaces_get" '{"id":"nonexistent"}'
call_tool "workspaces_create" '{"name":"test-workspace","slug":"test-ws-001"}'
call_tool "workspaces_update" '{"workspace_id":"nonexistent","name":"updated"}'

# --- Billing ---
echo ""
echo "--- Billing (4 tools) ---"
call_tool "billing_list_plans" '{}'
call_tool "billing_status" '{}'
call_tool "billing_create_checkout" '{"tier":"pro"}'
call_tool "billing_cancel_subscription" '{}'

# --- Vault ---
echo ""
echo "--- Vault (4 tools) ---"
call_tool "vault_list_secrets" '{}'
call_tool "vault_store_secret" '{"name":"TEST_KEY","value":"test-value-123"}'
call_tool "vault_delete_secret" '{"name":"TEST_KEY"}'
call_tool "vault_rotate_secret" '{"name":"TEST_KEY","value":"new-value-456"}'

# --- Storage ---
echo ""
echo "--- Storage (3 tools) ---"
call_tool "storage_list" '{}'
call_tool "storage_manifest_diff" '{"files":[{"key":"test.html","sha256":"abc123"}]}'
call_tool "storage_upload_batch" '{"files":[{"key":"test.html","content_base64":"PGgxPnRlc3Q8L2gxPg==","sha256":"abc123"}]}'

# --- Reminders ---
echo ""
echo "--- Reminders (3 tools) ---"
call_tool "reminders_list" '{}'
call_tool "reminders_create" '{"text":"Test reminder","due_date":"2026-12-31T00:00:00Z"}'
call_tool "reminders_complete" '{"reminder_id":"nonexistent"}'

# --- Permissions ---
echo ""
echo "--- Permissions (2 tools) ---"
call_tool "permissions_list_pending" '{}'
call_tool "permissions_respond" '{"requestId":"nonexistent","action":"APPROVE"}'

# --- Marketplace ---
echo ""
echo "--- Marketplace (5 tools) ---"
call_tool "marketplace_search" '{"query":"test"}'
call_tool "marketplace_install" '{"tool_id":"nonexistent"}'
call_tool "marketplace_uninstall" '{"tool_id":"nonexistent"}'
call_tool "marketplace_my_earnings" '{}'
call_tool "marketplace_set_price" '{"tool_id":"nonexistent","price_cents":0}'

# --- Bootstrap ---
echo ""
echo "--- Bootstrap (4 tools) ---"
call_tool "bootstrap_status" '{}'
call_tool "bootstrap_workspace" '{"name":"test-workspace"}'
call_tool "bootstrap_connect_integration" '{"integration_name":"github","credentials":{"token":"test"}}'
call_tool "bootstrap_create_app" '{"app_name":"test-app","description":"A test application for validation"}'

# --- Apps ---
echo ""
echo "--- Apps (16 tools) ---"
call_tool "apps_list" '{}'
call_tool "apps_generate_codespace_id" '{}'
call_tool "apps_list_templates" '{}'
call_tool "apps_create" '{"prompt":"hello world app"}'
call_tool "apps_get" '{"app_id":"nonexistent"}'
call_tool "apps_preview" '{"app_id":"nonexistent"}'
call_tool "apps_chat" '{"app_id":"nonexistent","message":"make it blue"}'
call_tool "apps_get_messages" '{"app_id":"nonexistent"}'
call_tool "apps_set_status" '{"app_id":"nonexistent","status":"LIVE"}'
call_tool "apps_bin" '{"app_id":"nonexistent"}'
call_tool "apps_restore" '{"app_id":"nonexistent"}'
call_tool "apps_delete_permanent" '{"app_id":"nonexistent","confirm":true}'
call_tool "apps_list_versions" '{"app_id":"nonexistent"}'
call_tool "apps_batch_status" '{"app_ids":["nonexistent"],"status":"LIVE"}'
call_tool "apps_clear_messages" '{"app_id":"nonexistent"}'
call_tool "apps_upload_images" '{"app_id":"nonexistent","image_count":1}'

# --- Arbor ---
echo ""
echo "--- Arbor (5 tools) ---"
call_tool "arbor_get_brief" '{"audience":"investor"}'
call_tool "arbor_map_context" '{"region_context":"Southeast Asia rural","target_user":"smallholder farmer"}'
call_tool "arbor_plan_pilot" '{"region":"Kenya","target_user":"rural farmer","pilot_goal":"income_generation","partner_model":"co_op"}'
call_tool "arbor_assess_risk" '{"jurisdiction_summary":"Kenya rural","enforcement_risk":"low","connectivity_profile":"intermittent","payment_reliability":"medium","identity_requirements":"low","partner_model":"co_op"}'
call_tool "arbor_write_pitch" '{"audience":"investor","format":"one_liner","region":"East Africa"}'

# --- Create ---
echo ""
echo "--- Create (7 tools) ---"
call_tool "create_search_apps" '{"query":"calculator"}'
call_tool "create_get_app" '{"slug":"nonexistent"}'
call_tool "create_classify_idea" '{"idea":"todo app"}'
call_tool "create_check_health" '{"codespace_id":"nonexistent"}'
call_tool "create_list_top_apps" '{}'
call_tool "create_list_recent_apps" '{}'
call_tool "create_get_app_status" '{"slug":"nonexistent"}'

# --- LearnIt ---
echo ""
echo "--- LearnIt (5 tools) ---"
call_tool "learnit_get_topic" '{"slug":"javascript"}'
call_tool "learnit_search_topics" '{"query":"react"}'
call_tool "learnit_get_relations" '{"slug":"javascript"}'
call_tool "learnit_list_popular" '{}'
call_tool "learnit_list_recent" '{}'

# --- Skill Store ---
echo ""
echo "--- Skill Store (7 tools) ---"
call_tool "skill_store_list" '{}'
call_tool "skill_store_get" '{"identifier":"nonexistent"}'
call_tool "skill_store_install" '{"skill_id":"nonexistent"}'
call_tool "skill_store_admin_list" '{}'
call_tool "skill_store_admin_create" '{"name":"test-skill","slug":"test-skill","displayName":"Test Skill","description":"A test skill for validation","author":"test"}'
call_tool "skill_store_admin_update" '{"skill_id":"nonexistent","displayName":"Updated Skill"}'
call_tool "skill_store_admin_delete" '{"skill_id":"nonexistent"}'

# --- MCP Registry ---
echo ""
echo "--- MCP Registry (3 tools) ---"
call_tool "mcp_registry_search" '{"query":"github"}'
call_tool "mcp_registry_get" '{"serverId":"nonexistent","source":"smithery"}'
call_tool "mcp_registry_install" '{"serverId":"nonexistent","source":"smithery"}'

# --- Store Apps ---
echo ""
echo "--- Store Apps (8 tools) ---"
call_tool "store_app_reviews" '{"appSlug":"nonexistent"}'
call_tool "store_app_rate" '{"appSlug":"nonexistent","rating":5}'
call_tool "store_wishlist_add" '{"appSlug":"nonexistent"}'
call_tool "store_wishlist_remove" '{"appSlug":"nonexistent"}'
call_tool "store_wishlist_get" '{}'
call_tool "store_recommendations_get" '{"appSlug":"nonexistent"}'
call_tool "store_app_personalized" '{}'
call_tool "store_stats" '{}'

# --- Store Install ---
echo ""
echo "--- Store Install (5 tools) ---"
call_tool "store_app_install" '{"slug":"nonexistent"}'
call_tool "store_app_uninstall" '{"slug":"nonexistent"}'
call_tool "store_app_install_status" '{"slug":"nonexistent"}'
call_tool "store_app_install_list" '{}'
call_tool "store_app_install_count" '{"slug":"nonexistent"}'

# --- Store Search ---
echo ""
echo "--- Store Search (6 tools) ---"
call_tool "store_list_apps_with_tools" '{}'
call_tool "store_search" '{"query":"calculator"}'
call_tool "store_browse_category" '{"category":"productivity"}'
call_tool "store_featured_apps" '{}'
call_tool "store_new_apps" '{}'
call_tool "store_app_detail" '{"slug":"nonexistent"}'

# --- Store Skills ---
echo ""
echo "--- Store Skills (4 tools) ---"
call_tool "store_skills_list" '{}'
call_tool "store_skills_get" '{"id":"nonexistent"}'
call_tool "store_skills_install" '{"id":"nonexistent"}'
call_tool "store_skills_my_installs" '{}'

# --- Store A/B ---
echo ""
echo "--- Store A/B (9 tools) ---"
call_tool "store_app_deploy" '{"app_slug":"test","base_codespace_id":"cs-test-001"}'
call_tool "store_app_add_variant" '{"deployment_id":"nonexistent","variant_label":"variant-b","codespace_id":"cs-variant-b","dimension":"layout"}'
call_tool "store_app_assign_visitor" '{"deployment_id":"nonexistent","visitor_id":"visitor-001"}'
call_tool "store_app_record_impression" '{"variant_id":"nonexistent"}'
call_tool "store_app_record_error" '{"variant_id":"nonexistent"}'
call_tool "store_app_get_results" '{"deployment_id":"nonexistent"}'
call_tool "store_app_declare_winner" '{"deployment_id":"nonexistent","variant_id":"nonexistent"}'
call_tool "store_app_cleanup" '{"deployment_id":"nonexistent"}'
call_tool "evaluate_experiment" '{"variants":[{"id":"v1","impressions":100,"donations":10},{"id":"v2","impressions":100,"donations":15}]}'

# --- Agents ---
echo ""
echo "--- Agents (4 tools) ---"
call_tool "agents_list" '{}'
call_tool "agents_get" '{"agent_id":"nonexistent"}'
call_tool "agents_get_queue" '{"agent_id":"nonexistent"}'
call_tool "agents_send_message" '{"agent_id":"nonexistent","content":"hello"}'

# --- Agent Inbox ---
echo ""
echo "--- Agent Inbox (3 tools) ---"
call_tool "agent_inbox_poll" '{}'
call_tool "agent_inbox_read" '{"agent_id":"nonexistent"}'
call_tool "agent_inbox_respond" '{"agent_id":"nonexistent","content":"ok"}'

# --- Capabilities ---
echo ""
echo "--- Capabilities (3 tools) ---"
call_tool "capabilities_request_permissions" '{"reason":"testing tool access"}'
call_tool "capabilities_check_permissions" '{}'
call_tool "capabilities_list_queued_actions" '{}'

# --- Chat ---
echo ""
echo "--- Chat (1 tool) ---"
call_tool "ai_chat" '{"message":"Say hello in one word"}'

# --- DMs ---
echo ""
echo "--- Direct Messages (3 tools) ---"
call_tool "dm_list" '{}'
call_tool "dm_send" '{"content":"hello","toEmail":"test@example.com"}'
call_tool "dm_mark_read" '{"messageId":"nonexistent"}'

# --- AI Gateway ---
echo ""
echo "--- AI Gateway (2 tools) ---"
call_tool "ai_list_providers" '{}'
call_tool "ai_list_models" '{}'

# --- Business Analysis ---
echo ""
echo "--- Business Analysis (2 tools) ---"
call_tool "biz_analyze_url" '{"url":"https://example.com"}'
call_tool "biz_extract_signals" '{"url":"https://example.com"}'

# --- TTS ---
echo ""
echo "--- TTS (2 tools) ---"
call_tool "tts_list_voices" '{}'
call_tool "tts_synthesize" '{"text":"hello world"}'

# --- Environment ---
echo ""
echo "--- Environment (2 tools) ---"
call_tool "get_environment" '{}'
call_tool "get_feature_flags" '{}'

# --- Settings ---
echo ""
echo "--- Settings (3 tools) ---"
call_tool "settings_list_api_keys" '{}'
call_tool "settings_create_api_key" '{"name":"test-key"}'
call_tool "settings_revoke_api_key" '{"key_id":"nonexistent"}'

# --- Blog ---
echo ""
echo "--- Blog (2 tools) ---"
call_tool "blog_list_posts" '{}'
call_tool "blog_get_post" '{"slug":"nonexistent"}'

# --- BAZDMEG ---
echo ""
echo "--- BAZDMEG (10 tools) ---"
call_tool "bazdmeg_faq_list" '{}'
call_tool "bazdmeg_faq_create" '{"question":"What is MCP?","answer":"Model Context Protocol"}'
call_tool "bazdmeg_faq_update" '{"id":"nonexistent","answer":"Updated"}'
call_tool "bazdmeg_faq_delete" '{"id":"nonexistent"}'
call_tool "bazdmeg_memory_search" '{"query":"test"}'
call_tool "bazdmeg_memory_list" '{}'
call_tool "planning_interview_start" '{"task_description":"Build a user authentication system with OAuth 2.1"}'
call_tool "planning_interview_answer" '{"session_id":"nonexistent","answers":[1,2,0]}'
call_tool "bazdmeg_superpowers_gate_check" '{"sessionId":"nonexistent"}'
call_tool "bazdmeg_superpowers_gate_override" '{"sessionId":"nonexistent","gateName":"Brainstorming","reason":"testing"}'

# --- Observability ---
echo ""
echo "--- Observability (6 tools) ---"
call_tool "tool_usage_stats" '{}'
call_tool "error_rate" '{}'
call_tool "observability_health" '{}'
call_tool "observability_latency" '{}'
call_tool "query_errors" '{}'
call_tool "error_summary" '{}'

# --- Reactions ---
echo ""
echo "--- Reactions (4 tools) ---"
call_tool "list_reactions" '{}'
call_tool "create_reaction" '{"sourceTool":"arena_submit","sourceEvent":"success","targetTool":"audit_log_event","targetInput":{"action":"test"}}'
call_tool "delete_reaction" '{"reactionId":"nonexistent"}'
call_tool "reaction_log" '{}'

# --- Orchestration ---
echo ""
echo "--- Orchestration (8 tools) ---"
call_tool "context_index_repo" '{"repo_url":"https://github.com/spike-land-ai/spike-land"}'
call_tool "context_pack" '{"repo_url":"https://github.com/spike-land-ai/spike-land","task_description":"auth middleware"}'
call_tool "context_get_deps" '{"repo_url":"https://github.com/spike-land-ai/spike-land","file_path":"src/index.ts"}'
call_tool "sandbox_create" '{}'
call_tool "sandbox_simulate" '{"sandbox_id":"nonexistent","code":"console.log(1)"}'
call_tool "sandbox_read_file" '{"sandbox_id":"nonexistent","file_path":"index.ts"}'
call_tool "sandbox_write_file" '{"sandbox_id":"nonexistent","file_path":"index.ts","content":"export {}"}'
call_tool "sandbox_destroy" '{"sandbox_id":"nonexistent"}'

# --- Orchestrator ---
echo ""
echo "--- Orchestrator (5 tools) ---"
call_tool "orchestrator_create_plan" '{"description":"build auth","subtasks":[{"description":"design auth flow"},{"description":"implement middleware"},{"description":"write tests"}]}'
call_tool "orchestrator_dispatch" '{"plan_id":"nonexistent"}'
call_tool "orchestrator_status" '{"plan_id":"nonexistent"}'
call_tool "orchestrator_submit_result" '{"plan_id":"nonexistent","subtask_id":"nonexistent","status":"completed","result":"done"}'
call_tool "orchestrator_merge" '{"plan_id":"nonexistent"}'

# --- Swarm ---
echo ""
echo "--- Swarm (9 tools) ---"
call_tool "swarm_list_agents" '{}'
call_tool "swarm_get_agent" '{"agent_id":"nonexistent"}'
call_tool "swarm_spawn_agent" '{"display_name":"test-agent","machine_id":"local","session_id":"test-session"}'
call_tool "swarm_stop_agent" '{"agent_id":"nonexistent"}'
call_tool "swarm_redirect_agent" '{"agent_id":"nonexistent"}'
call_tool "swarm_broadcast" '{"content":"hello"}'
call_tool "swarm_send_message" '{"target_agent_id":"nonexistent","content":"hello"}'
call_tool "swarm_read_messages" '{"agent_id":"nonexistent"}'
call_tool "swarm_delegate_task" '{"target_agent_id":"nonexistent","task_description":"do something"}'

# --- Swarm Monitoring ---
echo ""
echo "--- Swarm Monitoring (4 tools) ---"
call_tool "swarm_get_metrics" '{}'
call_tool "swarm_get_cost" '{}'
call_tool "swarm_replay" '{"agent_id":"nonexistent"}'
call_tool "swarm_health" '{}'

# --- Audit ---
echo ""
echo "--- Audit (2 tools) ---"
call_tool "audit_query_logs" '{}'
call_tool "audit_export" '{"from_date":"2026-01-01T00:00:00Z","to_date":"2026-12-31T00:00:00Z"}'

# --- CRDT ---
echo ""
echo "--- CRDT (7 tools) ---"
call_tool "crdt_create_set" '{"name":"test-set","type":"g_counter","replica_count":3}'
call_tool "crdt_update" '{"set_id":"nonexistent","replica_id":"r1","operation":"increment"}'
call_tool "crdt_sync_pair" '{"set_id":"nonexistent","from_replica":"r1","to_replica":"r2"}'
call_tool "crdt_sync_all" '{"set_id":"nonexistent"}'
call_tool "crdt_inspect" '{"set_id":"nonexistent"}'
call_tool "crdt_check_convergence" '{"set_id":"nonexistent"}'
call_tool "crdt_compare_with_consensus" '{"set_id":"nonexistent","scenario_description":"test convergence"}'

# --- Network Simulation ---
echo ""
echo "--- Network Simulation (3 tools) ---"
call_tool "netsim_create_topology" '{"name":"test-net","node_count":3}'
call_tool "netsim_set_link_state" '{"topology_id":"nonexistent","from":"node-1","to":"node-2","state":"partitioned"}'
call_tool "netsim_partition_node" '{"topology_id":"nonexistent","node_id":"node-1"}'

echo ""
echo "=============================="
echo "=== FINAL RESULTS ==="
echo "PASS: $PASS"
echo "FAIL: $FAIL"
echo "RATE_LIMITED: $SKIP"
echo "TOTAL: $((PASS + FAIL + SKIP))"
echo "=============================="
if [ -n "$ERRORS" ]; then
  echo ""
  echo "=== ALL FAILURES ==="
  echo -e "$ERRORS"
fi
