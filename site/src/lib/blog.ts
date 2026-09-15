export const BLOG_ARTICLES = [
  {
    slug: "how-to-translate-and-dub-online-videos-in-real-time",
    publishedAt: "2026-09-15",
    readingMinutes: 8,
    image: "/blog-real-time-dubbing.png",
  },
] as const;

export const FIRST_BLOG_ARTICLE = BLOG_ARTICLES[0];

export const FIRST_BLOG_ARTICLE_PATH =
  `/blog/${FIRST_BLOG_ARTICLE.slug}` as const;
