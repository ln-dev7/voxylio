import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/github-icon";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { GITHUB_URL } from "@/lib/constants";

export function SiteHeader() {
  const t = useTranslations("Header");

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

        {/* Centered nav */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] p-1 md:flex">
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

        <div className="ml-auto flex items-center gap-2.5">
          <LocaleSwitcher />
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-foreground"
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
          <Button asChild size="sm" className="hidden rounded-full px-4 sm:inline-flex">
            <a href="#install">
              <Download data-slot="icon" />
              {t("install")}
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
