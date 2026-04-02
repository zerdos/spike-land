import { motion } from "framer-motion";

const principles = [
  {
    id: 1,
    title: "A követelmények a termék",
    subtitle: "A kód csak a kimenet",
    desc: "Határozd meg pontosan, mit akarsz, mielőtt egyetlen sor kódot írsz. Ha az AI nem tudja, mit épít, olyat fog építeni, amire nincs szükséged.",
    icon: "📝",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
  },
  {
    id: 2,
    title: "Fegyelem az automatizálás előtt",
    subtitle: "Nem lehet automatizálni a káoszt",
    desc: "Ha a CI 20 percet vesz igénybe és a tesztek fele megbízhatatlan, az AI ágensek csak abban segítenek, hogy gyorsabban generálj hibákat. Először javítsd meg a pipeline-t.",
    icon: "⚙️",
    color: "from-red-500/20 to-orange-500/20",
    border: "border-red-500/30",
  },
  {
    id: 3,
    title: "A kontextus az architektúra",
    subtitle: "Amit a modell tud, amikor kérdezel",
    desc: "Gondosan válaszd meg a kontextusablakot. Küldd el a megfelelő fájlokat, a megfelelő dokumentációt és a megfelelő korlátokat. A jó kontextus felülmúlja a nagy modellt.",
    icon: "🧠",
    color: "from-purple-500/20 to-fuchsia-500/20",
    border: "border-purple-500/30",
  },
  {
    id: 4,
    title: "Teszteld a hazugságokat",
    subtitle: "Unit tesztek, E2E tesztek, ágens tesztek",
    desc: "Az LLM-ek hihetetlenül meggyőző hazugok. Ne bízz semmiben, amit generálnak, amíg azt egy CI-ban futó automatizált teszt nem ellenőrizte.",
    icon: "🧪",
    color: "from-green-500/20 to-emerald-500/20",
    border: "border-green-500/30",
  },
  {
    id: 5,
    title: "Irányíts, ne operálj",
    subtitle: "Ágenseket koordinálj, ne billentyűket",
    desc: "Hagyd abba a kódírást. Kezdj promptokat írni, terveket reviewzni és specializált ágenseket összerakni, hogy elvégezzék helyetted a nehéz munkát.",
    icon: "🎼",
    color: "from-indigo-500/20 to-blue-500/20",
    border: "border-indigo-500/30",
  },
  {
    id: 6,
    title: "A bizalmat PR-okban kell kiérdemelni",
    subtitle: "Nem ígéretekben, nem demókban",
    desc: "Az AI által generált kódot pontosan úgy kezeld, mint egy új gyakornok kódját. Reviewzd szigorúan. Vesd alá ugyanazoknak a minőségi kapuknak.",
    icon: "🤝",
    color: "from-yellow-500/20 to-amber-500/20",
    border: "border-yellow-500/30",
  },
  {
    id: 7,
    title: "Vállald, amit szállítasz",
    subtitle: "Ha hajnali 3-kor nem tudod elmagyarázni, ne szállítsd",
    desc: "Felelős vagy minden egyes sor kódért, amit az ágenseid élesbe tolnak. Értsd meg alaposan, mielőtt mergelod.",
    icon: "👑",
    color: "from-rose-500/20 to-pink-500/20",
    border: "border-rose-500/30",
  },
  {
    id: 8,
    title: "A forrásoknak rangjuk van",
    subtitle: "Kanonikus spec > audit > chat",
    desc: "Konfliktusok feloldásakor a kanonikus specifikáció mindig nyer. Soha ne hagyd, hogy egy chat-munkamenet felülírja az alapvető architektúradokumentumaidat.",
    icon: "📚",
    color: "from-teal-500/20 to-emerald-500/20",
    border: "border-teal-500/30",
  },
];

export function PrinciplesList() {
  return (
    <section id="principles" className="py-24 bg-background/50">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-4">A 8 alapelv</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ezek az irányelvek határozzák meg, hogyan kommunikálunk az LLM-ekkel, biztosítva a magas
            minőségű kimenetet és a karbantartható kódbázisokat.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`relative flex flex-col rounded-2xl border ${p.border} bg-gradient-to-br ${p.color} p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md`}
            >
              <div className="mb-4 text-4xl">{p.icon}</div>
              <div className="mb-2 text-sm font-bold text-primary opacity-80">{p.id}. alapelv</div>
              <h3 className="mb-1 text-xl font-bold leading-tight">{p.title}</h3>
              <div className="mb-3 text-sm font-medium italic opacity-70">{p.subtitle}</div>
              <p className="mt-auto text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
