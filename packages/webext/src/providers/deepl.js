// DeepL official API, user-supplied key (BYO-key). The request itself is
// made by the background service worker, which reads the key from
// storage.local — the key never transits through page context.

import { runtime } from "../index.js";

// Targets DeepL can serve (mirror of the background's DEEPL_TARGET map):
// for anything else the provider steps aside without a failure penalty.
export const DEEPL_TARGETS = new Set([
  "ar", "bg", "cs", "da", "de", "el", "en", "es", "et", "fi", "fr", "he",
  "hu", "id", "it", "ja", "ko", "lt", "lv", "nl", "no", "pl", "pt", "ro",
  "ru", "sk", "sl", "sv", "th", "tr", "uk", "vi", "zh",
]);

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
      Promise.resolve(
        hasKey && hasKey() && DEEPL_TARGETS.has(target)
          ? translatorFor(source, target)
          : null,
      ),
  };
}
