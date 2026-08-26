import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Mail, Bug, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SpotlightCard } from "@/components/spotlight-card";
import { GITHUB_URL } from "@/lib/constants";

const CONTACT_EMAIL = "leonelngoya@gmail.com";
const X_URL = "https://x.com/ln_dev7";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  return { title: `${t("title")} — Voxylio`, description: t("subtitle") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Contact" });

  const channels = [
    {
      key: "email",
      icon: Mail,
      href: `mailto:${CONTACT_EMAIL}`,
      action: CONTACT_EMAIL,
      external: false,
    },
    {
      key: "github",
      icon: Bug,
      href: `${GITHUB_URL}/issues`,
      action: "github.com/ln-dev7/voxylio/issues",
      external: true,
    },
    {
      key: "x",
      icon: MessageCircle,
      href: X_URL,
      action: "@ln_dev7",
      external: true,
    },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6">
          <h1 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {channels.map(({ key, icon: Icon, href, action, external }) => (
              <SpotlightCard key={key}>
                <Icon className="size-6 text-primary" aria-hidden="true" />
                <h2 className="mt-4 font-display text-base font-semibold">
                  {t(`${key}.title`)}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`${key}.description`)}
                </p>
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="mt-4 inline-block break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {action}
                </a>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
