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

/**
 * False once the extension has been reloaded/updated while this content
 * script keeps running ("Extension context invalidated"). Long-lived
 * scripts must check this in their timers and tear themselves down.
 */
export function isAlive() {
  try {
    return !!runtime?.id;
  } catch {
    return false;
  }
}

/** storage.sync.set that never throws in an orphaned context. */
export function safeSyncSet(patch) {
  try {
    storage.sync.set(patch);
  } catch {
    /* orphaned context: the new script owns the settings now */
  }
}

/** storage.local.set that never throws in an orphaned context. */
export function safeLocalSet(patch) {
  try {
    storage.local.set(patch);
  } catch {
    /* ignored */
  }
}

export { createBuiltinProvider } from "./providers/builtin.js";
export { createGtxProvider } from "./providers/gtx.js";
export { createDeeplProvider } from "./providers/deepl.js";
export { createGoogleV2Provider } from "./providers/googlev2.js";
export { createProProvider } from "./providers/pro.js";
