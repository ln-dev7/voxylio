import Image from "next/image";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/github-icon";
import { GITHUB_URL } from "@/lib/constants";
import overlayPreview from "../../public/overlay-preview.png";

export function Hero() {
  const t = useTranslations("Hero");

  return (
    <section className="relative overflow-hidden">
      {/* Faint green glow behind the headline, single accent per design system */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-180px] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]"
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Badge
            variant="outline"
            className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-primary"
          >
            {t("badge")}
          </Badge>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <a href="#install">
                <Download data-slot="icon" />
                {t("ctaInstall")}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                <GitHubIcon className="size-4" />
                {t("ctaGithub")}
              </a>
            </Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground/80">{t("note")}</p>
        </div>

        {/* Product screenshot framed as a dark panel, marketing-as-screenshot style */}
        <div className="mt-16">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-border bg-card shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <Image
              src={overlayPreview}
              alt="Video Dub floating controller over a video player"
              priority
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
