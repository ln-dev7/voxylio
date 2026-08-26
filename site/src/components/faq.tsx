import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ITEMS = ["sites", "cost", "account", "pro", "quota", "glossary", "voice", "offline", "privacy", "youtube", "cancel"] as const;

export function Faq() {
  const t = useTranslations("Faq");

  return (
    <section id="faq" className="scroll-mt-16 border-t border-border">
      <div className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
        <h2 className="text-balance text-center font-display text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
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
