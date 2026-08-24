import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

const LANGS = ["fr", "es", "it", "de", "pt"] as const;

export function LanguagesStrip() {
  const t = useTranslations("Languages");

  return (
    <section className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-3 px-4 py-14 sm:px-6">
        <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {t("title")}
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
        {LANGS.map((l) => (
          <span
            key={l}
            className="rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-semibold"
          >
            {t(`list.${l}`)}
          </span>
        ))}
      </div>
    </section>
  );
}
