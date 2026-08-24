import { useTranslations } from "next-intl";
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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-sm font-semibold tracking-tight">
            Video Dub
          </span>
        </a>
        <nav className="hidden flex-1 items-center gap-5 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <LocaleSwitcher />
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <GitHubIcon className="size-4" />
              {t("github")}
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
