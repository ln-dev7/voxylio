import Image from "next/image";
import { useTranslations } from "next-intl";
import popupPreview from "../../public/popup-preview.png";

const STEPS = ["detect", "translate", "speak"] as const;

export function HowItWorks() {
  const t = useTranslations("HowItWorks");

  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 border-t border-white/[0.06]"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
            {t("title")}
          </h2>
          <ol className="mt-10 space-y-8">
            {STEPS.map((key, i) => (
              <li key={key} className="flex gap-5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold tabular-nums text-primary">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{t(`steps.${key}.title`)}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">
                    {t(`steps.${key}.description`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-xl border border-border shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
          <Image
            src={popupPreview}
            alt="Video Dub extension popup"
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}
