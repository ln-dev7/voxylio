"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Cadence = "monthly" | "yearly";

const FREE_FEATURES = ["f1", "f2", "f3", "f4", "f5"] as const;
const PRO_FEATURES = ["f1", "f2", "f3", "f4", "f5"] as const;

/**
 * Two plans, one promise: everything local stays free and account-free.
 * The cadence toggle switches Pro between monthly and yearly billing;
 * the CTA carries the chosen plan to /account, which finishes checkout.
 */
export function Pricing() {
  const t = useTranslations("Pricing");
  const [cadence, setCadence] = useState<Cadence>("yearly");

  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto mb-10 flex max-w-xl flex-col items-center gap-5 text-center">
          <h2 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-pretty text-sm text-muted-foreground">{t("subtitle")}</p>

          {/* Billing cadence */}
          <div className="inline-flex items-center rounded-full border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setCadence("monthly")}
              className={cn(
                "cursor-pointer rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                cadence === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("monthly")}
            </button>
            <button
              type="button"
              onClick={() => setCadence("yearly")}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                cadence === "yearly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("yearly")}
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                −37%
              </span>
            </button>
          </div>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
          {/* Free */}
          <article className="relative flex flex-col gap-6 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-lg font-semibold tracking-tight">
                {t("free.name")}
              </h3>
              <p className="text-sm text-muted-foreground">{t("free.tagline")}</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-4xl font-semibold tracking-tight">
                0 €
              </span>
              <span className="text-sm text-muted-foreground">{t("forever")}</span>
            </div>
            <Button asChild size="lg" variant="outline" className="w-full rounded-lg">
              <Link href={{ pathname: "/", hash: "install" }}>
                <Download data-slot="icon" />
                {t("free.cta")}
              </Link>
            </Button>
            <ul className="flex flex-col gap-2 border-t border-border pt-5">
              {FREE_FEATURES.map((k) => (
                <li key={k} className="flex items-start gap-2 text-sm text-foreground">
                  <Check
                    className="mt-0.5 size-3.5 shrink-0 text-primary"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  {t(`free.features.${k}`)}
                </li>
              ))}
            </ul>
          </article>

          {/* Pro */}
          <article className="relative flex flex-col gap-6 rounded-2xl border border-primary/40 bg-card p-6 shadow-xl shadow-primary/10 ring-2 ring-primary/15">
            <span className="absolute -top-3 left-5 inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary-foreground">
              {t("pro.badge")}
            </span>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-lg font-semibold tracking-tight">
                {t("pro.name")}
              </h3>
              <p className="text-sm text-muted-foreground">{t("pro.tagline")}</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-4xl font-semibold tracking-tight tabular-nums">
                {cadence === "monthly" ? "7,99 €" : "5 €"}
              </span>
              <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
              {cadence === "yearly" && (
                <span className="ml-1.5 text-xs text-primary">{t("billedYearly")}</span>
              )}
            </div>
            <Button asChild size="lg" className="w-full rounded-lg">
              <Link
                href={`/account?buy=${cadence === "monthly" ? "pro" : "pro-yearly"}`}
              >
                {t("pro.cta")}
                <ArrowRight data-slot="icon" />
              </Link>
            </Button>
            <ul className="flex flex-col gap-2 border-t border-border pt-5">
              {PRO_FEATURES.map((k) => (
                <li key={k} className="flex items-start gap-2 text-sm text-foreground">
                  <Check
                    className="mt-0.5 size-3.5 shrink-0 text-primary"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  {t(`pro.features.${k}`)}
                </li>
              ))}
            </ul>
          </article>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground/70">{t("note")}</p>
      </div>
    </section>
  );
}
