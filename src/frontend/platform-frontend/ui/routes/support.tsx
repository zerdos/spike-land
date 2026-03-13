import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { trackAnalyticsEvent } from "../hooks/useAnalytics";
import { trackGoogleAdsEvent } from "../../core-logic/google-ads";
import { apiFetch } from "../../core-logic/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TierId = "star" | "coffee" | "monthly";

interface SupportTier {
  id: TierId;
  name: string;
  price: string;
  description: string;
  cta: string;
  highlighted: boolean;
  badge?: string;
}

interface CostItem {
  label: string;
  amount: string;
  note: string;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const TIERS: SupportTier[] = [
  {
    id: "star",
    name: "Star on GitHub",
    price: "Free",
    description: "Stars help with discoverability. It takes two seconds and costs nothing.",
    cta: "Star the repo",
    highlighted: false,
  },
  {
    id: "coffee",
    name: "Buy a Coffee",
    price: "$5",
    description:
      "One-time. No account needed. Covers roughly one day of Cloudflare Workers compute.",
    cta: "Buy a coffee",
    highlighted: true,
    badge: "Most popular",
  },
  {
    id: "monthly",
    name: "Monthly Supporter",
    price: "$9/mo",
    description:
      "Recurring support via a Pro subscription. Includes all Pro features as a thank-you.",
    cta: "Become a supporter",
    highlighted: false,
  },
];

const COSTS: CostItem[] = [
  { label: "Cloudflare Workers", amount: "~$5/mo", note: "Edge compute, D1, R2 storage" },
  { label: "API keys", amount: "~$40/mo", note: "Claude, Gemini, embeddings" },
  { label: "Domains & DNS", amount: "~$30/yr", note: "spike.land + related domains" },
  { label: "Development time", amount: "Unpaid", note: "One person, evenings and weekends" },
];

const STATS = [
  { value: "108", label: "MCP tools" },
  { value: "36", label: "Blog posts" },
  { value: "865", label: "Tests" },
  { value: "100%", label: "Open source" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// TierCard
// ---------------------------------------------------------------------------

function TierCard({
  tier,
  onCoffeeClick,
  loading,
}: {
  tier: SupportTier;
  onCoffeeClick: (email: string) => void;
  loading: boolean;
}) {
  const [email, setEmail] = useState("");

  function handleClick() {
    trackAnalyticsEvent("support_tier_click", { tier: tier.id, price: tier.price });
    trackGoogleAdsEvent("support_click");

    if (tier.id === "star") {
      window.open("https://github.com/spike-land-ai/spike-land", "_blank", "noopener");
    } else if (tier.id === "coffee") {
      onCoffeeClick(email);
    } else if (tier.id === "monthly") {
      // Pro subscription requires auth — link to pricing
      window.location.href = "/pricing";
    }
  }

  const panelClass = tier.highlighted ? "rubik-panel-strong" : "rubik-panel";
  const buttonClass = `mt-6 block w-full rounded-[calc(var(--radius-control)-0.1rem)] border px-6 py-3 text-center text-sm font-semibold transition cursor-pointer ${
    tier.highlighted
      ? "border-transparent bg-foreground text-background hover:bg-foreground/92"
      : "border-border bg-background text-foreground hover:border-primary/24 hover:text-primary"
  }`;

  return (
    <article
      aria-labelledby={`heading-${tier.id}`}
      className={`flex h-full flex-col p-6 ${panelClass}`}
    >
      {tier.badge && (
        <span className="rubik-chip rubik-chip-accent mb-4 self-start">{tier.badge}</span>
      )}

      <h2
        id={`heading-${tier.id}`}
        className="mt-1 text-xl font-semibold tracking-[-0.03em] text-foreground"
      >
        {tier.name}
      </h2>

      <div className="mt-3">
        <span className="text-3xl font-semibold tracking-[-0.05em] text-foreground">
          {tier.price}
        </span>
      </div>

      <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">{tier.description}</p>

      {tier.id === "coffee" && (
        <div className="mt-4">
          <label
            htmlFor="support-email"
            className="block text-xs font-medium text-muted-foreground mb-1.5"
          >
            Email (optional, for receipt)
          </label>
          <input
            id="support-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={tier.id === "coffee" && loading}
        className={buttonClass}
      >
        {tier.id === "coffee" && loading ? "Redirecting to Stripe..." : tier.cta}
      </button>
    </article>
  );
}

// ---------------------------------------------------------------------------
// SupportPage
// ---------------------------------------------------------------------------

export function SupportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("success")) {
      setSuccess(true);
    }
  }, []);

  const handleCoffeeCheckout = useCallback(async (email: string) => {
    setError(null);
    setLoading(true);

    try {
      const body: Record<string, string> = { service: "support_coffee" };
      if (email.trim()) body["email"] = email.trim();

      const res = await apiFetch("/checkout/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (data.url) {
        const target = new URL(data.url, window.location.origin);
        const trusted = ["spike.land", "checkout.stripe.com"];
        const safe =
          target.origin === window.location.origin ||
          trusted.some((d) => target.hostname === d || target.hostname.endsWith(`.${d}`));
        if (safe) {
          window.location.href = data.url;
        } else {
          setError("Unexpected redirect. Please try again.");
          setLoading(false);
        }
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }, []);

  return (
    <div className="rubik-container py-12 md:py-20">
      {/* Success banner */}
      {success && (
        <div className="mb-10 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5 text-center">
          <p className="text-2xl mb-2">🙏</p>
          <h2 className="text-lg font-semibold text-foreground">Thank you for your support!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;re helping keep spike.land running and independent.
          </p>
        </div>
      )}

      {/* Hero */}
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/70">
          Indie Developer
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground md:text-4xl">
          I&apos;m one developer building this in the open
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          spike.land is an open-source MCP platform with 108 tools, a blog, an app store, and zero
          venture capital. It runs on Cloudflare Workers, late nights, and the occasional coffee.
          Here&apos;s how you can help keep it going.
        </p>
      </header>

      {/* Error */}
      {error && (
        <div className="mx-auto mt-8 max-w-md" role="alert">
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive text-center">
            {error}
          </p>
        </div>
      )}

      {/* Tier cards */}
      <section aria-label="Support tiers" className="mt-14 grid gap-6 md:grid-cols-3">
        {TIERS.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            onCoffeeClick={(email) => {
              void handleCoffeeCheckout(email);
            }}
            loading={loading}
          />
        ))}
      </section>

      {/* Where the money goes */}
      <section aria-labelledby="costs-heading" className="mt-20 mx-auto max-w-2xl">
        <h2
          id="costs-heading"
          className="text-center text-xl font-semibold tracking-[-0.03em] text-foreground"
        >
          Where the money goes
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Full transparency. No corporate overhead. Every dollar goes to keeping the platform alive.
        </p>

        <div className="mt-8 space-y-3">
          {COSTS.map((item) => (
            <div
              key={item.label}
              className="rubik-panel flex items-center justify-between px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {item.amount}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section aria-label="Project stats" className="mt-20">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="rubik-panel p-5 text-center">
              <p className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Other ways to help */}
      <section aria-labelledby="other-heading" className="mt-20 mx-auto max-w-2xl text-center">
        <h2 id="other-heading" className="text-xl font-semibold tracking-[-0.03em] text-foreground">
          Other ways to help
        </h2>
        <div className="mt-6 space-y-3 text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <CheckIcon />
            <span>
              Report bugs and suggest features on{" "}
              <a
                href="https://github.com/spike-land-ai/spike-land/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub Issues
              </a>
            </span>
          </p>
          <p className="flex items-center justify-center gap-2">
            <CheckIcon />
            <span>Share spike.land with a friend who builds with AI</span>
          </p>
          <p className="flex items-center justify-center gap-2">
            <CheckIcon />
            <span>Write about your experience using the platform</span>
          </p>
          <p className="flex items-center justify-center gap-2">
            <CheckIcon />
            <span>
              Read the{" "}
              <Link to="/blog" className="text-primary hover:underline">
                blog
              </Link>{" "}
              and share what resonates
            </span>
          </p>
        </div>
      </section>

      {/* Footer note */}
      <p className="mt-16 text-center text-xs text-muted-foreground/60">
        Payments secured by Stripe. Your card details never touch our servers.
      </p>
    </div>
  );
}
