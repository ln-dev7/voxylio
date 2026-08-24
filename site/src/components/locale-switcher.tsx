"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** FR/EN pill switcher that preserves the current pathname. */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center rounded-full border border-border p-0.5">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition-colors",
            l === locale
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
