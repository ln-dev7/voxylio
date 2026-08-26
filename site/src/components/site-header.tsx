"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Menu, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/github-icon";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link } from "@/i18n/navigation";
import { GITHUB_URL } from "@/lib/constants";

export function SiteHeader() {
  const t = useTranslations("Header");
  const [open, setOpen] = useState(false);

  // Absolute (locale-aware) hrefs so the anchors work from any page, not
  // only from the home page (e.g. /fr/privacy -> /fr#features).
  const nav = [
    { key: "features", href: { pathname: "/", hash: "features" }, label: t("features") },
    { key: "pricing", href: { pathname: "/", hash: "pricing" }, label: t("pricing") },
    { key: "how-it-works", href: { pathname: "/", hash: "how-it-works" }, label: t("howItWorks") },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display text-[15px] font-semibold tracking-tight">
            Voxylio
          </span>
        </Link>

        {/* Desktop nav (lg and up) */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card p-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          <LocaleSwitcher />
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hidden rounded-full text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            <Link href="/account" aria-label={t("account")}>
              <User className="size-[18px]" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hidden rounded-full text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label={t("github")}
            >
              <GitHubIcon className="size-[18px]" />
            </a>
          </Button>
          <Button
            asChild
            size="sm"
            className="hidden rounded-full px-4 lg:inline-flex"
          >
            <Link href={{ pathname: "/", hash: "install" }}>
              <Download data-slot="icon" />
              {t("install")}
            </Link>
          </Button>
          {/* Burger (below lg) */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile / tablet panel */}
      {open && (
        <div
          id="mobile-menu"
          className="border-t border-border bg-background/95 backdrop-blur-xl lg:hidden"
        >
          <nav className="mx-auto flex w-full max-w-6xl flex-col px-4 py-3 sm:px-6">
            {nav.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t("account")}
            </Link>
            <div className="mt-2 flex items-center gap-3 border-t border-border px-3 pb-2 pt-4">
              <Button asChild size="sm" className="flex-1 rounded-full">
                <Link
                  href={{ pathname: "/", hash: "install" }}
                  onClick={() => setOpen(false)}
                >
                  <Download data-slot="icon" />
                  {t("install")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                  <GitHubIcon className="size-4" />
                  GitHub
                </a>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
