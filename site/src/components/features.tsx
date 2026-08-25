import { useTranslations } from "next-intl";
import {
  Cpu,
  Timer,
  AudioLines,
  SlidersHorizontal,
  Languages,
  ArrowRight,
} from "lucide-react";
import { SpotlightCard } from "@/components/spotlight-card";

const SMALL_ITEMS = [
  { key: "local", icon: Cpu },
  { key: "sync", icon: Timer },
  { key: "voices", icon: AudioLines },
  { key: "overlay", icon: SlidersHorizontal },
] as const;

const LANG_CHIPS = ["FR", "ES", "IT", "DE", "PT"];

export function Features() {
  const t = useTranslations("Features");

  return (
    <section id="features" className="scroll-mt-16 border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
            {t("title")}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Bento grid: the flagship feature spans two columns with a visual */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SpotlightCard className="sm:col-span-2">
            <h3 className="font-display text-lg font-semibold">
              {t("items.sentences.title")}
            </h3>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {t("items.sentences.description")}
            </p>
            {/* Fragments merging into one sentence */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5 text-[13px]">
              <span className="rounded-md border border-border bg-secondary px-2.5 py-1 text-muted-foreground line-through decoration-white/25">
                We&rsquo;re gonna be doing this
              </span>
              <span className="rounded-md border border-border bg-secondary px-2.5 py-1 text-muted-foreground line-through decoration-white/25">
                by using a playground.
              </span>
              <ArrowRight
                className="size-4 text-primary"
                aria-hidden="true"
              />
              <span className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 font-medium text-primary">
                Nous allons faire cela en utilisant un playground.
              </span>
            </div>
          </SpotlightCard>

          {SMALL_ITEMS.map(({ key, icon: Icon }) => (
            <SpotlightCard key={key}>
              <span className="mb-4 grid size-9 place-items-center rounded-lg border border-primary/25 bg-primary/10">
                <Icon className="size-4.5 text-primary" aria-hidden="true" />
              </span>
              <h3 className="font-display text-base font-semibold">
                {t(`items.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`items.${key}.description`)}
              </p>
            </SpotlightCard>
          ))}

          {/* Wide closing card: languages */}
          <SpotlightCard className="sm:col-span-2 lg:col-span-3">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10">
                <Languages
                  className="size-4.5 text-primary"
                  aria-hidden="true"
                />
              </span>
              <div className="flex-1">
                <h3 className="font-display text-base font-semibold">
                  {t("items.languages.title")}
                </h3>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {t("items.languages.description")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {LANG_CHIPS.map((l) => (
                  <span
                    key={l}
                    className="grid size-9 place-items-center rounded-full border border-border bg-card text-[11px] font-bold"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}
