import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Aurora } from "@/components/aurora";
import { CHROME_STORE_URL } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Changelog" });
  return { title: `${t("title")} — Voxylio`, description: t("subtitle") };
}

type Tag = "new" | "improved" | "pro";

// Text lives in messages (Changelog.*); this is only the shape.
const RELEASES: Array<{
  version: string;
  id: "v180" | "v171" | "v170" | "v151";
  badge?: "latest" | "store" | "review";
  items: Array<{ key: string; tag: Tag }>;
}> = [
  {
    version: "1.8.0",
    id: "v180",
    badge: "latest",
    items: [
      { key: "trial", tag: "new" },
      { key: "freeSites", tag: "improved" },
      { key: "proSites", tag: "pro" },
      { key: "audio", tag: "pro" },
    ],
  },
  {
    version: "1.7.1",
    id: "v171",
    items: [
      { key: "flow", tag: "improved" },
      { key: "fallback", tag: "improved" },
      { key: "quota", tag: "pro" },
    ],
  },
  {
    version: "1.7.0",
    id: "v170",
    badge: "review",
    items: [
      { key: "account", tag: "new" },
      { key: "hub", tag: "new" },
      { key: "glossary", tag: "new" },
      { key: "proTranslate", tag: "pro" },
      { key: "proVoice", tag: "pro" },
      { key: "launch", tag: "improved" },
      { key: "sites", tag: "improved" },
      { key: "engine", tag: "improved" },
    ],
  },
  {
    version: "1.5.1",
    id: "v151",
    badge: "store",
    items: [
      { key: "sentences", tag: "new" },
      { key: "languages", tag: "new" },
      { key: "local", tag: "new" },
      { key: "captions", tag: "new" },
      { key: "controller", tag: "new" },
      { key: "player", tag: "new" },
    ],
  },
];

const TAG_STYLES: Record<Tag, string> = {
  new: "border-primary/30 bg-primary/10 text-primary",
  improved: "border-sky-400/30 bg-sky-400/10 text-sky-400",
  pro: "border-violet-400/30 bg-violet-400/10 text-violet-400",
};

export default async function ChangelogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Changelog" });
  const tagLabel: Record<Tag, string> = {
    new: t("tagNew"),
    improved: t("tagImproved"),
    pro: t("tagPro"),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative flex-1 overflow-hidden">
        <Aurora />
        <div className="relative mx-auto w-full max-w-3xl px-4 pb-28 pt-16 sm:px-6 sm:pt-20">
          <h1 className="text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>

          <ol className="relative mt-16 space-y-16 border-l border-border pl-8 sm:pl-12">
            {RELEASES.map((release) => (
              <li key={release.version} className="relative">
                {/* timeline dot */}
                <span
                  aria-hidden="true"
                  className="absolute -left-[37px] top-2 size-[13px] rounded-full border-2 border-primary bg-background shadow-[0_0_18px_rgba(30,215,96,0.55)] sm:-left-[53px]"
                />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h2 className="gradient-text font-display text-3xl font-bold tabular-nums tracking-tight">
                    {release.version}
                  </h2>
                  {release.badge === "latest" ? (
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                      {t("latest")}
                    </span>
                  ) : release.badge === "review" ? (
                    <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-400">
                      {t("review")}
                    </span>
                  ) : release.badge === "store" ? (
                    <a
                      href={CHROME_STORE_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t("store")}
                    </a>
                  ) : null}
                  <span className="text-sm text-muted-foreground/70">
                    {t(`${release.id}.date`)}
                  </span>
                </div>
                <p className="mt-3 max-w-xl text-pretty leading-relaxed text-muted-foreground">
                  {t(`${release.id}.summary`)}
                </p>
                <ul className="mt-7 space-y-3.5">
                  {release.items.map(({ key, tag }) => (
                    <li key={key} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${TAG_STYLES[tag]}`}
                      >
                        {tagLabel[tag]}
                      </span>
                      <span className="text-[15px] leading-relaxed text-foreground/85">
                        {t(`${release.id}.items.${key}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
