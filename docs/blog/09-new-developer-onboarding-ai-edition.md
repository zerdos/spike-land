# The New Developer Onboarding: AI Edition

![A new junior developer confidently stepping into a futuristic, AI-powered office space, guided by floating digital documentation and helpful AI agents.](https://placehold.co/800x400)

_By Zoltan Erdos | Brighton, UK | January 2026_

Starting a new job used to feel like learning to swim in the shallow end. Today, with AI, it feels like being handed the keys to a jet plane on day one. Both are dangerous if you aren't prepared.

If you are a junior developer, or a senior dev onboarding someone new, the rules of starting a new project have completely changed. Here is why your team needs to rethink onboarding right now.

## How Onboarding Used to Work

When I started my first real developer job, the process was intentionally slow.

*   **Week One:** Read the README. Set up your machine. Break something. Ask for help.
*   **Week Two:** Read code. Attend meetings. Start recognizing architectural patterns.
*   **Week Three:** Get your first small task—a simple bug fix. Submit a PR. Learn from the review.

It was slow, but it was safe. You built understanding layer by layer.

## The Danger Zone: Speed Without Context

Now, consider the new reality. With AI tools, a new developer can read the entire codebase in seconds, write complex features, and refactor architecture immediately.

On day one, a new hire can ship code.

![A comparison chart showing the slow, traditional onboarding process versus the fast but risky AI-assisted onboarding, highlighting the 'Danger Zone' of missing context.](https://placehold.co/600x300)

This feels like a superpower. Productivity numbers soar. PRs look clean. But there is a massive problem: **AI gives you superpowers, but not super-understanding.**

The AI makes smart guesses based on patterns it sees in the codebase. As a new developer, you have no idea what assumptions the AI made.

*   The AI might use an old convention the team abandoned months ago.
*   The AI might ignore a subtle edge case only documented in an old Jira ticket.
*   The AI might write perfectly syntactically correct code that breaks the actual business logic.

You are trusting the AI because the code looks right. This is the **Danger Zone: AI plus no context equals slop.** Speed without understanding. Fire without control.

## The Solution: A New Approach to Onboarding

After learning this the hard way, I changed my approach. I stopped using AI to skip learning and started using it to accelerate learning.

Here is the framework that works:

**1. Documentation First.**
Before writing any feature code, use AI to create documentation about what you are learning. Note patterns, ask questions, and summarize architecture. This forces you to understand before you generate.

**2. Scripts Second.**
Build small tools to check your assumptions. Write quick scripts to validate that the codebase behaves the way you (and the AI) think it does.

**3. Tests Third.**
Write tests before asking the AI for the implementation. If you cannot write a test, you do not understand the problem well enough. The test becomes your proof of understanding.

**4. AI Last.**
Only after you have documentation, scripts, and tests should you let the AI write the main code. By then, you can verify its work and catch wrong assumptions.

This method feels slower at first. But the code produced is actually good. The PRs get approved, and the senior developers trust you.

![A flowchart showing the new onboarding steps: Documentation -> Scripts -> Tests -> AI Implementation.](https://placehold.co/600x300)

## How Teams Must Prepare

If you lead a team, your next new hire will arrive with AI superpowers. You must be ready.

*   **Write down assumptions:** The patterns, conventions, and history that seem obvious to you are unknown to new developers and their AI tools. Document them (e.g., in a `GEMINI.md` file).
*   **Design safe first tasks:** Don't just give them easy tasks; give them tasks where AI assumptions cannot cause damage. Let new developers build context before they build features.
*   **Review differently:** When reviewing code from new developers, ask: "Did you write this, or did AI write this?" Use reviews to teach missing context, not just to catch bugs.
*   **Pair programming:** Sitting with a new developer shares the tribal wisdom that AI cannot access.

The future belongs to developers who combine AI power with deep understanding. By focusing on context first, you can turn a dangerous jet plane into a safe, incredible ride.

---

_Zoltan Erdos is a developer based in Brighton, UK, building spike.land. He believes onboarding is changing forever and wants to help both sides get it right._
