"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/spotlight-card";
import { Link } from "@/i18n/navigation";

/**
 * Two plans, one promise: everything local stays free and account-free.
 * The toggle switches Pro between monthly and yearly billing; the CTA
 * carries the chosen plan to /account, which finishes the checkout.
 */
const FREE_FEATURES = ["f1", "f2", "f3", "f4", "f5"] as const;
const PRO_FEATURES = ["f1", "f2", "f3", "f4", "f5"] as const;

export function Pricing() {
  const t = useTranslations("Pricing");
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">{t("subtitle")}</p>

        {/* Billing toggle */}
        <div className="mt-8 inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] p-1">
          <button
            type="button"
            aria-pressed={!yearly}
            onClick={() => setYearly(false)}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
              !yearly ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("monthly")}
          </button>
          <button
            type="button"
            aria-pressed={yearly}
            onClick={() => setYearly(true)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
              yearly ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("yearly")}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                yearly ? "bg-primary/20 text-primary" : "bg-primary/15 text-primary"
              }`}
            >
              −37%
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
        {/* Free */}
        <SpotlightCard className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7">
          <p className="font-display text-lg font-semibold">{t("free.name")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("free.tagline")}</p>
          <p className="mt-5 flex items-baseline gap-1.5">
            <span className="font-display text-4xl font-semibold tracking-tight">0 €</span>
            <span className="text-sm text-muted-foreground">{t("forever")}</span>
          </p>
          <ul className="mt-6 flex-1 space-y-2.5">
            {FREE_FEATURES.map((k) => (
              <li key={k} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                {t(`free.features.${k}`)}
              </li>
            ))}
          </ul>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="mt-7 w-full rounded-full bg-white/[0.03]"
          >
            <Link href={{ pathname: "/", hash: "install" }}>
              <Download data-slot="icon" />
              {t("free.cta")}
            </Link>
          </Button>
        </SpotlightCard>

        {/* Pro */}
        <SpotlightCard className="relative flex flex-col rounded-2xl border border-primary/40 bg-primary/[0.04] p-7 shadow-[0_0_60px_rgba(30,215,96,0.12)]">
          <span className="absolute -top-3 left-7 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-black">
            <Sparkles className="size-3" aria-hidden="true" />
            {t("pro.badge")}
          </span>
          <p className="font-display text-lg font-semibold">{t("pro.name")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("pro.tagline")}</p>
          <p className="mt-5 flex items-baseline gap-1.5">
            <span className="font-display text-4xl font-semibold tracking-tight">
              {yearly ? "5 €" : "7,99 €"}
            </span>
            <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
          </p>
          <p className="mt-1 h-4 text-xs text-muted-foreground/80">
            {yearly ? t("yearlyNote") : " "}
          </p>
          <ul className="mt-4 flex-1 space-y-2.5">
            {PRO_FEATURES.map((k) => (
              <li key={k} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                {t(`pro.features.${k}`)}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-7 w-full rounded-full">
            <Link href={`/account?buy=${yearly ? "pro-yearly" : "pro"}`}>
              {t("pro.cta")}
            </Link>
          </Button>
        </SpotlightCard>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground/70">{t("note")}</p>
    </section>
  );
}
