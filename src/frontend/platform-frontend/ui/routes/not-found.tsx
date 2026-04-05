import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function NotFoundPage() {
  const { t } = useTranslation("errors");

  useEffect(() => {
    const existing = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (existing) {
      existing.content = "noindex";
    } else {
      const meta = document.createElement("meta");
      meta.name = "robots";
      meta.content = "noindex";
      document.head.appendChild(meta);
    }
    return () => {
      const el = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (el) el.content = "index, follow";
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-32 text-center">
      {/* Large muted 404 numeral */}
      <p
        aria-hidden="true"
        className="select-none text-[clamp(6rem,20vw,14rem)] font-black leading-none tracking-tighter text-foreground/[0.06]"
      >
        404
      </p>

      {/* Heading */}
      <h1 className="-mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {t("notFound.title")}
      </h1>

      {/* Subtitle */}
      <p className="mt-3 max-w-sm text-base text-muted-foreground leading-relaxed">
        {t("notFound.message")}
      </p>

      {/* Primary action */}
      <Link
        to="/"
        className="mt-10 inline-flex items-center justify-center rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
      >
        {t("notFound.home")}
      </Link>

      {/* Secondary links */}
      <nav
        aria-label="Helpful links"
        className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
      >
        {(
          [
            { to: "/apps", label: t("notFound.apps") },
            { to: "/blog", label: t("notFound.blog") },
            { to: "/learnit", label: "LearnIt" },
            { to: "/chess", label: "Chess" },
            { to: "/store", label: t("notFound.store") },
          ] as const
        ).map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
