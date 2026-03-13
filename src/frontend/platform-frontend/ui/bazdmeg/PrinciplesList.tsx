import { useState } from "react";

interface Principle {
  number: number;
  name: string;
  oneLiner: string;
  details: string[];
}

const PRINCIPLES: Principle[] = [
  {
    number: 1,
    name: "Requirements Are The Product",
    oneLiner: "The code is just the output",
    details: [
      "The AI writes code. You define what correct means.",
      "If you cannot articulate the requirement, the AI will guess — and it will guess wrong.",
      "Spend 30% of your time here. Not writing code. Writing requirements.",
    ],
  },
  {
    number: 2,
    name: "Discipline Before Automation",
    oneLiner: "You cannot automate chaos",
    details: [
      "CI under 10 minutes. Zero flaky tests. TypeScript strict mode. CLAUDE.md current.",
      "If your automation pipeline is broken, AI agents will amplify the chaos.",
      "Six gates must pass before agents touch your codebase.",
    ],
  },
  {
    number: 3,
    name: "Context Is Architecture",
    oneLiner: "What the model knows when you ask",
    details: [
      "The quality of AI output is bounded by the quality of its context window.",
      "CLAUDE.md, project docs, and test files are context engineering.",
      "If the model hallucinates, the context was wrong — not the model.",
    ],
  },
  {
    number: 4,
    name: "Test The Lies",
    oneLiner: "Unit tests, E2E tests, agent-based tests",
    details: [
      "AI-generated code lies fluently. Tests are the only reliable signal.",
      "70% MCP tool tests, 20% E2E specs, 10% UI component tests.",
      "Bugs that appear twice get a mandatory Bugbook entry with a regression test.",
    ],
  },
  {
    number: 5,
    name: "Orchestrate, Do Not Operate",
    oneLiner: "Coordinate agents, not keystrokes",
    details: [
      "Your job is not to type code. It is to direct agents who type code.",
      "Each agent gets a clear scope, a verification step, and a rollback plan.",
      "If you are editing files by hand, something in the pipeline is broken.",
    ],
  },
  {
    number: 6,
    name: "Trust Is Earned In PRs",
    oneLiner: "Not in promises, not in demos",
    details: [
      "A PR with green CI is the minimum unit of trust.",
      "Demo-driven development is theatre. Diff-driven development is engineering.",
      "Every decision in the diff must have a 'why' you can articulate.",
    ],
  },
  {
    number: 7,
    name: "Own What You Ship",
    oneLiner: "If you cannot explain it at 3am, do not ship it",
    details: [
      "AI wrote the code, but you signed the commit.",
      "When it breaks at 3am, 'the AI did it' is not an acceptable answer.",
      "Read every line. Understand every choice. Own every consequence.",
    ],
  },
  {
    number: 8,
    name: "Sources Have Rank",
    oneLiner: "Canonical spec > audit > chat",
    details: [
      "Not all context is equal. Official docs outrank Stack Overflow outrank chat history.",
      "When sources conflict, the higher-ranked source wins.",
      "The AI must cite its sources, and you must verify them.",
    ],
  },
];

function PrincipleCard({ principle }: { principle: Principle }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="rubik-panel p-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-4 text-left"
        aria-expanded={open}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          {principle.number}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{principle.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{principle.oneLiner}</p>
        </div>
        <svg
          className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="mt-4 ml-14 space-y-2">
          {principle.details.map((detail) => (
            <li
              key={detail}
              className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
            >
              <svg
                className="mt-1 h-3.5 w-3.5 shrink-0 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {detail}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function PrinciplesList() {
  return (
    <section id="principles" aria-labelledby="principles-heading" className="space-y-4">
      <div className="text-center">
        <h2
          id="principles-heading"
          className="text-2xl font-semibold tracking-[-0.04em] text-foreground"
        >
          The Eight Principles
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Click any principle to expand the details.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {PRINCIPLES.map((p) => (
          <PrincipleCard key={p.number} principle={p} />
        ))}
      </div>
    </section>
  );
}
