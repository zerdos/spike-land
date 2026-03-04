# The Trust Gap: Why Teams Reject AI-Generated Code

![Two developers standing on opposite sides of a glowing, transparent wall made of binary code, looking at each other with expressions of uncertainty and hesitation.](https://placehold.co/800x400)

_By Zoltan Erdos | Brighton, UK | January 2026_

I knew something was wrong when my PR sat untouched for three days.

The code was good. The tests passed. The feature worked exactly as requested. I had checked everything twice. But nobody would approve it.

Then I heard the conversation in the break room. "That one from Zoltan? I'll just rewrite it myself. Faster than reviewing all that AI stuff."

That is when I understood. They were not reviewing my work. They were avoiding it.

## The Pattern I Could Not Ignore

If you are a junior developer starting to use AI tools, you need to be aware of a hidden trap: **The Trust Gap**.

My PRs started taking three to four times longer to review than my colleagues' work. Same size. Same complexity. But mine would sit there while others flew through.

I worked harder. I added more tests. I wrote better documentation. I made my PRs smaller. Nothing changed.

The truth was painful. Everything coming from me was treated differently. Not because of *what* I wrote, but because of *how* I wrote it. They knew I heavily used AI.

## When Trust Breaks Down

Here is what I learned about trust in software teams: it is fragile. Once people decide you rely too much on AI, that trust can break very fast.

My colleagues would rather redo my entire PR than give me feedback. Think about that. They preferred to spend hours rewriting work from scratch instead of spending minutes telling me what to fix.

This makes no sense if you think about code quality. But it makes perfect sense if you think about human psychology and trust.

When a developer sees code they believe came from AI, they stop seeing a collaborative effort. They start looking for hallucinations. They start searching for the "gotcha." And sometimes, deep down, they see a threat to their own identity as a developer.

## The Fear Nobody Talks About

Software development has always been about craft. We spent years learning our skills. We built careers on being able to solve hard problems.

Now there is a tool that can do this too. Well enough to be scary.

When a colleague looks at my AI-assisted PR, they are not just reviewing code. They are looking at the changing landscape of our industry. So they push back. They find problems. They request changes. They rewrite. Anything to prove that the careful, human way is still strictly necessary.

This is not about my code. This is about adjusting to a new reality.

![A flowchart showing how a single poorly explained AI code submission leads to a feedback loop of decreased trust, increased scrutiny, and slower review times.](https://placehold.co/600x300)

## How I Broke Trust

Let me be specific about what I did wrong, so you can avoid it.

Early on, there was a ticket about tracking analytics for a checkout flow. I did not understand the system's architecture. I assumed the frontend held the basket data, not realizing the backend was the single source of truth.

I asked the AI to help. It generated code that called the Basket API unnecessarily. The code looked perfect. It passed the tests. I submitted it.

In the code review, a colleague asked *why* I was calling the Basket API. I could not answer. Because I did not know. I did not understand the code I had submitted.

A senior developer was direct: the PR was useless.

That incident broke their trust in me. Even now, when my PRs are excellent, they still get treated with skepticism. The memory of that one bad PR lingers.

## Building Bridges

I wish I had an easy answer for fixing this. But I have learned some things that help rebuild trust:

1. **Stop Hiding:** Don't pretend you wrote every line by hand. Be open about your AI tools. Honesty prevents suspicion.
2. **Show Your Work:** Don't just submit code. Explain the thinking behind it. Document the decisions made. When people see that you deeply *understand* what you submitted, they trust it more.
3. **Change Your Prompting:** Have the AI interview you during the planning phase. Make sure *you* understand the problem before the AI writes a single line.
4. **Test Obsessively:** I spend 50% of my time on testing now. The code itself takes almost no time, but my tests prove beyond a doubt that the code behaves correctly.
5. **Ask for Collaboration, Not Approval:** Instead of saying "please review," say "I'd love your thoughts on this architecture." It changes the vibe from judgment to teamwork.

![An illustration of two developers reviewing code together on a screen, with a friendly AI robot hovering in the background handing them documentation.](https://placehold.co/600x300)

## The Current Reality

My PRs are excellent now. I understand every line. I can answer every question. The tests prove it works.

But my PRs still take longer to review. The bottleneck is no longer technical; it is social. This is the hidden cost of producing "AI slop" early in your career. It's not just bad code that gets thrown away—it's broken trust that takes months to rebuild.

Despite this, I am positive. Each good PR adds a little trust back. The gap is getting smaller. Some colleagues have even started asking me to teach them my AI workflows.

For anyone reading this: don't let AI make you lazy. Use it to be faster, but never submit code you cannot confidently explain on a whiteboard. Trust rebuilds one good PR at a time. It is slow, but it is worth it.

---

_Zoltan Erdos is a developer based in Brighton, UK, building spike.land. He writes about the human side of AI-assisted development._