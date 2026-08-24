// Chrome's built-in on-device Translator API (content-script context).
// Per-pair instances are cached inside the provider so a chain rebuild
// never re-downloads a model.

/* global Translator */

export function createBuiltinProvider({ onBroken } = {}) {
  const instances = new Map(); // "source->target" -> Promise<translator|null>

  return {
    id: "builtin",
    kind: "local",
    ready(source, target) {
      // The built-in API needs an explicit source language.
      if (!source || source === "auto") return Promise.resolve(null);
      const key = source + "->" + target;
      if (!instances.has(key)) {
        instances.set(
          key,
          (async () => {
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
              if (onBroken) onBroken(e);
              return null;
            }
          })(),
        );
      }
      return instances.get(key);
    },
  };
}
