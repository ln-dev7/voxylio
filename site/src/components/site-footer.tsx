import { useTranslations } from "next-intl";
import { Logo } from "@/components/logo";
import { GITHUB_URL } from "@/lib/constants";

export function SiteFooter() {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo size={24} />
          <div className="text-sm">
            <span className="font-semibold">Video Dub</span>
            <span className="text-muted-foreground"> — {t("tagline")}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("madeBy")}{" "}
          <a
            href="https://github.com/ln-dev7"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            LN
          </a>{" "}
          · <span>{t("license")}</span> ·{" "}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
