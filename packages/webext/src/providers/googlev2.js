// Google Cloud Translation v2, user-supplied key (BYO-key). Request made
// by the background service worker; key read from storage.local there.

import { runtime } from "../index.js";

export function createGoogleV2Provider(hasKey) {
  const translatorFor = (source, target) => ({
    translate: async (text) => {
      const resp = await runtime.sendMessage({
        type: "translate",
        provider: "googlev2",
        text,
        source: source || "auto",
        target,
      });
      if (resp && resp.ok)
        return { text: resp.text, detected: resp.detected || "" };
      throw new Error((resp && resp.error) || "googlev2 failed");
    },
  });
  return {
    id: "googlev2",
    kind: "cloud",
    ready: (source, target) =>
      Promise.resolve(hasKey && hasKey() ? translatorFor(source, target) : null),
  };
}
