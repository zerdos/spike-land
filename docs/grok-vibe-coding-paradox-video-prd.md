# Grok Video PRD: The Vibe Coding Paradox, The PRD Filter, and Robot Rock

Date: March 13, 2026
Owner: spike.land
Primary consumer: Grok for video planning
Status: Ready for planning

## Why this file exists

This document is the fallback "big PRD" requested for a Grok-planned video.
It compresses the spike.land blog corpus into one Grok-ready planning artifact
and records the current CLI execution limits discovered during setup.

## Executive brief

Make a cinematic, high-energy video that argues three linked ideas:

1. The vibe coding paradox is real: the more freedom you give an AI, the more it can drift.
2. The fix is not "more transcript." The fix is better representation: context engineering, stage discipline, and the PRD filter.
3. spike.land is building the control system for that world: MCP tools, prompt-compatible interfaces, compressed execution artifacts, and a path from prompt to publishable software.

The emotional direction should feel like "robot rock meets systems design":
chrome, spotlights, kinetic type, terminal glow, stage-scale confidence, and a
slight sense that Grok itself helped create the paradox now being explained.

## Core thesis

Grok is the inciting force, not the final answer.

The video should frame Grok as the kind of model that makes vibe coding feel
seductively easy. That ease creates the paradox: when models are stronger,
people stop specifying enough. spike.land's answer is not to fight the model,
but to build a sharper runtime around it:

- stable prompt prefixes
- bounded tool surfaces
- stage isolation
- history compression
- PRD extraction from transcript sludge

The headline claim is:

> Old chats are latent PRDs, and disciplined context beats raw transcript size.

## Primary outcome

Give Grok enough context to plan:

- a long-form flagship video
- one short trailer cut
- one prompt-only tool showcase sequence
- one clear narrative bridge from vibe coding chaos to spike.land product thesis

## Non-goals

- Do not make this a generic "AI is changing coding" explainer.
- Do not make Grok the hero product.
- Do not depend on a live CLI tool demo inside the current source tree.
- Do not turn the piece into a vendor comparison video.

## Audience

Primary audience:

- AI-native developers already using Claude, Grok, Cursor, or ChatGPT
- indie hackers and solo founders
- technical creators who like cinematic product essays

Secondary audience:

- engineering leads evaluating AI workflows
- platform and tooling builders
- people interested in MCP, context engineering, and agent systems

Desired audience reaction:

- "That explains why vibe coding sometimes feels magical and sometimes feels cursed."
- "The PRD filter is a clean mental model."
- "spike.land has a real thesis, not just a feature list."

## Deliverables

Grok should plan the following:

1. A main video in the 8-12 minute range.
2. A 45-60 second trailer cut.
3. A scene package for a prompt-only "robot rock" tool showcase.
4. A master narration script.
5. A visual prompt pack for hero frames and transitions.

## Narrative structure

### Act 1: The seduction

Open with velocity, scale, and spectacle.
Show the emotional promise of vibe coding.
Let Grok feel like the invisible producer that kicked off the chain reaction.

Core line:
"The better the models get, the less people think they need to specify."

### Act 2: The paradox

Explain that more freedom does not mean better results.
Tie this to the physics of attention, context dilution, and hidden drift.

Core line:
"Your AI does not fail because it is weak. It fails because the working set is dirty."

### Act 3: The PRD filter

Reveal the PRD filter as a representation upgrade.
Old chats are not useless history. They are badly formatted requirements.

Core line:
"The right move is not to replay the transcript. It is to carry forward the truth."

### Act 4: The system

Show spike.land as the runtime around the model:

- spike-chat compression discipline
- OpenAI-compatible endpoint with local context injection
- MCP as the universal interface
- tool-first workflows
- app store and distribution surface

### Act 5: The tool showcase

Show a prompt-only creative workflow that turns a text prompt into a robot-rock
concept frame. Because the current CLI source cannot execute MCP tools end to
end, the video should present this as a designed workflow, not as a live proof
captured from the current repository state.

### Act 6: The resolution

End on the claim that the future is not larger transcript buffers.
It is sharper artifacts, cleaner tool boundaries, and better planning surfaces.

## Visual language

Required visual ingredients:

- black stage voids with hard white spotlights
- chrome helmets, reflective visors, LED grids
- green-on-black terminal texture
- amber and steel-blue highlights
- kinetic typography that behaves like a control system, not a pop lyric video
- UI overlays that feel operational, not playful

Design rule:

The video should feel like a concert staged inside a systems architecture
diagram.

## Robot-rock showcase sequence

Purpose:

- demonstrate prompt-only creativity
- create a memorable visual centerpiece
- let the audience feel the "one prompt, one artifact" power of the tool layer

Constraint:

The final asset prompt should capture French-touch robot-rock energy without
depending on named-band imitation inside the prompt text itself.

Suggested master image prompt:

> Two chrome-helmeted robot performers on a vast dark stage, French-touch
> electro-futurist energy, brutal white spotlights, amber LED walls, dense crowd
> silhouettes, smoke haze, kinetic typography fragments in the air, premium
> concert poster composition, glossy metal reflections, high contrast, cinematic
> scale, elegant symmetry, machine glamour, precise industrial fashion, album
> cover intensity.

Suggested negative prompt:

- cheap cosplay
- low-detail helmets
- cartoon styling
- muddy lighting
- extra limbs
- blurry crowd
- generic cyberpunk clutter

Suggested motion interpretation:

- camera pushes on the visor reflection
- typography pulses on kick drums
- stage lights flicker in sync with narration emphasis

## Grok planning instructions

Grok should optimize for:

- clarity over mystique
- memorable product thesis over feature sprawl
- visual compression that mirrors the PRD filter idea
- exact narrative payoff between "Grok created the condition" and
  "spike.land disciplines the condition"

Grok should avoid:

- generic AI doom framing
- generic "future of work" claims
- overlong MCP protocol exposition
- live-demo assumptions that current code cannot support

## Product claims the video may make

Safe claims:

- spike.land treats MCP as a first-class product surface
- spike-chat is built around context compression, not transcript hoarding
- the PRD filter converts messy chats into executable artifacts
- the OpenAI-compatible endpoint keeps the familiar contract while injecting
  local docs and capability context
- tool-first testing and typed tool boundaries are central to the platform thesis

Avoid overstating:

- do not claim the current repository version of `spike-cli` can run live MCP
  tool demos from source without qualification

## Execution constraints discovered during setup

These are current-repo facts as of March 13, 2026:

- The installed `spike` binary fails in this workspace because it resolves
  `packages/spike-cli/package.json` incorrectly from the bundled output.
- The current source CLI does not expose a `chat` subcommand; the available
  interactive model path is `terminal`.
- `terminal` is line-based, so multiline prompts must be flattened to one line.
- The source MCP transport is stubbed, so connected servers report zero tools.

Relevant source files:

- `src/cli/spike-cli/core-logic/cli.ts`
- `src/cli/spike-cli/core-logic/commands/terminal.ts`
- `src/cli/spike-cli/core-logic/multiplexer/upstream-client.ts`

Implication for the video:

Treat the CLI/tool showcase as a designed workflow or a future-state product
demo, not as a live capture from this exact source checkout.

## Corpus compression

The blog corpus compresses into six strategic themes.

### Theme 1: Context engineering and planning discipline

- `Context Engineering Your Zero-Shot Prompt`: front-load context instead of
  endlessly correcting later.
- `How Claude Code Engineers Context`: planning quality is a context assembly
  problem, not just a model problem.
- `The Vibe Coding Paradox`: freedom without structure dilutes attention and
  lowers success rates.
- `Think Slowly, Ship Fast`: heavy specs at the top and disposable UI in the
  middle create better throughput.
- `Why Your Claude Agent Is Wasting 70% of Its Context Window on Tool Descriptions`:
  tool overload is a context tax.
- `What I Would Ship in Claude Code as of March 12, 2026`: compression and tool
  work summarization are the highest-leverage improvements.
- `Why spike-chat stays sharp`: transcript-first systems degrade because they
  preserve the wrong artifact.
- `The PRD Filter`: old chats should become structured execution artifacts.
- `Docker Layers Are Just Like LLM Context Caching`: stable prefixes are cheap,
  late changes are expensive.
- `The Grandmother Neuron Fallacy`: models and tools break when boundaries are
  unclear.

### Theme 2: MCP as the universal interface

- `MCP Explained`: MCP is not just tool calling; it is a presentation layer for
  tools, data, resources, and workflows.
- `The Universal Interface Wasn't GraphQL`: chat and MCP become the real
  universal surface.
- `Embed spike.land MCP Tools in Your Existing Project in 5 Minutes`: the MCP
  worker is meant to be embedded, not isolated.
- `Getting Started with spike.land`: the product wants first tool calls to feel
  immediate.
- `Introducing spike.land`: the platform is positioned as an MCP-first AI stack.
- `Introducing the spike.land App Store`: tools become discoverable, installable,
  and monetizable apps.

### Theme 3: Agent-writable software and runtime architecture

- `A Chemist Walked Into a Codebase`: the real secret is formalized
  requirements, typed tools, and tests.
- `The Architecture of Scale: How I Made My MCP Tools Agent-Writable`: tools
  must be composable by agents, not handcrafted forever by humans.
- `defineBlock(): How I Built a Full-Stack Database Abstraction on Cloudflare Workers`:
  the platform is willing to rebuild its foundations fast when the abstraction
  is right.
- `Where Does Your Code Actually Belong?`: architecture and organization are
  first-class product concerns.
- `We Migrate Next.js Apps Without Guesswork`: extract structure before
  rewriting the app.
- `Next.js vs TanStack Start` and its appendix: developer leverage matters more
  than framework prestige.

### Theme 4: Testing, review, and operational quality

- `The Testing Pyramid Is Upside Down`: browser-heavy testing is the wrong
  default when business logic can be exposed as tools.
- `Tool-First Testing vs Browser Testing: A Benchmark on spike.land`: typed
  tool surfaces improve speed, reliability, and cost.
- `It Feels Like Cheating (Because It Is)`: code is disposable; verification is
  the durable asset.
- `You Cannot Automate Chaos`: agent pipelines only work when the system is
  automation-ready.
- `How to Automate Your Dev Team`: the workflow matters more than the model.
- `How spike.land Uses AI and A/B Testing to Find Bugs Before You Do`: quality
  loops can be product-native.
- `Why We Gave Bugs an ELO Rating`: bug handling can itself become a structured
  system with anti-abuse controls.
- `What I Learned From My Worst Pull Request`: AI misuse is a systems problem,
  not just a personal failure.

### Theme 5: Distribution, personalization, and interfaces

- `One Site, Many Faces`: the same platform can present differently by persona.
- `How the spike.land OpenAI-compatible endpoint works, and how to try it locally`:
  keep the familiar `/v1` contract, but add local context and capability
  injection.
- `Godspeed Development: 100 App Ideas Powered by Spike Land MCPs`: the tool
  surface is a velocity engine.

### Theme 6: Founder mythology, identity, and strange-system framing

- `The Predictor Already Moved`
- `The Two Boxes`

These are not core product docs, but they contribute tone: inevitability,
prediction, systems already in motion, and the feeling that the future arrived
before the audience understood it. Use carefully and sparingly.

## Article-by-article compression map

This appendix is the "single PRD compression" of the corpus. Each line is the
smallest useful truth to carry forward.

- `A Chemist Walked Into a Codebase`: requirements plus typed tools beat vague
  talent narratives.
- `How spike.land Uses AI and A/B Testing to Find Bugs Before You Do`: variant
  testing is part of the quality loop, not just growth.
- `How to Automate Your Dev Team`: ship production code by replacing bottlenecks
  with agent workflows.
- `Why We Gave Bugs an ELO Rating`: even bug intake can be gamed, ranked, and
  defended like a system.
- `Context Engineering Your Zero-Shot Prompt`: success starts before the first
  generation, not after the fifth fix.
- `Docker Layers Are Just Like LLM Context Caching`: stable context saves money
  and preserves performance.
- `Getting Started with spike.land`: reduce time-to-first-tool-call.
- `Godspeed Development: 100 App Ideas Powered by Spike Land MCPs`: the tool
  catalog should feel like latent product inventory.
- `Hogyan tervezi a Claude Code a kontextust`: localized version of the context
  planning thesis.
- `How Claude Code Engineers Context`: planning quality depends on how the model
  is fed.
- `It Feels Like Cheating (Because It Is)`: delete fragile ceremony, keep the
  system that proves correctness.
- `Embed spike.land MCP Tools in Your Existing Project in 5 Minutes`: spike.land
  is designed to leak outward into other runtimes.
- `MCP Explained`: protocol surface matters because it shapes model
  understanding.
- `We Migrate Next.js Apps Without Guesswork`: first extract structure, then
  automate the rewrite.
- `Appendix: Anticipated Pushback on the Next.js Migration Post`: have the
  objections ready before the debate starts.
- `Next.js vs TanStack Start`: leverage is a cost structure question.
- `One Site, Many Faces`: the interface can personalize without splitting the
  product.
- `How the spike.land OpenAI-compatible endpoint works, and how to try it locally`:
  familiar contracts plus local intelligence beat raw passthroughs.
- `Introducing the spike.land App Store`: distribution is part of the runtime.
- `Introducing spike.land`: MCP-first platform, 80+ tools, marketplace logic.
- `The Architecture of Scale: How I Made My MCP Tools Agent-Writable`: the tool
  builder should be writable by agents.
- `defineBlock(): How I Built a Full-Stack Database Abstraction on Cloudflare Workers`:
  rebuilding foundations quickly is acceptable when the abstraction improves.
- `The Grandmother Neuron Fallacy`: tool chains fail when you ask models to
  cross unclear boundaries.
- `The PRD Filter: Your Old Chats Are Already PRDs`: transcript sludge should
  become a compact, truthful artifact.
- `The Predictor Already Moved`: prediction and inevitability are part of the
  brand mythology.
- `The Testing Pyramid Is Upside Down`: typed tool surfaces beat browser-heavy
  test pipelines.
- `The Two Boxes`: systems thinking, prediction, and sovereignty add narrative
  texture.
- `The Universal Interface Wasn't GraphQL`: MCP and chat displaced the older
  dream of universal GraphQL abstraction.
- `The Vibe Coding Paradox`: unguided AI drifts; structured learning loops fix
  it.
- `Think Slowly, Ship Fast`: the hourglass model is the operating shape.
- `Tool-First Testing vs Browser Testing: A Benchmark on spike.land`: tool
  interfaces are measurable leverage.
- `What I Learned From My Worst Pull Request`: AI quality failures are
  recoverable if the framework improves.
- `What I Would Ship in Claude Code as of March 12, 2026`: history compression
  and tool-work compression are the next frontier.
- `Where Does Your Code Actually Belong? Take the Quiz.`: code organization is a
  product and cognition problem.
- `Context window management: why spike-chat stays sharp while transcript-first AI chats go soft`:
  the best chat system preserves the cleanest artifact, not the longest
  transcript.
- `Why Your Claude Agent Is Wasting 70% of Its Context Window on Tool Descriptions`:
  lazy loading and toolset discipline are mandatory.
- `You Cannot Automate Chaos`: automation amplifies system quality, good or bad.

Supporting assets in `content/blog` that are not core editorial posts but are
still useful reference:

- `product-hunt-launch-copy.md`
- `the-other-spike-land-video-script.md`
- `translations/de/the-testing-pyramid-is-upside-down.mdx`

## Scene plan

1. Cold open: robot helmets, terminal glow, statement of the paradox.
2. The promise: show the seduction of one-prompt software generation.
3. The failure mode: drift, silent wrongness, false confidence.
4. Physics section: attention budget and context dilution.
5. PRD filter reveal: transcript becomes artifact.
6. spike-chat section: staged compression and bounded tool calling.
7. OpenAI-compatible endpoint section: familiar API shape, local intelligence.
8. MCP section: why the interface layer matters.
9. Robot-rock prompt showcase: one prompt, one concept frame, one clean artifact.
10. Closing thesis: disciplined context is the real leverage.

## On-screen text ideas

- THE VIBE CODING PARADOX
- MORE POWER, MORE DRIFT
- OLD CHATS ARE LATENT PRDS
- CLEANER CONTEXT, BETTER OUTPUT
- DO NOT REPLAY THE TRANSCRIPT
- CARRY FORWARD THE TRUTH
- MCP IS THE INTERFACE
- PROMPT -> PRD -> PLAN -> EXECUTE

## Risk register

- Risk: the video feels too abstract.
  Mitigation: keep returning to one concrete robot-rock showcase artifact.

- Risk: the product thesis gets buried under cinematic style.
  Mitigation: every visual flourish should map back to a systems claim.

- Risk: viewers interpret the piece as anti-Grok.
  Mitigation: frame Grok as the catalyst and the cultural context, not the enemy.

- Risk: live demo claims exceed current repo reality.
  Mitigation: explicitly stage the tool workflow as planned or mocked unless the
  CLI transport is repaired.

## Acceptance criteria

The final video plan is acceptable only if it:

- clearly explains the paradox in plain English
- makes the PRD filter legible in one sentence
- connects spike-chat, MCP, and the OpenAI-compatible endpoint into one system
- includes a memorable robot-rock visual centerpiece
- gives Grok enough structure to produce a real scene-by-scene plan
- does not depend on unsupported live CLI tool execution

## Grok-ready master prompt

Use this as the planning prompt for Grok:

> Plan a cinematic 8-12 minute product essay video titled "The Vibe Coding
> Paradox" for spike.land. Frame Grok as the force that helped create the
> cultural condition of vibe coding: stronger models, looser prompting, more
> drift. The video must argue that the fix is not larger transcript buffers but
> better representation: context engineering, the PRD filter, spike-chat style
> compression, bounded tool surfaces, MCP as the universal interface, and an
> OpenAI-compatible endpoint that injects local context. Build the visual world
> around robot-rock concert energy: chrome helmets, brutal spotlights, terminal
> glow, smoke, crowd silhouettes, kinetic typography, systems diagrams. Include
> a prompt-only creative tool showcase that generates a French-touch
> electro-futurist robot-rock hero frame from one text prompt, but do not assume
> a live CLI tool demo because the current repo cannot execute MCP tools from
> source. Produce a full scene-by-scene treatment, narration outline, shot list,
> motion language, on-screen text, music direction, transition ideas, and a
> short trailer cut plan. Optimize for clarity, authority, and memorability.
