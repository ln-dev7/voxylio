import { getTranslations } from "next-intl/server";
import { SITE_URL, CHROME_STORE_URL } from "@/lib/constants";

// The same FAQ entries the <Faq /> accordion renders — schema must
// mirror visible content (schema skill: accuracy first, never mark up
// what the page doesn't show).
const FAQ_ITEMS = [
  "sites",
  "browsers",
  "cost",
  "trial",
  "account",
  "pro",
  "quota",
  "glossary",
  "voice",
  "offline",
  "privacy",
  "youtube",
  "cancel",
] as const;

/**
 * Server-rendered JSON-LD (@graph) for the landing page: Organization,
 * WebSite, SoftwareApplication (the extension, with its free and Pro
 * offers) and FAQPage built from the exact strings the page displays.
 * No aggregateRating: we don't fabricate reviews we don't have.
 */
export async function StructuredData({
  locale,
  days,
}: {
  locale: string;
  days: number;
}) {
  const meta = await getTranslations({ locale, namespace: "Meta" });
  const faq = await getTranslations({ locale, namespace: "Faq" });

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Voxylio",
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        sameAs: ["https://github.com/ln-dev7/voxylio", CHROME_STORE_URL],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Voxylio",
        url: SITE_URL,
        inLanguage: locale,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: "Voxylio",
        description: meta("description"),
        url: `${SITE_URL}/${locale}`,
        image: `${SITE_URL}/og.png`,
        applicationCategory: "BrowserApplication",
        operatingSystem: "Chrome, Edge, Firefox, Safari (macOS)",
        installUrl: CHROME_STORE_URL,
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "USD",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "7.99",
            priceCurrency: "USD",
          },
        ],
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/${locale}#faq`,
        inLanguage: locale,
        mainEntity: FAQ_ITEMS.map((key) => ({
          "@type": "Question",
          name: faq(`items.${key}.question`, { days }),
          acceptedAnswer: {
            "@type": "Answer",
            text: faq(`items.${key}.answer`, { days }),
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output of our own translation strings — no user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
