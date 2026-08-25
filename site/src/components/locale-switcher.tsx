"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_LABELS, routing } from "@/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Language Select (shadcn) preserving the current pathname. */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <Select
      value={locale}
      onValueChange={(next) => {
        startTransition(() => {
          router.replace(pathname, { locale: next });
        });
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label="Language"
        className="h-8 gap-1.5 rounded-full border-border bg-transparent px-3 text-xs font-semibold shadow-none"
      >
        <Languages className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {routing.locales.map((l) => (
          <SelectItem key={l} value={l} className="text-xs">
            {LOCALE_LABELS[l] ?? l.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
