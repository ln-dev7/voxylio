// DeepL official API, user-supplied key (BYO-key). The request itself is
// made by the background service worker, which reads the key from
// storage.local — the key never transits through page context.

import { runtime } from "../index.js";

export function createDeeplProvider(hasKey) {
  const translatorFor = (source, target) => ({
    translate: async (text) => {
      const resp = await runtime.sendMessage({
        type: "translate",
        provider: "deepl",
        text,
        source: source || "auto",
        target,
      });
      if (resp && resp.ok) return resp.text;
      throw new Error((resp && resp.error) || "deepl failed");
    },
  });
  return {
    id: "deepl",
    kind: "cloud",
    ready: (source, target) =>
      Promise.resolve(hasKey && hasKey() ? translatorFor(source, target) : null),
  };
}
