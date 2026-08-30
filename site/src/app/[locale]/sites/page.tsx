import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, Sparkles, Captions, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageMeta } from "@/lib/seo";
import { SITE_URL, CHROME_STORE_URL } from "@/lib/constants";
import { trialDays } from "@/lib/pro";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Aurora } from "@/components/aurora";

// Proper nouns — never translated. The two lists mirror what the
// engine actually supports (packages/core/src/sites.js + native text
// tracks); update them when a site is added there.
const FREE_SITES = [
  { name: "YouTube", note: "noteYt" },
  { name: "Netflix" },
  { name: "Prime Video" },
  { name: "Disney+" },
  { name: "Twitch" },
] as const;

const PRO_SITES = [
  { name: "Udemy", note: "noteUdemy" },
  { name: "Coursera" },
  { name: "Vimeo" },
  { name: "Hulu" },
  { name: "HBO Max" },
  { name: "Peacock" },
  { name: "Dailymotion" },
  { name: "Viki" },
  { name: "LinkedIn Learning" },
  { name: "Skillshare" },
  { name: "edX" },
  { name: "Khan Academy" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Sites" });
  return pageMeta({
    locale,
    path: "/sites",
    title: `${t("title")} — Voxylio`,
    description: t("intro"),
  });
}

export default async function SitesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Sites" });
  const days = trialDays();

  // ItemList of the named platforms — unique first-party data, rendered
  // server-side so AI crawlers (which skip JS) can read it.
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/${locale}/sites#list`,
    name: t("title"),
    numberOfItems: FREE_SITES.length + PRO_SITES.length,
    itemListElement: [...FREE_SITES, ...PRO_SITES].map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative flex-1 overflow-hidden">
        <Aurora />
        <script
          type="application/ld+json"
          // Our own site names + translated title — no user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
        />
        <div className="relative mx-auto w-full max-w-4xl px-4 pb-28 pt-16 sm:px-6 sm:pt-20">
          <h1 className="text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            {t("intro")}
          </p>

          {/* Free platforms */}
          <section className="mt-14">
            <div className="flex items-center gap-2.5">
              <Check className="size-5 text-primary" aria-hidden="true" />
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {t("freeTitle")}
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
              {t("freeIntro")}
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FREE_SITES.map((s) => (
                <li
                  key={s.name}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{s.name}</span>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {t("badgeFree")}
                    </span>
                  </div>
                  {"note" in s && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {t(s.note)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Pro / trial platforms */}
          <section className="mt-14">
            <div className="flex items-center gap-2.5">
              <Sparkles className="size-5 text-violet-400" aria-hidden="true" />
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {t("proTitle")}
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
              {t("proIntro", { days })}
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PRO_SITES.map((s) => (
                <li
                  key={s.name}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{s.name}</span>
                    <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-[11px] font-semibold text-violet-400">
                      {t("badgePro")}
                    </span>
                  </div>
                  {"note" in s && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {t(s.note)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* The general rule */}
          <section className="mt-14 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2.5">
              <Captions className="size-5 text-sky-400" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold tracking-tight">
                {t("anyTitle")}
              </h2>
            </div>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
              {t("anyBody")}
            </p>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
              {t("hint")}
            </p>
          </section>

          {/* Known not to work */}
          <section className="mt-8 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2.5">
              <XCircle
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="font-display text-xl font-semibold tracking-tight">
                {t("notTitle")}
              </h2>
            </div>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
              {t("notBody")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t.rich("missing", {
                contact: (chunks) => (
                  <Link
                    href="/contact"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </section>

          {/* CTA */}
          <div className="mt-14 flex flex-wrap items-center gap-4">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              {t("cta")}
            </a>
            <Link
              href="/#pricing"
              className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t("ctaPricing")}
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
