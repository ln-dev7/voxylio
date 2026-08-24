// Best-effort online fallback via the background service worker (the
// unofficial gtx endpoint — no SLA, may break; labeled as such in the
// options UI).

import { runtime } from "../index.js";

export function createGtxProvider() {
  const translatorFor = (source, target) => ({
    translate: async (text) => {
      const resp = await runtime.sendMessage({
        type: "translate",
        provider: "gtx",
        text,
        source: source || "auto",
        target,
      });
      if (resp && resp.ok) return resp.text;
      throw new Error((resp && resp.error) || "gtx failed");
    },
  });
  return {
    id: "gtx",
    kind: "cloud",
    ready: (source, target) => Promise.resolve(translatorFor(source, target)),
  };
}
