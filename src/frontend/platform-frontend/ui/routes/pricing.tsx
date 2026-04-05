import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { trackAnalyticsEvent } from "../hooks/useAnalytics";
import { usePricing } from "../hooks/usePricing";
import { useToast } from "../components/Toast";
import { apiFetch } from "../../core-logic/api";
import { trackGoogleAdsEvent } from "../../core-logic/google-ads";

interface PricingFeature {
  text: string;
}

type PlanId = "free" | "pro" | "business" | "enterprise";

interface PricingPlan {
  id: PlanId;
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  annualTotal: string;
  period?: string;
  description: string;
  features: PricingFeature[];
  cta: string;
  tier?: "pro" | "business";
  ctaHref?: string;
  highlighted: boolean;
}

type TranslateFn = (key: string, options?: Record<string, unknown>) => unknown;

function translateList(t: TranslateFn, key: string): string[] {
  return t(key, { returnObjects: true }) as string[];
}

function makePlans(
  pricing: import("../hooks/usePricing").PricingData,
  t: TranslateFn,
): PricingPlan[] {
  return [
    {
      id: "free",
      name: t("plans.free.name") as string,
      monthlyPrice: "$0",
      annualPrice: "$0",
      annualTotal: "$0/yr",
      description: t("plans.free.description") as string,
      features: translateList(t, "plans.free.features").map((text) => ({ text })),
      cta: t("plans.free.cta") as string,
      ctaHref: "/apps",
      highlighted: false,
    },
    {
      id: "pro",
      name: t("plans.pro.name") as string,
      monthlyPrice: pricing.pro.monthly,
      annualPrice: pricing.pro.annual,
      annualTotal: pricing.pro.annualTotal,
      period: t("periodMonthly") as string,
      description: t("plans.pro.description") as string,
      features: translateList(t, "plans.pro.features").map((text) => ({ text })),
      cta: t("plans.pro.cta") as string,
      tier: "pro",
      highlighted: true,
    },
    {
      id: "business",
      name: t("plans.business.name") as string,
      monthlyPrice: pricing.business.monthly,
      annualPrice: pricing.business.annual,
      annualTotal: pricing.business.annualTotal,
      period: t("periodMonthly") as string,
      description: t("plans.business.description") as string,
      features: translateList(t, "plans.business.features").map((text) => ({ text })),
      cta: t("plans.business.cta") as string,
      tier: "business",
      highlighted: false,
    },
    {
      id: "enterprise",
      name: t("plans.enterprise.name") as string,
      monthlyPrice: t("plans.enterprise.customPrice") as string,
      annualPrice: t("plans.enterprise.customPrice") as string,
      annualTotal: "",
      description: t("plans.enterprise.description") as string,
      features: translateList(t, "plans.enterprise.features").map((text) => ({ text })),
      cta: t("plans.enterprise.cta") as string,
      ctaHref: "mailto:hello@spike.land",
      highlighted: false,
    },
  ];
}

function makeFaqItems(t: TranslateFn) {
  return Array.from({ length: 9 }, (_, index) => {
    const questionKey = `faq.q${index + 1}`;
    const answerKey = `faq.a${index + 1}`;
    return {
      question: t(questionKey) as string,
      answer: t(answerKey) as string,
    };
  });
}

async function handleCheckout(
  tier: "pro" | "business",
  annual: boolean,
  isAuthenticated: boolean,
  trackEvent: (event: string, data?: Record<string, unknown>) => void,
  showToast: (message: string, variant?: "success" | "error" | "info") => void,
) {
  if (!isAuthenticated) {
    window.location.href = "/login";
    return;
  }
  trackEvent("checkout_started", { tier, billing: annual ? "annual" : "monthly" });
  trackGoogleAdsEvent("begin_checkout", { tier, billing: annual ? "annual" : "monthly" });
  const lookupKey = annual ? `${tier}_annual` : `${tier}_monthly`;
  const res = await apiFetch("/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier, lookup_key: lookupKey }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    showToast(err.error ?? "Checkout failed", "error");
    return;
  }
  const data = (await res.json()) as { url: string };
  window.location.href = data.url;
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-[1.05rem] w-[1.05rem] shrink-0 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PlanCard({
  plan,
  annual,
  isAuthenticated,
  getStartedLabel,
  trackEvent,
  showToast,
}: {
  plan: PricingPlan;
  annual: boolean;
  isAuthenticated: boolean;
  getStartedLabel: string;
  trackEvent: (event: string, data?: Record<string, unknown>) => void;
  showToast: (message: string, variant?: "success" | "error" | "info") => void;
}) {
  const { t } = useTranslation("pricing");
  const isFree = plan.id === "free";
  const isEnterprise = plan.id === "enterprise";
  const displayPrice = annual ? plan.annualPrice : plan.monthlyPrice;
  const planId = `plan-${plan.id}`;

  return (
    <div
      role="region"
      aria-labelledby={planId}
      className={[
        "relative flex flex-col rounded-[var(--radius-panel)] border p-8 transition-all duration-[240ms]",
        plan.highlighted
          ? "border-primary/30 bg-gradient-to-b from-[color-mix(in_srgb,var(--card-bg)_88%,var(--primary-color)_12%)] to-[var(--card-bg)] shadow-[var(--panel-shadow-strong)] scale-[1.02] z-10"
          : "border-[color-mix(in_srgb,var(--border-color)_90%,transparent)] bg-gradient-to-b from-[color-mix(in_srgb,var(--card-bg)_96%,white_4%)] to-[color-mix(in_srgb,var(--muted-bg)_20%,var(--card-bg)_80%)] shadow-[var(--panel-shadow)]",
      ].join(" ")}
    >
      {/* Most Popular badge — absolute-positioned to float at top of card */}
      {plan.highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80" />
            {t("mostPopular")}
          </span>
        </div>
      )}

      {/* Plan header */}
      <div className="mb-6">
        <h2
          id={planId}
          className="text-base font-bold uppercase tracking-[0.1em] text-muted-foreground"
        >
          {plan.name}
        </h2>

        <div className="mt-4 flex items-end gap-1.5">
          <span
            className={[
              "font-display font-bold tracking-[-0.06em] leading-none",
              isEnterprise ? "text-3xl" : "text-5xl",
            ].join(" ")}
          >
            {displayPrice}
          </span>
          {plan.period && !isEnterprise && (
            <span className="mb-1.5 text-sm text-muted-foreground">{plan.period}</span>
          )}
        </div>

        {annual && !isFree && !isEnterprise && (
          <p className="mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("billedAnnually", { total: plan.annualTotal })}
          </p>
        )}

        {annual && !isFree && !isEnterprise && (
          <span className="mt-3 inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-primary">
            {t("saveAmount")}
          </span>
        )}

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
      </div>

      {/* Divider */}
      <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--border-color)_80%,transparent)] to-transparent" />

      {/* Feature list */}
      <ul className="flex-1 space-y-3.5">
        {plan.features.map((f) => (
          <li
            key={f.text}
            className="flex items-start gap-2.5 text-sm leading-snug text-foreground"
          >
            <CheckIcon />
            <span>{f.text}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-8">
        {plan.tier ? (
          <button
            type="button"
            onClick={(() => {
              const tier = plan.tier as "pro" | "business";
              return () => handleCheckout(tier, annual, isAuthenticated, trackEvent, showToast);
            })()}
            className={[
              "block w-full rounded-[calc(var(--radius-control)-0.1rem)] px-6 py-3 text-center text-sm font-semibold transition-all duration-[160ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              plan.highlighted
                ? "bg-primary text-primary-foreground shadow-[0_2px_12px_color-mix(in_srgb,var(--primary-color)_28%,transparent)] hover:brightness-110 active:brightness-95"
                : "border border-border bg-transparent text-foreground hover:border-primary/30 hover:bg-primary/5",
            ].join(" ")}
          >
            {!isAuthenticated && plan.tier ? getStartedLabel : plan.cta}
          </button>
        ) : (
          <a
            href={plan.ctaHref}
            onClick={() =>
              trackEvent("cta_clicked", { plan: plan.name, tier: plan.tier ?? "free" })
            }
            className={[
              "block w-full rounded-[calc(var(--radius-control)-0.1rem)] border px-6 py-3 text-center text-sm font-semibold transition-all duration-[160ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isEnterprise
                ? "border-border bg-transparent text-foreground hover:border-primary/30 hover:bg-primary/5"
                : "border-border bg-transparent text-foreground hover:border-primary/30 hover:bg-primary/5",
            ].join(" ")}
          >
            {plan.cta}
          </a>
        )}
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[color-mix(in_srgb,var(--border-color)_70%,transparent)] last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-start justify-between gap-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
      >
        <span className="text-[0.9375rem] font-semibold leading-snug text-foreground">
          {question}
        </span>
        <span
          className={[
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden="true"
        >
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-3 w-3"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {open && <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{answer}</p>}
    </div>
  );
}

export function PricingPage() {
  const { t } = useTranslation("pricing");
  const [annual, setAnnual] = useState(false);
  const { isAuthenticated } = useAuth();
  const { data: pricing } = usePricing();
  const { showToast } = useToast();
  const plans = useMemo(() => makePlans(pricing, t), [pricing, t]);
  const faqItems = useMemo(() => makeFaqItems(t), [t]);

  return (
    <div className="rubik-container rubik-page rubik-stack">
      {/* ── Hero header ── */}
      <section className="pb-2 pt-8 text-center sm:pt-12">
        <div className="mx-auto max-w-2xl space-y-5">
          <span className="rubik-eyebrow mx-auto">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {t("eyebrow")}
          </span>

          <h1 className="font-display font-bold tracking-tight text-foreground">{t("title")}</h1>
          <p className="rubik-lede mx-auto text-center">{t("subtitle")}</p>

          {/* Launch promo pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm font-medium text-primary">
            {t("launchPromo")}
          </div>
        </div>

        {/* Billing toggle */}
        <div
          role="radiogroup"
          aria-label={t("billingFrequency") as string}
          className="mx-auto mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-muted p-1"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
              e.preventDefault();
              setAnnual(false);
            }
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
              e.preventDefault();
              setAnnual(true);
            }
          }}
        >
          <button
            type="button"
            role="radio"
            aria-checked={!annual}
            tabIndex={!annual ? 0 : -1}
            onClick={() => setAnnual(false)}
            className={[
              "rounded-full px-5 py-2 text-sm font-medium transition-all duration-[160ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              !annual
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t("monthly")}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={annual}
            tabIndex={annual ? 0 : -1}
            onClick={() => setAnnual(true)}
            className={[
              "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-[160ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              annual
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t("annual")}
            <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-primary">
              {t("annualSavings")}
            </span>
          </button>
        </div>
      </section>

      {/* ── Pricing grid ── */}
      {/* On mobile: stacked. sm: 2-col. xl: 4-col.
          The highlighted pro card gets subtle scale via PlanCard internals. */}
      <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.name}
            plan={plan}
            annual={annual}
            isAuthenticated={isAuthenticated}
            getStartedLabel={t("getStarted") as string}
            trackEvent={trackAnalyticsEvent}
            showToast={showToast}
          />
        ))}
      </div>

      {/* ── Fine print ── */}
      <div className="space-y-2 text-center">
        <p className="text-sm text-muted-foreground">
          {t("customPlanPrefix")}{" "}
          <a
            href="mailto:hello@spike.land"
            className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {t("customPlanLink")}
          </a>
        </p>
        <p className="text-[0.8125rem] text-muted-foreground">
          {t("pricingDisclaimer")}{" "}
          {pricing.billedInUsd
            ? t("priceDisplayUsd", { currency: pricing.currency })
            : t("priceDisplayDefault")}{" "}
          {t("vatNotice")}
          <br />
          {t("academicPrefix")}{" "}
          <a
            href="mailto:hello@spike.land"
            className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {t("academicLink")}
          </a>
          .
        </p>
      </div>

      {/* ── FAQ ── */}
      <section aria-labelledby="faq-heading" className="mx-auto w-full max-w-2xl">
        <div className="mb-10 text-center">
          <h2 id="faq-heading" className="font-display font-bold tracking-tight text-foreground">
            {t("faq.title")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Everything you need to know about pricing and billing.
          </p>
        </div>

        <div className="rounded-[var(--radius-panel)] border border-[color-mix(in_srgb,var(--border-color)_80%,transparent)] bg-gradient-to-b from-[color-mix(in_srgb,var(--card-bg)_96%,white_4%)] to-[color-mix(in_srgb,var(--muted-bg)_18%,var(--card-bg)_82%)] px-6 shadow-[var(--panel-shadow)] sm:px-8">
          {faqItems.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </section>

      {/* Structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }),
        }}
      />
    </div>
  );
}
