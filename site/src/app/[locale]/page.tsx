import { setRequestLocale } from "next-intl/server";
import { trialDays } from "@/lib/pro";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { HowItWorks } from "@/components/how-it-works";
import { LanguagesGrid } from "@/components/languages-grid";
import { Compare } from "@/components/compare";
import { Pricing } from "@/components/pricing";
import { Install } from "@/components/install";
import { Faq } from "@/components/faq";
import { SiteFooter } from "@/components/site-footer";
import { StructuredData } from "@/components/structured-data";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData locale={locale} days={trialDays()} />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <LanguagesGrid />
        <Compare />
        <Pricing days={trialDays()} />
        <Install />
        <Faq days={trialDays()} />
      </main>
      <SiteFooter />
    </div>
  );
}
