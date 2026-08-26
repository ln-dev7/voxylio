import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/spotlight-card";
import {
  CHROME_STORE_URL,
  EDGE_STORE_URL,
  FIREFOX_STORE_URL,
  SAFARI_STORE_URL,
} from "@/lib/constants";

const STEPS = ["store", "signin", "play"] as const;

// One entry per browser. An empty url (store review still pending) renders
// as a "coming soon" pill — fill the constant in lib/constants.ts and the
// same entry becomes a live store button, nothing else to change.
const BROWSERS = [
  { key: "chrome", name: "Chrome", logo: "/logos/chrome.svg", url: CHROME_STORE_URL },
  { key: "edge", name: "Edge", logo: "/logos/edge.svg", url: EDGE_STORE_URL },
  { key: "firefox", name: "Firefox", logo: "/logos/firefox.svg", url: FIREFOX_STORE_URL },
  { key: "safari", name: "Safari", logo: "/logos/safari.svg", url: SAFARI_STORE_URL },
] as const;

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
              <Button
                key={b.key}
                asChild
                size="lg"
                className="h-12 rounded-full px-6 text-[15px] shadow-[0_0_40px_rgba(30,215,96,0.25)] transition-shadow hover:shadow-[0_0_60px_rgba(30,215,96,0.4)]"
              >
                <a href={b.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.logo} alt="" className="size-5" />
                  {t("addTo", { browser: b.name })}
                </a>
              </Button>
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
