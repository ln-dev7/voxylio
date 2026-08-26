"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ChevronDown, ChevronUp, Languages as LanguagesIcon } from "lucide-react";
import { LANGUAGES } from "@voxylio/core";
import { Button } from "@/components/ui/button";

// The 30 most spoken/requested languages come first (5 rows on desktop);
// the rest unfolds behind "Show all". Order: global speaker counts,
// nudged by what course/video audiences actually dub into.
const POPULAR = [
  "en", "zh", "hi", "es", "fr", "ar", "bn", "pt", "ru", "ur",
  "id", "de", "ja", "ko", "vi", "tr", "it", "fa", "pl", "uk",
  "nl", "th", "sv", "ro", "el", "cs", "he", "hu", "da", "fi",
] as const;
const COLLAPSED_COUNT = POPULAR.length;

const ORDERED = [
  ...POPULAR.map((code) => LANGUAGES.find((l) => l.code === code)).filter(
    (l): l is (typeof LANGUAGES)[number] => Boolean(l),
  ),
  ...LANGUAGES.filter((l) => !(POPULAR as readonly string[]).includes(l.code)).sort(
    (a, b) => a.english.localeCompare(b.english),
  ),
];

// The full catalog straight from the engine (packages/core): the site
// can never drift from what the extension actually supports. Each card
// shows the code, the endonym, and the name in the visitor's locale
// via Intl.DisplayNames — no translation files needed for 71 names.

const PAIRS = [
  ["en", "fr"],
  ["ja", "en"],
  ["zh", "fr"],
  ["es", "de"],
  ["ar", "fr"],
  ["hi", "en"],
  ["ko", "es"],
  ["ru", "de"],
] as const;

/** ReactBits "CountUp": the number climbs when it enters the viewport. */
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = () => {
      if (started.current) return;
      started.current = true;
      const t0 = performance.now();
      const duration = 1200;
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    // Safety start: never leave a "0" on screen if the observer misses.
    const fallback = setTimeout(start, 2500);
    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, [to]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  );
}

export function LanguagesGrid() {
  const t = useTranslations("Languages");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);

  // Language names in the visitor's own language (falls back to the
  // endonym when the runtime can't name one).
  const [displayNames, setDisplayNames] = useState<Intl.DisplayNames | null>(null);
  useEffect(() => {
    try {
      setDisplayNames(new Intl.DisplayNames([locale], { type: "language" }));
    } catch {
      setDisplayNames(null);
    }
  }, [locale]);

  const localizedName = (code: string, endonym: string) => {
    try {
      const name = displayNames?.of(code);
      return name && name !== code ? name : endonym;
    } catch {
      return endonym;
    }
  };

  return (
    <section id="languages" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary">
            <LanguagesIcon className="size-6" aria-hidden="true" />
          </span>
          <h2 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.rich("title", {
              count: () => (
                <span className="text-primary">
                  <CountUp to={LANGUAGES.length} />+
                </span>
              ),
            })}
          </h2>
          <p className="text-pretty text-sm text-muted-foreground">{t("subtitle")}</p>

          {/* Any direction: a few real pairs as living proof */}
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            {PAIRS.map(([from, to]) => (
              <span
                key={`${from}-${to}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {from}
                <ArrowRight className="size-3 text-primary" aria-hidden="true" />
                <span className="text-foreground">{to}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {(expanded ? ORDERED : ORDERED.slice(0, COLLAPSED_COUNT)).map(
              (lang, i) => (
                <li
                  key={lang.code}
                  className="glare-card group relative overflow-hidden rounded-xl border border-border bg-card p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                  style={{ animationDelay: `${(i % 12) * 40}ms` }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                    {lang.code}
                  </span>
                  <p className="mt-1 truncate font-display text-sm font-semibold" lang={lang.code}>
                    {lang.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {localizedName(lang.code, lang.english)}
                  </p>
                </li>
              ),
            )}
          </ul>
          {/* Fade into the fold while collapsed */}
          {!expanded && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -bottom-1 h-36 bg-gradient-to-t from-background via-background/70 to-transparent"
            />
          )}
        </div>

        <div className="relative z-10 mt-2 flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full bg-card px-6 text-[13px] backdrop-blur-sm"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                {t("showLess")}
                <ChevronUp className="size-4" aria-hidden="true" />
              </>
            ) : (
              <>
                {t("showAll", { count: LANGUAGES.length })}
                <ChevronDown className="size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
