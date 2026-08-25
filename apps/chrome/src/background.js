// Service worker: online translation providers. Requests are made from
// the service worker to avoid page CORS/CSP issues, and so user-supplied
// API keys (storage.local) never reach page context.

const memCache = new Map(); // "provider::lang::text" -> translation
// getLocal(defaults) is declared in the account section below (hoisted).

// Legacy code quirks of the gtx endpoint.
const GTX_CODE = { he: "iw", zh: "zh-CN" };

// Best-effort unofficial endpoint (no key, no SLA).
async function translateGtx(text, source, target) {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
    encodeURIComponent(GTX_CODE[source] || source || "auto") +
    "&tl=" +
    encodeURIComponent(GTX_CODE[target] || target) +
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
  return out;
}

// DeepL supports a subset of the catalog, with regioned codes for some
// targets. Unsupported → fail fast so the chain moves to the fallback.
const DEEPL_TARGET = {
  ar: "AR", bg: "BG", cs: "CS", da: "DA", de: "DE", el: "EL", en: "EN-US",
  es: "ES", et: "ET", fi: "FI", fr: "FR", he: "HE", hu: "HU", id: "ID",
  it: "IT", ja: "JA", ko: "KO", lt: "LT", lv: "LV", nl: "NL", no: "NB",
  pl: "PL", pt: "PT-PT", ro: "RO", ru: "RU", sk: "SK", sl: "SL", sv: "SV",
  th: "TH", tr: "TR", uk: "UK", vi: "VI", zh: "ZH-HANS",
};

async function translateDeepl(text, source, target) {
  const { deeplKey } = await getLocal({ deeplKey: "" });
  if (!deeplKey) throw new Error("no DeepL key");
  if (!DEEPL_TARGET[target]) throw new Error("DeepL: unsupported target " + target);
  // Free keys end in ":fx" and use the api-free host.
  const host = deeplKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
  const body = {
    text: [text],
    target_lang: DEEPL_TARGET[target],
  };
  if (source && source !== "auto") body.source_lang = source.toUpperCase();
  const res = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: "DeepL-Auth-Key " + deeplKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (res.status === 456) throw new Error("DeepL quota exceeded");
  if (!res.ok) throw new Error("DeepL HTTP " + res.status);
  const data = await res.json();
  const out = data && data.translations && data.translations[0] && data.translations[0].text;
  if (!out) throw new Error("empty translation");
  return out;
}

async function translateGoogleV2(text, source, target) {
  const { googleKey } = await getLocal({ googleKey: "" });
  if (!googleKey) throw new Error("no Google key");
  const body = { q: text, target, format: "text" };
  if (source && source !== "auto") body.source = source;
  const res = await fetch(
    "https://translation.googleapis.com/language/translate/v2?key=" +
      encodeURIComponent(googleKey),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error("Google HTTP " + res.status);
  const data = await res.json();
  const out =
    data &&
    data.data &&
    data.data.translations &&
    data.data.translations[0] &&
    data.data.translations[0].translatedText;
  if (!out) throw new Error("empty translation");
  return out;
}

const PROVIDERS = {
  gtx: translateGtx,
  deepl: translateDeepl,
  googlev2: translateGoogleV2,
};

async function translateFallback(text, source, target, provider) {
  const fn = PROVIDERS[provider] || translateGtx;
  const key = (provider || "gtx") + "::" + source + "->" + target + "::" + text;
  if (memCache.has(key)) return memCache.get(key);
  const out = await fn(text, source, target);
  if (memCache.size > 5000) memCache.clear();
  memCache.set(key, out);
  return out;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "translate") {
    translateFallback(msg.text, msg.source || "auto", msg.target || "fr", msg.provider)
      .then((t) => sendResponse({ ok: true, text: t }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true; // asynchronous response
  }
  if (msg && msg.type === "deepl-usage") {
    (async () => {
      const { deeplKey } = await getLocal({ deeplKey: "" });
      if (!deeplKey) throw new Error("no key");
      const host = deeplKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
      const res = await fetch(`https://${host}/v2/usage`, {
        headers: { Authorization: "DeepL-Auth-Key " + deeplKey },
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      return { count: data.character_count ?? 0, limit: data.character_limit ?? 0 };
    })()
      .then((u) => sendResponse({ ok: true, ...u }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
  if (msg && msg.type === "translate-pro") {
    translatePro(msg)
      .then((text) => sendResponse({ ok: true, text }))
      .catch((e) => sendResponse({ ok: false, error: String(e && e.message) }));
    return true;
  }
  if (msg && msg.type === "entitlements") {
    refreshEntitlements(!!msg.force)
      .then(sendResponse)
      .catch(() => sendResponse({ plan: "free", status: "none", linked: false }));
    return true;
  }
  // Relayed by the content script running on the Voxylio site (the page
  // itself cannot know the ID of a load-unpacked copy). Internal messages
  // only ever come from our own extension contexts.
  if (
    msg &&
    msg.type === "voxylio:link-relay" &&
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
  if (msg && msg.type === "voxylio:unlink-relay") {
    chrome.storage.local.remove(["accountToken", "entitlements"], () =>
      sendResponse({ ok: true }),
    );
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
      email: data.email || null,
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

// ── Pro contextual translation relay ────────────────────────────────
// The extension never talks to the AI provider: the backend meters the
// monthly quota and holds the provider keys. When the backend refuses
// (not Pro, quota out, provider down), a short local cooldown avoids
// hammering it and the chain falls back to the local engine.

let proBlockedUntil = 0;

async function translatePro(msg) {
  if (Date.now() < proBlockedUntil) throw new Error("pro cooling down");
  const { accountToken } = await getLocal({ accountToken: "" });
  if (!accountToken) {
    proBlockedUntil = Date.now() + 60_000;
    throw new Error("not signed in");
  }
  const res = await fetch(SITE_ORIGIN + "/api/pro/translate", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accountToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: String(msg.text || "").slice(0, 1200),
      before: (msg.before || []).slice(-4).map((s) => String(s).slice(0, 300)),
      after: (msg.after || []).slice(0, 2).map((s) => String(s).slice(0, 300)),
      source: msg.source || "auto",
      target: msg.target,
    }),
  });
  if (res.status === 402 || res.status === 429) {
    // Quota exhausted: stand down for a while — dubbing continues locally.
    proBlockedUntil = Date.now() + 10 * 60_000;
    throw new Error("quota exhausted");
  }
  if (res.status === 401 || res.status === 403) {
    proBlockedUntil = Date.now() + 5 * 60_000;
    throw new Error("not entitled");
  }
  if (res.status === 503) {
    proBlockedUntil = Date.now() + 5 * 60_000;
    throw new Error("provider unconfigured");
  }
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  if (!data || typeof data.text !== "string" || !data.text)
    throw new Error("empty translation");
  return data.text;
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
