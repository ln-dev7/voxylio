import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

// og:locale per supported language (was en_US for everything non-French).
export const OG_LOCALES: Record<string, string> = {
  en: "en_US",
  fr: "fr_FR",
  de: "de_DE",
  es: "es_ES",
  it: "it_IT",
  ja: "ja_JP",
  ko: "ko_KR",
  "pt-BR": "pt_BR",
  "zh-CN": "zh_CN",
  "zh-TW": "zh_TW",
};

/**
 * Canonical + hreflang for ONE page. Next.js App Router merges metadata
 * shallowly: an `alternates` object declared in the layout is inherited
 * VERBATIM by every child page — which once gave /en/changelog a
 * canonical of /en (the homepage), telling Google to drop every subpage
 * (seo-audit: "CMS setting deep page canonical to homepage"). So each
 * page declares its own set: self-referencing canonical, reciprocal
 * hreflang across all 10 locales, and x-default (all required for the
 * cluster to count).
 */
export function pageAlternates(
  locale: string,
  path = "",
): Metadata["alternates"] {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}${path}`]),
      ),
      "x-default": `/${routing.defaultLocale}${path}`,
    },
  };
}

/**
 * Complete per-page metadata: title/description plus canonical,
 * hreflang, and OpenGraph/Twitter cards that describe THIS page (a
 * page-level `openGraph` replaces the layout's wholesale, so the full
 * object lives here once instead of half-inherited).
 */
export function pageMeta({
  locale,
  path = "",
  title,
  description,
}: {
  locale: string;
  path?: string;
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    alternates: pageAlternates(locale, path),
    openGraph: {
      type: "website",
      url: `/${locale}${path}`,
      siteName: "Voxylio",
      title,
      description,
      locale: OG_LOCALES[locale] ?? "en_US",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Voxylio" }],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@ln_dev7",
      title,
      description,
      images: ["/og.png"],
    },
  };
}
