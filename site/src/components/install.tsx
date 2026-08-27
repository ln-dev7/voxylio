import { useTranslations } from "next-intl";
import { SpotlightCard } from "@/components/spotlight-card";
import { BROWSERS } from "@/lib/browsers";

const STEPS = ["store", "signin", "play"] as const;

// Each live store button wears its browser's brand color (owner request).
const BTN_STYLES: Record<string, string> = {
  chrome:
    "bg-[#4285F4] hover:bg-[#3367D6] shadow-[0_0_40px_rgba(66,133,244,0.25)] hover:shadow-[0_0_60px_rgba(66,133,244,0.4)]",
  edge: "bg-[#0E9F6E] hover:bg-[#0B815A] shadow-[0_0_40px_rgba(14,159,110,0.25)] hover:shadow-[0_0_60px_rgba(14,159,110,0.4)]",
  firefox:
    "bg-[#FF7139] hover:bg-[#E8602A] shadow-[0_0_40px_rgba(255,113,57,0.25)] hover:shadow-[0_0_60px_rgba(255,113,57,0.4)]",
  safari:
    "bg-[#0891B2] hover:bg-[#0E7490] shadow-[0_0_40px_rgba(8,145,178,0.25)] hover:shadow-[0_0_60px_rgba(8,145,178,0.4)]",
};

export function Install() {
  const t = useTranslations("Install");

  return (
    <section id="install" className="scroll-mt-16 border-t border-border">
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

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {BROWSERS.map((b) =>
            b.url ? (
              <a
                key={b.key}
                href={b.url}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex h-12 items-center gap-2.5 rounded-full px-6 text-[15px] font-medium text-white transition-all ${BTN_STYLES[b.key] ?? ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.logo} alt="" className="size-5" />
                {t("addTo", { browser: b.name })}
              </a>
            ) : (
              <div
                key={b.key}
                aria-disabled="true"
                className="inline-flex h-12 cursor-default select-none items-center gap-2.5 rounded-full border border-border bg-card px-6 text-[15px] font-medium text-muted-foreground"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.logo} alt="" className="size-5 opacity-60 saturate-[.6]" />
                {b.name}
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  {t("soon")}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
