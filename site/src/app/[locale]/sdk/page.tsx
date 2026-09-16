import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowRight,
  Braces,
  Captions,
  Check,
  Code2,
  Gauge,
  Languages,
  LockKeyhole,
  MonitorPlay,
  ShieldCheck,
  SlidersHorizontal,
  Volume2,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Aurora } from "@/components/aurora";
import { SdkAiGuide } from "@/components/sdk-ai-guide";
import { SdkPricing } from "@/components/sdk-pricing";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SpotlightCard } from "@/components/spotlight-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/constants";
import { pageMeta } from "@/lib/seo";
import {
  SDK_MONTHLY_PRICE_USD,
  SDK_PACKAGE_NAME,
  SDK_VERSION,
  SDK_YEARLY_PRICE_USD,
} from "@/lib/sdk-product";

const BENEFITS = [
  { key: "private", icon: ShieldCheck },
  { key: "predictable", icon: Gauge },
  { key: "native", icon: Volume2 },
  { key: "control", icon: SlidersHorizontal },
] as const;

const STEPS = [
  { key: "captions", icon: Captions },
  { key: "connect", icon: Braces },
  { key: "listen", icon: Volume2 },
] as const;

const SUPPORT = [
  { key: "tracks", icon: MonitorPlay },
  { key: "translation", icon: Languages },
  { key: "player", icon: Code2 },
] as const;

const LIMITS = ["captions", "iframe", "voices", "mobile"] as const;
const FAQ = ["minutes", "privacy", "languages", "player", "billing"] as const;

const QUICK_START = `import { Voxylio } from "${SDK_PACKAGE_NAME}";

const dubbing = await Voxylio.create({
  player: videoElement,
  captions: {
    sourceLanguage: "en",
    tracks: [
      { language: "en", src: "/captions/lesson.en.vtt" },
      { language: "fr", src: "/captions/lesson.fr.vtt" },
    ],
  },
  translation: { strategy: "provided-only" },
  speech: { localOnly: true, ducking: 0.18 },
  ui: { mount: false },
  license: { key: "vx_pk_your_public_site_key" },
});

startButton.addEventListener("click", async () => {
  await dubbing.prepare({ targetLanguage: "fr" });
  await dubbing.start();
});`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Sdk" });
  return pageMeta({
    locale,
    path: "/sdk",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function SdkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Sdk" });

  const softwareApplication = {
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/${locale}/sdk#software`,
    name: "Voxylio SDK",
    softwareVersion: SDK_VERSION,
    url: `${SITE_URL}/${locale}/sdk`,
    description: t("metaDescription"),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Desktop web browsers",
    publisher: { "@type": "Organization", name: "Voxylio", url: SITE_URL },
    offers: [
      {
        "@type": "Offer",
        name: t("pricing.monthly"),
        price: String(SDK_MONTHLY_PRICE_USD),
        priceCurrency: "USD",
        category: "subscription",
      },
      {
        "@type": "Offer",
        name: t("pricing.yearly"),
        price: String(SDK_YEARLY_PRICE_USD),
        priceCurrency: "USD",
        category: "subscription",
      },
    ],
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      softwareApplication,
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/${locale}/sdk#faq`,
        inLanguage: locale,
        mainEntity: FAQ.map((key) => ({
          "@type": "Question",
          name: t(`faq.items.${key}.question`),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(`faq.items.${key}.answer`),
          },
        })),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <section className="relative overflow-hidden">
          <Aurora />
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 pb-24 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Code2 className="size-3.5" aria-hidden="true" />
                {t("hero.badge", { version: SDK_VERSION })}
              </span>
              <h1 className="mt-6 text-balance font-display text-[2.75rem] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-6xl">
                {t.rich("hero.title", {
                  accent: (chunks) => <span className="gradient-text">{chunks}</span>,
                })}
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("hero.body")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 rounded-full px-7">
                  <a href="#pricing">
                    {t("hero.ctaPricing")}
                    <ArrowRight data-slot="icon" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full bg-card px-7"
                >
                  <a href="#ai-guide">{t("hero.ctaGuide")}</a>
                </Button>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {(["local", "unmetered", "private"] as const).map((key) => (
                  <li
                    key={key}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground"
                  >
                    <Check className="size-3.5 text-primary" aria-hidden="true" />
                    {t(`hero.ticks.${key}`)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#090b0c] shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="size-2.5 rounded-full bg-red-400/80" />
                  <span className="size-2.5 rounded-full bg-amber-400/80" />
                  <span className="size-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <span className="font-mono text-[11px] text-white/45">lesson-player.ts</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[11.5px] leading-6 text-white/75 sm:p-7">
                <code>{QUICK_START}</code>
              </pre>
              <div className="grid grid-cols-3 border-t border-white/10 bg-white/[0.025]">
                {(["media", "captions", "speech"] as const).map((key) => (
                  <div key={key} className="border-r border-white/10 px-3 py-3 text-center last:border-r-0">
                    <LockKeyhole className="mx-auto size-3.5 text-primary" aria-hidden="true" />
                    <p className="mt-1.5 text-[10px] font-medium text-white/55">
                      {t(`hero.localLabels.${key}`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("benefits.title")}
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                {t("benefits.subtitle")}
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {BENEFITS.map(({ key, icon: Icon }) => (
                <SpotlightCard key={key}>
                  <span className="grid size-10 place-items-center rounded-xl border border-primary/25 bg-primary/10">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold">
                    {t(`benefits.items.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`benefits.items.${key}.body`)}
                  </p>
                </SpotlightCard>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card/35 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {t("how.eyebrow")}
              </p>
              <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("how.title")}
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                {t("how.subtitle")}
              </p>
            </div>
            <ol className="mt-12 grid gap-5 lg:grid-cols-3">
              {STEPS.map(({ key, icon: Icon }, index) => (
                <li key={key} className="relative rounded-2xl border border-border bg-background p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold">
                    {t(`how.steps.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`how.steps.${key}.body`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-border py-20 sm:py-28">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_0.85fr]">
            <div>
              <h2 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("support.title")}
              </h2>
              <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
                {t("support.subtitle")}
              </p>
              <div className="mt-8 space-y-4">
                {SUPPORT.map(({ key, icon: Icon }) => (
                  <div key={key} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4.5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-display font-semibold">
                        {t(`support.items.${key}.title`)}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {t(`support.items.${key}.body`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="self-start rounded-3xl border border-amber-500/20 bg-amber-500/[0.055] p-7 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                  <AlertTriangle className="size-5" aria-hidden="true" />
                </span>
                <h2 className="font-display text-xl font-semibold">{t("limits.title")}</h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {t("limits.intro")}
              </p>
              <ul className="mt-6 space-y-4">
                {LIMITS.map((key) => (
                  <li key={key} className="flex gap-3 text-sm leading-relaxed">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
                    {t(`limits.items.${key}`)}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <SdkPricing />
        <SdkAiGuide />

        <section className="border-t border-border py-20 sm:py-28">
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
            <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
              {t("faq.title")}
            </h2>
            <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card px-5 sm:px-7">
              {FAQ.map((key) => (
                <details key={key} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none">
                    {t(`faq.items.${key}.question`)}
                    <span className="text-xl font-light text-muted-foreground transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="max-w-3xl pt-3 text-sm leading-relaxed text-muted-foreground">
                    {t(`faq.items.${key}.answer`)}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border pb-24 pt-8">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-card p-8 text-center shadow-xl shadow-primary/5 sm:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,215,96,0.12),transparent_55%)]" />
              <div className="relative">
                <h2 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  {t("final.title")}
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
                  {t("final.body")}
                </p>
                <Button asChild size="lg" className="mt-7 h-12 rounded-full px-7">
                  <Link href="/contact">
                    {t("final.cta")}
                    <ArrowRight data-slot="icon" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
