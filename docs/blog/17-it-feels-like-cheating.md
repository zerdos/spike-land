# It Feels Like Cheating (Because It Is)

![A futuristic glowing hourglass symbolizing time and automation in software development](https://placehold.co/800x400)

_By Zoltan Erdos | Brighton, UK | February 2026_

_How I deleted my E2E tests, rebuilt my API in two days, and stopped pretending code is precious. A guide for the next generation of developers._

## The Confession

Every morning I sit down with my coffee, open Claude Code, describe a feature, and twenty minutes later it ships. Tests pass. CI (Continuous Integration) is green. 

Then I close the laptop and think: _I cheated._

For months I downplayed it. "Oh, this feature was simple," I'd say. But it wasn't. It had complex authentication flows, database migrations, edge cases, and a full test suite. Yet, because I didn't suffer while building it, my brain couldn't accept it as "real" work. 

This feeling has a name. It is a paradigm shift arriving before our culture is ready for it. When something feels too easy, you haven't cheated—you've simply eliminated a category of work that used to be hard. The guilt is just your old developer identity protesting. Your brain compares your output against the suffering it expects, and the numbers don't match.

For junior developers reading this: you don't have to suffer to build great software. Here is what I did in two days that made this realization permanent.

## The Two-Day Delete

I looked at my E2E (End-to-End) test suite. If you haven't worked with these much, E2E tests usually spin up a real browser and click around your app to make sure it works. I had dozens of Playwright tests. They took four minutes to run and failed randomly on Tuesdays for no reason anyone could explain.

![A visualization showing bulky, slow E2E tests being replaced by fast, focused MCP tool tests](https://placehold.co/600x300)

One test was sixty lines long. Fifty-five of those lines just tested the browser's ability to click buttons and find elements. Only five lines actually tested my business logic (the rules that make the app valuable). I had been testing the frame instead of the painting.

I asked myself: _what if I just tested those five lines?_

I moved every piece of business logic into **MCP (Model Context Protocol) tools**. Think of MCP tools as small, focused functions that AI agents can understand and execute. I gave them typed schemas (rules for what data they accept), clear handlers, and structured responses. Input validated. Output typed. Contract enforced.

Then, I deleted the E2E tests. All of them.

I replaced them with MCP tool tests that run in milliseconds. There is no browser. No DOM (Document Object Model) to render. No network delays. No CSS classes to break.

Here is the key insight: the exact same MCP handler that my React components call in production is the exact same handler my tests validate. Not a fake mock. One source of truth. Two consumers. 

When I realized what I had been doing wrong all those years, I said a word in Hungarian that I won't translate here.

## MCP Tools Are Just Apps

If you have ever used a terminal or CLI (Command Line Interface), you already understand MCP.

MCP servers are basically apps, and the tools on those servers are the commands. You call them with specific input, and you get structured output. That’s it. No heavy framework overhead. Just functions with clear contracts.

Spike turns any MCP server into a CLI app. Just like npm is the biggest open app registry in the world, you can turn your business logic into MCP tools and add them to the registry. Then, they work everywhere: your production API calls them, your test suite validates them, and your AI agent uses them during development.

Three consumers. One interface. Zero mocks.

This is why AI agents go three to five times faster on this codebase. The agent isn't writing code blindly and hoping the CI server catches mistakes twenty minutes later. It has surgical instruments. It can test its own work in real-time, verify a business rule before writing the UI component that calls it, and validate an auth flow before building the page that depends on it.

## The Hourglass

We used to talk about the "Testing Pyramid"—lots of small unit tests at the bottom, fewer integration tests in the middle, and a few E2E tests at the top. But that shape is wrong for the AI era.

The right shape is an hourglass. Heavy on both ends, thin in the middle.

![An hourglass diagram with E2E specs at the top, disposable UI code in the middle, and MCP tool tests at the bottom](https://placehold.co/600x300)

**Top: E2E specs.** Humans write these. _"Given the user is logged in, when they click checkout, then the order is placed."_ These are your requirements in an executable form.

**Bottom: MCP tool tests.** This is your business logic, validation, state transitions, and authorization. They run in milliseconds. They never flake out.

**Middle: UI code.** AI generates this. It is entirely disposable. If a React component breaks, you don't spend hours debugging it. You just ask the AI to regenerate it.

The ideal split? Seventy percent MCP tool tests. Twenty percent E2E specs. Ten percent UI tests. 

The middle is disposable because if you know _why_ the code exists and you can _prove_ it works via tests, the code itself is just a printout. The real value lives in the requirements and the tests.

## The Ten-Second Rule

When your CI pipeline takes thirty minutes to run, bugs compound. By the time you learn about a failure, you've already built three new features on top of broken foundations.

When CI takes ten seconds, you know exactly what you just changed. You fix it immediately and move on.

How do you get under ten seconds? You skip branches entirely and commit directly to the `main` branch. This is called **trunk-based development**. Fifty commits a day at five seconds each is only four minutes of waiting. Compare that to the traditional branching overhead: five minutes of ceremony per change equals four hours of wasted time a day. The choice is obvious.

MCP tool tests make ten-second CI possible because there are no browsers to spin up and no network calls. Functions go in, validation comes out. 

The hourglass makes the speed possible. The speed makes trunk-based development possible. Trunk-based development makes rapid iteration possible.

Put them all together, and you get something that feels like cheating.

## Why It Feels Like Cheating

You might be thinking: _"Wait, you mean I don't write the code anymore?"_

Yes. That is exactly what I mean.

You are not missing out on anything. You are gaining back all the time you spent on work that was never the real point. Memory management was never the point. Writing boilerplate SQL was never the point. Managing deployments was never the point.

Code was never the point.

[Requirements are the product.](/blog/11-requirement-is-the-product) Code is just the current rendering. A printout. If you can regenerate it in twenty minutes from clear requirements and proven tests, what exactly were you protecting?

You were protecting your identity. The idea that your value comes from the syntax you type. That the artifact itself is the art.

It is not. The art is knowing what to build. The art is understanding a problem so deeply that you can describe it precisely enough for a machine to build it correctly on the first try. That is harder than coding. Much harder.

## The BAZDMEG Method

"Bazdmeg" is a Hungarian expletive. If you know, you know.

I named this methodology after a swear word because the irreverence is the point. If your methodology has a polite, corporate name, you are still treating code like something sacred. It is not sacred. It is disposable.

Here are the seven principles, born from pain and tested in production:

1. **Requirements are the product.**
2. **Discipline before automation.**
3. **Context is architecture.**
4. **Test the lies (the edge cases).**
5. **Orchestrate, do not operate.**
6. **Trust is earned in PRs (Pull Requests).**
7. **Own what you ship.**

## The Uncomfortable Question

If I can delete my codebase and rebuild it in twenty minutes, what was I protecting all those years?

Not the code. It's disposable.
Not the tests. They are stronger than ever, running in milliseconds instead of minutes.
Not the requirements. They are documented, clear, and executable.

I was protecting my ego.

What makes you valuable as a developer isn't your ability to write loops or center a div. It's your ability to understand problems, describe solutions precisely, and build systems where AI does the heavy lifting while you do the thinking.

The code? Regenerate it. Delete it. Print it again. It doesn't care. It has no memory of how hard it was to write. It just runs, or it doesn't.

Let go of that ego, and it stops feeling like cheating.

It starts feeling like clarity. And clarity, it turns out, is the most productive state I have ever worked in.

---

_Zoltan Erdos is a developer based in Brighton, UK, building [spike.land](https://spike.land). He named his methodology after a Hungarian expletive because he believes in honesty._