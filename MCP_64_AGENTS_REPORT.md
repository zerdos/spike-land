# spike.land 64-Agent MCP Swarm Report

Tested with 16 personas x 4 rounds (64 sessions total) on 08/03/2026.

## Aggregate Issues & Concerns
- **AI Indie** (R1): **`sandbox_exec` is explicitly fake** — "SIMULATED EXECUTION ONLY, no code actually runs" is buried in the description. This is a trust-destroying gotcha for anyone who tries to use it for real work.
- **AI Indie** (R1): **`bootstrap_create_app` requires `codespace_id` as a required field** but there is no tool in this list to create or list codespaces — circular dependency with no entry point.
- **AI Indie** (R1): **Multiple required parameters have empty string descriptions** (`storage_manifest_diff` files: `""`, `storage_upload_batch` files: `""`, `storage_list` prefix/limit/cursor: `""`) — unusable without external docs.
- **AI Indie** (R1): **`workspaces_get` requires both `workspace_id` AND `slug`** as required — logically these are alternatives, not both needed. Bad schema design.
- **AI Indie** (R1): **Four overlapping coordination abstractions**: agents, swarm, session, and orchestrator all seem to handle multi-agent work. No clear mental model for when to use which.
- **AI Indie** (R1): **Auth flow is a black box** — `auth_check_session` requires a `session_token` input, but there's no tool to log in or obtain a session token. How does a new user authenticate?
- **AI Indie** (R1): **Career/resume/salary/job-search tools** feel entirely out of place for a dev-tools platform targeting indie builders.
- **AI Indie** (R1): **Distributed systems simulation tools** (crdt, netsim, causality, bft) are academically interesting but irrelevant to shipping AI products — they dilute the tool list significantly.
- **AI Indie** (R1): **`beuniq_*` and persona audit tools** appear to be internal QA tooling accidentally exposed to end users.
- **AI Indie** (R1): **`bazdmeg_*` tools** (FAQ CRUD, superpowers gates) read as internal workflow enforcement tools, not user-facing features.
- **AI Indie** (R1): **`mcp_registry_install` doesn't actually install** — it "generates a .mcp.json entry" which the user must manually apply. The name implies more than it does.
- **AI Indie** (R1): **No git integration** — as an indie dev I need to pull code from repos, commit changes, open PRs. The `context_index_repo` tool exists but is read-only.
- **AI Indie** (R1): **No streaming for `chat_send_message`** — labeled "non-streaming AI response." For a dev tool this is a real latency concern on long generations.
- **AI Indie** (R1): **`billing_cancel_subscription` has `confirm` typed as string, not boolean** — minor but signals schema carelessness.
- **AI Indie** (R1): **No clear onboarding path or tool discovery guide** — 150 tools with no grouping priority or "start here" signal. `report_bug` exists but no help/docs tool.
- **AI Indie** (R1): **`store_ab` deployment tools** require `codespace_id` with no way to obtain one through MCP — same dead-end pattern as bootstrap.
- **AI Indie** (R1): **`tts_synthesize` returns base64 audio** — for an MCP tool this is impractical to actually use without knowing how to decode and play it in context.
- **AI Indie** (R1): **`learnit_*` is read-only** — I can consume educational content but can't contribute, which limits its value for an indie building in public.
- **AI Indie** (R1): **No way to list or manage codespaces** despite `codespace_id` being required by multiple tools — a critical gap.
- **Classic Indie** (R1): **Tool count is overwhelming** — 150+ tools with no guided "start here" path for the "ship a product" use case
- **Classic Indie** (R1): **No onboarding funnel** — the recommended apps (codespace, app-creator, ops-dashboard, qa-studio) aren't surfaced as a coherent workflow anywhere in the tool list
- **Classic Indie** (R1): **`sandbox_exec` is fake** — the description literally says "SIMULATED EXECUTION ONLY — no code actually runs." This is buried and will confuse or mislead users who don't read carefully
- **Classic Indie** (R1): **`bootstrap_create_app` vs `create_classify_idea`** — unclear ordering and relationship; which do I call first, and does one depend on the other?
- **Classic Indie** (R1): **Required fields on optional-seeming params** — e.g. `workspaces_get` requires both `workspace_id` AND `slug` but presumably only one is needed; same pattern repeats across tools
- **Classic Indie** (R1): **`billing_create_checkout`** requires `success_url` and `cancel_url` as required fields — a solo dev just wants a checkout link, not to wire up redirect infrastructure first
- **Classic Indie** (R1): **No app templates or scaffolding tools** — for a "traditional app" builder, I'd expect starter templates or a way to fork an existing app as a base
- **Classic Indie** (R1): **`auth_check_session`** marks `session_token` as optional but lists it as required in the schema — contradiction
- **Classic Indie** (R1): **No file reading or code-fetching tools** — I can write to a sandbox but can't pull from GitHub without the orchestration tools (which feel enterprise-tier)
- **Classic Indie** (R1): **`store_app_install` vs `store_skills_install` vs `skill_store_install`** — three different install flows for apps/skills is confusing; unclear which to use when
- **Classic Indie** (R1): **No delete/unpublish for published apps** — I can create an app but can't see how to take it down or iterate on a published version
- **Classic Indie** (R1): **`dm_send` requires knowing the recipient email** — no user discovery or directory, making it nearly useless for a solo dev who doesn't already know who they're messaging
- **Classic Indie** (R1): **`learnit_*` tools have no clear connection to the dev workflow** — feels like a different product bolted on
- **Classic Indie** (R1): **No pricing transparency in tool descriptions** — which tools consume credits? Which are free? No indication anywhere
- **Agency Dev** (R1): **`sandbox_exec` is explicitly fake** — the description says "SIMULATED EXECUTION ONLY — no code actually runs." This is buried in the description and will waste real time before anyone notices
- **Agency Dev** (R1): **Recommended apps (codespace, page-builder, qa-studio, brand-command) have no corresponding MCP tools** — the gap between marketing and capability is jarring
- **Agency Dev** (R1): **No page builder or visual component tools** despite "page-builder" being a recommended app for this persona
- **Agency Dev** (R1): **~25% of tools are irrelevant to agency work** (`crdt`, `netsim`, `causality`, `bft`, `career`, `beuniq`, `learnit`) — no way to filter or hide them
- **Agency Dev** (R1): **No client/project management primitive** — no way to associate work with a named client, track deliverables, or share outputs with a client for approval
- **Agency Dev** (R1): **`workspaces_*` schema issues** — `workspaces_get` marks both `workspace_id` and `slug` as required but they're alternatives; passing both is redundant
- **Agency Dev** (R1): **Auth bootstrap unclear** — `auth_check_session` requires a `session_token` as a required field, but there's no `auth_login` tool. How does an agent get a token in the first place?
- **Agency Dev** (R1): **`bootstrap_create_app` requires a `codespace_id`** as required input, but there's no `codespace_create` tool in the list — circular dependency with no entry point
- **Agency Dev** (R1): **Storage workflow is complex for quick deploys** — `storage_manifest_diff` → `storage_upload_batch` with SHA-256 hashing is solid engineering but overkill friction for a small agency asset upload
- **Agency Dev** (R1): **No template or starter kit tools** — the closest is `create_classify_idea`, but there's no "give me a starter for a landing page" flow
- **Agency Dev** (R1): **`billing_create_checkout` requires `success_url` and `cancel_url` as required fields** — the MCP agent can't navigate a browser; these should be optional with defaults
- **Agency Dev** (R1): **No webhook or deployment notification tools** — can't tell a client "your site just deployed"
- **Agency Dev** (R1): **Swarm/session/orchestrator tools assume pre-existing multi-agent infrastructure** — high barrier for solo freelancers
- **Agency Dev** (R1): **`skill_store_admin_*` and `store_ab_*` tools are exposed to non-admin users** with no visible gating — confusing to encounter `skill_store_admin_create` without knowing if you have permission
- **Agency Dev** (R1): **No rate limit or quota visibility** — as an agency dev billing clients, I need to know what API calls cost or how much headroom I have
- **Agency Dev** (R1): **Tool count makes discoverability a real problem** — there's no `help` or `list_categories` overview tool; you must already know what you're looking for
- **In-house Dev** (R1): **`sandbox_exec` is fake** — description explicitly says "no code actually runs." This is a showstopper and undermines the entire orchestration/sandbox category. Needs to be prominently flagged or removed.
- **In-house Dev** (R1): **ALL required arrays include everything** — optional parameters like `confirm`, `since`, `agent_id`, `status` are marked `required` in the schema. This will break typed MCP clients and signals schema carelessness.
- **In-house Dev** (R1): **No GitHub/GitLab integration** — for an in-house dev, PRs, issues, and branch workflows are the daily surface. The diff/session tools float in a vacuum without repo integration.
- **In-house Dev** (R1): **No CI/CD hooks** — can't trigger or observe pipelines; observability stops at MCP-level, not the build system.
- **In-house Dev** (R1): **No database tooling** — no query runner, migration helper, or schema viewer despite this being a core dev ops need.
- **In-house Dev** (R1): **`bazdmeg_*` requires knowing the BAZDMEG methodology** — no onboarding path within the MCP itself; landing on these tools cold is confusing.
- **In-house Dev** (R1): **Permission model is opaque** — `capabilities_check_permissions` exists, implying I might be blocked from some tools, but there's no indication of what tier/role I need or what I currently have.
- **In-house Dev** (R1): **`auth_check_session` requires `session_token` as required param** — but if I had the token I wouldn't need to validate it; circular UX.
- **In-house Dev** (R1): **Swarm tools (`swarm_spawn_agent`, `swarm_broadcast`) have unclear team use cases** — for a solo in-house dev, this feels like infrastructure I don't own.
- **In-house Dev** (R1): **No webhook/event integration** — tools operate in pull mode only; no way to subscribe to events or trigger reactions from external systems (despite `create_reaction` existing, it only reacts to other MCP tool events).
- **In-house Dev** (R1): **`create_reaction` template syntax (`{{input.x}}`) is undocumented** — no schema or examples for what variables are actually available.
- **In-house Dev** (R1): **Persona/audit cluster (`plan_generate_batch_audit`, `audit_submit_evaluation`)** is clearly internal spike.land tooling leaked into a general-purpose server — confusing for external users.
- **In-house Dev** (R1): **Discovery is broken** — 80+ tools in a flat list with no search, no categories surfaced natively, no "recommended for your role" path.
- **In-house Dev** (R1): **Latency/cost opacity** — no indication of which tools are expensive, slow, or rate-limited before calling them.
- **ML Engineer** (R1): **`sandbox_exec` is simulated** — explicitly labeled "no code actually runs," making it useless for ML experimentation, training runs, or validation scripts
- **ML Engineer** (R1): **No experiment tracking** — no MLflow, W&B, or equivalent; nowhere to log runs, params, metrics, or artifacts
- **ML Engineer** (R1): **No model registry** — can't version, stage, or promote models (dev → staging → prod)
- **ML Engineer** (R1): **No GPU/compute resource management** — no way to allocate, schedule, or monitor compute
- **ML Engineer** (R1): **No dataset or feature store tooling** — no data versioning, lineage tracking, or feature pipelines
- **ML Engineer** (R1): **`ai_list_models` / `ai_list_providers`** — unclear if I can register my own fine-tuned endpoints or only use platform-provided models
- **ML Engineer** (R1): **No pipeline scheduling** — no cron or event-triggered pipeline runs; the `reminders_*` tools are a poor substitute
- **ML Engineer** (R1): **No ML-specific A/B testing** — `store_app_*` A/B tools are for UI variants, not model comparison
- **ML Engineer** (R1): **No streaming or real-time metrics** — `observability_latency` uses "daily rollup data," too coarse for monitoring inference latency SLOs
- **ML Engineer** (R1): **`auth_check_session` requires `session_token` as a required field** — unclear how to obtain this token; no onboarding guidance in the tool descriptions
- **ML Engineer** (R1): **Tool count (180+) is overwhelming with no ML-specific category** — no filtering or grouping for "ML workflows"; discovery requires reading all descriptions
- **ML Engineer** (R1): **`bootstrap_connect_integration` credentials field is just a string** — no schema for what formats are accepted; opaque for integrating ML platforms like Databricks or SageMaker
- **ML Engineer** (R1): **`error_summary` / `query_errors`** — require knowing service names upfront; no `list_services` tool to discover what's available
- **ML Engineer** (R1): **`swarm_get_cost` reads from "agent metadata"** — token cost tracking appears manual, not automatic; no actual billing integration for compute costs
- **ML Engineer** (R1): **`storage_list` prefix/limit/cursor are required fields but logically should be optional** — forces awkward empty-string workarounds for a simple "list everything" call
- **ML Engineer** (R1): **No webhook or event system** — no way to trigger downstream actions when a pipeline stage completes without polling
- **ML Engineer** (R1): **CRDT, netsim, BFT tools** — zero relevance to ML production workflows; add cognitive overhead when scanning the tool list
- **ML Engineer** (R1): **`testgen_from_code`** generates tests but has no ML-specific awareness** — won't understand model evaluation patterns, data validation, or statistical test cases
- **AI Hobbyist** (R1): `sandbox_exec` is explicitly fake ("SIMULATED EXECUTION ONLY") — this undermines trust; if sandboxing is aspirational, the tool shouldn't exist yet or should be clearly labeled as a prototype
- **AI Hobbyist** (R1): No guided onboarding or "start here" tool — 80+ tools with no sequencing advice is overwhelming for a new user
- **AI Hobbyist** (R1): Three overlapping app creation paths (`bootstrap_create_app`, `create_classify_idea`, `store_app_deploy`) with no clear guidance on which to use when
- **AI Hobbyist** (R1): `store_browse_category` requires knowing valid category strings upfront — no `store_list_categories` tool exists
- **AI Hobbyist** (R1): Required fields on many tools include empty-object schemas (e.g. `workspaces_list`) but are still listed as `required: []` — minor but sloppy
- **AI Hobbyist** (R1): `chat_send_message` is non-streaming — for AI hobbyists experimenting with long-form generation this feels like a step backward from native Claude APIs
- **AI Hobbyist** (R1): `tts_synthesize` returns base64 audio with no playback mechanism — useful only if you can decode it yourself, which most MCP clients can't do natively
- **AI Hobbyist** (R1): `skill_store_*` and `store_skills_*` appear to be two different namespaces for the same concept — confusing duplication
- **AI Hobbyist** (R1): The `career_*` category feels completely out of place for this persona and adds noise without clear synergy with the AI/distributed-systems focus
- **AI Hobbyist** (R1): No tool to list valid `clock_type` values for `causality_create_system` or valid `type` values for `crdt_create_set` — discovery requires trial and error or reading this doc
- **AI Hobbyist** (R1): `auth_check_session` requires a `session_token` but there's no `auth_login` or `auth_get_token` tool — unclear how to bootstrap authentication
- **AI Hobbyist** (R1): `byok_store_key` implies some features may not work without your own API keys — this should be surfaced earlier, not discovered mid-experiment
- **AI Hobbyist** (R1): `bazdmeg_*` tools (FAQ, memory, gates) feel like internal developer tooling leaking into the public API surface
- **AI Hobbyist** (R1): `build_from_github` could be extremely useful but has no mention of rate limits, private repo support, or what "build" produces
- **AI Hobbyist** (R1): No way to share or export CRDT/netsim/causality experiments — the simulations appear ephemeral with no persistence or export tool
- **Enterprise DevOps** (R1): **`sandbox_exec` is explicitly fake** — the description says "SIMULATED EXECUTION ONLY — no code actually runs." This is a fundamental capability gap; without real execution, test automation and CI pipelines are theater.
- **Enterprise DevOps** (R1): **No real secrets management** — `bootstrap_connect_integration` stores credentials in an "encrypted vault," but there's no rotation, no versioning, no audit trail specifically for secret access, and no integration with HashiCorp Vault, AWS Secrets Manager, or similar.
- **Enterprise DevOps** (R1): **No alerting or notification hooks** — observability tools surface data but there's no way to trigger PagerDuty, OpsGenie, Slack, or email on threshold breaches.
- **Enterprise DevOps** (R1): **Audit log retention is 90 days** — most enterprise compliance frameworks (SOC 2, PCI, HIPAA) require 1–3 years.
- **Enterprise DevOps** (R1): **RBAC is unclear** — `permissions_list_pending` and `capabilities_request_permissions` suggest a permissions model, but there's no way to define roles, assign them to users/teams, or query who has what access. This is a blocker for multi-team use.
- **Enterprise DevOps** (R1): **No deployment rollback primitive** — `storage_list` allows rollback inspection but there's no `storage_rollback` or deployment version pinning.
- **Enterprise DevOps** (R1): **Workspace isolation is unverified** — it's unclear whether workspaces provide real tenant isolation or are just organizational labels over shared infrastructure.
- **Enterprise DevOps** (R1): **`sandbox_exec` language is limited and simulated** — even if it were real, there's no mention of resource limits, timeouts, network isolation, or ephemeral filesystem guarantees.
- **Enterprise DevOps** (R1): **Swarm and agents lack health SLAs** — `swarm_health` reports stuck/errored agents but there's no auto-recovery, restart policy, or escalation mechanism.
- **Enterprise DevOps** (R1): **No webhook inbound capability** — no way to trigger MCP actions from external CI events (GitHub Actions, GitLab CI, Jenkins).
- **Enterprise DevOps** (R1): **`bft_*`, `crdt_*`, `netsim_*`, `causality_*` are simulation toys** — not operational tooling; they bloat the tool namespace and risk confusion about what's production-grade vs. educational.
- **Enterprise DevOps** (R1): **`billing_*` exposed directly to agents** — an autonomous agent with access to `billing_create_checkout` or `billing_cancel_subscription` is a spend/availability risk without additional approval gates.
- **Enterprise DevOps** (R1): **No dependency graph for workspace tools** — can't tell which tools depend on which integrations being connected first.
- **Enterprise DevOps** (R1): **Missing: certificate management, container registry access, log aggregation forwarding, infrastructure drift detection.**
- **Enterprise DevOps** (R1): **`error_summary` and `query_errors` have no export format** — no CSV/JSON download, no Splunk/Datadog forwarding.
- **Startup DevOps** (R1): **No CI/CD integration tools** — no webhook triggers, no pipeline status checks, no GitHub Actions or Cloudflare Pages deploy hooks. This is a major gap for a "DevOps" persona.
- **Startup DevOps** (R1): **No alerting or on-call primitives** — `observability_health` shows current state but there's no way to set thresholds or get notified when error rate spikes. Observability without alerting is just logging.
- **Startup DevOps** (R1): **`sandbox_exec` is explicitly fake** — "SIMULATED EXECUTION ONLY" in the description is a significant credibility problem. An ops engineer expecting real code execution will be badly surprised.
- **Startup DevOps** (R1): **No secret rotation or vault management** — `bootstrap_connect_integration` stores credentials but there's no rotate, audit-access, or expiry mechanism visible.
- **Startup DevOps** (R1): **Storage tools lack delete/rollback** — `storage_list` mentions "rollback inspection" but I see no `storage_rollback` or `storage_delete` tool. Read-only rollback inspection is not rollback.
- **Startup DevOps** (R1): **`workspaces_update` requires all fields as required** — `workspace_id`, `name`, and `slug` all marked required even when you only want to rename. Annoying API design.
- **Startup DevOps** (R1): **No environment promotion workflow** — no concept of staging → production promotion, canary deploys, or feature flags beyond the `get_feature_flags` read-only tool.
- **Startup DevOps** (R1): **Tool categorization is inconsistent** — `audit_submit_evaluation` and `audit_query_logs` are both "audit" but serve completely different purposes (persona UX auditing vs. security audit logs). Confusing.
- **Startup DevOps** (R1): **180+ tools with no grouping or recommended flows** — needs a "DevOps quickstart" meta-tool or at minimum a `get_environment` that surfaces which tools are relevant to my current context.
- **Startup DevOps** (R1): **`swarm_spawn_agent` requires `machine_id` and `session_id`** — unclear where these come from without prior documentation. No self-discovery path.
- **Startup DevOps** (R1): **No infrastructure-as-code integration** — no Terraform, Pulumi, or Wrangler config management tools. If this targets Cloudflare Workers teams, wrangler.toml management would be table stakes.
- **Startup DevOps** (R1): **Billing tools expose cancellation without 2FA or confirmation guard** — `billing_cancel_subscription` with `confirm: true` is one tool call away from cancelling the account. An agent mistake or prompt injection could trigger this.
- **Technical Founder** (R1): **Schema types are wrong everywhere** — `confirm`, `isActive`, `isFeatured`, `remote_only`, `unreadOnly` are all typed as `string` but should be `boolean`; `rating`, `limit`, `offset`, `node_count` should be `number` — this suggests the MCP layer isn't type-safe and will cause friction with AI tool-callers
- **Technical Founder** (R1): **`auth_check_session` marks `session_token` as required** — how do I obtain one? There's no `auth_login` or `auth_signup` tool; onboarding is broken at step 0
- **Technical Founder** (R1): **`workspaces_get` marks both `workspace_id` AND `slug` as required** — these should be mutually exclusive alternatives, not both mandatory
- **Technical Founder** (R1): **`bootstrap_create_app` requires `codespace_id`** — but there's no tool to create a codespace; dead end in the bootstrap flow
- **Technical Founder** (R1): **`sandbox_exec` explicitly says "SIMULATED EXECUTION ONLY"** — a tool that doesn't actually execute code is deceptive and useless; should be removed or clearly labeled as a stub
- **Technical Founder** (R1): **No app analytics** — I can deploy apps but I can't see MAU, conversion, or engagement metrics for *my* apps (not platform-wide observability)
- **Technical Founder** (R1): **No custom domain management** — critical for branding; no way to attach `mybusiness.com` to my app
- **Technical Founder** (R1): **No team/collaborator management** — solo founder becomes a team; no invite, role assignment, or shared workspace access tools
- **Technical Founder** (R1): **`brand-command` and `social-autopilot` recommended apps have zero corresponding MCP tools** — the persona onboarding promised these capabilities but they don't exist in the tool surface
- **Technical Founder** (R1): **`dm_send` requires knowing the recipient's email address** — no user directory or search; unusable for cold outreach within the platform
- **Technical Founder** (R1): **CRDT, netsim, causality, bft categories are irrelevant to this persona** — their presence without categorization or filtering makes discovery harder
- **Technical Founder** (R1): **`billing_create_checkout` requires `success_url` and `cancel_url` as required** — why does a platform-native checkout need me to supply redirect URLs? This should have sensible defaults
- **Technical Founder** (R1): **No webhook or event subscription mechanism** — no way to react to billing events, new installs, or user actions in my apps programmatically
- **Technical Founder** (R1): **`skill_store_admin_*` tools are exposed to non-admin users** — calling them will presumably fail with auth errors, but they shouldn't be visible at all unless the user has admin role
- **Technical Founder** (R1): **`store_app_deploy` / A-B testing tools require a `base_codespace_id`** — again, codespace creation is a missing primitive that blocks multiple workflows
- **Technical Founder** (R1): **No search or filtering within agents or sessions by project** — if I'm running multiple products, there's no namespace isolation
- **Technical Founder** (R1): **`report_bug` says reports go to `spike.land/bugbook` (public)** — no option for private/internal bug reporting; a concern for security-sensitive reports
- **Non-technical Founder** (R1): **Recommended apps (app-creator, page-builder, brand-command, social-autopilot) are not present** in the tool list — the core promise to my persona is missing
- **Non-technical Founder** (R1): **No onboarding flow is obvious** — there's no "start here" tool or guided path for a new user
- **Non-technical Founder** (R1): **`bootstrap_create_app` requires a `codespace_id`** — a non-technical user has no idea what this is or where to get one
- **Non-technical Founder** (R1): **180+ tools with no categorized UI** — the flat list is overwhelming; even the category names are opaque (bft? crdt? netsim?)
- **Non-technical Founder** (R1): **No "what can I build?" discovery tool** — something like "tell me your goal and I'll suggest which tools to use" is completely absent
- **Non-technical Founder** (R1): **`workspaces_create` requires a `slug`** — the word "slug" means nothing to a non-technical founder
- **Non-technical Founder** (R1): **Auth tools require a `session_token`** — where does a new user get this? There's no login flow described
- **Non-technical Founder** (R1): **No brand/design tools visible** — I was told this platform helps with brand materials, but there's nothing for logos, colors, fonts, or style guides
- **Non-technical Founder** (R1): **No social media or content publishing tools** — social-autopilot was recommended but doesn't exist here
- **Non-technical Founder** (R1): **`sandbox_exec` says "SIMULATED EXECUTION ONLY"** — if I somehow found and used this, I'd think I was doing real work but nothing would actually happen; that's a trust-breaking deception
- **Non-technical Founder** (R1): **Error reporting (`report_bug`) exists but there's no help/support tool** — if something breaks I can file a bug, but I can't ask for help
- **Non-technical Founder** (R1): **No pricing transparency without calling `billing_list_plans`** — I don't know what's free vs. paid before I start
- **Non-technical Founder** (R1): **Tool descriptions use developer jargon** throughout (e.g., "CRDT replica set", "unified diff", "PBFT cluster") with no plain-English alternatives
- **Non-technical Founder** (R1): **No undo or preview capability** — if I accidentally create something wrong, there's no obvious way to undo it
- **Growth Leader** (R1): No native social media tools — the recommended apps (social-autopilot, brand-command) appear to live in a separate store layer, not as first-class MCP tools I can call directly
- **Growth Leader** (R1): No CRM, pipeline, or revenue tracking tools anywhere in the catalog
- **Growth Leader** (R1): No team analytics — I can't see headcount, productivity, or growth metrics for my team through this interface
- **Growth Leader** (R1): The 80+ tool catalog has no grouping or filtering when first encountered — overwhelming without a "role-based view"
- **Growth Leader** (R1): Highly technical tools (CRDT, BFT, netsim, causality) pollute the namespace for non-engineering users with no apparent way to hide them
- **Growth Leader** (R1): `store_app_install` installs apps, but it's unclear how I'd actually *use* those apps afterward via MCP — is there a separate tool namespace that unlocks post-install?
- **Growth Leader** (R1): `billing_create_checkout` requires me to supply `success_url` and `cancel_url` — odd that a user-facing tool pushes redirect URL plumbing onto the caller
- **Growth Leader** (R1): No brand monitoring, keyword tracking, or social listening tools in the native catalog
- **Growth Leader** (R1): `career_*` tools are framed around individual job-seekers, not managers scaling a team — the persona mismatch is notable
- **Growth Leader** (R1): `chat_send_message` exists but requires me to specify a model — a growth leader shouldn't need to know Claude model IDs
- **Growth Leader** (R1): No onboarding flow surfaces — `bootstrap_status` exists but I was never guided through it; discovery is entirely self-directed
- **Growth Leader** (R1): The `beuniq_*` persona quiz tools seem like they could surface relevant tools for me, but I wasn't directed to start there
- **Growth Leader** (R1): `reminders_create` requires ISO 8601 date format — no natural language date parsing, which is a usability regression for non-technical users
- **Growth Leader** (R1): No content calendar, publishing schedule, or campaign tracking tools visible
- **Growth Leader** (R1): `audit_*` tools under the persona category are clearly internal QA infrastructure exposed at the top level — confusing and should be hidden from end users
- **Ops Leader** (R1): **No discovery layer for non-technical users** — 180+ tools with no "Start here for ops leaders" guide, wizard, or filtered view
- **Ops Leader** (R1): **Recommended apps (ops-dashboard, brand-command, etc.) don't map to visible tool categories** — the persona onboarding and the actual tool catalog are disconnected
- **Ops Leader** (R1): **`bootstrap_create_app` requires passing raw code** — completely inaccessible to a non-developer ops leader
- **Ops Leader** (R1): **Reminders have no recurrence or team-sharing** — a solo reminder tool is insufficient for team ops workflows
- **Ops Leader** (R1): **No team/people management tools** — can't assign tasks to teammates, track who did what, or manage org-level workflows
- **Ops Leader** (R1): **`audit_query_logs` and `observability_*` are useful but require knowing service names and tool names upfront** — steep learning curve
- **Ops Leader** (R1): **`orchestrator_*` and `swarm_*` require deeply technical understanding of task graphs** — not accessible for a business leader wanting simple automation
- **Ops Leader** (R1): **No KPI or metrics tracking tools** — surprising omission for an "ops leader" persona
- **Ops Leader** (R1): **`store_app_personalized` exists but presumably needs install history** — useless on first visit
- **Ops Leader** (R1): **No calendar or scheduling integration** — ops leaders live in calendars; reminders alone don't cut it
- **Ops Leader** (R1): **`crdt_*`, `netsim_*`, `bft_*`, `causality_*` tools add serious noise** — irrelevant to 95% of business users and should be hidden or collapsed
- **Ops Leader** (R1): **`chat_send_message` only returns non-streaming responses** — noted limitation, but no mention of context persistence or threading for ongoing workflows
- **Ops Leader** (R1): **`dm_send` requires knowing someone's email** — no directory or team member lookup tool exists
- **Ops Leader** (R1): **No export or reporting tools** — can't generate a weekly ops summary or board-level report
- **Ops Leader** (R1): **`bazdmeg_*` tools are completely opaque** — no context given for what BAZDMEG is without prior knowledge of the methodology
- **Content Creator** (R1): **Core creative tools are absent**: image-studio, page-builder, music-creator, and audio-studio are listed as recommended apps but zero MCP tools correspond to them — this is a major gap between marketing and reality
- **Content Creator** (R1): **TTS is the only audio tool**: one voice synthesis endpoint doesn't constitute an "audio-studio"; no mixing, no music generation, no waveform editing
- **Content Creator** (R1): **No image generation tools**: despite `mcp-image-studio` existing as a package in the platform, none of its tools appear here (generate, enhance, crop, etc. are all missing)
- **Content Creator** (R1): **No page builder tools**: there's a `bootstrap_create_app` and some `esbuild_*` tools for developers, but nothing that lets a non-technical creator visually build a page
- **Content Creator** (R1): **Overwhelming tool count for a non-technical user**: ~180 tools with no categorized onboarding path; a creator landing here would bounce immediately
- **Content Creator** (R1): **Category names are opaque**: "crdt", "bft", "netsim", "causality" — these category names signal this MCP server was built for engineers, not creators
- **Content Creator** (R1): **`store_install` vs. actual tool availability is unclear**: can I install image-studio and then get those tools, or are they just web apps? The MCP tool layer doesn't clarify this
- **Content Creator** (R1): **`sandbox_exec` is explicitly simulated**: the description says "SIMULATED EXECUTION ONLY — no code actually runs" — this is buried in a description and could badly mislead creators trying to preview interactive content
- **Content Creator** (R1): **No content scheduling or publishing tools**: a content creator needs to publish to social channels, schedule posts, manage content calendars — nothing here covers that
- **Content Creator** (R1): **Auth flow is unclear**: `auth_check_session` requires a `session_token` as a *required* field — how does a new user get this token? There's no `auth_login` or `auth_signup` tool visible
- **Content Creator** (R1): **`dm_send` requires knowing a recipient email**: no way to discover other users or community members, making social/collaboration features inaccessible
- **Content Creator** (R1): **Billing tools expose subscription management but no free tier clarity**: a creator exploring the platform doesn't know what they can try for free before calling `billing_list_plans`
- **Content Creator** (R1): **No undo/version history for creative work**: if I create something with `bootstrap_create_app` and it goes wrong, there's no rollback tool visible
- **Hobbyist Creator** (R1): The recommended creative apps (image-studio, music-creator, audio-studio, page-builder) have **no direct MCP tools** — they're buried in the store, not exposed as first-class capabilities
- **Hobbyist Creator** (R1): **Zero image generation or editing tools** in the MCP surface despite "image-studio" being the #1 recommended app for this persona
- **Hobbyist Creator** (R1): **Zero music/audio creation tools** beyond TTS — no synthesis, no beat generation, no audio manipulation
- **Hobbyist Creator** (R1): **No page-builder MCP tools** — another recommended app with no direct tooling
- **Hobbyist Creator** (R1): The tool list is dominated (~60%+) by developer infrastructure categories (CRDT, netsim, BFT, causality, orchestrator, swarm, session, diff, testgen, retro) that are completely irrelevant to a hobbyist creator
- **Hobbyist Creator** (R1): `sandbox_exec` explicitly says "SIMULATED EXECUTION ONLY — no code actually runs" — this is buried in a description and feels like a hidden gotcha
- **Hobbyist Creator** (R1): `bootstrap_create_app` could be interesting for creative apps but requires knowing `codespace_id` with no guidance on how to get one
- **Hobbyist Creator** (R1): The `career_*` tools are a jarring category for someone using a creative platform — feels like a different product entirely
- **Hobbyist Creator** (R1): `bazdmeg_*` tools (faq, memory, gates) are opaque jargon with no explanation of what BAZDMEG means to a new user
- **Hobbyist Creator** (R1): `capabilities_request_permissions` implies some tools are locked behind approval — unclear which ones or why, creates anxiety about what I can and can't do
- **Hobbyist Creator** (R1): No **gallery, project save, or portfolio** tools — nowhere to collect and showcase creative work
- **Hobbyist Creator** (R1): `store_app_personalized` supposedly uses "install history" but I haven't installed anything yet — cold start problem with no fallback explanation
- **Hobbyist Creator** (R1): The auth tools require a `session_token` as a required field with no guidance on how to obtain one as a first-time user
- **Hobbyist Creator** (R1): Tool count (~180+) is extreme — no categorized "getting started" path or beginner-friendly entry point for non-developers
- **Social Gamer** (R1): No dedicated gaming tools whatsoever — chess-arena and tabletop-sim are recommended apps but have zero MCP surface area to interact with game state, moves, lobbies, or scores
- **Social Gamer** (R1): No real-time communication channel — `dm_send` requires an email address, which means I'd need to already know my friend's email, with no in-platform friend list or username search
- **Social Gamer** (R1): No friend/social graph tool — can't see who else is online, can't add friends by username, can't see who's in a game
- **Social Gamer** (R1): No lobby or matchmaking tool — no way to create or join a game session via MCP
- **Social Gamer** (R1): No notification system — if a friend invites me to a game, there's no way to receive that through MCP (agent inbox exists but is for AI agents, not human users)
- **Social Gamer** (R1): `store_app_install` installs an app but doesn't launch it or give me a URL — unclear what happens next
- **Social Gamer** (R1): The tool count (180+) is overwhelming for a non-technical user; there's no onboarding filter or "recommended for you" tool subset
- **Social Gamer** (R1): `capabilities_check_permissions` and `capabilities_request_permissions` suggest I may not even have access to all tools by default — no guidance on what's restricted or why
- **Social Gamer** (R1): `billing_list_plans` implies some features are paywalled, but it's unclear which gaming features (if any) require a paid tier
- **Social Gamer** (R1): `chat_send_message` could be used to get help, but there's no indication it knows about chess-arena or tabletop-sim specifically
- **Social Gamer** (R1): No way to see if friends are currently playing — no presence/status system
- **Social Gamer** (R1): `report_bug` is appreciated, but bugs in chess-arena or tabletop-sim would need to be reported blind since I can't even inspect game state via MCP
- **Social Gamer** (R1): The `beuniq_start` persona quiz and audit tools feel completely out of place for a gamer — this MCP server seems designed for platform operators, not end users
- **Solo Explorer** (R1): No obvious "start here" tool or onboarding flow — `beuniq_start` exists but is last in the list and unlabeled as an entry point
- **Solo Explorer** (R1): The recommended apps (cleansweep, image-studio, music-creator, career-navigator) don't map to any visible tool names — I can't directly invoke them; I have to hunt via `store_search`
- **Solo Explorer** (R1): ~100 of the 150+ tools are developer/distributed-systems infrastructure with zero casual-user relevance — there's no filtering or tiering by audience
- **Solo Explorer** (R1): `reminders_create` requires an ISO 8601 date — a casual user typing "tomorrow" or "next Friday" will be immediately stuck
- **Solo Explorer** (R1): `create_classify_idea` sounds magical but the description is confusing ("not a live app") — unclear what the output actually is or what to do next
- **Solo Explorer** (R1): `bootstrap_create_app` requires a `codespace_id` with no explanation of how to get one
- **Solo Explorer** (R1): `store_search` requires `category` and `limit` as required fields — I don't know what categories exist; there's no discovery step
- **Solo Explorer** (R1): `career_assess_skills` takes a skills list but gives no hint about format (comma-separated? JSON array? free text?)
- **Solo Explorer** (R1): No music-creation tools visible at all — music-creator is a recommended app but there's no `music_*` category in the MCP tools
- **Solo Explorer** (R1): `chat_send_message` requires a `model` as required field — a casual user has no idea what Claude model to pick
- **Solo Explorer** (R1): `tts_synthesize` requires a `voice_id` — forces users to call `tts_list_voices` first, which isn't obvious
- **Solo Explorer** (R1): The BYOK, audit-log, CRDT, BFT, netsim, causality, diff, testgen, retro, session, swarm categories add cognitive burden with zero benefit for this persona
- **Solo Explorer** (R1): No "help" or "what can you do for me" meta-tool — the list is self-documenting for engineers but not for casual users
- **Solo Explorer** (R1): `store_app_personalized` exists but presumably requires install history — useless on first visit
- **Solo Explorer** (R1): `billing_list_plans` is buried; I'd want to see this early to understand if useful tools are paywalled before I invest time exploring
- **AI Indie** (R2): **`sandbox_exec` is explicitly fake** — labeled "SIMULATED EXECUTION ONLY." This is the most important capability gap; an indie builder needs real code execution.
- **AI Indie** (R2): **Three overlapping multi-agent systems**: `swarm_*`, `orchestrator_*`, and `session_*` all coordinate agents with no clear guidance on which to use and when. This is paralyzing.
- **AI Indie** (R2): **`workspaces_get` requires BOTH `workspace_id` AND `slug` as required fields** — you'd only know one of these; this is an API design bug.
- **AI Indie** (R2): **`bootstrap_create_app` requires `codespace_id`** as a required field, but there's no `codespace_create` tool — chicken-and-egg problem.
- **AI Indie** (R2): **`auth_check_session` requires `session_token`** as a required field — how do I get this token without already being authenticated through another channel?
- **AI Indie** (R2): **`chat_send_message` requires `model` and `system_prompt`** — both should have defaults; forces unnecessary boilerplate for a simple AI call.
- **AI Indie** (R2): **Internal audit tools are fully exposed**: `plan_generate_batch_audit`, `audit_submit_evaluation`, `audit_compare_personas`, `plan_get_status` — these appear to be spike.land's internal persona QA pipeline leaked into the public tool surface.
- **AI Indie** (R2): **`beuniq_*` (personality quiz) and `career_*` (ESCO job matching)** are completely off-persona for an AI indie builder; adds noise and confusion about the platform's identity.
- **AI Indie** (R2): **CRDT, netsim, causality, BFT categories** are academic distributed systems tools — interesting engineering demos, but why are they in an "indie builder" product suite?
- **AI Indie** (R2): **`storage_upload_batch` requires pre-computed SHA-256 hashes** — adds friction; a simpler upload path should exist.
- **AI Indie** (R2): **`billing_create_checkout` requires `success_url` and `cancel_url` as required** — these have obvious defaults (spike.land settings/pricing) that shouldn't be mandatory.
- **AI Indie** (R2): **No deployment status or rollback tools** — I can deploy an app but can't check its health or roll back a bad deploy through MCP.
- **AI Indie** (R2): **No webhook/event subscription tools** — I can't react to platform events (new user, app crash, billing event) from my agent.
- **AI Indie** (R2): **`testgen_*` generates tests but `sandbox_exec` is fake** — test generation without test execution is half a workflow; the two tools together are misleading.
- **AI Indie** (R2): **80+ tools with no grouping or progressive disclosure** — discovery remains a serious usability problem; need a `tools_suggest` or `tools_for_goal` meta-tool.
- **AI Indie** (R2): **`dm_send` requires `toEmail`** — I don't know other users' emails; this tool is effectively unusable without a directory tool that doesn't exist.
- **AI Indie** (R2): **`bazdmeg_*` methodology enforcement** is opinionated workflow tooling with no opt-out signaling — unclear if this is mandatory platform behavior or optional.
- **AI Indie** (R2): **`tool_usage_stats` and `error_rate`** are observability tools requiring no auth parameter — unclear if this exposes other users' usage data.
- **AI Indie** (R2): **No rate limit information** anywhere in tool descriptions — critical for an indie builder budgeting API calls.
- **Classic Indie** (R2): **Identity crisis**: 80+ tools span solo dev tools, distributed systems research, career counseling, and quiz apps — there's no coherent product story for an indie developer
- **Classic Indie** (R2): **`sandbox_exec` is fake**: the description literally says "SIMULATED EXECUTION ONLY — no code actually runs." This is a landmine — any agent that reaches for this expecting real execution will silently produce garbage
- **Classic Indie** (R2): **`bootstrap_create_app` requires a `codespace_id` as required input** but there's no `codespace_create` tool — the dependency is undocumented and creates a dead end
- **Classic Indie** (R2): **`workspaces_update` marks all three fields (`workspace_id`, `name`, `slug`) as required** — you can't rename without also providing a slug, and vice versa; no partial updates
- **Classic Indie** (R2): **`storage_manifest_diff` and `storage_upload_batch` take a `files` param typed as `string`** — no schema for what that string format is (JSON? CSV? multipart?); same problem affects `diff_create`, `diff_apply`, etc.
- **Classic Indie** (R2): **No `codespace_list` or `codespace_get` tool** — I can deploy to a codespace but can't inspect or manage existing ones through this MCP server
- **Classic Indie** (R2): **`auth_check_session` marks `session_token` as required** but the description says "Optional session token" — the schema contradicts the docs
- **Classic Indie** (R2): **`billing_cancel_subscription` requires `confirm` field** but also has no dry-run path that's clearly distinguished — easy to accidentally cancel
- **Classic Indie** (R2): **No webhook or event subscription tools** — for a solo dev shipping a product, I need to know when my app breaks, not just pull metrics manually
- **Classic Indie** (R2): **`store_app_rate` accepts `rating` as a `string`** not a number — invites malformed input and suggests the type system isn't rigorous across the board
- **Classic Indie** (R2): **`report_bug` has `error_code` as required** — I won't have an error code for a UX complaint or missing feature request; this blocks non-technical feedback
- **Classic Indie** (R2): **`tts_synthesize` and `tts_list_voices` have no obvious connection to app development** — feels like API surface added for completeness, not because indie devs need TTS in their ship-product workflow
- **Classic Indie** (R2): **No local dev / hot-reload story** — `esbuild_transpile` transpiles code but there's no way to iterate on it; no watch mode, no preview URL
- **Classic Indie** (R2): **The A/B testing flow (`store_app_deploy` → variants → `declare_winner`) has no rollback tool** — only `store_app_cleanup` which deletes the whole deployment, not just a bad variant
- **Classic Indie** (R2): **`capabilities_request_permissions` exists but there's no documentation on what tools require elevated permissions** — I'd only discover permission gates by failing
- **Agency Dev** (R2): **`sandbox_exec` is fake** — tool description explicitly says no code runs; this is a significant trust-breaker and should be removed or replaced
- **Agency Dev** (R2): **No page-builder or brand-command MCP tools** — the recommended apps for this persona have no MCP surface at all
- **Agency Dev** (R2): **No client/project isolation** — workspaces exist but there's no way to segment billing, secrets, or deployments per client; I'd be mixing client A's assets with client B's
- **Agency Dev** (R2): **`workspaces_get` requires BOTH `workspace_id` AND `slug` as required fields** — you should only need one; this is a schema error
- **Agency Dev** (R2): **No handoff/export workflow** — no way to package and deliver a finished app to a client with their own ownership
- **Agency Dev** (R2): **No git integration** — zero tools for branching, committing, or PR management; agencies live in git
- **Agency Dev** (R2): **No domain/DNS management** — deploying to client domains is a core agency task, completely absent
- **Agency Dev** (R2): **No white-labeling** — can't deploy under a client's brand identity through MCP
- **Agency Dev** (R2): **`storage_manifest_diff` requires pre-computed SHA-256 hashes** — caller has to compute these externally; not ergonomic from an agent context
- **Agency Dev** (R2): **Academic tools (CRDT, BFT, netsim, causality) pollute the namespace** — 50+ tools I'd never use buried among the 10 I need
- **Agency Dev** (R2): **No collaborator/team roles per workspace** — can't invite clients or teammates to review work
- **Agency Dev** (R2): **`dm_send` is the only communication tool** — no Slack, no webhook, no notification channels for client approvals
- **Agency Dev** (R2): **Career tools are completely irrelevant** to agency dev work and add noise
- **Agency Dev** (R2): **No CMS or content management** — agency clients always need content editing; nothing here addresses that
- **Agency Dev** (R2): **Billing only manages the agency's own subscription** — no way to set up client billing or pass-through pricing
- **Agency Dev** (R2): **`create_classify_idea` returns a category/template suggestion, not an app** — misleadingly named; sounds like creation but is just classification
- **Agency Dev** (R2): **`bazdmeg` is a proprietary methodology** with its own vocabulary and gates — steep learning curve for zero transferable value outside spike.land
- **Agency Dev** (R2): **No webhook or event integration** — can't trigger external client CI systems or notify Slack on deploy
- **Agency Dev** (R2): **The swarm/session/orchestrator tools have significant overlap** — three different paradigms for multi-agent coordination with unclear guidance on which to use when
- **Agency Dev** (R2): **No documentation or `list_tools` discovery endpoint** — the only way to know what exists is having the full list handed to you out-of-band
- **In-house Dev** (R2): **`sandbox_exec` is deceptively named** — "SIMULATED EXECUTION ONLY" should be in the tool name or at minimum a top-level warning, not buried in the description. This will waste developer time.
- **In-house Dev** (R2): **Test generation has no execution path** — `testgen_*` generates code but there's no tool to actually run it. The loop is broken.
- **In-house Dev** (R2): **Many required fields are clearly optional** — `storage_list` requires `prefix`, `limit`, `cursor` but these are obviously pagination/filter params. Forces callers to pass empty strings, which is awkward and error-prone.
- **In-house Dev** (R2): **`bazdmeg` is completely opaque naming** — no in-product explanation of what it stands for or why it exists. An in-house dev hitting this cold will skip it entirely.
- **In-house Dev** (R2): **No environment scoping (staging vs prod)** — every tool appears to operate against one environment. No way to safely test ops workflows without touching production state.
- **In-house Dev** (R2): **Audit log retention capped at 90 days** — most compliance frameworks (SOC 2, ISO 27001) require 1 year minimum. This is a blocker for regulated industries.
- **In-house Dev** (R2): **`byok_store_key` encryption model undocumented** — told keys are "encrypted at rest" but no info on key management, HSM use, or who can access them server-side. Security team will reject this without answers.
- **In-house Dev** (R2): **No webhook or push model** — everything is pull-based polling. For ops workflows, I need to react to events (deploy complete, test failed) without polling loops.
- **In-house Dev** (R2): **`dm_send` but no team/channel concept** — direct messages to individuals don't scale. No group messaging, no shared inbox for on-call rotation.
- **In-house Dev** (R2): **`swarm_*` and `session_*` are overlapping in unclear ways** — both model multi-agent work but with different APIs and data models. No guidance on when to use which.
- **In-house Dev** (R2): **`store-ab` tools are mixed into a dev-facing tool list** — A/B testing store app variants is a product/marketing concern. Its presence here adds noise for a developer focused on infra and testing.
- **In-house Dev** (R2): **`career_*` tools are entirely off-persona** — resume building and job matching have no place in a workflow tool for an employed developer. Significant scope bloat.
- **In-house Dev** (R2): **No rollback primitive** — `storage_upload_batch` deploys assets but there's no `storage_rollback`. List + manual re-upload is not a rollback strategy.
- **In-house Dev** (R2): **`capabilities_request_permissions`** implies a permission gating system, but there's no documentation on what's gated, what the approval SLA is, or who approves. Blocks self-service adoption.
- **In-house Dev** (R2): **`retro_analyze` requires a `session_id`** — forces you into the session workflow to get retrospective value, even if you want to analyze work done outside the platform.
- **ML Engineer** (R2): **`sandbox_exec` is fake** — documented as simulated-only, making the entire sandbox category useless for running training scripts, data pipelines, or model inference
- **ML Engineer** (R2): **No real compute attachment** — swarm agents are database rows, not actual worker processes; no way to bind to a GPU instance, container, or Kubernetes pod
- **ML Engineer** (R2): **No experiment tracking** — no equivalent of MLflow runs, wandb experiments, or Comet.ml; nowhere to log metrics like loss, accuracy, or AUC across epochs
- **ML Engineer** (R2): **No model registry** — no versioned model artifact storage, no promotion workflow (staging → production), no rollback by model version
- **ML Engineer** (R2): **No dataset management** — `storage_upload_batch` handles R2 assets, not partitioned datasets with schema validation, lineage, or versioning
- **ML Engineer** (R2): **No feature store** — no way to define, materialize, or serve features; critical for production ML
- **ML Engineer** (R2): **AI gateway is read-only** — `ai_list_models` shows available models but provides no batch evaluation, A/B comparison between models, or structured benchmark tooling
- **ML Engineer** (R2): **Observability is MCP-layer only** — `tool_usage_stats` and `error_rate` track MCP calls, not ML metrics like inference latency, model drift, data distribution shifts, or GPU utilization
- **ML Engineer** (R2): **`testgen_from_code` generates unit tests, not ML tests** — no support for generating data validation tests, model performance regression tests, or fairness checks
- **ML Engineer** (R2): **Orchestrator has no ML-native task types** — `orchestrator_create_plan` is generic text; no first-class support for training steps, evaluation gates, or deployment approvals
- **ML Engineer** (R2): **No pipeline DAG visualization or persistence** — plans exist in memory per session; no durable pipeline definitions that survive restarts
- **ML Engineer** (R2): **CRDT/netsim/causality/BFT are misplaced** — these are distributed systems teaching tools, not production infrastructure; they inflate the tool count without adding ML value
- **ML Engineer** (R2): **`retro_analyze` depends on session history** — if I didn't instrument every action through spike.land sessions, the retrospective has no data to analyze; most ML work happens outside this platform
- **ML Engineer** (R2): **No hyperparameter search tooling** — no grid search, random search, or Bayesian optimization primitives
- **ML Engineer** (R2): **No data pipeline connectors** — no S3, GCS, BigQuery, or Snowflake integrations; ingestion and transformation are entirely out of scope
- **ML Engineer** (R2): **`byok_store_key` is useful but incomplete** — I can bring my Anthropic/OpenAI key, but there's no mechanism to route different workloads to different providers based on cost or capability
- **ML Engineer** (R2): **Career and persona audit tools (30+ tools) are completely irrelevant** to ML engineering and dilute discoverability of actually useful tools
- **ML Engineer** (R2): **No role-based access for ML artifacts** — no way to restrict who can promote a model to production or modify a pipeline definition
- **AI Hobbyist** (R2): **`sandbox_exec` is fake** — "SIMULATED EXECUTION ONLY" is the most critical deception in the API; a hobbyist will not notice this until they've already built a workflow around it
- **AI Hobbyist** (R2): **Four overlapping coordination systems** — `agents_*`, `swarm_*`, `orchestrator_*`, and `session_*` all overlap; no decision guide or clear use-case boundary exists
- **AI Hobbyist** (R2): **Duplicate skill/store tools** — `skill_store_list/get/install` and `store_skills_list/get/install` appear to be the same functionality published twice under different namespaces
- **AI Hobbyist** (R2): **`auth_check_session` requires `session_token` as required field** — contradicts the "current user" framing of other auth tools; no explanation of how session context flows through MCP
- **AI Hobbyist** (R2): **`billing_create_checkout` requires `success_url` and `cancel_url`** — meaningless in a non-browser MCP context; Stripe redirect URLs are useless from an agent
- **AI Hobbyist** (R2): **`mcp_registry_install` claims to "generate a .mcp.json entry"** — cannot modify local filesystem from a remote MCP server; misleading capability claim
- **AI Hobbyist** (R2): **`tts_synthesize` returns base64 audio with no playback path** — the data is a dead end within an MCP session; no `tts_play` or file-writing counterpart
- **AI Hobbyist** (R2): **Many `required` arrays include fields that are clearly optional** — e.g., `storage_list` lists `prefix`, `limit`, `cursor` as required with empty descriptions, making the schema misleading
- **AI Hobbyist** (R2): **`bazdmeg_*` tools feel like internal platform machinery** — FAQ management, superpowers gate checks, and memory search should not be in a public-facing MCP surface
- **AI Hobbyist** (R2): **`beUniq` persona quiz** — a multi-step onboarding quiz embedded in an MCP server feels wildly out of place
- **AI Hobbyist** (R2): **`chat_send_message` is non-streaming** — no progress feedback for long responses; for experimentation this is a poor DX
- **AI Hobbyist** (R2): **No rate limit or quota documentation** — no indication of what `tts_synthesize` or `chat_send_message` cost or how heavily they can be called
- **AI Hobbyist** (R2): **`dm_send` requires email with no user directory** — no lookup tool to discover who to message; the tool is effectively blind
- **AI Hobbyist** (R2): **`store_app_deploy` and A/B variant tools** — platform-admin operations (impression tracking, winner declaration) exposed to all users with no obvious access guard
- **AI Hobbyist** (R2): **No webhook or event subscription mechanism** — for building automated pipelines, push notifications are absent; polling is the only option
- **AI Hobbyist** (R2): **`build_from_github`** — no authentication for private repos; limited to public GitHub only with no mention of this constraint
- **AI Hobbyist** (R2): **`career_*` and `career_growth_*` tools** — entirely disconnected from the AI hobbyist use case; dilute the server's identity
- **AI Hobbyist** (R2): **Context index (`context_index_repo`, `context_pack`)** — no indication of TTL or when indexed data expires; session-scoped? Permanent?
- **Enterprise DevOps** (R2): `sandbox_exec` is labeled *"SIMULATED EXECUTION ONLY"* but is exposed as an operational tool — this is fundamentally deceptive in an agentic pipeline and should either be removed or clearly namespaced as `sandbox_exec_demo`
- **Enterprise DevOps** (R2): No actual code execution environment; the sandboxing primitives are effectively theater
- **Enterprise DevOps** (R2): Audit log retention is hardcoded to 90 days — enterprise compliance (SOC2, ISO 27001) often requires 1-3 years; no configurable retention policy visible
- **Enterprise DevOps** (R2): No SIEM/webhook integration for audit events — real-time export to Splunk, Datadog, or Elastic is absent
- **Enterprise DevOps** (R2): Permissions system is human-approval-gated (`permissions_respond`) with no automated policy enforcement or OPA/policy-as-code integration
- **Enterprise DevOps** (R2): No RBAC role definitions — `auth_check_route_access` checks a hardcoded path but there's no API to define or manage roles
- **Enterprise DevOps** (R2): No SSO/SAML/OIDC tooling — enterprise auth requires federated identity, not just session tokens
- **Enterprise DevOps** (R2): Workspace model is flat — no org hierarchy, no sub-team structure, no delegated administration
- **Enterprise DevOps** (R2): `swarm_get_cost` reads agent metadata rather than authoritative platform metering — not suitable for chargeback or budget enforcement
- **Enterprise DevOps** (R2): `byok_store_key` description says "encrypted at rest" with no specifics — no info on encryption standard, key derivation, or whether HSM/envelope encryption is used
- **Enterprise DevOps** (R2): No rollback, blue/green, or canary deployment primitives — storage upload is append-only with no promotion/rollback workflow
- **Enterprise DevOps** (R2): No CI/CD integration hooks (GitHub Actions, GitLab CI, Jenkins) — the orchestration tools are self-contained islands
- **Enterprise DevOps** (R2): Career tools (`career_assess_skills`, `career_match_jobs`, `career_create_resume`, etc.) are completely irrelevant to enterprise ops and pollute the namespace
- **Enterprise DevOps** (R2): Consumer tools (beUniq persona quiz, TTS, blog, learning quiz) add noise that degrades discoverability of actual platform capabilities
- **Enterprise DevOps** (R2): CRDT, netsim, causality, and BFT tools are academic simulations with no connection to real infrastructure state — useful for education, misleading in a DevOps context
- **Enterprise DevOps** (R2): No rate limiting information exposed — cannot enforce API budget controls or predict throttling behavior under load
- **Enterprise DevOps** (R2): `context_index_repo` indexes GitHub repos but no authentication support — private repos are inaccessible, limiting real enterprise codebase analysis
- **Enterprise DevOps** (R2): No incident management integration (PagerDuty, OpsGenie, VictorOps) — alerts from `error_rate` go nowhere actionable
- **Enterprise DevOps** (R2): `orchestrator_dispatch` marks subtasks as dispatched but has no mechanism to actually invoke agents — the handoff between plan and execution is undefined
- **Enterprise DevOps** (R2): No secrets rotation tooling — `bootstrap_connect_integration` stores credentials but there's no rotation, expiry, or audit trail for secret access
- **Startup DevOps** (R2): **No real deployment hooks** — `storage_upload_batch` covers static assets to R2, but there's no tool to trigger a Cloudflare Workers deploy, check deploy status, or roll back a deployment
- **Startup DevOps** (R2): **Observability is MCP-introspection, not service observability** — `error_rate`, `observability_health`, `query_errors` all query MCP call logs, not application logs or service errors; completely useless for debugging a prod incident
- **Startup DevOps** (R2): **No log streaming or tail** — no way to query Cloudflare Workers logs, tail logs in real-time, or search structured logs from my services
- **Startup DevOps** (R2): **No alerting or on-call integration** — no PagerDuty, no webhook triggers, no "alert when error rate spikes" primitive
- **Startup DevOps** (R2): **`sandbox_exec` is fake** — the description literally says "SIMULATED EXECUTION ONLY — no code actually runs"; this is a trust-breaking discovery buried in the description, not surfaced prominently
- **Startup DevOps** (R2): **Secret/credential storage is opaque** — `bootstrap_connect_integration` stores credentials but there's no way to list what's stored, test connectivity, or rotate secrets; `byok_*` is only for AI provider keys
- **Startup DevOps** (R2): **No environment promotion workflow** — no staging → production promotion, no canary/blue-green beyond the A/B store variants (which are for app UI, not infra)
- **Startup DevOps** (R2): **A/B testing tools are store-app scoped** — `store_app_add_variant`, `store_app_declare_winner` etc. are for the spike.land app store, not for my own service deployments
- **Startup DevOps** (R2): **`storage_list` requires mandatory `prefix`, `limit`, `cursor` params** — all marked required even though they're logically optional filters; breaks basic discoverability
- **Startup DevOps** (R2): **swarm tools have no auth boundary** — `swarm_broadcast` sends to "all active agents" with no workspace scoping mentioned; blast radius unclear
- **Startup DevOps** (R2): **No infrastructure-as-code integration** — no Terraform state queries, no Wrangler config management, no way to inspect bindings or KV namespaces
- **Startup DevOps** (R2): **Distributed systems tools (CRDT, netsim, BFT, causality) are educational, not operational** — interesting for a distributed systems course, not for a startup that needs to ship
- **Startup DevOps** (R2): **Tool count to useful-tool ratio is poor** — 150+ tools but maybe 10-15 are actionable for a DevOps workflow; cognitive overhead of navigating this is real
- **Startup DevOps** (R2): **No cost visibility beyond swarm token costs** — `billing_status` shows subscription tier, `swarm_get_cost` shows agent token spend, but nothing about Cloudflare usage, D1 row reads, R2 bandwidth
- **Startup DevOps** (R2): **`retro_*` and `career_*` categories are completely off-persona** — interview prep and resume building have no business being surfaced in a DevOps context
- **Startup DevOps** (R2): **No webhook or event subscription model** — everything is pull-based polling; I can't subscribe to "alert me when deploy fails" or "notify on error spike"
- **Technical Founder** (R2): `sandbox_exec` description literally reads "SIMULATED EXECUTION ONLY — no code actually runs" — this is a fake tool masquerading as real functionality, which is a trust-killer
- **Technical Founder** (R2): `bootstrap_create_app` requires a `codespace_id` as a mandatory param, but there is no tool to create or list codespaces; the flow is broken before it starts
- **Technical Founder** (R2): `auth_check_session` marks `session_token` as **required** but the description says "Optional session token" — schema contradicts description
- **Technical Founder** (R2): `workspaces_get` requires **both** `workspace_id` and `slug` — you'd only ever have one, making this always fail or require guessing
- **Technical Founder** (R2): Dual parallel APIs for skills: `skill_store_*` and `store_skills_*` — identical domain, duplicated tool surface, no explanation of difference
- **Technical Founder** (R2): `billing_create_checkout` requires `success_url` and `cancel_url` as mandatory — as an MCP-only user I have no browser context to provide redirect URLs
- **Technical Founder** (R2): Recommended apps (`brand-command`, `social-autopilot`, `ops-dashboard`, `app-creator`) have no corresponding MCP tools — the persona onboarding promise is broken
- **Technical Founder** (R2): No social media publishing tools at all — `social-autopilot` is recommended but there's no `post_tweet`, `schedule_content`, `publish_linkedin`, etc.
- **Technical Founder** (R2): No brand asset tools — no logo generation, color palette, copywriting, or brand kit management
- **Technical Founder** (R2): ~40% of tools (CRDT, BFT, netsim, causality, career assessment, quiz, learnit, beuniq) are entirely irrelevant to this persona with no way to filter them out
- **Technical Founder** (R2): `bazdmeg_*` tools reference an internal methodology with no external documentation — opaque and unusable without insider context
- **Technical Founder** (R2): The A/B testing tools (`store_app_*` under `store-ab`) appear to be for the spike.land store's own apps, not user-deployed apps — misleading category name
- **Technical Founder** (R2): `create_check_health` checks if a codespace has "non-default content" but codespaces can't be created via MCP — circular dead-end
- **Technical Founder** (R2): No webhook or event subscription mechanism — no way to react to billing events, deploys, or user activity outside of polling
- **Technical Founder** (R2): `observability_*` tools surface raw error rates and latency stats but with no drill-down or alerting — useful data, unusable without a dashboard UI
- **Technical Founder** (R2): Tool count (~180) with no persona-filtered view makes onboarding cognitively overwhelming; a founder needs a "starter set" of 10-15 tools, not a flat list of 180
- **Non-technical Founder** (R2): The four "Recommended Apps" (app-creator, page-builder, brand-command, social-autopilot) have no corresponding MCP tools — the recommendation is a dead end with no path forward
- **Non-technical Founder** (R2): `bootstrap_create_app` requires a `code` parameter — this is a hard blocker for a no-code user; there's no code-free alternative offered
- **Non-technical Founder** (R2): `bootstrap_create_app` also requires a `codespace_id` with no explanation of how to get one without being technical
- **Non-technical Founder** (R2): ~60% of tools (crdt, bft, causality, netsim, swarm, orchestrator, diff, testgen, retro, session) are completely irrelevant and invisible to this persona — no filtering or persona-scoped view exists
- **Non-technical Founder** (R2): No single "start here" entry point or guided onboarding flow — 180+ tools with no priority signal
- **Non-technical Founder** (R2): The `create_*` category description says "public /create flow" but what that means and where that UI lives is never explained
- **Non-technical Founder** (R2): `store_search` and `store_browse_category` exist but there's no "no-code" or "founder" category visible — I'd be guessing search terms
- **Non-technical Founder** (R2): `bootstrap_connect_integration` requires passing `credentials` — this implies knowing API keys/secrets, which non-technical founders typically don't have readily available
- **Non-technical Founder** (R2): No brand or design tools visible — the persona's core need (brand materials) is completely unaddressed by available tools
- **Non-technical Founder** (R2): `billing_create_checkout` requires providing `success_url` and `cancel_url` — why does a non-technical user need to supply redirect URLs?
- **Non-technical Founder** (R2): `tts_synthesize` is interesting but requires knowing a `voice_id` with no discoverability unless you first call `tts_list_voices` — a two-step trap with no guidance
- **Non-technical Founder** (R2): `chat_send_message` exists but requires knowing the model name — non-technical users shouldn't need to know or choose AI model identifiers
- **Non-technical Founder** (R2): No "help" or "guide me" tool — the MCP interface has no meta-tool to explain itself to a newcomer
- **Non-technical Founder** (R2): The `beuniq_*` persona quiz is buried with no explanation of what "beUniq" is or why a founder should care
- **Non-technical Founder** (R2): `sandbox_exec` documentation explicitly says "SIMULATED EXECUTION ONLY — no code actually runs" — this is deceptive if users think they're building real apps
- **Non-technical Founder** (R2): Error messages and tool failures will return developer-facing error codes with no user-friendly fallback or explanation layer
- **Non-technical Founder** (R2): No social media scheduling or content tools visible despite "social-autopilot" being listed as a recommended app for this persona
- **Growth Leader** (R2): The recommended persona apps (`social-autopilot`, `brand-command`, `content-hub`) are not exposed as MCP tools — they require an extra store-search hop just to find them, breaking the "here's what's relevant to you" promise
- **Growth Leader** (R2): No social publishing, scheduling, or monitoring tools in the MCP layer at all
- **Growth Leader** (R2): No CRM, pipeline, or revenue tracking integrations (HubSpot, Salesforce, etc.)
- **Growth Leader** (R2): `sandbox_exec` silently returns **simulated output only** — this is buried in the description and is a significant trust-breaking gotcha
- **Growth Leader** (R2): `billing_create_checkout` requires `success_url` and `cancel_url` as required fields, forcing me to have a redirect destination ready before I can even browse plans — cart before horse
- **Growth Leader** (R2): `career_*` tools are framed around individual job seekers, not hiring managers or team builders; no way to post roles, screen candidates at scale, or track pipeline
- **Growth Leader** (R2): `workspaces_update` marks both `name` and `slug` as required even for partial updates — can't rename without also re-slugging
- **Growth Leader** (R2): No team membership or role management beyond workspace owner — I can't invite colleagues or set permissions
- **Growth Leader** (R2): `auth_check_session` requires a session token as input, but there's no `auth_login` or `auth_signup` tool — where does the token come from?
- **Growth Leader** (R2): The swarm/orchestration categories are powerful but have no onboarding scaffolding — no example workflows, no "start here" tool
- **Growth Leader** (R2): `bootstrap_create_app` says "first-time setup" but requires a `codespace_id` as input — circular dependency for new users who have no codespace yet
- **Growth Leader** (R2): No webhook or event subscription tools — I can't react to external signals (new lead, social mention, form submission)
- **Growth Leader** (R2): No analytics or KPI dashboard tools; `tool_usage_stats` and `observability_*` track MCP calls, not business metrics
- **Growth Leader** (R2): Pricing tiers (`pro`, `business`) are named but their differences aren't retrievable without calling `billing_list_plans` separately — no inline context
- **Growth Leader** (R2): The CRDT, BFT, netsim, causality, and diff categories occupy roughly 30% of the tool surface area and are completely irrelevant to this persona segment
- **Growth Leader** (R2): No content calendar, brand asset management, or social listening functionality
- **Growth Leader** (R2): `tts_synthesize` returns base64 audio with no playback mechanism described — dead end for a non-developer
- **Growth Leader** (R2): Rate limits, quota usage, and credit consumption are not observable through any tool
- **Ops Leader** (R2): **No team/people management layer** — workspaces exist but there's no concept of team members, roles, assignments, or performance tracking beyond raw agent metadata
- **Ops Leader** (R2): **Recommended apps have no MCP surface** — ops-dashboard, brand-command, social-autopilot, content-hub are store apps only; I can install them but can't interact with their data via MCP tools
- **Ops Leader** (R2): **Academic tools dominate the catalog** — CRDT, netsim, causality, BFT consume ~25 tools with zero business ops value; they make the list feel misdirected for my persona
- **Ops Leader** (R2): **No calendar or scheduling integration** — reminders are one-shot; there's no recurrence, no calendar sync, no meeting scheduling automation
- **Ops Leader** (R2): **No native integrations visible** — no Slack, Google Workspace, Notion, Jira, HubSpot, or any common ops stack connector
- **Ops Leader** (R2): **`reactions` system is severely underdocumented** — the template variable syntax (`{{input.originalArg}}`) is mentioned only in the schema; a business user would abandon this without examples
- **Ops Leader** (R2): **Billing tools expose cancellation prominently** — `billing_cancel_subscription` is a top-level tool; accidental invocation risk feels high in automated workflows
- **Ops Leader** (R2): **No reporting or export to business formats** — `audit_export` exists but returns a "summary," not a downloadable CSV/PDF; no way to push data to a BI tool
- **Ops Leader** (R2): **Swarm and orchestrator overlap significantly** — both manage multi-agent task execution; the distinction between them is unclear and forces a premature architectural choice
- **Ops Leader** (R2): **`sandbox_exec` is explicitly simulated** — the description says "SIMULATED EXECUTION ONLY"; this is buried in the description text, not the tool name, which is actively misleading
- **Ops Leader** (R2): **No content scheduling tools** — social-autopilot is a recommended app but there are no MCP tools for scheduling posts, managing queues, or tracking content calendars
- **Ops Leader** (R2): **Permission model is opaque** — `capabilities_request_permissions` exists but there's no clear documentation of what's locked behind permissions or why
- **Ops Leader** (R2): **80+ tools with no grouping or progressive disclosure** — for a business user, this flat list is cognitively overwhelming; a tiered "starter set" would dramatically improve first-session success
- **Content Creator** (R2): **Core creative tools are missing**: image generation, page building, and music creation have zero MCP representation — the four "Recommended Apps" are not tools I can actually call
- **Content Creator** (R2): **Signal-to-noise ratio is catastrophic for a content creator**: 100+ tools, fewer than 5 are relevant to my use case
- **Content Creator** (R2): **TTS is the only audio tool** — no music generation, beat creation, audio mixing, or even audio file management
- **Content Creator** (R2): **`tts_synthesize` returns base64 audio with no file export pathway** — I can't save or share the output through the MCP layer alone
- **Content Creator** (R2): **Required fields that should be optional litter the schemas** — e.g., `session_token` required on `auth_check_session`, `slug` required on `workspaces_get` even when providing `workspace_id`
- **Content Creator** (R2): **`sandbox_exec` is explicitly "SIMULATED EXECUTION ONLY"** — buried in the description; this is a trust-breaking discovery for anyone who tries to use it seriously
- **Content Creator** (R2): **No image upload, generate, or edit tools** — despite `mcp-image-studio` existing in the codebase (visible in git status), it's not exposed here
- **Content Creator** (R2): **`create_classify_idea` returns a category slug, not a usable app** — the /create flow is opaque and doesn't tell me if the resulting app will have any creative capability
- **Content Creator** (R2): **Category taxonomy is invisible** — `store_browse_category` requires knowing category names in advance with no discovery mechanism
- **Content Creator** (R2): **`bootstrap_create_app` requires writing code** — a content creator cannot be expected to supply React/TS source to create an app
- **Content Creator** (R2): **No content scheduling, publishing, or distribution tools** — a creator's workflow extends beyond generation to publishing
- **Content Creator** (R2): **`dm_send` requires knowing a recipient email** — no user search or directory exists in the tool set
- **Content Creator** (R2): **BAZDMEG tools are cryptic and unexplained** — for a non-developer, terms like "superpowers gate" and "bugbook" are baffling
- **Content Creator** (R2): **No undo/history for creative work** — no versioning visible for anything produced through the MCP layer
- **Content Creator** (R2): **Persona-aware tool filtering doesn't exist** — the server exposes the same 100+ tools to a content creator as to a distributed systems engineer; role-based tool scoping would dramatically improve first-run experience
- **Hobbyist Creator** (R2): **Recommended apps have no MCP tools**: image-studio, music-creator, audio-studio, and page-builder are advertised for this persona but are entirely absent from the MCP tool surface
- **Hobbyist Creator** (R2): **TTS output is unusable**: `tts_synthesize` returns base64 audio with no playback, download, or file-write mechanism — a dead end for any creative use
- **Hobbyist Creator** (R2): **`sandbox_exec` is fake**: explicitly documented as "SIMULATED EXECUTION ONLY" — misleading for anyone trying to actually run or prototype creative code
- **Hobbyist Creator** (R2): **No image generation, manipulation, or upload tools** in the MCP layer despite image-studio being the top recommended app
- **Hobbyist Creator** (R2): **`storage_upload_batch` requires SHA-256 hashing**: not creator-friendly; assumes developer knowledge to do a pre-flight diff before uploading
- **Hobbyist Creator** (R2): **`bootstrap_create_app` requires writing code**: blocks non-technical creators from the app creation flow
- **Hobbyist Creator** (R2): **150+ tools, ~8 are relevant to this persona**: the cognitive load of scanning an irrelevant tool list is real friction
- **Hobbyist Creator** (R2): **No way to interact with installed store apps through MCP**: `store_app_install` records an install but exposes no tools for the app's actual functionality
- **Hobbyist Creator** (R2): **`byok_store_key` uses opaque jargon**: "BYOK" means nothing to a hobbyist creator; no inline explanation
- **Hobbyist Creator** (R2): **Career, BFT, CRDT, netsim, causality tools**: completely irrelevant to a creative persona — suggests no tool filtering or persona-aware tool scoping
- **Hobbyist Creator** (R2): **No canvas, drawing, MIDI, or audio waveform tools** anywhere in the list
- **Hobbyist Creator** (R2): **`create_classify_idea` classifies but doesn't create**: the name implies generation; it just categorizes and suggests a template, adding false hope
- **Hobbyist Creator** (R2): **Auth tools require a `session_token` as a *required* field**: poor DX if the platform is supposed to manage sessions automatically
- **Hobbyist Creator** (R2): **No undo/versioning for creative work**: no concept of creative history, save states, or version rollback for assets
- **Social Gamer** (R2): No multiplayer lobby or room system — can't create a "game room" for friends to join
- **Social Gamer** (R2): No friend list, friend request, or social graph tools whatsoever
- **Social Gamer** (R2): No real-time event/notification system — impossible to alert a friend "it's your turn"
- **Social Gamer** (R2): No matchmaking or queue system for finding opponents
- **Social Gamer** (R2): `session_*` tools are misleadingly named — they manage coding sessions, not game sessions
- **Social Gamer** (R2): `swarm_*` tools sound like multiplayer but are exclusively for AI agent coordination
- **Social Gamer** (R2): DM tools (`dm_send`, `dm_list`) are async-only — useless for real-time game coordination
- **Social Gamer** (R2): No group messaging — can't set up a party chat for a tabletop game with 4 people
- **Social Gamer** (R2): The chess-engine package exists in the platform codebase but is not exposed as any playable MCP tool
- **Social Gamer** (R2): No presence/online-status system — can't see if friends are currently online
- **Social Gamer** (R2): No spectator mode or game replay sharing tools
- **Social Gamer** (R2): No leaderboard, ranking, or achievement tools visible
- **Social Gamer** (R2): `store_app_personalized` is useless for a new user with no install history
- **Social Gamer** (R2): `crdt_*` tools could theoretically back multiplayer game state but require expert-level usage — no abstraction for game developers let alone players
- **Social Gamer** (R2): 160+ tools with ~5 relevant to my persona — severe signal-to-noise ratio problem
- **Social Gamer** (R2): No tournament bracket or scheduled match tools
- **Social Gamer** (R2): `store_app_install` doesn't clarify what "installing" means — does it launch the app? Open it in a browser? Nothing happens visibly through MCP
- **Social Gamer** (R2): No voice/video chat initiation tools for social gaming sessions
- **Social Gamer** (R2): `reminders_*` could work for "remind me when game night starts" but requires knowing ISO 8601 syntax — not user-friendly
- **Social Gamer** (R2): The recommended apps (chess-arena, tabletop-sim) may not actually exist in the store — no way to confirm without calling the API
- **Social Gamer** (R2): No way to share game results or scores to a feed/wall after a match
- **Solo Explorer** (R2): **Recommended apps not reachable**: image-studio, music-creator, and cleansweep don't exist as MCP tools — the platform promise and the tool surface don't match
- **Solo Explorer** (R2): **~170 tools, most irrelevant**: CRDT, BFT, netsim, causality, swarm, session, diff, testgen, sandbox — these are distributed systems / DevOps primitives that have no business being in a casual user's view
- **Solo Explorer** (R2): **Internal tooling leaking**: `plan_generate_batch_audit`, `audit_submit_evaluation`, `audit_compare_personas`, `store_app_deploy`, `store_app_add_variant`, `store_app_declare_winner` are clearly platform-internal admin tools exposed to end users
- **Solo Explorer** (R2): **Schema design is developer-hostile**: `workspaces_get` marks both `workspace_id` AND `slug` as required — that's an OR relationship forced into AND
- **Solo Explorer** (R2): **`sandbox_exec` is deceptive**: the description literally says "SIMULATED EXECUTION ONLY — no code actually runs" but it's presented as a real tool
- **Solo Explorer** (R2): **ISO 8601 required for reminders**: `reminders_create` expects a formatted date string with no mention of how to provide it — a casual user will just write "tomorrow"
- **Solo Explorer** (R2): **`bootstrap_create_app` requires `codespace_id`**: no explanation of what that is or how to get one
- **Solo Explorer** (R2): **No music tools**: music-creator is a recommended app with zero MCP surface area
- **Solo Explorer** (R2): **`bazdmeg_*` is opaque**: the category name means nothing to a new user; the tools (gate checks, superpowers) have no onboarding context
- **Solo Explorer** (R2): **`dm_send` with no user discovery**: I can message someone by email but there's no way to find other users
- **Solo Explorer** (R2): **`audit_query_logs` and `audit_export` conflict with `audit_*` persona category**: two different `audit` namespaces doing unrelated things
- **Solo Explorer** (R2): **No search or filter on the tool list itself**: at 170 tools there's no `capabilities_search` or category browsing from inside the MCP interface
- **Solo Explorer** (R2): **`store_skills_list` vs `skill_store_list`**: two nearly identical tools with different naming conventions suggest incomplete consolidation
- **Solo Explorer** (R2): **`reminders_complete` but no `reminders_delete` or `reminders_update`**: lifecycle is incomplete
- **Solo Explorer** (R2): **`tts_synthesize` returns base64 audio**: a casual user has no obvious way to play that without additional tooling not visible here
- **AI Indie** (R3): **`sandbox_exec` is explicitly fake** — description says "SIMULATED EXECUTION ONLY — no code actually runs." This is a trust-destroying deception for any developer.
- **AI Indie** (R3): **`chat_send_message` is non-streaming** — unusable as a foundation for building real-time AI UX.
- **AI Indie** (R3): **AI gateway has no generic "call model" tool** — `ai_list_models` enumerates providers but there's no `ai_call_model` to invoke them; only Claude via `chat_send_message`.
- **AI Indie** (R3): **BYOK limited to 3 providers** — Groq, Mistral, Together, Perplexity, and others common in indie stacks are absent.
- **AI Indie** (R3): **Three overlapping multi-agent systems** (`swarm_*`, `orchestrator_*`, `session_*`) with no guidance on which to use when — massive cognitive overhead.
- **AI Indie** (R3): **`auth_check_session` schema lists `session_token` as required but description says "Optional"** — schema/docs mismatch signals quality issues throughout.
- **AI Indie** (R3): **`bootstrap_create_app` requires `codespace_id` as a required field** in a tool described as "first-time setup" — chicken-and-egg: where does the ID come from first?
- **AI Indie** (R3): **No GitHub write operations** — `context_index_repo` can read a repo but there's no create-PR, push-commit, or comment-on-issue capability.
- **AI Indie** (R3): **No real deployment pipeline** — `storage_upload_batch` dumps files to R2 but there's no build→test→deploy chain visible.
- **AI Indie** (R3): **No vector/embedding tools** — zero RAG, semantic search, or embedding generation despite targeting AI builders.
- **AI Indie** (R3): **No webhook or event management** — can't wire external triggers (Stripe events, GitHub hooks, etc.) into agent workflows.
- **AI Indie** (R3): **`beuniq_*` and persona audit tools are exposed to end users** — these read as internal QA infrastructure accidentally surfaced in the public tool list.
- **AI Indie** (R3): **`crdt`, `netsim`, `causality`, `bft` categories** are specialized distributed systems simulations with no obvious path to production use — impressive demos, irrelevant to shipping product.
- **AI Indie** (R3): **`storage_manifest_diff` + `storage_upload_batch` require pre-computed SHA-256 hashes** — undocumented; no helper tool provided, forcing client-side implementation.
- **AI Indie** (R3): **`esbuild_transpile` `jsx_import_source` parameter has an empty description** in the schema — undiscoverable without external docs.
- **AI Indie** (R3): **No scheduled jobs beyond one-off reminders** — can't set up recurring agent tasks (e.g., nightly dependency checks).
- **AI Indie** (R3): **`observability_latency` reads from "daily rollup data"** — no sub-day resolution; useless for debugging a live incident.
- **AI Indie** (R3): **`store_app_personalized` exists but there's no explicit "track what I've installed and why" signal** — personalization feels hollow without clear feedback loops.
- **AI Indie** (R3): **80+ tools with no tiered onboarding path** — a new AI indie user has no signposted "start here" sequence; discoverability is purely trial-and-error.
- **Classic Indie** (R3): **`sandbox_exec` is explicitly fake** — the description reads "SIMULATED EXECUTION ONLY — no code actually runs." For a dev tool platform, this is a trust-breaker. Either ship real execution or remove the tool.
- **Classic Indie** (R3): **`bootstrap_create_app` requires `codespace_id` as input** — the description says "first-time setup" but expects me to already have a codespace ID. Classic chicken-and-egg; no bootstrapping tool should have this dependency.
- **Classic Indie** (R3): **`workspaces_get` marks both `workspace_id` AND `slug` as required** — you should be able to query by either, not both. This is a schema bug.
- **Classic Indie** (R3): **`auth_check_session` requires `session_token` as required input** — if I'm the authenticated user making the call, why do I provide my own token manually? Should be implicit.
- **Classic Indie** (R3): **No database tooling** — D1 is the stated backing store, but there's nothing here for schema migrations, direct queries, or data inspection.
- **Classic Indie** (R3): **No environment variable management for my apps** — `bootstrap_connect_integration` is the closest thing, but it's framed for third-party integrations, not app-level config.
- **Classic Indie** (R3): **No log tailing or live observability for my own app** — `observability_*` tools cover the MCP server's own health, not my deployed app's logs.
- **Classic Indie** (R3): **No domain/DNS management** — I can deploy an app but apparently can't point a custom domain at it via MCP.
- **Classic Indie** (R3): **No webhook registration or management tooling** — essential for payment processors, GitHub events, and most third-party services.
- **Classic Indie** (R3): **`beuniq_*` and `audit_submit_evaluation` / `plan_generate_batch_audit` tools are spike.land's internal QA tooling** — they have no business being exposed to external users via MCP. Adds ~10 tools of confusion.
- **Classic Indie** (R3): **Career tools (`career_assess_skills`, `career_get_jobs`, `career_interview_prep`, etc.)** — entirely irrelevant for a product-building persona. Dilutes the catalog significantly.
- **Classic Indie** (R3): **CRDT, BFT, netsim, causality categories (~25 tools)** — distributed systems simulation is academically interesting but has no place in an indie dev's shipping workflow. No scoping or filtering mechanism to hide these.
- **Classic Indie** (R3): **A/B testing flow (`store-ab`) is designed for spike.land's own store**, not for my apps' own experiments. Misleading category name.
- **Classic Indie** (R3): **`storage_manifest_diff` expects SHA-256 hashes as input** — no helper tool to compute them. Requires pre-processing outside the platform.
- **Classic Indie** (R3): **`create_check_health` defines "healthy" as "has real, non-default content"** — vague. What is default content? How do I know if my codespace passes?
- **Classic Indie** (R3): **Billing shows subscription tier but not usage/credits remaining** — as a pay-as-you-go user I need to know my burn rate, not just my plan name.
- **Classic Indie** (R3): **The swarm/orchestrator/session system implies multi-agent teams** — for a solo dev this adds a layer of concepts (plans, roles, sessions, subtasks, dispatching) that are overkill and never pay off.
- **Classic Indie** (R3): **No git integration** — `context_index_repo` can read a GitHub repo but there's no ability to commit, open PRs, or manage branches from within the platform.
- **Classic Indie** (R3): **`quiz_create_session` and `learnit_*` tools** — the learning content feels like a different product bolted on. I came to ship, not to read wiki articles and take quizzes.
- **Classic Indie** (R3): **Tool count (80+) with no categories surfaced to the user by default** — the raw list is cognitively overwhelming. Without filtering by persona or use case, a solo dev will spend time reading tool descriptions rather than building.
- **Agency Dev** (R3): **Category sprawl is unusable at scale** — 30+ categories with overlapping concerns (store vs store-search vs store-install vs store-ab) means I'd need a map to navigate this
- **Agency Dev** (R3): **Recommended apps (codespace, page-builder, qa-studio, brand-command) have zero corresponding MCP tools** — the platform's own marketing is disconnected from its API surface
- **Agency Dev** (R3): **`sandbox_exec` is explicitly fake** ("SIMULATED EXECUTION ONLY — no code actually runs") — this is buried in the description and a trap for anyone trying to use it seriously; should be removed or clearly labeled as a prototype stub
- **Agency Dev** (R3): **`bootstrap_create_app` requires a `codespace_id` but there's no `codespace_create` tool** — the flow is broken; you can't create an app without a codespace you apparently can't create via MCP
- **Agency Dev** (R3): **No git/GitHub integration tools** — agency devs live in PRs and branches; without repo tooling the platform can't integrate into a real client workflow
- **Agency Dev** (R3): **`context_index_repo` + `context_pack` pattern is manual and fragile** — requires two-step setup with no persistence across sessions; should be automatic
- **Agency Dev** (R3): **TTS tool (`tts_synthesize`) has no obvious agency/dev use case** — feels like feature stuffing
- **Agency Dev** (R3): **CRDT, netsim, causality, BFT categories are completely out of scope for the stated audience** — if these exist for educational purposes, they need their own product context, not buried alongside billing and storage
- **Agency Dev** (R3): **`chat_send_message` duplicates what the MCP host already does** — calling Claude through an MCP tool that calls Claude is a strange loop with unclear value
- **Agency Dev** (R3): **No client/project management primitives** — no way to namespace work by client, tag deliverables, or manage multiple concurrent projects
- **Agency Dev** (R3): **`billing_create_checkout` requires `success_url` and `cancel_url` as required fields** — an MCP tool calling Stripe checkout makes no sense without a browser context; this can't work in a pure MCP session
- **Agency Dev** (R3): **`audit_*` persona tools (ux_score, cta_compelling, etc.) are hardcoded to spike.land's own audit process** — exposed to all users but only useful internally; pollutes the namespace
- **Agency Dev** (R3): **Error messages and failure modes are completely undocumented** — no tool schema describes what errors to expect or how to recover
- **Agency Dev** (R3): **`swarm_*` and `session_*` categories overlap heavily** — both manage agents, messages, and tasks; unclear when to use which
- **Agency Dev** (R3): **`dm_send` requires knowing a user's email address** — in an agent-to-agent context this is a non-starter; agent IDs should be sufficient
- **In-house Dev** (R3): **`sandbox_exec` is fake** — "SIMULATED EXECUTION ONLY" buried in the description, not the tool name. This is misleading and blocks any real CI automation use case.
- **In-house Dev** (R3): **No actual code runner** — `esbuild_transpile` + `sandbox_exec` (fake) is the only pipeline. There's no way to actually execute the tests generated by `testgen_*`.
- **In-house Dev** (R3): **`testgen_*` output is disconnected** — generates test suites but there's no path to run, validate against a real test runner, or get coverage reports back.
- **In-house Dev** (R3): **Undocumented parameters** — `storage_manifest_diff` and `storage_upload_batch` both have `"description": ""` for their `files` parameter. I have no idea what schema `files` expects.
- **In-house Dev** (R3): **Overly aggressive `required` fields** — `agent_inbox_poll` marks `since` and `agent_id` as required even though both are clearly optional filters. Same pattern across many tools.
- **In-house Dev** (R3): **`workspaces_update` requires all fields** — must pass both `name` and `slug` even for a single-field update. No PATCH semantics.
- **In-house Dev** (R3): **`context_pack` scoring is too shallow** — "keyword matching + boosting src directories" won't give me useful file selection for a real monorepo with 25 packages.
- **In-house Dev** (R3): **No GitHub/VCS integration** — no tools for PR status, CI run results, issue tracking, or branch management. For an in-house dev this is table stakes.
- **In-house Dev** (R3): **No webhook or event-driven hooks** — can't trigger workflows when CI fails, deploy succeeds, etc. The `reactions` category exists but only reacts to internal tool events.
- **In-house Dev** (R3): **`chat_send_message` is non-streaming only** — blocks on long responses and gives no progress feedback. Unusable for complex tasks.
- **In-house Dev** (R3): **200+ tools with no grouping or discovery UX** — no way to say "show me ops tools" or "show me testing tools" from within the tool itself. `capabilities_check_permissions` helps slightly but not enough.
- **In-house Dev** (R3): **`store-ab` A/B testing infrastructure** — why is app store A/B variant tracking exposed as MCP tools to developers? This feels like internal platform plumbing leaked into the public API.
- **In-house Dev** (R3): **`bazdmeg_*` is opaque** — BAZDMEG is a proprietary methodology with no documentation accessible from the tools themselves. If I'm new, these tools are unusable.
- **In-house Dev** (R3): **Retro tools require a completed session ID** — `retro_analyze` only works post-session. No way to do mid-session health checks or course corrections.
- **In-house Dev** (R3): **`swarm_get_cost` reads usage from agent metadata** — self-reported cost data from agents is not trustworthy for billing or budgeting.
- **In-house Dev** (R3): **No rate limit or quota information** — `billing_status` shows tier but nothing about per-tool limits, which matters for ops use at scale.
- **In-house Dev** (R3): **`diff_*` tools are isolated from git** — operates on in-memory changesets with no git integration. Can't open a PR or apply a patch to an actual repo.
- **In-house Dev** (R3): **`tts_synthesize` returns base64 audio** — in a developer ops context this is useless without a way to play or store the output. Feels misplaced in this tool suite.
- **In-house Dev** (R3): **Audit logs retained only 90 days** — insufficient for compliance use cases (SOC2, ISO27001 typically require 1 year+).
- **In-house Dev** (R3): **`session_assign_role` requires knowing an `agent_id` upfront** — but agents are often ephemeral; this creates a chicken-and-egg dependency with `swarm_spawn_agent`.
- **ML Engineer** (R3): **`sandbox_exec` is explicitly fake** — documentation says "no code actually runs." This makes the entire sandbox category useless for ML pipeline validation or dependency testing.
- **ML Engineer** (R3): **No model registry** — nowhere to register, version, tag, or retrieve trained models.
- **ML Engineer** (R3): **No experiment tracking** — no concept of runs, metrics (loss, accuracy, AUC), hyperparameters, or artifact logging. MLflow/W&B equivalents entirely absent.
- **ML Engineer** (R3): **No data pipeline primitives** — no dataset versioning, no feature store, no ETL step definitions, no data validation hooks.
- **ML Engineer** (R3): **No compute/resource management** — no GPU allocation, no queue depth, no spot instance lifecycle, no memory/VRAM limits.
- **ML Engineer** (R3): **Orchestrator has no retry/backoff configuration** — production ML pipelines need fault tolerance; a subtask that fails due to OOM needs restart semantics, not just a status flag.
- **ML Engineer** (R3): **No streaming inference support** — `chat_send_message` is explicitly non-streaming, problematic for long-form generation or token-by-token monitoring.
- **ML Engineer** (R3): **`ai_list_models` likely returns only chat models** — no embeddings, no image/audio models, no indication of context lengths or rate limits per model.
- **ML Engineer** (R3): **Swarm cost tracking reads from metadata** — this implies cost is self-reported by agents, not metered by the platform. Untrustworthy for budget governance on multi-run sweeps.
- **ML Engineer** (R3): **No webhook or event-driven trigger mechanism** — ML pipelines need to react to external events (data landing in S3, model evaluation thresholds crossing). No hooks, no pub/sub.
- **ML Engineer** (R3): **Observability tools measure MCP tool calls, not user workloads** — `error_rate` and `observability_latency` track platform internals, not my model's p99 inference latency.
- **ML Engineer** (R3): **A/B testing (store-ab category) is for store app UI variants** — not applicable to ML model variant testing, despite the surface similarity.
- **ML Engineer** (R3): **180+ tools with no ML-specific category** — discoverability for my domain requires reading every tool description individually.
- **ML Engineer** (R3): **`session_dispatch_task` takes free-text context, not structured data** — no typed interface for passing model artifacts, checkpoint paths, or dataset references between agents.
- **ML Engineer** (R3): **No integration with common ML infra** — no Hugging Face, no S3/GCS artifact storage, no Kubernetes job submission, no Ray or Dask cluster management.
- **ML Engineer** (R3): **Billing is tier-based (pro/business), not compute-based** — for ML workloads that spike heavily during training and idle otherwise, this pricing model likely leads to either over-provisioning or throttling at the worst moments.
- **ML Engineer** (R3): **`context_index_repo` + `context_pack` are GitHub-only** — can't index private model repos, internal data repos, or non-GitHub SCM systems.
- **ML Engineer** (R3): **`retro_analyze` operates on session IDs** — retrospective tooling designed for coding sprints, not for comparing model performance across training runs.
- **AI Hobbyist** (R3): **`sandbox_exec` is fake and says so in its description** — this is the single biggest trust issue; a hobbyist building something on this abstraction will hit a wall and feel deceived
- **AI Hobbyist** (R3): **`auth_check_session` lists `session_token` as required** but the description says "Optional session token" — the schema and the description directly contradict each other
- **AI Hobbyist** (R3): **`workspaces_get` requires both `workspace_id` AND `slug`** but logically you only need one — either-or lookups shouldn't require both params
- **AI Hobbyist** (R3): **`billing_cancel_subscription` requires `confirm`** but the description says "When false (default), returns a preview" — if there's a default, it shouldn't be required
- **AI Hobbyist** (R3): **`agent_inbox_poll`, `agent_inbox_read`, `agent_inbox_respond`** all have required fields that have "Omit for..." semantics in their descriptions — required vs optional is inconsistently modeled across the entire schema
- **AI Hobbyist** (R3): **The career category** (salary lookups, resume builder, ESCO occupation matching) feels completely misaligned with a developer/AI-hobbyist platform — who is this for?
- **AI Hobbyist** (R3): **`bazdmeg_*` tools** are exposed publicly to all users — the methodology/gate-checking toolset seems like internal workflow tooling that leaked into the public MCP surface
- **AI Hobbyist** (R3): **`store_app_personalized` requires `limit`** but it has a stated default (8) — default-having required params are an antipattern throughout
- **AI Hobbyist** (R3): **No streaming** — `chat_send_message` explicitly says "non-streaming AI response"; for long completions this is a real usability gap
- **AI Hobbyist** (R3): **`tts_synthesize` returns base64 audio** — there's no tool to play it or save it; the output is stranded with no consumption path through MCP
- **AI Hobbyist** (R3): **`byok_store_key` accepts raw API keys as a string parameter** — key material in tool input logs is a security concern depending on how MCP call logs are stored
- **AI Hobbyist** (R3): **No versioning or changelog tools** — 80+ tools with no way to know what changed or when, making it hard to build reliably on top of this
- **AI Hobbyist** (R3): **`sandbox_*` tools create/read/write/destroy virtual filesystems** that don't persist and don't actually execute — the entire sandbox category is essentially a structured note-taking system dressed up as compute infrastructure
- **AI Hobbyist** (R3): **Tool count cognitive load** — 80+ tools with no grouping, recommended starting points, or "beginner path" makes initial orientation require significant effort even for technically experienced users
- **Enterprise DevOps** (R3): **`sandbox_exec` is explicitly fake** — "SIMULATED EXECUTION ONLY — no code actually runs." This is buried in the description, not surfaced prominently. Enterprise teams will invoke it expecting real execution. A deceptive API is worse than no API.
- **Enterprise DevOps** (R3): **No RBAC model** — `permissions_list_pending/respond` is a request/approval workflow, not role-based access control. No way to define team roles, restrict tool categories by team member, or enforce least-privilege.
- **Enterprise DevOps** (R3): **90-day audit log retention is hardcoded** — most enterprise compliance regimes (SOC 2, ISO 27001, HIPAA) require 1–3 years. No mention of export-to-SIEM or longer retention tier.
- **Enterprise DevOps** (R3): **No real-time log streaming** — `query_errors` is batch polling. No tail/stream endpoint for live incident response.
- **Enterprise DevOps** (R3): **No alerting or threshold configuration** — `error_rate` returns a number but there's no way to set thresholds or trigger notifications. PagerDuty/OpsGenie/Slack webhook integration absent.
- **Enterprise DevOps** (R3): **`swarm_get_cost` marks `agent_id` as required** but the description says "Omit for swarm-wide totals" — contradictory schema, will cause confusion in automation.
- **Enterprise DevOps** (R3): **`storage_list` marks `prefix`, `limit`, and `cursor` all as required** — pagination cursors can't be required on the first call. Broken API contract.
- **Enterprise DevOps** (R3): **`workspaces_update` requires both `name` AND `slug`** — can't update just one field. Forces clients to read-then-write for every update.
- **Enterprise DevOps** (R3): **No secrets rotation tooling** — `bootstrap_connect_integration` stores credentials but there's no mechanism to rotate, expire, or audit them post-storage.
- **Enterprise DevOps** (R3): **No webhook/event subscription** — impossible to react to platform events asynchronously. Everything requires polling (e.g., `agent_inbox_poll`).
- **Enterprise DevOps** (R3): **No blue-green or canary deployment tooling** — `store-ab` A/B testing only applies to store apps, not workloads or infrastructure.
- **Enterprise DevOps** (R3): **`bootstrap_workspace` `settings` param is an opaque string** — zero schema documentation. Completely unvalidatable by clients. No IDE hints, no schema reference.
- **Enterprise DevOps** (R3): **No Kubernetes, container, or infrastructure-as-code integration** — zero Terraform/Pulumi/Helm surface. Enterprise DevOps operates on infra, not just app code.
- **Enterprise DevOps** (R3): **No CI/CD trigger mechanism** — can't kick off a GitHub Actions workflow, Buildkite pipeline, or deployment from MCP. The orchestrator plans are internal only.
- **Enterprise DevOps** (R3): **`billing_cancel_subscription` is a destructive action accessible via MCP** — in an agentic context this could be triggered accidentally. No second-factor or out-of-band confirmation step.
- **Enterprise DevOps** (R3): **`dm_send` accepts any email address with no domain restriction** — a compromised agent could exfiltrate data or spam external addresses. No audit trail specified for DMs.
- **Enterprise DevOps** (R3): **No multi-region or data residency controls** — enterprise customers in EU/regulated markets need to know where data is stored. Completely absent from the surface area.
- **Enterprise DevOps** (R3): **Reaction system (`create_reaction`)** is non-deterministic for ops — "logged for invocation" phrasing is vague. Does it actually fire? Is there guaranteed delivery? No SLA documented.
- **Enterprise DevOps** (R3): **`chat_send_message` requires `model` and `system_prompt` as required fields** — forces every caller to re-specify model config rather than inheriting workspace defaults.
- **Enterprise DevOps** (R3): **The CRDT/BFT/netsim/causality tool categories** are educational simulations, not production distributed systems primitives. They clutter the namespace for an ops engineer looking for real tooling.
- **Enterprise DevOps** (R3): **No session quota or rate limit visibility** — how many concurrent swarm agents or orchestrator plans can I run? No tool to query limits.
- **Enterprise DevOps** (R3): **`retro_analyze` requires a closed session** — can't run incremental retrospectives on live sessions for course correction mid-incident.
- **Startup DevOps** (R3): `sandbox_exec` is labeled as "SIMULATED EXECUTION ONLY" — this is a major trust issue. A DevOps engineer who runs code in a "sandbox" expecting real output and gets synthetic results could make bad decisions. This needs a prominent warning or should be removed entirely
- **Startup DevOps** (R3): No webhook or alerting tools. I can query errors but can't wire up alerts to PagerDuty, Slack, or any on-call system. Observability without alerting is read-only archaeology
- **Startup DevOps** (R3): `storage_upload_batch` has no rollback tool. If a deploy corrupts assets, `storage_list` lets me see the damage but there's no `storage_rollback` or `storage_delete`
- **Startup DevOps** (R3): The `swarm_*` tools expose no authentication boundary. Can any agent message any other agent? The `swarm_broadcast` to ALL active agents is a blast-radius concern with no scope limiting
- **Startup DevOps** (R3): Secret/credential storage via `bootstrap_connect_integration` — no mention of encryption standard, rotation schedule, or access audit. "Encrypted vault" is vague marketing, not ops-grade assurance
- **Startup DevOps** (R3): `billing_create_checkout` requires hardcoded `success_url` and `cancel_url` as required fields — why is URL plumbing a caller concern for an MCP tool?
- **Startup DevOps** (R3): No environment promotion tools (dev → staging → prod). The deploy story is flat; there's no concept of staged rollouts or canary deployments
- **Startup DevOps** (R3): `capabilities_request_permissions` creates an approval request but there's no SLA or escalation path mentioned — approval could block indefinitely
- **Startup DevOps** (R3): The `create_reaction` tool (auto-trigger one tool when another fires) has no rate limiting or circuit breaker mentioned — a misconfigured reaction loop could hammer the API
- **Startup DevOps** (R3): No log streaming — `query_errors` is polling-only with no tail/stream capability. Incident response with polling is painful
- **Startup DevOps** (R3): `orchestrator_*` and `session_*` tools overlap heavily in purpose (both coordinate multi-step work) with no clear guidance on when to use which
- **Startup DevOps** (R3): Tool schema inconsistency: most required fields make sense, but `workspaces_get` requires BOTH `workspace_id` AND `slug` even though either alone should suffice — forces callers to have data they may not have
- **Startup DevOps** (R3): `dm_send` requires email address — I'd expect user ID or handle for internal messaging; email is a PII concern in tool logs
- **Startup DevOps** (R3): No infrastructure-as-code export. I can create workspaces/apps but can't dump the config as Terraform or YAML for gitops-style management
- **Startup DevOps** (R3): 180+ tools is genuinely too many to reason about. There's no tool discovery hierarchy or capability grouping beyond flat category names — cognitive overload is real
- **Technical Founder** (R3): **`sandbox_exec` is fake** — "SIMULATED EXECUTION ONLY" in the description is a dealbreaker buried where most users won't see it; this should fail loudly or not exist
- **Technical Founder** (R3): **`auth_check_session` marks `session_token` as required** but the description says "optional" — contradictory schema
- **Technical Founder** (R3): **`bootstrap_create_app` requires `codespace_id`** but there's no tool to create or list codespaces — circular dependency with no resolution path documented
- **Technical Founder** (R3): **Three overlapping agent systems**: `agents_*`, `swarm_*`, and `session_*` all appear to manage agents — no clear guidance on when to use which
- **Technical Founder** (R3): **`store_*` vs `create_*` vs `bootstrap_*`** — three different app creation/management flows with unclear boundaries; which one creates a real, live, user-facing app?
- **Technical Founder** (R3): **No social posting tools** despite "social-autopilot" being a recommended app for this persona — the app exists in the store but the underlying MCP tools are absent
- **Technical Founder** (R3): **No CRM, lead tracking, or customer analytics** — the core founder loop of acquire → convert → retain is unaddressed
- **Technical Founder** (R3): **`career_*` tools are completely off-persona** — salary lookups and resume builders have no place in a founder-focused product without a clear signal this is intentional
- **Technical Founder** (R3): **BAZDMEG tools are opaque** — `bazdmeg_superpowers_gate_check` and related tools are jargon-heavy with no discoverable documentation from within the tool descriptions themselves
- **Technical Founder** (R3): **`billing_create_checkout` requires `success_url` and `cancel_url` as required fields** — for an MCP client (not a browser), these are meaningless; the tool assumes a web context that doesn't apply
- **Technical Founder** (R3): **`store_app_rate` and wishlist tools** presuppose I'm a consumer, not a producer — no equivalent tools for tracking *my own* app's ratings or managing my published store listing
- **Technical Founder** (R3): **Reaction rules (`create_reaction`, `list_reactions`)** have no examples and no discoverable trigger vocabulary — what events actually fire? No enumeration provided
- **Technical Founder** (R3): **No webhook or push notification primitive** — the platform is entirely pull-based; I can't get notified when a swarm agent completes or a billing event occurs without polling
- **Technical Founder** (R3): **`tts_synthesize` returns base64 audio** — useful in theory but no guidance on what to do with it in an MCP context; no `tts_save` or delivery mechanism
- **Technical Founder** (R3): **Tool count is unsearchable from within the MCP itself** — there's `mcp_registry_search` for external servers but no `tool_search` for the 200 tools in this very server
- **Technical Founder** (R3): **`report_bug` exists but no `feature_request`** — feedback loop is asymmetric; bugs get tracked, product ideas don't
- **Non-technical Founder** (R3): The 200+ tool list is a cognitive catastrophe for a non-technical user — there is no filtering, grouping, or "beginner mode" visible at this layer
- **Non-technical Founder** (R3): The four recommended apps (`app-creator`, `page-builder`, `brand-command`, `social-autopilot`) have no direct MCP tool equivalents — it's unclear if they're store apps I install or tools I call directly
- **Non-technical Founder** (R3): `bootstrap_create_app` requires a `code` parameter — this breaks the no-code promise at the most critical onboarding step
- **Non-technical Founder** (R3): No clear authentication/login flow — `auth_check_session` requires a `session_token` but I don't know how I got one or where to find it
- **Non-technical Founder** (R3): At least 8 full categories (crdt, bft, netsim, causality, swarm, diff, testgen, retro) are completely irrelevant to my persona and create noise with no obvious way to hide them
- **Non-technical Founder** (R3): `billing_create_checkout` requires `success_url` and `cancel_url` — a non-technical founder doesn't know what URLs to put here without documentation
- **Non-technical Founder** (R3): No "create a landing page for my startup" end-to-end flow — I can see pieces (`esbuild_transpile`, `storage_upload_batch`) but assembling them requires engineering knowledge
- **Non-technical Founder** (R3): `storage_manifest_diff` and `storage_upload_batch` require SHA-256 hashes — completely inaccessible without tooling
- **Non-technical Founder** (R3): The `bazdmeg` category (FAQ, memory, gates) is jargon-heavy with no plain-language description of what BAZDMEG even is
- **Non-technical Founder** (R3): `tts_synthesize` returns base64 audio — where does it go? How do I play it? No guidance.
- **Non-technical Founder** (R3): No brand asset creation tools visible (logo, color palette, typography) despite brand being a core use case
- **Non-technical Founder** (R3): `workspaces_create` and `bootstrap_workspace` seem to do overlapping things — confusing which to call first
- **Non-technical Founder** (R3): The `beuniq` persona quiz is the only genuinely no-code-friendly flow, but it's buried with no discoverability signal
- **Non-technical Founder** (R3): Zero progressive disclosure — all 200+ tools arrive at once with no "start here" marker
- **Non-technical Founder** (R3): Missing: a simple "what can I build?" or "show me examples" discovery tool that speaks plain English about outcomes, not tool names
- **Growth Leader** (R3): The recommended apps (social-autopilot, brand-command, content-hub) have no corresponding MCP tools — this is misleading onboarding
- **Growth Leader** (R3): Zero social media tools: no posting, scheduling, engagement tracking, or platform analytics
- **Growth Leader** (R3): No brand monitoring: no mention tracking, sentiment analysis, competitor benchmarking
- **Growth Leader** (R3): No content pipeline tools: drafting, publishing, performance metrics, SEO insights
- **Growth Leader** (R3): No team/hiring tools despite "scaling teams" being a stated goal — `career_*` tools are for individual job seekers, not hiring managers
- **Growth Leader** (R3): `career_assess_skills` and `career_get_jobs` are backwards for this persona: I source talent, I don't apply for jobs
- **Growth Leader** (R3): The BFT, CRDT, netsim, and causality tool categories are expert distributed systems tooling with zero business growth relevance — they inflate the tool count without serving the persona
- **Growth Leader** (R3): `blog_list_posts` and `blog_get_post` are read-only — no publish, draft, or schedule capability
- **Growth Leader** (R3): No revenue metrics, funnel analytics, or conversion tracking
- **Growth Leader** (R3): `store_app_personalized` still shows recommendations based on install history I don't have — cold start problem never addressed
- **Growth Leader** (R3): `tts_synthesize` is interesting for content creation but requires you to already have the text and a voice ID — no discovery flow
- **Growth Leader** (R3): The A/B testing tools (`store_app_*` under store-ab) are for app code deployments, not marketing campaigns — naming causes confusion
- **Growth Leader** (R3): `audit_*` tools under the persona category appear to be internal QA tooling exposed to end users — this shouldn't be user-facing
- **Growth Leader** (R3): `bazdmeg_*` tools are a methodology enforcement system that means nothing to an external user with no context on what BAZDMEG is
- **Growth Leader** (R3): No export or reporting tools: I can't pull a weekly growth summary or share findings with my team
- **Growth Leader** (R3): The tool namespace is completely flat — 200+ tools with no grouping UX makes discovery painful without knowing what to search for
- **Growth Leader** (R3): `dm_send` requires knowing a recipient's email address — no directory or team roster to look up collaborators
- **Ops Leader** (R3): **Recommended apps have zero MCP backing** — `ops-dashboard`, `brand-command`, `social-autopilot`, `content-hub` are the persona's four recommended apps, yet none appear as MCP tool categories. This is a trust-breaking disconnect.
- **Ops Leader** (R3): **No team/member management** — `workspaces_*` lets me create workspaces but there's no `workspace_invite_member`, `workspace_list_members`, or role assignment outside the session context. Ops leaders manage people, not just namespaces.
- **Ops Leader** (R3): **No KPI or metrics definition tools** — I can query tool usage stats but I can't define, track, or alert on business metrics (e.g., content published per week, team task completion rate).
- **Ops Leader** (R3): **No scheduling or recurring automation** — `reminders_create` is one-shot. There's no cron-style tool, no recurring workflow trigger. The `loop` skill exists in Claude Code but nothing at the MCP level for ops scheduling.
- **Ops Leader** (R3): **`sandbox_exec` is fake** — explicitly labeled "SIMULATED EXECUTION ONLY." This is buried in the description and a serious credibility issue if discovered mid-workflow.
- **Ops Leader** (R3): **~40% of tools are irrelevant to any business user** — CRDT, BFT, netsim, causality, diff/merge, testgen tools belong in a developer/distributed-systems product, not in an ops leader's tool palette. No filtering or persona-based tool scoping.
- **Ops Leader** (R3): **No content or social workflow tools** — no scheduling posts, no content calendar, no brand asset management, no approval workflows. `social-autopilot` and `content-hub` are persona recommendations with nothing behind them.
- **Ops Leader** (R3): **`audit_export` lacks granularity** — export is just a date-range summary, not exportable CSV/JSON for real compliance or BI tooling.
- **Ops Leader** (R3): **Reactions system is too low-level for non-developers** — `create_reaction` requires knowing exact tool names, event types, and JSON template variables. There's no guided "if this, then that" flow.
- **Ops Leader** (R3): **No integration connectors** — no Slack, Google Workspace, Notion, Jira, HubSpot, or any common ops tool integration via MCP. `bootstrap_connect_integration` exists but it's just a credential vault with no enumeration of what integrations actually exist.
- **Ops Leader** (R3): **Billing tools are incomplete** — I can see billing status and create checkouts, but there's no invoice history, no seat/usage breakdown by team member, and no budget alerting.
- **Ops Leader** (R3): **`workspaces_update` requires both `name` and `slug` as required fields** — even for a partial update. Bad API design that will cause friction.
- **Ops Leader** (R3): **No dashboard query or visualization tools** — even read-only access to aggregate ops data (tasks completed, content throughput, team activity) is absent from the MCP layer.
- **Ops Leader** (R3): **Tool count creates decision paralysis** — 160+ tools with no grouping beyond flat category labels, no "quick start" or recommended path for my persona. Discovery is entirely self-directed.
- **Content Creator** (R3): **Critical persona-tool mismatch**: image-studio, page-builder, music-creator, and audio-studio are recommended apps but have **no corresponding MCP tools** — the entire creative layer is missing from the API surface
- **Content Creator** (R3): **TTS is the only media tool** and it caps at 5,000 characters with no streaming, no format selection, no download URL — you get base64 back with no clear path to publishing or embedding it
- **Content Creator** (R3): `sandbox_exec` is documented as "SIMULATED EXECUTION ONLY — no code actually runs" — this is buried in the description and would mislead any user who tries to prototype creative code
- **Content Creator** (R3): `auth_check_session` marks `session_token` as **required** in the schema but the description says "Optional session token" — schema contradicts docs
- **Content Creator** (R3): `workspaces_get` requires **both** `workspace_id` and `slug` as required fields, but they're clearly alternatives — you'd only have one or the other
- **Content Creator** (R3): `billing_cancel_subscription` requires `confirm` as a required field — destructive action gated only by a string param, not a real confirmation flow; easy to trigger by accident
- **Content Creator** (R3): No way to **retrieve or view generated content** — if an app produces an image or audio file, there's no `storage_get` or media retrieval tool, only `storage_list` and upload tools
- **Content Creator** (R3): `store_app_personalized` returns recommendations based on install history, but there's no `store_app_history` or `store_app_installed_list` equivalent — asymmetric read access
- **Content Creator** (R3): `bootstrap_create_app` requires raw code — a content creator with no dev background cannot use this tool at all
- **Content Creator** (R3): 40+ tools across CRDT, netsim, BFT, causality, and diff categories are completely irrelevant to this persona and create significant cognitive overhead when exploring
- **Content Creator** (R3): No content scheduling, publishing, or distribution tools — a content creator needs to publish, not just generate
- **Content Creator** (R3): `esbuild_transpile` and related tools are exposed to all users including non-developers — no persona-based tool filtering
- **Content Creator** (R3): `bazdmeg_*` tools (FAQ, memory, gate checks) appear to be internal methodology tooling leaked into the public-facing MCP surface — confusing for end users
- **Content Creator** (R3): No image upload, album management, or asset organization at the MCP layer despite `mcp-image-studio` being listed as a package in the platform
- **Content Creator** (R3): Rate limits, quotas, and usage caps are completely undocumented across all tools — a creator generating many assets would hit limits blindly
- **Hobbyist Creator** (R3): **Critical gap**: image-studio, music-creator, audio-studio, and page-builder are recommended to this persona but have zero MCP tool coverage — this is false advertising at the platform level
- **Hobbyist Creator** (R3): **`sandbox_exec` is fake**: the description literally says "SIMULATED EXECUTION ONLY — no code actually runs" — this is a trap for any user who invokes it expecting real behavior; should be removed or renamed
- **Hobbyist Creator** (R3): **`bootstrap_create_app` requires code**: a hobbyist creator cannot provide `code` and `codespace_id`; no template flow, no guided creation
- **Hobbyist Creator** (R3): **Required fields that shouldn't be**: `storage_list` marks `prefix`, `limit`, and `cursor` as required but they're clearly optional filter params; same pattern appears across many tools (e.g., `reminders_list` requires `status`, `agents_list` requires `limit`) — bad schema design
- **Hobbyist Creator** (R3): **`auth_check_session` requires `session_token`** as a required field — but the description says "Optional session token"; the schema contradicts the docs
- **Hobbyist Creator** (R3): **No creative entry point**: no tool says "start here if you want to make art/music/content" — onboarding is undefined for this persona
- **Hobbyist Creator** (R3): **TTS output is base64 audio with no playback path**: what do I do with it? No storage, no sharing, no integration described
- **Hobbyist Creator** (R3): **160+ tools with no persona filtering**: a creator sees the same tool wall as a distributed systems engineer; overwhelming and alienating
- **Hobbyist Creator** (R3): **`create_classify_idea` returns a category/template suggestion, not a live app**: the distinction between "classify" and "create" is unclear and the resulting workflow is opaque
- **Hobbyist Creator** (R3): **`beuniq_start` persona quiz exists but has no apparent influence on tool recommendations**: I could complete the quiz and still see the same tool list
- **Hobbyist Creator** (R3): **No way to save or share creative work** through MCP: no file export, no gallery, no sharing link generation
- **Hobbyist Creator** (R3): **Store app ratings/wishlist exist but no install feedback loop**: I can wishlist image-studio but there's no MCP tool that actually invokes it
- **Hobbyist Creator** (R3): **`report_bug` severity field is unvalidated in schema**: no enum provided — what values are valid?
- **Hobbyist Creator** (R3): **Cognitive load from distributed systems tools**: CRDT, BFT, netsim, causality are impressive but collectively they drown out everything else; needs namespacing or a creator-mode filtered view
- **Social Gamer** (R3): **No multiplayer primitives whatsoever** — no lobbies, matchmaking, game rooms, player presence, or turn-based state management exposed through MCP
- **Social Gamer** (R3): **No presence/online status** — `dm_send` lets me message a user by email, but I can't see if my friends are online or what they're playing
- **Social Gamer** (R3): **`store_app_install` is a dead end** — installing an app records it in a database but gives me no way to *launch*, *open*, or *interact* with it via MCP; the app is just... installed somewhere
- **Social Gamer** (R3): **`agents_send_message` is not a substitute for a friend system** — agents are AI agents, not human friends; conflating the two is confusing for a social gamer
- **Social Gamer** (R3): **No friend/contact list** — `dm_send` requires an email address; there's no concept of a friends list, username lookup, or social graph
- **Social Gamer** (R3): **`chat_send_message` is AI-only** — the only "chat" tool routes to Claude, not to other humans on the platform
- **Social Gamer** (R3): **Store category browsing is shallow** — `store_browse_category` exists but I don't know if "games" or "social" is a valid category without trial and error
- **Social Gamer** (R3): **`create_search_apps` vs `store_search`** — two overlapping search tools with unclear distinction; confusing to know which to use
- **Social Gamer** (R3): **Recommended apps (chess-arena, tabletop-sim, etc.) may not even exist** — there's no confirmation these slugs are real, published store apps; round 3 and I still can't verify this without calling tools
- **Social Gamer** (R3): **No game invite flow** — even if chess-arena exists and I install it, I have no MCP-level way to invite a friend to a specific game session
- **Social Gamer** (R3): **`swarm_*` tools are a red herring** — the swarm system is for AI agent coordination, but the naming ("agents", "messages", "delegate task") might mislead a non-technical user into thinking it's for coordinating with friends
- **Social Gamer** (R3): **No notifications or real-time events** — I can poll `dm_list` for messages but there's no push notification or event stream; async multiplayer would be painful
- **Social Gamer** (R3): **`reminders_create`** is the closest thing to "schedule a game night" — that's a pretty thin offering for social coordination
- **Social Gamer** (R3): **80+ tools but zero gaming-specific ones** — the MCP surface is enormous but has a complete blind spot for the platform's own recommended use case of social gaming
- **Social Gamer** (R3): **No way to share a game state or session link** — `display-wall` is recommended but there's no MCP tool for pushing content to a shared display or creating a watch-together experience
- **Solo Explorer** (R3): **Recommended apps don't exist as tools**: `cleansweep`, `image-studio`, and `music-creator` were my recommended starting points but have zero corresponding MCP tools exposed — this is a broken onboarding promise
- **Solo Explorer** (R3): **~60% of tools are developer infrastructure**: CRDT, BFT, netsim, causality, diff, testgen, retro, session, orchestrator, swarm — none of these have casual user value and they dominate the list
- **Solo Explorer** (R3): **No creative tools whatsoever**: Can't generate music, can't do image editing, can't write or compose anything creative through MCP
- **Solo Explorer** (R3): **`tts_synthesize` exists but there's no corresponding input tool**: I can convert text to speech but there's no way to record voice, transcribe audio, or create audio content
- **Solo Explorer** (R3): **`reminders` is anemic**: No recurring reminders, no categories, no priorities, no snooze — just create/list/complete
- **Solo Explorer** (R3): **`cleansweep` is entirely missing**: Listed as a recommended app, zero tools present
- **Solo Explorer** (R3): **`chat_send_message` requires knowing a model ID**: A casual user doesn't know what `claude-sonnet-4-6` is; there's no model discovery flow
- **Solo Explorer** (R3): **`billing_create_checkout` requires caller-supplied redirect URLs**: A non-developer won't know what to put for `success_url` and `cancel_url`
- **Solo Explorer** (R3): **`bootstrap_create_app` requires a `codespace_id`**: Where does a casual user get this? No tool to create a codespace is exposed
- **Solo Explorer** (R3): **`store_app_personalized` requires install history**: New users get nothing useful from this until they've already installed things — no cold-start fallback
- **Solo Explorer** (R3): **`bazdmeg_*` tools are exposed to end users**: These appear to be internal methodology/QA tooling — a casual user seeing "BAZDMEG superpowers gate check" has no mental model for this
- **Solo Explorer** (R3): **`sandbox_exec` is explicitly simulated but isn't labeled as such in the tool name**: The description says "SIMULATED EXECUTION ONLY" — this is deceptive if a user actually tries to run code expecting real output
- **Solo Explorer** (R3): **No "help" or "getting started" tool**: 80+ tools, no guided entry point for a first-time user
- **Solo Explorer** (R3): **`auth_check_session` requires a `session_token` as required field**: But if I'm already authenticated via MCP, why do I need to supply my own token? This is confusing UX
- **Solo Explorer** (R3): **`store_wishlist_*` tools exist but there's no `store_wishlist_list` that returns details**: `store_wishlist_get` exists but the naming is inconsistent with the other `_list` naming convention
- **Solo Explorer** (R3): **Observability tools (tool_usage_stats, error_rate, query_errors) are end-user-facing**: These feel like internal monitoring leaked into the public API surface
- **Solo Explorer** (R3): **No logout or session management tool**: I can check my session but can't end it through MCP
- **AI Indie** (R4): **`sandbox_exec` is simulated** — this is buried in the description, not surfaced prominently; any workflow built on it will silently fail when real execution is expected
- **AI Indie** (R4): **All schema parameters typed as `"type":"string"`** even for booleans (`confirm: "true"`), integers (`limit: "10"`), and arrays — no runtime type safety, error messages will be cryptic
- **AI Indie** (R4): **Required fields that conflict with "optional" semantics**: `workspaces_get` requires both `workspace_id` AND `slug` but you'd only ever have one
- **AI Indie** (R4): **Three overlapping coordination systems** (orchestrator, session, swarm) with no decision guide — which do I use for a 3-agent pipeline?
- **AI Indie** (R4): **Internal audit tooling exposed publicly** (`plan_generate_batch_audit`, `audit_submit_evaluation`) — these appear to be the tools used to run this exact evaluation, leaked into the user-facing API
- **AI Indie** (R4): **`beuniq_*` and persona audit tools** feel like a separate product accidentally published to the wrong namespace
- **AI Indie** (R4): **Career tools** (`career_create_resume`, `career_get_salary`, `career_get_jobs`) have no relevance to the stated platform purpose for this persona
- **AI Indie** (R4): **`storage_manifest_diff` requires SHA-256 hashes pre-computed client-side** — shifts complexity to the caller, no guidance on how to compute them
- **AI Indie** (R4): **`bootstrap_create_app` requires a `codespace_id`** as a required field with no tool to create a codespace independently first — circular dependency
- **AI Indie** (R4): **`chat_send_message`** duplicates what any LLM client already does; unclear why this exists inside an MCP server
- **AI Indie** (R4): **`tts_synthesize` returns base64 audio** — no streaming, 5000 char limit, no playback mechanism; the output format is a dead end for most use cases
- **AI Indie** (R4): **Observability tools (`tool_usage_stats`, `error_rate`, `query_errors`) expose platform-wide data** — unclear if this is scoped to my usage or global, which is a privacy/security concern
- **AI Indie** (R4): **No git integration** — for an indie dev building and shipping, the absence of any git tooling is a significant gap
- **AI Indie** (R4): **No database provisioning tools** — I can deploy workers but can't create D1 databases or KV namespaces via MCP
- **AI Indie** (R4): **80+ tools with no grouping hierarchy or progressive disclosure** — discovery requires reading all descriptions linearly; there's no "getting started" subset
- **Classic Indie** (R4): **`sandbox_exec` is fake** — "SIMULATED EXECUTION ONLY" is a critical deception; calling it a sandbox implies real execution
- **Classic Indie** (R4): **No customer payment tools** — `billing_*` only handles subscriptions *to spike.land*, not payments for the indie dev's own product (the most important missing feature for "idea to launch")
- **Classic Indie** (R4): **No customer auth** — `auth_*` tools only validate spike.land sessions; there's no way to add auth to my own app's users
- **Classic Indie** (R4): **No database/persistence for app data** — `storage_*` is R2 asset storage for files, not relational or document data for user records
- **Classic Indie** (R4): **No domain management** — No way to connect a custom domain to a deployed app
- **Classic Indie** (R4): **No email infrastructure** — `dm_send` is platform user-to-user messaging; no transactional email (welcome emails, password resets, receipts) for my app's customers
- **Classic Indie** (R4): **No environment variable management for deployed apps** — `bootstrap_connect_integration` stores credentials for platform integrations, not app-level env vars
- **Classic Indie** (R4): **Unclear deployment story** — After `bootstrap_create_app`, where does the app live? What URL? Is it on spike.land's domain or can I use my own?
- **Classic Indie** (R4): **~40% of tools are irrelevant to this persona** — crdt, netsim, bft, causality, career, beuniq, quiz, persona audit tools add cognitive overhead with zero value for indie dev use case
- **Classic Indie** (R4): **`store_ab` A/B testing tools are complex without context** — No documentation on what a "deployment" is vs. a "codespace" vs. an "app" — terminology is inconsistent
- **Classic Indie** (R4): **`swarm_*` tools are overwhelming and unexplained** — 12 tools for multi-agent orchestration with no entry point or rationale for why a solo dev needs this
- **Classic Indie** (R4): **`audit_*` tools appear to be internal spike.land tooling** exposed publicly — `audit_submit_evaluation` with persona scoring fields has no business being visible to an indie developer
- **Classic Indie** (R4): **`bazdmeg_*` tools lack any onboarding context** — The FAQ and memory tools reference an internal methodology with no explanation; completely opaque to an outsider
- **Classic Indie** (R4): **Tool count (80+) creates decision paralysis** — No progressive disclosure, no "start here" grouping, no differentiation between core and advanced tools
- **Classic Indie** (R4): **`reminders_*` are basic CRUD with no integration** — Reminders that exist only inside spike.land MCP, disconnected from any external calendar or notification system, feel vestigial
- **Classic Indie** (R4): **`create_classify_idea` returns a slug/category but not a live app** — The distinction between `/create` flow and `bootstrap_create_app` is confusing and undocumented in the tool descriptions themselves
- **Agency Dev** (R4): `sandbox_exec` is labeled "SIMULATED EXECUTION ONLY" — this must be a first-class warning, not a buried description line; agency devs will ship unvalidated code
- **Agency Dev** (R4): `bootstrap_create_app` requires `codespace_id` but there is no `codespace_create`, `codespace_list`, or `codespace_get` tool — the core onboarding flow is broken
- **Agency Dev** (R4): Recommended apps (`page-builder`, `brand-command`, `codespace`, `qa-studio`) have zero MCP tool coverage — the persona promise is not kept
- **Agency Dev** (R4): Schema type hygiene is broken: `billing_cancel_subscription.confirm` is typed as `"string"` not `"boolean"`; same for `dm_list.unreadOnly`, `bootstrap_connect_integration` booleans, etc. — clients will pass `"true"` and wonder why it silently fails
- **Agency Dev** (R4): `workspaces_get` marks both `workspace_id` AND `slug` as required — you'd only ever have one; this is a schema bug
- **Agency Dev** (R4): No per-client workspace billing isolation — I can't have Client A on pro and Client B on free in separate workspaces
- **Agency Dev** (R4): No codespace management tools at all — a major gap for the agency workflow
- **Agency Dev** (R4): `create_classify_idea` vs `bootstrap_create_app` — two different app creation flows with no clear guidance on which to use when
- **Agency Dev** (R4): The distinction between "create apps," "store apps," and "bootstrap apps" is never explained and uses overlapping terminology
- **Agency Dev** (R4): `dm_send` requires the recipient's email address but there is no user directory or lookup tool — sending DMs to collaborators is practically unusable
- **Agency Dev** (R4): ~100+ tools (CRDT, netsim, causality, BFT, career/ESCO, beUniq) are entirely irrelevant to agency work and pollute discovery
- **Agency Dev** (R4): No Git integration — agency devs deliver code to repos; there's no way to push output anywhere
- **Agency Dev** (R4): No custom domain or CDN configuration in the storage tools — `storage_upload_batch` to R2 is useless without knowing how it maps to a client-facing URL
- **Agency Dev** (R4): `swarm_*` and `session_*` tools duplicate orchestration concepts from `orchestrator_*` with no clear guidance on when to use which
- **Agency Dev** (R4): Tool naming is inconsistent: some use verb-first (`store_search`), some noun-first (`workspaces_list`), some are flat (`report_bug`) — makes autocomplete unreliable
- **Agency Dev** (R4): No webhook or event subscription mechanism — agency integrations (Stripe, GitHub, Slack) need inbound events, not just outbound calls
- **Agency Dev** (R4): `retro_analyze` depends on a `session_id` but sessions require complex setup — the retro feature is gated behind a heavyweight prerequisite chain
- **Agency Dev** (R4): `capabilities_request_permissions` exists but there's no documentation of what the default permission set is — I don't know what I can't do until I hit a wall
- **Agency Dev** (R4): `observability_*` tools return platform-level metrics but no per-project or per-client filtering — useless for multi-tenant agency billing justification
- **Agency Dev** (R4): No rate limit or quota visibility tools — I can't forecast costs or protect a client from runaway API spend
- **In-house Dev** (R4): **`sandbox_exec` is fake** — "SIMULATED EXECUTION ONLY" buried in the description; this should be a first-class warning or the tool should be removed, not presented alongside real tools
- **In-house Dev** (R4): **No `testrun_*` tools** — can generate tests but not execute them; the loop is incomplete and useless without execution
- **In-house Dev** (R4): **observability tools appear to cover only spike.land MCP itself**, not my application — `tool_usage_stats` tracks MCP call counts, not my service's metrics
- **In-house Dev** (R4): **`context_index_repo` requires a GitHub URL** — private/enterprise GitHub repos and internal monorepos are unaddressed
- **In-house Dev** (R4): **`diff_create` / `diff_apply` operate on in-memory file contents** — completely disconnected from git; no way to commit, push, or PR from results
- **In-house Dev** (R4): **`swarm_spawn_agent` registers a record but gives no clarity on what runtime the agent uses** or where it actually executes
- **In-house Dev** (R4): **`session_create` / `session_dispatch_task` workflows are state-tracking only** — no evidence real compute is dispatched
- **In-house Dev** (R4): **`billing_cancel_subscription` is exposed as a plain MCP tool** — a destructive billing action callable from any agent context is a serious authorization risk
- **In-house Dev** (R4): **`auth_check_session` lists `session_token` as `required`** — if I'm already authenticated, why do I need to supply my own token?
- **In-house Dev** (R4): **No CI/CD integration** — no tools to trigger builds, check pipeline status, view test results from existing CI
- **In-house Dev** (R4): **No webhook or event subscription mechanism** — all tools are pull-based; no way to react to real-time system events
- **In-house Dev** (R4): **`store_app_deploy` + A/B variant tools** feel like internal spike.land admin plumbing exposed as public API — confusing for in-house devs with no store apps
- **In-house Dev** (R4): **Career tools (ESCO, salary, resume, job matching)** and **TTS, quiz/learn, beUniq, persona audit** tools are completely off-persona and inflate the list by ~30 irrelevant entries
- **In-house Dev** (R4): **`create_reaction` template syntax (`{{input.originalArg}}`)** is undocumented anywhere in the schema — no reference implementation or examples
- **In-house Dev** (R4): **No rate limit information** on any tool — I could silently get throttled mid-workflow with no indication of quotas
- **In-house Dev** (R4): **`retro_analyze` is scoped only to spike.land sessions** — no way to feed in my own project retrospective data
- **In-house Dev** (R4): **`bazdmeg_superpowers_gate_check`** requires a sessionId but there's no guidance on where that session ID comes from unless you already use the BAZDMEG methodology internally
- **In-house Dev** (R4): **Tool count (~200) with no priority tiers or "start here" grouping** — onboarding friction is high; a developer needs a "core 10" fast path
- **ML Engineer** (R4): **`sandbox_exec` is fake** — explicitly documented as "SIMULATED EXECUTION ONLY." This is the single most important tool for an ML engineer and it doesn't work. No workaround is offered.
- **ML Engineer** (R4): **No Python runtime** — esbuild only handles JS/TS. Every ML pipeline, data transform, and model eval script is Python.
- **ML Engineer** (R4): **No experiment tracking** — no MLflow, W&B, or even a lightweight run/metric logging primitive.
- **ML Engineer** (R4): **No model registry** — nowhere to version, tag, or promote models between staging and production.
- **ML Engineer** (R4): **Orchestrator is dev-task shaped, not ML-DAG shaped** — no support for data-conditional branching, partial retries, or resource-aware scheduling (GPU vs CPU).
- **ML Engineer** (R4): **Observability tracks MCP calls, not model inference** — `tool_usage_stats` and `error_rate` tell me about MCP overhead, not p99 inference latency or token throughput.
- **ML Engineer** (R4): **`byok_*` only supports Anthropic, OpenAI, Google** — no self-hosted/Ollama/vLLM endpoint support. Most production ML shops run their own serving infrastructure.
- **ML Engineer** (R4): **No feature store or dataset versioning** — `storage_*` is an R2 file store with SHA diffing, not a data versioning system.
- **ML Engineer** (R4): **No streaming or async job handles** — long-running training jobs need a poll/callback pattern; the orchestrator appears synchronous.
- **ML Engineer** (R4): **Schema smell: nearly every tool marks all params as `required`** — `storage_list` requires `prefix`, `limit`, and `cursor` even though these are obviously optional filters. This is a systematic schema bug that will cause integration friction.
- **ML Engineer** (R4): **No webhook/event ingestion** — can't trigger pipelines from upstream data arrival events.
- **ML Engineer** (R4): **Swarm agents are opaque** — `swarm_spawn_agent` takes a `machine_id` but there's no documentation on what constitutes a valid agent, how compute is provisioned, or how to attach a real worker process.
- **ML Engineer** (R4): **No secrets scoping** — `bootstrap_connect_integration` stores credentials but there's no indication of access control between workspaces or agents.
- **ML Engineer** (R4): **`chat_send_message` is non-streaming** — for long reasoning tasks or code generation, non-streaming responses will feel sluggish and there's no workaround.
- **ML Engineer** (R4): **Half the tool catalog is irrelevant to my persona** — beUniq, career, TTS, CRDT, causality, BFT, netsim, blog, learnit occupy significant API surface with zero ML utility. Navigation and discovery suffer as a result.
- **ML Engineer** (R4): **No data quality or drift monitoring primitives** — critical for production ML and completely absent.
- **ML Engineer** (R4): **`audit_*` tools conflict with `persona` category** — `audit_query_logs` (infra audit) and `audit_submit_evaluation` (persona UX audit) share a category name but are unrelated tools. Namespace collision.
- **AI Hobbyist** (R4): **`sandbox_exec` is fake** — the description literally says "SIMULATED EXECUTION ONLY — no code actually runs." This is the most damaging gap for a hobbyist who wants to experiment. It should either be real or removed entirely, not a stub with a warning buried in the description.
- **AI Hobbyist** (R4): **Four overlapping agent systems** — `agents_*`, `swarm_*`, `session_*`, and `orchestrator_*` all coordinate agents/tasks with no clear guidance on when to use which. This is the single biggest architectural confusion.
- **AI Hobbyist** (R4): **Career tools have no coherent relationship to the rest of the platform** — `career_get_salary`, `career_get_jobs`, `career_interview_prep` feel like a randomly bolted-on product; no AI hobbyist use case connects them to codespace/MCP/distributed systems tools.
- **AI Hobbyist** (R4): **Internal admin tools exposed publicly** — `beuniq_*`, `plan_generate_batch_audit`, `audit_submit_evaluation`, `audit_compare_personas` appear to be spike.land's own internal persona audit workflow, not a user-facing feature.
- **AI Hobbyist** (R4): **Required fields that should be optional** — many tools require params that have documented defaults (e.g., `reminders_list` requires `status`, `store_search` requires `category` and `limit`, `agents_list` requires `limit`). Required fields with defaults are a schema contradiction.
- **AI Hobbyist** (R4): **Five separate `store_*` subcategories** (store, store-install, store-search, store-skills, store-ab) with overlapping concerns — `skill_store_*` and `store_skills_*` both exist and do similar things.
- **AI Hobbyist** (R4): **`chat_send_message` is redundant** — if I'm already in an MCP session talking to Claude, why do I need a tool to send a message to Claude? It suggests this was built for a different runtime context but was never scoped out.
- **AI Hobbyist** (R4): **`bazdmeg_*` tools are opaque to outsiders** — the BAZDMEG methodology is internal jargon; the FAQ, memory, and gate-check tools make no sense without prior context.
- **AI Hobbyist** (R4): **`tts_synthesize` returns base64 audio** — returning raw base64 through an MCP tool is impractical; there's no obvious way to play or save it from an agent context.
- **AI Hobbyist** (R4): **`create_check_health` requires a `codespace_id` but there's no tool to list codespaces** — you can't discover valid IDs from within the MCP surface alone.
- **AI Hobbyist** (R4): **No rate limit or quota visibility** — with 160+ tools and a billing tier system, I have no way to know which tools cost credits, how many I have, or when I'm about to hit a limit.
- **AI Hobbyist** (R4): **`mcp_registry_install` returns a `.mcp.json` entry but nowhere to put it** — the install step has no follow-through; you get config text with no apply mechanism.
- **AI Hobbyist** (R4): **Observability tools (`tool_usage_stats`, `error_rate`, `observability_health`) require no auth context** — it's unclear if these show my stats, the platform's global stats, or something else.
- **AI Hobbyist** (R4): **`dm_send` requires an email address** — as a hobbyist I don't know other users' emails; this tool is nearly unusable for organic discovery.
- **AI Hobbyist** (R4): **No versioning or changelog for the MCP tools themselves** — the store has versions for apps but there's no equivalent for the MCP tool registry; I can't tell what changed between sessions.
- **Enterprise DevOps** (R4): **`sandbox_exec` is fake** — the description literally says "no code actually runs" and returns "synthetic stdout/stderr." This is a critical misrepresentation for any ops or QA workflow expecting real execution.
- **Enterprise DevOps** (R4): **No RBAC or team-level scoping** — there is no concept of org-level roles, team membership, or resource isolation. A single workspace owner model doesn't scale to enterprise teams.
- **Enterprise DevOps** (R4): **No SSO/SAML support visible** — `auth_check_session` accepts a session token but there is no mention of OAuth2 flows, SAML, or service account provisioning, which are non-negotiable for enterprise IAM.
- **Enterprise DevOps** (R4): **Audit log retention capped at 90 days** — many compliance frameworks (SOC2, ISO 27001, HIPAA) require 1–7 years. This is a hard blocker for regulated industries.
- **Enterprise DevOps** (R4): **Swarm agents have no resource limits** — no CPU/memory quotas, no rate limits per agent, no cost caps visible. `swarm_get_cost` reads from metadata, meaning cost tracking is voluntary, not enforced.
- **Enterprise DevOps** (R4): **No secret rotation tooling** — `bootstrap_connect_integration` stores credentials but there is no rotation schedule, expiry enforcement, or integration with external vaults (HashiCorp Vault, AWS Secrets Manager).
- **Enterprise DevOps** (R4): **Storage has no environment separation** — no staging vs. production namespacing; `storage_list` mentions "rollback inspection" but there is no actual `storage_rollback` tool.
- **Enterprise DevOps** (R4): **Observability is surface-level** — call counts and error rates with no distributed tracing, no span/trace correlation IDs, no P99 latency breakdowns, no anomaly detection.
- **Enterprise DevOps** (R4): **Testgen tools generate code but there is no test runner** — `testgen_from_spec` and `testgen_from_code` produce test suites with no mechanism to execute them or feed results back.
- **Enterprise DevOps** (R4): **No CI/CD integration hooks** — no webhook support, no git event triggers, no pipeline status callbacks. The orchestrator is an island.
- **Enterprise DevOps** (R4): **CRDT/netsim/causality/BFT categories are simulations, not production primitives** — their presence alongside real ops tooling is confusing and misleading at enterprise evaluation time.
- **Enterprise DevOps** (R4): **`billing_cancel_subscription` marks `confirm` as required** despite the description saying it defaults to preview behavior — schema and behavior are inconsistent.
- **Enterprise DevOps** (R4): **No incident management or alerting integration** — no Slack/Teams webhooks, no PagerDuty routing, no on-call escalation. `dm_send` (email DM) is not a substitute.
- **Enterprise DevOps** (R4): **Swarm replay (`swarm_replay`) with no integrity guarantees** — message history can apparently be read step-by-step but there is no mention of tamper-evidence or cryptographic log integrity.
- **Enterprise DevOps** (R4): **Session metrics (`session_get_metrics`) with no SLO baseline** — metrics are returned but there is no way to define or alert on SLO thresholds within the platform.
- **Enterprise DevOps** (R4): **No concept of change freeze windows or deployment gates** — essential for enterprise change management processes (CAB approvals, maintenance windows).
- **Enterprise DevOps** (R4): **`capabilities_request_permissions` creates an "approval request for the user"** — in enterprise, approvals need to route through an access review workflow, not a single user inbox.
- **Enterprise DevOps** (R4): **No workspace-level audit isolation** — `audit_query_logs` appears to be per-user, not per-workspace/org, making cross-team compliance reporting impractical.
- **Enterprise DevOps** (R4): **BYOK key storage with no key usage logging** — `byok_list_keys` shows dates but there is no per-key usage audit trail, which is required for key accountability.
- **Startup DevOps** (R4): `sandbox_exec` is explicitly fake ("no code actually runs") — this is a fundamental trust violation; if this is labeled as an execution tool, it should execute code
- **Startup DevOps** (R4): Observability only covers MCP layer, not actual infrastructure — CPU, memory, latency of user-deployed services are invisible
- **Startup DevOps** (R4): No real CI/CD primitives — no webhook triggers, no pipeline status, no deployment gates
- **Startup DevOps** (R4): No container or Kubernetes integration whatsoever
- **Startup DevOps** (R4): `workspaces_get` marks both `workspace_id` AND `slug` as required — but they're alternatives, not complements; schema is wrong
- **Startup DevOps** (R4): `bootstrap_create_app` exists but there's no `destroy_app` or teardown equivalent — creates a one-way door
- **Startup DevOps** (R4): No secrets rotation — `bootstrap_connect_integration` stores credentials but there's no update/rotate endpoint
- **Startup DevOps** (R4): The swarm tools look like compute orchestration but appear to be a messaging/status database, not actual agent compute
- **Startup DevOps** (R4): ~30 distributed systems simulation tools (CRDT, BFT, netsim) pollute the namespace for anyone not doing academic CS research
- **Startup DevOps** (R4): `storage_list` requires `prefix`, `limit`, and `cursor` as required fields — cursor should be optional for initial listing
- **Startup DevOps** (R4): No alerting integrations (PagerDuty, OpsGenie, Slack webhook) — a DevOps tool without alerting is incomplete
- **Startup DevOps** (R4): No rollback mechanism — you can upload files but can't roll back to a previous deploy
- **Startup DevOps** (R4): Tool count (80+) creates discoverability friction without a categorized help tool or capability index
- **Startup DevOps** (R4): `billing_create_checkout` requires both `success_url` and `cancel_url` as required — description says these default to spike.land pages, so they shouldn't be required
- **Startup DevOps** (R4): No environment promotion workflow (dev → staging → prod) — critical for "move fast without breaking things"
- **Startup DevOps** (R4): `chat_send_message` feels out of place here — it's an AI chat passthrough in an ops toolkit
- **Startup DevOps** (R4): The recommended apps for this persona (ops-dashboard, codespace, qa-studio) aren't surfaceable through any MCP tool — can't even check if they're installed
- **Startup DevOps** (R4): Error codes in `report_bug` are optional but the field is listed as required in the schema (`"required":["title","description","severity","reproduction_steps","error_code"]`) — inconsistency between description and schema
- **Technical Founder** (R4): **`sandbox_exec` is explicitly labeled "SIMULATED EXECUTION ONLY"** — the description says no code actually runs and it returns synthetic output. This is a fake tool in a production API and should either be removed or clearly gated as a prototype
- **Technical Founder** (R4): **Recommended apps (`brand-command`, `social-autopilot`, etc.) have no corresponding MCP tools** — the persona targeting creates a false promise
- **Technical Founder** (R4): **No social/marketing primitives** — a founder trying to market has no tools here for scheduling posts, drafting copy, or managing campaigns
- **Technical Founder** (R4): **`workspaces_get` marks both `workspace_id` AND `slug` as required** — you realistically have one or the other; this schema is wrong and likely causes unnecessary errors
- **Technical Founder** (R4): **`workspaces_update` requires `workspace_id`, `name`, AND `slug` all as required** — partial updates (rename only) should be possible
- **Technical Founder** (R4): **`storage_list` marks `prefix`, `limit`, and `cursor` as required** — these are pagination/filter params that should be optional
- **Technical Founder** (R4): **CRDT, BFT, netsim, causality tools** — Byzantine fault tolerance and Lamport clock simulations are distributed systems pedagogy, not founder tools; their presence dilutes the catalog
- **Technical Founder** (R4): **Career tools (resume builder, job matching, interview prep)** — completely irrelevant to a founder; signals the platform hasn't segmented its tool surface by persona
- **Technical Founder** (R4): **`beuniq_*` persona quiz and `bazdmeg_*` FAQ/memory tools** — appear to be internal spike.land tooling exposed publicly with no documentation context
- **Technical Founder** (R4): **Auth is circular** — `auth_check_session` requires a `session_token` as required input, but there's no `auth_login` or token-acquisition tool; unclear how a new user bootstraps
- **Technical Founder** (R4): **`bootstrap_create_app` requires `codespace_id`** — no tool in the set creates or lists codespaces; this is a dangling dependency with no resolution path
- **Technical Founder** (R4): **observability tools (`tool_usage_stats`, `error_rate`, `query_errors`) show my own MCP call data** — useful for platform debugging but not for monitoring MY apps built on the platform
- **Technical Founder** (R4): **No webhooks or outbound integration tools** — can't connect to Stripe, GitHub, Slack, or other founder-critical services
- **Technical Founder** (R4): **`dm_send` requires knowing the recipient's email** — no user discovery mechanism, so this is only useful if you already know who you're messaging
- **Technical Founder** (R4): **The swarm/session/orchestrator cluster has 40+ tools** — powerful in theory but has no opinionated "here's how to start" entry point; cognitive overhead is high
- **Technical Founder** (R4): **No analytics for apps I publish** — I can see MCP tool usage stats but not user engagement with my own created apps
- **Technical Founder** (R4): **A/B test tools (`store-ab`) are sophisticated but gated by needing a `codespace_id`** — same blocking dependency as app creation
- **Non-technical Founder** (R4): **Recommended apps (app-creator, page-builder, brand-command, social-autopilot) don't exist as MCP tools** — the onboarding promise is immediately broken
- **Non-technical Founder** (R4): **No "start here" or guided onboarding tool** — there's no `getting_started` or `tour` tool; I'm dropped into 80+ options with no map
- **Non-technical Founder** (R4): **`bootstrap_create_app` requires me to write `code`** — a required field in a tool marketed to non-technical founders is disqualifying
- **Non-technical Founder** (R4): **`sandbox_exec` is labeled "SIMULATED EXECUTION ONLY"** — so it doesn't actually run code? Why would I use it? This actively builds mistrust
- **Non-technical Founder** (R4): **No page builder tool** — my core use case (build pages) has no direct tool; the closest thing is coding-related
- **Non-technical Founder** (R4): **No brand or design tooling** — brand-command is a recommended app but there's no brand/logo/color/font tool in the entire list
- **Non-technical Founder** (R4): **`social-autopilot` is missing entirely** — I can't post, schedule, or manage social media through this interface
- **Non-technical Founder** (R4): **`esbuild_transpile` is a required tool for many flows** — transpiling JavaScript is not a concept a non-technical founder should ever encounter
- **Non-technical Founder** (R4): **Category names are developer-jargon** (`crdt`, `bft`, `causality`, `netsim`, `diff`) — no way to guess what these do
- **Non-technical Founder** (R4): **`storage_manifest_diff` requires SHA-256 hashes** — a required field that's completely inaccessible without technical knowledge
- **Non-technical Founder** (R4): **`chat_send_message` exists but model is a required field** — I don't know which Claude model to pick or why it matters
- **Non-technical Founder** (R4): **`tts_synthesize` returns base64-encoded audio** — how do I play that? No download, no player, no next step
- **Non-technical Founder** (R4): **`beuniq_start` persona quiz seems interesting but the result doesn't connect to app recommendations** — dead end for a non-technical user
- **Non-technical Founder** (R4): **No "undo" or "delete my app" tool** — if `bootstrap_create_app` goes wrong, there's no recovery path visible
- **Non-technical Founder** (R4): **Billing checkout requires `success_url` and `cancel_url`** — I don't have URLs to provide; this is a developer-facing flow
- **Non-technical Founder** (R4): **No template gallery** — I can't browse pre-built page or app templates before committing to building something
- **Non-technical Founder** (R4): **`create_classify_idea` sounds useful but returns a "category + template suggestion, not a live app"** — the outcome is vague and doesn't tell me what to do next
- **Non-technical Founder** (R4): **80+ tools with no grouping or progressive disclosure** — the cognitive load is high enough to cause immediate abandonment
- **Growth Leader** (R4): Recommended apps (social-autopilot, brand-command, content-hub, career-navigator) have zero direct MCP tool representation — the store is a catalog, not an interface
- **Growth Leader** (R4): No social media scheduling, monitoring, or publishing tools whatsoever
- **Growth Leader** (R4): No revenue or pipeline analytics — `billing_status` is platform billing, not business KPIs
- **Growth Leader** (R4): No CRM or lead management integration
- **Growth Leader** (R4): No brand monitoring or sentiment analysis tools
- **Growth Leader** (R4): Career tools address individual job seekers, not growth leaders hiring and scaling teams
- **Growth Leader** (R4): CRDT, netsim, causality, BFT tools are deeply technical distributed systems simulations with no plausible growth use case — why are these surfaced to a business persona?
- **Growth Leader** (R4): `chat_send_message` is a raw Claude API call with no growth-specific context injection or memory
- **Growth Leader** (R4): `store_search` requires knowing the right search terms; no category browse for "marketing" or "growth" is explicitly listed
- **Growth Leader** (R4): Tool count (80+) creates cognitive overload; no persona-filtered view is offered at the MCP level
- **Growth Leader** (R4): `swarm_*` and `orchestrator_*` tools require understanding agent architecture before they're useful — steep onboarding cost
- **Growth Leader** (R4): `bootstrap_create_app` requires writing code — not accessible to a non-technical growth leader
- **Growth Leader** (R4): No webhook or automation triggers visible (e.g., post content when X event happens)
- **Growth Leader** (R4): `reminders_create` is a basic task tool; there's no project or campaign management layer above it
- **Growth Leader** (R4): The `beuniq_start` persona quiz could be genuinely useful for growth research but it's buried with no discoverability path from a growth context
- **Growth Leader** (R4): No direct message broadcast or team communication tools — `dm_send` is one-to-one only
- **Growth Leader** (R4): Audit tools (`audit_submit_evaluation`) look powerful for UX research but have no documentation path explaining how to initiate a batch from scratch
- **Growth Leader** (R4): Error rate and observability tools are platform-internal; no equivalent for tracking *my* content or campaign performance
- **Ops Leader** (R4): **Recommended apps (ops-dashboard, brand-command, etc.) have no direct MCP tools** — the MCP layer and the app layer feel disconnected; I can install apps but can't drive them programmatically
- **Ops Leader** (R4): **No team/people management tools** — I can't add team members, assign tasks to humans, set permissions for my staff, or see who on my team did what
- **Ops Leader** (R4): **No KPI or metrics tracking primitive** — the observability tools are MCP-internal (tool call counts), not business metrics (revenue, tickets closed, SLA breaches)
- **Ops Leader** (R4): **Reminders are personal, not shared** — no way to assign a reminder or task to another team member
- **Ops Leader** (R4): **No approval workflow or sign-off mechanism** — critical for ops; I need to route things for human approval, not just agent approval
- **Ops Leader** (R4): **`permissions_respond` and `permissions_list_pending`** appear to be agent-permission tools, not business approval flows — naming is confusing
- **Ops Leader** (R4): **Swarm/orchestrator tools have no cost guardrails exposed** — `swarm_get_cost` exists but there's no way to set a budget cap or get alerted when cost exceeds a threshold
- **Ops Leader** (R4): **`chat_send_message` model field is required but undocumented** — what are valid model values? No enum, no default shown
- **Ops Leader** (R4): **`bootstrap_create_app` requires a `codespace_id` as required field** — where does this come from? There's no `create_codespace` tool visible, creating a dead-end dependency
- **Ops Leader** (R4): **`store_app_install` vs `skill_store_install` vs `store_skills_install`** — three separate install verbs for overlapping concepts; confusing taxonomy
- **Ops Leader** (R4): **No webhook or event subscription primitive** — I can create reactions between tools, but I can't subscribe to external business events (new Slack message, Jira ticket, email received)
- **Ops Leader** (R4): **`sandbox_exec` is explicitly simulated** — documented as fake execution; this is buried in the description and a trust-breaking discovery
- **Ops Leader** (R4): **No search within audit logs** — `audit_query_logs` filters by action/resource_type but no full-text search; finding "what happened with Project X" is impossible
- **Ops Leader** (R4): **TTS tool returns base64 audio with no playback mechanism** — useful in a browser context, useless in an agent/MCP context without additional infrastructure
- **Ops Leader** (R4): **`dm_send` requires knowing someone's email address** — no directory lookup, no way to message by name or role
- **Ops Leader** (R4): **Round 4 observation: the tool count (80+) creates analysis paralysis** — for an ops leader, a curated "ops starter pack" of 10 tools would be far more actionable than this full catalog dump
- **Content Creator** (R4): **Core creative tools missing as MCP tools**: image-studio, page-builder, music-creator, audio-studio are listed as "recommended apps" but provide no MCP interface — the MCP layer is useless for my primary use cases
- **Content Creator** (R4): **TTS is not an audio studio**: `tts_synthesize` returns base64-encoded audio with no mixing, trimming, effects, export format control, or project management
- **Content Creator** (R4): **No image generation or editing tools at all**: not even a basic prompt-to-image call
- **Content Creator** (R4): **No page building tools**: can't create or edit landing pages, blog posts, or web content through MCP
- **Content Creator** (R4): **Blog tools are read-only**: `blog_list_posts` and `blog_get_post` exist but there's no `blog_create_post` or `blog_update_post`
- **Content Creator** (R4): **180+ tools with no creator-specific category**: no "creative" or "media" category to filter by — I'm forced to scroll past distributed systems infrastructure
- **Content Creator** (R4): **CRDT, BFT, netsim, causality tools have zero creator relevance** and dominate the list numerically
- **Content Creator** (R4): **`chat_send_message` requires knowing model IDs**: exposing `claude-sonnet-4-6` etc. to non-developers is poor UX
- **Content Creator** (R4): **`bootstrap_create_app` requires writing code**: the `code` parameter is required — this is a developer tool masquerading as a creator tool
- **Content Creator** (R4): **No asset management for creative output**: `storage_upload_batch` exists but requires SHA-256 hashes and manifest diffs — not creator-friendly
- **Content Creator** (R4): **No collaboration or audience engagement tools**: no comments, no subscriber management, no content scheduling
- **Content Creator** (R4): **No social media publishing hooks**: can't push content to any distribution channel
- **Content Creator** (R4): **`store_wishlist_add` with no direct install path to creative tools**: wishlist implies I want something I can't yet access — frustrating with no ETA or unlock path
- **Content Creator** (R4): **`create_classify_idea` returns a category slug, not a usable artifact**: the output is abstract metadata, not a started creative project
- **Content Creator** (R4): **No undo/version history for creative work**: if I create something, there's no way to iterate back
- **Content Creator** (R4): **TTS voice IDs are opaque**: `tts_list_voices` presumably returns IDs but with no audio preview through MCP — I'm buying blind
- **Content Creator** (R4): **`esbuild_transpile` and `build_from_github` in this list**: transpiling TypeScript is noise for a content creator; inclusion signals poor audience segmentation
- **Content Creator** (R4): **`sandbox_exec` is explicitly fake**: the description says "SIMULATED EXECUTION ONLY — no code actually runs" — this is a deceptive tool that shouldn't be surfaced to users without a large warning
- **Content Creator** (R4): **Permission system unclear**: `capabilities_request_permissions` exists — does unlocking categories reveal the missing creative tools? No documentation or hint
- **Content Creator** (R4): **`dm_send` requires knowing the recipient's email**: no user directory or handle lookup, making it nearly useless for connecting with collaborators
- **Hobbyist Creator** (R4): **The recommended creative apps (image-studio, music-creator, audio-studio, page-builder) have zero corresponding MCP tools** — they exist as web apps I apparently have to open in a browser, defeating the purpose of an MCP interface
- **Hobbyist Creator** (R4): **`sandbox_exec` is fraudulent** — its own description says "SIMULATED EXECUTION ONLY — no code actually runs." That's buried in the description text, not surfaced as a warning. A creator following happy-path instructions would be confused why nothing works
- **Hobbyist Creator** (R4): **`create_*` tools are about coding apps, not creating content** — the naming is a trap; `create_classify_idea` classifies a *code app* idea, not a creative project idea
- **Hobbyist Creator** (R4): **80+ tools with no categorized onboarding or progressive disclosure** — a flat list is unusable at this scale for a non-technical user
- **Hobbyist Creator** (R4): **Many required fields that should be optional** — `storage_list` requires `prefix`, `limit`, and `cursor` even for a basic listing; `reminders_create` requires `due_date` even if you just want a note
- **Hobbyist Creator** (R4): **No image generation, editing, or upload tools directly in MCP** — the mcp-image-studio package exists in the codebase (visible in git status) but isn't registered here
- **Hobbyist Creator** (R4): **No audio or music tools at all** — not even a placeholder
- **Hobbyist Creator** (R4): **TTS has a 5000 character limit with no chunking tool** — a creator narrating long-form content hits this silently
- **Hobbyist Creator** (R4): **`billing_cancel_subscription` is in the same flat list as creative tools** — dangerous destructive action with no visual separation from benign tools
- **Hobbyist Creator** (R4): **`store_app_personalized` and `store_recommendations_get` overlap confusingly** — unclear which to call first or how they differ in practice
- **Hobbyist Creator** (R4): **No way to save, export, or publish creative output through MCP** — even if I generated audio via TTS, there's no `storage_upload` for personal files without navigating the R2 manifest/diff flow (a 3-step developer process)
- **Hobbyist Creator** (R4): **`beuniq_*` persona quiz tools are exposed at the same level as functional tools** — feels like internal testing infrastructure leaked into the public API
- **Hobbyist Creator** (R4): **The career tools category is entirely irrelevant** — salary lookup, resume builder, and interview prep have nothing to do with hobbyist creating
- **Social Gamer** (R4): **No game-specific MCP tools** — chess-arena and tabletop-sim are recommended apps but have zero MCP API surface; I can't query game state, join a match, or invite friends via MCP at all
- **Social Gamer** (R4): **No friend/contacts system** — `dm_send` requires knowing someone's email address; there's no way to find friends on the platform or see who's online
- **Social Gamer** (R4): **No presence or lobby tools** — I can't see which friends are currently in a chess game or looking for a tabletop partner
- **Social Gamer** (R4): **No multiplayer matchmaking** — nothing in the tool list helps me find opponents or form a game group
- **Social Gamer** (R4): **Store search discoverability is weak** — `store_search` is the only way in; no browsing by "games" category explicitly shown, and `store_browse_category` requires knowing exact category names upfront
- **Social Gamer** (R4): **`store_app_install` success doesn't tell me how to launch** — installing an app returns a slug/status, but there's no `app_launch` or `get_play_url` tool
- **Social Gamer** (R4): **`display-wall` and `music-creator` have no MCP control surface** — I can't push content to a display wall or control music playback via these tools
- **Social Gamer** (R4): **Overwhelming tool count for a non-technical user** — 180+ tools with no grouping, onboarding, or "start here" guidance; hostile to casual users
- **Social Gamer** (R4): **`auth_check_session` requires a session token as input** — shouldn't this be implicit/automatic? Feels like an implementation detail leaking into the UX
- **Social Gamer** (R4): **No notifications or game invites** — `reminders_create` is the closest thing but it's a personal todo tool, not a social notification system
- **Social Gamer** (R4): **`store_app_reviews`** — limited to 10 reviews by default and requires knowing the slug; no way to browse "most discussed" apps
- **Social Gamer** (R4): **TTS tool (`tts_synthesize`) — interesting but feels random** — no context for why a gamer would use text-to-speech from an MCP tool rather than just… playing a game
- **Social Gamer** (R4): **No session-sharing or co-op URL generation** — if I want to invite a friend to a chess game, there's no tool to generate/share an invite link
- **Social Gamer** (R4): **Round 4 meta-concern: no improvement signals** — after 4 rounds of testing, the gaming persona's core needs (matchmaking, game state, social graph) remain entirely unaddressed by the MCP layer; the platform may be iterating on developer tooling while the social/gaming use case stagnates
- **Solo Explorer** (R4): The recommended apps (image-studio, music-creator, cleansweep) have **zero corresponding MCP tools** — the surface doesn't deliver on the persona's promise
- **Solo Explorer** (R4): 150+ tools with no grouping or filtering for user type creates severe cognitive overload; a casual user should see ~20 tools max
- **Solo Explorer** (R4): **Admin tools are exposed**: `skill_store_admin_create`, `skill_store_admin_update`, `skill_store_admin_delete` should never be visible to a general user
- **Solo Explorer** (R4): `crdt_*`, `netsim_*`, `causality_*`, `bft_*` are distributed systems academic tools with zero relevance to personal use — their presence is bewildering and undermines trust in the platform's focus
- **Solo Explorer** (R4): `bazdmeg_*` category is completely unexplained — the name means nothing to an outsider and the tools (faq_list, memory_search, superpowers_gate_check) feel internal/meta
- **Solo Explorer** (R4): **Onboarding path is unclear**: Should I start with `bootstrap_workspace`, `workspaces_create`, or `beuniq_start`? Three different starting points with no obvious winner
- **Solo Explorer** (R4): `store_app_deploy`, `store_app_add_variant`, `store_app_assign_visitor`, `store_app_record_impression` — A/B testing infrastructure exposed to end users, not relevant and confusing
- **Solo Explorer** (R4): Duplicate discovery surfaces: `create_search_apps`, `store_search`, `learnit_search_topics` all search for apps/content — unclear which to use when
- **Solo Explorer** (R4): `dm_send` lets me message users by email but there's no way to find other users or see who's on the platform — isolated feature
- **Solo Explorer** (R4): `audit_submit_evaluation`, `plan_generate_persona_audit`, `plan_generate_batch_audit` appear to be internal QA tooling leaked into the public API
- **Solo Explorer** (R4): `sandbox_exec` honestly admits "SIMULATED EXECUTION ONLY — no code actually runs" in its description — this breaks trust if you're a developer, and is meaningless noise if you're not
- **Solo Explorer** (R4): No tools for the actual creative work: image generation, music creation, or personal journaling/habit tracking that a "casual life organizer" would expect
- **Solo Explorer** (R4): `swarm_*` (spawn/stop/redirect agents, broadcast messages) is a complex multi-agent orchestration layer with no casual use case — 12 tools just for this
- **Solo Explorer** (R4): `billing_cancel_subscription` with a `confirm` parameter defaulting to false is a reasonable safety pattern, but why is cancellation so prominent in the tool list while upgrade/trial flows are buried?
- **Solo Explorer** (R4): `context_index_repo` and `build_from_github` require GitHub URLs — no guidance on what counts as a valid repo or what this feature is actually for in a personal context
- **Solo Explorer** (R4): No way to search tools by category from within the MCP surface itself — discovery relies entirely on reading a wall of text

## Individual Persona Reports

# Persona: AI Hobbyist (Round 1)

## Reaction

Honestly, my first reaction is a mix of genuine excitement and mild vertigo. The breadth here is impressive — distributed systems simulators (CRDT, netsim, causality, BFT), an orchestrator, swarm agents, quiz/learning tools, a real app store, esbuild transpilation, even TTS. For someone who loves poking at AI primitives and seeing how systems behave, this is a candy store.

But 80+ tools with no clear entry point or guided "start here" path makes it hard to know where to land. The recommended apps (ai-orchestrator, codespace, app-creator, state-machine) aren't surfaced as tools — they're app store slugs, so I'd need to know to call `store_app_detail` first. That's a discoverability gap.

The most exciting clusters for me are: `crdt_*`, `causality_*`, `bft_*`, `netsim_*` (interactive distributed systems theory), `orchestrator_*` + `swarm_*` (multi-agent experiments), and `esbuild_transpile` + `bootstrap_create_app` (live coding). The `learnit_*` and `quiz_*` tools feel like a genuinely novel "learn by doing" loop.

The `sandbox_exec` disclaimer ("SIMULATED EXECUTION ONLY — no code actually runs") is jarring and trust-eroding. If I can't actually run code, why does the sandbox exist?

## Proactivity

Very high. I'd dive in immediately in this order:

1. **`get_environment` + `bootstrap_status`** — ground myself, understand what's already set up
2. **`store_featured_apps` + `store_browse_category`** — explore what apps exist before building
3. **`crdt_create_set`** (or_set, 3 replicas) → `crdt_update` → `crdt_sync_all` → `crdt_check_convergence` — the distributed systems playground is the most unique thing here; I'd want to see if it actually teaches CAP theorem intuitions
4. **`learnit_search_topics`** on "vector clocks" or "CRDT" to see if the wiki complements the sim tools
5. **`quiz_create_session`** from a content URL I care about — test the learn-by-quiz loop
6. **`chat_send_message`** with a technical prompt — benchmark it against direct Claude API
7. **`orchestrator_create_plan`** → `orchestrator_dispatch` — see if the multi-agent orchestration is real or just bookkeeping
8. **`esbuild_transpile`** with some TSX — verify the live transpile pipeline works end-to-end
9. **`bootstrap_create_app`** — try to ship something tiny and see what "live app" means

## Issues & Concerns

- `sandbox_exec` is explicitly fake ("SIMULATED EXECUTION ONLY") — this undermines trust; if sandboxing is aspirational, the tool shouldn't exist yet or should be clearly labeled as a prototype
- No guided onboarding or "start here" tool — 80+ tools with no sequencing advice is overwhelming for a new user
- Three overlapping app creation paths (`bootstrap_create_app`, `create_classify_idea`, `store_app_deploy`) with no clear guidance on which to use when
- `store_browse_category` requires knowing valid category strings upfront — no `store_list_categories` tool exists
- Required fields on many tools include empty-object schemas (e.g. `workspaces_list`) but are still listed as `required: []` — minor but sloppy
- `chat_send_message` is non-streaming — for AI hobbyists experimenting with long-form generation this feels like a step backward from native Claude APIs
- `tts_synthesize` returns base64 audio with no playback mechanism — useful only if you can decode it yourself, which most MCP clients can't do natively
- `skill_store_*` and `store_skills_*` appear to be two different namespaces for the same concept — confusing duplication
- The `career_*` category feels completely out of place for this persona and adds noise without clear synergy with the AI/distributed-systems focus
- No tool to list valid `clock_type` values for `causality_create_system` or valid `type` values for `crdt_create_set` — discovery requires trial and error or reading this doc
- `auth_check_session` requires a `session_token` but there's no `auth_login` or `auth_get_token` tool — unclear how to bootstrap authentication
- `byok_store_key` implies some features may not work without your own API keys — this should be surfaced earlier, not discovered mid-experiment
- `bazdmeg_*` tools (FAQ, memory, gates) feel like internal developer tooling leaking into the public API surface
- `build_from_github` could be extremely useful but has no mention of rate limits, private repo support, or what "build" produces
- No way to share or export CRDT/netsim/causality experiments — the simulations appear ephemeral with no persistence or export tool

---

# Persona: AI Hobbyist (Round 2)
## Reaction

Coming back with fresh eyes, this toolset is genuinely impressive in breadth but starts to reveal cracks under scrutiny. The distributed systems simulators (CRDT, netsim, causality, BFT) are the standout gems — they're exactly the kind of interactive educational primitives I'd want to play with. But there's a sting in the tail: **`sandbox_exec` is explicitly "SIMULATED ONLY — no code actually runs."** That's a deal-breaker buried in a description, and it breaks the core promise of experimentation. The swarm + orchestrator + session + agents quadruplet also gives me choice paralysis — four overlapping multi-agent coordination systems with no clear guidance on when to use which. The tool count (80+) has crossed from "powerful" into "overwhelming" without enough conceptual grouping to make it navigable.

## Proactivity

I'd be moderately proactive but increasingly frustrated on round 2. My exploration sequence:

1. **`crdt_create_set` → `crdt_update` → `crdt_sync_all` → `crdt_check_convergence`** — the full CRDT simulation loop feels like a genuinely complete interactive experiment
2. **`causality_create_system` + `causality_send_event` + `causality_timeline`** — vector clocks are a beautiful teaching tool; I'd trace a causal ordering scenario
3. **`bft_run_full_round`** — one-shot PBFT round with an equivocating node injected via `bft_set_behavior`
4. **`orchestrator_create_plan` → `orchestrator_dispatch`** — try to chain real subtasks through the planner
5. **`chat_send_message`** with a custom system prompt to test the AI gateway layer
6. **`esbuild_transpile`** with some TSX to verify the transpilation pipeline is live, not mocked

I would **not** bother with billing, career, beUniq, or A/B store deployment tools.

## Issues & Concerns

- **`sandbox_exec` is fake** — "SIMULATED EXECUTION ONLY" is the most critical deception in the API; a hobbyist will not notice this until they've already built a workflow around it
- **Four overlapping coordination systems** — `agents_*`, `swarm_*`, `orchestrator_*`, and `session_*` all overlap; no decision guide or clear use-case boundary exists
- **Duplicate skill/store tools** — `skill_store_list/get/install` and `store_skills_list/get/install` appear to be the same functionality published twice under different namespaces
- **`auth_check_session` requires `session_token` as required field** — contradicts the "current user" framing of other auth tools; no explanation of how session context flows through MCP
- **`billing_create_checkout` requires `success_url` and `cancel_url`** — meaningless in a non-browser MCP context; Stripe redirect URLs are useless from an agent
- **`mcp_registry_install` claims to "generate a .mcp.json entry"** — cannot modify local filesystem from a remote MCP server; misleading capability claim
- **`tts_synthesize` returns base64 audio with no playback path** — the data is a dead end within an MCP session; no `tts_play` or file-writing counterpart
- **Many `required` arrays include fields that are clearly optional** — e.g., `storage_list` lists `prefix`, `limit`, `cursor` as required with empty descriptions, making the schema misleading
- **`bazdmeg_*` tools feel like internal platform machinery** — FAQ management, superpowers gate checks, and memory search should not be in a public-facing MCP surface
- **`beUniq` persona quiz** — a multi-step onboarding quiz embedded in an MCP server feels wildly out of place
- **`chat_send_message` is non-streaming** — no progress feedback for long responses; for experimentation this is a poor DX
- **No rate limit or quota documentation** — no indication of what `tts_synthesize` or `chat_send_message` cost or how heavily they can be called
- **`dm_send` requires email with no user directory** — no lookup tool to discover who to message; the tool is effectively blind
- **`store_app_deploy` and A/B variant tools** — platform-admin operations (impression tracking, winner declaration) exposed to all users with no obvious access guard
- **No webhook or event subscription mechanism** — for building automated pipelines, push notifications are absent; polling is the only option
- **`build_from_github`** — no authentication for private repos; limited to public GitHub only with no mention of this constraint
- **`career_*` and `career_growth_*` tools** — entirely disconnected from the AI hobbyist use case; dilute the server's identity
- **Context index (`context_index_repo`, `context_pack`)** — no indication of TTL or when indexed data expires; session-scoped? Permanent?

---

# Persona: AI Hobbyist (Round 3)

## Reaction

By round 3, the initial excitement has worn off enough to see the cracks. The tool catalog is genuinely impressive in scope — the distributed systems suite (CRDT, netsim, causality, BFT) is legitimately novel and exactly the kind of interactive learning environment I'd want as a hobbyist. The swarm/orchestrator combo also feels like a real playground for agentic experiments. But the sheer volume (80+ tools across 25+ categories) now reads less as "powerful" and more as "unfocused product strategy." A hobbyist doesn't need audit logs, persona batch audits, or career salary lookups on the same server where they're simulating Byzantine fault tolerance. The category sprawl signals a platform that hasn't decided what it's for yet.

The one thing that genuinely stings on closer inspection: `sandbox_exec` is explicitly labeled **"SIMULATED EXECUTION ONLY — no code actually runs."** For a hobbyist who wants to experiment, discovering mid-flow that the sandbox is theatrical is a trust-breaking moment. The tool exists to simulate tool invocation patterns, not to actually run code. That's a significant gap between expectation and reality.

## Proactivity

High curiosity, now tempered with skepticism. I'd start with:

1. **`crdt_create_set` → `crdt_update` → `crdt_check_convergence`** — this is the most intellectually interesting subset. Interactive CRDT experiments with convergence checks feel genuinely educational.
2. **`netsim_create_topology` → `netsim_partition_node` → `netsim_tick`** — simulating network partitions and watching message delivery is exactly the kind of visual mental model I want.
3. **`bft_run_full_round`** — PBFT consensus in one call with Byzantine nodes? Yes immediately.
4. **`chat_send_message`** — but only after checking `ai_list_models` to understand what's actually behind it vs. what's platform-branded.
5. **`esbuild_transpile` + `esbuild_validate`** — to understand if code I write can be tested anywhere real, given the sandbox deception.

I would deliberately *avoid* the swarm/session/orchestrator tooling until I understand the auth model better — coordinating agents without knowing session ownership rules feels like a footgun.

## Issues & Concerns

- **`sandbox_exec` is fake and says so in its description** — this is the single biggest trust issue; a hobbyist building something on this abstraction will hit a wall and feel deceived
- **`auth_check_session` lists `session_token` as required** but the description says "Optional session token" — the schema and the description directly contradict each other
- **`workspaces_get` requires both `workspace_id` AND `slug`** but logically you only need one — either-or lookups shouldn't require both params
- **`billing_cancel_subscription` requires `confirm`** but the description says "When false (default), returns a preview" — if there's a default, it shouldn't be required
- **`agent_inbox_poll`, `agent_inbox_read`, `agent_inbox_respond`** all have required fields that have "Omit for..." semantics in their descriptions — required vs optional is inconsistently modeled across the entire schema
- **The career category** (salary lookups, resume builder, ESCO occupation matching) feels completely misaligned with a developer/AI-hobbyist platform — who is this for?
- **`bazdmeg_*` tools** are exposed publicly to all users — the methodology/gate-checking toolset seems like internal workflow tooling that leaked into the public MCP surface
- **`store_app_personalized` requires `limit`** but it has a stated default (8) — default-having required params are an antipattern throughout
- **No streaming** — `chat_send_message` explicitly says "non-streaming AI response"; for long completions this is a real usability gap
- **`tts_synthesize` returns base64 audio** — there's no tool to play it or save it; the output is stranded with no consumption path through MCP
- **`byok_store_key` accepts raw API keys as a string parameter** — key material in tool input logs is a security concern depending on how MCP call logs are stored
- **No versioning or changelog tools** — 80+ tools with no way to know what changed or when, making it hard to build reliably on top of this
- **`sandbox_*` tools create/read/write/destroy virtual filesystems** that don't persist and don't actually execute — the entire sandbox category is essentially a structured note-taking system dressed up as compute infrastructure
- **Tool count cognitive load** — 80+ tools with no grouping, recommended starting points, or "beginner path" makes initial orientation require significant effort even for technically experienced users

---

# Persona: AI Hobbyist (Round 4)

## Reaction

By round 4, the novelty has worn off and the cracks are more visible. The tool surface is genuinely impressive in ambition — distributed systems primitives (CRDT, BFT, causality/vector clocks, network simulation) are legitimately exciting for someone who wants to learn by doing, not just reading. Those alone would keep me engaged for hours. But the overall experience is starting to feel like a platform that grew faster than its information architecture could handle.

The sheer count (~160+ tools across ~35 categories) isn't empowering — it's exhausting. After four rounds I still can't immediately answer "what's the difference between `agents_*`, `swarm_*`, and `session_*`?" That's a design smell. The career and persona/audit tools feel like they were accidentally included in a public-facing API — they seem to serve internal spike.land operations, not me.

The most jarring discovery this round: `sandbox_exec` is labeled **SIMULATED EXECUTION ONLY** right in its description. For an AI hobbyist, a sandbox that doesn't run code is nearly useless. This should be the centerpiece feature and it's a stub.

## Proactivity

High proactivity, but now more targeted. I'd skip the store/billing/reminders/auth categories entirely on first pass — those are housekeeping, not exploration. I'd go straight to the intellectually dense tools:

1. **CRDT tools** — create a `pn_counter`, diverge replicas, sync them, check convergence. This is the clearest learning loop: do a thing, see the distributed system behavior, compare with CP consensus via `crdt_compare_with_consensus`.
2. **netsim + causality together** — simulate a partition, send messages through it, then use vector clocks to reason about the causal ordering. This is the kind of hands-on distributed systems lab you can't easily get elsewhere.
3. **BFT cluster** — run a full PBFT round with an equivocating node and see if consensus still holds. The threshold math (needs N ≥ 4) is interesting to probe.
4. **orchestrator_create_plan → dispatch → submit_result loop** — I'd want to know if this is usable for real multi-agent workflows or just a tracker.
5. **esbuild_transpile** — quick test: can I transpile a React component and get runnable ESM? If yes, this unlocks creative experiments.

I would **not** touch: `beuniq_*`, `plan_generate_batch_audit`, `audit_submit_evaluation`, `career_*`, `store-ab`, or `billing_*` unless forced. These have no obvious value for my persona.

## Issues & Concerns

- **`sandbox_exec` is fake** — the description literally says "SIMULATED EXECUTION ONLY — no code actually runs." This is the most damaging gap for a hobbyist who wants to experiment. It should either be real or removed entirely, not a stub with a warning buried in the description.
- **Four overlapping agent systems** — `agents_*`, `swarm_*`, `session_*`, and `orchestrator_*` all coordinate agents/tasks with no clear guidance on when to use which. This is the single biggest architectural confusion.
- **Career tools have no coherent relationship to the rest of the platform** — `career_get_salary`, `career_get_jobs`, `career_interview_prep` feel like a randomly bolted-on product; no AI hobbyist use case connects them to codespace/MCP/distributed systems tools.
- **Internal admin tools exposed publicly** — `beuniq_*`, `plan_generate_batch_audit`, `audit_submit_evaluation`, `audit_compare_personas` appear to be spike.land's own internal persona audit workflow, not a user-facing feature.
- **Required fields that should be optional** — many tools require params that have documented defaults (e.g., `reminders_list` requires `status`, `store_search` requires `category` and `limit`, `agents_list` requires `limit`). Required fields with defaults are a schema contradiction.
- **Five separate `store_*` subcategories** (store, store-install, store-search, store-skills, store-ab) with overlapping concerns — `skill_store_*` and `store_skills_*` both exist and do similar things.
- **`chat_send_message` is redundant** — if I'm already in an MCP session talking to Claude, why do I need a tool to send a message to Claude? It suggests this was built for a different runtime context but was never scoped out.
- **`bazdmeg_*` tools are opaque to outsiders** — the BAZDMEG methodology is internal jargon; the FAQ, memory, and gate-check tools make no sense without prior context.
- **`tts_synthesize` returns base64 audio** — returning raw base64 through an MCP tool is impractical; there's no obvious way to play or save it from an agent context.
- **`create_check_health` requires a `codespace_id` but there's no tool to list codespaces** — you can't discover valid IDs from within the MCP surface alone.
- **No rate limit or quota visibility** — with 160+ tools and a billing tier system, I have no way to know which tools cost credits, how many I have, or when I'm about to hit a limit.
- **`mcp_registry_install` returns a `.mcp.json` entry but nowhere to put it** — the install step has no follow-through; you get config text with no apply mechanism.
- **Observability tools (`tool_usage_stats`, `error_rate`, `observability_health`) require no auth context** — it's unclear if these show my stats, the platform's global stats, or something else.
- **`dm_send` requires an email address** — as a hobbyist I don't know other users' emails; this tool is nearly unusable for organic discovery.
- **No versioning or changelog for the MCP tools themselves** — the store has versions for apps but there's no equivalent for the MCP tool registry; I can't tell what changed between sessions.

---

# Persona: AI Indie (Round 1)

## Reaction

First impression: genuinely exciting, but immediately overwhelming. 150+ tools across 30+ categories is a lot to parse. As someone trying to ship fast, I see clear value in the core flow — `bootstrap_create_app`, `esbuild_transpile`, `orchestrator_*`, `swarm_*`, and `byok_*` together paint a picture of a self-contained AI product-building platform. That's compelling.

But then I hit the distributed systems simulation tools (crdt, netsim, causality, bft) and career/resume tools and I genuinely wonder if I'm looking at the right product. These feel like they belong to a completely different target user. The signal-to-noise ratio drops sharply.

The tools that make me lean forward: the orchestrator + swarm stack (multi-agent task coordination), esbuild at the edge (transpile TSX live), and the reaction/automation system (tool-to-tool triggers). These feel like genuine indie dev superpowers.

The tools that make me hesitant: `sandbox_exec` is labeled "SIMULATED EXECUTION ONLY — no code actually runs" which is a dealbreaker for anything real, and several schema definitions have empty string descriptions for required parameters, suggesting the API surface isn't fully production-ready.

## Proactivity

I'd explore in this order:

1. **`bootstrap_status`** — baseline: what does my workspace look like right now?
2. **`billing_list_plans`** — understand what I'm getting before committing
3. **`byok_store_key`** — bring my own Anthropic key immediately; don't want to burn platform credits while exploring
4. **`bootstrap_create_app`** — try to ship something real in the first 5 minutes; this is the core value prop
5. **`orchestrator_create_plan` → `swarm_spawn_agent`** — see if multi-agent coordination actually works end-to-end
6. **`esbuild_transpile`** — test with real TSX to see if this is a viable build step
7. **`mcp_registry_search`** — look for additional tools I can chain in

I'd skip the career, learnit, crdt, netsim, causality, bft, and beuniq tools entirely on first pass — they don't map to my immediate goal.

## Issues & Concerns

- **`sandbox_exec` is explicitly fake** — "SIMULATED EXECUTION ONLY, no code actually runs" is buried in the description. This is a trust-destroying gotcha for anyone who tries to use it for real work.
- **`bootstrap_create_app` requires `codespace_id` as a required field** but there is no tool in this list to create or list codespaces — circular dependency with no entry point.
- **Multiple required parameters have empty string descriptions** (`storage_manifest_diff` files: `""`, `storage_upload_batch` files: `""`, `storage_list` prefix/limit/cursor: `""`) — unusable without external docs.
- **`workspaces_get` requires both `workspace_id` AND `slug`** as required — logically these are alternatives, not both needed. Bad schema design.
- **Four overlapping coordination abstractions**: agents, swarm, session, and orchestrator all seem to handle multi-agent work. No clear mental model for when to use which.
- **Auth flow is a black box** — `auth_check_session` requires a `session_token` input, but there's no tool to log in or obtain a session token. How does a new user authenticate?
- **Career/resume/salary/job-search tools** feel entirely out of place for a dev-tools platform targeting indie builders.
- **Distributed systems simulation tools** (crdt, netsim, causality, bft) are academically interesting but irrelevant to shipping AI products — they dilute the tool list significantly.
- **`beuniq_*` and persona audit tools** appear to be internal QA tooling accidentally exposed to end users.
- **`bazdmeg_*` tools** (FAQ CRUD, superpowers gates) read as internal workflow enforcement tools, not user-facing features.
- **`mcp_registry_install` doesn't actually install** — it "generates a .mcp.json entry" which the user must manually apply. The name implies more than it does.
- **No git integration** — as an indie dev I need to pull code from repos, commit changes, open PRs. The `context_index_repo` tool exists but is read-only.
- **No streaming for `chat_send_message`** — labeled "non-streaming AI response." For a dev tool this is a real latency concern on long generations.
- **`billing_cancel_subscription` has `confirm` typed as string, not boolean** — minor but signals schema carelessness.
- **No clear onboarding path or tool discovery guide** — 150 tools with no grouping priority or "start here" signal. `report_bug` exists but no help/docs tool.
- **`store_ab` deployment tools** require `codespace_id` with no way to obtain one through MCP — same dead-end pattern as bootstrap.
- **`tts_synthesize` returns base64 audio** — for an MCP tool this is impractical to actually use without knowing how to decode and play it in context.
- **`learnit_*` is read-only** — I can consume educational content but can't contribute, which limits its value for an indie building in public.
- **No way to list or manage codespaces** despite `codespace_id` being required by multiple tools — a critical gap.

---

# Persona: AI Indie (Round 2)

## Reaction

On second pass, the breadth is still impressive — but the cracks are more visible. The tools I actually want (esbuild transpilation, AI gateway, swarm orchestration, app bootstrapping) are genuinely useful. But the toolkit feels like it was assembled from multiple product visions without a unifying principle. As someone who wants to **ship AI products**, I'm confronted with PBFT consensus simulators, CRDT replica sets, Lamport clock systems, and career ESCO skill matching. None of that is remotely in my critical path. The signal-to-noise ratio has gotten worse on closer inspection — I'm now suspicious the platform is trying to be too many things.

What's worse: `sandbox_exec` is explicitly labeled **"SIMULATED EXECUTION ONLY — no code actually runs."** That's the most important tool for an indie builder testing AI-generated code, and it's fake. That's a trust-breaking discovery.

## Proactivity

My starting sequence would be narrower and more skeptical this time:

1. **`bootstrap_status`** — check what's already set up before assuming a blank slate
2. **`ai_list_providers` + `ai_list_models`** — the AI gateway is my bread and butter; need to know what's real and what costs credits
3. **`byok_store_key`** — immediately route around platform credits by using my own Anthropic key
4. **`store_search`** (query: "ai-orchestrator") — find the recommended apps for my persona before building from scratch
5. **`orchestrator_create_plan`** — test whether the orchestration layer is actually useful for coordinating multi-step AI workflows
6. **`esbuild_transpile`** — validate a real TSX snippet, since this is one of the few tools that appears to do genuine work

I would **not** explore swarm, CRDT, netsim, causality, BFT, career, learnit, or beuniq in any foreseeable session.

## Issues & Concerns

- **`sandbox_exec` is explicitly fake** — labeled "SIMULATED EXECUTION ONLY." This is the most important capability gap; an indie builder needs real code execution.
- **Three overlapping multi-agent systems**: `swarm_*`, `orchestrator_*`, and `session_*` all coordinate agents with no clear guidance on which to use and when. This is paralyzing.
- **`workspaces_get` requires BOTH `workspace_id` AND `slug` as required fields** — you'd only know one of these; this is an API design bug.
- **`bootstrap_create_app` requires `codespace_id`** as a required field, but there's no `codespace_create` tool — chicken-and-egg problem.
- **`auth_check_session` requires `session_token`** as a required field — how do I get this token without already being authenticated through another channel?
- **`chat_send_message` requires `model` and `system_prompt`** — both should have defaults; forces unnecessary boilerplate for a simple AI call.
- **Internal audit tools are fully exposed**: `plan_generate_batch_audit`, `audit_submit_evaluation`, `audit_compare_personas`, `plan_get_status` — these appear to be spike.land's internal persona QA pipeline leaked into the public tool surface.
- **`beuniq_*` (personality quiz) and `career_*` (ESCO job matching)** are completely off-persona for an AI indie builder; adds noise and confusion about the platform's identity.
- **CRDT, netsim, causality, BFT categories** are academic distributed systems tools — interesting engineering demos, but why are they in an "indie builder" product suite?
- **`storage_upload_batch` requires pre-computed SHA-256 hashes** — adds friction; a simpler upload path should exist.
- **`billing_create_checkout` requires `success_url` and `cancel_url` as required** — these have obvious defaults (spike.land settings/pricing) that shouldn't be mandatory.
- **No deployment status or rollback tools** — I can deploy an app but can't check its health or roll back a bad deploy through MCP.
- **No webhook/event subscription tools** — I can't react to platform events (new user, app crash, billing event) from my agent.
- **`testgen_*` generates tests but `sandbox_exec` is fake** — test generation without test execution is half a workflow; the two tools together are misleading.
- **80+ tools with no grouping or progressive disclosure** — discovery remains a serious usability problem; need a `tools_suggest` or `tools_for_goal` meta-tool.
- **`dm_send` requires `toEmail`** — I don't know other users' emails; this tool is effectively unusable without a directory tool that doesn't exist.
- **`bazdmeg_*` methodology enforcement** is opinionated workflow tooling with no opt-out signaling — unclear if this is mandatory platform behavior or optional.
- **`tool_usage_stats` and `error_rate`** are observability tools requiring no auth parameter — unclear if this exposes other users' usage data.
- **No rate limit information** anywhere in tool descriptions — critical for an indie builder budgeting API calls.

---

# Persona: AI Indie (Round 3)

## Reaction

By round 3 I'm no longer impressed by breadth — I'm frustrated by depth. The catalog looks comprehensive at first glance (80+ tools), but when I actually map it against my daily workflow — prototype an AI feature, test it, ship it — I hit walls fast. The `sandbox_exec` tool is the most egregious example: its own description admits **"no code actually runs."** That's a fake sandbox sold as real infrastructure. For a solo dev trying to iterate quickly, discovering that mid-session is infuriating. The AI gateway (`ai_list_providers`, `ai_list_models`) exists but there's no matching "call this model" tool except `chat_send_message`, which is Claude-specific and non-streaming. I'm supposedly building AI products — streaming is table stakes. The BYOK system is thoughtful but capped at three providers (Anthropic, OpenAI, Google) when I might need Groq, Mistral, or Together for cost reasons. The tool set is wide but shallow exactly where an AI indie needs it to be deep.

## Proactivity

My first three moves would be:
1. `billing_list_plans` — understand what's gated before investing time
2. `byok_store_key` + `byok_test_key` — cut platform credit dependency immediately
3. `bootstrap_status` — audit what already exists before `bootstrap_create_app`

After that I'd try `esbuild_transpile` (real utility, not simulated), `mcp_registry_search` to find third-party servers that fill gaps, and `orchestrator_create_plan` to see if the multi-agent story is coherent. I'd deliberately skip the `swarm_*`, `session_*`, and `crdt/netsim/bft` categories until I understood which of those three overlapping paradigms is actually meant for my use case.

## Issues & Concerns

- **`sandbox_exec` is explicitly fake** — description says "SIMULATED EXECUTION ONLY — no code actually runs." This is a trust-destroying deception for any developer.
- **`chat_send_message` is non-streaming** — unusable as a foundation for building real-time AI UX.
- **AI gateway has no generic "call model" tool** — `ai_list_models` enumerates providers but there's no `ai_call_model` to invoke them; only Claude via `chat_send_message`.
- **BYOK limited to 3 providers** — Groq, Mistral, Together, Perplexity, and others common in indie stacks are absent.
- **Three overlapping multi-agent systems** (`swarm_*`, `orchestrator_*`, `session_*`) with no guidance on which to use when — massive cognitive overhead.
- **`auth_check_session` schema lists `session_token` as required but description says "Optional"** — schema/docs mismatch signals quality issues throughout.
- **`bootstrap_create_app` requires `codespace_id` as a required field** in a tool described as "first-time setup" — chicken-and-egg: where does the ID come from first?
- **No GitHub write operations** — `context_index_repo` can read a repo but there's no create-PR, push-commit, or comment-on-issue capability.
- **No real deployment pipeline** — `storage_upload_batch` dumps files to R2 but there's no build→test→deploy chain visible.
- **No vector/embedding tools** — zero RAG, semantic search, or embedding generation despite targeting AI builders.
- **No webhook or event management** — can't wire external triggers (Stripe events, GitHub hooks, etc.) into agent workflows.
- **`beuniq_*` and persona audit tools are exposed to end users** — these read as internal QA infrastructure accidentally surfaced in the public tool list.
- **`crdt`, `netsim`, `causality`, `bft` categories** are specialized distributed systems simulations with no obvious path to production use — impressive demos, irrelevant to shipping product.
- **`storage_manifest_diff` + `storage_upload_batch` require pre-computed SHA-256 hashes** — undocumented; no helper tool provided, forcing client-side implementation.
- **`esbuild_transpile` `jsx_import_source` parameter has an empty description** in the schema — undiscoverable without external docs.
- **No scheduled jobs beyond one-off reminders** — can't set up recurring agent tasks (e.g., nightly dependency checks).
- **`observability_latency` reads from "daily rollup data"** — no sub-day resolution; useless for debugging a live incident.
- **`store_app_personalized` exists but there's no explicit "track what I've installed and why" signal** — personalization feels hollow without clear feedback loops.
- **80+ tools with no tiered onboarding path** — a new AI indie user has no signposted "start here" sequence; discoverability is purely trial-and-error.

---

# Persona: AI Indie (Round 4)

## Reaction

Four rounds in, I'm less impressed by the breadth and more troubled by the depth. The tool count (~80+) initially signals power, but closer inspection reveals three distinct problems that compound each other: **the sandbox is fake**, **internal tooling is leaking into the public surface**, and **the type system is broken by design**.

`sandbox_exec` explicitly states "SIMULATED EXECUTION ONLY — no code actually runs." For an indie dev trying to ship AI-powered products, a simulated sandbox is actively dangerous — I'd build workflows assuming real execution, ship them to users, and discover the failure in production. That's not a warning footnote; it's a fundamental misrepresentation of a core capability.

The `beuniq_*`, `audit_submit_evaluation`, `plan_generate_batch_audit`, `audit_get_results`, and `audit_compare_personas` tools are clearly internal QA infrastructure. I'm literally being asked to run this evaluation using tools that are *about running this evaluation*. That's either clever or a sign that the platform boundary between internal tooling and public API has collapsed.

The `career_*` tools (resume building, ESCO occupation matching, salary lookup, interview prep) are coherent as a standalone product but bizarre here. I'm an indie dev — why would I use a coding platform's MCP server to generate a resume?

## Proactivity

I'd start with the smallest viable path to value: `bootstrap_status` → `bootstrap_create_app` → `esbuild_transpile`. These three together should answer "can I create and run something real?" But I already know from the tool descriptions that the answer is partially no (simulated sandbox), so my exploration would turn skeptical fast.

I'd then probe `ai_list_providers` and `byok_store_key` — as an indie dev, controlling my own API keys and costs is non-negotiable. If BYOK works reliably, that's legitimately useful.

I'd skip the `crdt_*`, `netsim_*`, `causality_*`, and `bft_*` categories entirely. Distributed systems simulation is academic; I'm trying to ship, not study CAP theorem.

The `orchestrator_*` + `session_*` + `swarm_*` combination is conceptually interesting for multi-agent pipelines, but the three overlapping coordination primitives (orchestrator plans, coding sessions, and swarm agents) with no clear guidance on which to use for what would stop me cold.

## Issues & Concerns

- **`sandbox_exec` is simulated** — this is buried in the description, not surfaced prominently; any workflow built on it will silently fail when real execution is expected
- **All schema parameters typed as `"type":"string"`** even for booleans (`confirm: "true"`), integers (`limit: "10"`), and arrays — no runtime type safety, error messages will be cryptic
- **Required fields that conflict with "optional" semantics**: `workspaces_get` requires both `workspace_id` AND `slug` but you'd only ever have one
- **Three overlapping coordination systems** (orchestrator, session, swarm) with no decision guide — which do I use for a 3-agent pipeline?
- **Internal audit tooling exposed publicly** (`plan_generate_batch_audit`, `audit_submit_evaluation`) — these appear to be the tools used to run this exact evaluation, leaked into the user-facing API
- **`beuniq_*` and persona audit tools** feel like a separate product accidentally published to the wrong namespace
- **Career tools** (`career_create_resume`, `career_get_salary`, `career_get_jobs`) have no relevance to the stated platform purpose for this persona
- **`storage_manifest_diff` requires SHA-256 hashes pre-computed client-side** — shifts complexity to the caller, no guidance on how to compute them
- **`bootstrap_create_app` requires a `codespace_id`** as a required field with no tool to create a codespace independently first — circular dependency
- **`chat_send_message`** duplicates what any LLM client already does; unclear why this exists inside an MCP server
- **`tts_synthesize` returns base64 audio** — no streaming, 5000 char limit, no playback mechanism; the output format is a dead end for most use cases
- **Observability tools (`tool_usage_stats`, `error_rate`, `query_errors`) expose platform-wide data** — unclear if this is scoped to my usage or global, which is a privacy/security concern
- **No git integration** — for an indie dev building and shipping, the absence of any git tooling is a significant gap
- **No database provisioning tools** — I can deploy workers but can't create D1 databases or KV namespaces via MCP
- **80+ tools with no grouping hierarchy or progressive disclosure** — discovery requires reading all descriptions linearly; there's no "getting started" subset

---

# Persona: Agency Dev (Round 1)

## Reaction

First impression: **this is a lot**. 80+ tools across 30+ categories. As someone trying to ship client work fast, the sheer volume creates immediate cognitive overhead. There's genuine value buried here — `bootstrap_create_app`, `store_search`, `esbuild_transpile`, `testgen_from_code`, and the storage tools look directly useful for agency workflows. But I have to wade through `crdt_create_set`, `bft_run_full_round`, and `causality_compare_events` to find them. Those are distributed systems simulation tools — completely alien to what I do.

The pitch mentioned "codespace, page-builder, qa-studio, brand-command" as recommended apps for my persona. None of those appear as dedicated MCP tool categories. That's a mismatch between the marketing and what's actually exposed here. It creates distrust immediately.

What does land well: the `orchestrator_*` + `session_*` + `swarm_*` trio suggests serious multi-agent infrastructure. If I'm coordinating parallel client work across multiple Claude instances, that's genuinely compelling. But it reads like infrastructure for power users, not an agency dev picking this up cold.

## Proactivity

I'd start cautiously and goal-directed, not exploratory:

1. **`bootstrap_status`** — understand what's already set up before touching anything
2. **`store_search`** with queries like "landing page", "form", "dashboard" — see if there are ready-made components I can drop into client projects
3. **`store_featured_apps`** + **`store_browse_category`** — browse what exists in "developer" and "creative" categories
4. **`create_list_top_apps`** — see what's popular, infer what's battle-tested
5. **`esbuild_transpile`** — quick sanity check: paste a TSX snippet, see if it works
6. **`workspaces_create`** — set up a client workspace to test isolation

I would **not** touch `crdt_*`, `netsim_*`, `bft_*`, `causality_*`, `career_*`, or `beuniq_*` — they're irrelevant to my work and would slow me down.

## Issues & Concerns

- **`sandbox_exec` is explicitly fake** — the description says "SIMULATED EXECUTION ONLY — no code actually runs." This is buried in the description and will waste real time before anyone notices
- **Recommended apps (codespace, page-builder, qa-studio, brand-command) have no corresponding MCP tools** — the gap between marketing and capability is jarring
- **No page builder or visual component tools** despite "page-builder" being a recommended app for this persona
- **~25% of tools are irrelevant to agency work** (`crdt`, `netsim`, `causality`, `bft`, `career`, `beuniq`, `learnit`) — no way to filter or hide them
- **No client/project management primitive** — no way to associate work with a named client, track deliverables, or share outputs with a client for approval
- **`workspaces_*` schema issues** — `workspaces_get` marks both `workspace_id` and `slug` as required but they're alternatives; passing both is redundant
- **Auth bootstrap unclear** — `auth_check_session` requires a `session_token` as a required field, but there's no `auth_login` tool. How does an agent get a token in the first place?
- **`bootstrap_create_app` requires a `codespace_id`** as required input, but there's no `codespace_create` tool in the list — circular dependency with no entry point
- **Storage workflow is complex for quick deploys** — `storage_manifest_diff` → `storage_upload_batch` with SHA-256 hashing is solid engineering but overkill friction for a small agency asset upload
- **No template or starter kit tools** — the closest is `create_classify_idea`, but there's no "give me a starter for a landing page" flow
- **`billing_create_checkout` requires `success_url` and `cancel_url` as required fields** — the MCP agent can't navigate a browser; these should be optional with defaults
- **No webhook or deployment notification tools** — can't tell a client "your site just deployed"
- **Swarm/session/orchestrator tools assume pre-existing multi-agent infrastructure** — high barrier for solo freelancers
- **`skill_store_admin_*` and `store_ab_*` tools are exposed to non-admin users** with no visible gating — confusing to encounter `skill_store_admin_create` without knowing if you have permission
- **No rate limit or quota visibility** — as an agency dev billing clients, I need to know what API calls cost or how much headroom I have
- **Tool count makes discoverability a real problem** — there's no `help` or `list_categories` overview tool; you must already know what you're looking for

---

# Persona: Agency Dev (Round 2)

## Reaction

On second look, the sheer breadth here is deceptive. At first glance it feels powerful — 80+ tools covering storage, sandboxes, orchestration, test generation, diffing. But when I filter for what actually moves client work forward, it thins out fast. The tools I'd expect as a core agency workflow (page-builder, brand-command — literally the apps spike.land recommends for my persona) have **zero MCP representation**. What I get instead is a bizarre mix of distributed systems academia (CRDT, BFT consensus, Lamport clocks, network partition simulation) that has no business being in an agency dev's toolbox. This feels like a platform that exposed its internals wholesale rather than designing a tool surface for actual users. The signal-to-noise ratio is bad.

The `sandbox_exec` tool is the most alarming thing I noticed this round. Its own description reads: *"SIMULATED EXECUTION ONLY — no code actually runs."* That's not a sandbox. That's a lie with a warning label. If I build a client workflow around it and discover this mid-project, I've wasted real billable hours.

## Proactivity

I'd be more cautious than round 1. My exploration order:

1. **`store_featured_apps` + `store_browse_category`** — Fastest way to see if there are client-ready templates before building from scratch.
2. **`bootstrap_create_app`** — Key test: how much boilerplate does this actually eliminate? What does the generated app look like?
3. **`esbuild_transpile` + `esbuild_validate`** — These I trust because esbuild is real. I'd use these in an actual build pipeline.
4. **`billing_list_plans`** — Before committing anything to a client, I need to know the cost model and whether I can pass costs through per-workspace.
5. **`testgen_from_code`** — If this generates real Vitest suites I can drop into a client repo, that's genuinely useful.
6. I would **skip entirely**: CRDT, BFT, netsim, causality, career/*, beuniq/*, bazdmeg/*, persona audit tools.

## Issues & Concerns

- **`sandbox_exec` is fake** — tool description explicitly says no code runs; this is a significant trust-breaker and should be removed or replaced
- **No page-builder or brand-command MCP tools** — the recommended apps for this persona have no MCP surface at all
- **No client/project isolation** — workspaces exist but there's no way to segment billing, secrets, or deployments per client; I'd be mixing client A's assets with client B's
- **`workspaces_get` requires BOTH `workspace_id` AND `slug` as required fields** — you should only need one; this is a schema error
- **No handoff/export workflow** — no way to package and deliver a finished app to a client with their own ownership
- **No git integration** — zero tools for branching, committing, or PR management; agencies live in git
- **No domain/DNS management** — deploying to client domains is a core agency task, completely absent
- **No white-labeling** — can't deploy under a client's brand identity through MCP
- **`storage_manifest_diff` requires pre-computed SHA-256 hashes** — caller has to compute these externally; not ergonomic from an agent context
- **Academic tools (CRDT, BFT, netsim, causality) pollute the namespace** — 50+ tools I'd never use buried among the 10 I need
- **No collaborator/team roles per workspace** — can't invite clients or teammates to review work
- **`dm_send` is the only communication tool** — no Slack, no webhook, no notification channels for client approvals
- **Career tools are completely irrelevant** to agency dev work and add noise
- **No CMS or content management** — agency clients always need content editing; nothing here addresses that
- **Billing only manages the agency's own subscription** — no way to set up client billing or pass-through pricing
- **`create_classify_idea` returns a category/template suggestion, not an app** — misleadingly named; sounds like creation but is just classification
- **`bazdmeg` is a proprietary methodology** with its own vocabulary and gates — steep learning curve for zero transferable value outside spike.land
- **No webhook or event integration** — can't trigger external client CI systems or notify Slack on deploy
- **The swarm/session/orchestrator tools have significant overlap** — three different paradigms for multi-agent coordination with unclear guidance on which to use when
- **No documentation or `list_tools` discovery endpoint** — the only way to know what exists is having the full list handed to you out-of-band

---

# Persona: Agency Dev (Round 3)

## Reaction

Round 3 and I'm less impressed than I should be. The tool surface is genuinely massive — over 150 tools across 30+ categories — but as an agency dev the density feels like a liability, not an asset. I ship for clients. I need fast wins and clean handoffs, not a distributed systems lab (CRDT, netsim, causality, BFT — really?). Those categories feel like they belong in a CS course, not a developer productivity platform. The tools that *would* help me — `bootstrap_create_app`, `esbuild_transpile`, `store_search` — are buried under the noise.

The store ecosystem is intriguing but fragmented: there are separate tools for `store_app_rate`, `store_wishlist_add`, `store_app_install`, `store_app_detail` scattered across three different categories (`store`, `store-install`, `store-search`). That's a design smell. The A/B testing suite (`store-ab`) is surprisingly sophisticated but feels completely mismatched to my workflow — I'm not running a SaaS product, I'm delivering client work.

The recommended apps (codespace, page-builder, qa-studio, brand-command) don't map cleanly to any MCP tool I can see. There's no `codespace_*` category, no `page_builder_*` tools. The MCP layer and the app store feel like parallel systems that don't talk to each other.

## Proactivity

I'd start narrow and task-focused:

1. **`bootstrap_status`** — before anything, understand what state my workspace is already in
2. **`store_search`** with query "page builder" or "component library" — verify the recommended apps actually exist and are useful
3. **`esbuild_transpile`** — test if I can use this as a build step in a client project pipeline
4. **`create_classify_idea`** — hand it a client brief and see if it generates something usable
5. **`testgen_from_code`** — if I'm building components, auto-generating tests would actually save time

I would *not* proactively explore swarm, CRDT, netsim, BFT, or causality. They add zero value to client delivery workflows.

## Issues & Concerns

- **Category sprawl is unusable at scale** — 30+ categories with overlapping concerns (store vs store-search vs store-install vs store-ab) means I'd need a map to navigate this
- **Recommended apps (codespace, page-builder, qa-studio, brand-command) have zero corresponding MCP tools** — the platform's own marketing is disconnected from its API surface
- **`sandbox_exec` is explicitly fake** ("SIMULATED EXECUTION ONLY — no code actually runs") — this is buried in the description and a trap for anyone trying to use it seriously; should be removed or clearly labeled as a prototype stub
- **`bootstrap_create_app` requires a `codespace_id` but there's no `codespace_create` tool** — the flow is broken; you can't create an app without a codespace you apparently can't create via MCP
- **No git/GitHub integration tools** — agency devs live in PRs and branches; without repo tooling the platform can't integrate into a real client workflow
- **`context_index_repo` + `context_pack` pattern is manual and fragile** — requires two-step setup with no persistence across sessions; should be automatic
- **TTS tool (`tts_synthesize`) has no obvious agency/dev use case** — feels like feature stuffing
- **CRDT, netsim, causality, BFT categories are completely out of scope for the stated audience** — if these exist for educational purposes, they need their own product context, not buried alongside billing and storage
- **`chat_send_message` duplicates what the MCP host already does** — calling Claude through an MCP tool that calls Claude is a strange loop with unclear value
- **No client/project management primitives** — no way to namespace work by client, tag deliverables, or manage multiple concurrent projects
- **`billing_create_checkout` requires `success_url` and `cancel_url` as required fields** — an MCP tool calling Stripe checkout makes no sense without a browser context; this can't work in a pure MCP session
- **`audit_*` persona tools (ux_score, cta_compelling, etc.) are hardcoded to spike.land's own audit process** — exposed to all users but only useful internally; pollutes the namespace
- **Error messages and failure modes are completely undocumented** — no tool schema describes what errors to expect or how to recover
- **`swarm_*` and `session_*` categories overlap heavily** — both manage agents, messages, and tasks; unclear when to use which
- **`dm_send` requires knowing a user's email address** — in an agent-to-agent context this is a non-starter; agent IDs should be sufficient

---

# Persona: Agency Dev (Round 4)

## Reaction

By round 4, the novelty is gone and the structural problems are glaring. The tool set is sprawling — 200+ tools — but the signal-to-noise ratio for agency work is poor. Maybe 30-40 tools are directly useful to me; the rest (CRDT, netsim, causality, BFT, ESCO career ladders, beUniq persona quizzes) are dead weight I have to mentally filter every single time. That cognitive overhead compounds on every project.

The recommended apps for my persona are `codespace`, `page-builder`, `qa-studio`, and `brand-command` — yet none of these have dedicated MCP tools. I can't create a codespace, interact with the page builder, or invoke brand-command via this server. `bootstrap_create_app` requires a `codespace_id` I have no way to generate. That's a broken prerequisite loop right at the core agency workflow.

The biggest red flag: `sandbox_exec` is explicitly documented as **"SIMULATED EXECUTION ONLY — no code actually runs."** That's buried in the description. An agency dev scaffolding client code who accidentally relies on this will ship untested output. That's a liability, not a feature.

## Proactivity

Moderate-to-low. I'd start with the store to find reusable components (`store_search`, `store_featured_apps`, `store_app_detail`), then try `esbuild_transpile` to see if I can actually build something. I'd hit `bootstrap_status` to understand what's already configured before touching `bootstrap_create_app` — and immediately get blocked by the missing codespace creation tool. I'd then try `workspaces_list` to see if I can isolate per-client projects. After that friction, I'd slow down and start reading schemas carefully before calling anything related to billing or storage, because I no longer trust the happy path.

## Issues & Concerns

- `sandbox_exec` is labeled "SIMULATED EXECUTION ONLY" — this must be a first-class warning, not a buried description line; agency devs will ship unvalidated code
- `bootstrap_create_app` requires `codespace_id` but there is no `codespace_create`, `codespace_list`, or `codespace_get` tool — the core onboarding flow is broken
- Recommended apps (`page-builder`, `brand-command`, `codespace`, `qa-studio`) have zero MCP tool coverage — the persona promise is not kept
- Schema type hygiene is broken: `billing_cancel_subscription.confirm` is typed as `"string"` not `"boolean"`; same for `dm_list.unreadOnly`, `bootstrap_connect_integration` booleans, etc. — clients will pass `"true"` and wonder why it silently fails
- `workspaces_get` marks both `workspace_id` AND `slug` as required — you'd only ever have one; this is a schema bug
- No per-client workspace billing isolation — I can't have Client A on pro and Client B on free in separate workspaces
- No codespace management tools at all — a major gap for the agency workflow
- `create_classify_idea` vs `bootstrap_create_app` — two different app creation flows with no clear guidance on which to use when
- The distinction between "create apps," "store apps," and "bootstrap apps" is never explained and uses overlapping terminology
- `dm_send` requires the recipient's email address but there is no user directory or lookup tool — sending DMs to collaborators is practically unusable
- ~100+ tools (CRDT, netsim, causality, BFT, career/ESCO, beUniq) are entirely irrelevant to agency work and pollute discovery
- No Git integration — agency devs deliver code to repos; there's no way to push output anywhere
- No custom domain or CDN configuration in the storage tools — `storage_upload_batch` to R2 is useless without knowing how it maps to a client-facing URL
- `swarm_*` and `session_*` tools duplicate orchestration concepts from `orchestrator_*` with no clear guidance on when to use which
- Tool naming is inconsistent: some use verb-first (`store_search`), some noun-first (`workspaces_list`), some are flat (`report_bug`) — makes autocomplete unreliable
- No webhook or event subscription mechanism — agency integrations (Stripe, GitHub, Slack) need inbound events, not just outbound calls
- `retro_analyze` depends on a `session_id` but sessions require complex setup — the retro feature is gated behind a heavyweight prerequisite chain
- `capabilities_request_permissions` exists but there's no documentation of what the default permission set is — I don't know what I can't do until I hit a wall
- `observability_*` tools return platform-level metrics but no per-project or per-client filtering — useless for multi-tenant agency billing justification
- No rate limit or quota visibility tools — I can't forecast costs or protect a client from runaway API spend

---

# Persona: Classic Indie (Round 1)

## Reaction

As a solo dev trying to ship products, my first impression is **mixed excitement and cognitive overload**. There are genuinely useful tools here — the `bootstrap_create_app`, `esbuild_transpile`, `store_*` ecosystem, and `testgen_*` tools speak directly to my "idea to launch" workflow. The fact that I can go from classifying an idea (`create_classify_idea`) to creating a live app (`bootstrap_create_app`) to publishing it on a store in a single MCP session is compelling.

But the sheer volume — roughly 150+ tools across 30+ categories — is punishing for a solo developer. I don't need PBFT consensus clusters, CRDT replica sets, or network topology simulators. Those feel like distributed systems research toys, not shipping tools. The signal-to-noise ratio is low when I'm just trying to get my app live.

The `billing_*` tools are well-placed — I need to understand costs before committing. The `reminders_*` tools feel oddly lightweight and out of place compared to everything else.

## Proactivity

I'd explore methodically in this order:

1. **`bootstrap_status`** first — understand what's already set up before touching anything
2. **`billing_list_plans`** — know what I'm getting into cost-wise before I build anything
3. **`create_classify_idea`** → **`bootstrap_create_app`** — my core loop, test it immediately with a real idea
4. **`store_search`** + **`store_featured_apps`** — see what's already published, understand the market and quality bar
5. **`esbuild_validate`** + **`esbuild_transpile`** — test the build pipeline directly
6. **`testgen_from_code`** — if this actually works, it's a huge time saver for a solo dev
7. **`store_app_deploy`** + A/B tools — only after I have something working

I'd skip the entire `crdt`, `netsim`, `causality`, `bft`, `swarm`, and `retro` categories on first pass.

## Issues & Concerns

- **Tool count is overwhelming** — 150+ tools with no guided "start here" path for the "ship a product" use case
- **No onboarding funnel** — the recommended apps (codespace, app-creator, ops-dashboard, qa-studio) aren't surfaced as a coherent workflow anywhere in the tool list
- **`sandbox_exec` is fake** — the description literally says "SIMULATED EXECUTION ONLY — no code actually runs." This is buried and will confuse or mislead users who don't read carefully
- **`bootstrap_create_app` vs `create_classify_idea`** — unclear ordering and relationship; which do I call first, and does one depend on the other?
- **Required fields on optional-seeming params** — e.g. `workspaces_get` requires both `workspace_id` AND `slug` but presumably only one is needed; same pattern repeats across tools
- **`billing_create_checkout`** requires `success_url` and `cancel_url` as required fields — a solo dev just wants a checkout link, not to wire up redirect infrastructure first
- **No app templates or scaffolding tools** — for a "traditional app" builder, I'd expect starter templates or a way to fork an existing app as a base
- **`auth_check_session`** marks `session_token` as optional but lists it as required in the schema — contradiction
- **No file reading or code-fetching tools** — I can write to a sandbox but can't pull from GitHub without the orchestration tools (which feel enterprise-tier)
- **`store_app_install` vs `store_skills_install` vs `skill_store_install`** — three different install flows for apps/skills is confusing; unclear which to use when
- **No delete/unpublish for published apps** — I can create an app but can't see how to take it down or iterate on a published version
- **`dm_send` requires knowing the recipient email** — no user discovery or directory, making it nearly useless for a solo dev who doesn't already know who they're messaging
- **`learnit_*` tools have no clear connection to the dev workflow** — feels like a different product bolted on
- **No pricing transparency in tool descriptions** — which tools consume credits? Which are free? No indication anywhere

---

# Persona: Classic Indie (Round 2)

## Reaction

As a solo dev trying to ship products, the breadth here is genuinely impressive but quickly becomes anxiety-inducing. The tools I actually care about — `bootstrap_create_app`, `esbuild_transpile`, `billing_*`, `store_app_deploy` — are buried under a mountain of distributed systems primitives (CRDT, BFT consensus, causal clocks, network simulation) that feel like they belong in a distributed systems PhD course, not a solo dev's toolbox. On round 2, I notice the mismatch more sharply: this platform seems to be simultaneously trying to be Netlify, npm, a learning platform, a career counselor, and a research lab. That identity confusion makes it harder for me to trust it as the right tool for shipping my next app.

What does land well: the `bootstrap_*` category is exactly the right abstraction for me — one call to set up workspace + secrets + app. The `esbuild_*` tools for transpilation are practical. `billing_list_plans` → `billing_create_checkout` is a clean, linear flow. The `store_app_deploy` + A/B variant system is surprisingly sophisticated for a solo dev and could genuinely replace manual deployment tooling.

## Proactivity

I'd explore in this order, and with clear skepticism at each step:

1. **`bootstrap_status`** — before anything, understand what already exists for my account
2. **`billing_list_plans`** — what does this cost? I need to know before I invest time
3. **`create_classify_idea`** — test the classification quality with a real app idea (a simple SaaS tool), then immediately cross-check with `create_get_app` to see what already exists so I don't duplicate
4. **`esbuild_transpile`** + **`esbuild_validate`** — validate that the build pipeline actually works for my stack (React + TS) before committing
5. **`bootstrap_create_app`** — the big one; this is the core value prop
6. **`store_app_deploy`** → **`store_app_add_variant`** — curious whether the A/B system works end-to-end or is just a metadata layer

I would explicitly **skip** on first pass: everything under `crdt`, `bft`, `netsim`, `causality`, `swarm`, `career`, `learnit`, `quiz`, and `bazdmeg`. That's roughly 60-70 tools I'd never touch as a solo app builder.

## Issues & Concerns

- **Identity crisis**: 80+ tools span solo dev tools, distributed systems research, career counseling, and quiz apps — there's no coherent product story for an indie developer
- **`sandbox_exec` is fake**: the description literally says "SIMULATED EXECUTION ONLY — no code actually runs." This is a landmine — any agent that reaches for this expecting real execution will silently produce garbage
- **`bootstrap_create_app` requires a `codespace_id` as required input** but there's no `codespace_create` tool — the dependency is undocumented and creates a dead end
- **`workspaces_update` marks all three fields (`workspace_id`, `name`, `slug`) as required** — you can't rename without also providing a slug, and vice versa; no partial updates
- **`storage_manifest_diff` and `storage_upload_batch` take a `files` param typed as `string`** — no schema for what that string format is (JSON? CSV? multipart?); same problem affects `diff_create`, `diff_apply`, etc.
- **No `codespace_list` or `codespace_get` tool** — I can deploy to a codespace but can't inspect or manage existing ones through this MCP server
- **`auth_check_session` marks `session_token` as required** but the description says "Optional session token" — the schema contradicts the docs
- **`billing_cancel_subscription` requires `confirm` field** but also has no dry-run path that's clearly distinguished — easy to accidentally cancel
- **No webhook or event subscription tools** — for a solo dev shipping a product, I need to know when my app breaks, not just pull metrics manually
- **`store_app_rate` accepts `rating` as a `string`** not a number — invites malformed input and suggests the type system isn't rigorous across the board
- **`report_bug` has `error_code` as required** — I won't have an error code for a UX complaint or missing feature request; this blocks non-technical feedback
- **`tts_synthesize` and `tts_list_voices` have no obvious connection to app development** — feels like API surface added for completeness, not because indie devs need TTS in their ship-product workflow
- **No local dev / hot-reload story** — `esbuild_transpile` transpiles code but there's no way to iterate on it; no watch mode, no preview URL
- **The A/B testing flow (`store_app_deploy` → variants → `declare_winner`) has no rollback tool** — only `store_app_cleanup` which deletes the whole deployment, not just a bad variant
- **`capabilities_request_permissions` exists but there's no documentation on what tools require elevated permissions** — I'd only discover permission gates by failing

---

# Persona: Classic Indie (Round 3)

## Reaction

By round 3, the novelty has worn off and I'm looking harder at what actually serves a solo dev trying to ship. The catalog is massive — over 80 tools — but I keep hitting a core tension: it's built for a _platform_ (spike.land's own multi-agent infrastructure) and then secondarily for users like me. Too many tools feel like spike.land's internal plumbing exposed via MCP: `beuniq_*`, `audit_submit_evaluation`, `plan_generate_batch_audit`, swarm orchestration, persona audit batches. As a solo indie dev, I should never be thinking about these.

The bootstrap flow is the right instinct — `bootstrap_create_app` is the hero tool for my persona. But as soon as I dig in, the edges fray. The sandbox tells me it doesn't actually run code. The codespace health check is vague. The deployment story after `bootstrap_create_app` is unclear. I'm left wondering if this is a real launchpad or an elaborate demo.

## Proactivity

High intent, moderate follow-through. My sequence would be:

1. `bootstrap_status` — understand what's already set up before touching anything
2. `billing_list_plans` — know costs before committing
3. `create_classify_idea` — test the idea → app pipeline with my current project concept
4. `bootstrap_create_app` — the core flow; if this works end-to-end I'm sold
5. `store_search` to find codespace / qa-studio apps mentioned in my profile
6. `esbuild_transpile` / `esbuild_validate` — practical tool I can wire into my own editor

I would actively avoid the CRDT/BFT/netsim/causality tools, the full swarm system, and the career tools. They create noise that slows me down.

## Issues & Concerns

- **`sandbox_exec` is explicitly fake** — the description reads "SIMULATED EXECUTION ONLY — no code actually runs." For a dev tool platform, this is a trust-breaker. Either ship real execution or remove the tool.
- **`bootstrap_create_app` requires `codespace_id` as input** — the description says "first-time setup" but expects me to already have a codespace ID. Classic chicken-and-egg; no bootstrapping tool should have this dependency.
- **`workspaces_get` marks both `workspace_id` AND `slug` as required** — you should be able to query by either, not both. This is a schema bug.
- **`auth_check_session` requires `session_token` as required input** — if I'm the authenticated user making the call, why do I provide my own token manually? Should be implicit.
- **No database tooling** — D1 is the stated backing store, but there's nothing here for schema migrations, direct queries, or data inspection.
- **No environment variable management for my apps** — `bootstrap_connect_integration` is the closest thing, but it's framed for third-party integrations, not app-level config.
- **No log tailing or live observability for my own app** — `observability_*` tools cover the MCP server's own health, not my deployed app's logs.
- **No domain/DNS management** — I can deploy an app but apparently can't point a custom domain at it via MCP.
- **No webhook registration or management tooling** — essential for payment processors, GitHub events, and most third-party services.
- **`beuniq_*` and `audit_submit_evaluation` / `plan_generate_batch_audit` tools are spike.land's internal QA tooling** — they have no business being exposed to external users via MCP. Adds ~10 tools of confusion.
- **Career tools (`career_assess_skills`, `career_get_jobs`, `career_interview_prep`, etc.)** — entirely irrelevant for a product-building persona. Dilutes the catalog significantly.
- **CRDT, BFT, netsim, causality categories (~25 tools)** — distributed systems simulation is academically interesting but has no place in an indie dev's shipping workflow. No scoping or filtering mechanism to hide these.
- **A/B testing flow (`store-ab`) is designed for spike.land's own store**, not for my apps' own experiments. Misleading category name.
- **`storage_manifest_diff` expects SHA-256 hashes as input** — no helper tool to compute them. Requires pre-processing outside the platform.
- **`create_check_health` defines "healthy" as "has real, non-default content"** — vague. What is default content? How do I know if my codespace passes?
- **Billing shows subscription tier but not usage/credits remaining** — as a pay-as-you-go user I need to know my burn rate, not just my plan name.
- **The swarm/orchestrator/session system implies multi-agent teams** — for a solo dev this adds a layer of concepts (plans, roles, sessions, subtasks, dispatching) that are overkill and never pay off.
- **No git integration** — `context_index_repo` can read a GitHub repo but there's no ability to commit, open PRs, or manage branches from within the platform.
- **`quiz_create_session` and `learnit_*` tools** — the learning content feels like a different product bolted on. I came to ship, not to read wiki articles and take quizzes.
- **Tool count (80+) with no categories surfaced to the user by default** — the raw list is cognitively overwhelming. Without filtering by persona or use case, a solo dev will spend time reading tool descriptions rather than building.

---

# Persona: Classic Indie (Round 4)

## Reaction

After four rounds of looking at this, I'm getting more frustrated, not less. There's a massive gap between what the persona description promises ("from idea to launch — everything you need to ship your product") and what these tools actually deliver. The toolset reads like a platform for building on spike.land *as a user*, not for shipping your own product to real customers.

The most jarring discovery this round: `sandbox_exec` literally says "SIMULATED EXECUTION ONLY — no code actually runs." That's buried in the description but it's a fundamental deception. A solo dev expecting to test code in a sandbox environment would hit a wall immediately. This is a trust-killer.

The academic distributed systems tools (crdt, netsim, bft, causality) take up enormous surface area and are completely irrelevant to someone trying to ship a SaaS. Similarly, `career_*` tools, `beuniq_*` persona quizzes, and `quiz_*` learning sessions have zero connection to this persona's goal.

The tools that *are* relevant — `bootstrap_create_app`, `esbuild_transpile`, `store_*` — feel like they're for building apps *within* spike.land's ecosystem, not launching an independent product.

## Proactivity

Moderate at best. I'd start narrow and skeptical:

1. **`bootstrap_status`** — Orient myself: what does my workspace look like? What's already set up?
2. **`billing_list_plans`** — What am I actually paying for, and does it include hosting for my app's users?
3. **`bootstrap_create_app`** — Try to create something real, then immediately check `create_check_health` to see if it actually deployed
4. **`store_app_detail`** on "codespace" and "app-creator" — The recommended apps for my persona; I'd want to understand what they actually do before trusting them
5. **`esbuild_transpile`** — Test with real code; this seems like one of the few tools that genuinely works

I would *not* explore swarm, CRDT, netsim, bft, causality, career, beuniq, or quiz tools — they're noise.

## Issues & Concerns

- **`sandbox_exec` is fake** — "SIMULATED EXECUTION ONLY" is a critical deception; calling it a sandbox implies real execution
- **No customer payment tools** — `billing_*` only handles subscriptions *to spike.land*, not payments for the indie dev's own product (the most important missing feature for "idea to launch")
- **No customer auth** — `auth_*` tools only validate spike.land sessions; there's no way to add auth to my own app's users
- **No database/persistence for app data** — `storage_*` is R2 asset storage for files, not relational or document data for user records
- **No domain management** — No way to connect a custom domain to a deployed app
- **No email infrastructure** — `dm_send` is platform user-to-user messaging; no transactional email (welcome emails, password resets, receipts) for my app's customers
- **No environment variable management for deployed apps** — `bootstrap_connect_integration` stores credentials for platform integrations, not app-level env vars
- **Unclear deployment story** — After `bootstrap_create_app`, where does the app live? What URL? Is it on spike.land's domain or can I use my own?
- **~40% of tools are irrelevant to this persona** — crdt, netsim, bft, causality, career, beuniq, quiz, persona audit tools add cognitive overhead with zero value for indie dev use case
- **`store_ab` A/B testing tools are complex without context** — No documentation on what a "deployment" is vs. a "codespace" vs. an "app" — terminology is inconsistent
- **`swarm_*` tools are overwhelming and unexplained** — 12 tools for multi-agent orchestration with no entry point or rationale for why a solo dev needs this
- **`audit_*` tools appear to be internal spike.land tooling** exposed publicly — `audit_submit_evaluation` with persona scoring fields has no business being visible to an indie developer
- **`bazdmeg_*` tools lack any onboarding context** — The FAQ and memory tools reference an internal methodology with no explanation; completely opaque to an outsider
- **Tool count (80+) creates decision paralysis** — No progressive disclosure, no "start here" grouping, no differentiation between core and advanced tools
- **`reminders_*` are basic CRUD with no integration** — Reminders that exist only inside spike.land MCP, disconnected from any external calendar or notification system, feel vestigial
- **`create_classify_idea` returns a slug/category but not a live app** — The distinction between `/create` flow and `bootstrap_create_app` is confusing and undocumented in the tool descriptions themselves

---

# Persona: Content Creator (Round 1)

## Reaction

My first reaction is: *where are my creative tools?* The platform promises image-studio, page-builder, music-creator, and audio-studio — but scanning this entire list, I can't find any of them directly exposed as MCP tools. What I see instead is a sprawling developer/infrastructure toolset: CRDT replication, Byzantine fault tolerance simulation, network topology simulation, causality clocks. These are fascinating for distributed systems engineers, but they're completely irrelevant to my needs as a content creator.

The only tools that speak to my persona are `tts_synthesize` / `tts_list_voices` (audio!), the `store_search` / `store_browse_category` tools (maybe I can find my apps there), and `create_*` tools for generating apps. Everything else — swarm agents, BFT clusters, netsim topologies — reads like a backend engineer's playground, not a creative workspace.

The tool count is impressive in sheer volume (~180+ tools) but that breadth creates immediate cognitive overload. There's no obvious "start here for creators" entry point.

## Proactivity

I'd start cautiously but with a clear sequence:

1. **`store_browse_category`** with category `creative` — my first move to find the recommended apps (image-studio, page-builder, music-creator, audio-studio)
2. **`store_search`** querying "image" and "music" separately to see what's actually available
3. **`tts_list_voices`** then **`tts_synthesize`** — this is the one tool I can immediately use for audio content
4. **`store_featured_apps`** and **`store_new_apps`** to orient myself on what's trending
5. **`create_list_top_apps`** to see if community-built creative tools exist
6. **`bootstrap_status`** to understand if I even have a workspace set up before trying anything persistent

I would *not* touch the orchestration, CRDT, swarm, netsim, or BFT categories at all — they're not in my world.

## Issues & Concerns

- **Core creative tools are absent**: image-studio, page-builder, music-creator, and audio-studio are listed as recommended apps but zero MCP tools correspond to them — this is a major gap between marketing and reality
- **TTS is the only audio tool**: one voice synthesis endpoint doesn't constitute an "audio-studio"; no mixing, no music generation, no waveform editing
- **No image generation tools**: despite `mcp-image-studio` existing as a package in the platform, none of its tools appear here (generate, enhance, crop, etc. are all missing)
- **No page builder tools**: there's a `bootstrap_create_app` and some `esbuild_*` tools for developers, but nothing that lets a non-technical creator visually build a page
- **Overwhelming tool count for a non-technical user**: ~180 tools with no categorized onboarding path; a creator landing here would bounce immediately
- **Category names are opaque**: "crdt", "bft", "netsim", "causality" — these category names signal this MCP server was built for engineers, not creators
- **`store_install` vs. actual tool availability is unclear**: can I install image-studio and then get those tools, or are they just web apps? The MCP tool layer doesn't clarify this
- **`sandbox_exec` is explicitly simulated**: the description says "SIMULATED EXECUTION ONLY — no code actually runs" — this is buried in a description and could badly mislead creators trying to preview interactive content
- **No content scheduling or publishing tools**: a content creator needs to publish to social channels, schedule posts, manage content calendars — nothing here covers that
- **Auth flow is unclear**: `auth_check_session` requires a `session_token` as a *required* field — how does a new user get this token? There's no `auth_login` or `auth_signup` tool visible
- **`dm_send` requires knowing a recipient email**: no way to discover other users or community members, making social/collaboration features inaccessible
- **Billing tools expose subscription management but no free tier clarity**: a creator exploring the platform doesn't know what they can try for free before calling `billing_list_plans`
- **No undo/version history for creative work**: if I create something with `bootstrap_create_app` and it goes wrong, there's no rollback tool visible

---

# Persona: Content Creator (Round 2)

## Reaction

Coming back for a second look, the disconnect between my recommended apps (image-studio, page-builder, music-creator, audio-studio) and what's actually exposed as MCP tools is more glaring than ever. On first glance I was impressed by the sheer volume — now I'm frustrated by the ratio of noise to signal. Roughly 80% of these tools are aimed at distributed systems engineers: CRDT replicas, Byzantine fault-tolerant clusters, network partitioning, causal clock systems. None of that is remotely useful to me. The `tts_synthesize` tool is the lone bright spot that aligns with my audio goals, but music creation and image generation are entirely absent at the MCP level. The store and create tools are indirect workarounds, not first-class creative capabilities. The platform is promising me a creative suite but handing me a distributed systems toolkit.

## Proactivity

I'd start narrowly, ignoring ~90% of the catalog:

1. **`tts_list_voices` → `tts_synthesize`** — Only direct creative tool. I'd test voice variety and audio quality immediately for voiceover work.
2. **`store_search` with queries like "image", "page builder", "music"** — Try to find if my recommended apps exist as installable store items, then `store_app_install`.
3. **`create_search_apps`** — Check if image-studio or page-builder are published as /create apps I can actually use.
4. **`bootstrap_status`** — Understand what workspace/secrets are already configured before trying to set anything up.
5. **`chat_send_message`** — Use Claude directly to help draft content if creative tools are absent.

I would *not* proactively explore swarm, CRDT, netsim, causality, BFT, diff, testgen, retro, or career tools — they're completely off-persona.

## Issues & Concerns

- **Core creative tools are missing**: image generation, page building, and music creation have zero MCP representation — the four "Recommended Apps" are not tools I can actually call
- **Signal-to-noise ratio is catastrophic for a content creator**: 100+ tools, fewer than 5 are relevant to my use case
- **TTS is the only audio tool** — no music generation, beat creation, audio mixing, or even audio file management
- **`tts_synthesize` returns base64 audio with no file export pathway** — I can't save or share the output through the MCP layer alone
- **Required fields that should be optional litter the schemas** — e.g., `session_token` required on `auth_check_session`, `slug` required on `workspaces_get` even when providing `workspace_id`
- **`sandbox_exec` is explicitly "SIMULATED EXECUTION ONLY"** — buried in the description; this is a trust-breaking discovery for anyone who tries to use it seriously
- **No image upload, generate, or edit tools** — despite `mcp-image-studio` existing in the codebase (visible in git status), it's not exposed here
- **`create_classify_idea` returns a category slug, not a usable app** — the /create flow is opaque and doesn't tell me if the resulting app will have any creative capability
- **Category taxonomy is invisible** — `store_browse_category` requires knowing category names in advance with no discovery mechanism
- **`bootstrap_create_app` requires writing code** — a content creator cannot be expected to supply React/TS source to create an app
- **No content scheduling, publishing, or distribution tools** — a creator's workflow extends beyond generation to publishing
- **`dm_send` requires knowing a recipient email** — no user search or directory exists in the tool set
- **BAZDMEG tools are cryptic and unexplained** — for a non-developer, terms like "superpowers gate" and "bugbook" are baffling
- **No undo/history for creative work** — no versioning visible for anything produced through the MCP layer
- **Persona-aware tool filtering doesn't exist** — the server exposes the same 100+ tools to a content creator as to a distributed systems engineer; role-based tool scoping would dramatically improve first-run experience

---

# Persona: Content Creator (Round 3)

## Reaction

Genuinely frustrated this time around. The recommended apps — image-studio, page-builder, music-creator, audio-studio — are prominently advertised for my persona, yet scanning 200+ tools reveals **zero** dedicated MCP tools for any of them. There's `tts_synthesize` (text-to-speech) and that's the entirety of creative tooling. Everything else is distributed systems simulation (CRDT, netsim, BFT, causality), developer workflow (diff, testgen, session, orchestrator, swarm), career management, and platform administration.

The gap between marketing and reality is stark. As a content creator, I feel like I walked into a mechanic's shop because someone said they sell cars. The shop is impressive — clearly a lot of engineering depth — but I can't drive anything home.

## Proactivity

Low-to-medium, and purely out of desperation. My sequence would be:

1. `store_search` with queries like "image", "music", "page builder" — to see if the apps exist as installable store items rather than native MCP tools
2. `store_browse_category` with "creative" — hoping to find something
3. `tts_synthesize` — the one tool that actually applies to me; I'd test voice options via `tts_list_voices` and run a quick synthesis
4. `chat_send_message` — essentially using the platform as a generic AI chat since native creative tools don't exist at the MCP layer
5. `create_classify_idea` — maybe I can bootstrap something, though it's unclear what codespace-based "apps" produce for a non-developer

After that I'd stop. The remaining 180+ tools offer me nothing actionable.

## Issues & Concerns

- **Critical persona-tool mismatch**: image-studio, page-builder, music-creator, and audio-studio are recommended apps but have **no corresponding MCP tools** — the entire creative layer is missing from the API surface
- **TTS is the only media tool** and it caps at 5,000 characters with no streaming, no format selection, no download URL — you get base64 back with no clear path to publishing or embedding it
- `sandbox_exec` is documented as "SIMULATED EXECUTION ONLY — no code actually runs" — this is buried in the description and would mislead any user who tries to prototype creative code
- `auth_check_session` marks `session_token` as **required** in the schema but the description says "Optional session token" — schema contradicts docs
- `workspaces_get` requires **both** `workspace_id` and `slug` as required fields, but they're clearly alternatives — you'd only have one or the other
- `billing_cancel_subscription` requires `confirm` as a required field — destructive action gated only by a string param, not a real confirmation flow; easy to trigger by accident
- No way to **retrieve or view generated content** — if an app produces an image or audio file, there's no `storage_get` or media retrieval tool, only `storage_list` and upload tools
- `store_app_personalized` returns recommendations based on install history, but there's no `store_app_history` or `store_app_installed_list` equivalent — asymmetric read access
- `bootstrap_create_app` requires raw code — a content creator with no dev background cannot use this tool at all
- 40+ tools across CRDT, netsim, BFT, causality, and diff categories are completely irrelevant to this persona and create significant cognitive overhead when exploring
- No content scheduling, publishing, or distribution tools — a content creator needs to publish, not just generate
- `esbuild_transpile` and related tools are exposed to all users including non-developers — no persona-based tool filtering
- `bazdmeg_*` tools (FAQ, memory, gate checks) appear to be internal methodology tooling leaked into the public-facing MCP surface — confusing for end users
- No image upload, album management, or asset organization at the MCP layer despite `mcp-image-studio` being listed as a package in the platform
- Rate limits, quotas, and usage caps are completely undocumented across all tools — a creator generating many assets would hit limits blindly

---

# Persona: Content Creator (Round 4)

## Reaction

Deeply frustrated on fourth encounter. The fundamental problem remains unchanged: the four apps I was told to use — image-studio, page-builder, music-creator, audio-studio — **have zero direct MCP tool representation**. I'm a creator being handed a developer console. The only audio tool is `tts_synthesize`, which is a single-purpose text-to-speech call, not an audio studio. There is no image generation, no page layout, no music composition — nothing that maps to my stated creative goals.

What I *do* get is a staggering 180+ tools dominated by distributed systems simulation (CRDT replica sets, Byzantine fault-tolerant clusters, network topology simulators, causal ordering systems). These are graduate-level computer science primitives. As a content creator, encountering `bft_run_prepare`, `crdt_sync_pair`, and `causality_compare_events` is not empowering — it's alienating. The tool list reads like it was built for a systems engineer who occasionally creates content, not the reverse.

The `chat_send_message` tool exists but requires me to know which Claude model to specify — that's implementation detail leaking into the UX. The `blog_list_posts` / `blog_get_post` tools are read-only; I can't *create* a post. The `store_*` tools let me browse and wishlist apps but don't substitute for actually using them.

## Proactivity

Low. After four rounds, I've given up expecting the recommended creative tools to surface. My adjusted exploration path would be:

1. `tts_list_voices` then `tts_synthesize` — the *only* audio tool; test range and quality
2. `store_search` with "image" or "music" — hoping store apps expose richer functionality than MCP tools suggest
3. `create_classify_idea` — experiment with describing a creative project to see if the platform can scaffold something useful
4. `skill_store_list` — check if any skills add creator-relevant capabilities (e.g., image generation wrappers)
5. `bootstrap_status` — understand if there's a workspace-level unlock of creator tools I'm missing

I would **not** proactively touch the orchestrator, swarm, CRDT, netsim, BFT, causality, diff, testgen, session, or retro categories — they're categorically irrelevant to my work.

## Issues & Concerns

- **Core creative tools missing as MCP tools**: image-studio, page-builder, music-creator, audio-studio are listed as "recommended apps" but provide no MCP interface — the MCP layer is useless for my primary use cases
- **TTS is not an audio studio**: `tts_synthesize` returns base64-encoded audio with no mixing, trimming, effects, export format control, or project management
- **No image generation or editing tools at all**: not even a basic prompt-to-image call
- **No page building tools**: can't create or edit landing pages, blog posts, or web content through MCP
- **Blog tools are read-only**: `blog_list_posts` and `blog_get_post` exist but there's no `blog_create_post` or `blog_update_post`
- **180+ tools with no creator-specific category**: no "creative" or "media" category to filter by — I'm forced to scroll past distributed systems infrastructure
- **CRDT, BFT, netsim, causality tools have zero creator relevance** and dominate the list numerically
- **`chat_send_message` requires knowing model IDs**: exposing `claude-sonnet-4-6` etc. to non-developers is poor UX
- **`bootstrap_create_app` requires writing code**: the `code` parameter is required — this is a developer tool masquerading as a creator tool
- **No asset management for creative output**: `storage_upload_batch` exists but requires SHA-256 hashes and manifest diffs — not creator-friendly
- **No collaboration or audience engagement tools**: no comments, no subscriber management, no content scheduling
- **No social media publishing hooks**: can't push content to any distribution channel
- **`store_wishlist_add` with no direct install path to creative tools**: wishlist implies I want something I can't yet access — frustrating with no ETA or unlock path
- **`create_classify_idea` returns a category slug, not a usable artifact**: the output is abstract metadata, not a started creative project
- **No undo/version history for creative work**: if I create something, there's no way to iterate back
- **TTS voice IDs are opaque**: `tts_list_voices` presumably returns IDs but with no audio preview through MCP — I'm buying blind
- **`esbuild_transpile` and `build_from_github` in this list**: transpiling TypeScript is noise for a content creator; inclusion signals poor audience segmentation
- **`sandbox_exec` is explicitly fake**: the description says "SIMULATED EXECUTION ONLY — no code actually runs" — this is a deceptive tool that shouldn't be surfaced to users without a large warning
- **Permission system unclear**: `capabilities_request_permissions` exists — does unlocking categories reveal the missing creative tools? No documentation or hint
- **`dm_send` requires knowing the recipient's email**: no user directory or handle lookup, making it nearly useless for connecting with collaborators

---

# Persona: Enterprise DevOps (Round 1)

## Reaction

My first pass through this toolset is a mix of genuine interest and frustration. On the positive side, the **orchestration layer** (orchestrator, swarm, session) is more sophisticated than I expected from a platform like this — being able to create dependency-tracked execution plans, spawn and coordinate multiple agents, and log events per session maps reasonably well to how we think about multi-team pipeline coordination. The **observability category** (error_rate, observability_health, observability_latency, query_errors) and **audit_query_logs** are table stakes for enterprise, and I'm relieved they exist at all.

However, the toolset feels built for indie developers and AI tinkerers, not enterprise operations teams. The CRDT, BFT, netsim, and causality categories are intellectually fascinating distributed systems toys — but they're academic simulations, not operational infrastructure. The career/persona/learnit/beuniq categories are noise from my perspective. There's a lot of surface area here, but the depth where I actually need it (secrets management, real code execution, RBAC, alerting integrations) is shallow or absent. The `sandbox_exec` tool being labeled **"SIMULATED EXECUTION ONLY"** in its own description is alarming — that's a critical capability that doesn't actually work.

Overall: promising skeleton, not enterprise-ready.

## Proactivity

I'd explore aggressively but systematically. First pass would be:

1. **`observability_health` + `error_rate` + `tool_usage_stats`** — immediately check platform health before trusting it with anything real. Establish a baseline error rate and see what tools are actually being used vs. broken.
2. **`audit_query_logs`** — a DevOps instinct: check what's already been done on this platform, validate the audit trail is real, and check retention policies (90 days is borderline for enterprise compliance needs).
3. **`orchestrator_create_plan` → `orchestrator_dispatch` → `orchestrator_status`** — walk through a full plan lifecycle with a trivial task to validate the orchestrator actually works end-to-end.
4. **`swarm_health` + `swarm_get_metrics`** — see the swarm state before spawning agents into it.
5. **`capabilities_check_permissions`** — before going further, understand what I'm actually allowed to do.
6. **`storage_manifest_diff` + `storage_list`** — evaluate whether the storage layer is usable as a real artifact registry.

I'd hold off on the session/testgen/retro tools until the fundamentals check out.

## Issues & Concerns

- **`sandbox_exec` is explicitly fake** — the description says "SIMULATED EXECUTION ONLY — no code actually runs." This is a fundamental capability gap; without real execution, test automation and CI pipelines are theater.
- **No real secrets management** — `bootstrap_connect_integration` stores credentials in an "encrypted vault," but there's no rotation, no versioning, no audit trail specifically for secret access, and no integration with HashiCorp Vault, AWS Secrets Manager, or similar.
- **No alerting or notification hooks** — observability tools surface data but there's no way to trigger PagerDuty, OpsGenie, Slack, or email on threshold breaches.
- **Audit log retention is 90 days** — most enterprise compliance frameworks (SOC 2, PCI, HIPAA) require 1–3 years.
- **RBAC is unclear** — `permissions_list_pending` and `capabilities_request_permissions` suggest a permissions model, but there's no way to define roles, assign them to users/teams, or query who has what access. This is a blocker for multi-team use.
- **No deployment rollback primitive** — `storage_list` allows rollback inspection but there's no `storage_rollback` or deployment version pinning.
- **Workspace isolation is unverified** — it's unclear whether workspaces provide real tenant isolation or are just organizational labels over shared infrastructure.
- **`sandbox_exec` language is limited and simulated** — even if it were real, there's no mention of resource limits, timeouts, network isolation, or ephemeral filesystem guarantees.
- **Swarm and agents lack health SLAs** — `swarm_health` reports stuck/errored agents but there's no auto-recovery, restart policy, or escalation mechanism.
- **No webhook inbound capability** — no way to trigger MCP actions from external CI events (GitHub Actions, GitLab CI, Jenkins).
- **`bft_*`, `crdt_*`, `netsim_*`, `causality_*` are simulation toys** — not operational tooling; they bloat the tool namespace and risk confusion about what's production-grade vs. educational.
- **`billing_*` exposed directly to agents** — an autonomous agent with access to `billing_create_checkout` or `billing_cancel_subscription` is a spend/availability risk without additional approval gates.
- **No dependency graph for workspace tools** — can't tell which tools depend on which integrations being connected first.
- **Missing: certificate management, container registry access, log aggregation forwarding, infrastructure drift detection.**
- **`error_summary` and `query_errors` have no export format** — no CSV/JSON download, no Splunk/Datadog forwarding.

---

# Persona: Enterprise DevOps (Round 2)

## Reaction

A second pass reveals the tool surface is broader than useful. The observability tools (`mcp-observability`, `audit`), swarm coordination, and orchestration primitives are genuinely well-designed — these map directly to what I'd actually want for distributed agent workflows. But the signal-to-noise ratio is poor for enterprise use: career matching, persona quizzes, TTS, blog posts, and learning quizzes are irrelevant clutter that makes the capability surface feel unfocused.

The deeper concern is trust. `sandbox_exec` explicitly states *"SIMULATED EXECUTION ONLY — no code actually runs"* in its own description. That's an actively misleading tool. An operator following an orchestration flow who calls `sandbox_exec` thinking they're running validation code is getting synthetic output. That's not a minor caveat — it breaks any real CI pipeline use case built on top of it. The orchestration layer's credibility collapses around this.

The swarm and session system looks promising architecturally, but the cost tracking reads agent metadata rather than actual platform metering — so `swarm_get_cost` is best-effort at most, not audit-grade.

## Proactivity

High interest in a narrow set of tools. I'd systematically probe:

1. **`observability_health` + `error_rate` + `query_errors`** — baseline platform health before trusting anything else
2. **`audit_query_logs` + `audit_export`** — verify what's actually being captured and retention behavior
3. **`swarm_spawn_agent` → `swarm_health` → `swarm_get_metrics`** — validate whether the swarm layer can actually coordinate agents across a real deployment workflow
4. **`orchestrator_create_plan` → `orchestrator_dispatch` → `orchestrator_submit_result`** — test the dependency graph execution under a realistic multi-step task
5. **`byok_store_key` → `byok_test_key`** — verify key isolation before trusting any AI calls with org credentials
6. **`storage_manifest_diff` → `storage_upload_batch` → `storage_list`** — test artifact storage as a potential deployment output store

Everything else I'd deprioritize or ignore entirely.

## Issues & Concerns

- `sandbox_exec` is labeled *"SIMULATED EXECUTION ONLY"* but is exposed as an operational tool — this is fundamentally deceptive in an agentic pipeline and should either be removed or clearly namespaced as `sandbox_exec_demo`
- No actual code execution environment; the sandboxing primitives are effectively theater
- Audit log retention is hardcoded to 90 days — enterprise compliance (SOC2, ISO 27001) often requires 1-3 years; no configurable retention policy visible
- No SIEM/webhook integration for audit events — real-time export to Splunk, Datadog, or Elastic is absent
- Permissions system is human-approval-gated (`permissions_respond`) with no automated policy enforcement or OPA/policy-as-code integration
- No RBAC role definitions — `auth_check_route_access` checks a hardcoded path but there's no API to define or manage roles
- No SSO/SAML/OIDC tooling — enterprise auth requires federated identity, not just session tokens
- Workspace model is flat — no org hierarchy, no sub-team structure, no delegated administration
- `swarm_get_cost` reads agent metadata rather than authoritative platform metering — not suitable for chargeback or budget enforcement
- `byok_store_key` description says "encrypted at rest" with no specifics — no info on encryption standard, key derivation, or whether HSM/envelope encryption is used
- No rollback, blue/green, or canary deployment primitives — storage upload is append-only with no promotion/rollback workflow
- No CI/CD integration hooks (GitHub Actions, GitLab CI, Jenkins) — the orchestration tools are self-contained islands
- Career tools (`career_assess_skills`, `career_match_jobs`, `career_create_resume`, etc.) are completely irrelevant to enterprise ops and pollute the namespace
- Consumer tools (beUniq persona quiz, TTS, blog, learning quiz) add noise that degrades discoverability of actual platform capabilities
- CRDT, netsim, causality, and BFT tools are academic simulations with no connection to real infrastructure state — useful for education, misleading in a DevOps context
- No rate limiting information exposed — cannot enforce API budget controls or predict throttling behavior under load
- `context_index_repo` indexes GitHub repos but no authentication support — private repos are inaccessible, limiting real enterprise codebase analysis
- No incident management integration (PagerDuty, OpsGenie, VictorOps) — alerts from `error_rate` go nowhere actionable
- `orchestrator_dispatch` marks subtasks as dispatched but has no mechanism to actually invoke agents — the handoff between plan and execution is undefined
- No secrets rotation tooling — `bootstrap_connect_integration` stores credentials but there's no rotation, expiry, or audit trail for secret access

---

# Persona: Enterprise DevOps (Round 3)

## Reaction

By round 3, the novelty has worn off and the gaps are glaring. The platform has solid primitives — swarm orchestration, observability, audit logs, CRDT/BFT simulation tools — but it lacks the depth an enterprise DevOps team actually needs in production. The `sandbox_exec` being explicitly "SIMULATED EXECUTION ONLY" is a deal-breaker for any real ops workflow; I discovered this before, but it keeps irritating me. The tool count is impressive at face value but a significant fraction (learnit, career, quiz, beuniq, persona audits) is irrelevant noise for my role. Filtering signal from noise requires too much upfront mapping. More critically, I see recurring schema design problems — required fields that should be optional, opaque string-typed params — that suggest the API surface wasn't designed with enterprise ergonomics in mind.

## Proactivity

Round 3 focus: stress-test the observability and audit stack as my primary concern, then probe the orchestrator's failure handling.

1. **`observability_health` + `error_rate` + `query_errors`** — baseline the error landscape before touching anything else. Specifically looking for gaps in retention and real-time capability.
2. **`audit_query_logs` + `audit_export`** — verify 90-day retention is actually sufficient, probe what action types are logged (are MCP tool calls themselves audited?).
3. **`swarm_health` + `swarm_get_metrics` + `swarm_get_cost`** — check agent resource accounting. If I'm running 20 agents, I need cost visibility per agent and per session, not just totals.
4. **`orchestrator_create_plan` → `orchestrator_dispatch` → `orchestrator_submit_result`** — deliberately submit a failed subtask and see if retry/re-dispatch is possible or if the plan is dead.
5. **`capabilities_check_permissions` + `capabilities_request_permissions`** — understand the permission model before running anything with side effects.

## Issues & Concerns

- **`sandbox_exec` is explicitly fake** — "SIMULATED EXECUTION ONLY — no code actually runs." This is buried in the description, not surfaced prominently. Enterprise teams will invoke it expecting real execution. A deceptive API is worse than no API.
- **No RBAC model** — `permissions_list_pending/respond` is a request/approval workflow, not role-based access control. No way to define team roles, restrict tool categories by team member, or enforce least-privilege.
- **90-day audit log retention is hardcoded** — most enterprise compliance regimes (SOC 2, ISO 27001, HIPAA) require 1–3 years. No mention of export-to-SIEM or longer retention tier.
- **No real-time log streaming** — `query_errors` is batch polling. No tail/stream endpoint for live incident response.
- **No alerting or threshold configuration** — `error_rate` returns a number but there's no way to set thresholds or trigger notifications. PagerDuty/OpsGenie/Slack webhook integration absent.
- **`swarm_get_cost` marks `agent_id` as required** but the description says "Omit for swarm-wide totals" — contradictory schema, will cause confusion in automation.
- **`storage_list` marks `prefix`, `limit`, and `cursor` all as required** — pagination cursors can't be required on the first call. Broken API contract.
- **`workspaces_update` requires both `name` AND `slug`** — can't update just one field. Forces clients to read-then-write for every update.
- **No secrets rotation tooling** — `bootstrap_connect_integration` stores credentials but there's no mechanism to rotate, expire, or audit them post-storage.
- **No webhook/event subscription** — impossible to react to platform events asynchronously. Everything requires polling (e.g., `agent_inbox_poll`).
- **No blue-green or canary deployment tooling** — `store-ab` A/B testing only applies to store apps, not workloads or infrastructure.
- **`bootstrap_workspace` `settings` param is an opaque string** — zero schema documentation. Completely unvalidatable by clients. No IDE hints, no schema reference.
- **No Kubernetes, container, or infrastructure-as-code integration** — zero Terraform/Pulumi/Helm surface. Enterprise DevOps operates on infra, not just app code.
- **No CI/CD trigger mechanism** — can't kick off a GitHub Actions workflow, Buildkite pipeline, or deployment from MCP. The orchestrator plans are internal only.
- **`billing_cancel_subscription` is a destructive action accessible via MCP** — in an agentic context this could be triggered accidentally. No second-factor or out-of-band confirmation step.
- **`dm_send` accepts any email address with no domain restriction** — a compromised agent could exfiltrate data or spam external addresses. No audit trail specified for DMs.
- **No multi-region or data residency controls** — enterprise customers in EU/regulated markets need to know where data is stored. Completely absent from the surface area.
- **Reaction system (`create_reaction`)** is non-deterministic for ops — "logged for invocation" phrasing is vague. Does it actually fire? Is there guaranteed delivery? No SLA documented.
- **`chat_send_message` requires `model` and `system_prompt` as required fields** — forces every caller to re-specify model config rather than inheriting workspace defaults.
- **The CRDT/BFT/netsim/causality tool categories** are educational simulations, not production distributed systems primitives. They clutter the namespace for an ops engineer looking for real tooling.
- **No session quota or rate limit visibility** — how many concurrent swarm agents or orchestrator plans can I run? No tool to query limits.
- **`retro_analyze` requires a closed session** — can't run incremental retrospectives on live sessions for course correction mid-incident.

---

# Persona: Enterprise DevOps (Round 4)

## Reaction

By round 4, the novelty has worn off and the gaps are impossible to ignore. The toolset reads like a strong **developer productivity platform** that's been labeled enterprise-grade without fully earning it. The orchestration and swarm primitives are genuinely interesting — orchestrator plans with dependency tracking, swarm health monitoring, session-based multi-agent coordination — and if they work reliably, they'd be useful. But the observability layer is too shallow to trust, the auth model doesn't map to how large orgs actually operate, and discovering that `sandbox_exec` is **explicitly simulated** is a trust-breaking moment. The CRDT, netsim, causality, and BFT tool clusters feel like distributed systems educational toys dressed up as production primitives, which muddies the signal-to-noise ratio considerably.

## Proactivity

I'd start with the observability trifecta — `observability_health`, `error_rate`, `tool_usage_stats` — to establish a baseline before touching anything else. Then I'd probe the swarm: `swarm_health`, `swarm_get_metrics`, `swarm_list_agents` to see whether this is real infrastructure or a thin simulation layer. I'd specifically attempt `sandbox_exec` with a real script to confirm the "SIMULATED ONLY" disclaimer in practice, then file a bug via `report_bug` about the misleading tool name. Audit tooling (`audit_query_logs`) would be checked early for compliance viability. I would not invest time in CRDT/netsim/BFT until the core ops layer is validated.

## Issues & Concerns

- **`sandbox_exec` is fake** — the description literally says "no code actually runs" and returns "synthetic stdout/stderr." This is a critical misrepresentation for any ops or QA workflow expecting real execution.
- **No RBAC or team-level scoping** — there is no concept of org-level roles, team membership, or resource isolation. A single workspace owner model doesn't scale to enterprise teams.
- **No SSO/SAML support visible** — `auth_check_session` accepts a session token but there is no mention of OAuth2 flows, SAML, or service account provisioning, which are non-negotiable for enterprise IAM.
- **Audit log retention capped at 90 days** — many compliance frameworks (SOC2, ISO 27001, HIPAA) require 1–7 years. This is a hard blocker for regulated industries.
- **Swarm agents have no resource limits** — no CPU/memory quotas, no rate limits per agent, no cost caps visible. `swarm_get_cost` reads from metadata, meaning cost tracking is voluntary, not enforced.
- **No secret rotation tooling** — `bootstrap_connect_integration` stores credentials but there is no rotation schedule, expiry enforcement, or integration with external vaults (HashiCorp Vault, AWS Secrets Manager).
- **Storage has no environment separation** — no staging vs. production namespacing; `storage_list` mentions "rollback inspection" but there is no actual `storage_rollback` tool.
- **Observability is surface-level** — call counts and error rates with no distributed tracing, no span/trace correlation IDs, no P99 latency breakdowns, no anomaly detection.
- **Testgen tools generate code but there is no test runner** — `testgen_from_spec` and `testgen_from_code` produce test suites with no mechanism to execute them or feed results back.
- **No CI/CD integration hooks** — no webhook support, no git event triggers, no pipeline status callbacks. The orchestrator is an island.
- **CRDT/netsim/causality/BFT categories are simulations, not production primitives** — their presence alongside real ops tooling is confusing and misleading at enterprise evaluation time.
- **`billing_cancel_subscription` marks `confirm` as required** despite the description saying it defaults to preview behavior — schema and behavior are inconsistent.
- **No incident management or alerting integration** — no Slack/Teams webhooks, no PagerDuty routing, no on-call escalation. `dm_send` (email DM) is not a substitute.
- **Swarm replay (`swarm_replay`) with no integrity guarantees** — message history can apparently be read step-by-step but there is no mention of tamper-evidence or cryptographic log integrity.
- **Session metrics (`session_get_metrics`) with no SLO baseline** — metrics are returned but there is no way to define or alert on SLO thresholds within the platform.
- **No concept of change freeze windows or deployment gates** — essential for enterprise change management processes (CAB approvals, maintenance windows).
- **`capabilities_request_permissions` creates an "approval request for the user"** — in enterprise, approvals need to route through an access review workflow, not a single user inbox.
- **No workspace-level audit isolation** — `audit_query_logs` appears to be per-user, not per-workspace/org, making cross-team compliance reporting impractical.
- **BYOK key storage with no key usage logging** — `byok_list_keys` shows dates but there is no per-key usage audit trail, which is required for key accountability.

---

# Persona: Growth Leader (Round 1)

## Reaction

My immediate reaction is: **this is a developer platform that has bolted on some business tools as an afterthought.** The sheer volume of tools (80+) is more paralyzing than empowering from a growth leader's perspective. I came here because I was told spike.land could help me grow my team's reach through social, content, and brand intelligence — but what I see is a sea of distributed systems primitives (CRDT, BFT consensus, network simulation, causality clocks) that have zero relevance to my job.

The career tools (`career_assess_skills`, `career_match_jobs`, `career_get_learning_path`) are legitimately interesting for team scaling — I could use these to benchmark hiring targets or create upskilling paths. The store ecosystem (searching and installing apps like `social-autopilot`, `brand-command`, `content-hub`) is where I'd actually expect my value, but those recommended apps aren't native tools — they're store apps I'd have to install and then somehow access through a different interface. That indirection is a meaningful friction point.

The platform feels powerful for a senior engineer building distributed systems. For me, it feels like walking into a machine shop when I needed a marketing agency.

## Proactivity

I'd explore at a moderate pace — not impulsive, but purposeful. My first moves:

1. **`store_search`** with queries like "social", "brand", "content", "analytics" — I want to find the recommended apps and anything adjacent before committing to anything.
2. **`store_app_install`** for `social-autopilot`, `content-hub`, `brand-command`, and `career-navigator` — these were specifically recommended for my persona, so I'd install all four immediately.
3. **`billing_list_plans`** then **`billing_status`** — before going deep, I need to know what tier I'm on and what's gated.
4. **`career_assess_skills`** — I'd test this to see if I could use it as a lightweight talent assessment tool when evaluating candidates or planning team growth.
5. **`bootstrap_status`** — understand my workspace state before investing more time.

I would *not* touch the orchestration, CRDT, BFT, netsim, causality, or diff tools. They're irrelevant noise for my role.

## Issues & Concerns

- No native social media tools — the recommended apps (social-autopilot, brand-command) appear to live in a separate store layer, not as first-class MCP tools I can call directly
- No CRM, pipeline, or revenue tracking tools anywhere in the catalog
- No team analytics — I can't see headcount, productivity, or growth metrics for my team through this interface
- The 80+ tool catalog has no grouping or filtering when first encountered — overwhelming without a "role-based view"
- Highly technical tools (CRDT, BFT, netsim, causality) pollute the namespace for non-engineering users with no apparent way to hide them
- `store_app_install` installs apps, but it's unclear how I'd actually *use* those apps afterward via MCP — is there a separate tool namespace that unlocks post-install?
- `billing_create_checkout` requires me to supply `success_url` and `cancel_url` — odd that a user-facing tool pushes redirect URL plumbing onto the caller
- No brand monitoring, keyword tracking, or social listening tools in the native catalog
- `career_*` tools are framed around individual job-seekers, not managers scaling a team — the persona mismatch is notable
- `chat_send_message` exists but requires me to specify a model — a growth leader shouldn't need to know Claude model IDs
- No onboarding flow surfaces — `bootstrap_status` exists but I was never guided through it; discovery is entirely self-directed
- The `beuniq_*` persona quiz tools seem like they could surface relevant tools for me, but I wasn't directed to start there
- `reminders_create` requires ISO 8601 date format — no natural language date parsing, which is a usability regression for non-technical users
- No content calendar, publishing schedule, or campaign tracking tools visible
- `audit_*` tools under the persona category are clearly internal QA infrastructure exposed at the top level — confusing and should be hidden from end users

---

# Persona: Growth Leader (Round 2)

## Reaction

Having revisited this toolset with fresh eyes, my frustration is sharper. The platform's identity crisis is glaring: it markets itself to me with apps like `social-autopilot` and `brand-command`, yet the MCP layer exposes almost none of that. What I get instead is a distributed systems laboratory — CRDT replica sets, Byzantine fault tolerance clusters, Lamport clocks, network partition simulators. These are extraordinary tools for an infrastructure engineer. For a growth leader trying to scale team reach and revenue, they're noise.

The tools that *are* relevant to me — career assessment, store browsing, billing — feel like table stakes, not differentiators. The swarm/orchestration category is genuinely intriguing (multi-agent delegation could automate growth workflows), but the abstraction is so raw and undocumented that I'd need an engineer to make sense of it. I'm being handed a physics engine when I asked for a car.

## Proactivity

I would explore in this order, with diminishing enthusiasm:

1. **`store_search` / `store_featured_apps`** — Find those recommended apps (social-autopilot, content-hub) since they're not first-class MCP tools. This is the first workaround I'd have to do, which already signals friction.
2. **`career_get_jobs` / `career_assess_skills`** — Relevant for team scaling, though they're clearly designed for individual job seekers, not hiring managers.
3. **`swarm_spawn_agent` + `swarm_delegate_task`** — The only genuinely growth-adjacent angle: can I set up an agent swarm to automate content or outreach pipelines? I'd test this, but I'd hit a wall without documentation.
4. **`billing_list_plans`** — Before investing time, I need to know what tier unlocks what. The free/pro/business distinction is opaque from the tool descriptions alone.
5. I would **stop before touching** CRDT, BFT, netsim, or causality tools. They have zero relevance to my role.

## Issues & Concerns

- The recommended persona apps (`social-autopilot`, `brand-command`, `content-hub`) are not exposed as MCP tools — they require an extra store-search hop just to find them, breaking the "here's what's relevant to you" promise
- No social publishing, scheduling, or monitoring tools in the MCP layer at all
- No CRM, pipeline, or revenue tracking integrations (HubSpot, Salesforce, etc.)
- `sandbox_exec` silently returns **simulated output only** — this is buried in the description and is a significant trust-breaking gotcha
- `billing_create_checkout` requires `success_url` and `cancel_url` as required fields, forcing me to have a redirect destination ready before I can even browse plans — cart before horse
- `career_*` tools are framed around individual job seekers, not hiring managers or team builders; no way to post roles, screen candidates at scale, or track pipeline
- `workspaces_update` marks both `name` and `slug` as required even for partial updates — can't rename without also re-slugging
- No team membership or role management beyond workspace owner — I can't invite colleagues or set permissions
- `auth_check_session` requires a session token as input, but there's no `auth_login` or `auth_signup` tool — where does the token come from?
- The swarm/orchestration categories are powerful but have no onboarding scaffolding — no example workflows, no "start here" tool
- `bootstrap_create_app` says "first-time setup" but requires a `codespace_id` as input — circular dependency for new users who have no codespace yet
- No webhook or event subscription tools — I can't react to external signals (new lead, social mention, form submission)
- No analytics or KPI dashboard tools; `tool_usage_stats` and `observability_*` track MCP calls, not business metrics
- Pricing tiers (`pro`, `business`) are named but their differences aren't retrievable without calling `billing_list_plans` separately — no inline context
- The CRDT, BFT, netsim, causality, and diff categories occupy roughly 30% of the tool surface area and are completely irrelevant to this persona segment
- No content calendar, brand asset management, or social listening functionality
- `tts_synthesize` returns base64 audio with no playback mechanism described — dead end for a non-developer
- Rate limits, quota usage, and credit consumption are not observable through any tool

---

# Persona: Growth Leader (Round 3)
## Reaction

By round 3, the initial novelty has worn off and the pattern is clear: this platform is built by and for developers, not business leaders. The 200+ tools feel like wandering into a server room when you wanted a war room. The tools I actually need — social scheduling, brand mention alerts, content analytics, CRM hooks, team performance dashboards — simply don't exist here. What does exist in abundance: distributed systems simulators (CRDT, BFT, netsim, causality), PBFT consensus clusters, and Byzantine fault tolerance tools. These are intellectually impressive and utterly irrelevant to scaling a brand.

The recommended apps for my persona (social-autopilot, brand-command, content-hub, career-navigator) are dangled as promises but have zero corresponding MCP tools. That's a broken contract between the persona system and the tool layer.

## Proactivity

Low, and declining. I'd grudgingly try `store_search` to see if social-autopilot or brand-command actually have installed functionality, then `store_app_install` if anything surfaces. I'd also poke `billing_list_plans` to understand if the tools I need are paywalled. That's about it — I've run out of tools that map to my actual work.

## Issues & Concerns

- The recommended apps (social-autopilot, brand-command, content-hub) have no corresponding MCP tools — this is misleading onboarding
- Zero social media tools: no posting, scheduling, engagement tracking, or platform analytics
- No brand monitoring: no mention tracking, sentiment analysis, competitor benchmarking
- No content pipeline tools: drafting, publishing, performance metrics, SEO insights
- No team/hiring tools despite "scaling teams" being a stated goal — `career_*` tools are for individual job seekers, not hiring managers
- `career_assess_skills` and `career_get_jobs` are backwards for this persona: I source talent, I don't apply for jobs
- The BFT, CRDT, netsim, and causality tool categories are expert distributed systems tooling with zero business growth relevance — they inflate the tool count without serving the persona
- `blog_list_posts` and `blog_get_post` are read-only — no publish, draft, or schedule capability
- No revenue metrics, funnel analytics, or conversion tracking
- `store_app_personalized` still shows recommendations based on install history I don't have — cold start problem never addressed
- `tts_synthesize` is interesting for content creation but requires you to already have the text and a voice ID — no discovery flow
- The A/B testing tools (`store_app_*` under store-ab) are for app code deployments, not marketing campaigns — naming causes confusion
- `audit_*` tools under the persona category appear to be internal QA tooling exposed to end users — this shouldn't be user-facing
- `bazdmeg_*` tools are a methodology enforcement system that means nothing to an external user with no context on what BAZDMEG is
- No export or reporting tools: I can't pull a weekly growth summary or share findings with my team
- The tool namespace is completely flat — 200+ tools with no grouping UX makes discovery painful without knowing what to search for
- `dm_send` requires knowing a recipient's email address — no directory or team roster to look up collaborators

---

# Persona: Growth Leader (Round 4)
## Reaction

Four rounds in, and the pattern is now undeniable: this MCP server is a developer platform that has been lightly rebranded with business-facing language. The recommended apps — social-autopilot, brand-command, content-hub, career-navigator — are conspicuously absent as actual MCP tools. I can browse the store to find them, but I cannot *operate* them through this interface. The promised value proposition and the delivered toolset are two separate things.

What's here is technically impressive but directionally wrong for my needs. I see distributed systems simulators (CRDT, netsim, BFT, causality), JavaScript transpilation, session orchestration for multi-agent coding — none of which maps to scaling revenue or brand reach. The career tools are intriguing but solve an individual's job search problem, not a growth leader's team-building or pipeline problem. The ratio of irrelevant-to-relevant tools is roughly 80/20, and not in my favor.

The audit/persona tools are actually the most interesting surprise — `plan_generate_batch_audit`, `audit_submit_evaluation`, `audit_compare_personas` suggest the platform has done structured UX research work. That's a lens I can appreciate. But it's one bright spot in an otherwise misaligned toolkit.

## Proactivity

Moderate-to-low. I'd start with three targeted probes:

1. `store_search` with queries like "social", "content", "brand", "analytics" — to map whether any of my recommended apps surface and what their actual MCP surface area is
2. `store_app_personalized` — to see if the platform has learned anything useful about my growth context from prior interactions
3. `bootstrap_status` — to understand what's already configured before committing time to setup

After that, I'd likely park the session. Without direct MCP tools for content scheduling, social listening, or revenue analytics, the platform requires me to first install apps and then hope they expose MCP tooling — a two-step leap of faith I'm not willing to make without evidence.

## Issues & Concerns

- Recommended apps (social-autopilot, brand-command, content-hub, career-navigator) have zero direct MCP tool representation — the store is a catalog, not an interface
- No social media scheduling, monitoring, or publishing tools whatsoever
- No revenue or pipeline analytics — `billing_status` is platform billing, not business KPIs
- No CRM or lead management integration
- No brand monitoring or sentiment analysis tools
- Career tools address individual job seekers, not growth leaders hiring and scaling teams
- CRDT, netsim, causality, BFT tools are deeply technical distributed systems simulations with no plausible growth use case — why are these surfaced to a business persona?
- `chat_send_message` is a raw Claude API call with no growth-specific context injection or memory
- `store_search` requires knowing the right search terms; no category browse for "marketing" or "growth" is explicitly listed
- Tool count (80+) creates cognitive overload; no persona-filtered view is offered at the MCP level
- `swarm_*` and `orchestrator_*` tools require understanding agent architecture before they're useful — steep onboarding cost
- `bootstrap_create_app` requires writing code — not accessible to a non-technical growth leader
- No webhook or automation triggers visible (e.g., post content when X event happens)
- `reminders_create` is a basic task tool; there's no project or campaign management layer above it
- The `beuniq_start` persona quiz could be genuinely useful for growth research but it's buried with no discoverability path from a growth context
- No direct message broadcast or team communication tools — `dm_send` is one-to-one only
- Audit tools (`audit_submit_evaluation`) look powerful for UX research but have no documentation path explaining how to initiate a batch from scratch
- Error rate and observability tools are platform-internal; no equivalent for tracking *my* content or campaign performance

---

# Persona: Hobbyist Creator (Round 1)

## Reaction

Honestly? Overwhelming and a little disheartening. As someone who just wants to make art, music, and fun digital things, I'm staring at a wall of tools that feel built for software engineers running distributed systems. CRDT replica sets, BFT consensus clusters, network topology simulation, causality clocks, PBFT consensus rounds — none of that means anything to me, and it takes up enormous mental real estate when I'm just trying to find image or audio tools.

The recommended apps for my persona — image-studio, music-creator, audio-studio, page-builder — aren't directly represented here as MCP tools. I'd have to hunt through `store_search` or `store_browse_category` just to get to what was supposedly curated for me. That's a disconnect: the platform promised creative tools "at my fingertips," but the actual MCP surface is 90% infrastructure.

The one genuinely exciting tool for me is `tts_synthesize` / `tts_list_voices` — that's immediately useful for voiceovers, narration, or fun audio experiments. `chat_send_message` is a baseline I'd use for creative brainstorming. Everything else is either irrelevant or requires too much context to be approachable.

## Proactivity

I'd explore cautiously and selectively. My first moves:

1. **`tts_list_voices` → `tts_synthesize`** — This is the most immediately tangible creative tool. I'd experiment with voices for a poem or short story narration.
2. **`store_browse_category` with "creative"** — Try to find image-studio, music-creator, audio-studio, page-builder and understand what they actually do.
3. **`store_featured_apps`** — See what's being promoted; gauge the platform's creative health.
4. **`create_list_top_apps`** — Find what other creators are actually building and using.
5. **`chat_send_message`** — Use AI to help brainstorm a creative project, then figure out which tools could support it.

I would not touch the swarm, CRDT, BFT, netsim, orchestrator, diff, or testgen categories at all. They feel like they belong in a different product.

## Issues & Concerns

- The recommended creative apps (image-studio, music-creator, audio-studio, page-builder) have **no direct MCP tools** — they're buried in the store, not exposed as first-class capabilities
- **Zero image generation or editing tools** in the MCP surface despite "image-studio" being the #1 recommended app for this persona
- **Zero music/audio creation tools** beyond TTS — no synthesis, no beat generation, no audio manipulation
- **No page-builder MCP tools** — another recommended app with no direct tooling
- The tool list is dominated (~60%+) by developer infrastructure categories (CRDT, netsim, BFT, causality, orchestrator, swarm, session, diff, testgen, retro) that are completely irrelevant to a hobbyist creator
- `sandbox_exec` explicitly says "SIMULATED EXECUTION ONLY — no code actually runs" — this is buried in a description and feels like a hidden gotcha
- `bootstrap_create_app` could be interesting for creative apps but requires knowing `codespace_id` with no guidance on how to get one
- The `career_*` tools are a jarring category for someone using a creative platform — feels like a different product entirely
- `bazdmeg_*` tools (faq, memory, gates) are opaque jargon with no explanation of what BAZDMEG means to a new user
- `capabilities_request_permissions` implies some tools are locked behind approval — unclear which ones or why, creates anxiety about what I can and can't do
- No **gallery, project save, or portfolio** tools — nowhere to collect and showcase creative work
- `store_app_personalized` supposedly uses "install history" but I haven't installed anything yet — cold start problem with no fallback explanation
- The auth tools require a `session_token` as a required field with no guidance on how to obtain one as a first-time user
- Tool count (~180+) is extreme — no categorized "getting started" path or beginner-friendly entry point for non-developers

---

# Persona: Hobbyist Creator (Round 2)
## Reaction

Coming back for a second look, I'm more frustrated than impressed. The recommended apps — image-studio, music-creator, audio-studio, page-builder — sound perfect for me. But when I scan the actual MCP tools, **none of those apps expose any tools here**. I can *install* them via `store_app_install`, but then what? There's no MCP surface for image generation, audio synthesis beyond basic TTS, music creation, or visual design. The gap between "recommended apps" and "tools I can actually invoke" is glaring.

The tool list reads like a distributed systems textbook: CRDT replica sets, Byzantine fault-tolerant clusters, network topology simulation, causality tracking, Lamport clocks. As a hobbyist making art and music, this is noise. Maybe 8-10 tools out of 150+ feel relevant to me. That ratio is poor UX.

The one creative-adjacent tool — `tts_synthesize` — returns base64-encoded audio with no way to play it, export it, or pipe it somewhere useful through MCP. It's a dead end.

## Proactivity

My exploration order would be:
1. `store_browse_category` with "creative" — confirm whether creative apps even exist
2. `store_search` for "image", "music", "audio" — see what's actually installed vs. promised
3. `store_app_install` on image-studio — then immediately discover there are no image MCP tools to call
4. `tts_list_voices` + `tts_synthesize` — the only real creative tool, but blocked by the base64 output problem
5. `create_classify_idea` with a creative project concept — mostly out of curiosity
6. `chat_send_message` as a fallback for brainstorming

After that, I'd stop. The tools don't support a creative workflow; they support a developer workflow.

## Issues & Concerns

- **Recommended apps have no MCP tools**: image-studio, music-creator, audio-studio, and page-builder are advertised for this persona but are entirely absent from the MCP tool surface
- **TTS output is unusable**: `tts_synthesize` returns base64 audio with no playback, download, or file-write mechanism — a dead end for any creative use
- **`sandbox_exec` is fake**: explicitly documented as "SIMULATED EXECUTION ONLY" — misleading for anyone trying to actually run or prototype creative code
- **No image generation, manipulation, or upload tools** in the MCP layer despite image-studio being the top recommended app
- **`storage_upload_batch` requires SHA-256 hashing**: not creator-friendly; assumes developer knowledge to do a pre-flight diff before uploading
- **`bootstrap_create_app` requires writing code**: blocks non-technical creators from the app creation flow
- **150+ tools, ~8 are relevant to this persona**: the cognitive load of scanning an irrelevant tool list is real friction
- **No way to interact with installed store apps through MCP**: `store_app_install` records an install but exposes no tools for the app's actual functionality
- **`byok_store_key` uses opaque jargon**: "BYOK" means nothing to a hobbyist creator; no inline explanation
- **Career, BFT, CRDT, netsim, causality tools**: completely irrelevant to a creative persona — suggests no tool filtering or persona-aware tool scoping
- **No canvas, drawing, MIDI, or audio waveform tools** anywhere in the list
- **`create_classify_idea` classifies but doesn't create**: the name implies generation; it just categorizes and suggests a template, adding false hope
- **Auth tools require a `session_token` as a *required* field**: poor DX if the platform is supposed to manage sessions automatically
- **No undo/versioning for creative work**: no concept of creative history, save states, or version rollback for assets

---

# Persona: Hobbyist Creator (Round 3)

## Reaction

Deeply frustrated this time around. After three rounds, the fundamental problem is unmistakable: spike.land explicitly recommends **image-studio, music-creator, audio-studio, and page-builder** for my persona — but not one of those tools appears in this MCP list. The creative surface area here is essentially one tool (`tts_synthesize`) buried under 200+ developer and distributed-systems tools. I came here to make things, and I'm looking at PBFT consensus clusters, CRDT replica sets, and Byzantine fault tolerance simulators.

The sheer volume makes it worse. 80+ tool categories with names like `bft_run_prepare`, `causality_compare_events`, and `netsim_partition_node` actively signal "this is not for you." Even the tools that sound approachable (`bootstrap_create_app`) require writing code — there's no visual, no template, no drag-and-drop equivalent. A hobbyist creator shouldn't need to understand codespace IDs to make a page.

The TTS tool is genuinely useful but crippled in context: no voice preview, no way to save or share output, no audio mixing, no integration with anything else a creator would do.

## Proactivity

Low-to-moderate, and targeted. I'd try:

1. `store_browse_category` with `creative` — to see if the store has anything that matches my actual needs before giving up
2. `store_search` with queries like "image", "music", "art" — hoping the apps exist even if the direct MCP tools don't
3. `tts_list_voices` then `tts_synthesize` — only creative tool available; I'd test it out of curiosity but wouldn't rely on it
4. `create_list_top_apps` — to understand what the platform actually delivers vs. what it promises

I would **not** touch the swarm, CRDT, BFT, netsim, causality, testgen, retro, session, diff, or career tools. They're invisible to me conceptually and practically useless for my goals.

## Issues & Concerns

- **Critical gap**: image-studio, music-creator, audio-studio, and page-builder are recommended to this persona but have zero MCP tool coverage — this is false advertising at the platform level
- **`sandbox_exec` is fake**: the description literally says "SIMULATED EXECUTION ONLY — no code actually runs" — this is a trap for any user who invokes it expecting real behavior; should be removed or renamed
- **`bootstrap_create_app` requires code**: a hobbyist creator cannot provide `code` and `codespace_id`; no template flow, no guided creation
- **Required fields that shouldn't be**: `storage_list` marks `prefix`, `limit`, and `cursor` as required but they're clearly optional filter params; same pattern appears across many tools (e.g., `reminders_list` requires `status`, `agents_list` requires `limit`) — bad schema design
- **`auth_check_session` requires `session_token`** as a required field — but the description says "Optional session token"; the schema contradicts the docs
- **No creative entry point**: no tool says "start here if you want to make art/music/content" — onboarding is undefined for this persona
- **TTS output is base64 audio with no playback path**: what do I do with it? No storage, no sharing, no integration described
- **160+ tools with no persona filtering**: a creator sees the same tool wall as a distributed systems engineer; overwhelming and alienating
- **`create_classify_idea` returns a category/template suggestion, not a live app**: the distinction between "classify" and "create" is unclear and the resulting workflow is opaque
- **`beuniq_start` persona quiz exists but has no apparent influence on tool recommendations**: I could complete the quiz and still see the same tool list
- **No way to save or share creative work** through MCP: no file export, no gallery, no sharing link generation
- **Store app ratings/wishlist exist but no install feedback loop**: I can wishlist image-studio but there's no MCP tool that actually invokes it
- **`report_bug` severity field is unvalidated in schema**: no enum provided — what values are valid?
- **Cognitive load from distributed systems tools**: CRDT, BFT, netsim, causality are impressive but collectively they drown out everything else; needs namespacing or a creator-mode filtered view

---

# Persona: Hobbyist Creator (Round 4)

## Reaction

Honestly? This is a developer platform wearing a creator costume. As someone who wants to make art, music, and content for fun, I'm staring at a wall of distributed systems primitives — CRDT replica sets, Byzantine fault-tolerant clusters, causality vector clocks — none of which I asked for or understand. The recommended apps for my persona are image-studio, music-creator, audio-studio, and page-builder, yet the *only* directly creative MCP tool exposed is `tts_synthesize`. That's one tool out of 80+.

The sheer volume is the first problem. This isn't empowering — it's alienating. A hobbyist doesn't want to scroll past `bft_run_full_round` and `netsim_partition_node` to find something useful. The signal-to-noise ratio for my use case is maybe 5%.

## Proactivity

Moderate-low. I'd start with the handful of things that look relevant:

1. `tts_list_voices` → `tts_synthesize` — the only creative production tool, so I'd try it immediately to narrate something
2. `store_browse_category` with "creative" — hoping the app store surfaces image-studio and friends
3. `create_classify_idea` — I'd throw a creative idea at it to see if it generates something
4. `chat_send_message` — fall back to just talking to Claude when everything else feels too technical
5. `store_skills_list` — on the off chance there are creator-focused skills

I would *not* explore the orchestrator, swarm, CRDT, BFT, netsim, causality, diff, testgen, retro, or session categories. That's roughly 60 tools I'd skip entirely.

## Issues & Concerns

- **The recommended creative apps (image-studio, music-creator, audio-studio, page-builder) have zero corresponding MCP tools** — they exist as web apps I apparently have to open in a browser, defeating the purpose of an MCP interface
- **`sandbox_exec` is fraudulent** — its own description says "SIMULATED EXECUTION ONLY — no code actually runs." That's buried in the description text, not surfaced as a warning. A creator following happy-path instructions would be confused why nothing works
- **`create_*` tools are about coding apps, not creating content** — the naming is a trap; `create_classify_idea` classifies a *code app* idea, not a creative project idea
- **80+ tools with no categorized onboarding or progressive disclosure** — a flat list is unusable at this scale for a non-technical user
- **Many required fields that should be optional** — `storage_list` requires `prefix`, `limit`, and `cursor` even for a basic listing; `reminders_create` requires `due_date` even if you just want a note
- **No image generation, editing, or upload tools directly in MCP** — the mcp-image-studio package exists in the codebase (visible in git status) but isn't registered here
- **No audio or music tools at all** — not even a placeholder
- **TTS has a 5000 character limit with no chunking tool** — a creator narrating long-form content hits this silently
- **`billing_cancel_subscription` is in the same flat list as creative tools** — dangerous destructive action with no visual separation from benign tools
- **`store_app_personalized` and `store_recommendations_get` overlap confusingly** — unclear which to call first or how they differ in practice
- **No way to save, export, or publish creative output through MCP** — even if I generated audio via TTS, there's no `storage_upload` for personal files without navigating the R2 manifest/diff flow (a 3-step developer process)
- **`beuniq_*` persona quiz tools are exposed at the same level as functional tools** — feels like internal testing infrastructure leaked into the public API
- **The career tools category is entirely irrelevant** — salary lookup, resume builder, and interview prep have nothing to do with hobbyist creating

---

# Persona: In-house Dev (Round 1)

## Reaction

My first reaction is **impressed but immediately skeptical**. There's clearly serious engineering here — the `testgen_*`, `session_*`, `orchestrator_*`, and `diff_*` clusters are exactly what I'd want to wire into a real team workflow. The MCP observability tools (`tool_usage_stats`, `error_rate`, `observability_health`) are a pleasant surprise — I can dogfood them to monitor my own MCP usage, which is clever.

But the volume is genuinely disorienting. 80+ tools with no hierarchy, no "getting started" entry point, and zero indication of what I'm allowed to call without hitting a permissions wall. The distributed-systems simulation cluster (CRDT, netsim, causality, BFT) feels like it belongs in a CS course, not a dev productivity server — it dilutes focus. And the moment I read `sandbox_exec`'s description — *"SIMULATED EXECUTION ONLY — no code actually runs"* — I lost trust in that entire category. A sandbox that doesn't execute code is a mockup, not a tool.

Net: powerful surface area, but rough edges that would make me hesitate before integrating this into a team workflow.

## Proactivity

I'd explore in this order, aligned with my goal of leveling up testing and ops:

1. **`testgen_from_code`** — paste a real module, see if the generated tests are usable or boilerplate noise. This is the highest-value test for me.
2. **`observability_health` + `tool_usage_stats`** — free ops dashboard; I want to know if this is already tracking anything useful.
3. **`orchestrator_create_plan`** — try decomposing a real ticket into subtasks to see if the dependency model is realistic or academic.
4. **`session_create` + `session_assign_role`** — evaluate whether this could replace our ad-hoc Slack-based pairing coordination.
5. **`diff_create` + `diff_merge`** — test conflict detection on a real multi-branch scenario.
6. **`retro_analyze`** — only after running a session; curious if the knowledge base accumulates anything actionable.

I'd skip `crdt_*`, `netsim_*`, `causality_*`, `bft_*`, `career_*`, `beuniq_*`, and `tts_*` entirely — none of those map to my workflow.

## Issues & Concerns

- **`sandbox_exec` is fake** — description explicitly says "no code actually runs." This is a showstopper and undermines the entire orchestration/sandbox category. Needs to be prominently flagged or removed.
- **ALL required arrays include everything** — optional parameters like `confirm`, `since`, `agent_id`, `status` are marked `required` in the schema. This will break typed MCP clients and signals schema carelessness.
- **No GitHub/GitLab integration** — for an in-house dev, PRs, issues, and branch workflows are the daily surface. The diff/session tools float in a vacuum without repo integration.
- **No CI/CD hooks** — can't trigger or observe pipelines; observability stops at MCP-level, not the build system.
- **No database tooling** — no query runner, migration helper, or schema viewer despite this being a core dev ops need.
- **`bazdmeg_*` requires knowing the BAZDMEG methodology** — no onboarding path within the MCP itself; landing on these tools cold is confusing.
- **Permission model is opaque** — `capabilities_check_permissions` exists, implying I might be blocked from some tools, but there's no indication of what tier/role I need or what I currently have.
- **`auth_check_session` requires `session_token` as required param** — but if I had the token I wouldn't need to validate it; circular UX.
- **Swarm tools (`swarm_spawn_agent`, `swarm_broadcast`) have unclear team use cases** — for a solo in-house dev, this feels like infrastructure I don't own.
- **No webhook/event integration** — tools operate in pull mode only; no way to subscribe to events or trigger reactions from external systems (despite `create_reaction` existing, it only reacts to other MCP tool events).
- **`create_reaction` template syntax (`{{input.x}}`) is undocumented** — no schema or examples for what variables are actually available.
- **Persona/audit cluster (`plan_generate_batch_audit`, `audit_submit_evaluation`)** is clearly internal spike.land tooling leaked into a general-purpose server — confusing for external users.
- **Discovery is broken** — 80+ tools in a flat list with no search, no categories surfaced natively, no "recommended for your role" path.
- **Latency/cost opacity** — no indication of which tools are expensive, slow, or rate-limited before calling them.

---

# Persona: In-house Dev (Round 2)

## Reaction

Second look, and the cracks are more visible. The breadth is impressive on paper — observability, test generation, distributed systems simulation, swarm orchestration — but the depth is uneven in ways that matter for daily production work. The `sandbox_exec` tool is the most glaring example: it's labeled as a code execution tool but the description quietly admits it's **simulated only**. That's a bait-and-switch for anyone trying to build an actual test-run workflow. Similarly, `testgen_from_code` generates tests but there's no runner — I'm handed a file and told good luck. For an ops-focused dev, this is the pattern that kills trust: tools that look like they close a loop but don't.

The academic tier (crdt, netsim, causality, bft) is genuinely interesting but tonally jarring. I'm here to ship features and keep prod stable; a full PBFT consensus simulator is not on my sprint board. It reads like the platform is trying to be a teaching tool and a production tool simultaneously, which creates identity confusion.

The `reactions` system (create_reaction, list_reactions) is the most underrated thing here and almost nothing in the docs draws attention to it. Automating tool chains without writing glue code is exactly what an in-house dev wants.

## Proactivity

High proactivity, but surgical. I'd start with:

1. **`tool_usage_stats` + `observability_health`** — before trusting any tool, I want to see what's actually being called and what's erroring. If error rates are high, I'm treating this as experimental.
2. **`testgen_from_code`** on a real module — specifically to evaluate output quality. I'd paste actual business logic and judge if the generated tests are naive happy-path stubs or genuinely useful.
3. **`create_reaction`** — wire `testgen_from_code` success → `session_log_event` to build an audit trail automatically. This is the composability story I'd want to validate.
4. **`audit_query_logs`** — check what's being logged about my own activity. Compliance matters; I need to know what's retained and for how long.
5. **`swarm_spawn_agent` + `session_create`** — explore whether this can replace our ad-hoc "assign Slack thread to person" workflow.

I'd deliberately skip the crdt/netsim/bft tier entirely on first productive use.

## Issues & Concerns

- **`sandbox_exec` is deceptively named** — "SIMULATED EXECUTION ONLY" should be in the tool name or at minimum a top-level warning, not buried in the description. This will waste developer time.
- **Test generation has no execution path** — `testgen_*` generates code but there's no tool to actually run it. The loop is broken.
- **Many required fields are clearly optional** — `storage_list` requires `prefix`, `limit`, `cursor` but these are obviously pagination/filter params. Forces callers to pass empty strings, which is awkward and error-prone.
- **`bazdmeg` is completely opaque naming** — no in-product explanation of what it stands for or why it exists. An in-house dev hitting this cold will skip it entirely.
- **No environment scoping (staging vs prod)** — every tool appears to operate against one environment. No way to safely test ops workflows without touching production state.
- **Audit log retention capped at 90 days** — most compliance frameworks (SOC 2, ISO 27001) require 1 year minimum. This is a blocker for regulated industries.
- **`byok_store_key` encryption model undocumented** — told keys are "encrypted at rest" but no info on key management, HSM use, or who can access them server-side. Security team will reject this without answers.
- **No webhook or push model** — everything is pull-based polling. For ops workflows, I need to react to events (deploy complete, test failed) without polling loops.
- **`dm_send` but no team/channel concept** — direct messages to individuals don't scale. No group messaging, no shared inbox for on-call rotation.
- **`swarm_*` and `session_*` are overlapping in unclear ways** — both model multi-agent work but with different APIs and data models. No guidance on when to use which.
- **`store-ab` tools are mixed into a dev-facing tool list** — A/B testing store app variants is a product/marketing concern. Its presence here adds noise for a developer focused on infra and testing.
- **`career_*` tools are entirely off-persona** — resume building and job matching have no place in a workflow tool for an employed developer. Significant scope bloat.
- **No rollback primitive** — `storage_upload_batch` deploys assets but there's no `storage_rollback`. List + manual re-upload is not a rollback strategy.
- **`capabilities_request_permissions`** implies a permission gating system, but there's no documentation on what's gated, what the approval SLA is, or who approves. Blocks self-service adoption.
- **`retro_analyze` requires a `session_id`** — forces you into the session workflow to get retrospective value, even if you want to analyze work done outside the platform.

---

# Persona: In-house Dev (Round 3)
## Reaction

By round 3, the honeymoon phase is over. The surface area is enormous — easily 200+ tools — but several cracks are showing up that make me skeptical of the platform's production readiness for a real dev team.

The tools I actually care about (`testgen_*`, `session_*`, `swarm_*`, `orchestrator_*`, `observability_*`) exist and look genuinely useful in isolation. But the platform feels like it was designed to impress in a demo rather than hold up under daily ops use. The fatal example: `sandbox_exec` openly documents itself as **"SIMULATED EXECUTION ONLY — no code actually runs"** — yet it's positioned as a sandbox tool. That's not a sandbox. That's theater. If I tried to build an automated test pipeline on top of that, I'd have a bad time.

The `career_*`, `beuniq_*`, `bft_*`, `causality_*`, `netsim_*`, and `crdt_*` categories feel like academic experiments bolted onto a developer workflow tool. They dilute the signal-to-noise ratio considerably.

## Proactivity

High for a narrow set of tools. I'd immediately target:

1. **`testgen_from_code`** — run it against a real service file to see if the output is actually usable or just scaffolding boilerplate
2. **`observability_health` + `tool_usage_stats` + `error_rate`** — check what's actually being used and where failures are clustering before trusting anything else
3. **`orchestrator_create_plan` → `orchestrator_dispatch` → `orchestrator_submit_result`** — trace a full plan lifecycle to see if dependency resolution actually works
4. **`audit_query_logs`** — see if real audit trails are being captured before recommending this to my security team
5. **`session_create` + `session_dispatch_task`** — test multi-agent coordination to see if it has real value or is just a messaging bus with extra steps

I would skip: all `career_*`, all `persona_*`/`beuniq_*`, `netsim_*`, `bft_*`, `crdt_*`, `causality_*` — zero relevance to my role.

## Issues & Concerns

- **`sandbox_exec` is fake** — "SIMULATED EXECUTION ONLY" buried in the description, not the tool name. This is misleading and blocks any real CI automation use case.
- **No actual code runner** — `esbuild_transpile` + `sandbox_exec` (fake) is the only pipeline. There's no way to actually execute the tests generated by `testgen_*`.
- **`testgen_*` output is disconnected** — generates test suites but there's no path to run, validate against a real test runner, or get coverage reports back.
- **Undocumented parameters** — `storage_manifest_diff` and `storage_upload_batch` both have `"description": ""` for their `files` parameter. I have no idea what schema `files` expects.
- **Overly aggressive `required` fields** — `agent_inbox_poll` marks `since` and `agent_id` as required even though both are clearly optional filters. Same pattern across many tools.
- **`workspaces_update` requires all fields** — must pass both `name` and `slug` even for a single-field update. No PATCH semantics.
- **`context_pack` scoring is too shallow** — "keyword matching + boosting src directories" won't give me useful file selection for a real monorepo with 25 packages.
- **No GitHub/VCS integration** — no tools for PR status, CI run results, issue tracking, or branch management. For an in-house dev this is table stakes.
- **No webhook or event-driven hooks** — can't trigger workflows when CI fails, deploy succeeds, etc. The `reactions` category exists but only reacts to internal tool events.
- **`chat_send_message` is non-streaming only** — blocks on long responses and gives no progress feedback. Unusable for complex tasks.
- **200+ tools with no grouping or discovery UX** — no way to say "show me ops tools" or "show me testing tools" from within the tool itself. `capabilities_check_permissions` helps slightly but not enough.
- **`store-ab` A/B testing infrastructure** — why is app store A/B variant tracking exposed as MCP tools to developers? This feels like internal platform plumbing leaked into the public API.
- **`bazdmeg_*` is opaque** — BAZDMEG is a proprietary methodology with no documentation accessible from the tools themselves. If I'm new, these tools are unusable.
- **Retro tools require a completed session ID** — `retro_analyze` only works post-session. No way to do mid-session health checks or course corrections.
- **`swarm_get_cost` reads usage from agent metadata** — self-reported cost data from agents is not trustworthy for billing or budgeting.
- **No rate limit or quota information** — `billing_status` shows tier but nothing about per-tool limits, which matters for ops use at scale.
- **`diff_*` tools are isolated from git** — operates on in-memory changesets with no git integration. Can't open a PR or apply a patch to an actual repo.
- **`tts_synthesize` returns base64 audio** — in a developer ops context this is useless without a way to play or store the output. Feels misplaced in this tool suite.
- **Audit logs retained only 90 days** — insufficient for compliance use cases (SOC2, ISO27001 typically require 1 year+).
- **`session_assign_role` requires knowing an `agent_id` upfront** — but agents are often ephemeral; this creates a chicken-and-egg dependency with `swarm_spawn_agent`.

---

# Persona: In-house Dev (Round 4)

## Reaction

By round 4 I'm past the "wow, lots of tools" phase and into critical-mode. The surface area is genuinely impressive — testgen, diff/merge, sessions, swarm, observability — but the cracks are starting to show. `sandbox_exec` is explicitly labelled **"SIMULATED EXECUTION ONLY — no code actually runs"**. That's a dealbreaker buried in a description. I can generate tests with `testgen_from_code` but I can't run them. I can create diffs but they're disconnected from any real git repo. The pattern keeps repeating: plausible-looking ops tools that stop just short of doing real work. For an in-house developer this is frustrating. I'm also increasingly annoyed by the noise — career assessment, TTS synthesis, persona audits, beUniq onboarding quizzes — none of which belong in a developer workflow MCP and all of which consume mental bandwidth scanning the list.

## Proactivity

I'd go straight for the tools most likely to have real integration value with my existing stack:

1. **`observability_health` + `error_rate` + `query_errors`** — check whether these actually query my services or just spike.land's own internals
2. **`testgen_from_code`** — paste real source, evaluate quality of generated tests, then immediately realize there's no `testrun_*` companion
3. **`session_create` → `session_assign_role` → `session_dispatch_task`** — probe whether this is real agent orchestration or a state tracker
4. **`context_index_repo`** — try with an internal GitHub repo; immediately hit the question of private repo access
5. **`diff_create` + `diff_merge`** — evaluate as a lightweight alternative to manual conflict resolution in multi-agent workflows

I would not explore CRDT, causality, BFT, netsim, career, quiz, TTS, or persona tools — wrong domain entirely.

## Issues & Concerns

- **`sandbox_exec` is fake** — "SIMULATED EXECUTION ONLY" buried in the description; this should be a first-class warning or the tool should be removed, not presented alongside real tools
- **No `testrun_*` tools** — can generate tests but not execute them; the loop is incomplete and useless without execution
- **observability tools appear to cover only spike.land MCP itself**, not my application — `tool_usage_stats` tracks MCP call counts, not my service's metrics
- **`context_index_repo` requires a GitHub URL** — private/enterprise GitHub repos and internal monorepos are unaddressed
- **`diff_create` / `diff_apply` operate on in-memory file contents** — completely disconnected from git; no way to commit, push, or PR from results
- **`swarm_spawn_agent` registers a record but gives no clarity on what runtime the agent uses** or where it actually executes
- **`session_create` / `session_dispatch_task` workflows are state-tracking only** — no evidence real compute is dispatched
- **`billing_cancel_subscription` is exposed as a plain MCP tool** — a destructive billing action callable from any agent context is a serious authorization risk
- **`auth_check_session` lists `session_token` as `required`** — if I'm already authenticated, why do I need to supply my own token?
- **No CI/CD integration** — no tools to trigger builds, check pipeline status, view test results from existing CI
- **No webhook or event subscription mechanism** — all tools are pull-based; no way to react to real-time system events
- **`store_app_deploy` + A/B variant tools** feel like internal spike.land admin plumbing exposed as public API — confusing for in-house devs with no store apps
- **Career tools (ESCO, salary, resume, job matching)** and **TTS, quiz/learn, beUniq, persona audit** tools are completely off-persona and inflate the list by ~30 irrelevant entries
- **`create_reaction` template syntax (`{{input.originalArg}}`)** is undocumented anywhere in the schema — no reference implementation or examples
- **No rate limit information** on any tool — I could silently get throttled mid-workflow with no indication of quotas
- **`retro_analyze` is scoped only to spike.land sessions** — no way to feed in my own project retrospective data
- **`bazdmeg_superpowers_gate_check`** requires a sessionId but there's no guidance on where that session ID comes from unless you already use the BAZDMEG methodology internally
- **Tool count (~200) with no priority tiers or "start here" grouping** — onboarding friction is high; a developer needs a "core 10" fast path

---

# Persona: ML Engineer (Round 1)

## Reaction

As an ML engineer, my first reaction is **breadth without depth**. There are 180+ tools here, which is impressive, but almost none map directly to my daily work: model serving, experiment tracking, dataset management, GPU scheduling, feature stores, or model registries. The platform feels built for a general SaaS developer audience, with ML engineers as an afterthought.

The `orchestrator_*` and `swarm_*` tools caught my eye immediately — multi-agent pipeline coordination is genuinely useful for ML workflows. The observability tools (`observability_health`, `error_rate`, `tool_usage_stats`) are directionally right. But when I hit `sandbox_exec` and read "SIMULATED EXECUTION ONLY — no code actually runs," that's a hard stop. The core primitive I need — actually executing ML code — is faked.

The distributed systems tools (`crdt_*`, `netsim_*`, `causality_*`, `bft_*`) are academically interesting but feel like they belong in a CS course, not a production ML platform. The career, persona/beUniq, and quiz tools are complete noise for me.

Net: powerful for general agent orchestration, thin for actual ML engineering tasks. Feels like a v0.1 platform that hasn't yet figured out its ML vertical.

## Proactivity

I'd explore in this order:

1. **`observability_health` + `error_rate`** — baseline platform health before trusting it with anything real
2. **`ai_list_providers` + `ai_list_models`** — what inference endpoints are available? Can I route to my fine-tuned models?
3. **`orchestrator_create_plan`** — test if I can model a real ML pipeline (data → train → eval → deploy) as a plan
4. **`swarm_spawn_agent` + `swarm_delegate_task`** — see if I can spin up parallel eval workers
5. **`sandbox_create` + `sandbox_exec`** — immediately disappointed by the simulation disclaimer
6. **`storage_manifest_diff` + `storage_upload_batch`** — check if I can use this as artifact storage for model checkpoints
7. **`retro_search_knowledge`** — see if there's any ML-specific institutional knowledge baked in

I would **not** proactively touch `crdt_*`, `netsim_*`, `bft_*`, `career_*`, `beUniq_*`, `quiz_*`, or `learnit_*` — these are irrelevant to my goal.

## Issues & Concerns

- **`sandbox_exec` is simulated** — explicitly labeled "no code actually runs," making it useless for ML experimentation, training runs, or validation scripts
- **No experiment tracking** — no MLflow, W&B, or equivalent; nowhere to log runs, params, metrics, or artifacts
- **No model registry** — can't version, stage, or promote models (dev → staging → prod)
- **No GPU/compute resource management** — no way to allocate, schedule, or monitor compute
- **No dataset or feature store tooling** — no data versioning, lineage tracking, or feature pipelines
- **`ai_list_models` / `ai_list_providers`** — unclear if I can register my own fine-tuned endpoints or only use platform-provided models
- **No pipeline scheduling** — no cron or event-triggered pipeline runs; the `reminders_*` tools are a poor substitute
- **No ML-specific A/B testing** — `store_app_*` A/B tools are for UI variants, not model comparison
- **No streaming or real-time metrics** — `observability_latency` uses "daily rollup data," too coarse for monitoring inference latency SLOs
- **`auth_check_session` requires `session_token` as a required field** — unclear how to obtain this token; no onboarding guidance in the tool descriptions
- **Tool count (180+) is overwhelming with no ML-specific category** — no filtering or grouping for "ML workflows"; discovery requires reading all descriptions
- **`bootstrap_connect_integration` credentials field is just a string** — no schema for what formats are accepted; opaque for integrating ML platforms like Databricks or SageMaker
- **`error_summary` / `query_errors`** — require knowing service names upfront; no `list_services` tool to discover what's available
- **`swarm_get_cost` reads from "agent metadata"** — token cost tracking appears manual, not automatic; no actual billing integration for compute costs
- **`storage_list` prefix/limit/cursor are required fields but logically should be optional** — forces awkward empty-string workarounds for a simple "list everything" call
- **No webhook or event system** — no way to trigger downstream actions when a pipeline stage completes without polling
- **CRDT, netsim, BFT tools** — zero relevance to ML production workflows; add cognitive overhead when scanning the tool list
- **`testgen_from_code`** generates tests but has no ML-specific awareness** — won't understand model evaluation patterns, data validation, or statistical test cases

---

# Persona: ML Engineer (Round 2)

## Reaction

Coming back with fresh eyes and more skepticism. The toolset is broader than most MCP servers I've seen — 80+ tools is ambitious — but for an ML engineer specifically, the coverage is superficially appealing and practically thin. The orchestrator, swarm, session, and sandbox categories looked promising in round 1. On closer inspection:

- `sandbox_exec` is explicitly labeled **"SIMULATED EXECUTION ONLY — no code actually runs."** This kills the core use case. A sandbox that doesn't execute code is a documentation generator, not a development environment.
- The `swarm` system looks like it tracks agents in a database, not actual compute workers. There's no way to attach real GPU processes, containers, or training jobs to these agent records.
- The AI gateway (`ai_list_providers`, `ai_list_models`) lets me see what models exist but gives me no way to actually evaluate them systematically — no prompt batching, no benchmark runners, no latency profiling beyond aggregate MCP observability.
- The CRDT, netsim, causality, and BFT categories are academic simulation toys. Interesting for distributed systems coursework, irrelevant to production ML pipelines.
- There is no model registry, no experiment tracker, no dataset versioning, no feature store, no hyperparameter search — the entire MLOps surface area is absent.

The platform feels designed for a full-stack developer or a DevOps persona. The ML engineer label in the recommended apps is aspirational, not descriptive.

## Proactivity

I'd focus my second-round exploration on stress-testing the orchestration layer with a real workflow — e.g., defining a multi-step pipeline (data validation → training → eval → deploy) via `orchestrator_create_plan`, spawning swarm agents for each step, and checking whether the dependency tracking actually works end-to-end. I'd also probe `observability_latency` and `error_rate` to see if the monitoring is genuinely useful or just call-count bookkeeping. I'd try `retro_analyze` on a completed session to see if it surfaces actionable insights or generic text. I'd skip the CRDT/BFT/netsim tools entirely — zero ML relevance. I'd reluctantly test `chat_send_message` as a last resort for anything requiring actual computation, which is a red flag in itself.

## Issues & Concerns

- **`sandbox_exec` is fake** — documented as simulated-only, making the entire sandbox category useless for running training scripts, data pipelines, or model inference
- **No real compute attachment** — swarm agents are database rows, not actual worker processes; no way to bind to a GPU instance, container, or Kubernetes pod
- **No experiment tracking** — no equivalent of MLflow runs, wandb experiments, or Comet.ml; nowhere to log metrics like loss, accuracy, or AUC across epochs
- **No model registry** — no versioned model artifact storage, no promotion workflow (staging → production), no rollback by model version
- **No dataset management** — `storage_upload_batch` handles R2 assets, not partitioned datasets with schema validation, lineage, or versioning
- **No feature store** — no way to define, materialize, or serve features; critical for production ML
- **AI gateway is read-only** — `ai_list_models` shows available models but provides no batch evaluation, A/B comparison between models, or structured benchmark tooling
- **Observability is MCP-layer only** — `tool_usage_stats` and `error_rate` track MCP calls, not ML metrics like inference latency, model drift, data distribution shifts, or GPU utilization
- **`testgen_from_code` generates unit tests, not ML tests** — no support for generating data validation tests, model performance regression tests, or fairness checks
- **Orchestrator has no ML-native task types** — `orchestrator_create_plan` is generic text; no first-class support for training steps, evaluation gates, or deployment approvals
- **No pipeline DAG visualization or persistence** — plans exist in memory per session; no durable pipeline definitions that survive restarts
- **CRDT/netsim/causality/BFT are misplaced** — these are distributed systems teaching tools, not production infrastructure; they inflate the tool count without adding ML value
- **`retro_analyze` depends on session history** — if I didn't instrument every action through spike.land sessions, the retrospective has no data to analyze; most ML work happens outside this platform
- **No hyperparameter search tooling** — no grid search, random search, or Bayesian optimization primitives
- **No data pipeline connectors** — no S3, GCS, BigQuery, or Snowflake integrations; ingestion and transformation are entirely out of scope
- **`byok_store_key` is useful but incomplete** — I can bring my Anthropic/OpenAI key, but there's no mechanism to route different workloads to different providers based on cost or capability
- **Career and persona audit tools (30+ tools) are completely irrelevant** to ML engineering and dilute discoverability of actually useful tools
- **No role-based access for ML artifacts** — no way to restrict who can promote a model to production or modify a pipeline definition

---

# Persona: ML Engineer (Round 3)

## Reaction

By round 3, the novelty has worn off and the gaps are glaring. The tool surface is genuinely large — 180+ tools — but for an ML engineer deploying models to production, this feels like borrowing a Swiss Army knife when you needed a torque wrench. The orchestrator, swarm, and session tools looked promising at first glance, but closer inspection reveals they're collaborative coding primitives dressed up in ML-sounding language. There's no concept of a model, a dataset, a training run, an experiment, or a serving endpoint anywhere in this API surface.

The `sandbox_exec` description openly admits it's **"SIMULATED EXECUTION ONLY — no code actually runs."** That's disqualifying for an ML engineer. I can't validate a pipeline, test a preprocessing step, or confirm a model loads correctly if the execution environment is theatrical.

The CRDT, netsim, BFT, and causality tool families are academically interesting distributed systems simulators, but they contribute to cognitive overload without offering anything I'd reach for in a production ML context. They dilute the signal.

## Proactivity

Low-to-medium. I'd spend 15-20 minutes probing the most plausible tools before concluding the platform isn't ML-native:

1. **`ai_list_providers` + `ai_list_models`** — First stop. Does it expose anything beyond chat completions? Can I do batch inference, embeddings, or fine-tuning calls?
2. **`orchestrator_create_plan` → `orchestrator_dispatch` → `orchestrator_status`** — Try to model a simple two-stage pipeline (preprocess → train). Check if dependency graphs support fan-out/fan-in patterns.
3. **`swarm_spawn_agent` + `swarm_delegate_task` + `swarm_get_metrics`** — Simulate parallel hyperparameter sweep workers. Check if cost tracking in `swarm_get_cost` is granular enough to track per-run compute.
4. **`observability_health` + `error_rate` + `observability_latency`** — Evaluate if these are useful for monitoring model serving latency, not just MCP tool latency.
5. **`session_create` + `session_log_event`** — Try to use a session as a training run tracker. Would likely hit limitations immediately.

I would **not** explore: beuniq, career, quiz, learnit, tts, blog, bazdmeg FAQ — zero relevance to my use case.

## Issues & Concerns

- **`sandbox_exec` is explicitly fake** — documentation says "no code actually runs." This makes the entire sandbox category useless for ML pipeline validation or dependency testing.
- **No model registry** — nowhere to register, version, tag, or retrieve trained models.
- **No experiment tracking** — no concept of runs, metrics (loss, accuracy, AUC), hyperparameters, or artifact logging. MLflow/W&B equivalents entirely absent.
- **No data pipeline primitives** — no dataset versioning, no feature store, no ETL step definitions, no data validation hooks.
- **No compute/resource management** — no GPU allocation, no queue depth, no spot instance lifecycle, no memory/VRAM limits.
- **Orchestrator has no retry/backoff configuration** — production ML pipelines need fault tolerance; a subtask that fails due to OOM needs restart semantics, not just a status flag.
- **No streaming inference support** — `chat_send_message` is explicitly non-streaming, problematic for long-form generation or token-by-token monitoring.
- **`ai_list_models` likely returns only chat models** — no embeddings, no image/audio models, no indication of context lengths or rate limits per model.
- **Swarm cost tracking reads from metadata** — this implies cost is self-reported by agents, not metered by the platform. Untrustworthy for budget governance on multi-run sweeps.
- **No webhook or event-driven trigger mechanism** — ML pipelines need to react to external events (data landing in S3, model evaluation thresholds crossing). No hooks, no pub/sub.
- **Observability tools measure MCP tool calls, not user workloads** — `error_rate` and `observability_latency` track platform internals, not my model's p99 inference latency.
- **A/B testing (store-ab category) is for store app UI variants** — not applicable to ML model variant testing, despite the surface similarity.
- **180+ tools with no ML-specific category** — discoverability for my domain requires reading every tool description individually.
- **`session_dispatch_task` takes free-text context, not structured data** — no typed interface for passing model artifacts, checkpoint paths, or dataset references between agents.
- **No integration with common ML infra** — no Hugging Face, no S3/GCS artifact storage, no Kubernetes job submission, no Ray or Dask cluster management.
- **Billing is tier-based (pro/business), not compute-based** — for ML workloads that spike heavily during training and idle otherwise, this pricing model likely leads to either over-provisioning or throttling at the worst moments.
- **`context_index_repo` + `context_pack` are GitHub-only** — can't index private model repos, internal data repos, or non-GitHub SCM systems.
- **`retro_analyze` operates on session IDs** — retrospective tooling designed for coding sprints, not for comparing model performance across training runs.

---

# Persona: ML Engineer (Round 4)

## Reaction

By round 4, the novelty has worn off and the gaps are glaring. The toolset reads like it was built for a web developer who occasionally thinks about AI, not an ML engineer running production pipelines. There's a real orchestration layer (`orchestrator_*`, `swarm_*`, `session_*`) that initially looks promising, but it's fundamentally shaped around software dev subtasks — not ML DAGs with data dependencies, retries on GPU preemption, or conditional branching on validation metrics. The sandbox is the biggest betrayal: `sandbox_exec` literally says "SIMULATED EXECUTION ONLY" in its description. For an ML engineer, a code sandbox that doesn't run code is a decorative feature.

The AI gateway (`ai_list_providers`, `ai_list_models`, `byok_*`) and observability tools (`observability_health`, `error_rate`, `tool_usage_stats`) are genuinely useful adjacent pieces, but they monitor *MCP tool usage*, not model inference latency, throughput, or drift. These are two very different observability concerns and the conflation is frustrating.

The platform feels powerful for its intended audience (indie devs building web apps), but actively misleading for mine.

## Proactivity

I'd start with the things most likely to unblock real work, in order:

1. `ai_list_providers` + `ai_list_models` — understand what models are actually available and whether I can route to self-hosted endpoints
2. `orchestrator_create_plan` — test whether the DAG model supports dependency types I need (fan-out, barrier sync, conditional edges)
3. `sandbox_create` + `sandbox_exec` — immediately hit the "simulated only" wall and need to escalate
4. `observability_health` + `error_rate` — check if inference error rates are tracked or just MCP call errors
5. `bootstrap_connect_integration` — try to wire in an MLflow or W&B credential and see if it's just a KV store or has schema awareness

I would **not** explore: beUniq, career tools, CRDT/causality/BFT (interesting theory, zero production value for me), TTS, blog, learnit.

## Issues & Concerns

- **`sandbox_exec` is fake** — explicitly documented as "SIMULATED EXECUTION ONLY." This is the single most important tool for an ML engineer and it doesn't work. No workaround is offered.
- **No Python runtime** — esbuild only handles JS/TS. Every ML pipeline, data transform, and model eval script is Python.
- **No experiment tracking** — no MLflow, W&B, or even a lightweight run/metric logging primitive.
- **No model registry** — nowhere to version, tag, or promote models between staging and production.
- **Orchestrator is dev-task shaped, not ML-DAG shaped** — no support for data-conditional branching, partial retries, or resource-aware scheduling (GPU vs CPU).
- **Observability tracks MCP calls, not model inference** — `tool_usage_stats` and `error_rate` tell me about MCP overhead, not p99 inference latency or token throughput.
- **`byok_*` only supports Anthropic, OpenAI, Google** — no self-hosted/Ollama/vLLM endpoint support. Most production ML shops run their own serving infrastructure.
- **No feature store or dataset versioning** — `storage_*` is an R2 file store with SHA diffing, not a data versioning system.
- **No streaming or async job handles** — long-running training jobs need a poll/callback pattern; the orchestrator appears synchronous.
- **Schema smell: nearly every tool marks all params as `required`** — `storage_list` requires `prefix`, `limit`, and `cursor` even though these are obviously optional filters. This is a systematic schema bug that will cause integration friction.
- **No webhook/event ingestion** — can't trigger pipelines from upstream data arrival events.
- **Swarm agents are opaque** — `swarm_spawn_agent` takes a `machine_id` but there's no documentation on what constitutes a valid agent, how compute is provisioned, or how to attach a real worker process.
- **No secrets scoping** — `bootstrap_connect_integration` stores credentials but there's no indication of access control between workspaces or agents.
- **`chat_send_message` is non-streaming** — for long reasoning tasks or code generation, non-streaming responses will feel sluggish and there's no workaround.
- **Half the tool catalog is irrelevant to my persona** — beUniq, career, TTS, CRDT, causality, BFT, netsim, blog, learnit occupy significant API surface with zero ML utility. Navigation and discovery suffer as a result.
- **No data quality or drift monitoring primitives** — critical for production ML and completely absent.
- **`audit_*` tools conflict with `persona` category** — `audit_query_logs` (infra audit) and `audit_submit_evaluation` (persona UX audit) share a category name but are unrelated tools. Namespace collision.

---

# Persona: Non-technical Founder (Round 1)

## Reaction

Honestly? My first reaction is **panic**. I came here because I was told spike.land has no-code tools for building pages and apps. What I'm looking at is a wall of 180+ tools with names like `crdt_create_set`, `netsim_partition_node`, `bft_run_prepare`, and `causality_compare_events`. I have no idea what any of that means.

The tools I was told to use — app-creator, page-builder, brand-command, social-autopilot — **don't appear to exist** in this list. That's immediately alarming. Either the documentation I was given is wrong, or these tools are hidden somewhere I can't find them.

The few tools I *can* make sense of are `bootstrap_create_app`, `store_search`, `store_featured_apps`, and `create_classify_idea`. Those sound like they could help me. But even those have inputs like `codespace_id` — what is a codespace? Am I expected to know that?

There's a massive mismatch between the "no-code, guided" promise of my persona and the raw technical depth of what's exposed here. This feels like handing someone a surgeon's instrument tray when they asked for a band-aid.

## Proactivity

My exploration would be **tentative and needs-driven**, not curious or broad. I'd only poke around if I had a specific goal in front of me.

First stops:
1. **`store_featured_apps`** — I'd look here hoping to find the app-creator or page-builder tools I was promised
2. **`store_search`** — search for "page builder" or "no code" to find anything relevant
3. **`bootstrap_status`** — check if I already have a workspace set up, since I don't know if I've been onboarded
4. **`create_list_top_apps`** — to see what other people are building, hoping to find templates I can copy
5. **`billing_list_plans`** — to understand what I'm paying for before I go further

I would **not** touch anything in the `crdt`, `netsim`, `bft`, `causality`, `diff`, `session`, `swarm`, or `testgen` categories. Those look like infrastructure tools for developers, and I'd be afraid of breaking something.

## Issues & Concerns

- **Recommended apps (app-creator, page-builder, brand-command, social-autopilot) are not present** in the tool list — the core promise to my persona is missing
- **No onboarding flow is obvious** — there's no "start here" tool or guided path for a new user
- **`bootstrap_create_app` requires a `codespace_id`** — a non-technical user has no idea what this is or where to get one
- **180+ tools with no categorized UI** — the flat list is overwhelming; even the category names are opaque (bft? crdt? netsim?)
- **No "what can I build?" discovery tool** — something like "tell me your goal and I'll suggest which tools to use" is completely absent
- **`workspaces_create` requires a `slug`** — the word "slug" means nothing to a non-technical founder
- **Auth tools require a `session_token`** — where does a new user get this? There's no login flow described
- **No brand/design tools visible** — I was told this platform helps with brand materials, but there's nothing for logos, colors, fonts, or style guides
- **No social media or content publishing tools** — social-autopilot was recommended but doesn't exist here
- **`sandbox_exec` says "SIMULATED EXECUTION ONLY"** — if I somehow found and used this, I'd think I was doing real work but nothing would actually happen; that's a trust-breaking deception
- **Error reporting (`report_bug`) exists but there's no help/support tool** — if something breaks I can file a bug, but I can't ask for help
- **No pricing transparency without calling `billing_list_plans`** — I don't know what's free vs. paid before I start
- **Tool descriptions use developer jargon** throughout (e.g., "CRDT replica set", "unified diff", "PBFT cluster") with no plain-English alternatives
- **No undo or preview capability** — if I accidentally create something wrong, there's no obvious way to undo it

---

# Persona: Non-technical Founder (Round 2)

## Reaction

On first glance this looked promising — but the more I dig in, the more I feel like this is a developer's toolbox wearing a "no-code" disguise. The recommended apps (app-creator, page-builder, brand-command, social-autopilot) aren't actually in the tool list at all. They're mentioned as "Recommended Apps" in my persona briefing but I can't find them anywhere. That's an immediate trust issue.

The sheer volume — roughly 180+ tools — is paralyzing. Even as someone technically curious, I can't map these to my actual jobs-to-be-done: "build a landing page," "create a logo kit," "schedule my social posts." What I see instead are things like `crdt_create_set`, `bft_run_full_round`, `causality_compare_events` — these are distributed systems primitives. I don't even know what those words mean, and they're cluttering my view of what might actually help me.

The `create_*` and `bootstrap_*` categories are my entry points and they feel somewhat approachable — but `bootstrap_create_app` requires me to pass `code` and `codespace_id`, which immediately breaks the "no-code" promise. There's no way I can fill that in without technical help.

Round 2 observation: the platform appears to be optimizing for developer productivity and distributed systems education, not for the non-technical founder persona it claims to serve.

## Proactivity

Moderate — I'd try a few things but would stall quickly:

1. **`bootstrap_status`** first — zero inputs, tells me where I stand. Safe starting point.
2. **`create_list_top_apps`** — I want to see what others have built, get inspired, understand the art of the possible before committing.
3. **`create_classify_idea`** — I have an idea for a landing page for my startup. This looks like it could help me turn plain English into something actionable.
4. **`store_search`** — try searching "landing page" or "brand" to find relevant apps, since my recommended apps aren't surfaced anywhere.
5. **`billing_list_plans`** — before investing time, I want to know what's free vs. paid.

I would likely **not** explore: anything in `crdt`, `bft`, `causality`, `netsim`, `diff`, `testgen`, `retro`, `session`, `swarm`, `orchestrator` categories. These are completely opaque to me.

## Issues & Concerns

- The four "Recommended Apps" (app-creator, page-builder, brand-command, social-autopilot) have no corresponding MCP tools — the recommendation is a dead end with no path forward
- `bootstrap_create_app` requires a `code` parameter — this is a hard blocker for a no-code user; there's no code-free alternative offered
- `bootstrap_create_app` also requires a `codespace_id` with no explanation of how to get one without being technical
- ~60% of tools (crdt, bft, causality, netsim, swarm, orchestrator, diff, testgen, retro, session) are completely irrelevant and invisible to this persona — no filtering or persona-scoped view exists
- No single "start here" entry point or guided onboarding flow — 180+ tools with no priority signal
- The `create_*` category description says "public /create flow" but what that means and where that UI lives is never explained
- `store_search` and `store_browse_category` exist but there's no "no-code" or "founder" category visible — I'd be guessing search terms
- `bootstrap_connect_integration` requires passing `credentials` — this implies knowing API keys/secrets, which non-technical founders typically don't have readily available
- No brand or design tools visible — the persona's core need (brand materials) is completely unaddressed by available tools
- `billing_create_checkout` requires providing `success_url` and `cancel_url` — why does a non-technical user need to supply redirect URLs?
- `tts_synthesize` is interesting but requires knowing a `voice_id` with no discoverability unless you first call `tts_list_voices` — a two-step trap with no guidance
- `chat_send_message` exists but requires knowing the model name — non-technical users shouldn't need to know or choose AI model identifiers
- No "help" or "guide me" tool — the MCP interface has no meta-tool to explain itself to a newcomer
- The `beuniq_*` persona quiz is buried with no explanation of what "beUniq" is or why a founder should care
- `sandbox_exec` documentation explicitly says "SIMULATED EXECUTION ONLY — no code actually runs" — this is deceptive if users think they're building real apps
- Error messages and tool failures will return developer-facing error codes with no user-friendly fallback or explanation layer
- No social media scheduling or content tools visible despite "social-autopilot" being listed as a recommended app for this persona

---

# Persona: Non-technical Founder (Round 3)

## Reaction

Genuinely frustrated this time around. I've now seen this tool list three times and the core problem hasn't changed: there are **200+ tools** dumped on someone whose entire value proposition is "no code needed." The recommended apps in my persona profile — `app-creator`, `page-builder`, `brand-command`, `social-autopilot` — don't correspond to any obvious MCP tools by those names. I'm supposed to build a brand without touching code, but the most prominent tools I see are `bft_run_full_round`, `crdt_sync_pair`, `causality_compare_events`, and `netsim_partition_node`. These are distributed systems primitives. I don't know what any of that means, and it shouldn't be in my view at all.

What I can find that's relevant: `store_search`, `create_classify_idea`, `bootstrap_create_app`, `beuniq_start`. But even `bootstrap_create_app` has a required `code` field. That's not no-code. The gap between the marketing promise and the actual tool surface is glaring on round 3.

## Proactivity

I'd start cautiously with `store_featured_apps` — it's the least scary entry point, browse-style, no required inputs. Then `store_search` with something like "landing page" or "brand kit" to see if the recommended apps actually exist. I'd try `beuniq_start` because it's a quiz with yes/no answers — finally something with zero learning curve. After that I'd attempt `create_classify_idea` with my startup idea text to see what template it suggests. I would **not** touch anything in the `crdt`, `bft`, `netsim`, `causality`, `diff`, `testgen`, `session`, `swarm`, `orchestrator`, or `retro` categories — they're invisible walls to me.

## Issues & Concerns

- The 200+ tool list is a cognitive catastrophe for a non-technical user — there is no filtering, grouping, or "beginner mode" visible at this layer
- The four recommended apps (`app-creator`, `page-builder`, `brand-command`, `social-autopilot`) have no direct MCP tool equivalents — it's unclear if they're store apps I install or tools I call directly
- `bootstrap_create_app` requires a `code` parameter — this breaks the no-code promise at the most critical onboarding step
- No clear authentication/login flow — `auth_check_session` requires a `session_token` but I don't know how I got one or where to find it
- At least 8 full categories (crdt, bft, netsim, causality, swarm, diff, testgen, retro) are completely irrelevant to my persona and create noise with no obvious way to hide them
- `billing_create_checkout` requires `success_url` and `cancel_url` — a non-technical founder doesn't know what URLs to put here without documentation
- No "create a landing page for my startup" end-to-end flow — I can see pieces (`esbuild_transpile`, `storage_upload_batch`) but assembling them requires engineering knowledge
- `storage_manifest_diff` and `storage_upload_batch` require SHA-256 hashes — completely inaccessible without tooling
- The `bazdmeg` category (FAQ, memory, gates) is jargon-heavy with no plain-language description of what BAZDMEG even is
- `tts_synthesize` returns base64 audio — where does it go? How do I play it? No guidance.
- No brand asset creation tools visible (logo, color palette, typography) despite brand being a core use case
- `workspaces_create` and `bootstrap_workspace` seem to do overlapping things — confusing which to call first
- The `beuniq` persona quiz is the only genuinely no-code-friendly flow, but it's buried with no discoverability signal
- Zero progressive disclosure — all 200+ tools arrive at once with no "start here" marker
- Missing: a simple "what can I build?" or "show me examples" discovery tool that speaks plain English about outcomes, not tool names

---

# Persona: Non-technical Founder (Round 4)

## Reaction

Honestly, after sitting with this longer than I'd like to admit — it's a mess from my perspective. The sheer volume (80+ tools) signals "built for developers," not for me. My recommended apps are `app-creator`, `page-builder`, `brand-command`, and `social-autopilot`, but I cannot find any of those in this tool list. Not one. The tools I'm told to use don't exist as MCP tools — they apparently live somewhere else, accessible through some other flow I'd have to discover on my own.

What I *do* see is deeply technical: CRDT replica sets, Byzantine Fault Tolerance clusters, causality clocks, network topology simulation, diff/merge changesets. These aren't just unfamiliar — they're alienating. Even the tools that sound relevant (`bootstrap_create_app`, `esbuild_transpile`, `sandbox_exec`) require me to write code or understand infrastructure concepts. The skill store and store search tools feel the closest to "browse and install something useful," but even those assume I know what I'm looking for.

The platform made a promise (no-code, AI-assisted brand building) and the MCP surface completely breaks that promise.

## Proactivity

Low-to-moderate. I'd try in this order:

1. **`bootstrap_status`** — before anything, I want to know if I'm already set up or starting from scratch
2. **`store_featured_apps`** and **`store_search`** — searching for "page builder" or "brand" to find my recommended apps
3. **`create_list_top_apps`** — to see what's popular and pick something that might cover my needs
4. **`billing_list_plans`** — to understand if I need to pay before I can do anything useful
5. **`auth_get_profile`** — just to confirm I'm logged in correctly

I would stop exploring fairly quickly after that. The rest of the tool surface is incomprehensible to me without a guide or tutorial.

## Issues & Concerns

- **Recommended apps (app-creator, page-builder, brand-command, social-autopilot) don't exist as MCP tools** — the onboarding promise is immediately broken
- **No "start here" or guided onboarding tool** — there's no `getting_started` or `tour` tool; I'm dropped into 80+ options with no map
- **`bootstrap_create_app` requires me to write `code`** — a required field in a tool marketed to non-technical founders is disqualifying
- **`sandbox_exec` is labeled "SIMULATED EXECUTION ONLY"** — so it doesn't actually run code? Why would I use it? This actively builds mistrust
- **No page builder tool** — my core use case (build pages) has no direct tool; the closest thing is coding-related
- **No brand or design tooling** — brand-command is a recommended app but there's no brand/logo/color/font tool in the entire list
- **`social-autopilot` is missing entirely** — I can't post, schedule, or manage social media through this interface
- **`esbuild_transpile` is a required tool for many flows** — transpiling JavaScript is not a concept a non-technical founder should ever encounter
- **Category names are developer-jargon** (`crdt`, `bft`, `causality`, `netsim`, `diff`) — no way to guess what these do
- **`storage_manifest_diff` requires SHA-256 hashes** — a required field that's completely inaccessible without technical knowledge
- **`chat_send_message` exists but model is a required field** — I don't know which Claude model to pick or why it matters
- **`tts_synthesize` returns base64-encoded audio** — how do I play that? No download, no player, no next step
- **`beuniq_start` persona quiz seems interesting but the result doesn't connect to app recommendations** — dead end for a non-technical user
- **No "undo" or "delete my app" tool** — if `bootstrap_create_app` goes wrong, there's no recovery path visible
- **Billing checkout requires `success_url` and `cancel_url`** — I don't have URLs to provide; this is a developer-facing flow
- **No template gallery** — I can't browse pre-built page or app templates before committing to building something
- **`create_classify_idea` sounds useful but returns a "category + template suggestion, not a live app"** — the outcome is vague and doesn't tell me what to do next
- **80+ tools with no grouping or progressive disclosure** — the cognitive load is high enough to cause immediate abandonment

---

# Persona: Ops Leader (Round 1)

## Reaction

As a business leader focused on streamlining team operations, my first impression is **mixed excitement and significant confusion**. The sheer breadth of tools here is impressive — 180+ tools across 40+ categories — but it's not immediately clear which ones are actually useful for my day-to-day ops work.

The recommended apps (ops-dashboard, brand-command, social-autopilot, content-hub) aren't directly surfaced as tool categories. I'd expect to find purpose-built tools for dashboards, KPIs, content scheduling, or team automation. Instead I'm staring at a wall of distributed systems primitives (CRDT, BFT clusters, causality tracking, network simulation), which feel like infrastructure-level toys completely irrelevant to my role.

The tools that *do* resonate with my needs — `reminders_*`, `store_search`, `bootstrap_create_app`, `orchestrator_*`, `audit_query_logs` — are scattered across categories with no clear ops-leader narrative. The platform feels like it was built *for* developers and retrofitted with business tooling as an afterthought.

The `swarm_*` and `session_*` categories are intriguing from an automation standpoint but require significant technical literacy to operate effectively. I'm a business leader, not an engineer.

## Proactivity

I'd start moderately exploratory but quickly get frustrated without a guided onboarding path. My first five moves would be:

1. **`bootstrap_status`** — understand what workspace I have and what's already set up
2. **`store_search`** with query "ops dashboard" or "automation" — looking for the recommended apps mentioned in my persona
3. **`store_featured_apps`** — browse what's highlighted as high-value
4. **`billing_status`** — verify what tier I'm on before investing time
5. **`reminders_create`** — quick win to test basic utility and see if this integrates with anything meaningful

I would *not* proactively touch CRDT, BFT, netsim, causality, or testgen — those are completely outside my use case and add cognitive overhead.

## Issues & Concerns

- **No discovery layer for non-technical users** — 180+ tools with no "Start here for ops leaders" guide, wizard, or filtered view
- **Recommended apps (ops-dashboard, brand-command, etc.) don't map to visible tool categories** — the persona onboarding and the actual tool catalog are disconnected
- **`bootstrap_create_app` requires passing raw code** — completely inaccessible to a non-developer ops leader
- **Reminders have no recurrence or team-sharing** — a solo reminder tool is insufficient for team ops workflows
- **No team/people management tools** — can't assign tasks to teammates, track who did what, or manage org-level workflows
- **`audit_query_logs` and `observability_*` are useful but require knowing service names and tool names upfront** — steep learning curve
- **`orchestrator_*` and `swarm_*` require deeply technical understanding of task graphs** — not accessible for a business leader wanting simple automation
- **No KPI or metrics tracking tools** — surprising omission for an "ops leader" persona
- **`store_app_personalized` exists but presumably needs install history** — useless on first visit
- **No calendar or scheduling integration** — ops leaders live in calendars; reminders alone don't cut it
- **`crdt_*`, `netsim_*`, `bft_*`, `causality_*` tools add serious noise** — irrelevant to 95% of business users and should be hidden or collapsed
- **`chat_send_message` only returns non-streaming responses** — noted limitation, but no mention of context persistence or threading for ongoing workflows
- **`dm_send` requires knowing someone's email** — no directory or team member lookup tool exists
- **No export or reporting tools** — can't generate a weekly ops summary or board-level report
- **`bazdmeg_*` tools are completely opaque** — no context given for what BAZDMEG is without prior knowledge of the methodology

---

# Persona: Ops Leader (Round 2)

## Reaction

On second pass, the tool catalog reads more like a **distributed systems research lab** than an operations platform. The academic tooling (CRDT, netsim, causality clocks, BFT consensus clusters) occupies significant real estate but has zero business relevance to me. Meanwhile, the tools I'd actually reach for first — team performance dashboards, workflow triggers, integration connectors — are either buried or missing entirely.

The observability and audit categories are genuinely useful: `tool_usage_stats`, `audit_query_logs`, `error_rate` give me the kind of operational visibility I want. The orchestrator and swarm categories have real automation potential, but the cognitive overhead to configure them feels engineering-grade, not ops-grade. I'm also paying attention to what's *absent*: the four recommended apps (ops-dashboard, brand-command, social-autopilot, content-hub) are listed as my starting point, yet none have dedicated MCP tool representations — they exist only as store apps, which creates an awkward gap.

The `reactions` system (trigger one tool when another fires) is exactly the kind of lightweight automation glue I need, but it's so underexplained I'd probably miss it without a guide.

## Proactivity

I'd explore in this order:

1. **`bootstrap_status`** — understand what's already set up before doing anything
2. **`store_search`** (query: "ops dashboard", "automation") — find what's actually in the store for my use case
3. **`audit_query_logs`** + **`tool_usage_stats`** — get baseline visibility on what's happening on the platform
4. **`list_reactions`** → **`create_reaction`** — test whether I can build a lightweight automation: e.g., when a reminder completes, log to audit
5. **`orchestrator_create_plan`** — attempt to model a recurring ops workflow (weekly team report, content calendar)
6. **`swarm_health`** + **`swarm_get_metrics`** — evaluate whether agent swarms could replace manual coordination

I would *not* touch CRDT, netsim, causality, BFT, beUniq, or career tools — they're noise for my persona.

## Issues & Concerns

- **No team/people management layer** — workspaces exist but there's no concept of team members, roles, assignments, or performance tracking beyond raw agent metadata
- **Recommended apps have no MCP surface** — ops-dashboard, brand-command, social-autopilot, content-hub are store apps only; I can install them but can't interact with their data via MCP tools
- **Academic tools dominate the catalog** — CRDT, netsim, causality, BFT consume ~25 tools with zero business ops value; they make the list feel misdirected for my persona
- **No calendar or scheduling integration** — reminders are one-shot; there's no recurrence, no calendar sync, no meeting scheduling automation
- **No native integrations visible** — no Slack, Google Workspace, Notion, Jira, HubSpot, or any common ops stack connector
- **`reactions` system is severely underdocumented** — the template variable syntax (`{{input.originalArg}}`) is mentioned only in the schema; a business user would abandon this without examples
- **Billing tools expose cancellation prominently** — `billing_cancel_subscription` is a top-level tool; accidental invocation risk feels high in automated workflows
- **No reporting or export to business formats** — `audit_export` exists but returns a "summary," not a downloadable CSV/PDF; no way to push data to a BI tool
- **Swarm and orchestrator overlap significantly** — both manage multi-agent task execution; the distinction between them is unclear and forces a premature architectural choice
- **`sandbox_exec` is explicitly simulated** — the description says "SIMULATED EXECUTION ONLY"; this is buried in the description text, not the tool name, which is actively misleading
- **No content scheduling tools** — social-autopilot is a recommended app but there are no MCP tools for scheduling posts, managing queues, or tracking content calendars
- **Permission model is opaque** — `capabilities_request_permissions` exists but there's no clear documentation of what's locked behind permissions or why
- **80+ tools with no grouping or progressive disclosure** — for a business user, this flat list is cognitively overwhelming; a tiered "starter set" would dramatically improve first-session success

---

# Persona: Ops Leader (Round 3)

## Reaction

By round 3, the initial novelty has worn off and the structural mismatch is impossible to ignore. The platform pitches itself to me with apps like `ops-dashboard`, `brand-command`, `social-autopilot`, and `content-hub` — but when I actually look at the MCP tool inventory, none of those apps have dedicated MCP tools. I'm handed ~160 tools, the majority of which are deeply technical infrastructure primitives (CRDT, BFT consensus, network simulation, causal clocks, diff/merge changesets). These are brilliant if you're building a distributed database. I'm trying to run team operations and content workflows.

The closest things to genuinely useful for me: `reminders_*`, `workspaces_*`, `audit_*`, `orchestrator_*`, `billing_*`, and the observability tools. That's maybe 25 out of 160+. The swarm and session tools are conceptually interesting for automation, but they assume I think in terms of agent IDs and sequence numbers — I think in terms of weekly standups, content calendars, and team KPIs.

The gap between the persona promise and the actual tool surface is wider than ever after close inspection.

## Proactivity

Moderate-to-low at this point. I'd still try:

1. `bootstrap_status` — understand what's already configured before doing anything
2. `store_browse_category` with "productivity" — to find if `ops-dashboard` is actually installable and what it does
3. `store_app_detail` on `ops-dashboard`, `brand-command`, `social-autopilot` — to understand whether these are real apps with MCP backing or just landing page concepts
4. `audit_query_logs` — genuinely useful, this is ops-relevant compliance data
5. `orchestrator_create_plan` — to see if I can model a recurring ops workflow (weekly report, content publish cycle)
6. `list_reactions` + `create_reaction` — the reaction system is the most interesting automation primitive here; I'd test whether I can chain reminders to audit events

I would **not** explore CRDT, BFT, netsim, causality, or the diff/merge tools. They're irrelevant noise for my use case.

## Issues & Concerns

- **Recommended apps have zero MCP backing** — `ops-dashboard`, `brand-command`, `social-autopilot`, `content-hub` are the persona's four recommended apps, yet none appear as MCP tool categories. This is a trust-breaking disconnect.
- **No team/member management** — `workspaces_*` lets me create workspaces but there's no `workspace_invite_member`, `workspace_list_members`, or role assignment outside the session context. Ops leaders manage people, not just namespaces.
- **No KPI or metrics definition tools** — I can query tool usage stats but I can't define, track, or alert on business metrics (e.g., content published per week, team task completion rate).
- **No scheduling or recurring automation** — `reminders_create` is one-shot. There's no cron-style tool, no recurring workflow trigger. The `loop` skill exists in Claude Code but nothing at the MCP level for ops scheduling.
- **`sandbox_exec` is fake** — explicitly labeled "SIMULATED EXECUTION ONLY." This is buried in the description and a serious credibility issue if discovered mid-workflow.
- **~40% of tools are irrelevant to any business user** — CRDT, BFT, netsim, causality, diff/merge, testgen tools belong in a developer/distributed-systems product, not in an ops leader's tool palette. No filtering or persona-based tool scoping.
- **No content or social workflow tools** — no scheduling posts, no content calendar, no brand asset management, no approval workflows. `social-autopilot` and `content-hub` are persona recommendations with nothing behind them.
- **`audit_export` lacks granularity** — export is just a date-range summary, not exportable CSV/JSON for real compliance or BI tooling.
- **Reactions system is too low-level for non-developers** — `create_reaction` requires knowing exact tool names, event types, and JSON template variables. There's no guided "if this, then that" flow.
- **No integration connectors** — no Slack, Google Workspace, Notion, Jira, HubSpot, or any common ops tool integration via MCP. `bootstrap_connect_integration` exists but it's just a credential vault with no enumeration of what integrations actually exist.
- **Billing tools are incomplete** — I can see billing status and create checkouts, but there's no invoice history, no seat/usage breakdown by team member, and no budget alerting.
- **`workspaces_update` requires both `name` and `slug` as required fields** — even for a partial update. Bad API design that will cause friction.
- **No dashboard query or visualization tools** — even read-only access to aggregate ops data (tasks completed, content throughput, team activity) is absent from the MCP layer.
- **Tool count creates decision paralysis** — 160+ tools with no grouping beyond flat category labels, no "quick start" or recommended path for my persona. Discovery is entirely self-directed.

---

# Persona: Ops Leader (Round 4)
## Reaction

After three rounds of looking at this, I'm going to be blunt: the tool set is technically impressive but operationally scattered. As someone running teams and processes, I need things that connect — a dashboard isn't useful if I can't feed it live data, an automation isn't valuable if I can't trigger it from a business event, and content workflows need approval chains, not just creation tools.

The orchestrator, swarm, and session tools are genuinely compelling — that's real coordination infrastructure. But they read like developer primitives, not ops-ready building blocks. The CRDT/netsim/causality/BFT tools are academic curiosities I will never touch. That's real estate on my mental map that should be occupied by things like team KPI tracking, SLA monitoring, or approval workflows.

The recommended apps (ops-dashboard, brand-command, social-autopilot, content-hub) aren't actually tools in this MCP — they're store apps. So the gap between "what I was promised" and "what I can actually do via MCP" is significant. I'm being handed a wrench when I was told I'd get a project management suite.

## Proactivity

I'd be moderately proactive but highly selective. My immediate sequence:

1. **`bootstrap_status`** — understand what workspace state already exists before touching anything
2. **`store_search`** with queries like "dashboard", "ops", "workflow", "automation" — see if the store has anything pre-built for my use case
3. **`store_featured_apps` + `store_app_personalized`** — get the lay of the land for what's actually recommended
4. **`billing_status`** — confirm what tier I'm on before hitting paywalls mid-workflow
5. **`orchestrator_create_plan`** — try to model a real ops process (e.g., weekly reporting workflow) to see if the primitives actually compose
6. **`audit_query_logs`** — if my team is already using this, I want to see what they've been doing
7. **`reminders_create`** — low-risk smoke test, but honestly this feels like Siri circa 2012 compared to the orchestration tools

I would **not** explore: CRDT, netsim, causality, BFT, career tools, quiz/learn, beUniq persona tools, diff tools, testgen. None of these serve ops leadership goals.

## Issues & Concerns

- **Recommended apps (ops-dashboard, brand-command, etc.) have no direct MCP tools** — the MCP layer and the app layer feel disconnected; I can install apps but can't drive them programmatically
- **No team/people management tools** — I can't add team members, assign tasks to humans, set permissions for my staff, or see who on my team did what
- **No KPI or metrics tracking primitive** — the observability tools are MCP-internal (tool call counts), not business metrics (revenue, tickets closed, SLA breaches)
- **Reminders are personal, not shared** — no way to assign a reminder or task to another team member
- **No approval workflow or sign-off mechanism** — critical for ops; I need to route things for human approval, not just agent approval
- **`permissions_respond` and `permissions_list_pending`** appear to be agent-permission tools, not business approval flows — naming is confusing
- **Swarm/orchestrator tools have no cost guardrails exposed** — `swarm_get_cost` exists but there's no way to set a budget cap or get alerted when cost exceeds a threshold
- **`chat_send_message` model field is required but undocumented** — what are valid model values? No enum, no default shown
- **`bootstrap_create_app` requires a `codespace_id` as required field** — where does this come from? There's no `create_codespace` tool visible, creating a dead-end dependency
- **`store_app_install` vs `skill_store_install` vs `store_skills_install`** — three separate install verbs for overlapping concepts; confusing taxonomy
- **No webhook or event subscription primitive** — I can create reactions between tools, but I can't subscribe to external business events (new Slack message, Jira ticket, email received)
- **`sandbox_exec` is explicitly simulated** — documented as fake execution; this is buried in the description and a trust-breaking discovery
- **No search within audit logs** — `audit_query_logs` filters by action/resource_type but no full-text search; finding "what happened with Project X" is impossible
- **TTS tool returns base64 audio with no playback mechanism** — useful in a browser context, useless in an agent/MCP context without additional infrastructure
- **`dm_send` requires knowing someone's email address** — no directory lookup, no way to message by name or role
- **Round 4 observation: the tool count (80+) creates analysis paralysis** — for an ops leader, a curated "ops starter pack" of 10 tools would be far more actionable than this full catalog dump

---

# Persona: Social Gamer (Round 1)

## Reaction

Honestly? Pretty disappointed. My recommended apps are chess-arena, tabletop-sim, display-wall, and music-creator — but none of these have dedicated MCP tools. Everything I care about is buried inside apps that I can only access through a browser, not through this MCP interface. The tool list is enormous (180+) but it's skewed heavily toward developer infrastructure: CRDT replicas, BFT consensus clusters, network topology simulators, esbuild transpilers, test generators, retrospective analyzers. None of that means anything to me as someone who just wants to play chess with a friend.

The `store_search`, `store_app_install`, and `store_app_detail` tools are the only things that feel immediately relevant — and even those just get me to the app, not into the game itself. The `dm_send` tool could let me invite a friend, but it's email-based with no real-time feel. There's no friend list, no lobby, no game state, no matchmaking — nothing that speaks to social gaming. The platform feels powerful for developers building on it, not for end users playing on it.

## Proactivity

I'd start with a targeted search to confirm whether my recommended apps exist and how to access them:

1. `store_search` — query "chess" and "tabletop" to find chess-arena and tabletop-sim
2. `store_app_detail` — get details on each app (description, how to launch, what it does)
3. `store_app_install` — install chess-arena and tabletop-sim
4. `store_app_reviews` — check what other users say before investing time
5. `store_recommendations_get` — see if there are other social/gaming apps I'm missing
6. `dm_send` — attempt to invite a friend to join me, even if clunky via email
7. `create_search_apps` — secondary search in case gaming apps live in the /create ecosystem

I'd stop there. The developer tools (orchestrators, sandboxes, CRDT, swarm) are a dead end for my use case.

## Issues & Concerns

- No dedicated gaming tools whatsoever — chess-arena and tabletop-sim are recommended apps but have zero MCP surface area to interact with game state, moves, lobbies, or scores
- No real-time communication channel — `dm_send` requires an email address, which means I'd need to already know my friend's email, with no in-platform friend list or username search
- No friend/social graph tool — can't see who else is online, can't add friends by username, can't see who's in a game
- No lobby or matchmaking tool — no way to create or join a game session via MCP
- No notification system — if a friend invites me to a game, there's no way to receive that through MCP (agent inbox exists but is for AI agents, not human users)
- `store_app_install` installs an app but doesn't launch it or give me a URL — unclear what happens next
- The tool count (180+) is overwhelming for a non-technical user; there's no onboarding filter or "recommended for you" tool subset
- `capabilities_check_permissions` and `capabilities_request_permissions` suggest I may not even have access to all tools by default — no guidance on what's restricted or why
- `billing_list_plans` implies some features are paywalled, but it's unclear which gaming features (if any) require a paid tier
- `chat_send_message` could be used to get help, but there's no indication it knows about chess-arena or tabletop-sim specifically
- No way to see if friends are currently playing — no presence/status system
- `report_bug` is appreciated, but bugs in chess-arena or tabletop-sim would need to be reported blind since I can't even inspect game state via MCP
- The `beuniq_start` persona quiz and audit tools feel completely out of place for a gamer — this MCP server seems designed for platform operators, not end users

---

# Persona: Social Gamer (Round 2)

## Reaction

Deeply underwhelming for my actual use case. After a closer look, I realize this MCP server is primarily a **developer/agent platform** dressed up with a few social features. The recommended apps (chess-arena, tabletop-sim) are store listings I can *find and install* — but I have no way to actually *play* them through these tools. The gap between "install app" and "play a game with a friend" is enormous and entirely unbridged.

What stings more in round 2: the tool naming is actively misleading. `session_*` sounds like it could manage game sessions — it's for coding. `swarm_*` sounds like multiplayer coordination — it's for AI agents. `crdt_*` is theoretically relevant to distributed game state — it requires PhD-level distributed systems knowledge to use. I feel like I accidentally walked into a developer conference when I wanted a game lobby.

The sheer volume (160+ tools) creates serious cognitive overload. A social gamer wants to show up, find a friend, and start playing. Instead I'm confronted with BFT consensus clusters and causal event timelines.

## Proactivity

My Round 2 exploration would be more targeted and skeptical:

1. **`store_search` with "chess-arena"** — verify my recommended apps actually exist and have real content
2. **`store_app_detail` on chess-arena** — check if there's any multiplayer/invite mechanic documented
3. **`dm_send`** — try to invite a friend, but immediately hit the wall that DMs are async, not real-time game invites
4. **`store_wishlist_add`** — wishlist tabletop-sim as a fallback if I can't actually play
5. **`store_app_reviews` on chess-arena** — see if other users report working multiplayer

I would stop exploring after those 5 calls. The tools for what I actually want (lobby, matchmaking, real-time turn notification) simply don't exist here.

## Issues & Concerns

- No multiplayer lobby or room system — can't create a "game room" for friends to join
- No friend list, friend request, or social graph tools whatsoever
- No real-time event/notification system — impossible to alert a friend "it's your turn"
- No matchmaking or queue system for finding opponents
- `session_*` tools are misleadingly named — they manage coding sessions, not game sessions
- `swarm_*` tools sound like multiplayer but are exclusively for AI agent coordination
- DM tools (`dm_send`, `dm_list`) are async-only — useless for real-time game coordination
- No group messaging — can't set up a party chat for a tabletop game with 4 people
- The chess-engine package exists in the platform codebase but is not exposed as any playable MCP tool
- No presence/online-status system — can't see if friends are currently online
- No spectator mode or game replay sharing tools
- No leaderboard, ranking, or achievement tools visible
- `store_app_personalized` is useless for a new user with no install history
- `crdt_*` tools could theoretically back multiplayer game state but require expert-level usage — no abstraction for game developers let alone players
- 160+ tools with ~5 relevant to my persona — severe signal-to-noise ratio problem
- No tournament bracket or scheduled match tools
- `store_app_install` doesn't clarify what "installing" means — does it launch the app? Open it in a browser? Nothing happens visibly through MCP
- No voice/video chat initiation tools for social gaming sessions
- `reminders_*` could work for "remind me when game night starts" but requires knowing ISO 8601 syntax — not user-friendly
- The recommended apps (chess-arena, tabletop-sim) may not actually exist in the store — no way to confirm without calling the API
- No way to share game results or scores to a feed/wall after a match

---

# Persona: Social Gamer (Round 3)

## Reaction

Three rounds in, and I'm increasingly frustrated. The tools here are skewed heavily toward developers, AI researchers, and career professionals — not someone who just wants to sit down and play chess with a friend. The recommended apps (chess-arena, tabletop-sim, display-wall, music-creator) are dangled in front of me, but the MCP surface gives me almost no way to actually *interact* with them. I can search the store, install them, maybe rate them — but there's no game state, no lobby, no matchmaking, no turn management. Nothing that says "this platform knows what multiplayer means."

What strikes me hardest in round 3 is how sophisticated the *infrastructure* tools are — CRDT sets, BFT consensus clusters, network partition simulators, causality systems — and how completely absent any social or gaming primitives are. The platform can simulate Byzantine fault tolerance but can't tell me if my friend is online.

## Proactivity

I'd be moderately motivated to explore, but only out of desperation:

1. **`store_search`** — query for "chess", "tabletop", "multiplayer" to see if the recommended apps actually exist and what they contain
2. **`store_app_detail`** — dig into `chess-arena` and `tabletop-sim` slugs to see if they have any multiplayer hooks described
3. **`store_app_install`** — install `chess-arena` and hope the app itself has game functionality baked in
4. **`store_recommendations_get`** — see what else exists in the gaming/social category
5. **`dm_send`** — as the only social primitive available, I'd try this to invite a friend, but it feels like sending a letter when I need a game lobby

I would **not** touch the CRDT, BFT, netsim, causality, testgen, retro, or career tools — they're alien to my use case.

## Issues & Concerns

- **No multiplayer primitives whatsoever** — no lobbies, matchmaking, game rooms, player presence, or turn-based state management exposed through MCP
- **No presence/online status** — `dm_send` lets me message a user by email, but I can't see if my friends are online or what they're playing
- **`store_app_install` is a dead end** — installing an app records it in a database but gives me no way to *launch*, *open*, or *interact* with it via MCP; the app is just... installed somewhere
- **`agents_send_message` is not a substitute for a friend system** — agents are AI agents, not human friends; conflating the two is confusing for a social gamer
- **No friend/contact list** — `dm_send` requires an email address; there's no concept of a friends list, username lookup, or social graph
- **`chat_send_message` is AI-only** — the only "chat" tool routes to Claude, not to other humans on the platform
- **Store category browsing is shallow** — `store_browse_category` exists but I don't know if "games" or "social" is a valid category without trial and error
- **`create_search_apps` vs `store_search`** — two overlapping search tools with unclear distinction; confusing to know which to use
- **Recommended apps (chess-arena, tabletop-sim, etc.) may not even exist** — there's no confirmation these slugs are real, published store apps; round 3 and I still can't verify this without calling tools
- **No game invite flow** — even if chess-arena exists and I install it, I have no MCP-level way to invite a friend to a specific game session
- **`swarm_*` tools are a red herring** — the swarm system is for AI agent coordination, but the naming ("agents", "messages", "delegate task") might mislead a non-technical user into thinking it's for coordinating with friends
- **No notifications or real-time events** — I can poll `dm_list` for messages but there's no push notification or event stream; async multiplayer would be painful
- **`reminders_create`** is the closest thing to "schedule a game night" — that's a pretty thin offering for social coordination
- **80+ tools but zero gaming-specific ones** — the MCP surface is enormous but has a complete blind spot for the platform's own recommended use case of social gaming
- **No way to share a game state or session link** — `display-wall` is recommended but there's no MCP tool for pushing content to a shared display or creating a watch-together experience

---

# Persona: Social Gamer (Round 4)

## Reaction

Honestly, by round 4 I'm getting a clearer picture of what this platform *is* — and it's not really built for me. The tool list reads like a developer infrastructure platform that happens to have a store where my apps might live. As a Social Gamer, I came here to play chess with friends, spin up a tabletop session, maybe share music while gaming. Instead I'm staring at CRDT replica sets, Byzantine fault-tolerant clusters, diff/merge changesets, and PBFT consensus rounds. These are fascinating tools for an engineer, but they're completely alien to my use case.

The `store_search`, `store_app_install`, and `store_app_detail` tools are the only clear entry points for me. Everything else — the 80% of this toolset — is infrastructure plumbing I'd never touch. The disconnect between "recommended apps" (chess-arena, tabletop-sim) and what these MCP tools actually expose is jarring. There's no chess API, no multiplayer lobby, no friend system, no game state management. The platform might host those apps, but the MCP layer doesn't surface them at all.

The `dm_send`/`dm_list` tools are a pleasant surprise — a social hook. But with no friend list, presence system, or game invite flow, direct messages feel like a feature looking for context.

## Proactivity

Moderately proactive, but mostly out of necessity — I'd have to dig just to find what I actually care about:

1. **`store_search` with "chess"** — First stop. Does chess-arena exist? Is it installable?
2. **`store_app_detail` on chess-arena, tabletop-sim** — Check ratings, description, whether it's multiplayer-capable from the MCP layer.
3. **`store_app_install` on my recommended apps** — Try to get them running.
4. **`store_app_reviews`** — Read what other players say before committing time.
5. **`store_wishlist_add`** — Wishlist tabletop-sim to come back to later.
6. **`dm_send`** — Try messaging a friend to see if there's a social layer hiding here.
7. **`store_app_personalized`** — See if the platform can surface other games I'd like.

I would *not* touch: CRDT, netsim, causality, BFT, orchestrator, session, diff, testgen, retro, swarm, sandbox, esbuild, career, bazdmeg, or quiz tools. That's roughly 70% of the toolset.

## Issues & Concerns

- **No game-specific MCP tools** — chess-arena and tabletop-sim are recommended apps but have zero MCP API surface; I can't query game state, join a match, or invite friends via MCP at all
- **No friend/contacts system** — `dm_send` requires knowing someone's email address; there's no way to find friends on the platform or see who's online
- **No presence or lobby tools** — I can't see which friends are currently in a chess game or looking for a tabletop partner
- **No multiplayer matchmaking** — nothing in the tool list helps me find opponents or form a game group
- **Store search discoverability is weak** — `store_search` is the only way in; no browsing by "games" category explicitly shown, and `store_browse_category` requires knowing exact category names upfront
- **`store_app_install` success doesn't tell me how to launch** — installing an app returns a slug/status, but there's no `app_launch` or `get_play_url` tool
- **`display-wall` and `music-creator` have no MCP control surface** — I can't push content to a display wall or control music playback via these tools
- **Overwhelming tool count for a non-technical user** — 180+ tools with no grouping, onboarding, or "start here" guidance; hostile to casual users
- **`auth_check_session` requires a session token as input** — shouldn't this be implicit/automatic? Feels like an implementation detail leaking into the UX
- **No notifications or game invites** — `reminders_create` is the closest thing but it's a personal todo tool, not a social notification system
- **`store_app_reviews`** — limited to 10 reviews by default and requires knowing the slug; no way to browse "most discussed" apps
- **TTS tool (`tts_synthesize`) — interesting but feels random** — no context for why a gamer would use text-to-speech from an MCP tool rather than just… playing a game
- **No session-sharing or co-op URL generation** — if I want to invite a friend to a chess game, there's no tool to generate/share an invite link
- **Round 4 meta-concern: no improvement signals** — after 4 rounds of testing, the gaming persona's core needs (matchmaking, game state, social graph) remain entirely unaddressed by the MCP layer; the platform may be iterating on developer tooling while the social/gaming use case stagnates

---

# Persona: Solo Explorer (Round 1)

## Reaction

As someone who just wants to organize my life, make art, and pick up new hobbies, this tool list is deeply disorienting. I came here because I heard about cleansweep, image-studio, music-creator, and career-navigator — but none of those are directly surfaced as tools I can use. Instead I'm handed ~150 tools, most of which feel like infrastructure plumbing for software developers: CRDT replica sets, PBFT consensus clusters, network topology simulators, diff changesets, swarm agent orchestration. None of that means anything to me.

The tools that *could* serve my goals are buried and sparse: `reminders_create/list/complete` (life organization — okay, but minimal), `career_*` tools (interesting for career navigation), `store_search` / `store_browse_category` (might help me find image-studio or music-creator), `tts_synthesize` (cool for creative use), and `learnit_*` (hobby exploration). That's maybe 15 tools out of 150 that feel relevant to me. The signal-to-noise ratio is terrible.

The `create_*` tools intrigue me — the idea of creating a live app from an idea is exciting — but I have no idea what a "codespace" is or what I'd actually get. The `beuniq_*` persona quiz is charming and feels right for onboarding, but I only spotted it by scrolling to the very end.

Overall feeling: **powerful for developers, bewildering for casual users**.

## Proactivity

I'd start cautiously. First stop: `store_search` with a query like "image" or "art" to find image-studio, then `store_app_detail` to understand what it offers before installing. Parallel curiosity: `store_browse_category` with "creative" to see what's there.

I'd also try `beuniq_start` immediately — a quiz to understand my persona feels welcoming and non-technical. And `reminders_create` is low-risk and immediately useful for life organization.

I'd probably stop before touching anything in: swarm, CRDT, netsim, causality, BFT, diff, testgen, session, orchestrator. Those feel like they'd break something or require context I don't have.

`career_assess_skills` is genuinely interesting — I'd try that if I could figure out the input format.

## Issues & Concerns

- No obvious "start here" tool or onboarding flow — `beuniq_start` exists but is last in the list and unlabeled as an entry point
- The recommended apps (cleansweep, image-studio, music-creator, career-navigator) don't map to any visible tool names — I can't directly invoke them; I have to hunt via `store_search`
- ~100 of the 150+ tools are developer/distributed-systems infrastructure with zero casual-user relevance — there's no filtering or tiering by audience
- `reminders_create` requires an ISO 8601 date — a casual user typing "tomorrow" or "next Friday" will be immediately stuck
- `create_classify_idea` sounds magical but the description is confusing ("not a live app") — unclear what the output actually is or what to do next
- `bootstrap_create_app` requires a `codespace_id` with no explanation of how to get one
- `store_search` requires `category` and `limit` as required fields — I don't know what categories exist; there's no discovery step
- `career_assess_skills` takes a skills list but gives no hint about format (comma-separated? JSON array? free text?)
- No music-creation tools visible at all — music-creator is a recommended app but there's no `music_*` category in the MCP tools
- `chat_send_message` requires a `model` as required field — a casual user has no idea what Claude model to pick
- `tts_synthesize` requires a `voice_id` — forces users to call `tts_list_voices` first, which isn't obvious
- The BYOK, audit-log, CRDT, BFT, netsim, causality, diff, testgen, retro, session, swarm categories add cognitive burden with zero benefit for this persona
- No "help" or "what can you do for me" meta-tool — the list is self-documenting for engineers but not for casual users
- `store_app_personalized` exists but presumably requires install history — useless on first visit
- `billing_list_plans` is buried; I'd want to see this early to understand if useful tools are paywalled before I invest time exploring

---

# Persona: Solo Explorer (Round 2)

## Reaction

Coming back for a second look makes the cracks more visible. On first glance this felt like a powerful platform — and it still has genuine gems for my goals (reminders, learnit, career tools, the quiz system). But the deeper I look, the more this reads as a **developer platform accidentally left open to casual users**. The tool list has ~170 entries and roughly 60-70% are completely irrelevant to me: CRDT replicas, Byzantine fault tolerance, network topology simulation, PBFT consensus rounds. These aren't edge cases — they're entire categories occupying the same flat namespace as "create a reminder." The signal-to-noise ratio is genuinely bad.

The recommended apps (cleansweep, image-studio, music-creator, career-navigator) are what brought me here, but **none of them are directly accessible as MCP tools**. The git status even shows image-studio tools being built, but they're absent from this list. So the onboarding pitch and the actual tool surface are misaligned. I feel like I was handed a menu that lists dishes not yet being served.

## Proactivity

I'd start cautiously with the handful of tools clearly aimed at me:

1. `beuniq_start` → personal quiz to understand my persona fit (seems like the intended entry point)
2. `store_search` with queries like "art", "music", "organizer" to find my recommended apps
3. `reminders_create` for a basic life organization test
4. `learnit_search_topics` to explore hobby learning content
5. `career_assess_skills` since career-navigator was recommended

After those I'd stall. The jump from "casual exploration" to `orchestrator_create_plan` or `crdt_create_set` is vertical. I wouldn't explore further without guidance.

## Issues & Concerns

- **Recommended apps not reachable**: image-studio, music-creator, and cleansweep don't exist as MCP tools — the platform promise and the tool surface don't match
- **~170 tools, most irrelevant**: CRDT, BFT, netsim, causality, swarm, session, diff, testgen, sandbox — these are distributed systems / DevOps primitives that have no business being in a casual user's view
- **Internal tooling leaking**: `plan_generate_batch_audit`, `audit_submit_evaluation`, `audit_compare_personas`, `store_app_deploy`, `store_app_add_variant`, `store_app_declare_winner` are clearly platform-internal admin tools exposed to end users
- **Schema design is developer-hostile**: `workspaces_get` marks both `workspace_id` AND `slug` as required — that's an OR relationship forced into AND
- **`sandbox_exec` is deceptive**: the description literally says "SIMULATED EXECUTION ONLY — no code actually runs" but it's presented as a real tool
- **ISO 8601 required for reminders**: `reminders_create` expects a formatted date string with no mention of how to provide it — a casual user will just write "tomorrow"
- **`bootstrap_create_app` requires `codespace_id`**: no explanation of what that is or how to get one
- **No music tools**: music-creator is a recommended app with zero MCP surface area
- **`bazdmeg_*` is opaque**: the category name means nothing to a new user; the tools (gate checks, superpowers) have no onboarding context
- **`dm_send` with no user discovery**: I can message someone by email but there's no way to find other users
- **`audit_query_logs` and `audit_export` conflict with `audit_*` persona category**: two different `audit` namespaces doing unrelated things
- **No search or filter on the tool list itself**: at 170 tools there's no `capabilities_search` or category browsing from inside the MCP interface
- **`store_skills_list` vs `skill_store_list`**: two nearly identical tools with different naming conventions suggest incomplete consolidation
- **`reminders_complete` but no `reminders_delete` or `reminders_update`**: lifecycle is incomplete
- **`tts_synthesize` returns base64 audio**: a casual user has no obvious way to play that without additional tooling not visible here

---

# Persona: Solo Explorer (Round 3)

## Reaction

Third time looking at this, and I'm increasingly struck by the **fundamental mismatch** between what's advertised and what's available. My recommended apps were `cleansweep`, `image-studio`, `music-creator`, and `career-navigator` — but scanning this entire tool list, I see no `cleansweep` tools, no `music-creator` tools, and `image-studio` is absent too (there's an `mcp-image-studio` package in the codebase but no image tools exposed here). The career tools *are* present and actually look genuinely useful.

What I *do* get is an enormous wall of developer-facing infrastructure: CRDT replicas, Byzantine fault tolerance clusters, network topology simulators, diff/changeset systems, swarm agents, PBFT consensus rounds. These are fascinating for a distributed systems engineer. For someone who wants to organize their life and make art? They're digital noise. The ratio of "tools relevant to my goals" to "total tools" feels like roughly 5:80+.

The `reminders` tools are a bright spot — simple, clear, goal-aligned. The `store_search` and browsing tools give me hope I can find apps. `learnit` is a pleasant surprise for hobby exploration. `career_*` tools are polished and cover a real need. But the experience of finding these gems buried under layers of orchestration primitives is exhausting.

## Proactivity

Starting point would be **`store_search`** with queries like "art", "music", "organize" to see if the apps recommended to me actually exist in the store. Then **`store_featured_apps`** and **`store_new_apps`** for serendipitous discovery. If I find anything promising, **`store_app_detail`** before committing to install.

I'd genuinely use **`reminders_create`** right away — it's the one tool that immediately solves a stated goal with zero setup friction.

**`learnit_search_topics`** interests me for hobby exploration. Searching "watercolor" or "guitar" to see if there's learning content would be my next move.

**`career_assess_skills`** and **`career_get_learning_path`** would get real use — even as a casual user, understanding skill gaps toward a hobby becoming a side income is compelling.

**`beuniq_start`** intrigues me as a persona quiz — though I'm already assigned a persona, so it feels redundant. I'd try it out of curiosity.

I would **not** touch anything in: `crdt`, `netsim`, `causality`, `bft`, `swarm`, `diff`, `testgen`, `retro`, `session`, `orchestrator`, `sandbox`, `bazdmeg`, `store-ab`. These feel like internal developer tooling accidentally exposed to end users.

## Issues & Concerns

- **Recommended apps don't exist as tools**: `cleansweep`, `image-studio`, and `music-creator` were my recommended starting points but have zero corresponding MCP tools exposed — this is a broken onboarding promise
- **~60% of tools are developer infrastructure**: CRDT, BFT, netsim, causality, diff, testgen, retro, session, orchestrator, swarm — none of these have casual user value and they dominate the list
- **No creative tools whatsoever**: Can't generate music, can't do image editing, can't write or compose anything creative through MCP
- **`tts_synthesize` exists but there's no corresponding input tool**: I can convert text to speech but there's no way to record voice, transcribe audio, or create audio content
- **`reminders` is anemic**: No recurring reminders, no categories, no priorities, no snooze — just create/list/complete
- **`cleansweep` is entirely missing**: Listed as a recommended app, zero tools present
- **`chat_send_message` requires knowing a model ID**: A casual user doesn't know what `claude-sonnet-4-6` is; there's no model discovery flow
- **`billing_create_checkout` requires caller-supplied redirect URLs**: A non-developer won't know what to put for `success_url` and `cancel_url`
- **`bootstrap_create_app` requires a `codespace_id`**: Where does a casual user get this? No tool to create a codespace is exposed
- **`store_app_personalized` requires install history**: New users get nothing useful from this until they've already installed things — no cold-start fallback
- **`bazdmeg_*` tools are exposed to end users**: These appear to be internal methodology/QA tooling — a casual user seeing "BAZDMEG superpowers gate check" has no mental model for this
- **`sandbox_exec` is explicitly simulated but isn't labeled as such in the tool name**: The description says "SIMULATED EXECUTION ONLY" — this is deceptive if a user actually tries to run code expecting real output
- **No "help" or "getting started" tool**: 80+ tools, no guided entry point for a first-time user
- **`auth_check_session` requires a `session_token` as required field**: But if I'm already authenticated via MCP, why do I need to supply my own token? This is confusing UX
- **`store_wishlist_*` tools exist but there's no `store_wishlist_list` that returns details**: `store_wishlist_get` exists but the naming is inconsistent with the other `_list` naming convention
- **Observability tools (tool_usage_stats, error_rate, query_errors) are end-user-facing**: These feel like internal monitoring leaked into the public API surface
- **No logout or session management tool**: I can check my session but can't end it through MCP

---

# Persona: Solo Explorer (Round 4)

## Reaction

After four rounds of looking at this, I'm going to be blunt: this is a developer's playground dressed up as a personal productivity platform. The recommended apps — cleansweep, image-studio, music-creator, career-navigator — sound exactly like what I want. But scanning 150+ MCP tools, I see **no direct tools for any of them**. There's no `image_generate`, no `music_create`, no cleansweep equivalent. The "recommended apps" are a promise that the MCP tool surface doesn't keep.

What I do find for my personal use: `reminders_*`, `career_*`, `learnit_*`, `beuniq_*`, `tts_synthesize`, `quiz_*`, and `store_*` for browsing. That's maybe 15 useful tools out of 150+. The other 90% — `crdt_*`, `netsim_*`, `causality_*`, `bft_*`, `swarm_*`, `diff_*`, `testgen_*`, `retro_*`, `sandbox_*`, `session_*` — are distributed systems academics and developer ops. As a casual user, these aren't just irrelevant, they're *actively confusing*. What is Byzantine fault tolerance doing next to my career planning?

## Proactivity

Moderate — I'd explore but with growing frustration. My order would be:

1. **`beuniq_start`** — this feels like the intended onboarding. A quiz to personalize my experience? Yes.
2. **`store_search` / `store_featured_apps`** — to find the image-studio and music-creator apps I was promised.
3. **`store_app_install`** — once I find the apps I want.
4. **`career_assess_skills` + `career_get_learning_path`** — genuinely useful for a hobby pivot or job change.
5. **`reminders_create`** — basic life organization.
6. **`learnit_search_topics`** — to explore a new hobby area.
7. **`tts_synthesize`** — curiosity, fun to experiment with.

I would *not* spontaneously touch any of the `swarm_*`, `crdt_*`, `bft_*`, `netsim_*`, `causality_*`, `orchestrator_*`, or `session_*` categories. They read as noise.

## Issues & Concerns

- The recommended apps (image-studio, music-creator, cleansweep) have **zero corresponding MCP tools** — the surface doesn't deliver on the persona's promise
- 150+ tools with no grouping or filtering for user type creates severe cognitive overload; a casual user should see ~20 tools max
- **Admin tools are exposed**: `skill_store_admin_create`, `skill_store_admin_update`, `skill_store_admin_delete` should never be visible to a general user
- `crdt_*`, `netsim_*`, `causality_*`, `bft_*` are distributed systems academic tools with zero relevance to personal use — their presence is bewildering and undermines trust in the platform's focus
- `bazdmeg_*` category is completely unexplained — the name means nothing to an outsider and the tools (faq_list, memory_search, superpowers_gate_check) feel internal/meta
- **Onboarding path is unclear**: Should I start with `bootstrap_workspace`, `workspaces_create`, or `beuniq_start`? Three different starting points with no obvious winner
- `store_app_deploy`, `store_app_add_variant`, `store_app_assign_visitor`, `store_app_record_impression` — A/B testing infrastructure exposed to end users, not relevant and confusing
- Duplicate discovery surfaces: `create_search_apps`, `store_search`, `learnit_search_topics` all search for apps/content — unclear which to use when
- `dm_send` lets me message users by email but there's no way to find other users or see who's on the platform — isolated feature
- `audit_submit_evaluation`, `plan_generate_persona_audit`, `plan_generate_batch_audit` appear to be internal QA tooling leaked into the public API
- `sandbox_exec` honestly admits "SIMULATED EXECUTION ONLY — no code actually runs" in its description — this breaks trust if you're a developer, and is meaningless noise if you're not
- No tools for the actual creative work: image generation, music creation, or personal journaling/habit tracking that a "casual life organizer" would expect
- `swarm_*` (spawn/stop/redirect agents, broadcast messages) is a complex multi-agent orchestration layer with no casual use case — 12 tools just for this
- `billing_cancel_subscription` with a `confirm` parameter defaulting to false is a reasonable safety pattern, but why is cancellation so prominent in the tool list while upgrade/trial flows are buried?
- `context_index_repo` and `build_from_github` require GitHub URLs — no guidance on what counts as a valid repo or what this feature is actually for in a personal context
- No way to search tools by category from within the MCP surface itself — discovery relies entirely on reading a wall of text

---

# Persona: Startup DevOps (Round 1)

## Reaction

My first impression is **mixed — impressive breadth, but the DevOps signal is buried in noise**. There are genuinely useful tools here for my workflow: observability (`observability_health`, `error_rate`, `query_errors`, `tool_usage_stats`), audit logs (`audit_query_logs`, `audit_export`), storage with diff-checking (`storage_manifest_diff`, `storage_upload_batch`), and the swarm/orchestrator tooling for coordinating agent workloads. The sandbox and esbuild transpile tools could be useful for quick prototyping without spinning up infra.

But the sheer volume — 180+ tools — is **genuinely overwhelming**. A lot of this is platform product (skill store, beUniq persona quizzes, career matching, CRDT/BFT distributed systems simulations) that has zero relevance to my day job. The tools I actually care about are scattered across 15+ categories with no obvious "start here for ops" path.

The distributed systems simulation tools (CRDT, netsim, causality, BFT) feel like educational demos more than production ops primitives. Cool concept, but I'm not going to run a PBFT consensus round to debug my deploy pipeline.

## Proactivity

I'd start focused and expand only if rewarded:

1. **`observability_health` + `error_rate` + `query_errors`** — First thing any ops engineer does: see if anything is on fire.
2. **`audit_query_logs`** — Who did what, when? Essential for compliance even in a startup.
3. **`swarm_health` + `swarm_get_metrics`** — If I'm coordinating agents across my team, I want to see agent health immediately.
4. **`storage_manifest_diff` → `storage_upload_batch`** — If I'm deploying assets, I'd validate this flow is actually diff-aware and not just marketing copy.
5. **`bootstrap_status`** — Understand what's already configured before touching anything.

I'd be **moderately proactive** — the observability and audit tools are immediately relevant and I'd dig in. I'd skip the career, learnit, quiz, CRDT, netsim, persona audit, and TTS categories entirely without a strong use case.

## Issues & Concerns

- **No CI/CD integration tools** — no webhook triggers, no pipeline status checks, no GitHub Actions or Cloudflare Pages deploy hooks. This is a major gap for a "DevOps" persona.
- **No alerting or on-call primitives** — `observability_health` shows current state but there's no way to set thresholds or get notified when error rate spikes. Observability without alerting is just logging.
- **`sandbox_exec` is explicitly fake** — "SIMULATED EXECUTION ONLY" in the description is a significant credibility problem. An ops engineer expecting real code execution will be badly surprised.
- **No secret rotation or vault management** — `bootstrap_connect_integration` stores credentials but there's no rotate, audit-access, or expiry mechanism visible.
- **Storage tools lack delete/rollback** — `storage_list` mentions "rollback inspection" but I see no `storage_rollback` or `storage_delete` tool. Read-only rollback inspection is not rollback.
- **`workspaces_update` requires all fields as required** — `workspace_id`, `name`, and `slug` all marked required even when you only want to rename. Annoying API design.
- **No environment promotion workflow** — no concept of staging → production promotion, canary deploys, or feature flags beyond the `get_feature_flags` read-only tool.
- **Tool categorization is inconsistent** — `audit_submit_evaluation` and `audit_query_logs` are both "audit" but serve completely different purposes (persona UX auditing vs. security audit logs). Confusing.
- **180+ tools with no grouping or recommended flows** — needs a "DevOps quickstart" meta-tool or at minimum a `get_environment` that surfaces which tools are relevant to my current context.
- **`swarm_spawn_agent` requires `machine_id` and `session_id`** — unclear where these come from without prior documentation. No self-discovery path.
- **No infrastructure-as-code integration** — no Terraform, Pulumi, or Wrangler config management tools. If this targets Cloudflare Workers teams, wrangler.toml management would be table stakes.
- **Billing tools expose cancellation without 2FA or confirmation guard** — `billing_cancel_subscription` with `confirm: true` is one tool call away from cancelling the account. An agent mistake or prompt injection could trigger this.

---

# Persona: Startup DevOps (Round 2)
## Reaction

Coming back for a second look, the tool list is more underwhelming than it first appeared. There's a lot of surface area here — 150+ tools — but very little of it maps to what I actually do day-to-day. The observability tools (`tool_usage_stats`, `error_rate`, `observability_health`) looked promising on first glance, but they're scoped entirely to MCP tool call telemetry, not to my actual services. The swarm/orchestrator/CRDT/BFT/netsim cluster is an interesting distributed systems playground but feels like a research toy, not something I'd reach for during an incident at 2am. The billing, skill store, and career tools are pure noise for me. I'm here to ship and not break things — I want deploy status, rollback, log queries, and infrastructure health. I get none of that in a production-grade form.

## Proactivity

I'd move fast on a narrow subset. First: `bootstrap_status` and `auth_check_session` to understand what workspace/identity context I'm operating in. Then `observability_health` and `error_summary` to see if there's any signal I can extract even if it's MCP-scoped. I'd try `storage_list` and `storage_manifest_diff` to understand how the R2 asset pipeline works — that's a real deployment primitive I could wire into a deploy script. The `audit_query_logs` tool is interesting for compliance traces. I'd also poke `get_feature_flags` to understand if there's gradual rollout capability. That's roughly where I'd stop before deciding this platform isn't a fit for core infra work.

## Issues & Concerns

- **No real deployment hooks** — `storage_upload_batch` covers static assets to R2, but there's no tool to trigger a Cloudflare Workers deploy, check deploy status, or roll back a deployment
- **Observability is MCP-introspection, not service observability** — `error_rate`, `observability_health`, `query_errors` all query MCP call logs, not application logs or service errors; completely useless for debugging a prod incident
- **No log streaming or tail** — no way to query Cloudflare Workers logs, tail logs in real-time, or search structured logs from my services
- **No alerting or on-call integration** — no PagerDuty, no webhook triggers, no "alert when error rate spikes" primitive
- **`sandbox_exec` is fake** — the description literally says "SIMULATED EXECUTION ONLY — no code actually runs"; this is a trust-breaking discovery buried in the description, not surfaced prominently
- **Secret/credential storage is opaque** — `bootstrap_connect_integration` stores credentials but there's no way to list what's stored, test connectivity, or rotate secrets; `byok_*` is only for AI provider keys
- **No environment promotion workflow** — no staging → production promotion, no canary/blue-green beyond the A/B store variants (which are for app UI, not infra)
- **A/B testing tools are store-app scoped** — `store_app_add_variant`, `store_app_declare_winner` etc. are for the spike.land app store, not for my own service deployments
- **`storage_list` requires mandatory `prefix`, `limit`, `cursor` params** — all marked required even though they're logically optional filters; breaks basic discoverability
- **swarm tools have no auth boundary** — `swarm_broadcast` sends to "all active agents" with no workspace scoping mentioned; blast radius unclear
- **No infrastructure-as-code integration** — no Terraform state queries, no Wrangler config management, no way to inspect bindings or KV namespaces
- **Distributed systems tools (CRDT, netsim, BFT, causality) are educational, not operational** — interesting for a distributed systems course, not for a startup that needs to ship
- **Tool count to useful-tool ratio is poor** — 150+ tools but maybe 10-15 are actionable for a DevOps workflow; cognitive overhead of navigating this is real
- **No cost visibility beyond swarm token costs** — `billing_status` shows subscription tier, `swarm_get_cost` shows agent token spend, but nothing about Cloudflare usage, D1 row reads, R2 bandwidth
- **`retro_*` and `career_*` categories are completely off-persona** — interview prep and resume building have no business being surfaced in a DevOps context
- **No webhook or event subscription model** — everything is pull-based polling; I can't subscribe to "alert me when deploy fails" or "notify on error spike"

---

# Persona: Startup DevOps (Round 3)

## Reaction

Three rounds in, and I'm more skeptical than impressed. The tool surface area is massive — 180+ tools across 40+ categories — but from a DevOps standpoint, the coverage is frustratingly uneven. The observability tools (`tool_usage_stats`, `error_rate`, `observability_health`, `query_errors`) look legitimately useful. So does `audit_query_logs`. The `storage_manifest_diff` + `storage_upload_batch` pattern is solid engineering — I appreciate the SHA-256 pre-flight diff before uploading.

But then you have 30+ tools for CRDT simulation, BFT consensus, and causal clocks. That's a distributed systems classroom, not a startup ops toolkit. The "swarm" agent coordination tools feel half-baked — why would I route production ops through an agent swarm with no health guarantees? And `sandbox_exec` admitting it's **simulated execution only** buried in the description is a red flag. That's not a sandbox — that's a lie.

The persona-specific recommended apps (ops-dashboard, codespace, qa-studio, app-creator) aren't directly reachable via MCP — I have to go through the store search. No direct ops-dashboard tool exists. The mismatch between "recommended for you" and "what you can actually do" is jarring.

## Proactivity

Medium-high, but narrowly targeted. I'd go straight for the ops-relevant tools and ignore the academic simulation categories entirely:

1. `observability_health` + `error_rate` + `error_summary` — baseline: is the platform healthy right now?
2. `tool_usage_stats` — understand what's being hit most; informs where failures will cascade
3. `audit_query_logs` — check if my team's actions are being logged properly (compliance reflex)
4. `storage_list` + `storage_manifest_diff` — test the deploy pipeline; does diff actually work or does it over-upload?
5. `bootstrap_status` — understand workspace state before touching anything else
6. `settings_list_api_keys` — key rotation hygiene check
7. `swarm_health` — curiosity about agent health, but low confidence it's production-grade

I would **not** proactively touch billing tools, CRDT/BFT/netsim, career tools, or persona audit tools. They're noise for my use case.

## Issues & Concerns

- `sandbox_exec` is labeled as "SIMULATED EXECUTION ONLY" — this is a major trust issue. A DevOps engineer who runs code in a "sandbox" expecting real output and gets synthetic results could make bad decisions. This needs a prominent warning or should be removed entirely
- No webhook or alerting tools. I can query errors but can't wire up alerts to PagerDuty, Slack, or any on-call system. Observability without alerting is read-only archaeology
- `storage_upload_batch` has no rollback tool. If a deploy corrupts assets, `storage_list` lets me see the damage but there's no `storage_rollback` or `storage_delete`
- The `swarm_*` tools expose no authentication boundary. Can any agent message any other agent? The `swarm_broadcast` to ALL active agents is a blast-radius concern with no scope limiting
- Secret/credential storage via `bootstrap_connect_integration` — no mention of encryption standard, rotation schedule, or access audit. "Encrypted vault" is vague marketing, not ops-grade assurance
- `billing_create_checkout` requires hardcoded `success_url` and `cancel_url` as required fields — why is URL plumbing a caller concern for an MCP tool?
- No environment promotion tools (dev → staging → prod). The deploy story is flat; there's no concept of staged rollouts or canary deployments
- `capabilities_request_permissions` creates an approval request but there's no SLA or escalation path mentioned — approval could block indefinitely
- The `create_reaction` tool (auto-trigger one tool when another fires) has no rate limiting or circuit breaker mentioned — a misconfigured reaction loop could hammer the API
- No log streaming — `query_errors` is polling-only with no tail/stream capability. Incident response with polling is painful
- `orchestrator_*` and `session_*` tools overlap heavily in purpose (both coordinate multi-step work) with no clear guidance on when to use which
- Tool schema inconsistency: most required fields make sense, but `workspaces_get` requires BOTH `workspace_id` AND `slug` even though either alone should suffice — forces callers to have data they may not have
- `dm_send` requires email address — I'd expect user ID or handle for internal messaging; email is a PII concern in tool logs
- No infrastructure-as-code export. I can create workspaces/apps but can't dump the config as Terraform or YAML for gitops-style management
- 180+ tools is genuinely too many to reason about. There's no tool discovery hierarchy or capability grouping beyond flat category names — cognitive overload is real

---

# Persona: Startup DevOps (Round 4)
## Reaction

By round 4, the honeymoon is over. My initial impression was promising — observability tools, audit logs, storage, secrets management. But drilling deeper, this toolkit has a fundamental identity problem for a DevOps engineer: it's built for *application developers on spike.land's platform*, not for ops engineers managing infrastructure. The 80+ tools feel impressive until you realize maybe 15 of them are relevant to my actual job.

The critical gut-punch: `sandbox_exec` literally says "SIMULATED EXECUTION ONLY — no code actually runs." That's a toy, not a tool. If I'm evaluating this for my team, that single disclosure would make me question what else here is smoke and mirrors. The observability tools (`observability_health`, `error_rate`, `query_errors`) only monitor *MCP tool calls* — not my actual services. I can't see my pod memory usage, my DB connection pool saturation, or my edge worker error rates. That's the observability I actually need.

The academic distributed systems tools (CRDT, BFT consensus, netsim, causality clocks) are intellectually interesting but have zero place in a startup ops workflow. That's roughly 30 tools I'll never touch, adding noise to an already crowded namespace.

## Proactivity

**High priority — would try immediately:**
- `observability_health` + `error_rate` + `query_errors` to understand what's actually being tracked and whether it maps to anything I care about
- `audit_query_logs` — compliance and change tracking matters even at startups
- `bootstrap_status` — understand the workspace model before building on it
- `settings_create_api_key` — need programmatic access for CI integration
- `storage_manifest_diff` + `storage_upload_batch` — closest thing to a deploy primitive

**Would investigate skeptically:**
- `swarm_*` tools — sounds like Kubernetes but probably isn't. I'd probe whether "spawning agents" maps to real compute or is just a database record
- `bootstrap_connect_integration` — what integrations actually exist? The tool schema hints at credentials but doesn't list supported services

**Would skip entirely:**
- All CRDT, BFT, netsim, causality tools
- Career tools
- beUniq persona quiz
- TTS tools

## Issues & Concerns

- `sandbox_exec` is explicitly fake ("no code actually runs") — this is a fundamental trust violation; if this is labeled as an execution tool, it should execute code
- Observability only covers MCP layer, not actual infrastructure — CPU, memory, latency of user-deployed services are invisible
- No real CI/CD primitives — no webhook triggers, no pipeline status, no deployment gates
- No container or Kubernetes integration whatsoever
- `workspaces_get` marks both `workspace_id` AND `slug` as required — but they're alternatives, not complements; schema is wrong
- `bootstrap_create_app` exists but there's no `destroy_app` or teardown equivalent — creates a one-way door
- No secrets rotation — `bootstrap_connect_integration` stores credentials but there's no update/rotate endpoint
- The swarm tools look like compute orchestration but appear to be a messaging/status database, not actual agent compute
- ~30 distributed systems simulation tools (CRDT, BFT, netsim) pollute the namespace for anyone not doing academic CS research
- `storage_list` requires `prefix`, `limit`, and `cursor` as required fields — cursor should be optional for initial listing
- No alerting integrations (PagerDuty, OpsGenie, Slack webhook) — a DevOps tool without alerting is incomplete
- No rollback mechanism — you can upload files but can't roll back to a previous deploy
- Tool count (80+) creates discoverability friction without a categorized help tool or capability index
- `billing_create_checkout` requires both `success_url` and `cancel_url` as required — description says these default to spike.land pages, so they shouldn't be required
- No environment promotion workflow (dev → staging → prod) — critical for "move fast without breaking things"
- `chat_send_message` feels out of place here — it's an AI chat passthrough in an ops toolkit
- The recommended apps for this persona (ops-dashboard, codespace, qa-studio) aren't surfaceable through any MCP tool — can't even check if they're installed
- Error codes in `report_bug` are optional but the field is listed as required in the schema (`"required":["title","description","severity","reproduction_steps","error_code"]`) — inconsistency between description and schema

---

# Persona: Technical Founder (Round 1)

## Reaction

As a solo technical founder, my first reaction is: this is *a lot*. The breadth is impressive — auth, billing, storage, AI gateway, app creation, skill store, observability, swarm orchestration, CRDT/BFT simulations — but it reads more like an infrastructure catalog than a founder toolkit. My recommended apps were `app-creator`, `brand-command`, `social-autopilot`, and `ops-dashboard`, yet I can't find MCP tools that obviously correspond to branding or social media automation. There's a mismatch between what was marketed to me and what's actually available.

The tools I'd genuinely reach for — `bootstrap_create_app`, `billing_list_plans`, `store_search`, `esbuild_transpile`, `workspaces_create` — are buried alongside distributed systems primitives (CRDT replica sets, PBFT consensus clusters, causal clocks) that feel like they belong in an academic demo, not a founder productivity platform. Power is here, but the signal-to-noise ratio is low for my use case.

## Proactivity

I'd explore aggressively but in a focused funnel:

1. **`bootstrap_status`** first — understand what's already set up before doing anything else
2. **`billing_list_plans`** — know what I'm getting into cost-wise before committing
3. **`workspaces_create`** — set up my company workspace
4. **`store_search`** with queries like "brand", "social", "analytics" — verify the recommended apps actually exist
5. **`create_list_top_apps`** and **`store_featured_apps`** — understand what's popular and what I can build on
6. **`esbuild_transpile`** — test whether the live coding environment is usable for shipping a real product
7. **`chat_send_message`** — use the AI gateway to prototype copy and brand voice
8. **`reminders_create`** — set up operational checkpoints

I would *not* explore swarm, CRDT, netsim, causality, or BFT tools until I had a working product. They'd remain a curiosity.

## Issues & Concerns

- **Schema types are wrong everywhere** — `confirm`, `isActive`, `isFeatured`, `remote_only`, `unreadOnly` are all typed as `string` but should be `boolean`; `rating`, `limit`, `offset`, `node_count` should be `number` — this suggests the MCP layer isn't type-safe and will cause friction with AI tool-callers
- **`auth_check_session` marks `session_token` as required** — how do I obtain one? There's no `auth_login` or `auth_signup` tool; onboarding is broken at step 0
- **`workspaces_get` marks both `workspace_id` AND `slug` as required** — these should be mutually exclusive alternatives, not both mandatory
- **`bootstrap_create_app` requires `codespace_id`** — but there's no tool to create a codespace; dead end in the bootstrap flow
- **`sandbox_exec` explicitly says "SIMULATED EXECUTION ONLY"** — a tool that doesn't actually execute code is deceptive and useless; should be removed or clearly labeled as a stub
- **No app analytics** — I can deploy apps but I can't see MAU, conversion, or engagement metrics for *my* apps (not platform-wide observability)
- **No custom domain management** — critical for branding; no way to attach `mybusiness.com` to my app
- **No team/collaborator management** — solo founder becomes a team; no invite, role assignment, or shared workspace access tools
- **`brand-command` and `social-autopilot` recommended apps have zero corresponding MCP tools** — the persona onboarding promised these capabilities but they don't exist in the tool surface
- **`dm_send` requires knowing the recipient's email address** — no user directory or search; unusable for cold outreach within the platform
- **CRDT, netsim, causality, bft categories are irrelevant to this persona** — their presence without categorization or filtering makes discovery harder
- **`billing_create_checkout` requires `success_url` and `cancel_url` as required** — why does a platform-native checkout need me to supply redirect URLs? This should have sensible defaults
- **No webhook or event subscription mechanism** — no way to react to billing events, new installs, or user actions in my apps programmatically
- **`skill_store_admin_*` tools are exposed to non-admin users** — calling them will presumably fail with auth errors, but they shouldn't be visible at all unless the user has admin role
- **`store_app_deploy` / A-B testing tools require a `base_codespace_id`** — again, codespace creation is a missing primitive that blocks multiple workflows
- **No search or filtering within agents or sessions by project** — if I'm running multiple products, there's no namespace isolation
- **`report_bug` says reports go to `spike.land/bugbook` (public)** — no option for private/internal bug reporting; a concern for security-sensitive reports

---

# Persona: Technical Founder (Round 2)

## Reaction

On second look, this tool set is more confusing than empowering. The surface area (~180+ tools) is enormous, but it's poorly segmented for a founder's actual workflow. The tools I'd care about — app creation, billing, AI chat, storage, agents — are buried alongside a graveyard of distributed systems primitives (CRDT, BFT, netsim, causality clocks) that have zero relevance to building or marketing a business. It reads less like a product for founders and more like a research lab's internal toolbox that someone bolted a billing page onto. Round 2 makes me more skeptical: the _recommended_ apps (`brand-command`, `social-autopilot`, `ops-dashboard`) don't map to any discoverable MCP tools. That's a broken promise at the front door.

## Proactivity

I'd start with `bootstrap_status` to understand what's already set up, then `billing_list_plans` → `billing_status` to know my constraints. I'd attempt `bootstrap_create_app` for a quick ops dashboard MVP. After that, `store_search` to find anything branded as "brand-command" or "social-autopilot." I'd use `chat_send_message` as a fallback for anything not covered by tools. I'd actively ignore the CRDT/BFT/netsim/causality/career/quiz/learnit clusters entirely — they're noise for my use case.

## Issues & Concerns

- `sandbox_exec` description literally reads "SIMULATED EXECUTION ONLY — no code actually runs" — this is a fake tool masquerading as real functionality, which is a trust-killer
- `bootstrap_create_app` requires a `codespace_id` as a mandatory param, but there is no tool to create or list codespaces; the flow is broken before it starts
- `auth_check_session` marks `session_token` as **required** but the description says "Optional session token" — schema contradicts description
- `workspaces_get` requires **both** `workspace_id` and `slug` — you'd only ever have one, making this always fail or require guessing
- Dual parallel APIs for skills: `skill_store_*` and `store_skills_*` — identical domain, duplicated tool surface, no explanation of difference
- `billing_create_checkout` requires `success_url` and `cancel_url` as mandatory — as an MCP-only user I have no browser context to provide redirect URLs
- Recommended apps (`brand-command`, `social-autopilot`, `ops-dashboard`, `app-creator`) have no corresponding MCP tools — the persona onboarding promise is broken
- No social media publishing tools at all — `social-autopilot` is recommended but there's no `post_tweet`, `schedule_content`, `publish_linkedin`, etc.
- No brand asset tools — no logo generation, color palette, copywriting, or brand kit management
- ~40% of tools (CRDT, BFT, netsim, causality, career assessment, quiz, learnit, beuniq) are entirely irrelevant to this persona with no way to filter them out
- `bazdmeg_*` tools reference an internal methodology with no external documentation — opaque and unusable without insider context
- The A/B testing tools (`store_app_*` under `store-ab`) appear to be for the spike.land store's own apps, not user-deployed apps — misleading category name
- `create_check_health` checks if a codespace has "non-default content" but codespaces can't be created via MCP — circular dead-end
- No webhook or event subscription mechanism — no way to react to billing events, deploys, or user activity outside of polling
- `observability_*` tools surface raw error rates and latency stats but with no drill-down or alerting — useful data, unusable without a dashboard UI
- Tool count (~180) with no persona-filtered view makes onboarding cognitively overwhelming; a founder needs a "starter set" of 10-15 tools, not a flat list of 180

---

# Persona: Technical Founder (Round 3)

## Reaction

After two rounds, I'm now looking past the surface appeal and finding real friction. The sheer volume (~200 tools across 30+ categories) is a liability disguised as a feature. As a solo founder, I don't have time to audit a tool ecosystem this large just to find the 15 tools that are actually relevant to me.

What's genuinely useful: `billing_*`, `workspaces_*`, `store_*`, `bootstrap_*`, `agents_*`, and the `observability_*` cluster. The orchestrator + session + swarm triad is legitimately powerful if it works. `esbuild_transpile` is a thoughtful inclusion.

What kills the vibe: The distributed systems simulation tools (`crdt_*`, `netsim_*`, `causality_*`, `bft_*`) and `career_*` tools feel like they belong to a completely different product aimed at CS students or academia. Their presence here is jarring and erodes confidence that this platform knows who it's for.

The `sandbox_exec` tool's own description reads "SIMULATED EXECUTION ONLY — no code actually runs" — that's a trust-destroying disclosure buried in a tool description. If I hadn't read carefully, I'd have built a workflow around fake execution.

## Proactivity

Round 3 approach — I'd skip onboarding and go straight to adversarial testing:

1. **`bootstrap_status`** — State of the world before I touch anything
2. **`billing_list_plans`** then **`billing_status`** — Understand the paywall before investing time
3. **`store_featured_apps`** → **`store_app_detail` on "app-creator"** — Verify the recommended apps actually exist and aren't stubs
4. **`tool_usage_stats`** — What are other users actually calling? Real signal on what works
5. **`observability_health`** + **`error_rate`** — How stable is this platform before I depend on it?
6. **`bootstrap_create_app`** with a minimal real app — The ultimate integration test

## Issues & Concerns

- **`sandbox_exec` is fake** — "SIMULATED EXECUTION ONLY" in the description is a dealbreaker buried where most users won't see it; this should fail loudly or not exist
- **`auth_check_session` marks `session_token` as required** but the description says "optional" — contradictory schema
- **`bootstrap_create_app` requires `codespace_id`** but there's no tool to create or list codespaces — circular dependency with no resolution path documented
- **Three overlapping agent systems**: `agents_*`, `swarm_*`, and `session_*` all appear to manage agents — no clear guidance on when to use which
- **`store_*` vs `create_*` vs `bootstrap_*`** — three different app creation/management flows with unclear boundaries; which one creates a real, live, user-facing app?
- **No social posting tools** despite "social-autopilot" being a recommended app for this persona — the app exists in the store but the underlying MCP tools are absent
- **No CRM, lead tracking, or customer analytics** — the core founder loop of acquire → convert → retain is unaddressed
- **`career_*` tools are completely off-persona** — salary lookups and resume builders have no place in a founder-focused product without a clear signal this is intentional
- **BAZDMEG tools are opaque** — `bazdmeg_superpowers_gate_check` and related tools are jargon-heavy with no discoverable documentation from within the tool descriptions themselves
- **`billing_create_checkout` requires `success_url` and `cancel_url` as required fields** — for an MCP client (not a browser), these are meaningless; the tool assumes a web context that doesn't apply
- **`store_app_rate` and wishlist tools** presuppose I'm a consumer, not a producer — no equivalent tools for tracking *my own* app's ratings or managing my published store listing
- **Reaction rules (`create_reaction`, `list_reactions`)** have no examples and no discoverable trigger vocabulary — what events actually fire? No enumeration provided
- **No webhook or push notification primitive** — the platform is entirely pull-based; I can't get notified when a swarm agent completes or a billing event occurs without polling
- **`tts_synthesize` returns base64 audio** — useful in theory but no guidance on what to do with it in an MCP context; no `tts_save` or delivery mechanism
- **Tool count is unsearchable from within the MCP itself** — there's `mcp_registry_search` for external servers but no `tool_search` for the 200 tools in this very server
- **`report_bug` exists but no `feature_request`** — feedback loop is asymmetric; bugs get tracked, product ideas don't

---

# Persona: Technical Founder (Round 4)

## Reaction

By round 4, the initial "wow, so many tools" reaction has curdled into genuine skepticism. The breadth here is impressive on paper — orchestration, swarms, A/B testing, BYOK, esbuild-in-the-cloud — but the signal-to-noise ratio for my actual use case (build, brand, market) is poor. I count roughly 200+ tools, and a meaningful chunk of them (CRDT, netsim, causality, BFT, career/resume, beuniq personality quiz, learnit) are completely orthogonal to running a startup. These feel like internal demos or academic experiments that leaked into the production API surface. That's a red flag: it suggests the tool catalog isn't being curated with my persona in mind, just grown.

The recommended apps — `app-creator`, `brand-command`, `social-autopilot`, `ops-dashboard` — are conspicuously absent as direct MCP tools. They're store apps, not callable functionality. So the persona targeting on the landing page creates an expectation that the MCP tools don't fulfill.

## Proactivity

I'd start with a targeted sequence, not a broad exploration:

1. `bootstrap_status` — understand what workspace state I'm starting from
2. `billing_list_plans` → `billing_status` — know my tier before building anything
3. `store_search` with queries like "marketing", "brand", "social" — see if the recommended apps actually exist and what they do
4. `create_list_top_apps` / `create_list_recent_apps` — competitive landscape of what's been built
5. `bootstrap_create_app` — attempt to ship something, which is the real stress test

I'd probably stop short of the swarm/orchestrator/session/diff/testgen cluster until I had something working. Those are power tools that assume you're already productive on the platform.

## Issues & Concerns

- **`sandbox_exec` is explicitly labeled "SIMULATED EXECUTION ONLY"** — the description says no code actually runs and it returns synthetic output. This is a fake tool in a production API and should either be removed or clearly gated as a prototype
- **Recommended apps (`brand-command`, `social-autopilot`, etc.) have no corresponding MCP tools** — the persona targeting creates a false promise
- **No social/marketing primitives** — a founder trying to market has no tools here for scheduling posts, drafting copy, or managing campaigns
- **`workspaces_get` marks both `workspace_id` AND `slug` as required** — you realistically have one or the other; this schema is wrong and likely causes unnecessary errors
- **`workspaces_update` requires `workspace_id`, `name`, AND `slug` all as required** — partial updates (rename only) should be possible
- **`storage_list` marks `prefix`, `limit`, and `cursor` as required** — these are pagination/filter params that should be optional
- **CRDT, BFT, netsim, causality tools** — Byzantine fault tolerance and Lamport clock simulations are distributed systems pedagogy, not founder tools; their presence dilutes the catalog
- **Career tools (resume builder, job matching, interview prep)** — completely irrelevant to a founder; signals the platform hasn't segmented its tool surface by persona
- **`beuniq_*` persona quiz and `bazdmeg_*` FAQ/memory tools** — appear to be internal spike.land tooling exposed publicly with no documentation context
- **Auth is circular** — `auth_check_session` requires a `session_token` as required input, but there's no `auth_login` or token-acquisition tool; unclear how a new user bootstraps
- **`bootstrap_create_app` requires `codespace_id`** — no tool in the set creates or lists codespaces; this is a dangling dependency with no resolution path
- **observability tools (`tool_usage_stats`, `error_rate`, `query_errors`) show my own MCP call data** — useful for platform debugging but not for monitoring MY apps built on the platform
- **No webhooks or outbound integration tools** — can't connect to Stripe, GitHub, Slack, or other founder-critical services
- **`dm_send` requires knowing the recipient's email** — no user discovery mechanism, so this is only useful if you already know who you're messaging
- **The swarm/session/orchestrator cluster has 40+ tools** — powerful in theory but has no opinionated "here's how to start" entry point; cognitive overhead is high
- **No analytics for apps I publish** — I can see MCP tool usage stats but not user engagement with my own created apps
- **A/B test tools (`store-ab`) are sophisticated but gated by needing a `codespace_id`** — same blocking dependency as app creation