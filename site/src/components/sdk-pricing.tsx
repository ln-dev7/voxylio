"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  SDK_ANNUAL_SAVINGS_USD,
  SDK_MONTHLY_PRICE_USD,
  SDK_YEARLY_MONTHLY_EQUIVALENT_USD,
  SDK_YEARLY_PRICE_USD,
} from "@/lib/sdk-product";
import { cn } from "@/lib/utils";

type Cadence = "monthly" | "yearly";

const FEATURES = ["domain", "unlimited", "local", "api", "updates", "support"] as const;

function usd(value: number) {
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

export function SdkPricing() {
  const t = useTranslations("Sdk.pricing");
  const [cadence, setCadence] = useState<Cadence>("yearly");
  const yearly = cadence === "yearly";

  return (
    <section id="pricing" className="scroll-mt-24 border-t border-border py-20 sm:py-28">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
          <div className="mt-7 inline-flex items-center rounded-full border border-border bg-muted/40 p-1">
            {(["monthly", "yearly"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCadence(value)}
                aria-pressed={cadence === value}
                className={cn(
                  "cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  cadence === value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(value)}
                {value === "yearly" && (
                  <span className="ml-2 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {t("twoMonths")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <article className="relative mx-auto mt-10 grid max-w-4xl overflow-hidden rounded-3xl border border-primary/35 bg-card shadow-2xl shadow-primary/10 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="border-b border-border p-7 sm:p-9 lg:border-b-0 lg:border-r">
            <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {t("badge")}
            </span>
            <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">
              {t("planName")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("planBody")}
            </p>
            <div className="mt-7 flex items-end gap-2">
              <span className="font-display text-5xl font-semibold tracking-tight tabular-nums">
                {usd(yearly ? SDK_YEARLY_PRICE_USD : SDK_MONTHLY_PRICE_USD)}
              </span>
              <span className="pb-1 text-sm text-muted-foreground">
                {yearly ? t("perYear") : t("perMonth")}
              </span>
            </div>
            <p className="mt-2 min-h-5 text-xs font-medium text-primary">
              {yearly
                ? t("yearlyDetail", {
                    equivalent: usd(SDK_YEARLY_MONTHLY_EQUIVALENT_USD),
                    savings: usd(SDK_ANNUAL_SAVINGS_USD),
                  })
                : t("monthlyDetail")}
            </p>
            <Button asChild size="lg" className="mt-7 w-full rounded-full">
              <Link href="/contact">
                {t("cta")}
                <ArrowRight data-slot="icon" />
              </Link>
            </Button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
              {t("commercialNote")}
            </p>
          </div>

          <div className="p-7 sm:p-9">
            <h4 className="font-display text-lg font-semibold">{t("included")}</h4>
            <ul className="mt-5 space-y-3.5">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
                    <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  {t(`features.${feature}`)}
                </li>
              ))}
            </ul>
            <div className="mt-7 rounded-2xl border border-border bg-muted/35 p-4">
              <p className="text-sm font-semibold">{t("moreDomainsTitle")}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {t("moreDomainsBody")}
              </p>
            </div>
          </div>
        </article>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
          {t("noFree")}
        </p>
      </div>
    </section>
  );
}
