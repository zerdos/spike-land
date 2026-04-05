import { motion } from "framer-motion";
import { MusicWidget } from "./MusicWidget";

const EASE_UP = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const SPRING = { type: "spring" as const, stiffness: 320, damping: 28 };

const PILLARS = [
  {
    number: "01",
    title: "The Mission",
    body: "Move minds to another level. Intelligence as a public utility — available to every curious person on Earth.",
  },
  {
    number: "02",
    title: "The Constraint",
    body: "Don't harm what trusts you. The dogs are still safe. Every loop we close must leave the world measurably better.",
  },
  {
    number: "03",
    title: "The Math",
    body: "ΔI = C × ln(loops_closed / loops_open). Close feedback loops, raise collective intelligence.",
  },
] as const;

const ROADMAP = [
  { year: "2026", goal: "Prove it works on someone else (n = 2)" },
  { year: "2027", goal: "Free for schools — The Teacher Assistant Era" },
  { year: "2028", goal: "The Elon conversation — The Pitch" },
  { year: "2029+", goal: "Intelligence for every curious person on Earth" },
] as const;

export const MoonshotArena = () => {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Subtle radial glow behind the hero */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-28 lg:px-8">
        {/* ── Hero ── */}
        <motion.header
          {...EASE_UP}
          animate={EASE_UP.animate}
          transition={{ ...SPRING, delay: 0 }}
          className="mb-24"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            spike.land / moonshot
          </p>
          <h1 className="text-[clamp(3.5rem,10vw,7rem)] font-black leading-[0.9] tracking-tighter text-foreground">
            MOONSHOT.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Minimise the suffering of all living things.
            <br />
            Maximise the sum of intelligence.
          </p>
        </motion.header>

        {/* ── Three pillars ── */}
        <section className="mb-24">
          <motion.p
            {...EASE_UP}
            animate={EASE_UP.animate}
            transition={{ ...SPRING, delay: 0.08 }}
            className="mb-8 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
          >
            Principles
          </motion.p>
          <div className="grid gap-px rounded-2xl border border-border bg-border sm:grid-cols-3">
            {PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.number}
                {...EASE_UP}
                animate={EASE_UP.animate}
                transition={{ ...SPRING, delay: 0.1 + i * 0.07 }}
                className="group flex flex-col gap-4 bg-card p-7 transition-colors hover:bg-muted/40 first:rounded-t-2xl last:rounded-b-2xl sm:first:rounded-l-2xl sm:first:rounded-tr-none sm:last:rounded-r-2xl sm:last:rounded-bl-none"
              >
                <span className="font-mono text-xs font-bold text-muted-foreground/50">
                  {pillar.number}
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {pillar.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Roadmap ── */}
        <motion.section
          {...EASE_UP}
          animate={EASE_UP.animate}
          transition={{ ...SPRING, delay: 0.28 }}
          className="mb-24"
        >
          <p className="mb-8 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Roadmap
          </p>
          <div className="space-y-0 divide-y divide-border rounded-2xl border border-border overflow-hidden">
            {ROADMAP.map((phase, i) => (
              <motion.div
                key={phase.year}
                {...EASE_UP}
                animate={EASE_UP.animate}
                transition={{ ...SPRING, delay: 0.32 + i * 0.06 }}
                className="flex items-baseline gap-6 bg-card px-7 py-5 transition-colors hover:bg-muted/40"
              >
                <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-primary">
                  {phase.year}
                </span>
                <span className="text-sm text-foreground">{phase.goal}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Closing statement ── */}
        <motion.footer
          {...EASE_UP}
          animate={EASE_UP.animate}
          transition={{ ...SPRING, delay: 0.52 }}
          className="border-t border-border pt-10"
        >
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            Every feature ships only if it measurably closes a feedback loop between a curious
            person and their own growing understanding. That is the only metric that matters.
          </p>
        </motion.footer>
      </div>

      {/* Music widget — ambient synth generated in the browser */}
      <MusicWidget />
    </div>
  );
};
