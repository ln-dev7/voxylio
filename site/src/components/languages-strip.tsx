import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

// Mixed pairs: dubbing works between any languages, not only from English
const PAIRS = [
  ["en", "fr"],
  ["fr", "en"],
  ["es", "de"],
  ["en", "pt"],
  ["it", "en"],
  ["de", "fr"],
  ["en", "es"],
  ["pt", "it"],
] as const;

/** Infinite left-to-right marquee of language pairs. */
export function LanguagesStrip() {
  const t = useTranslations("Languages");

  // Two copies of the pill row make the marquee loop seamless.
  const pills = [0, 1].flatMap((copy) =>
    PAIRS.map(([from, to]) => ({
      id: `${copy}-${from}-${to}`,
      from: t(`list.${from}`),
      to: t(`list.${to}`),
    }))
  );

  return (
    <section className="border-t border-white/[0.06] py-14">
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
              <span className="text-muted-foreground">{p.from}</span>
              <ArrowRight
                className="size-3.5 text-primary"
                aria-hidden="true"
              />
              <span className="font-semibold">{p.to}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
