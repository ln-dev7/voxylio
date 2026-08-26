"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleHelp,
  Cloud,
  Download,
  Gauge,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** "How pricing works": a small dialog that spells the model out —
 *  local = free forever, Pro = the cloud on top, allowances, fallback,
 *  cancellation. Opened from a discreet button under the section title. */
function PricingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Pricing.modal");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sections = [
    { icon: BadgeCheck, title: t("freeTitle"), body: t("freeBody") },
    { icon: Sparkles, title: t("proTitle"), body: t("proBody") },
    { icon: Gauge, title: t("meterTitle"), body: t("meterBody") },
    { icon: ShieldCheck, title: t("fallbackTitle"), body: t("fallbackBody") },
    { icon: Cloud, title: t("cancelTitle"), body: t("cancelBody") },
  ] as const;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      <button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-semibold tracking-tight">
              {t("title")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("intro")}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={onClose}
            aria-label={t("close")}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="mt-6 space-y-5">
          {sections.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3.5">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h4 className="text-sm font-semibold">{title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type Cadence = "monthly" | "yearly";

const FREE_FEATURES = ["f0", "f1", "f2", "f3", "f4", "f5"] as const;
const PRO_FEATURES = ["f0", "f1", "f2", "f3", "f4", "f5"] as const;

/**
 * Two plans, one promise: everything local stays free and account-free.
 * The cadence toggle switches Pro between monthly and yearly billing;
 * the CTA carries the chosen plan to /account, which finishes checkout.
 */
export function Pricing() {
  const t = useTranslations("Pricing");
  const [cadence, setCadence] = useState<Cadence>("yearly");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto mb-10 flex max-w-xl flex-col items-center gap-5 text-center">
          <h2 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-pretty text-sm text-muted-foreground">{t("subtitle")}</p>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 transition-colors hover:underline"
          >
            <CircleHelp className="size-3.5" aria-hidden="true" />
            {t("modal.trigger")}
          </button>

          {/* Billing cadence */}
          <div className="inline-flex items-center rounded-full border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setCadence("monthly")}
              aria-pressed={cadence === "monthly"}
              className={cn(
                "cursor-pointer rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                cadence === "monthly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("monthly")}
            </button>
            <button
              type="button"
              onClick={() => setCadence("yearly")}
              aria-pressed={cadence === "yearly"}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                cadence === "yearly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("yearly")}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  cadence === "yearly"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary/15 text-primary",
                )}
              >
                −27%
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
                {t("priceFree")}
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
                {cadence === "monthly" ? t("priceMonthly") : t("priceYearlyMonthly")}
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
            <p className="border-t border-border pt-4 text-[11.5px] leading-relaxed text-muted-foreground">
              {t("pro.quota")}
            </p>
          </article>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground/70">{t("note")}</p>
      </div>

      <PricingModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
