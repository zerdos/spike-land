#!/bin/bash
# MCP Tool Testing Script — uses proper MCP session flow
BASE="http://localhost:8790/mcp"
PASS=0
FAIL=0
SKIP=0
ERRORS=""

# Step 1: Initialize session
echo "=== Initializing MCP Session ==="
SESSION_ID=$(curl -s -D - -o /tmp/mcp_init_body -X POST "$BASE" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
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
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}' > /dev/null

call_tool() {
  local name="$1"
  local args="$2"
  local result
  result=$(curl -s -X POST "$BASE" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -H "Mcp-Session-Id: $SESSION_ID" \
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
      if echo "$msg" | grep -qiE "not found|no .* found|does not exist|invalid.*id|unknown|no results|empty|no .* yet"; then
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

# --- Gateway Meta ---
echo ""
echo "--- Gateway Meta (8 tools) ---"
call_tool "search_tools" '{"query":"auth","limit":5,"semantic":false}'
call_tool "list_categories" '{}'
call_tool "enable_category" '{"category":"auth"}'
call_tool "get_balance" '{}'
call_tool "get_status" '{}'
call_tool "get_tool_help" '{"tool":"search_tools"}'
call_tool "search_tools_by_stability" '{"stability":"stable","limit":5}'
call_tool "list_tool_versions" '{"tool":"search_tools"}'

# --- Auth ---
echo ""
echo "--- Auth (4 tools) ---"
call_tool "auth_check_session" '{}'
call_tool "auth_check_route_access" '{"route":"/settings"}'
call_tool "auth_signup" '{}'
call_tool "auth_get_profile" '{}'

# --- Workspaces ---
echo ""
echo "--- Workspaces (4 tools) ---"
call_tool "workspaces_list" '{}'
call_tool "workspaces_get" '{"id":"nonexistent"}'
call_tool "workspaces_create" '{"name":"test-workspace","slug":"test-ws-001"}'
call_tool "workspaces_update" '{"id":"nonexistent","name":"updated"}'

# --- Billing ---
echo ""
echo "--- Billing (4 tools) ---"
call_tool "billing_list_plans" '{}'
call_tool "billing_status" '{}'
call_tool "billing_create_checkout" '{"plan":"pro"}'
call_tool "billing_cancel_subscription" '{}'

# --- Vault ---
echo ""
echo "--- Vault (4 tools) ---"
call_tool "vault_list_secrets" '{}'
call_tool "vault_store_secret" '{"key":"test-key","value":"test-value"}'
call_tool "vault_delete_secret" '{"key":"test-key"}'
call_tool "vault_rotate_secret" '{"key":"test-key","value":"new-value"}'

# --- Storage ---
echo ""
echo "--- Storage (3 tools) ---"
call_tool "storage_list" '{}'
call_tool "storage_manifest_diff" '{"files":[{"path":"test.html","hash":"abc123"}]}'
call_tool "storage_upload_batch" '{"files":[{"path":"test.html","content":"<h1>test</h1>"}]}'

# --- Reminders ---
echo ""
echo "--- Reminders (3 tools) ---"
call_tool "reminders_list" '{}'
call_tool "reminders_create" '{"title":"Test reminder","dueAt":"2026-12-31T00:00:00Z"}'
call_tool "reminders_complete" '{"id":"nonexistent"}'

# --- Permissions ---
echo ""
echo "--- Permissions (2 tools) ---"
call_tool "permissions_list_pending" '{}'
call_tool "permissions_respond" '{"requestId":"nonexistent","approved":true}'

# --- Marketplace ---
echo ""
echo "--- Marketplace (5 tools) ---"
call_tool "marketplace_search" '{"query":"test"}'
call_tool "marketplace_install" '{"toolId":"nonexistent"}'
call_tool "marketplace_uninstall" '{"toolId":"nonexistent"}'
call_tool "marketplace_my_earnings" '{}'
call_tool "marketplace_set_price" '{"toolId":"nonexistent","price":0}'

# --- Bootstrap ---
echo ""
echo "--- Bootstrap (4 tools) ---"
call_tool "bootstrap_status" '{}'
call_tool "bootstrap_workspace" '{"name":"test"}'
call_tool "bootstrap_connect_integration" '{"integration":"github","credentials":{"token":"test"}}'
call_tool "bootstrap_create_app" '{"name":"test-app","template":"blank"}'

# --- Apps ---
echo ""
echo "--- Apps (16 tools) ---"
call_tool "apps_list" '{}'
call_tool "apps_generate_codespace_id" '{}'
call_tool "apps_list_templates" '{}'
call_tool "apps_create" '{"prompt":"hello world app"}'
call_tool "apps_get" '{"id":"nonexistent"}'
call_tool "apps_preview" '{"id":"nonexistent"}'
call_tool "apps_chat" '{"id":"nonexistent","message":"make it blue"}'
call_tool "apps_get_messages" '{"id":"nonexistent"}'
call_tool "apps_set_status" '{"id":"nonexistent","status":"published"}'
call_tool "apps_bin" '{"id":"nonexistent"}'
call_tool "apps_restore" '{"id":"nonexistent"}'
call_tool "apps_delete_permanent" '{"id":"nonexistent"}'
call_tool "apps_list_versions" '{"id":"nonexistent"}'
call_tool "apps_batch_status" '{"ids":["nonexistent"],"status":"draft"}'
call_tool "apps_clear_messages" '{"id":"nonexistent"}'
call_tool "apps_upload_images" '{"id":"nonexistent"}'

# --- Arbor ---
echo ""
echo "--- Arbor (5 tools) ---"
call_tool "arbor_get_brief" '{"audience":"investor"}'
call_tool "arbor_map_context" '{"context":"AI app store"}'
call_tool "arbor_plan_pilot" '{"idea":"MCP tools marketplace"}'
call_tool "arbor_assess_risk" '{"project":"spike.land launch"}'
call_tool "arbor_write_pitch" '{"audience":"VC","context":"AI platform"}'

# --- Create ---
echo ""
echo "--- Create (7 tools) ---"
call_tool "create_search_apps" '{"query":"calculator"}'
call_tool "create_get_app" '{"slug":"nonexistent"}'
call_tool "create_classify_idea" '{"idea":"todo app"}'
call_tool "create_check_health" '{"codespaceId":"nonexistent"}'
call_tool "create_list_top_apps" '{}'
call_tool "create_list_recent_apps" '{}'
call_tool "create_get_app_status" '{"codespaceId":"nonexistent"}'

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
call_tool "skill_store_get" '{"id":"nonexistent"}'
call_tool "skill_store_install" '{"id":"nonexistent"}'
call_tool "skill_store_admin_list" '{}'
call_tool "skill_store_admin_create" '{"name":"test-skill","description":"test","content":"test"}'
call_tool "skill_store_admin_update" '{"id":"nonexistent","name":"updated"}'
call_tool "skill_store_admin_delete" '{"id":"nonexistent"}'

# --- MCP Registry ---
echo ""
echo "--- MCP Registry (3 tools) ---"
call_tool "mcp_registry_search" '{"query":"github"}'
call_tool "mcp_registry_get" '{"id":"nonexistent"}'
call_tool "mcp_registry_install" '{"id":"nonexistent"}'

# --- Store Apps ---
echo ""
echo "--- Store Apps (8 tools) ---"
call_tool "store_app_reviews" '{"appSlug":"nonexistent"}'
call_tool "store_app_rate" '{"appSlug":"nonexistent","rating":5}'
call_tool "store_wishlist_add" '{"appSlug":"nonexistent"}'
call_tool "store_wishlist_remove" '{"appSlug":"nonexistent"}'
call_tool "store_wishlist_get" '{}'
call_tool "store_recommendations_get" '{}'
call_tool "store_app_personalized" '{}'
call_tool "store_stats" '{}'

# --- Store Install ---
echo ""
echo "--- Store Install (5 tools) ---"
call_tool "store_app_install" '{"appSlug":"nonexistent"}'
call_tool "store_app_uninstall" '{"appSlug":"nonexistent"}'
call_tool "store_app_install_status" '{"appSlug":"nonexistent"}'
call_tool "store_app_install_list" '{}'
call_tool "store_app_install_count" '{"appSlug":"nonexistent"}'

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
call_tool "store_skills_get" '{"slug":"nonexistent"}'
call_tool "store_skills_install" '{"slug":"nonexistent"}'
call_tool "store_skills_my_installs" '{}'

# --- Store A/B ---
echo ""
echo "--- Store A/B (9 tools) ---"
call_tool "store_app_deploy" '{"appSlug":"test","version":"1.0"}'
call_tool "store_app_add_variant" '{"deploymentId":"nonexistent","name":"variant-b","weight":50}'
call_tool "store_app_assign_visitor" '{"deploymentId":"nonexistent"}'
call_tool "store_app_record_impression" '{"variantId":"nonexistent"}'
call_tool "store_app_record_error" '{"variantId":"nonexistent"}'
call_tool "store_app_get_results" '{"deploymentId":"nonexistent"}'
call_tool "store_app_declare_winner" '{"deploymentId":"nonexistent","variantId":"nonexistent"}'
call_tool "store_app_cleanup" '{"deploymentId":"nonexistent"}'
call_tool "evaluate_experiment" '{"deploymentId":"nonexistent"}'

# --- Agents ---
echo ""
echo "--- Agents (4 tools) ---"
call_tool "agents_list" '{}'
call_tool "agents_get" '{"agentId":"nonexistent"}'
call_tool "agents_get_queue" '{"agentId":"nonexistent"}'
call_tool "agents_send_message" '{"agentId":"nonexistent","message":"hello"}'

# --- Agent Inbox ---
echo ""
echo "--- Agent Inbox (3 tools) ---"
call_tool "agent_inbox_poll" '{}'
call_tool "agent_inbox_read" '{}'
call_tool "agent_inbox_respond" '{"messageId":"nonexistent","response":"ok"}'

# --- Capabilities ---
echo ""
echo "--- Capabilities (3 tools) ---"
call_tool "capabilities_request_permissions" '{"permissions":["read"]}'
call_tool "capabilities_check_permissions" '{"permissions":["read"]}'
call_tool "capabilities_list_queued_actions" '{}'

# --- Chat ---
echo ""
echo "--- Chat (1 tool) ---"
call_tool "ai_chat" '{"message":"Say hello in one word"}'

# --- DMs ---
echo ""
echo "--- Direct Messages (3 tools) ---"
call_tool "dm_list" '{}'
call_tool "dm_send" '{"recipientId":"nonexistent","content":"hello"}'
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
call_tool "tts_synthesize" '{"text":"hello world","voice":"default"}'

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
call_tool "settings_revoke_api_key" '{"keyId":"nonexistent"}'

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
call_tool "planning_interview_start" '{}'
call_tool "planning_interview_answer" '{"sessionId":"nonexistent","answer":"yes"}'
call_tool "bazdmeg_superpowers_gate_check" '{"gate":"pre-code"}'
call_tool "bazdmeg_superpowers_gate_override" '{"gate":"pre-code","reason":"testing"}'

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
call_tool "create_reaction" '{"trigger":"on_error","action":"notify","config":{}}'
call_tool "delete_reaction" '{"id":"nonexistent"}'
call_tool "reaction_log" '{}'

# --- Orchestration ---
echo ""
echo "--- Orchestration (8 tools) ---"
call_tool "context_index_repo" '{"repo":"spike-land-ai/spike.land"}'
call_tool "context_pack" '{"repo":"spike-land-ai/spike.land","query":"auth"}'
call_tool "context_get_deps" '{"repo":"spike-land-ai/spike.land","file":"src/index.ts"}'
call_tool "sandbox_create" '{}'
call_tool "sandbox_simulate" '{"sandboxId":"nonexistent","code":"console.log(1)"}'
call_tool "sandbox_read_file" '{"sandboxId":"nonexistent","path":"index.ts"}'
call_tool "sandbox_write_file" '{"sandboxId":"nonexistent","path":"index.ts","content":"export {}"}'
call_tool "sandbox_destroy" '{"sandboxId":"nonexistent"}'

# --- Orchestrator ---
echo ""
echo "--- Orchestrator (5 tools) ---"
call_tool "orchestrator_create_plan" '{"goal":"build auth","steps":["design","implement","test"]}'
call_tool "orchestrator_dispatch" '{"planId":"nonexistent"}'
call_tool "orchestrator_status" '{"planId":"nonexistent"}'
call_tool "orchestrator_submit_result" '{"planId":"nonexistent","stepId":"nonexistent","result":"done"}'
call_tool "orchestrator_merge" '{"planId":"nonexistent"}'

# --- Swarm ---
echo ""
echo "--- Swarm (9 tools) ---"
call_tool "swarm_list_agents" '{}'
call_tool "swarm_get_agent" '{"agentId":"nonexistent"}'
call_tool "swarm_spawn_agent" '{"name":"test-agent","role":"worker"}'
call_tool "swarm_stop_agent" '{"agentId":"nonexistent"}'
call_tool "swarm_redirect_agent" '{"agentId":"nonexistent","target":"other"}'
call_tool "swarm_broadcast" '{"message":"hello"}'
call_tool "swarm_send_message" '{"agentId":"nonexistent","message":"hello"}'
call_tool "swarm_read_messages" '{"agentId":"nonexistent"}'
call_tool "swarm_delegate_task" '{"agentId":"nonexistent","task":"do something"}'

# --- Swarm Monitoring ---
echo ""
echo "--- Swarm Monitoring (4 tools) ---"
call_tool "swarm_get_metrics" '{}'
call_tool "swarm_get_cost" '{}'
call_tool "swarm_replay" '{"agentId":"nonexistent"}'
call_tool "swarm_health" '{}'

# --- Audit ---
echo ""
echo "--- Audit (2 tools) ---"
call_tool "audit_query_logs" '{}'
call_tool "audit_export" '{"format":"json"}'

# --- CRDT ---
echo ""
echo "--- CRDT (7 tools) ---"
call_tool "crdt_create_set" '{"name":"test-set","type":"g-counter"}'
call_tool "crdt_update" '{"setId":"nonexistent","replicaId":"r1","operation":{"type":"increment","value":1}}'
call_tool "crdt_sync_pair" '{"setId":"nonexistent","replicaA":"r1","replicaB":"r2"}'
call_tool "crdt_sync_all" '{"setId":"nonexistent"}'
call_tool "crdt_inspect" '{"setId":"nonexistent"}'
call_tool "crdt_check_convergence" '{"setId":"nonexistent"}'
call_tool "crdt_compare_with_consensus" '{"setId":"nonexistent"}'

# --- Network Simulation ---
echo ""
echo "--- Network Simulation (3 tools) ---"
call_tool "netsim_create_topology" '{"nodes":["a","b","c"],"links":[{"from":"a","to":"b"}]}'
call_tool "netsim_set_link_state" '{"from":"a","to":"b","state":"down"}'
call_tool "netsim_partition_node" '{"nodeId":"a"}'

echo ""
echo "=============================="
echo "=== FINAL RESULTS ==="
echo "PASS: $PASS"
echo "FAIL: $FAIL"
echo "TOTAL: $((PASS + FAIL))"
echo "=============================="
if [ -n "$ERRORS" ]; then
  echo ""
  echo "=== ALL FAILURES ==="
  echo -e "$ERRORS"
fi
