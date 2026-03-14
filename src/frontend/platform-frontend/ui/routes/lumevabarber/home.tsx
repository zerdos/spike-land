import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Eye,
  Mail,
  Palette,
  Scissors,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useIntersectionOnce, useCounter, BRAND, SECTION_CLASSES } from "./shared";
import { cn } from "../../../styling/cn";

// ── Helpers ───────────────────────────────────────────────────────────

function RevealSection({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const { ref, visible } = useIntersectionOnce(0.12);
  return (
    <div
      ref={ref}
      id={id}
      className={cn(
        "transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-16">
      {eyebrow && (
        <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-4">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{title}</h2>
      {subtitle && <p className="text-neutral-400 text-lg leading-relaxed">{subtitle}</p>}
    </div>
  );
}

// ── Animated Counter ──────────────────────────────────────────────────

function StatCounter({
  end,
  suffix,
  label,
  active,
}: {
  end: number;
  suffix: string;
  label: string;
  active: boolean;
}) {
  const count = useCounter(end, 1800, active);
  return (
    <div className="text-center md:text-left">
      <p className="text-4xl md:text-5xl font-bold text-amber-400">
        {count}
        {suffix}
      </p>
      <p className="text-neutral-400 mt-2 text-sm leading-relaxed">{label}</p>
    </div>
  );
}

// ── Stats Section (extracted for hooks compliance) ────────────────────

function StatsSection() {
  const { ref, visible } = useIntersectionOnce(0.2);
  return (
    <div ref={ref} className="grid md:grid-cols-2 gap-16 items-center">
      <div className="space-y-10">
        <StatCounter
          end={73}
          suffix="%"
          label="of consumers judge a business by its visual identity"
          active={visible}
        />
        <StatCounter
          end={47}
          suffix="$"
          label="average ticket increase for barbershops with cohesive branding"
          active={visible}
        />
        <StatCounter
          end={3}
          suffix="x"
          label="more word-of-mouth referrals with distinctive brands"
          active={visible}
        />
      </div>
      <div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Why Premium Perception Matters
        </h2>
        <p className="text-neutral-400 leading-relaxed mb-4">
          Your brand is not just a logo. It is the psychological framework through which every
          client interaction is filtered. A cohesive, premium brand identity shifts the entire value
          equation in your favor.
        </p>
        <p className="text-neutral-400 leading-relaxed mb-4">
          When clients perceive your shop as premium before they even sit in the chair, they arrive
          expecting to pay more — and leave feeling they got exactly what they paid for.
        </p>
        <p className="text-neutral-400 leading-relaxed">
          That is the power of behavioral branding. It does not just attract clients — it attracts
          the <em className="text-amber-400">right</em> clients.
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export function LumevaHome() {
  const contactRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Strategy Call Request from ${formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`,
    );
    window.location.href = `mailto:${BRAND.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className={cn(SECTION_CLASSES.darker, "min-h-screen")}>
      {/* ── 1. Hero ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="text-amber-400 text-xs md:text-sm font-semibold tracking-widest uppercase mb-6">
            Behavioral Branding Studio
          </p>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Your Barbershop Deserves a Brand That{" "}
            <span className="text-amber-400">Commands Premium Prices</span>
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Most barbershops look interchangeable. Same fonts, same stock imagery, same forgettable
            identity. Lumeva uses behavioral science to build brands that make clients choose you —
            and pay more without hesitation.
          </p>
          <button
            type="button"
            onClick={scrollToContact}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25"
          >
            Book a Free Strategy Call
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ── 2. What is Lumeva ──────────────────────────────────────── */}
      <section id="about" className="py-24 px-6">
        <RevealSection className="max-w-6xl mx-auto">
          <SectionHeading eyebrow="What Sets Us Apart" title="Built Different. On Purpose." />
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: "Not a Template Shop",
                desc: "We build from behavioral research, not Canva templates. Every element has a strategic reason behind it.",
              },
              {
                icon: Scissors,
                title: "Barbershop Specialists",
                desc: "We only work with barbershops. Deep vertical expertise means we understand your clients better than generalist agencies ever could.",
              },
              {
                icon: BrainCircuit,
                title: "Science-Backed Design",
                desc: "Every color, shape, and layout is designed to influence perception and willingness to pay. No guesswork.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={cn(SECTION_CLASSES.card, SECTION_CLASSES.cardHover, "p-8")}
              >
                <item.icon className="w-10 h-10 text-amber-400 mb-5" />
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* ── 3. Why Behavioral Branding ────────────────────────────── */}
      <section className={cn(SECTION_CLASSES.dark, "py-24 px-6")}>
        <RevealSection className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="The Science"
            title="Why Behavioral Branding Works"
            subtitle="Backed by cognitive psychology and decades of consumer research."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BrainCircuit,
                title: "First Impression Bias",
                desc: "Customers form opinions in 50ms. Your brand is your first pitch.",
              },
              {
                icon: Eye,
                title: "Halo Effect",
                desc: "Premium visuals make everything feel premium — cuts, products, ambiance.",
              },
              {
                icon: BarChart3,
                title: "Price Anchoring",
                desc: "The right brand signals let you charge 30-50% more without pushback.",
              },
              {
                icon: Target,
                title: "Recognition Memory",
                desc: "Distinctive logos are recalled 5x faster than generic ones.",
              },
              {
                icon: Users,
                title: "Social Proof Amplifier",
                desc: "A sharp brand makes clients want to share and recommend.",
              },
              {
                icon: TrendingUp,
                title: "Perceived Value",
                desc: "Clients equate visual quality with service quality.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className={cn(SECTION_CLASSES.card, SECTION_CLASSES.cardHover, "p-6")}
              >
                <card.icon className="w-8 h-8 text-amber-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* ── 4. Why Premium Perception Matters ─────────────────────── */}
      <section className="py-24 px-6">
        <RevealSection className="max-w-6xl mx-auto">
          <StatsSection />
        </RevealSection>
      </section>

      {/* ── 5. Service Routing ────────────────────────────────────── */}
      <section className={cn(SECTION_CLASSES.dark, "py-24 px-6")}>
        <RevealSection className="max-w-5xl mx-auto">
          <SectionHeading eyebrow="Our Services" title="What We Build For You" />
          <div className="grid md:grid-cols-2 gap-8">
            <Link
              to="/lumevabarber/logos"
              className={cn(SECTION_CLASSES.card, SECTION_CLASSES.cardHover, "p-10 group block")}
            >
              <Scissors className="w-12 h-12 text-amber-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-2xl font-bold text-white mb-3">Logo Design</h3>
              <p className="text-neutral-400 leading-relaxed mb-6">
                Distinctive, memorable marks built on recognition science. Your logo becomes the
                anchor for every brand touchpoint.
              </p>
              <span className="inline-flex items-center gap-2 text-amber-400 font-semibold group-hover:gap-3 transition-all duration-300">
                Explore Logos <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link
              to="/lumevabarber/websites"
              className={cn(SECTION_CLASSES.card, SECTION_CLASSES.cardHover, "p-10 group block")}
            >
              <Palette className="w-12 h-12 text-amber-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-2xl font-bold text-white mb-3">Website Design</h3>
              <p className="text-neutral-400 leading-relaxed mb-6">
                Conversion-focused websites that turn visitors into booked appointments. Every
                scroll designed to build trust and urgency.
              </p>
              <span className="inline-flex items-center gap-2 text-amber-400 font-semibold group-hover:gap-3 transition-all duration-300">
                Explore Websites <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </RevealSection>
      </section>

      {/* ── 6. Methodology ────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <RevealSection className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="How We Work"
            title="Our Process"
            subtitle="Three phases. Zero fluff. Every decision backed by data and psychology."
          />
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                title: "Research",
                desc: "We study your market, competitors, and ideal client psychology. We map the perceptual landscape so your brand occupies the highest-value position.",
              },
              {
                num: "02",
                title: "Design",
                desc: "Craft visuals rooted in behavioral science principles — color psychology, gestalt grouping, typographic hierarchy, and spatial tension.",
              },
              {
                num: "03",
                title: "Refine",
                desc: "Test, iterate, and perfect until every element earns its place. Nothing ships until it passes our behavioral audit checklist.",
              },
            ].map((phase) => (
              <div
                key={phase.num}
                className={cn(SECTION_CLASSES.card, "p-8 relative overflow-hidden")}
              >
                <span className="absolute -top-4 -right-2 text-8xl font-black text-amber-500/10 select-none">
                  {phase.num}
                </span>
                <p className="text-amber-400 font-mono text-sm font-semibold mb-3">{phase.num}</p>
                <h3 className="text-xl font-bold text-white mb-3">{phase.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{phase.desc}</p>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* ── 7. Contact / CTA ──────────────────────────────────────── */}
      <section id="contact" ref={contactRef} className={cn(SECTION_CLASSES.dark, "py-24 px-6")}>
        <RevealSection className="max-w-4xl mx-auto">
          <SectionHeading
            eyebrow="Let's Talk"
            title="Ready to Transform Your Brand?"
            subtitle="Book a free 30-minute strategy call. We'll analyze your current brand and show you what's possible."
          />

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact info */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <Mail className="w-5 h-5 text-amber-400 mt-1 shrink-0" />
                <div>
                  <p className="text-white font-semibold mb-1">Email</p>
                  <a
                    href={`mailto:${BRAND.email}`}
                    className="text-neutral-400 hover:text-amber-400 transition-colors"
                  >
                    {BRAND.email}
                  </a>
                </div>
              </div>

              <div className={cn(SECTION_CLASSES.card, "p-6")}>
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  <p className="text-white font-semibold">What you get on the call</p>
                </div>
                <ul className="space-y-2 text-neutral-400 text-sm">
                  <li>Brand perception audit of your current identity</li>
                  <li>Competitor analysis snapshot</li>
                  <li>Three actionable improvements you can make today</li>
                  <li>Custom proposal if we are a good fit</li>
                </ul>
              </div>

              <a
                href={`mailto:${BRAND.email}?subject=${encodeURIComponent("Strategy Call Request")}`}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25"
              >
                <Mail className="w-5 h-5" />
                Send Us an Email
              </a>
            </div>

            {/* Simple form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="contact-name" className="block text-sm text-neutral-400 mb-2">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm text-neutral-400 mb-2">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm text-neutral-400 mb-2">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                  placeholder="Tell us about your barbershop..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25"
              >
                Send Message
              </button>
            </form>
          </div>
        </RevealSection>
      </section>
    </div>
  );
}
