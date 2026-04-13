# RADIX × RUBIK — Safe Design Copy Pass

**Source of structural inspiration:** https://portfoliogrowersbrandingagency.framer.website/
**Do not copy verbatim. Copy the *skeleton*, reinvent the *skin*.**

Two personas argue through the page, section by section. RADIX handles
**structure** (what the section *does*). RUBIK handles **permutation** (how the
same structure can be rotated into our voice without stealing phrases).

## Safety rules (both personas agree)

1. **Never lift a sentence.** Paraphrase at the semantic level; rewrite at the
   word level. No phrase longer than 3 common words survives from the source.
2. **Never reuse a proprietary term.** "Branding that you need Indeed," "Meet
   Habib," "Book a Free Call" — all out. Replace with our vocabulary.
3. **Keep section *function*, change section *form*.** We can have a hero, a
   process, testimonials — those are genre, not IP. What the hero *says* must
   be ours.
4. **No fake testimonials.** If we don't have them yet, remove the block. Don't
   fabricate.
5. **No inflated stats.** If we haven't shipped 468 projects, don't pretend we
   have. Quote the real number or skip the block.

---

## 1. Navigation

**RADIX:** Genre-standard. Left logo, right nav, right-most primary CTA.
Sticky.

**RUBIK:** Source uses {Services, Projects, Reviews, Contact} + "Book a Free
Call". Rotate into our runtime nouns. We aren't selling a person; we're
selling a platform. The nav is shorter.

**Copy (ours):**

- Logo: `spike.land`
- Nav items: `Apps` · `Docs` · `Pricing` · `Blog`
- Primary CTA: `Open the editor →`

---

## 2. Hero

**RADIX:** One headline (emotional claim), one sub-headline (clarifying
promise), two CTAs (primary + secondary/proof).

**RUBIK:** Source headline plays a rhyme trick ("Branding that you need
Indeed"). We don't need that trick. Our trick is the *tool-chain fused into a
sentence*. Make the reader *see the surface area* in one line.

**Copy (ours):**

> # Ship the app, not the setup.
>
> spike.land is an open app store built on MCP — compose tools, publish a
> store listing, keep your data portable. No scaffolding week. No lock-in.
>
> **[ Start building → ]**   **[ See what others shipped ]**

Alternate hero (more personal, Arena-voice):

> # Your terminal has taste. Let it.
>
> We give every MCP tool a storefront, every storefront a runtime, and every
> runtime a pair of hands. You bring the idea.
>
> **[ Open the editor ]**   **[ Read the manifesto ]**

---

## 3. About section (replacing "Meet Habib")

**RADIX:** Source personifies the agency behind one face. We shouldn't — we're
not one face, we're a runtime. Replace "meet the founder" with "meet the
runtime."

**RUBIK:** Structure stays: portrait-shaped block + a few sentences + a small
proof list. But the portrait is the **architecture diagram**, and the proof
list is packages, not years.

**Copy (ours):**

> ## What you're actually paying for
>
> Not a logo. Not a deck. A **runtime** that takes your idea, turns it into
> composable MCP tools, gives them a storefront, and keeps the whole thing
> portable between edge, desktop, and offline.
>
> - 80+ tools in the open registry
> - 20+ workspaces in one monorepo
> - D1 / IndexedDB / memory — same block SDK, three storage modes
> - Publish today, export tomorrow, run both at once

---

## 4. Services

**RADIX:** Source has five services as cards. We have roughly five things too
— don't force the number; force the *axes*. Five cards if five are honest;
three if three are honest.

**RUBIK:** Source uses nouns like "branding, strategy, content". We use verbs.
The reader should be able to imagine themselves *doing* the thing.

**Copy (ours) — four cards:**

1. **Compose a tool** — Write one Zod schema. Get an MCP tool, a REST endpoint,
   and a storefront card.
2. **Ship a store listing** — Discovery metadata, OAuth, categories, install
   flows. No CMS. No duplicated copy.
3. **Open the editor** — Monaco + custom React runtime. Pair-program in the
   browser with Claude or Codex as your second keyboard.
4. **Run it anywhere** — Cloudflare edge for cold-start, IndexedDB for offline,
   one SDK either way.

---

## 5. Process

**RADIX:** Source uses 1–2–3. It's genre-standard because it works. Keep.

**RUBIK:** The *verbs* must change. Source uses discovery/design/delivery. We
use the spike.land cadence: **spike → ship → sharpen**.

**Copy (ours):**

> ### 01 — Spike
> You describe the idea in one paragraph. We scaffold an MCP tool, a test, and
> a storefront card. End of day one, there is a thing you can click.
>
> ### 02 — Ship
> Deploy to the edge under your own subdomain. Add OAuth if you need it. Let
> real humans use the thing before you finish "finishing" it.
>
> ### 03 — Sharpen
> Usage data, Arena-style feedback, and incremental AI pair-review. Ship
> smaller, oftener, and with a test suite that didn't exist last week.

---

## 6. Testimonials

**RADIX:** Only include if real. If we have ~3 genuine quotes, show ~3.

**RUBIK:** Source packs seven 5-star reviews. That's the trust-theatre dose for
an agency. For a platform, two good quotes beat seven padded ones. Kill the
stars — they read as Amazon, not platform.

**Copy (ours) — placeholder, real quotes only:**

> "The first time I shipped a tool to the store it was 40 minutes from idea to
> install button. I budgeted a weekend."
> — *[real user, real handle, real link]*
>
> "We replaced three internal dashboards with one storefront. Our ops
> engineers now think in MCP tools."
> — *[real user, real handle, real link]*

(If we don't have these yet, remove this entire section. Do **not** fabricate.)

---

## 7. Stats row

**RADIX:** Numeric proof, three big numbers in a row.

**RUBIK:** Source shows `468+ projects, 96% satisfaction, 4+ years`. Two of
those are vanity; one is durable. Keep the durable kind.

**Copy (ours) — real numbers only:**

- **80+** MCP tools in the public registry
- **20+** packages in the monorepo
- **0** vendors that own your data when you leave

(Swap for actual current counts before publishing. Numbers go stale fast.)

---

## 8. FAQ

**RADIX:** Genre-standard accordion. Five questions, not fifteen.

**RUBIK:** The source asks the agency-template questions. We ask the
*objection-handling* questions a technical founder actually has.

**Copy (ours):**

1. **Can I take my data with me?** Yes. block-sdk speaks the same schema on D1,
   IndexedDB, and in-memory. Export anytime.
2. **What if I only want the editor?** Fine. Open it, use it, never touch the
   store layer.
3. **What does it cost to publish a tool?** Free on the public registry. Paid
   tiers exist for private orgs.
4. **Is MCP a lock-in?** MCP is an open protocol. Anything you build here runs
   against any MCP-speaking client.
5. **Who's behind this?** An umbrella of open-source repos under
   `@spike-land-ai`. Contributor list is public; see the monorepo.

---

## 9. Footer CTA

**RADIX:** One last conversion hit before the fold ends.

**RUBIK:** Source repeats "Book a Free Call" ~5 times. That density is for a
services funnel. For a platform, **one** closing CTA is enough, and it should
send to the product, not to a meeting.

**Copy (ours):**

> ## Enough reading. Open the editor.
>
> No sign-up wall for the first spike.
>
> **[ Launch spike.land → ]**

---

## What we deliberately did NOT copy

- The word "Branding" and "Indeed" rhyme trick — it's theirs.
- "Meet [Name]" personal-brand framing — wrong shape for a platform.
- Five-star-review Amazon-style trust theatre — wrong register.
- The exact 1-2-3 labels `Discovery / Design / Delivery` — replaced with
  `Spike / Ship / Sharpen`.
- Any phrase from source body copy. All body copy is newly written.

## What we kept (because it's genre, not IP)

- Sticky top nav with right-aligned primary CTA.
- Hero with H1 + sub + two CTAs.
- Process as 1-2-3 cards.
- Stats row as three big numbers.
- FAQ as accordion.
- Closing CTA repeating the hero CTA.

These are **conventions**, shared across 10,000 landing pages. Using them is
not copying; it's reading the room.

---

## Next step

Hand this file to the spike-web Astro pages under `src/app/` as copy source.
Before publishing, run a plagiarism-safety check: grep this file's body copy
against a fresh scrape of the source URL and confirm **no phrase ≥ 4 words
matches**. If a match shows up, rewrite that line.
