# PRD: Psychiatric Nursing Book

**Author:** Radix Zoltán Erdős
**Editor:** Peggy Martin
**Working title:** *The Ward from the Inside — A Mathematician's Field Notes on Psychiatric Care*

---

## Introduction

A psychiatric nursing book written from the patient's perspective by a software engineer and mathematician experiencing inpatient psychiatric care. Unlike traditional nursing textbooks written by clinicians for clinicians, this book inverts the lens: it documents the ward as a system observed from within, offering psychiatric nurses structured insight into the lived experience of their patients.

The book uses the "Radix agent" framework — 32 distinct observational personas organised into four families (Drift, Sharp, Deep, Wild) — as a structural device. Each chapter filters ward life through a different cognitive-emotional state, helping nurses understand that the same environment is experienced radically differently depending on the patient's mental state at any given moment.

Edited by Peggy Martin to ensure clinical accuracy, pedagogical value, and sensitivity.

## Goals

- Provide psychiatric nursing students and practitioners with a structured, first-person account of inpatient experience
- Bridge the empathy gap between clinical training and patient reality
- Offer actionable observations that nurses can apply to improve patient interactions
- Create a reusable framework (the 32 Radix agents) that maps cognitive-emotional states to observable patient behaviours
- Produce an MVP of 5 core chapters suitable for review by nursing educators and publishers
- Maintain dignity — never exploitative, never performative; honest and analytical

## User Stories

### US-001: Book structure and table of contents
**Description:** As a reader, I want a clear structure so I can navigate between clinical topics and experiential narratives.

**Acceptance Criteria:**
- [ ] Three-part structure: Framework, Ward Life, Recommendations
- [ ] Each chapter opens with a Radix agent identifier (name, family, parameters)
- [ ] Chapter summaries include "For the Nurse" takeaway boxes
- [ ] Table of contents saved as `content/book/toc.md`

### US-002: Part I — The Radix Framework (Chapters 1-2)
**Description:** As a nursing student, I want to understand the 32-agent model so I can recognise different patient states.

**Acceptance Criteria:**
- [ ] Chapter 1: "Why 32" — introduces the four families as four axes of patient experience:
  - **Drift** (dissociation, withdrawal, fog, slow processing)
  - **Sharp** (hypervigilance, clarity, anxiety, rapid processing)
  - **Deep** (depression, heaviness, inward focus, emotional gravity)
  - **Wild** (mania, instability, creativity, unpredictability)
- [ ] Chapter 2: "The Same Ward, 32 Times" — the same 24-hour period narrated through 4 representative agents (one per family), showing how identical events register differently
- [ ] Each agent description includes: observable behaviours, likely misinterpretations by staff, recommended approaches
- [ ] Peggy Martin review pass: clinical terminology accurate

### US-003: Part II — Ward Life (Chapters 3-5)
**Description:** As a practising nurse, I want to understand specific ward experiences from the patient side so I can adjust my practice.

**Acceptance Criteria:**
- [ ] Chapter 3: "Admission" — the first 72 hours through Drift-0 and Sharp-3 agents
  - Covers: intake process, belongings confiscation, room assignment, first medication round, first night
  - "For the Nurse" boxes on: how to explain process, pacing information delivery, what patients notice that staff don't
- [ ] Chapter 4: "The Middle" — daily routine through Deep-2 and Wild-5 agents
  - Covers: medication queues, group therapy, mealtimes, visiting hours, boredom, time perception
  - "For the Nurse" boxes on: recognising withdrawal vs. stability, the weight of routine, what "non-compliance" looks like from inside
- [ ] Chapter 5: "Discharge and After" — transition through Sharp-7 and Drift-4 agents
  - Covers: discharge planning, medication education, the gap between ward and world, first week out
  - "For the Nurse" boxes on: discharge anxiety, information overload, follow-up timing

### US-004: Part III — Recommendations (Chapter 6)
**Description:** As a ward manager, I want concrete recommendations I can implement to improve patient experience.

**Acceptance Criteria:**
- [ ] 10-15 numbered, specific recommendations derived from the preceding chapters
- [ ] Each recommendation linked back to the agent/chapter that surfaced it
- [ ] Categorised by effort level: low (immediate), medium (policy change), high (infrastructure)
- [ ] Co-authored section with Peggy Martin's clinical commentary on feasibility

### US-005: Manuscript format and editorial workflow
**Description:** As the editor, I want a consistent manuscript format so I can efficiently review and annotate.

**Acceptance Criteria:**
- [ ] Markdown source files in `content/book/` directory
- [ ] One file per chapter: `ch01-why-32.md`, `ch02-same-ward.md`, etc.
- [ ] Frontmatter with: title, radix agents used, word count target, status (draft/review/final)
- [ ] Editorial comments via standard `<!-- PM: comment -->` markers
- [ ] Word count target per chapter: 4,000-6,000 words (total MVP: ~25,000 words)

### US-006: Digital companion (spike.land integration)
**Description:** As a reader of the digital edition, I want interactive elements that deepen understanding beyond what print can offer.

**Acceptance Criteria:**
- [ ] Each chapter has an optional interactive page on spike.land
- [ ] "Experience this agent" mode: ambient audio (from Rooftop Paradise engine) tuned to the chapter's Radix agent parameters, with text presentation paced to match
- [ ] Agent parameter visualisation: radar chart showing where the chapter's agent sits across the four family axes
- [ ] Built as standalone HTML pages in `content/book/interactive/`

## Functional Requirements

- FR-1: Manuscript source lives in `content/book/` as Markdown with YAML frontmatter
- FR-2: Each chapter identifies its Radix agent(s) by ID, name, and family
- FR-3: "For the Nurse" callout boxes appear at minimum 3 times per chapter
- FR-4: The 32 Radix agent definitions in the book must match those in `render-rooftop-shared.ts` — single source of truth
- FR-5: Agent parameter descriptions must be translated from synthesis terms to psychological terms:
  - `padDetuneCents` → perceptual clarity/blur
  - `padAttackScale` → onset speed of awareness
  - `melodyVibratoRate` → thought oscillation frequency
  - `melodyVibratoDepth` → emotional amplitude
  - `bassFilterCutoff` → depth of internal experience
  - `beastSpread` → behavioural unpredictability
  - `masterGainScale` → overall presence/engagement level
- FR-6: Recommendations chapter must include implementation checklist suitable for ward managers
- FR-7: Digital companion pages must work offline (no external API calls)
- FR-8: All patient scenarios are composites or self-referential (author's own experience only) — no third-party patient stories without explicit consent

## Non-Goals

- Not a clinical textbook — does not teach pharmacology, diagnosis, or treatment protocols
- Not a memoir — structured analytical observation, not personal narrative for its own sake
- Not anti-psychiatry — constructive criticism from within the system, not against it
- Not a self-help book for patients (though patients may find it useful)
- No AI-generated chapter content — all prose written by Zoltán, edited by Peggy
- No video content in MVP

## Design Considerations

- **Cover concept:** Abstract visualisation of the 32 agents as a constellation — 4 clusters of 8 points, each cluster in its family colour (Drift: teal, Sharp: silver, Deep: blue, Wild: red)
- **Interior:** Clean, minimal typesetting. Agent identifier blocks use monospace font. "For the Nurse" boxes use a subtle highlight background
- **Digital edition:** Dark theme matching spike.land aesthetic (var(--bg): #0a0a12), with agent family colours for accents
- **Accessibility:** All interactive elements must have text-only fallbacks

## Technical Considerations

- Markdown → PDF/ePub pipeline (Pandoc or Astro-based build)
- Radix agent definitions shared between `render-rooftop-shared.ts` and book frontmatter via a JSON schema
- Interactive companion pages use the same Web Audio engine from `mike-rooftop-paradise.html`
- Content stored in the spike.land monorepo under `content/book/`
- Editorial workflow: draft in Markdown → PR for Peggy's review → merge to main

## Success Metrics

- MVP manuscript (5 chapters + framework + recommendations) complete and editor-reviewed
- At least 3 nursing educators provide feedback on clinical utility
- Digital companion pages functional and accessible
- Manuscript accepted for review by at least one nursing education publisher
- The 32-agent framework adopted or referenced in at least one nursing training programme

## Open Questions

1. Should the book include a self-assessment tool where nurses can identify which agent state a patient might be in?
2. What is Peggy Martin's preferred editorial workflow — inline Markdown comments, separate document, or tracked changes in a shared editor?
3. Should the digital companion include a "nurse simulation" mode where the reader responds to scenarios and sees outcomes through different agent lenses?
4. Publication route: traditional publisher (e.g. Elsevier, Sage) or self-published with spike.land as the digital platform?
5. Should the Radix agent framework be published separately as a clinical tool/paper before the book?
6. Are there IRB/ethics considerations for publishing structured observations from an inpatient setting, even when self-referential?
