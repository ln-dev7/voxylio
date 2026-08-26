import { useTranslations } from "next-intl";
import { Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/github-icon";
import { Aurora } from "@/components/aurora";
import { DubDemo } from "@/components/dub-demo";
import { CHROME_STORE_URL, GITHUB_URL } from "@/lib/constants";

export function Hero() {
  const t = useTranslations("Hero");

  return (
    <section className="relative overflow-hidden">
      <Aurora />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h1 className="animate-in fade-in slide-in-from-bottom-3 text-balance font-display text-[2.75rem] font-semibold leading-[1.04] tracking-[-0.03em] duration-700 sm:text-7xl">
            {t.rich("title", {
              accent: (chunks) => (
                <span className="gradient-text">{chunks}</span>
              ),
            })}
          </h1>

          <p className="mt-6 max-w-2xl animate-in fade-in slide-in-from-bottom-3 text-pretty text-base leading-relaxed text-muted-foreground duration-1000 sm:text-lg">
            {t("subtitle")}
          </p>

          <div className="mt-9 flex animate-in fade-in slide-in-from-bottom-2 flex-wrap items-center justify-center gap-3 duration-1000">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full px-7 text-[15px] shadow-[0_0_40px_rgba(30,215,96,0.25)] transition-shadow hover:shadow-[0_0_60px_rgba(30,215,96,0.4)]"
            >
              <a href={CHROME_STORE_URL} target="_blank" rel="noreferrer">
                <Download data-slot="icon" />
                {t("ctaInstall")}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full bg-card px-7 text-[15px] backdrop-blur-sm"
            >
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                <GitHubIcon className="size-4" />
                {t("ctaGithub")}
              </a>
            </Button>
          </div>

          {/* The promises that matter: free, local, no account, no quota */}
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {(["free", "local", "noCard", "noQuota"] as const).map((k) => (
              <li
                key={k}
                className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground"
              >
                <Check className="size-3.5 text-primary" aria-hidden="true" />
                {t(`ticks.${k}`)}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground/70">{t("note")}</p>
        </div>

        {/* Video-style live demo */}
        <div className="mt-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 sm:mt-20">
          <DubDemo />
        </div>
      </div>
    </section>
  );
}
