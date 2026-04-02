import { motion } from "framer-motion";

const phases = [
  {
    name: "Tervezés",
    percentage: 30,
    color: "bg-blue-500",
    desc: "A probléma megértése, tervezési interjú, a megértés ellenőrzése.",
  },
  {
    name: "Tesztelés",
    percentage: 50,
    color: "bg-emerald-500",
    desc: "Tesztek írása, ágens-alapú tesztek futtatása, minden működésének ellenőrzése.",
  },
  {
    name: "Minőség",
    percentage: 20,
    color: "bg-purple-500",
    desc: "Határesetek, karbantarthatóság, csiszolás.",
  },
  {
    name: "Kódolás",
    percentage: 0,
    color: "bg-zinc-800 dark:bg-zinc-300",
    desc: "Az AI írja a kódot; te gondoskodsz arról, hogy a kód helyes legyen.",
  },
];

export function EffortSplit() {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Balra tolás</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Hová megy valójában az időd
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Hagyd abba a gépelést. Kezdj el gondolkodni. A BAZDMEG módszer gyökeresen átrendezi a
            mérnöki erőfeszítést a szintaxis írásától a rendszertervezés és a helyesség bizonyítása
            felé.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <div className="flex flex-col gap-y-10 rounded-2xl border bg-card p-8 shadow-sm sm:p-10">
            {/* The Bar */}
            <div className="h-16 w-full overflow-hidden rounded-full flex shadow-inner">
              {phases.map((phase) => (
                <motion.div
                  key={phase.name}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${phase.percentage}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`flex items-center justify-center text-xs font-bold text-white shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)] ${phase.color}`}
                  style={{ minWidth: phase.percentage === 0 ? "4px" : "0" }}
                  title={`${phase.name}: ${phase.percentage}%`}
                >
                  {phase.percentage > 10 && `${phase.percentage}%`}
                </motion.div>
              ))}
            </div>

            {/* The Legend */}
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-6 lg:max-w-none lg:grid-cols-2 lg:gap-y-10">
              {phases.map((phase) => (
                <motion.div
                  key={phase.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="relative pl-12"
                >
                  <dt className="text-base font-semibold leading-7">
                    <div
                      className={`absolute left-0 top-1 h-8 w-8 rounded-full ${phase.color} flex items-center justify-center text-xs font-bold text-white shadow-sm ring-1 ring-inset ring-black/10`}
                    >
                      {phase.percentage}%
                    </div>
                    {phase.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-muted-foreground">{phase.desc}</dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
