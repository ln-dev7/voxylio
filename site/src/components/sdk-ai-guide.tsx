"use client";

import { useState } from "react";
import { Check, Clipboard, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SDK_INTEGRATION_PROMPT } from "@/lib/sdk-integration-prompt";

type CopyState = "idle" | "copied" | "error";

function fallbackCopy(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard unavailable");
}

export function SdkAiGuide() {
  const t = useTranslations("Sdk.aiGuide");
  const [copyState, setCopyState] = useState<CopyState>("idle");

  async function copyPrompt() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SDK_INTEGRATION_PROMPT);
      } else {
        fallbackCopy(SDK_INTEGRATION_PROMPT);
      }
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      setCopyState("error");
    }
  }

  function downloadPrompt() {
    const file = new Blob([`# Voxylio SDK — AI integration guide\n\n${SDK_INTEGRATION_PROMPT}\n`], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "voxylio-sdk-ai-integration-guide.md";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <section id="ai-guide" className="scroll-mt-24 border-t border-border py-20 sm:py-28">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            {t("body")}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {t("workflow")}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button type="button" onClick={copyPrompt} className="rounded-full">
              {copyState === "copied" ? (
                <Check data-slot="icon" />
              ) : (
                <Clipboard data-slot="icon" />
              )}
              {copyState === "copied" ? t("copied") : t("copy")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={downloadPrompt}
              className="rounded-full"
            >
              <Download data-slot="icon" />
              {t("download")}
            </Button>
          </div>
          <p className="mt-3 min-h-5 text-xs text-muted-foreground" aria-live="polite">
            {copyState === "error" ? t("copyError") : t("note")}
          </p>
          <span className="sr-only" aria-live="polite">
            {copyState === "copied"
              ? t("copied")
              : copyState === "error"
                ? t("copyError")
                : ""}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-[#090b0c] shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-red-400/80" />
              <span className="size-2.5 rounded-full bg-amber-400/80" />
              <span className="size-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <span className="font-mono text-[11px] text-white/45">
              voxylio-sdk-ai-integration-guide.md
            </span>
          </div>
          <pre className="max-h-[36rem] overflow-auto whitespace-pre-wrap p-5 font-mono text-[12px] leading-6 text-white/75 sm:p-6">
            {SDK_INTEGRATION_PROMPT}
          </pre>
        </div>
      </div>
    </section>
  );
}
