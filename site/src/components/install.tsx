import { useTranslations } from "next-intl";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/github-icon";
import { SpotlightCard } from "@/components/spotlight-card";
import { GITHUB_URL } from "@/lib/constants";

const STEPS = ["clone", "load", "play"] as const;

export function Install() {
  const t = useTranslations("Install");

  return (
    <section id="install" className="scroll-mt-16 border-t border-white/[0.06]">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
            {t("title")}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {STEPS.map((key, i) => (
            <SpotlightCard key={key}>
              <span className="gradient-text font-display text-4xl font-bold tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-base font-semibold">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`steps.${key}.description`)}
              </p>
            </SpotlightCard>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full px-7 text-[15px] shadow-[0_0_40px_rgba(30,215,96,0.25)] transition-shadow hover:shadow-[0_0_60px_rgba(30,215,96,0.4)]"
          >
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <GitHubIcon className="size-4" />
              {t("cta")}
            </a>
          </Button>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Store className="size-3.5" aria-hidden="true" />
            {t("storeSoon")}
          </p>
        </div>
      </div>
    </section>
  );
}
