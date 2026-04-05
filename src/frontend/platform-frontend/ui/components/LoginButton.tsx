import { useAuth } from "../hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Settings, LogOut, ChevronDown, CreditCard } from "lucide-react";
import { cn } from "../../styling/cn";

export function LoginButton() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const { t } = useTranslation(["auth", "common"]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  if (isLoading) {
    return (
      <div
        className="h-9 w-20 animate-pulse rounded-full bg-border/50"
        aria-label={t("common:loading")}
        role="status"
      />
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={() => login()}
        className={cn(
          "inline-flex h-9 items-center rounded-full border border-border bg-transparent px-5",
          "text-[0.8rem] font-medium tracking-[0.02em] text-foreground",
          "transition-all duration-200",
          "hover:border-foreground/30 hover:bg-foreground/5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
      >
        {t("auth:signIn")}
      </button>
    );
  }

  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className={cn(
          "flex items-center gap-2 rounded-full border px-1.5 py-1.5 transition-all duration-200 sm:pr-3",
          menuOpen
            ? "border-border bg-card shadow-sm"
            : "border-border/60 bg-transparent hover:border-border hover:bg-card/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
        aria-label={`Account menu for ${user.name ?? user.email ?? "User"}`}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          {user.picture ? (
            <img src={user.picture} alt="" className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-[0.6rem] font-semibold tracking-wide text-white">
              {initials}
            </div>
          )}
          {/* Online indicator */}
          <div className="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
        </div>

        {/* Name + label — visible on sm+ */}
        <div className="hidden flex-col items-start leading-none sm:flex">
          <span className="text-[0.78rem] font-semibold text-foreground">
            {user.name ?? user.preferred_username ?? "User"}
          </span>
          <span className="mt-0.5 text-[0.65rem] font-medium text-muted-foreground">
            {t("auth:proMember")}
          </span>
        </div>

        <ChevronDown
          className={cn(
            "hidden sm:block size-3.5 text-muted-foreground/70 transition-transform duration-200",
            menuOpen && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <div
          role="menu"
          className={cn(
            "rubik-panel absolute right-0 top-full z-[100] mt-2 w-56 origin-top-right",
            "animate-in fade-in zoom-in-95 duration-150",
          )}
        >
          {/* User header */}
          <div className="border-b border-border/50 px-3 pb-3 pt-3">
            <p className="truncate text-[0.82rem] font-semibold text-foreground">
              {user.name ?? "User"}
            </p>
            {user.email && (
              <p className="mt-0.5 truncate text-[0.68rem] text-muted-foreground">{user.email}</p>
            )}
          </div>

          {/* Menu items */}
          <div className="p-1">
            <Link
              to="/settings"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.82rem] font-medium text-muted-foreground",
                "transition-colors duration-150 hover:bg-muted hover:text-foreground",
              )}
            >
              <Settings className="size-3.5 shrink-0" />
              {t("auth:accountSettings")}
            </Link>
            <Link
              to="/settings"
              search={{ tab: "billing" }}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.82rem] font-medium text-muted-foreground",
                "transition-colors duration-150 hover:bg-muted hover:text-foreground",
              )}
            >
              <CreditCard className="size-3.5 shrink-0" />
              {t("auth:billingCredits")}
            </Link>

            <div className="mx-2 my-1 h-px bg-border/50" />

            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[0.82rem] font-medium text-destructive",
                "transition-colors duration-150 hover:bg-destructive/8",
              )}
            >
              <LogOut className="size-3.5 shrink-0" />
              {t("auth:logOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
