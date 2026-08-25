// GENERATED FILE — do not edit. Source: apps/chrome/src (pnpm build).
(() => {
  // src/background.js
  var memCache = /* @__PURE__ */ new Map();
  var GTX_CODE = { he: "iw", zh: "zh-CN" };
  async function translateGtx(text, source, target) {
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + encodeURIComponent(GTX_CODE[source] || source || "auto") + "&tl=" + encodeURIComponent(GTX_CODE[target] || target) + "&dt=t&q=" + encodeURIComponent(text);
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const out = (data && data[0] ? data[0] : []).map((seg) => seg && seg[0] || "").join("");
    if (!out) throw new Error("empty translation");
    return out;
  }
  var DEEPL_TARGET = {
    ar: "AR",
    bg: "BG",
    cs: "CS",
    da: "DA",
    de: "DE",
    el: "EL",
    en: "EN-US",
    es: "ES",
    et: "ET",
    fi: "FI",
    fr: "FR",
    he: "HE",
    hu: "HU",
    id: "ID",
    it: "IT",
    ja: "JA",
    ko: "KO",
    lt: "LT",
    lv: "LV",
    nl: "NL",
    no: "NB",
    pl: "PL",
    pt: "PT-PT",
    ro: "RO",
    ru: "RU",
    sk: "SK",
    sl: "SL",
    sv: "SV",
    th: "TH",
    tr: "TR",
    uk: "UK",
    vi: "VI",
    zh: "ZH-HANS"
  };
  async function translateDeepl(text, source, target) {
    const { deeplKey } = await getLocal({ deeplKey: "" });
    if (!deeplKey) throw new Error("no DeepL key");
    if (!DEEPL_TARGET[target]) throw new Error("DeepL: unsupported target " + target);
    const host = deeplKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
    const body = {
      text: [text],
      target_lang: DEEPL_TARGET[target]
    };
    if (source && source !== "auto") body.source_lang = source.toUpperCase();
    const res = await fetch(`https://${host}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: "DeepL-Auth-Key " + deeplKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
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
      "https://translation.googleapis.com/language/translate/v2?key=" + encodeURIComponent(googleKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );
    if (!res.ok) throw new Error("Google HTTP " + res.status);
    const data = await res.json();
    const out = data && data.data && data.data.translations && data.data.translations[0] && data.data.translations[0].translatedText;
    if (!out) throw new Error("empty translation");
    return out;
  }
  var PROVIDERS = {
    gtx: translateGtx,
    deepl: translateDeepl,
    googlev2: translateGoogleV2
  };
  async function translateFallback(text, source, target, provider) {
    const fn = PROVIDERS[provider] || translateGtx;
    const key = (provider || "gtx") + "::" + source + "->" + target + "::" + text;
    if (memCache.has(key)) return memCache.get(key);
    const out = await fn(text, source, target);
    if (memCache.size > 5e3) memCache.clear();
    memCache.set(key, out);
    return out;
  }
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "translate") {
      translateFallback(msg.text, msg.source || "auto", msg.target || "fr", msg.provider).then((t) => sendResponse({ ok: true, text: t })).catch((e) => sendResponse({ ok: false, error: String(e) }));
      return true;
    }
    if (msg && msg.type === "deepl-usage") {
      (async () => {
        const { deeplKey } = await getLocal({ deeplKey: "" });
        if (!deeplKey) throw new Error("no key");
        const host = deeplKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
        const res = await fetch(`https://${host}/v2/usage`, {
          headers: { Authorization: "DeepL-Auth-Key " + deeplKey }
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        return { count: data.character_count ?? 0, limit: data.character_limit ?? 0 };
      })().then((u) => sendResponse({ ok: true, ...u })).catch((e) => sendResponse({ ok: false, error: String(e) }));
      return true;
    }
    if (msg && msg.type === "entitlements") {
      refreshEntitlements(!!msg.force).then(sendResponse).catch(() => sendResponse({ plan: "free", status: "none", linked: false }));
      return true;
    }
  });
  var SITE_ORIGIN = "https://voxylio.lndev.me";
  var CHECK_MS = 24 * 60 * 60 * 1e3;
  var GRACE_MS = 72 * 60 * 60 * 1e3;
  function getLocal(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }
  async function refreshEntitlements(force) {
    const { accountToken, entitlements } = await getLocal([
      "accountToken",
      "entitlements"
    ]);
    if (!accountToken) return { plan: "free", status: "none", linked: false };
    const cached = entitlements || null;
    const age = cached ? Date.now() - (cached.checkedAt || 0) : Infinity;
    if (cached && !force && age < CHECK_MS) return { ...cached, linked: true };
    try {
      const res = await fetch(SITE_ORIGIN + "/api/entitlements", {
        headers: { Authorization: "Bearer " + accountToken }
      });
      if (res.status === 401) {
        chrome.storage.local.remove(["accountToken", "entitlements"]);
        return { plan: "free", status: "none", linked: false };
      }
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const ent = {
        plan: data.plan || "free",
        status: data.status || "none",
        currentPeriodEnd: data.currentPeriodEnd || null,
        checkedAt: Date.now()
      };
      chrome.storage.local.set({ entitlements: ent });
      return { ...ent, linked: true };
    } catch (e) {
      if (cached && age < GRACE_MS) return { ...cached, linked: true, offline: true };
      return { plan: "free", status: "offline", linked: true, offline: true };
    }
  }
  chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
    if (!sender.url || !sender.url.startsWith(SITE_ORIGIN + "/")) return;
    if (msg && msg.type === "voxylio:link" && typeof msg.token === "string" && msg.token.startsWith("vxt_")) {
      chrome.storage.local.set({ accountToken: msg.token }, () => {
        refreshEntitlements(true).then((ent) => sendResponse({ ok: true, plan: ent.plan })).catch(() => sendResponse({ ok: true, plan: "free" }));
      });
      return true;
    }
    if (msg && msg.type === "voxylio:unlink") {
      chrome.storage.local.remove(
        ["accountToken", "entitlements"],
        () => sendResponse({ ok: true })
      );
      return true;
    }
  });
})();
