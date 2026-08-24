"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/github-icon";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { GITHUB_URL } from "@/lib/constants";

export function SiteHeader() {
  const t = useTranslations("Header");
  const [open, setOpen] = useState(false);

  const nav = [
    { href: "#features", label: t("features") },
    { href: "#how-it-works", label: t("howItWorks") },
    { href: "#install", label: t("install") },
    { href: "#faq", label: t("faq") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
      <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display text-[15px] font-semibold tracking-tight">
            Video Dub
          </span>
        </a>

        {/* Desktop nav (lg and up) */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] p-1 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              {item.label}
            </a>
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
            <a href="#install">
              <Download data-slot="icon" />
              {t("install")}
            </a>
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
          className="border-t border-white/[0.06] bg-background/95 backdrop-blur-xl lg:hidden"
        >
          <nav className="mx-auto flex w-full max-w-6xl flex-col px-4 py-3 sm:px-6">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-2 flex items-center gap-3 border-t border-white/[0.06] px-3 pb-2 pt-4">
              <Button asChild size="sm" className="flex-1 rounded-full">
                <a href="#install" onClick={() => setOpen(false)}>
                  <Download data-slot="icon" />
                  {t("install")}
                </a>
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
