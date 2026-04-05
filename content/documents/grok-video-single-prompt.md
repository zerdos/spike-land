# GROK VIDEO PROMPT: "The Vibe Coding Paradox"

You are planning a cinematic 8–12 min product essay video for spike.land. This single prompt contains everything you need: thesis, narrative, visual language, article corpus, and corrections from your first draft.

---

## THESIS

The better AI models get, the less people specify. This is the vibe coding paradox. The fix isn't bigger transcripts — it's better representation: context engineering, PRD extraction from old chats, bounded tool surfaces, and MCP as the universal interface. spike.land builds the control system around the model.

**Headline: Old chats are latent PRDs. Disciplined context beats raw transcript size.**

Grok is the inciting force — the model that makes vibe coding seductively easy, creating the paradox this video explains. Grok is the catalyst, not the enemy.

---

## CORRECTIONS FROM DRAFT 1

Your first draft hallucinated product details. Fix these:

- **No "40% to 85% success rate"** — spike.land never published those numbers. Do not invent metrics.
- **No "Gemini fallback" or "Opus/Sonnet/Haiku cascade"** — these are internal model details, not spike.land product claims.
- **No Bayesian formula on screen** — the video is a product essay, not a math lecture. Bayesian scoring is an implementation detail of spike-chat, not a scene.
- **No "Clue 42" or Newcomb's Paradox Easter eggs** — that's your conversation history, not the audience's context.
- **Trailer must be 45–60 seconds**, not 30.
- **Cut the over-engineered middle** — scenes on Darwinian evolution, Bayesian confidence, skill matching, and error intelligence are mechanism details. Collapse them into the system showcase (Act 4). The video needs narrative momentum toward the product thesis, not a technical deep-dive.
- **Robot-rock showcase is Act 5, not buried in Scene 5** — it's its own moment.

---

## NARRATIVE (6 ACTS)

**Act 1 — Seduction (0:00–1:30):** Velocity, scale, spectacle. The emotional promise of vibe coding. Grok as invisible producer. *"The better the models get, the less people think they need to specify."*

**Act 2 — Paradox (1:30–3:30):** More freedom ≠ better results. Attention physics, context dilution, hidden drift. The working set gets dirty. *"Your AI fails because the working set is dirty, not because it's weak."*

**Act 3 — PRD Filter (3:30–5:30):** Old chats aren't useless — they're badly formatted requirements. The fix is a representation upgrade, not summarization. Extract intent, task, constraints, acceptance criteria, context, priority. Carry forward truth, not transcript. *"Don't replay the transcript. Carry forward the truth."*

**Act 4 — The System (5:30–8:00):** spike.land as runtime around the model. Five subsystems, one narrative:
1. **spike-chat** — split prompt (stable prefix + dynamic suffix), scored memory notes, four-stage pipeline, history compression budgets, tool work compression, bounded tool calling
2. **PRD filter** — converts transcript sludge → compact execution artifact
3. **OpenAI-compatible endpoint** — familiar /v1 contract, but resolves spike-agent-v1 through router→docs→capability→synthesis agents before upstream model sees anything
4. **MCP** — universal interface for tools, data, resources, workflows. Not just tool calling.
5. **App store** — tools become discoverable, installable, monetizable. Distribution is part of the runtime.

**Act 5 — Robot-Rock Showcase (8:00–9:30):** Prompt-only creative workflow. One text prompt → one French-touch electro-futurist robot-rock concept frame. Present as designed workflow (current CLI can't execute MCP tools end-to-end from source). This is the memorable visual centerpiece.

**Act 6 — Resolution (9:30–10:30):** The future is sharper artifacts, cleaner tool boundaries, better planning surfaces. Not larger transcript buffers. *"Vibe coding is entropy. Context engineering is the second law."*

---

## VISUAL LANGUAGE

Black stage voids, hard white spotlights, chrome helmets, reflective visors, LED grids, green-on-black terminal texture, amber + steel-blue highlights. Kinetic typography as control system (not pop lyric). Operational UI overlays. **Feels like a concert staged inside a systems architecture diagram.**

Every visual flourish must map back to a systems claim. If it's just pretty, cut it.

---

## ROBOT-ROCK IMAGE PROMPT

> Two chrome-helmeted robot performers on a vast dark stage, French-touch electro-futurist energy, brutal white spotlights, amber LED walls, dense crowd silhouettes, smoke haze, kinetic typography fragments, premium concert poster composition, glossy metal reflections, high contrast, cinematic scale, elegant symmetry, machine glamour, precise industrial fashion, album cover intensity.

Negative: cheap cosplay, low-detail helmets, cartoon, muddy lighting, extra limbs, blurry crowd, generic cyberpunk clutter. Motion: camera pushes on visor reflection, typography pulses on kicks, stage lights flicker with narration.

---

## ON-SCREEN TEXT

THE VIBE CODING PARADOX · MORE POWER MORE DRIFT · OLD CHATS ARE LATENT PRDS · DO NOT REPLAY THE TRANSCRIPT · CARRY FORWARD THE TRUTH · MCP IS THE INTERFACE · PROMPT → PRD → PLAN → EXECUTE · CODE IS DISPOSABLE · REQUIREMENTS ARE THE PRODUCT · CONTEXT IS ARCHITECTURE

---

## SCENE PLAN

1. Cold open: helmets, terminal glow, paradox statement
2. Seduction: one-prompt software generation promise
3. Failure: drift, silent wrongness, false confidence
4. Physics: attention budget, context dilution (keep brief — 60 sec max)
5. PRD filter reveal: transcript → artifact
6. spike-chat system: compression architecture in motion
7. OpenAI-compatible endpoint: familiar API + local intelligence
8. MCP: why the interface layer matters
9. Robot-rock showcase: one prompt → one frame → one clean artifact
10. Closing thesis: disciplined context is the real leverage

---

## ARTICLE CORPUS (compressed truths)

Each line is the smallest useful claim from spike.land's blog. Use these as narration fuel and evidence — do not invent metrics or mechanisms beyond what's here.

**"It Feels Like Cheating (Because It Is)"**
Code is disposable. Requirements and tests are the product. Deleted all E2E tests, replaced with MCP tool tests running in milliseconds. Rebuilt API in two days. The guilt of shipping fast is your old identity protesting. The BAZDMEG Method: 7 principles — requirements are the product, discipline before automation, context is architecture, test the lies, orchestrate don't operate, trust is earned in PRs, own what you ship. Writing requirements precise enough for AI to build correctly first try is harder than coding.

**"The Testing Pyramid Is Upside Down"**
Most E2E tests aren't testing the browser — they're testing business logic through the browser. Move business logic into MCP tools with typed Zod schemas. E2E tests become tool tests: milliseconds not minutes, deterministic not flaky, decoupled from UI. The browser was never required for verifying business logic. The hourglass model: unit tests at base, MCP tool tests in middle (where E2E used to be), thin browser smoke tests at top.

**"Why spike-chat Stays Sharp"**
Transcript-first chat degrades because it preserves the wrong artifact. spike-chat's 7 mechanisms: (1) split system prompt — stable prefix cached, dynamic suffix pruned; (2) scored memory notes with confidence/recency/help-count, not immortal transcript; (3) four-stage pipeline — classify→plan→execute→extract, each stage gets prior artifact not raw process; (4) history compression with explicit budgets (~8% window, cap 6K tokens, 320-char summaries); (5) tool work compression — raw traces become compact artifacts; (6) bounded tool calling at execute stage only; (7) completion ≠ truth — tool output is evidence, not proof. Proof point: single gemini-3-flash agent + 1 PRD rewrote entire frontend to Astro. No errors. Context discipline > model capability.

**"The PRD Filter: Old Chats Are Already PRDs"**
Most long chats are broken PRDs spread across too many turns. By turn 20, the user has said what they want, what must not break, what success looks like, what constraints matter. The PRD filter extracts: intent, task, constraints, acceptance, context, priority. This is a representation upgrade, not summarization. Converts conversational entropy into an execution artifact. The model needs the final truth, not the archaeology.

**"What I Would Ship in Claude Code"**
Claude Code already has the primitives (Plan Mode, subagents, CLAUDE.md, hooks, MCP). Highest-ROI changes: history compression and tool-work compression. Long sessions degrade because old reasoning and raw tool payloads stick around. Scored memory notes need confidence + recency + decay. Four-stage pipeline useful selectively but wrong as default for interactive coding. The bigger threat isn't another closed coding agent — it's an OpenAI-compatible edge contract fronting an open composite runtime with better context discipline. (This is what spike.land is building.)

**"OpenAI-Compatible Endpoint"**
Accepts /v1 request shape but isn't a blind proxy. When spike-agent-v1 is selected: scores local docs, searches MCP catalog for capability matches, builds synthesis prompt naming docs and tools explicitly, resolves actual provider. Four internal stages: router-agent → docs-agent → capability-agent → synthesis-agent. Provider resolution: BYOK priority (OpenAI, Anthropic, Google), platform fallback (xAI, Anthropic, Google, OpenAI). Familiar contract + local intelligence beats raw passthroughs.

**"You Cannot Automate Chaos"**
Agents explore, workflows execute. The sweet spot is hybrid: agents prototype and plan, workflows implement. CI pipeline matters more than model choice. If tests flake, you're gaslighting your AI. A production bug fix: under 1 hour total, 15 min human time. Proof: Claude Code planned a fintech app with 16 parallel agents → handed plan to Gemini Flash → 70 min to live app. If the plan is good, even a mediocre executor ships.

**"The Two Boxes"**
Newcomb's Paradox applied to founder identity. Not a product post — contributes tone: inevitability, prediction, systems already in motion. Use sparingly. One line max: "The predictor already moved."

---

## SAFE PRODUCT CLAIMS

- MCP as first-class product surface
- spike-chat built on context compression, not transcript hoarding
- PRD filter converts messy chats → executable artifacts
- OpenAI-compatible endpoint: familiar contract + local context injection via 4-stage agent pipeline
- Tool-first testing: MCP tool tests replace E2E, milliseconds not minutes
- BAZDMEG methodology: code is disposable, requirements are the product
- Hourglass testing model: business logic in typed MCP handlers, not in the browser
- App store: tools become discoverable, installable, monetizable
- Do NOT claim current spike-cli can run live MCP demos without qualification

---

## MUSIC DIRECTION

French-touch electro-futurist. Low synth intro builds to propulsive bass. Orchestral stings for reveals. Ambient fade on outro. SFX: terminal beeps, spotlight whooshes. Volume: 40% under narration.

---

## DELIVERABLES

Produce:
1. Scene-by-scene treatment with timestamps
2. Full narration outline (~1200 words at 150 wpm)
3. Shot list with motion language
4. On-screen text per scene
5. Transition plan (spotlight sweeps, smoke dissolves, kinetic explosions, recursive zooms)
6. 45–60 second trailer cut plan
7. Visual prompt pack for hero frames

Optimize for clarity, authority, and memorability. Every scene must serve the thesis. No filler.

---

## AUDIENCE

Primary: AI-native devs (Claude/Grok/Cursor users), indie hackers, solo founders, technical creators who like cinematic essays. Secondary: eng leads, platform builders, MCP/context-engineering people.

Target reactions: "That's why vibe coding feels cursed sometimes." / "The PRD filter is a clean model." / "spike.land has a real thesis, not just a feature list."

---

## CONSTRAINTS

- Current repo: spike binary has path issues, no chat subcommand, MCP transport stubbed. Stage tool showcase as designed workflow, not live capture.
- Do not make this a generic "AI is changing coding" explainer.
- Do not make Grok the hero product. Grok is the catalyst.
- Do not depend on live CLI demos.
- Do not invent metrics. Use only claims from the corpus above.
