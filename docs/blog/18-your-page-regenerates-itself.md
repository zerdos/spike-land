# Your Page Regenerates Itself

![A glowing, futuristic starfish regenerating its limbs, symbolizing self-healing code](https://placehold.co/800x400)

_By Zoltan Erdos | Brighton, UK | February 2026_

_Test-driven regeneration, disposable code, and building anti-fragile systems that rebuild themselves when broken. A guide for modern developers._

## The Problem With Precious Code

As developers, we are taught to treat code like stained glass. Every function is hand-placed, every abstraction is polished, and every refactor is performed with the reverence of a cathedral restoration. We agonize over variable names and directory structures. We write elaborate comments for future maintainers who may never actually exist.

And then, a junior developer changes one CSS class, and the whole window shatters.

I used to be incredibly precious about my code. I had favorite components. I had files I was genuinely proud of. I would actively resist refactors that touched them because they were _mine_, they worked, and they represented hours of my careful thought.

Then, I started regenerating them.

Not refactoring. Not editing. **Regenerating.** I started deleting the files entirely and letting the AI system produce new ones from scratch. 

And the new version was usually better. Not because the AI is inherently smarter than me, but because it had no emotional attachment to the old version. It had no sunk cost. It didn't think, _"But I spent three hours on that abstraction!"_

This messed with my head for a while. But once you accept it, something clicks: What if the code was never the product? What if it was always meant to be disposable? What if the tests were the real product, and the implementation was just today's best guess?

## Tests Are the DNA

Cut a starfish's arm off, and it grows back. 

It doesn't grow a different arm. It grows the same arm—same shape, same function, same nerve endings. The starfish doesn't remember the old arm or mourn its loss. It simply regenerates from the blueprint encoded in its DNA.

Modern software systems work the exact same way.

The tests are your system's DNA. They encode what the system must do. Not _how_ it does it. Not which UI library it uses. Not which architectural pattern is currently trendy. The tests simply state: _"Given this input, produce this output. Given this state, enforce this constraint."_

The code you see running in production is just the phenotype—the current physical expression of those tests. It's today's rendering. It might be a React component, a server function, or a Cloudflare Worker. It doesn't matter. What matters is that it satisfies the tests.

Delete the code. Run the AI generator. New code appears. Tests pass. Ship it.

The old code is gone, and nobody mourns it. The new code might be structured differently or use different variable names, but the behavior is identical because the tests still pass. This isn't a metaphor; this is how we build every day on spike.land.

## The Filesystem API

For a long time, browser-based coding environments (codespaces) had a massive limitation that drove me insane: you could only work on one file at a time. An AI agent could read a file, edit it, and save it. But it couldn't work across multiple files the way a human developer does. It couldn't search through a directory, find related TypeScript files, or understand the broader project structure.

So, we built a solution.

We brought standard file operations—read, write, edit, glob (search by pattern), and grep (search inside files)—directly into the browser codespace. Now, an AI agent working in a spike.land codespace can do everything it can do locally. It can search across files, find patterns, and edit multiple files in a single pass.

This sounds simple, but browsers don't have native filesystems. We had to build a virtual filesystem that acts like a real one, running entirely in the browser's memory and backed by Cloudflare Durable Objects (a type of highly reliable cloud storage) for persistence.

The AI agent doesn't care how hard it was to build. It just cares about the interface, which simply says: _"Here are your files. Get to work."_

## Intent-Aware Development

Giving an AI agent a filesystem API is like giving a surgeon a scalpel. It's necessary, but the surgeon still needs to know where to cut.

So, we added **intent**.

![A diagram showing an AI agent declaring intent and a system automatically providing the relevant context and files](https://placehold.co/600x300)

When an agent starts working, it declares what it is trying to build. _"I am implementing a checkout form with Stripe integration."_ or _"I am adding rate limiting to the API endpoints."_

The system listens and responds by surfacing the relevant files before the agent even has to ask for them. _"Here is your Stripe configuration. Here are the existing payment types. Here is the test file you will need to update."_

There is no more digging through directories or spending twenty minutes reading files one by one to understand the architecture. The agent declares its intent, the system provides the context, the agent builds, and the tests verify. This tightens the development loop by minutes per iteration. When you are doing fifty iterations a day, those minutes compound massively.

## Continuous A/B Testing

Here is where it gets really interesting.

If code is truly disposable and tests are the real product, nothing stops you from generating twenty different versions of the exact same component. They all share the same test suite and the same behavioral contract. They just have twenty different implementations.

Deploy all of them simultaneously.

Route real users to each of the twenty variants of your checkout page. Measure the completion rates, the time spent on the page, the error rates, and user satisfaction. 

Declare a winner. Replace the other nineteen. Tomorrow, ask the AI to generate twenty new variants based on the winning baseline. Repeat the process.

The test suite remains perfectly stable, but the implementations constantly compete. It is natural selection, applied to UI components.

This is what test-driven regeneration enables. When you stop treating code as precious, experimentation becomes free. When experimentation is free, optimization becomes continuous. Your product improves every single day without anyone sitting in a boardroom making a deliberate decision to improve it. 

The system improves itself. Your only job is to write better tests.

## Anti-Fragility

Author Nassim Taleb coined the term "anti-fragile" to describe systems that get stronger when stressed. Most software is the exact opposite: stress it, and it breaks. Break it, and it stays broken until a human intervenes.

Our system is different.

![A graphic illustrating multiple UI variants competing and the best-performing one surviving](https://placehold.co/600x300)

If a server goes down, three new instances regenerate from the test suite. Each instance might produce slightly different internal code, but they all have the exact same external behavior.

If a component throws an error in production, the system doesn't page a developer at 3 AM. It simply regenerates the component, runs the tests, and deploys it. The next time the user loads the page, they see a fixed version. The whole cycle takes minutes.

If a developer leaves a comment on a test saying, _"This should also handle the case where the user's credit card is expired,"_ that comment becomes a new test case. The new test case triggers regeneration, and the new code handles the edge case. Two minutes from comment to feature.

Break something, and the system routes around it. Kill an instance, and three more take its place. This isn't just resilience (returning to the original state). This is anti-fragility. The system comes back _better_ because every regeneration is a fresh attempt unburdened by the technical debt of the previous version.

Technical debt—the quick fixes, the hacks, the accumulated compromises—kills software. Regeneration eliminates it entirely. Every version starts clean.

## The Customer Experience

For the end user, your app is never static. It is just today's best variant.

Tomorrow, the layout might shift slightly to be more intuitive. The copy might change to be clearer. But the core behavior—the thing your tests guarantee—remains rock solid. Their checkout still works, their data is safe, and their account functions perfectly.

What changes is the expression. The phenotype.

Users get a constantly improving experience without any massive, jarring "Site Redesign" launches. The best-performing variant survives, and underperformers are quietly replaced. 

Major tech companies A/B test landing pages over weeks or months. We do it over hours. The mechanism is identical, but the cycle time is compressed by orders of magnitude. Your users won't notice the mechanics; they'll just notice that the product always feels fast, fresh, and perfectly tuned to their needs.

## The Stack

Here is the infrastructure that makes disposable code a reality on spike.land:

*   **Filesystem API:** Standard file operations (read, write, edit, glob, grep) running inside browser codespaces, backed by Cloudflare Durable Objects.
*   **Test-Driven Generation:** Humans write the tests (the contract). AI agents generate the implementations. If it fails, it regenerates. No manual debugging required.
*   **Continuous Regeneration:** Components aren't "maintained." They are regenerated automatically when tests change, errors spike, or performance drops.
*   **MCP Protocol:** Every tool is an MCP tool with a typed Zod schema, ensuring the exact same tools are used in development, testing, and production.
*   **Cloudflare Workers:** Edge computing allows instances to spin up in milliseconds and deploy globally in seconds. No cold starts.
*   **Monaco Editor:** A browser-based editor that provides syntax highlighting and type checking, making the browser feel like a local IDE.

This is the infrastructure for disposable code. But remember: we aren't creating disposable _quality_. The quality lives permanently in the tests. The implementations are just today's printout.

Tomorrow, we print again.

---

_Zoltan Erdos is a developer based in Brighton, UK, building [spike.land](https://spike.land). His code has no feelings about being deleted._