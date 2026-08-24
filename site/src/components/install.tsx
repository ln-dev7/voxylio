import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/github-icon";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GITHUB_URL } from "@/lib/constants";

const STEPS = ["clone", "load", "play"] as const;

export function Install() {
  const t = useTranslations("Install");

  return (
    <section id="install" className="scroll-mt-14 border-t border-border/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {STEPS.map((key, i) => (
            <Card key={key} className="border-border bg-card">
              <CardHeader>
                <span className="mb-2 text-2xl font-semibold tabular-nums text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <CardTitle className="text-base">
                  {t(`steps.${key}.title`)}
                </CardTitle>
                <CardDescription className="leading-relaxed">
                  {t(`steps.${key}.description`)}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Button asChild size="lg" className="rounded-full">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <GitHubIcon className="size-4" />
              {t("cta")}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
