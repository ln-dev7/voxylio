import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

const LANGS = ["fr", "es", "it", "de", "pt"] as const;

/** Infinite marquee of language pairs (ReactBits "Logo Loop" pattern). */
export function LanguagesStrip() {
  const t = useTranslations("Languages");

  // Four copies of the pill row make the marquee loop seamless.
  // (Plain data + map — no component created during render.)
  const pills = [0, 1, 2, 3].flatMap((copy) =>
    LANGS.map((l) => ({ id: `${copy}-${l}`, label: t(`list.${l}`) }))
  );

  return (
    <section className="border-t border-white/[0.06] py-14">
      <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {t("title")}
      </p>
      <div className="marquee relative overflow-hidden">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-background to-transparent" />
        <div className="marquee-track flex w-max">
          {pills.map((p) => (
            <span
              key={p.id}
              className="mx-3 inline-flex shrink-0 items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm"
            >
              <span className="text-muted-foreground">English</span>
              <ArrowRight
                className="size-3.5 text-primary"
                aria-hidden="true"
              />
              <span className="font-semibold">{p.label}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
