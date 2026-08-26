// Voxylio Pro contextual translation. The page never talks to the
// backend directly: the background service worker holds the account
// token, checks the cached entitlements and relays to the Voxylio API,
// which meters the monthly quota and calls the AI provider server-side.
// Any refusal (not Pro, quota exhausted, provider down) fails fast here
// and the chain simply continues with the local engine — dubbing never
// stops.

import { runtime } from "../index.js";

// Languages Deepgram Aura-2 can voice today. Anything else keeps the
// local system voice; Google TTS will widen this later through the same
// backend endpoint (only the server-side routing will change).
export const AURA2_LANGS = new Set(["en", "es", "de", "fr", "nl", "it", "ja"]);

export function createProProvider() {
  // While the background reports a refusal, skip the provider entirely
  // for a short while: not even the message round-trip is worth paying
  // per line when the answer is known to be "no".
  let blockedUntil = 0;

  const translatorFor = (source, target) => ({
    translate: async (text, opts) => {
      const ctx = (opts && opts.context) || {};
      const resp = await runtime.sendMessage({
        type: "translate-pro",
        text,
        before: Array.isArray(ctx.before) ? ctx.before.slice(-4) : [],
        after: Array.isArray(ctx.after) ? ctx.after.slice(0, 2) : [],
        source: source || "auto",
        target,
        secs: opts && opts.secs > 0 ? Math.min(60, opts.secs) : 0,
      });
      if (resp && resp.ok) return resp.text;
      blockedUntil = Date.now() + 20_000;
      throw new Error((resp && resp.error) || "pro translate failed");
    },
  });
  return {
    id: "pro",
    kind: "pro",
    ready: (source, target) =>
      Promise.resolve(
        Date.now() < blockedUntil ? null : translatorFor(source, target),
      ),
  };
}
