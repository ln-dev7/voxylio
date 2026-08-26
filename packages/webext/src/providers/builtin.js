// Chrome's built-in on-device Translator API (content-script context).
// Per-pair instances are cached inside the provider so a chain rebuild
// never re-downloads a model. A pair that FAILED is retried after a
// couple of minutes instead of latching broken forever (model downloads
// finish, networks come back).

/* global Translator */

const RETRY_MS = 120_000;

export function createBuiltinProvider({ onBroken } = {}) {
  const instances = new Map(); // "source->target" -> { p, value, at }

  return {
    id: "builtin",
    kind: "local",
    ready(source, target) {
      // The built-in API needs an explicit source language.
      if (!source || source === "auto") return Promise.resolve(null);
      const key = source + "->" + target;
      const cached = instances.get(key);
      // Reuse: pending (value undefined) or successful (value truthy).
      // A resolved null is retried once RETRY_MS has passed.
      if (cached && (cached.value !== null || Date.now() - cached.at < RETRY_MS))
        return cached.p;
      const entry = { value: undefined, at: Date.now(), p: null };
      entry.p = (async () => {
        try {
          if (typeof Translator === "undefined")
            throw new Error("no Translator API");
          const avail = await Translator.availability({
            sourceLanguage: source,
            targetLanguage: target,
          });
          if (avail === "unavailable") throw new Error("pair unavailable");
          const t = await Translator.create({
            sourceLanguage: source,
            targetLanguage: target,
          });
          return { translate: (text) => t.translate(text) };
        } catch (e) {
          if (onBroken) onBroken(e, key);
          return null;
        }
      })().then((v) => {
        entry.value = v;
        entry.at = Date.now();
        return v;
      });
      instances.set(key, entry);
      return entry.p;
    },
  };
}
