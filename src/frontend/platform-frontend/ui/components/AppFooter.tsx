import { Link } from "@tanstack/react-router";
import { Github, Twitter } from "lucide-react";
import { useTranslation } from "react-i18next";

const LINK_CLASS =
  "text-sm text-muted-foreground/70 transition-colors duration-150 hover:text-foreground";

interface FooterColumn {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}

export function AppFooter() {
  const { t } = useTranslation("footer");

  const columns: FooterColumn[] = [
    {
      heading: t("product"),
      links: [
        { label: t("packages"), href: "/apps" },
        { label: t("vibeCode"), href: "/vibe-code" },
        { label: t("appStore"), href: "/store" },
        { label: t("pricing"), href: "/pricing" },
      ],
    },
    {
      heading: t("resources"),
      links: [
        { label: t("documentation"), href: "/docs" },
        { label: t("blog"), href: "/blog" },
        { label: t("systemStatus"), href: "/status" },
        {
          label: t("changelog"),
          href: "https://github.com/spike-land-ai/spike-land-ai/releases",
          external: true,
        },
      ],
    },
    {
      heading: t("trust"),
      links: [
        { label: t("about"), href: "/about" },
        { label: t("privacyPolicy"), href: "/privacy" },
        { label: t("termsOfService"), href: "/terms" },
        { label: t("security"), href: "/security" },
      ],
    },
  ];

  return (
    <footer
      role="contentinfo"
      className="w-full border-t border-border bg-card"
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 400px" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        {/* Main grid */}
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))]">
          {/* Column 1 — Brand */}
          <div className="col-span-2 space-y-6 sm:col-span-2 lg:col-span-1">
            <Link
              to="/"
              className="inline-block text-xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
            >
              spike.land
            </Link>

            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground/70">
              {t("brandDescription")}
            </p>

            <div className="flex items-center gap-3">
              <a
                href="https://github.com/spike-land-ai"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("ariaGitHub")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground/60 transition-colors duration-150 hover:border-foreground/30 hover:text-foreground"
              >
                <Github className="size-4" />
              </a>
              <a
                href="https://x.com/ai_spike_land"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("ariaTwitter")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground/60 transition-colors duration-150 hover:border-foreground/30 hover:text-foreground"
              >
                <Twitter className="size-4" />
              </a>
            </div>
          </div>

          {/* Columns 2–4 — Navigation */}
          {columns.map((col) => (
            <div key={col.heading} className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground/50">
                {col.heading}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={LINK_CLASS}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className={LINK_CLASS}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-start gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground/50">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground/50">
            Built on{" "}
            <a
              href="https://workers.cloudflare.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              Cloudflare Workers
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
