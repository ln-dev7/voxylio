import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { HowItWorks } from "@/components/how-it-works";
import { LanguagesStrip } from "@/components/languages-strip";
import { Install } from "@/components/install";
import { Faq } from "@/components/faq";
import { SiteFooter } from "@/components/site-footer";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <LanguagesStrip />
        <Install />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}
