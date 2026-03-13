interface EffortBar {
  label: string;
  percent: number;
  description: string;
  color: string;
}

const EFFORT_BARS: EffortBar[] = [
  {
    label: "Testing",
    percent: 50,
    description: "Writing tests, running agent-based tests, verifying everything works",
    color: "bg-primary",
  },
  {
    label: "Planning",
    percent: 30,
    description: "Understanding the problem, planning interview, verifying understanding",
    color: "bg-chart-2",
  },
  {
    label: "Quality",
    percent: 20,
    description: "Edge cases, maintainability, polish",
    color: "bg-chart-3",
  },
];

interface ChecklistItem {
  phase: string;
  items: string[];
}

const CHECKLISTS: ChecklistItem[] = [
  {
    phase: "Pre-Code (Checkpoint 1)",
    items: [
      "Can I explain the problem in my own words?",
      "Has the AI interviewed me about the requirements?",
      "Do I understand why the current code exists?",
      "Are my tests green and non-flaky?",
    ],
  },
  {
    phase: "Post-Code (Checkpoint 2)",
    items: [
      "Can I explain every line to a teammate?",
      "Have I verified the AI's assumptions against the architecture?",
      "Do MCP tool tests cover the business logic at 100%?",
    ],
  },
  {
    phase: "Pre-PR (Checkpoint 3)",
    items: [
      "Does TypeScript pass with no errors in strict mode?",
      "Can I answer 'why' for every decision in the diff?",
      "Would I be comfortable debugging this at 3am?",
    ],
  },
];

interface AuditGate {
  gate: string;
  requirement: string;
  status: string;
}

const AUDIT_GATES: AuditGate[] = [
  { gate: "CI Speed", requirement: "Under 10 min", status: "~3 min" },
  { gate: "Flaky Tests", requirement: "Zero", status: "Zero known" },
  { gate: "Coverage", requirement: "100% business logic", status: "80% lines, 96% MCP" },
  { gate: "TypeScript", requirement: "Strict mode", status: "Zero any, zero eslint-disable" },
  { gate: "CLAUDE.md", requirement: "Current and complete", status: "Updated regularly" },
  { gate: "Domain Gates", requirement: "Executable quality gates", status: "Project-specific" },
];

export function EffortSplit() {
  return (
    <div className="space-y-12">
      {/* Effort distribution */}
      <section aria-labelledby="effort-heading">
        <div className="text-center">
          <h2
            id="effort-heading"
            className="text-2xl font-semibold tracking-[-0.04em] text-foreground"
          >
            Where Time Actually Goes
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            AI writes the code. You make sure the code is right. Coding itself is ~0% of the effort.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {EFFORT_BARS.map((bar) => (
            <div key={bar.label} className="rubik-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground">{bar.label}</span>
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {bar.percent}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted">
                <div
                  className={`h-2.5 rounded-full ${bar.color} transition-all duration-500`}
                  style={{ width: `${bar.percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{bar.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testing model */}
      <section aria-labelledby="testing-heading">
        <div className="text-center">
          <h2
            id="testing-heading"
            className="text-2xl font-semibold tracking-[-0.04em] text-foreground"
          >
            Hourglass Testing Model
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Heavy at the bottom (business logic), thin in the middle (UI), heavy at the top (E2E).
          </p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            {
              share: "70%",
              layer: "MCP Tool Tests",
              desc: "Business logic, validation, contracts, state transitions",
            },
            {
              share: "20%",
              layer: "E2E Specs",
              desc: "Full user flows — Given/When/Then, wiring verification",
            },
            {
              share: "10%",
              layer: "UI Component Tests",
              desc: "Accessibility, responsive layout, keyboard navigation",
            },
          ].map((item) => (
            <div key={item.layer} className="rubik-panel p-5 text-center">
              <p className="text-3xl font-semibold tracking-[-0.05em] text-foreground">
                {item.share}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">{item.layer}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Checklists */}
      <section aria-labelledby="checkpoints-heading">
        <div className="text-center">
          <h2
            id="checkpoints-heading"
            className="text-2xl font-semibold tracking-[-0.04em] text-foreground"
          >
            The Three Checkpoints
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If any box is unchecked, stop. Go back. Understand more.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {CHECKLISTS.map((checklist) => (
            <div key={checklist.phase} className="rubik-panel p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">{checklist.phase}</h3>
              <ul className="space-y-2">
                {checklist.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
                  >
                    <span
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border border-border bg-background"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Automation audit gates */}
      <section aria-labelledby="audit-heading">
        <div className="text-center">
          <h2
            id="audit-heading"
            className="text-2xl font-semibold tracking-[-0.04em] text-foreground"
          >
            Automation-Ready Audit
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Six gates that must pass before AI agents touch your codebase.
          </p>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-left font-semibold text-foreground">Gate</th>
                <th className="py-3 px-4 text-left font-semibold text-foreground">Requirement</th>
                <th className="py-3 px-4 text-left font-semibold text-foreground">Current</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_GATES.map((gate) => (
                <tr key={gate.gate} className="border-b border-border/50">
                  <td className="py-3 px-4 font-medium text-foreground">{gate.gate}</td>
                  <td className="py-3 px-4 text-muted-foreground">{gate.requirement}</td>
                  <td className="py-3 px-4">
                    <span className="rubik-chip rubik-chip-accent">{gate.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
