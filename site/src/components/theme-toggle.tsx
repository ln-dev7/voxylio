"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", icon: Sun },
  { value: "system", icon: Monitor },
  { value: "dark", icon: Moon },
] as const;

/** Footer theme switch: light / system (default) / dark. */
export function ThemeToggle() {
  const t = useTranslations("Footer.theme");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // The active theme is only known client-side: render a neutral shell
  // until mounted to avoid a hydration mismatch.
  useEffect(() => setMounted(true), []);

  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      className="flex items-center rounded-full border border-border p-0.5"
    >
      {OPTIONS.map(({ value, icon: Icon }) => {
        const active = mounted && (theme ?? "system") === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(value)}
            title={t(value)}
            onClick={() => setTheme(value)}
            className={cn(
              "grid size-7 cursor-pointer place-items-center rounded-full transition-colors",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
