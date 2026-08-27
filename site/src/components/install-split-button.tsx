"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { BROWSERS } from "@/lib/browsers";

/**
 * Hero split button: the main segment goes straight to the Chrome
 * listing, a divider, then an arrow segment that opens the other
 * browsers — live stores as links, pending ones as "coming soon" rows.
 */
export function InstallSplitButton() {
  const t = useTranslations("Install");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const [primary, ...others] = BROWSERS;

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-stretch overflow-hidden rounded-full bg-primary text-primary-foreground shadow-[0_0_40px_rgba(30,215,96,0.25)] transition-shadow hover:shadow-[0_0_60px_rgba(30,215,96,0.4)]">
        <a
          href={primary.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center gap-2 pl-6 pr-4 text-[15px] font-medium transition-colors hover:bg-black/10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={primary.logo} alt="" className="size-5" />
          {t("addTo", { browser: primary.name })}
        </a>
        {/* the divider between the two segments — dark green, not black */}
        <span aria-hidden="true" className="w-px self-stretch dark:bg-green-500 bg-green-600" />
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t("more")}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-12 items-center px-3.5 transition-colors hover:bg-black/10"
        >
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {open && (
        <div
          role="menu"
          aria-label={t("more")}
          className="absolute left-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 text-left shadow-xl"
        >
          {others.map((b) =>
            b.url ? (
              <a
                key={b.key}
                role="menuitem"
                href={b.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-popover-foreground transition-colors hover:bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.logo} alt="" className="size-5" />
                {t("addTo", { browser: b.name })}
              </a>
            ) : (
              <div
                key={b.key}
                role="menuitem"
                aria-disabled="true"
                className="flex cursor-default items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.logo}
                  alt=""
                  className="size-5 opacity-60 saturate-[.6]"
                />
                {b.name}
                <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider">
                  {t("soon")}
                </span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
