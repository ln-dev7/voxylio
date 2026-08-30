import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { routing } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const localized = (path: string): MetadataRoute.Sitemap =>
    routing.locales.map((locale) => ({
      // No lastModified: stamping build time on every URL is a false
      // freshness signal Google learns to distrust (seo-audit).
      url: `${SITE_URL}/${locale}${path}`,
      changeFrequency: "weekly",
      priority:
        (locale === routing.defaultLocale ? 1 : 0.9) * (path ? 0.7 : 1),
      alternates: {
        languages: {
          ...Object.fromEntries(
            routing.locales.map((l) => [l, `${SITE_URL}/${l}${path}`])
          ),
          "x-default": `${SITE_URL}/${routing.defaultLocale}${path}`,
        },
      },
    }));
  return [
    ...localized(""),
    ...localized("/changelog"),
    ...localized("/privacy"),
    ...localized("/terms"),
    ...localized("/contact"),
  ];
}
