import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Aurora } from "@/components/aurora";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BLOG_ARTICLES, FIRST_BLOG_ARTICLE_PATH } from "@/lib/blog";
import { BLOG_LOCALES, getBlogContent } from "@/lib/blog-content";
import { SITE_URL } from "@/lib/constants";

const languageAlternates = (path: string) => ({
  ...Object.fromEntries(BLOG_LOCALES.map((locale) => [locale, `/${locale}${path}`])),
  "x-default": `/en${path}`,
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const content = getBlogContent(locale);
  const canonicalPath = `/${content.locale}/blog`;

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: { canonical: canonicalPath, languages: languageAlternates("/blog") },
    openGraph: {
      type: "website",
      url: canonicalPath,
      siteName: "Voxylio",
      title: content.metaTitle,
      description: content.metaDescription,
      images: [{ url: "/blog-real-time-dubbing.png", width: 1672, height: 941, alt: content.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@ln_dev7",
      title: content.metaTitle,
      description: content.metaDescription,
      images: ["/blog-real-time-dubbing.png"],
    },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = getBlogContent(locale);

  const blog = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/${content.locale}/blog#blog`,
    url: `${SITE_URL}/${content.locale}/blog`,
    inLanguage: content.locale,
    name: content.blogName,
    description: content.metaDescription,
    publisher: { "@type": "Organization", name: "Voxylio", url: SITE_URL },
    blogPost: BLOG_ARTICLES.map((article) => ({
      "@type": "BlogPosting",
      headline: content.articleTitle,
      description: content.articleDescription,
      datePublished: article.publishedAt,
      inLanguage: content.locale,
      url: `${SITE_URL}/${content.locale}/blog/${article.slug}`,
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative flex-1 overflow-hidden">
        <Aurora />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blog) }} />
        <div className="relative mx-auto w-full max-w-5xl px-4 pb-28 pt-16 sm:px-6 sm:pt-20">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{content.blogName}</p>
          <h1 className="mt-3 max-w-3xl text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">{content.indexTitle}</h1>
          <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">{content.indexIntro}</p>

          <section className="mt-14" aria-labelledby="latest-articles">
            <h2 id="latest-articles" className="sr-only">{content.latest}</h2>
            {BLOG_ARTICLES.map((article) => {
              const date = new Intl.DateTimeFormat(content.locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${article.publishedAt}T00:00:00Z`));
              const readTime = content.readTime.replace("{minutes}", String(article.readingMinutes));

              return (
                <article key={article.slug} className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-colors hover:border-primary/40">
                  <div className="grid md:grid-cols-[1.1fr_1fr]">
                    <Link href={FIRST_BLOG_ARTICLE_PATH} className="relative block aspect-video overflow-hidden md:aspect-auto md:min-h-[360px]" aria-label={content.articleTitle}>
                      <Image src={article.image} alt={content.imageAlt} fill priority sizes="(max-width: 768px) 100vw, 52vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
                    </Link>
                    <div className="flex flex-col justify-center p-7 sm:p-9">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-primary">{content.category}</span>
                        <time dateTime={article.publishedAt}>{date}</time>
                        <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" aria-hidden="true" />{readTime}</span>
                      </div>
                      <h2 className="mt-5 text-balance font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                        <Link href={FIRST_BLOG_ARTICLE_PATH} className="transition-colors group-hover:text-primary">{content.articleTitle}</Link>
                      </h2>
                      <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{content.articleExcerpt}</p>
                      <Link href={FIRST_BLOG_ARTICLE_PATH} className="mt-7 inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary">
                        {content.readGuide}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
