import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";

// Self-hosted fonts: Inter for body, Space Grotesk for display type
const inter = localFont({
  src: "../fonts/InterVariable.woff2",
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = localFont({
  src: "../fonts/SpaceGrotesk.ttf",
  variable: "--font-space-grotesk",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enable static rendering for this locale
  setRequestLocale(locale);

  return (
    <html lang={locale} className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
