import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ITEMS = ["sites", "cost", "voice", "privacy", "youtube"] as const;

export function Faq() {
  const t = useTranslations("Faq");

  return (
    <section id="faq" className="scroll-mt-14 border-t border-border/60">
      <div className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
        <h2 className="text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <Accordion type="single" collapsible className="mt-10">
          {ITEMS.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="text-left text-base">
                {t(`items.${key}.question`)}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                {t(`items.${key}.answer`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
