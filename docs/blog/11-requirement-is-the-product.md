# The Requirement Is the Product

![A glowing, perfectly structured product requirements document (PRD) transforming directly into a finished, polished software application.](https://placehold.co/800x400)

_By Zoltan Erdos | Brighton, UK | January 2026_

Last week, I wrote the perfect ticket. Three concise paragraphs, clear acceptance criteria, a diagram of the expected flow, and examples of edge cases.

I handed it to an AI agent, and twenty minutes later, the feature was built. No bugs. No confusion.

That's when I realized a fundamental truth of modern software development: **I didn't build that feature. The ticket built the feature.** The requirement was the product.

## The Old World vs. The New Reality

In the past, someone would write vague requirements. Developers would then spend days figuring out what those requirements actually meant—guessing, making assumptions, and translating fuzzy ideas into working code. The heavy lifting happened *after* the ticket was written.

Today, code is almost instant.

With tools like Claude, I can describe a complex feature—database queries, API endpoints, frontend components—and watch it appear.

But there is a catch: **it only works if the description is perfect.**

When requirements are vague, AI makes assumptions. Sometimes they are good assumptions; often, they are terrible ones. The bottleneck in software development is no longer writing the code. It is writing the requirements.

## The Most Valuable Skill

I used to spend 20% of my time on requirements and 80% on coding. Now, those numbers are reversed.

If an AI coding agent makes a mistake, I don't blame the AI. I realize my requirement was not specified well enough. This mindset shift puts the responsibility back on me.

Writing requirements for an AI is entirely different from writing them for a human teammate. Humans fill in gaps with intuition. AI takes your words literally. Every assumption you fail to state is an assumption the AI will invent for you.

## What Good Requirements Look Like

![A side-by-side comparison of a vague requirement ('Add a login button') leading to a messy result, versus a detailed, explicit requirement leading to a perfect UI component.](https://placehold.co/600x300)

Here is how you write requirements that produce flawless code:

**1. Explicit Context**
Never assume the AI knows your codebase. What system is this for? What constraints apply? What existing components should it use?

**2. Clear Success Criteria**
"It should work" is not a requirement. Be specific. What exact tests should pass? What exact UI states should the user see?

**3. Concrete Examples**
Show the exact input and expected output. Detail the edge cases. Examples remove ambiguity.

**4. Strict Boundaries**
What should this feature *not* do? AI loves to be helpful and will often add scope you didn't ask for if you don't tell it to stop.

### The Difference in Practice

**Bad Requirement:**
> "Add a login button."
*(Result: The AI adds a button somewhere, with random styling, doing something unexpected based on its own assumptions.)*

**Good Requirement:**
> "Add a login button to the navigation bar.
>
> *   **Location:** Top right corner, next to the user avatar.
> *   **Style:** Use the existing 'primary' button variant from our design system.
> *   **Behavior:** On click, open the `LoginModal` component.
> *   **Text:** 'Sign In'
> *   **Visibility:** Only show when the user is not logged in.
>
> **Tests:**
> 1. When logged out, clicking the button should open the login modal.
> 2. When logged in, the button should not be rendered in the DOM."

The second requirement takes longer to write. But it builds the exact right thing on the first try. No wasted time. The requirement *is* the work.

## The Future of the Developer

If writing requirements is the main bottleneck, maybe the role of the developer is evolving into something entirely new. Maybe we become "Requirement Writers" or "Product Translators."

Whatever we call it, the skill of specifying exactly what should happen, in a way an AI can execute perfectly, is the most valuable skill you can learn today.

The developers who figure this out will ship faster and build more than ever before. Their AI will become an extension of their thinking.

The developers who treat requirements as a chore to rush through before the "real work" begins will struggle. They will blame the AI for mistakes that were born in bad tickets.

The code is just the output. The requirement is the product.

Write it like you mean it.

---

_Zoltan Erdos is a developer based in Brighton, UK, building spike.land. He now spends more time writing tickets than writing code._
