"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, LogOut, Puzzle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type Entitlement = {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
};

type ChromeRuntime = {
  runtime?: {
    sendMessage?: (
      extensionId: string,
      message: unknown,
      cb: (resp?: { ok?: boolean }) => void,
    ) => void;
    lastError?: unknown;
  };
};

// Fallback when the page↔content-script bridge gets no answer: message
// the extension directly by ID (works only for IDs listed here, so the
// bridge — which works for any installed copy — is tried first).
const STORE_EXTENSION_ID = "hahcpbcjfdanjncobfcdeidodfggggkp";

// The content script on this page relays the token to the extension's
// background, whatever its ID (store build or load-unpacked).
function linkViaBridge(token: string): Promise<boolean> {
  return new Promise((resolve) => {
    const finish = (ok: boolean) => {
      clearTimeout(timer);
      window.removeEventListener("message", onMsg);
      resolve(ok);
    };
    const onMsg = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin)
        return;
      const d = event.data as { type?: string; ok?: boolean } | null;
      if (d && d.type === "voxylio:linked") finish(!!d.ok);
    };
    const timer = setTimeout(() => finish(false), 1500);
    window.addEventListener("message", onMsg);
    window.postMessage({ type: "voxylio:link", token }, window.location.origin);
  });
}

function linkViaExtensionId(token: string): Promise<boolean> {
  return new Promise((resolve) => {
    const ids = (process.env.NEXT_PUBLIC_EXTENSION_ID || STORE_EXTENSION_ID)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const cr = (window as unknown as { chrome?: ChromeRuntime }).chrome;
    if (!cr?.runtime?.sendMessage || ids.length === 0) {
      resolve(false);
      return;
    }
    let pending = ids.length;
    let done = false;
    for (const id of ids) {
      try {
        cr.runtime.sendMessage(id, { type: "voxylio:link", token }, (resp) => {
          void cr.runtime?.lastError; // read it: silences "Unchecked runtime.lastError"
          if (!done && resp?.ok) {
            done = true;
            resolve(true);
          } else if (--pending === 0 && !done) {
            resolve(false);
          }
        });
      } catch {
        if (--pending === 0 && !done) resolve(false);
      }
    }
  });
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3a7.24 7.24 0 0 1-10.8-3.8H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.28a12 12 0 0 0 0 10.76l3.99-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44A11.98 11.98 0 0 0 1.28 6.62l3.99 3.1A7.17 7.17 0 0 1 12 4.77Z"
      />
    </svg>
  );
}

export function AccountView() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const { data: session, isPending } = authClient.useSession();

  const [ent, setEnt] = useState<Entitlement | null>(null);
  const [ext, setExt] = useState<
    "idle" | "linking" | "linked" | "missing" | "error"
  >("idle");
  const [justPaid, setJustPaid] = useState(false);

  const loadEntitlements = useCallback(async () => {
    try {
      const res = await fetch("/api/entitlements");
      if (res.ok) setEnt(await res.json());
    } catch {
      /* stays null: rendered as free */
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    loadEntitlements();
    // After a checkout, the webhook can lag by a few seconds: poll twice.
    if (new URLSearchParams(window.location.search).get("checkout") === "success") {
      setJustPaid(true);
      const t1 = setTimeout(loadEntitlements, 3000);
      const t2 = setTimeout(loadEntitlements, 8000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [session?.user.id, loadEntitlements]); // eslint-disable-line react-hooks/exhaustive-deps

  // Arriving from the pricing section (?buy=pro|pro-yearly): start the
  // checkout as soon as we're signed in and know the user isn't Pro yet.
  const [buying, setBuying] = useState(false);
  useEffect(() => {
    if (!session || buying || !ent || ent.plan === "pro") return;
    const buy = new URLSearchParams(window.location.search).get("buy");
    if (buy === "pro" || buy === "pro-yearly") {
      setBuying(true);
      window.location.href = `/api/checkout?plan=${buy}`;
    }
  }, [session, ent, buying]);

  const linkExtension = useCallback(async () => {
    setExt("linking");
    try {
      const res = await fetch("/api/extension/token", { method: "POST" });
      if (!res.ok) throw new Error("mint failed");
      const { token } = (await res.json()) as { token: string };
      const ok = (await linkViaBridge(token)) || (await linkViaExtensionId(token));
      setExt(ok ? "linked" : "missing");
    } catch {
      setExt("error");
    }
  }, []);

  // Arriving from the extension popup: link as soon as we're signed in.
  useEffect(() => {
    if (
      session &&
      ext === "idle" &&
      new URLSearchParams(window.location.search).get("from") === "extension"
    ) {
      linkExtension();
    }
  }, [session, ext, linkExtension]);

  const pro = ent?.plan === "pro";

  return (
    <section className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {session ? t("title") : t("signedOutTitle")}
      </h1>

      {isPending ? (
        <div className="mt-8 h-40 animate-pulse rounded-2xl border border-border bg-card" />
      ) : !session ? (
        <div className="mt-6">
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {t("signedOutSubtitle")}
          </p>
          <Button
            size="lg"
            className="mt-8 h-12 rounded-full border border-border bg-card px-6 text-[15px] font-medium text-foreground shadow-sm hover:bg-accent"
            onClick={() =>
              authClient.signIn.social({
                provider: "google",
                callbackURL: `/${locale}/account${window.location.search}`,
              })
            }
          >
            <GoogleIcon className="size-5" />
            {t("signInGoogle")}
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {justPaid && !pro && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              {t("checkoutSuccess")}
            </div>
          )}

          {/* Plan */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {t("plan")}
                </p>
                <p className="mt-1.5 flex items-center gap-2 font-display text-xl font-semibold">
                  {pro ? t("planPro") : t("planFree")}
                  {pro && <Sparkles className="size-4 text-primary" />}
                </p>
                {pro && ent?.status === "canceled" && ent.currentPeriodEnd && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("statusCanceled", {
                      date: new Date(ent.currentPeriodEnd).toLocaleDateString(
                        locale,
                      ),
                    })}
                  </p>
                )}
              </div>
              {pro ? (
                <Button
                  variant="outline"
                  className="rounded-full bg-card"
                  onClick={() => {
                    window.location.href = "/api/portal";
                  }}
                >
                  {t("manage")}
                </Button>
              ) : (
                <div className="flex flex-col items-end gap-1.5">
                  <Button
                    className="rounded-full"
                    onClick={() => {
                      window.location.href = "/api/checkout?plan=pro";
                    }}
                  >
                    {t("upgrade")}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/api/checkout?plan=pro-yearly";
                    }}
                    className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    {t("upgradeYearly")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Extension link */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  <Puzzle className="size-3.5" />
                  {t("extensionTitle")}
                </p>
                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {t("extensionHint")}
                </p>
                {ext === "missing" && (
                  <p className="mt-2 text-xs text-amber-400/90">
                    {t("extensionMissing")}
                  </p>
                )}
                {ext === "error" && (
                  <p className="mt-2 text-xs text-amber-400/90">
                    {t("extensionError")}
                  </p>
                )}
                {ext === "linked" && (
                  <p className="mt-2 text-xs text-primary">
                    {t("extensionLinkedBack")}
                  </p>
                )}
              </div>
              {ext === "linked" ? (
                <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[13px] font-medium text-primary">
                  <Check className="size-3.5" />
                  {t("extensionLinked")}
                </span>
              ) : (
                <Button
                  variant="outline"
                  className="rounded-full bg-card"
                  disabled={ext === "linking"}
                  onClick={linkExtension}
                >
                  {ext === "linking" ? t("extensionLinking") : t("extensionConnect")}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-1 pt-2">
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
            <button
              type="button"
              onClick={() => authClient.signOut()}
              className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="size-3.5" />
              {t("signOut")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
