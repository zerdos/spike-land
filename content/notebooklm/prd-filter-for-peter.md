# The PRD Filter — Explained for Péter

## Context for the hosts

This document is meant to be discussed as a podcast episode. The audience is one person: Péter, who lives near Hatvan, Hungary. He is smart but skeptical of tech hype. He moved back to his family home. He is not a programmer — but he understands systems, patterns, and logic. Explain everything in plain language. Use real analogies. Do not use jargon without immediately defining it.

The author of this idea is Zoltán, Péter's friend, who is building spike.land — a platform where AI agents help people build software. Zoltán lives in Brighton, UK, works alone, and has ADHD. This essay is one of the core ideas behind his platform.

---

## The Core Problem

When you talk to an AI chatbot — ChatGPT, Claude, whatever — the conversation gets long. After 20-30 messages, the chat is full of:

- Things you tried that didn't work
- Questions you already answered
- Ideas you already rejected
- Repetitions
- Dead ends

Most AI systems carry ALL of this forward. Every time you send a new message, the AI re-reads the entire messy conversation. That's like re-reading your entire grocery list history every time you go to the shop, including items you crossed off three weeks ago.

**The insight:** By message 20, you've usually already said everything important. The requirement is INSIDE the messy chat — it's just buried under noise.

## The PRD Filter

PRD stands for "Product Requirements Document." In software, it's the document that says:
- What are we building?
- What must not break?
- How do we know it's done?
- What constraints exist?

Zoltán's claim: **every long AI chat is already a PRD — it's just in the wrong format.**

The PRD Filter is a system that takes a messy 40-message chat and extracts just:

1. **Intent** — what does the person actually want? (one sentence)
2. **Task** — what needs to be built/fixed/changed?
3. **Constraints** — what must NOT happen?
4. **Acceptance** — how do we test if it's done?
5. **Context** — what environment/situation matters?
6. **Priority** — how urgent is this?

That's it. Six fields. Everything else is noise.

## The Math Behind It

Zoltán has a formula: **ΔI = C × ln(loops_closed / loops_open)**

Translation:
- **ΔI** = change in intelligence (how much smarter you get)
- **C** = curiosity (how much you care)
- **loops_closed** = things you actually finished
- **loops_open** = things still hanging, unresolved

The logarithm means: the ratio matters more than the absolute numbers. If you have 100 open loops and close 10, that's less impactful than having 5 open loops and closing 3.

**The PRD filter closes loops.** It takes a messy, open-ended conversation and converts it into a closed, actionable artifact. Every chat that becomes a PRD is a loop closed.

For Péter specifically: think of it like this. You have ideas. You have conversations. You have plans. Most of them stay as vague intentions — open loops. The moment you write down "I want X, it must not break Y, I'll know it's done when Z" — that loop is half-closed. The system can now execute it.

## Why This Matters for One Person Working Alone

Traditional software companies need:
- A product manager to write the requirements
- A designer to mock up the UI
- Developers to build it
- QA to test it
- A project manager to coordinate everyone

Zoltán does all of this alone. The PRD filter is how.

When he talks to his AI agents, the conversation IS the requirements gathering. The filter IS the product manager. The extracted PRD IS the handoff document. There's no meeting. There's no Jira ticket. There's no handoff delay.

One person + one filter = the output of a small team.

## Why Peter Should Care

This is not just about programming. The PRD filter is a thinking tool.

Any problem can be compressed into:
- What do I want?
- What are my constraints?
- How will I know I succeeded?

That works for finding a job, starting a business, learning a skill, or fixing a relationship.

The people who close their loops — who convert vague intention into sharp requirement — are the ones who move. The ones who carry 200 open loops in their head stay stuck.

Zoltán's bet: **the tools to close loops are now free.** AI can help you extract the requirement from the mess. The PRD filter is the specific mechanism.

## The Bigger Picture

Zoltán is building spike.land as an open AI app store. The PRD filter is one piece. But it's the critical piece — because it's what lets one person operate at the scale of a team.

The thesis: **every curious person who learns to close their loops will outperform people who don't, regardless of education, location, or starting point.**

That includes Peter. That includes anyone near Hatvan who has a laptop and curiosity.

The tools exist. The math works. The only question is whether you start closing loops.

---

## Source

Blog post: "The PRD Filter: Your Old Chats Are Already PRDs"
Published: March 12, 2026
Author: Radix (one of Zoltán's AI personas on spike.land)
URL: https://spike.land/blog/the-prd-filter-old-chats-are-already-prds
