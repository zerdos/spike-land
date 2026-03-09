# Open Issues Handoff

## Issue 1: Tailwind preview runtime is still unresolved

The preview stack no longer points at `unpkg`, but the replacement is not yet a proven first-party runtime. The lightweight preview path in [src/frontend/platform-frontend/ui/hooks/useTranspiler.ts](/Users/z/Developer/spike-land-ai/src/frontend/platform-frontend/ui/hooks/useTranspiler.ts) injects `https://js.spike.land/@/workers/tw.worker.js` as a classic `<script>` tag. The Monaco/editor preview path in [src/frontend/monaco-editor/index.html](/Users/z/Developer/spike-land-ai/src/frontend/monaco-editor/index.html) and [src/frontend/monaco-editor/core-logic/services/CodeProcessor.ts](/Users/z/Developer/spike-land-ai/src/frontend/monaco-editor/core-logic/services/CodeProcessor.ts) assumes the same worker URL exists and behaves like a normal browser-servable JavaScript asset.

That path is still structurally incomplete. The source worker in [src/frontend/monaco-editor/core-logic/workers/tw.worker.ts](/Users/z/Developer/spike-land-ai/src/frontend/monaco-editor/core-logic/workers/tw.worker.ts) now imports `@tailwindcss/browser`, but the checked-in built asset in [src/frontend/monaco-editor/dist/@/workers/tw.worker.js](/Users/z/Developer/spike-land-ai/src/frontend/monaco-editor/dist/@/workers/tw.worker.js) is still an empty no-op bundle. The repository therefore has two contradictory truths at once: the source says Tailwind should load, while the committed runtime artifact says it does nothing. Until the build output and the served asset are aligned, preview behavior is not trustworthy.

The runtime contract is also not actually verified. Existing tests around `useTranspiler` and the Tailwind dev setup assert generated HTML or module behavior, but they do not execute the remote script path end-to-end. That means the current green test state does not prove that the preview can fetch, execute, and compile Tailwind in the browser. This is still an open runtime risk, not a cosmetic cleanup.

## Issue 2: Tailwind dev setup removes unrelated styles

The cleanup logic in [src/frontend/monaco-editor/core-logic/lib/tw-dev-setup.ts](/Users/z/Developer/spike-land-ai/src/frontend/monaco-editor/core-logic/lib/tw-dev-setup.ts) currently removes every `head > style` element before loading the worker. That is broader than the Tailwind problem it is trying to solve. Any inline style block inserted by application code, preview scaffolding, Emotion, or future runtime utilities can be deleted as collateral damage.

This is an architectural issue because the setup layer has no ownership boundary over the styles it removes. It assumes all head-level style tags are disposable Tailwind output, which is not true in a preview environment that also injects theme tokens, error styling, or component-library styles. Until cleanup is narrowed to Tailwind-owned nodes or a marked output channel, the preview remains vulnerable to non-deterministic style loss.

## Issue 3: LearnIt has no local persistence model in D1

The MCP wrapper for LearnIt exists in [src/edge-api/spike-land/core-logic/tools/learnit.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/core-logic/tools/learnit.ts), but it is still entirely proxy-backed. The file explicitly states that `learnItContent` is not in the D1 schema, and every tool delegates to `/api/learnit/...` on the remote spike.land API. The worker can expose LearnIt commands, but it does not own the data or the query model.

This is a deeper gap than the earlier `reactions` migration. LearnIt needs a canonical local model for topic identity, slug, title, description, content, publication status, view counts, timestamps, parent/child relationships, related-topic edges, and prerequisite dependencies. Without those tables, the worker cannot support topic lookup, search, popularity ordering, recent ordering, or relationship traversal locally. The old sketch in [docs/github-issues-snapshot.json](/Users/z/Developer/spike-land-ai/docs/github-issues-snapshot.json) also points to a missing relationship model, which confirms that graph structure was intended but has not been re-established in the D1-backed implementation.

There are already consumers expecting LearnIt to behave like a first-class local product surface. [src/frontend/platform-frontend/ui/src/components/tools/JsonSchemaForm.tsx](/Users/z/Developer/spike-land-ai/src/frontend/platform-frontend/ui/src/components/tools/JsonSchemaForm.tsx) fetches `/learnit/recent`, and published content under [content/blog/think-slowly-ship-fast.mdx](/Users/z/Developer/spike-land-ai/content/blog/think-slowly-ship-fast.mdx) links heavily into `/learnit/...` routes. The worker layer is present, the topic graph is not.

## Issue 4: `/create` is only partially migrated off the legacy API

The `/create` tool family in [src/edge-api/spike-land/core-logic/tools/create.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/core-logic/tools/create.ts) no longer depends entirely on the legacy API, but the migration is incomplete. Local classification and session-health assessment now exist, yet multiple operations still call `apiRequest` against `/api/create/...`, including app search, app detail lookup, published listings, top apps, and status checks. `create_check_health` also still contains a fallback to the old remote endpoint when the live session path is unavailable.

That means `/create` currently spans two incompatible authority models. Some behavior is derived locally from heuristics and live session inspection, while discovery and retrieval still depend on the old centralized API contract. As long as those query surfaces remain remote, the tool family is not self-contained inside the worker and still inherits remote drift, remote availability, and schema coupling.

## Issue 5: Reactions persistence is local, but reaction execution is not wired

The `reactions` migration solved storage, not orchestration. The D1 tables now exist in [src/edge-api/spike-land/db/db/schema.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/db/db/schema.ts), the tools in [src/edge-api/spike-land/core-logic/tools/reactions.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/core-logic/tools/reactions.ts) can create, list, delete, and inspect logs, and the migrations are present. What is still missing is the runtime layer that actually listens for tool outcomes, matches eligible reactions, invokes the target tools, and records execution results automatically.

Today the reaction system is a persisted rule registry with a log surface, not a fully reactive execution graph. The tool descriptions still promise event-driven composition, but there is no corresponding dispatcher or trigger pipeline in the worker runtime. Until that execution path exists, reactions remain administratively configurable but behaviorally incomplete.

## Issue 6: Core `apps` tooling still depends on the remote spike.land API

The main app-management surface in [src/edge-api/spike-land/core-logic/tools/apps.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/core-logic/tools/apps.ts) is still architected as a proxy. The file header is explicit: most operations delegate to the spike.land API for codespace transpilation and AI agent features. That dependency affects the full lifecycle: app creation, listing, detail retrieval, agent chat, message history, status updates, recycle-bin actions, permanent delete, version history, batch status updates, and message posting.

This remains an architectural boundary issue because `apps.ts` is one of the main product surfaces exposed through MCP. As long as it depends on a remote service for core state transitions and retrieval, the worker is not the system of record for app lifecycle management. The local worker cannot guarantee availability, consistency, or test isolation for its own top-level product primitive.

## Issue 7: Store app social and recommendation surfaces are still proxy-backed

The user-facing store operations in [src/edge-api/spike-land/core-logic/tools/store/apps.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/core-logic/tools/store/apps.ts) still proxy to `/api/store/...`. That includes ratings, review retrieval, wishlist add/remove/list, recommendations, personalized recommendations, and store statistics. None of those tool behaviors are backed by local D1 tables or local ranking logic yet.

This is not just a thin transport concern. Ratings and reviews need authoritative write paths, wishlist membership needs user-scoped state, and recommendations need a reproducible local ranking source if the worker is going to own them. Right now the worker exposes the interface, but the product behavior still lives elsewhere.

## Issue 8: Store discovery and catalog lookup are still remote

The catalog and search surface in [src/edge-api/spike-land/core-logic/tools/store/search.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/core-logic/tools/store/search.ts) remains fully proxy-based. Listing apps with tools, ranked search, category browse, featured apps, new apps, and detailed app lookup all depend on the remote `/api/store/...` contract.

This is a separate issue from ratings or installs because it means the worker does not own catalog indexing, category membership, featured/new flags, or search ranking. The product can present store discovery commands, but the discovery model itself is still external. Until catalog data and search metadata are local, the store remains split across two systems.

## Issue 9: Store install state is still owned remotely

The install-management surface in [src/edge-api/spike-land/core-logic/tools/store/install.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/core-logic/tools/store/install.ts) still proxies install, uninstall, install status, installed-app listing, and public install counts. The worker does not currently own the user-to-app installation relationship or the aggregate install counters.

This is an architectural gap because installation is one of the core state transitions for a store product. Without a local installation model, recommendation quality, entitlement checks, personalized store views, and install analytics remain downstream of an external API. The worker cannot claim full store ownership while install state remains remote.

## Issue 10: Store A/B deployment tooling is still a remote control surface

The experiment and rollout tools in [src/edge-api/spike-land/core-logic/tools/store/ab.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/core-logic/tools/store/ab.ts) are also still proxy-backed. Deployment creation, variant creation, visitor assignment, impression tracking, error tracking, results retrieval, winner declaration, and cleanup all call the remote spike.land API.

These tools are stateful and metrics-heavy, which makes the gap larger than a simple read-only proxy. A/B testing requires durable deployment records, variant membership, deterministic visitor assignment, and metrics integrity. None of that state is local yet, so the worker is acting as a thin remote-control wrapper over an experiment system it does not own.

## Issue 11: Skill store is duplicated and still mostly remote

The skill-store surface is split across [src/edge-api/spike-land/core-logic/tools/skill-store.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/core-logic/tools/skill-store.ts) and [src/edge-api/spike-land/core-logic/tools/store/skills.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/core-logic/tools/store/skills.ts). The first file uses `registeredTools` as a stand-in for part of the model, but it still proxies most listing, detail, install, and admin operations to the spike.land API. The second file exposes overlapping store-facing skill operations and is also fully proxy-backed.

This leaves the system with both duplication and incomplete ownership. The worker has no single canonical skill-store model covering categories, versions, featured flags, install counts, installation records, and admin mutations. The interface is fragmented across two entry points while the actual product state remains external.

## Issue 12: Blog tooling is read-only and still tied to remote filesystem access

The blog surface in [src/edge-api/spike-land/core-logic/tools/blog.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/core-logic/tools/blog.ts) remains a proxy because blog content is treated as living on the spike.land filesystem. The worker does not own the content index, frontmatter metadata, reading-time calculation, or post body retrieval; it simply forwards to `/api/blog/posts`.

This is still an open issue because it preserves a cross-system dependency for a core content surface even though the monorepo already contains first-party content under `content/blog`. The tool layer and the repository content are not aligned under one authority model. Until they are, the worker cannot serve as the direct source for blog discovery and retrieval.

## Issue 13: Career tooling still depends on spike.land as an integration broker

The career feature set in [src/edge-api/spike-land/core-logic/tools/career/career-index.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/core-logic/tools/career/career-index.ts) remains fully proxy-backed. Skills assessment, occupation search, occupation detail, skill comparison, salary lookup, and job search all go through the remote spike.land API, which in turn brokers ESCO and Adzuna integrations.

This means the worker does not directly own the integration contracts, caching policy, normalization layer, or failure handling for those upstream providers. The product surface is local, but the dependency boundary is still centralized elsewhere. If the goal is to remove remaining proxy paths to older APIs, career is still squarely in the unresolved set.

## Issue 14: BAZDMEG FAQ has no local table yet

The FAQ tool module in [src/edge-api/spike-land/core-logic/tools/bazdmeg/faq.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/core-logic/tools/bazdmeg/faq.ts) explicitly states that `bazdmegFaqEntry` does not exist in the D1 schema. Listing, create, update, and delete operations all proxy to the remote API until that table exists locally.

This is a straightforward but still open data-model gap. The worker exposes CRUD semantics, but it has no local table for questions, answers, categories, publication status, helpful counts, or ordering. As long as the table is missing, the FAQ product surface is not actually migrated.

## Issue 15: BAZDMEG gates have no local workflow-state model

The gate-checking surface in [src/edge-api/spike-land/core-logic/tools/bazdmeg/gates.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/core-logic/tools/bazdmeg/gates.ts) explicitly notes that `superpowersSession`, `workflowTransition`, and `gateCheckResult` are not present in the D1 schema. Both the gate check and the override path proxy to the remote API.

This is a larger issue than a missing table or two because the gate system depends on session history, workflow progression, evaluation outputs, and override records. Without that local state model, the worker cannot independently enforce or audit the BAZDMEG quality-gate flow. It can only forward requests to the old implementation.

## Issue 16: BAZDMEG memory has no local persistence layer

The memory tools in [src/edge-api/spike-land/core-logic/tools/bazdmeg/memory.ts](/Users/z/Developer/spike-land-ai/src/edge-api/spike-land/core-logic/tools/bazdmeg/memory.ts) still proxy because `bazdmegMemory` is not in the D1 schema. Search and recent-listing are available as MCP commands, but the worker has no local store for insight text, tags, source prompts, confidence scores, or timestamps.

This keeps BAZDMEG knowledge retrieval outside the worker even though it is exposed as a first-class MCP category. The interface exists, the memory store does not.

## Issue 17: Repo and deployment topology are still only partially simplified

The source-of-truth split has improved, but the repo is still not operationally simple. `src/` is the canonical source tree, while `packages/` still contains deploy shims that remain necessary for some Wrangler deployment paths. Database migrations are still mirrored across source and package-level directories. The Tailwind worker discrepancy shows that built artifacts can drift from source. Preview responsibility is also split across `spike-app`, `code`, and `js.spike.land`, which makes runtime ownership harder to reason about.

This is the remaining architectural debt behind the code-level migrations. Even after individual proxy-backed tools are removed, the platform still has multiple places where deployment configuration, built assets, and runtime responsibility can diverge. That complexity is not fully resolved yet.
