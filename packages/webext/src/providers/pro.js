// Voxylio Pro contextual translation. The page never talks to the
// backend directly: the background service worker holds the account
// token, checks the cached entitlements and relays to the Voxylio API,
// which meters the monthly quota and calls the AI provider server-side.
// Any refusal (not Pro, quota exhausted, provider down) fails fast here
// and the chain simply continues with the local engine — dubbing never
// stops.

import { runtime } from "../index.js";

export function createProProvider() {
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
      });
      if (resp && resp.ok) return resp.text;
      throw new Error((resp && resp.error) || "pro translate failed");
    },
  });
  return {
    id: "pro",
    kind: "pro",
    ready: (source, target) => Promise.resolve(translatorFor(source, target)),
  };
}
