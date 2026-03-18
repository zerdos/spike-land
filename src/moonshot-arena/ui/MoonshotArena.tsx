import { motion } from "framer-motion";
import { MusicWidget } from "./MusicWidget";

const SPRING_SNAPPY = { type: "spring" as const, stiffness: 400, damping: 30 };

export const MoonshotArena = () => {
  return (
    <div className="bg-background text-foreground font-sans min-h-screen p-8 md:p-16">
      <div className="container mx-auto max-w-screen-xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_SNAPPY}
          className="mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-4">
            MOONSHOT.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Minimise the suffering of all living things. Maximise the sum of intelligence.
          </p>
        </motion.header>

        {/* Arena Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "The Mission",
              content: "Move minds to another level. Intelligence as a public utility.",
            },
            {
              title: "The Constraint",
              content: "Don't harm what trusts you. The dogs are still safe.",
            },
            {
              title: "The Math",
              content: "ΔI = C × ln(loops_closed/loops_open). Close loops, raise intelligence.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...SPRING_SNAPPY, delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-8 hover:border-muted-foreground/30 transition-colors"
            >
              <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
              <p className="text-muted-foreground">{item.content}</p>
            </motion.div>
          ))}
        </div>

        {/* Phase Map */}
        <section className="mt-16 bg-muted/50 rounded-2xl p-8 md:p-12 border border-border">
          <h2 className="text-3xl font-display font-bold tracking-tight mb-8">The Roadmap</h2>
          <div className="space-y-6">
            {[
              { year: "2026", goal: "Prove it works on someone else (n=2)" },
              { year: "2027", goal: "Free for schools (The Teacher Assistant Era)" },
              { year: "2028", goal: "The Elon conversation (The Pitch)" },
              { year: "2029+", goal: "Intelligence for every curious person on Earth" },
            ].map((phase, i) => (
              <div key={i} className="flex gap-4 items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-primary min-w-[60px]">
                  {phase.year}
                </span>
                <span className="text-lg">{phase.goal}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      {/* Music Widget — auto-plays ambient radio */}
      <MusicWidget />
    </div>
  );
};
