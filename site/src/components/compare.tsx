import { useTranslations } from "next-intl";
import { Check, X, Minus } from "lucide-react";

/**
 * Honest comparison against audio-capture dubbing tools (DubTab & co):
 * we win on price, accuracy, privacy and sync; they win on coverage.
 */
const ROWS = [
  { key: "price", us: "yes", them: "no" },
  { key: "accuracy", us: "yes", them: "no" },
  { key: "privacy", us: "yes", them: "no" },
  { key: "sync", us: "yes", them: "no" },
  { key: "coverage", us: "partial", them: "yes" },
] as const;

function Mark({ kind }: { kind: "yes" | "no" | "partial" }) {
  if (kind === "yes")
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15">
        <Check className="size-3.5 text-primary" aria-hidden="true" />
      </span>
    );
  if (kind === "partial")
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/[0.07]">
        <Minus className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </span>
    );
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/[0.05]">
      <X className="size-3.5 text-muted-foreground/70" aria-hidden="true" />
    </span>
  );
}

export function Compare() {
  const t = useTranslations("Compare");

  return (
    <section className="border-t border-white/[0.06]">
      <div className="mx-auto w-full max-w-5xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
            {t("title")}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-xl border border-border">
          {/* Column headers */}
          <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-border bg-white/[0.02] text-xs font-semibold uppercase tracking-[0.12em] sm:grid-cols-[1.6fr_1fr_1fr] sm:text-[13px] sm:normal-case sm:tracking-normal">
            <div className="px-4 py-3.5 text-muted-foreground sm:px-6" />
            <div className="border-l border-border bg-primary/[0.06] px-3 py-3.5 text-primary sm:px-6">
              Video Dub
            </div>
            <div className="border-l border-border px-3 py-3.5 text-muted-foreground sm:px-6">
              {t("them")}
            </div>
          </div>
          {ROWS.map((row, i) => (
            <div
              key={row.key}
              className={`grid grid-cols-[1.2fr_1fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr] ${
                i < ROWS.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="px-4 py-4 text-sm font-medium sm:px-6">
                {t(`rows.${row.key}.label`)}
              </div>
              <div className="flex items-start gap-2.5 border-l border-border bg-primary/[0.04] px-3 py-4 sm:px-6">
                <Mark kind={row.us} />
                <span className="hidden text-[13px] leading-snug text-muted-foreground sm:block">
                  {t(`rows.${row.key}.us`)}
                </span>
              </div>
              <div className="flex items-start gap-2.5 border-l border-border px-3 py-4 sm:px-6">
                <Mark kind={row.them} />
                <span className="hidden text-[13px] leading-snug text-muted-foreground sm:block">
                  {t(`rows.${row.key}.them`)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground/70">
          {t("note")}
        </p>
      </div>
    </section>
  );
}
