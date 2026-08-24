// Service worker: fallback translation via the public Google Translate endpoint.
// Used only when Chrome's built-in translation API is not available.
// Requests are made from the service worker to avoid page CORS/CSP issues.

const memCache = new Map(); // "lang::text" -> translation

async function translateFallback(text, source, target) {
  const key = source + "->" + target + "::" + text;
  if (memCache.has(key)) return memCache.get(key);

  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
    encodeURIComponent(source || "auto") +
    "&tl=" +
    encodeURIComponent(target) +
    "&dt=t&q=" +
    encodeURIComponent(text);

  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  // data[0] = list of segments [translated, original, ...]
  const out = (data && data[0] ? data[0] : [])
    .map((seg) => (seg && seg[0]) || "")
    .join("");
  if (!out) throw new Error("empty translation");

  if (memCache.size > 5000) memCache.clear();
  memCache.set(key, out);
  return out;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "translate") {
    translateFallback(msg.text, msg.source || "auto", msg.target || "fr")
      .then((t) => sendResponse({ ok: true, text: t }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true; // asynchronous response
  }
  if (msg && msg.type === "entitlements") {
    refreshEntitlements(!!msg.force)
      .then(sendResponse)
      .catch(() => sendResponse({ plan: "free", status: "none", linked: false }));
    return true;
  }
});

// ── Account / entitlements ──────────────────────────────────────────
// Free features never need any of this: the account only unlocks Pro.
// The account page on the site relays a long-lived token here after
// Google sign-in (externally_connectable); we check the plan against
// the API at most once a day, with a 72 h offline grace window.

const SITE_ORIGIN = "https://voxylio.lndev.me";
const CHECK_MS = 24 * 60 * 60 * 1000;
const GRACE_MS = 72 * 60 * 60 * 1000;

function getLocal(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

async function refreshEntitlements(force) {
  const { accountToken, entitlements } = await getLocal([
    "accountToken",
    "entitlements",
  ]);
  if (!accountToken) return { plan: "free", status: "none", linked: false };

  const cached = entitlements || null;
  const age = cached ? Date.now() - (cached.checkedAt || 0) : Infinity;
  if (cached && !force && age < CHECK_MS) return { ...cached, linked: true };

  try {
    const res = await fetch(SITE_ORIGIN + "/api/entitlements", {
      headers: { Authorization: "Bearer " + accountToken },
    });
    if (res.status === 401) {
      // Token revoked server-side (new device linked, or sign-out):
      // unlink cleanly and fall back to free.
      chrome.storage.local.remove(["accountToken", "entitlements"]);
      return { plan: "free", status: "none", linked: false };
    }
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const ent = {
      plan: data.plan || "free",
      status: data.status || "none",
      currentPeriodEnd: data.currentPeriodEnd || null,
      checkedAt: Date.now(),
    };
    chrome.storage.local.set({ entitlements: ent });
    return { ...ent, linked: true };
  } catch (e) {
    // Offline: keep the last known plan within the grace window, never
    // cut a paying user off in the middle of a video.
    if (cached && age < GRACE_MS) return { ...cached, linked: true, offline: true };
    return { plan: "free", status: "offline", linked: true, offline: true };
  }
}

chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (!sender.url || !sender.url.startsWith(SITE_ORIGIN + "/")) return;
  if (
    msg &&
    msg.type === "voxylio:link" &&
    typeof msg.token === "string" &&
    msg.token.startsWith("vxt_")
  ) {
    chrome.storage.local.set({ accountToken: msg.token }, () => {
      refreshEntitlements(true)
        .then((ent) => sendResponse({ ok: true, plan: ent.plan }))
        .catch(() => sendResponse({ ok: true, plan: "free" }));
    });
    return true;
  }
  if (msg && msg.type === "voxylio:unlink") {
    chrome.storage.local.remove(["accountToken", "entitlements"], () =>
      sendResponse({ ok: true }),
    );
    return true;
  }
});
