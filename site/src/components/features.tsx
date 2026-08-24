import { useTranslations } from "next-intl";
import {
  MessageSquareText,
  Cpu,
  Timer,
  AudioLines,
  SlidersHorizontal,
  Languages,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ITEMS = [
  { key: "sentences", icon: MessageSquareText },
  { key: "local", icon: Cpu },
  { key: "sync", icon: Timer },
  { key: "voices", icon: AudioLines },
  { key: "overlay", icon: SlidersHorizontal },
  { key: "languages", icon: Languages },
] as const;

export function Features() {
  const t = useTranslations("Features");

  return (
    <section id="features" className="scroll-mt-14 border-t border-border/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map(({ key, icon: Icon }) => (
            <Card key={key} className="border-border bg-card">
              <CardHeader>
                <span className="mb-2 grid size-9 place-items-center rounded-lg border border-primary/25 bg-primary/10">
                  <Icon className="size-4.5 text-primary" aria-hidden="true" />
                </span>
                <CardTitle className="text-base">
                  {t(`items.${key}.title`)}
                </CardTitle>
                <CardDescription className="leading-relaxed">
                  {t(`items.${key}.description`)}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
