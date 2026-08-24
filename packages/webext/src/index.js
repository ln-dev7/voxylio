// WebExtension adapter — the ONLY place the engine touches extension APIs.
// Chrome/Edge expose `chrome.*`; Firefox exposes `browser.*` (plus a
// partial `chrome.*`). Porting to another browser means changing this
// module, never the engine.

/* global chrome, browser */
const api =
  typeof browser !== "undefined" && browser?.runtime
    ? browser
    : typeof chrome !== "undefined"
      ? chrome
      : undefined;

if (!api) {
  throw new Error("@voxylio/webext: no extension API available");
}

export const storage = api.storage;
export const runtime = api.runtime;

/** Manifest version string, safe in every context. */
export function manifestVersion() {
  try {
    return runtime.getManifest().version || "";
  } catch {
    return "";
  }
}
