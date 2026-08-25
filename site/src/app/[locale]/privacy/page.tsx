import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GITHUB_URL } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return { title: `${t("title")} — Voxylio` };
}

const SECTIONS = ["p1", "p2", "p3", "p4", "p5"] as const;

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Privacy" });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <article className="mx-auto w-full max-w-2xl px-4 py-20 sm:px-6">
          <h1 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground/70">
            {t("updated")}
          </p>
          <p className="mt-8 leading-relaxed text-muted-foreground">
            {t("intro")}
          </p>
          {SECTIONS.map((key) => (
            <section key={key} className="mt-10">
              <h2 className="font-display text-lg font-semibold">
                {t(`${key}Title`)}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {t(key)}
              </p>
            </section>
          ))}
          <p className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
            {t("contact")}{" "}
            <a
              href={`${GITHUB_URL}/issues`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              GitHub
            </a>
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
