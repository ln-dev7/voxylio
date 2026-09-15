import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, Clock } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FIRST_BLOG_ARTICLE, FIRST_BLOG_ARTICLE_PATH } from "@/lib/blog";
import { BLOG_LOCALES, getBlogContent } from "@/lib/blog-content";
import { CHROME_STORE_URL, SITE_URL } from "@/lib/constants";

const article = FIRST_BLOG_ARTICLE;

const languageAlternates = () => ({
  ...Object.fromEntries(BLOG_LOCALES.map((locale) => [locale, `/${locale}${FIRST_BLOG_ARTICLE_PATH}`])),
  "x-default": `/en${FIRST_BLOG_ARTICLE_PATH}`,
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const content = getBlogContent(locale);
  const canonicalPath = `/${content.locale}${FIRST_BLOG_ARTICLE_PATH}`;

  return {
    title: `${content.articleTitle} — Voxylio`,
    description: content.articleDescription,
    alternates: { canonical: canonicalPath, languages: languageAlternates() },
    openGraph: {
      type: "article",
      url: canonicalPath,
      siteName: "Voxylio",
      title: content.articleTitle,
      description: content.articleDescription,
      publishedTime: article.publishedAt,
      authors: ["https://lndev.me"],
      images: [{ url: article.image, width: 1672, height: 941, alt: content.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@ln_dev7",
      title: content.articleTitle,
      description: content.articleDescription,
      images: [article.image],
    },
  };
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="scroll-mt-24 pt-6 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{children}</h2>;
}

export default async function ArticlePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = getBlogContent(locale);
  const canonicalPath = `/${content.locale}${FIRST_BLOG_ARTICLE_PATH}`;
  const articleUrl = `${SITE_URL}${canonicalPath}`;
  const date = new Intl.DateTimeFormat(content.locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${article.publishedAt}T00:00:00Z`));
  const readTime = content.readTime.replace("{minutes}", String(article.readingMinutes));

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": `${articleUrl}#article`,
      mainEntityOfPage: articleUrl,
      headline: content.articleTitle,
      description: content.articleDescription,
      image: `${SITE_URL}${article.image}`,
      datePublished: article.publishedAt,
      dateModified: article.publishedAt,
      inLanguage: content.locale,
      author: { "@type": "Person", name: "Leonel Ngoya", url: "https://lndev.me" },
      publisher: { "@type": "Organization", name: "Voxylio", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: content.locale,
      mainEntity: content.faq.map((item) => ({ "@type": "Question", name: item.title, acceptedAnswer: { "@type": "Answer", text: item.body } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Voxylio", item: `${SITE_URL}/${content.locale}` },
        { "@type": "ListItem", position: 2, name: content.blogName, item: `${SITE_URL}/${content.locale}/blog` },
        { "@type": "ListItem", position: 3, name: content.articleTitle, item: articleUrl },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <article>
          <header className="mx-auto w-full max-w-4xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" aria-hidden="true" />{content.backToBlog}
            </Link>
            <div className="mt-10 flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-primary">{content.category}</span>
              <time dateTime={article.publishedAt}>{date}</time>
              <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" aria-hidden="true" />{readTime}</span>
            </div>
            <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">{content.articleTitle}</h1>
            <p className="mt-6 max-w-3xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">{content.articleDescription}</p>
            <div className="mt-7 flex items-center gap-3 text-sm">
              <Image src="/logo.png" alt="" width={36} height={36} className="rounded-lg" />
              <div><p className="font-semibold">Leonel Ngoya</p><p className="text-muted-foreground">{content.authorRole}</p></div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-card shadow-xl sm:rounded-3xl">
              <Image src={article.image} alt={content.imageAlt} fill priority sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-5xl gap-12 px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:pt-16">
            <aside className="hidden lg:block">
              <nav className="sticky top-24 rounded-2xl border border-border bg-card p-5" aria-label={content.inThisGuide}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{content.inThisGuide}</p>
                <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {content.sections.map((section) => <li key={section.id}><a className="hover:text-foreground" href={`#${section.id}`}>{section.title}</a></li>)}
                  <li><a className="hover:text-foreground" href="#faq">{content.faqTitle}</a></li>
                </ol>
              </nav>
            </aside>

            <div className="min-w-0 space-y-6 text-[17px] leading-8 text-foreground/85">
              {content.intro.map((paragraph, index) => <p key={paragraph} className={index === 0 ? "text-xl leading-9 text-foreground" : undefined}>{paragraph}</p>)}

              {content.sections.map((section) => (
                <section key={section.id} className="space-y-6">
                  <SectionTitle id={section.id}>{section.title}</SectionTitle>
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.items && (
                    <ol className="space-y-3">
                      {section.items.map((item, index) => (
                        <li key={item.title} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
                          {section.ordered ? (
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
                          ) : (
                            <Check className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
                          )}
                          <span><strong className="text-foreground">{item.title}.</strong> {item.body}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              ))}

              <SectionTitle id="faq">{content.faqTitle}</SectionTitle>
              <div className="divide-y divide-border rounded-2xl border border-border bg-card px-5">
                {content.faq.map((item) => (
                  <section key={item.title} className="py-5">
                    <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{item.body}</p>
                  </section>
                ))}
              </div>

              <section className="mt-10 rounded-3xl border border-primary/25 bg-primary/10 p-7 sm:p-9">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{content.ctaEyebrow}</p>
                <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{content.ctaTitle}</h2>
                <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">{content.ctaBody}</p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <a href={CHROME_STORE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]">
                    {content.ctaInstall}<ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                  <Link href="/sites" className="text-sm font-semibold text-foreground underline-offset-4 hover:underline">{content.ctaSites}</Link>
                </div>
              </section>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
