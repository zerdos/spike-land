import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { cn } from "../../../styling/cn";
import { BRAND } from "./shared";

const NAV_LINKS = [
  { to: "/lumevabarber", label: "Home", exact: true },
  { to: "/lumevabarber/logos", label: "Logos" },
  { to: "/lumevabarber/websites", label: "Websites" },
] as const;

function BrandMark() {
  return (
    <Link to="/lumevabarber" className="text-amber-400 font-bold tracking-widest text-lg">
      LUMEVA
    </Link>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="relative w-6 h-5 flex flex-col justify-between">
      <span
        className={cn(
          "block h-0.5 w-full bg-white transition-all duration-300",
          open && "rotate-45 translate-y-[9px]",
        )}
      />
      <span
        className={cn(
          "block h-0.5 w-full bg-white transition-all duration-300",
          open && "opacity-0",
        )}
      />
      <span
        className={cn(
          "block h-0.5 w-full bg-white transition-all duration-300",
          open && "-rotate-45 -translate-y-[9px]",
        )}
      />
    </div>
  );
}

export function LumevaBarberLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Close mobile nav on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return pathname === to || pathname === `${to}/`;
    return pathname.startsWith(to);
  };

  const bookACallHref =
    pathname.startsWith("/lumevabarber") && pathname === "/lumevabarber"
      ? "#contact"
      : "/lumevabarber#contact";

  return (
    <div className="dark min-h-screen bg-neutral-950 text-neutral-300">
      {/* ── Sticky header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-16 bg-black/80 backdrop-blur-xl border-b border-neutral-800/50">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandMark />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  isActive(link.to, link.exact)
                    ? "text-amber-400"
                    : "text-neutral-400 hover:text-white",
                )}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={bookACallHref}
              className="ml-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors duration-200 hover:bg-amber-400"
            >
              Book a Call
            </a>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <HamburgerIcon open={mobileOpen} />
          </button>
        </div>
      </header>

      {/* ── Mobile nav overlay ─────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-black/95 backdrop-blur-lg pt-20 md:hidden">
          <nav className="flex flex-col items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMobile}
                className={cn(
                  "text-2xl font-medium transition-colors duration-200",
                  isActive(link.to, link.exact)
                    ? "text-amber-400"
                    : "text-neutral-300 hover:text-white",
                )}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={bookACallHref}
              onClick={closeMobile}
              className="mt-4 rounded-lg bg-amber-500 px-8 py-3 text-lg font-semibold text-black transition-colors duration-200 hover:bg-amber-400"
            >
              Book a Call
            </a>
          </nav>
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────────── */}
      <main>
        <Outlet />
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-800/50 bg-black">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <span className="text-lg font-bold tracking-widest text-amber-400">LUMEVA</span>
              <p className="text-sm text-neutral-500">
                &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 sm:items-end">
              <a
                href={`mailto:${BRAND.email}`}
                className="text-sm text-neutral-400 transition-colors hover:text-amber-400"
              >
                {BRAND.email}
              </a>
              <a
                href="https://spike.land"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-600 transition-colors hover:text-neutral-400"
              >
                Powered by spike.land
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
