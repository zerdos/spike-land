import { useEffect, useRef, useState } from "react";
import {
  BrainCircuit,
  Code2,
  Image,
  BarChart3,
  Trophy,
  Globe,
  GitBranch,
  MessageSquare,
  ShieldCheck,
  Database,
  Wrench,
  Sparkles,
  ArrowRight,
  Zap,
  Layers,
  Server,
} from "lucide-react";
import { useDarkMode } from "../hooks/useDarkMode";
import { cn } from "../../styling/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Domain {
  id: string;
  icon: React.ElementType;
  name: string;
  toolCount: number;
  description: string;
  detail: string;
}

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  icon: React.ElementType;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

// Preserved for future domain catalog section — prefixed to satisfy no-unused-vars
const _DOMAINS: Domain[] = [
  {
    id: "code-intelligence",
    icon: Code2,
    name: "Code Intelligence",
    toolCount: 12,
    description: "Contract tests, review, transpilation",
    detail:
      "AI-powered code review, static analysis, contract-adjacent testing helpers, and esbuild-wasm transpilation at the edge.",
  },
  {
    id: "image-studio",
    icon: Image,
    name: "Image Studio",
    toolCount: 8,
    description: "AI generation, enhancement, albums",
    detail:
      "Generate, enhance, and organize images using AI pipelines. Batch processing, album management, and style transfer.",
  },
  {
    id: "data-analytics",
    icon: BarChart3,
    name: "Data & Analytics",
    toolCount: 7,
    description: "GA4, Stripe analytics, insights",
    detail:
      "Connect to Google Analytics 4, Stripe revenue dashboards, churn analysis, MRR tracking, and custom report generation.",
  },
  {
    id: "chess-engine",
    icon: Trophy,
    name: "Chess Engine",
    toolCount: 6,
    description: "ELO, challenges, game management",
    detail:
      "Full ELO rating system, player tracking, challenge management, game history, and tournament bracket tools.",
  },
  {
    id: "browser-automation",
    icon: Globe,
    name: "Browser Automation",
    toolCount: 5,
    description: "QA Studio, smoke tests, evidence capture",
    detail:
      "Keep browser coverage where it is useful, but move critical state transitions below the UI. QA Studio handles smoke checks, screenshots, and operator evidence.",
  },
  {
    id: "state-machines",
    icon: GitBranch,
    name: "State Machines",
    toolCount: 4,
    description: "Statecharts, guards, visualization",
    detail:
      "Design and run statecharts with guard-condition parsing, transition visualization, and serializable machine export.",
  },
  {
    id: "communication",
    icon: MessageSquare,
    name: "Communication",
    toolCount: 6,
    description: "HackerNews, messaging, notifications",
    detail:
      "Read and post HackerNews threads, send notifications, manage real-time messaging channels, and webhook dispatch.",
  },
  {
    id: "authentication",
    icon: ShieldCheck,
    name: "Authentication",
    toolCount: 8,
    description: "OAuth, sessions, orgs, permission surfaces",
    detail:
      "Better Auth integration for OAuth providers, session management, organization RBAC, API key vaulting, and the permission boundaries that usually make browser tests brittle.",
  },
  {
    id: "storage-cdn",
    icon: Database,
    name: "Storage & CDN",
    toolCount: 5,
    description: "R2, edge caching, assets",
    detail:
      "Cloudflare R2 object storage, edge-cached asset delivery, D1 SQL queries, and KV key-value operations.",
  },
  {
    id: "developer-tools",
    icon: Wrench,
    name: "Developer Tools",
    toolCount: 10,
    description: "CLI, Docker, deployment, CI handoff",
    detail:
      "CLI multiplexer, Docker workflows, deploy automation, dependency graph management, and the handoff points needed to move one workflow from browser-heavy to contract-first verification.",
  },
  {
    id: "ai-llm",
    icon: BrainCircuit,
    name: "AI & LLM",
    toolCount: 6,
    description: "Claude, Gemini, prompt engineering",
    detail:
      "Orchestrate Claude and Gemini models, chain prompts with structured output, manage context windows, and rate-limit safely.",
  },
];

interface FeatureHighlight {
  icon: React.ElementType;
  title: string;
  body: string;
}

const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  {
    icon: Zap,
    title: "Function-Speed Verification",
    body: "Move critical checks out of brittle browser flows and into fast, typed contracts that run in milliseconds.",
  },
  {
    icon: Code2,
    title: "Typed Contracts",
    body: "Strict types and validated inputs create a reusable surface that CI, tooling, the CLI, and agents all call consistently.",
  },
  {
    icon: Layers,
    title: "Managed Runtime",
    body: "Cloudflare supplies the primitives. spike.land adds registry, auth, metering, and a workflow model teams can actually ship.",
  },
  {
    icon: ShieldCheck,
    title: "Auth Built In",
    body: "OAuth, RBAC, and API key vaulting are first-class citizens — not afterthoughts bolted on after the fact.",
  },
  {
    icon: Server,
    title: "Edge-Deployed Globally",
    body: "Every tool runs at the edge. Zero cold starts, sub-50ms response times, no regions to configure.",
  },
  {
    icon: Sparkles,
    title: "80+ Ready-Made Tools",
    body: "From image generation to chess engines, a broad library of composable tools ready to integrate immediately.",
  },
];

const STATS: StatItem[] = [
  { value: 80, suffix: "+", label: "Hosted Tools", icon: Zap },
  { value: 1, suffix: "", label: "Paid Wedge", icon: Layers },
  { value: 100, suffix: "%", label: "Edge-Deployed", icon: Server },
  { value: 0, suffix: "", label: "Forced Rip-And-Replace", icon: Sparkles },
];

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useIntersectionOnce(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, threshold]);

  return { ref, visible };
}

function useCounter(target: number, active: boolean, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (target === 0) {
      setCount(0);
      return;
    }
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);

  return count;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AnimatedStat({ item, active }: { item: StatItem; active: boolean }) {
  const count = useCounter(item.value, active);
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="text-5xl font-black tracking-tight text-foreground tabular-nums sm:text-6xl">
        {count}
        {item.suffix}
      </span>
      <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
    </div>
  );
}

function FeatureCard({
  feature,
  index,
  visible,
}: {
  feature: FeatureHighlight;
  index: number;
  visible: boolean;
}) {
  const Icon = feature.icon;
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-card p-8",
        "transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      )}
      style={{ transitionDelay: visible ? `${index * 80}ms` : "0ms" }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-foreground">{feature.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{feature.body}</p>
    </article>
  );
}

function StepDivider() {
  return (
    <div className="hidden sm:flex items-center justify-center">
      <ArrowRight className="h-6 w-6 text-muted-foreground/40" aria-hidden="true" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function WhatWeDoPage() {
  const { isDarkMode } = useDarkMode();

  const [heroRevealed, setHeroRevealed] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setHeroRevealed(true), 80);
    return () => clearTimeout(id);
  }, []);

  const { ref: statsRef, visible: statsVisible } = useIntersectionOnce(0.3);
  const { ref: featuresRef, visible: featuresVisible } = useIntersectionOnce(0.1);
  const { ref: stepsRef, visible: stepsVisible } = useIntersectionOnce(0.2);
  const { ref: ctaRef, visible: ctaVisible } = useIntersectionOnce(0.2);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
        aria-labelledby="hero-heading"
      >
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            className={cn(
              "absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full blur-3xl",
              isDarkMode ? "bg-primary/12" : "bg-primary/6",
            )}
          />
          <div
            className={cn(
              "absolute -bottom-20 right-0 h-[400px] w-[400px] rounded-full blur-3xl",
              isDarkMode ? "bg-violet-500/8" : "bg-violet-300/10",
            )}
          />
        </div>

        {/* Eyebrow */}
        <div
          className={cn(
            "mb-8 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/80 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur-sm",
            "transition-all duration-600",
            heroRevealed ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3",
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          Open AI App Store
        </div>

        {/* Headline */}
        <h1
          id="hero-heading"
          className={cn(
            "relative max-w-5xl text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl",
            "transition-all duration-700 delay-100",
            heroRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          )}
        >
          <span className="block text-foreground leading-none">We build the</span>
          <span className="block text-primary leading-none">infrastructure</span>
          <span className="block text-foreground leading-none">for AI-powered apps.</span>
        </h1>

        {/* Subtitle */}
        <p
          className={cn(
            "relative mt-8 max-w-2xl text-xl text-muted-foreground leading-relaxed",
            "transition-all duration-700 delay-200",
            heroRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          spike.land is the managed runtime that lets teams discover, compose, and ship AI-callable
          tools at the edge — without rebuilding everything from scratch.
        </p>

        {/* Hero CTAs */}
        <div
          className={cn(
            "relative mt-12 flex flex-col items-center gap-4 sm:flex-row",
            "transition-all duration-700 delay-300",
            heroRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          <a
            href="/apps"
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground",
              "hover:bg-primary/90 active:scale-[0.97] transition-all duration-200",
              isDarkMode ? "shadow-lg shadow-primary/20" : "shadow-lg shadow-primary/10",
            )}
          >
            Explore the app store
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            href="/tools"
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-8 py-4 text-base font-semibold text-foreground backdrop-blur-sm",
              "hover:bg-card hover:border-primary/30 active:scale-[0.97] transition-all duration-200",
            )}
          >
            Browse tools
          </a>
        </div>

        {/* Scroll cue */}
        <div
          className={cn(
            "absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2",
            "transition-opacity duration-700 delay-700",
            heroRevealed ? "opacity-40" : "opacity-0",
          )}
          aria-hidden="true"
        >
          <div className="h-10 w-px bg-gradient-to-b from-muted-foreground/60 to-transparent" />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* STATS BAR                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section
        ref={statsRef}
        aria-label="Platform statistics"
        className={cn(
          "relative mx-6 mb-32 max-w-5xl xl:mx-auto",
          "transition-all duration-700",
          statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        )}
      >
        <div className="rounded-3xl border border-border bg-card">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center justify-center py-12 px-6">
                <AnimatedStat item={stat} active={statsVisible} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FEATURES GRID                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative px-6 pb-32" aria-labelledby="features-heading">
        <div className="mx-auto max-w-6xl">
          <div
            ref={featuresRef}
            className={cn(
              "mb-16 text-center",
              "transition-all duration-700",
              featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
            )}
          >
            <h2
              id="features-heading"
              className="text-4xl font-black tracking-tight text-foreground sm:text-5xl"
            >
              Everything you need. <span className="text-primary">Nothing you don&apos;t.</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              A complete platform built around the primitives AI-powered apps actually require.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_HIGHLIGHTS.map((feature, i) => (
              <FeatureCard
                key={feature.title}
                feature={feature}
                index={i}
                visible={featuresVisible}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* HOW IT WORKS                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section
        ref={stepsRef}
        className="relative px-6 pb-32"
        aria-labelledby="how-it-works-heading"
      >
        <div className="mx-auto max-w-5xl">
          <div
            className={cn(
              "mb-16 text-center",
              "transition-all duration-700",
              stepsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
            )}
          >
            <h2
              id="how-it-works-heading"
              className="text-4xl font-black tracking-tight text-foreground sm:text-5xl"
            >
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three steps from idea to production.
            </p>
          </div>

          <div className="grid sm:grid-cols-5 gap-6 items-center">
            {/* Step 1 */}
            <article
              className={cn(
                "sm:col-span-1 flex flex-col gap-4 rounded-3xl border border-border bg-card p-8 text-center",
                "transition-all duration-500 delay-100",
                stepsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
              )}
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-black text-primary">
                1
              </span>
              <h3 className="text-lg font-bold text-foreground">Discover tools</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Browse 80+ ready-made tools across code, AI, storage, auth, and more.
              </p>
            </article>

            <StepDivider />

            {/* Step 2 */}
            <article
              className={cn(
                "sm:col-span-1 flex flex-col gap-4 rounded-3xl border border-border bg-card p-8 text-center",
                "transition-all duration-500 delay-200",
                stepsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
              )}
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-black text-primary">
                2
              </span>
              <h3 className="text-lg font-bold text-foreground">Compose workflows</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Chain tools into typed workflows. CI, agents, and humans call the same surface.
              </p>
            </article>

            <StepDivider />

            {/* Step 3 */}
            <article
              className={cn(
                "sm:col-span-1 flex flex-col gap-4 rounded-3xl border border-border bg-card p-8 text-center",
                "transition-all duration-500 delay-300",
                stepsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
              )}
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-black text-primary">
                3
              </span>
              <h3 className="text-lg font-bold text-foreground">Ship to production</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Deploy to the edge in seconds. Global, fast, zero infrastructure to manage.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section ref={ctaRef} className="relative px-6 pb-32" aria-labelledby="cta-heading">
        <div
          className={cn(
            "mx-auto max-w-4xl rounded-3xl border border-border bg-card px-8 py-20 text-center",
            "transition-all duration-700",
            ctaVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]",
          )}
        >
          {/* Subtle inner glow */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 rounded-3xl",
              isDarkMode
                ? "bg-gradient-to-b from-primary/5 to-transparent"
                : "bg-gradient-to-b from-primary/3 to-transparent",
            )}
            aria-hidden="true"
          />

          <h2
            id="cta-heading"
            className="relative text-4xl font-black tracking-tight text-foreground sm:text-5xl"
          >
            Ready to build?
          </h2>
          <p className="relative mt-5 text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Start with one tool. Compose your first workflow. Ship it today.
          </p>

          <div className="relative mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/apps"
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl bg-primary px-10 py-4 text-base font-bold text-primary-foreground",
                "hover:bg-primary/90 active:scale-[0.97] transition-all duration-200",
                isDarkMode ? "shadow-lg shadow-primary/20" : "shadow-lg shadow-primary/10",
              )}
            >
              Start building
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="/tools"
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border border-border bg-transparent px-10 py-4 text-base font-semibold text-foreground",
                "hover:bg-card hover:border-primary/30 active:scale-[0.97] transition-all duration-200",
              )}
            >
              View all tools
            </a>
          </div>

          <p className="relative mt-8 text-sm text-muted-foreground">
            No infrastructure to manage &nbsp;&middot;&nbsp; Edge-deployed globally
            &nbsp;&middot;&nbsp; Keep your existing stack
          </p>
        </div>
      </section>
    </div>
  );
}
