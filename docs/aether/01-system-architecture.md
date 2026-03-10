# Aether: System Architecture
**Agent 1 of 8 — System Architect**
**Date: 2026-03-10**
**Version: 0.1 (planning)**

---

## 1. Core Architecture Pattern

### Decision: Federated Edge-First Hybrid

No single architecture paradigm works for 8.1B users spanning $20 phones on
2G to high-end workstations on fiber. The pattern must be a three-tier federated
system:

```
Tier 0: On-Device (the sovereign tier)
  - Personal knowledge graph lives here exclusively
  - Quantized inference (1-3B param models, INT4/INT8)
  - Offline-first: full functionality without network
  - All PII stays here forever

Tier 1: Regional Edge Nodes (the coordination tier)
  - Operated by universities, NGOs, national govts, volunteers
  - No personal data — only aggregated, differentially private signals
  - Sub-100ms latency within 500km radius
  - Federated learning: model weight updates, never raw data

Tier 2: Global Backbone (the knowledge tier)
  - Shared world model, fact graph, misinformation index
  - Hosted by a multi-stakeholder foundation (not a corporation)
  - Read-mostly; content-addressed (IPFS-style)
  - High-bandwidth tasks: model weight distribution, global coordination
```

### Why Not Pure P2P?

Pure P2P fails on three counts:
1. A $20 phone cannot route traffic for others — battery and data cost are real
2. Sybil attacks on coordination are trivially cheap without identity anchors
3. Offline-dense regions (Sahel, rural India) have zero peers to connect to

### Why Not Central Cloud?

- Cost at 8.1B MAU is $40-200B/year in inference alone — unsustainable without monetization
- Single point of state surveillance
- Single point of takedown by any national government

The federated model distributes both cost and control. No entity — including
Aether's founding institution — can surveil users or shut down the system.

---

## 2. Data Flow

### Principle: Data Gravity Stays on Device

```
User action
    |
    v
[On-Device PKG] ── inference ──> [Local Model (quantized)]
    |                                       |
    | (no PII, only gradients/signals)      | (response to user)
    v                                       |
[Privacy Engine]                            |
    | differential privacy (epsilon=0.1)    |
    | k-anonymity aggregation               |
    v
[Regional Edge Node]
    | (aggregated trends only)
    | model update distribution
    v
[Global Backbone]
    | world knowledge updates
    | misinformation corrections
    v
[Regional Edge Node]
    | (pull-based, user-initiated)
    v
[On-Device PKG update]
```

### Coordination Flow (Skill/Resource Matching)

The coordination engine must match users across borders without exposing who
needs what to whom:

```
User A: "I need a mentor in structural engineering"
    |
    v
[Local intent encoder] -> encrypted capability vector (blind signature)
    |
    v
[Regional Node] -> private set intersection across N users
    |               no node sees full plaintext intent
    v
[Match candidates] -> encrypted, routed back to User A device
    |
    v
[User A accepts] -> direct E2E encrypted channel established
```

Technology: Private Set Intersection (PSI) protocols, specifically
Google's open-source PSI library. Garbled circuits for threshold matching.
No node ever sees "User A wants X" — only that a match exists.

### Crisis Preemption Data Flow

```
[On-Device sensors + journal + behavioral patterns]
    |
    v
[Local risk model] -- runs entirely on device --
    |
    v
[Risk score] -- stays on device --
    |
    | IF user grants explicit consent for telemetry:
    v
[Pseudonymous aggregate to regional epidemiological model]
```

The crisis preemption model NEVER phones home risk scores without
explicit, revocable, per-transmission user consent. Default: off.

---

## 3. Compute Model

### The $20 Phone Problem

A $20 Android phone in 2026 has approximately:
- 1-2GB RAM
- 4-core ARM Cortex-A55 @ 1.8GHz
- No dedicated NPU
- 500MB/month data budget (typical prepaid in sub-Saharan Africa)

This phone must deliver the core value proposition offline. That requires:

**On-Device Model Targets:**
- Primary reasoning: 1.3B param model, INT4 quantized, ~650MB RAM
- Fact lookup: retrieval-augmented (local vector index, 200MB)
- Crisis detection: purpose-built 50M param classifier, ~40MB
- Total storage budget: 1.5GB (fits on 4GB internal storage)

**Model Serving Strategy by Tier:**

| Device Class | RAM | Model Strategy |
|---|---|---|
| Ultra-low ($20, 1GB) | 1GB | 500M INT4 + retrieval only |
| Low ($50, 2GB) | 2GB | 1.3B INT4 + RAG |
| Mid ($150, 4GB) | 4GB | 3B INT8 + RAG + local PKG |
| High (>$300, 8GB+) | 8GB+ | 7B INT4 full + edge sync |

**2G Optimization:**
- All sync is delta-compressed (binary diff, not full re-download)
- Model updates transmitted as LoRA adapters (10-50MB vs 650MB full model)
- Sync scheduled during wifi/overnight windows
- Core features: zero network dependency after initial install (~200MB APK)

**Volunteer Compute Network:**

For tasks exceeding on-device capability (long-horizon planning, complex
forecasting), a Folding@home-style volunteer compute network:
- Universities donate idle GPU cycles
- Opt-in personal devices contribute during charging
- Task queue is privacy-preserving: compute nodes see tokenized inputs,
  never user identity
- Incentive: academic institutions get access to aggregate trend data
  (differentially private, IRB-approved)

---

## 4. Knowledge Graph (Per-User Lifelong Context)

### Structure: Personal Knowledge Graph (PKG)

The PKG is the core of Aether's personalization. It lives entirely on-device
and is never transmitted in plaintext.

```
PKG Schema (simplified):

Node types:
  - Person (the user + relationships)
  - Skill (learned/in-progress/goal)
  - Decision (past decisions + outcomes)
  - Event (significant life events)
  - Belief (tracked epistemic states)
  - Goal (short/medium/long horizon)
  - HealthSignal (behavioral + reported)

Edge types:
  - LEARNED (Person -> Skill, with proficiency score + date)
  - DECIDED (Person -> Decision, with context snapshot)
  - CAUSED (Decision -> Event, with confidence + lag)
  - HOLDS (Person -> Belief, with source + confidence)
  - PURSUES (Person -> Goal, with priority + deadline)
  - CORRELATES (HealthSignal -> HealthSignal, with r + p-value)
```

**Storage:** SQLite with sqlite-vec extension for vector embeddings.
Fits in 50-200MB depending on user tenure. Encrypted at rest (AES-256-GCM,
key derived from device biometric or PIN via PBKDF2).

**Lifelong Continuity:**

```
PKG versioning:
  - Each node has created_at, updated_at, deleted_at (soft delete)
  - Full event log (append-only) enables temporal queries
  - "What did I believe about X in 2024?" is answerable
  - Export: standard JSON-LD + RDF for portability

PKG migration:
  - Device-to-device: local WiFi direct transfer (QR-authenticated)
  - Cloud backup: user-controlled E2E encrypted backup to any S3-compatible store
  - Key recovery: Shamir's Secret Sharing split across 3-of-5 trusted contacts
```

**World Knowledge Integration:**

The PKG connects to a global knowledge graph via content-addressed references,
not data copies:

```
User PKG node: Belief { id: "b_1234", claim_hash: "sha256:abc..." }
                                              |
                                              v
                          Global Fact Graph: { hash: "abc...",
                                               claim: "Vaccines cause autism",
                                               verdict: FALSE,
                                               confidence: 0.9997,
                                               sources: [...] }
```

When the global fact graph updates (new evidence), the user's PKG belief nodes
are flagged for review — never silently corrected. User agency is preserved.

---

## 5. Core Services

### 8 Core Services

```
+------------------------------------------------------------------+
|                        Aether Core Services                      |
+------------------------------------------------------------------+

1. PERSONAL KNOWLEDGE GRAPH (PKG) SERVICE
   - On-device SQLite + sqlite-vec
   - Manages all user data, event log, backup/restore
   - Interface: local IPC only (no network API)

2. LOCAL INFERENCE ENGINE
   - llama.cpp or MLC-LLM runtime
   - Model management (download, quantize, hot-swap LoRA adapters)
   - Runs quantized models on CPU/NPU
   - Exposes: synchronous inference API to other services

3. MASTERY ACCELERATION SERVICE
   - Spaced repetition engine (FSRS algorithm)
   - Skill graph management + gap analysis
   - Learning path planner (calls inference engine for content)
   - Progress tracking -> PKG writes

4. DECISION SUPPORT SERVICE
   - Outcome forecasting model (trained on aggregated opt-in data)
   - Pre-mortem generator (adversarial reasoning)
   - Decision log + retrospective analysis
   - Calibration tracker (accuracy of past forecasts)

5. CRISIS PREEMPTION SERVICE
   - On-device behavioral signal collector
   - Risk classifier (depression, burnout, cardiovascular markers)
   - Alert + resource router (local hotlines, trusted contacts)
   - All computation local; opt-in-only telemetry

6. TRUTH FILTER SERVICE
   - Misinformation classifier (on-device, 50M param)
   - Claim extraction + hash -> global fact graph lookup
   - Source credibility scoring
   - Real-time annotation of consumed content

7. COORDINATION ENGINE
   - PSI-based skill/resource matching
   - E2E encrypted messaging channel establishment
   - Community graph (opt-in social layer)
   - Cross-border opportunity matching

8. SYNC & FEDERATION SERVICE
   - Peer discovery (mDNS local, DHT global)
   - Federated learning: gradient aggregation (no raw data)
   - LoRA adapter distribution from regional nodes
   - World knowledge graph delta sync
   - Offline queue management
```

---

## 6. Technology Choices

### Rationale: Boring, Proven, Widely Deployable

Every technology choice must be buildable by a volunteer in Nigeria with
a laptop and deployable on a $20 Android device. No Kubernetes. No cloud-native
vendor lock-in.

**On-Device Runtime:**

| Component | Technology | Rationale |
|---|---|---|
| App shell | React Native (Android/iOS) + Flutter (feature parity) | Largest contributor base, works offline, good low-end perf |
| Inference | llama.cpp / MLC-LLM | Runs INT4 on CPU, ARM NEON optimized, MIT license |
| Local DB | SQLite + sqlite-vec | Ships in Android/iOS, zero dependency, battle-tested |
| Encryption | libsodium | Audited, consistent API, no OpenSSL foot-guns |
| PKG sync | CRDT (Automerge v2) | Conflict-free merge across devices without a server |

**Edge Nodes:**

| Component | Technology | Rationale |
|---|---|---|
| Runtime | Cloudflare Workers OR bare Node.js 22 | CF for zero-infra volunteer operators; Node fallback |
| Coordination API | Hono (lightweight Fetch API router) | Same pattern as existing spike-edge stack |
| Federated learning | Flower (flwr) | Python FL framework, supports heterogeneous devices |
| PSI library | Google PSI (C++ + WASM binding) | Production-grade, open source |
| Node discovery | libp2p (go-libp2p) | Battle-tested, supports QUIC, WebRTC, TCP |

**Global Backbone:**

| Component | Technology | Rationale |
|---|---|---|
| Fact graph storage | IPFS + Filecoin (pinned) | Content-addressed, no single host, resilient |
| Fact graph query | GraphQL over IPFS (Ceramic Network pattern) | Versioned, decentralized |
| Model distribution | BitTorrent / WebTorrent | Proven at scale for large binary distribution |
| Governance | On-chain multisig (Ethereum or Cosmos) | No single admin key |

**Misinformation / Fact Graph Pipeline:**

| Component | Technology | Rationale |
|---|---|---|
| Claim extraction | Fine-tuned DeBERTa-v3 | 90M params, fits on edge, high precision |
| Verdict model | Ensemble: PolitiFact API + academic datasets | Multiple independent sources |
| Update pipeline | Apache Kafka (edge) -> IPFS publish | Immutable audit trail of fact updates |

---

## 7. Critical Architecture Risks

### Risk 1: State Actor Capture of Edge Nodes

**Threat:** A national government operates 80% of regional edge nodes in their
jurisdiction, then uses them to correlate user behavior even without direct
data access — traffic analysis, timing attacks on PSI protocols.

**Severity:** Catastrophic for users in authoritarian contexts.

**Mitigation:**
- Edge nodes are blind relays for E2E encrypted coordination payloads
- Mixnet routing (Nym or Tor) for all coordination traffic; edge nodes
  cannot correlate sender/receiver
- Geographic diversity requirement: no region can have <3 independent operators
- Open-source node software with reproducible builds; any deviation is detectable
- Circuit breaker: on-device detects anomalous response patterns and routes
  around compromised nodes

**Residual risk:** Traffic volume analysis at ISP level. Mitigated partially
by bulk sync (not real-time trickle) and cover traffic padding.

---

### Risk 2: Model Monoculture / Epistemic Capture

**Threat:** A single model weights file (or a small set of LoRA adapters)
shapes the beliefs and decisions of 8.1B people. Whoever controls the model
training pipeline controls humanity's epistemic frame.

**Severity:** Existential. More dangerous than any data breach.

**Mitigation:**
- Model governance: training data, objective functions, and eval benchmarks
  are published and independently auditable
- Plurality by design: Aether ships 3+ independently trained base models
  from different institutions; users can choose or ensemble
- Regional fine-tuning is community-controlled (not foundation-controlled)
- Hard separation: world knowledge (facts, skills) vs values (ethics,
  priorities) — values are user-configurable, never baked into shared weights
- Red team budget: 10% of all compute allocated to adversarial probing of
  deployed models for manipulation vectors before distribution

---

### Risk 3: Compute Sustainability Without Monetization

**Threat:** The volunteer compute network degrades over time. Universities
deprioritize donated cycles. Edge nodes go dark. Model updates stop. The
system fossilizes and becomes outdated (the "Winamp problem").

**Severity:** High — not an immediate failure, a slow decay that's hard to detect.

**Mitigation:**
- Design for graceful degradation: on-device models continue working
  indefinitely without updates; they just stop improving
- Institutional endowment model: $500M one-time endowment (Gates, Wellcome,
  sovereign wealth fund co-investment) funds backbone for 20 years at ~$25M/yr
- Academic incentive alignment: edge node operators get citable data access,
  making node operation a research infrastructure grant item
- Community-run "Aether node" program analogous to Tor relay operators
- Worst-case: the on-device model + local PKG continues delivering 70% of
  value with zero network forever. This is a design constraint, not a fallback.

---

## Architecture Summary Diagram

```
                    +-------------------+
                    |  GLOBAL BACKBONE  |
                    | (IPFS fact graph, |
                    |  model weights,   |
                    |  governance)      |
                    +--------+----------+
                             |
              (delta sync, read-mostly, pull-based)
                             |
          +------------------+------------------+
          |                                     |
 +--------+--------+                  +---------+-------+
 | REGIONAL EDGE A |                  | REGIONAL EDGE B |
 | (university/NGO)|                  | (govt/volunteer)|
 | - FL aggregator |                  | - FL aggregator |
 | - PSI matcher   |                  | - PSI matcher   |
 | - blind relay   |                  | - blind relay   |
 +--------+--------+                  +---------+-------+
          |                                     |
    (no PII flows above this line)              |
          |                                     |
 +--------+--------+                  +---------+-------+
 |   USER DEVICE A |                  |  USER DEVICE B  |
 | [PKG + Models]  |  <-- E2E enc --> | [PKG + Models]  |
 | Offline-capable |    coordination  | Offline-capable |
 +-----------------+                  +-----------------+
```

---

## Open Questions for Other Agents

These decisions require input from the other 7 agents:

1. **Agent 2 (Privacy):** What epsilon value for differential privacy is
   acceptable for crisis epidemiology vs coordination matching? Lower epsilon
   = more privacy, less useful signals.

2. **Agent 3 (AI/Models):** Can a 1.3B INT4 model reliably deliver mastery
   acceleration outcomes? What is the minimum model size for 95% decision
   accuracy? This drives the entire compute model above.

3. **Agent 4 (Governance):** Who operates the global backbone legal entity?
   Swiss foundation? UN agency? Distributed DAO? This affects censorship
   resistance profoundly.

4. **Agent 5 (Access/Equity):** Is the $20 phone assumption correct for
   2026-2030? What fraction of the 2B unconnected people will have any
   smartphone in 5 years? Should we design for feature phones (USSD/SMS)?

5. **Agent 6 (Safety):** The crisis preemption service has a 3-5 year
   prediction horizon. What is the liability and ethical framework for
   acting on a prediction that someone will become depressed in 2029?

6. **Agent 7 (Scaling):** Federated learning convergence degrades with
   high heterogeneity. What is the acceptable accuracy drop vs centralized
   training for the primary reasoning model?

7. **Agent 8 (Deployment):** How do we bootstrap the edge node network
   before critical mass? First 100 nodes need to be reliable before
   user trust is established.
