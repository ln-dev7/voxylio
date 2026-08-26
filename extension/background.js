// GENERATED FILE — do not edit. Source: apps/chrome/src (pnpm build).
(() => {
  // src/background.js
  var memCache = /* @__PURE__ */ new Map();
  var MEM_CACHE_MAX = 4e3;
  function decodeBasicEntities(s) {
    return String(s).replace(/&#x([0-9a-f]{1,6});/gi, (_, h) => {
      const n = parseInt(h, 16);
      return n > 0 && n <= 1114111 ? String.fromCodePoint(n) : " ";
    }).replace(/&#(\d{1,7});/g, (_, d) => {
      const n = parseInt(d, 10);
      return n > 0 && n <= 1114111 ? String.fromCodePoint(n) : " ";
    }).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, " ");
  }
  var GTX_CODE = { he: "iw", zh: "zh-CN" };
  async function translateGtx(text, source, target) {
    const sl = GTX_CODE[source] || source || "auto";
    const tl = GTX_CODE[target] || target;
    try {
      const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + encodeURIComponent(sl) + "&tl=" + encodeURIComponent(tl) + "&dt=t&q=" + encodeURIComponent(text);
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const out = (data && data[0] ? data[0] : []).map((seg) => seg && seg[0] || "").join("");
      if (!out) throw new Error("empty translation");
      return { text: out, detected: data && data[2] || "" };
    } catch (primaryError) {
      try {
        const alt = "https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=" + encodeURIComponent(sl) + "&tl=" + encodeURIComponent(tl) + "&q=" + encodeURIComponent(text);
        const res = await fetch(alt);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        let out = "";
        let detected = "";
        if (Array.isArray(data)) {
          const first = data[0];
          if (typeof first === "string") out = first;
          else if (Array.isArray(first)) {
            out = typeof first[0] === "string" ? first[0] : "";
            detected = typeof first[1] === "string" ? first[1] : "";
          }
        }
        if (!out) throw new Error("empty translation");
        return { text: out, detected };
      } catch (e) {
        throw primaryError;
      }
    }
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
  var DEEPL_SOURCE = /* @__PURE__ */ new Set([
    "ar",
    "bg",
    "cs",
    "da",
    "de",
    "el",
    "en",
    "es",
    "et",
    "fi",
    "fr",
    "he",
    "hu",
    "id",
    "it",
    "ja",
    "ko",
    "lt",
    "lv",
    "nb",
    "nl",
    "no",
    "pl",
    "pt",
    "ro",
    "ru",
    "sk",
    "sl",
    "sv",
    "th",
    "tr",
    "uk",
    "vi",
    "zh"
  ]);
  async function translateDeepl(text, source, target, context) {
    const { deeplKey } = await getLocal({ deeplKey: "" });
    if (!deeplKey) throw new Error("no DeepL key");
    if (!DEEPL_TARGET[target]) throw new Error("DeepL: unsupported target " + target);
    const host = deeplKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
    const body = {
      text: [text],
      target_lang: DEEPL_TARGET[target]
    };
    if (typeof context === "string" && context.trim())
      body.context = context.slice(0, 1500);
    if (source && source !== "auto" && DEEPL_SOURCE.has(source))
      body.source_lang = (source === "no" ? "nb" : source).toUpperCase();
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
    const tr = data && data.translations && data.translations[0];
    const out = tr && tr.text;
    if (!out) throw new Error("empty translation");
    return {
      text: out,
      detected: (tr && tr.detected_source_language || "").toLowerCase()
    };
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
    const tr = data && data.data && data.data.translations && data.data.translations[0];
    const out = tr && tr.translatedText;
    if (!out) throw new Error("empty translation");
    return {
      text: decodeBasicEntities(out),
      detected: (tr && tr.detectedSourceLanguage || "").toLowerCase()
    };
  }
  var PROVIDERS = {
    gtx: translateGtx,
    deepl: translateDeepl,
    googlev2: translateGoogleV2
  };
  async function translateFallback(text, source, target, provider, context) {
    if (!target) throw new Error("no target language");
    const fn = PROVIDERS[provider] || translateGtx;
    const key = (provider || "gtx") + "::" + source + "->" + target + "::" + text;
    if (memCache.has(key)) return memCache.get(key);
    const p = fn(text, source, target, context);
    if (memCache.size >= MEM_CACHE_MAX) {
      let n = 0;
      for (const k of memCache.keys()) {
        memCache.delete(k);
        if (++n >= MEM_CACHE_MAX / 2) break;
      }
    }
    memCache.set(key, p);
    p.catch(() => memCache.delete(key));
    return p;
  }
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "translate") {
      translateFallback(msg.text, msg.source || "auto", msg.target, msg.provider, msg.context).then((r) => sendResponse({ ok: true, text: r.text, detected: r.detected || "" })).catch((e) => sendResponse({ ok: false, error: String(e) }));
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
    if (msg && msg.type === "translate-pro") {
      translatePro(msg).then((text) => sendResponse({ ok: true, text })).catch((e) => sendResponse({ ok: false, error: String(e && e.message) }));
      return true;
    }
    if (msg && msg.type === "translate-pro-batch") {
      translateProBatch(msg).then((items) => sendResponse({ ok: true, items })).catch((e) => sendResponse({ ok: false, error: String(e && e.message) }));
      return true;
    }
    if (msg && msg.type === "speak-pro") {
      speakPro(msg).then((r) => sendResponse({ ok: true, audio: r.audio, mime: r.mime })).catch((e) => sendResponse({ ok: false, error: String(e && e.message) }));
      return true;
    }
    if (msg && msg.type === "entitlements") {
      refreshEntitlements(!!msg.force).then(sendResponse).catch(() => sendResponse({ plan: "free", status: "none", linked: false }));
      return true;
    }
    if (msg && msg.type === "audio-grant") {
      audioApi({ op: "grant" }).then(sendResponse).catch((e) => sendResponse({ ok: false, error: String(e && e.message) }));
      return true;
    }
    if (msg && msg.type === "audio-usage") {
      audioApi({ op: "usage", seconds: msg.seconds }).then(sendResponse).catch((e) => sendResponse({ ok: false, error: String(e && e.message) }));
      return true;
    }
    if (msg && msg.type === "voxylio:link-relay" && typeof msg.token === "string" && msg.token.startsWith("vxt_")) {
      chrome.storage.local.set({ accountToken: msg.token }, () => {
        refreshEntitlements(true).then((ent) => sendResponse({ ok: true, plan: ent.plan })).catch(() => sendResponse({ ok: true, plan: "free" }));
      });
      return true;
    }
    if (msg && msg.type === "voxylio:unlink-relay") {
      chrome.storage.local.remove(
        ["accountToken", "entitlements"],
        () => sendResponse({ ok: true })
      );
      return true;
    }
  });
  var SITE_ORIGIN = "https://voxylio.lndev.me";
  var CHECK_MS = 24 * 60 * 60 * 1e3;
  var PRO_CHECK_MS = 15 * 60 * 1e3;
  var GRACE_MS = 72 * 60 * 60 * 1e3;
  function clearProFlags() {
    try {
      chrome.storage.sync.get({ proTranslation: false, proVoice: false }, (v) => {
        if (v && (v.proTranslation || v.proVoice)) {
          chrome.storage.sync.set({ proTranslation: false, proVoice: false });
        }
      });
    } catch (e) {
    }
  }
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
    const ttl = cached && cached.plan === "pro" ? PRO_CHECK_MS : CHECK_MS;
    if (cached && !force && age < ttl) return { ...cached, linked: true };
    try {
      const res = await fetch(SITE_ORIGIN + "/api/entitlements", {
        headers: { Authorization: "Bearer " + accountToken }
      });
      if (res.status === 401) {
        chrome.storage.local.remove(["accountToken", "entitlements"]);
        clearProFlags();
        return { plan: "free", status: "none", linked: false };
      }
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const ent = {
        plan: data.plan || "free",
        status: data.status || "none",
        currentPeriodEnd: data.currentPeriodEnd || null,
        email: data.email || null,
        // Cloud quota, rendered by the popup and the hub (docs/PRICING.md):
        // remaining/total characters this period, and when it resets.
        cloudCharsRemaining: data.cloudCharsRemaining ?? null,
        ttsCharsRemaining: data.ttsCharsRemaining ?? null,
        cloudCharsTotal: data.cloudCharsTotal ?? null,
        ttsCharsTotal: data.ttsCharsTotal ?? null,
        quotaResetsAt: data.quotaResetsAt || null,
        // Premium Audio minutes (no-subtitle dubbing, beta).
        audioSecondsRemaining: data.audioSecondsRemaining ?? null,
        audioSecondsTotal: data.audioSecondsTotal ?? null,
        // Full trial window; free accounts outside it are limited to the
        // big platforms (packages/core/src/plan.js). Length is set by the
        // server (TRIAL_DAYS) — the extension never hardcodes it.
        trialEndsAt: data.trialEndsAt || null,
        checkedAt: Date.now()
      };
      chrome.storage.local.set({ entitlements: ent });
      if (ent.plan !== "pro") clearProFlags();
      return { ...ent, linked: true };
    } catch (e) {
      if (cached && age < GRACE_MS) return { ...cached, linked: true, offline: true };
      return { plan: "free", status: "offline", linked: true, offline: true };
    }
  }
  var proBlockedUntil = 0;
  function proRefusal(status) {
    if (status === 402 || status === 429) {
      proBlockedUntil = Date.now() + 10 * 6e4;
      return new Error("quota exhausted");
    }
    if (status === 401 || status === 403) {
      proBlockedUntil = Date.now() + 5 * 6e4;
      return new Error("not entitled");
    }
    if (status === 503) {
      proBlockedUntil = Date.now() + 5 * 6e4;
      return new Error("provider unconfigured");
    }
    if (status === 422) {
      proBlockedUntil = Date.now() + 5 * 6e4;
      return new Error("unsupported pair");
    }
    proBlockedUntil = Date.now() + 2 * 6e4;
    return new Error("HTTP " + status);
  }
  async function proFetch(path, payload) {
    if (Date.now() < proBlockedUntil) throw new Error("pro cooling down");
    const { accountToken } = await getLocal({ accountToken: "" });
    if (!accountToken) {
      proBlockedUntil = Date.now() + 6e4;
      throw new Error("not signed in");
    }
    const res = await fetch(SITE_ORIGIN + path, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accountToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw proRefusal(res.status);
    return res.json();
  }
  async function translatePro(msg) {
    const data = await proFetch("/api/pro/translate", {
      text: String(msg.text || "").slice(0, 1200),
      before: (msg.before || []).slice(-4).map((s) => String(s).slice(0, 300)),
      after: (msg.after || []).slice(0, 2).map((s) => String(s).slice(0, 300)),
      source: msg.source || "auto",
      target: msg.target,
      secs: msg.secs > 0 ? Math.min(60, Number(msg.secs)) : void 0
    });
    if (!data || typeof data.text !== "string" || !data.text)
      throw new Error("empty translation");
    return data.text;
  }
  async function translateProBatch(msg) {
    const lines = (Array.isArray(msg.lines) ? msg.lines : []).slice(0, 8).map((l) => ({
      id: String(l && l.id),
      text: String(l && l.text || "").slice(0, 600),
      secs: l && l.secs > 0 ? Math.min(60, Number(l.secs)) : void 0
    })).filter((l) => l.text.trim());
    if (!lines.length) throw new Error("empty batch");
    let data;
    try {
      data = await proFetch("/api/pro/translate", {
        lines,
        before: (msg.before || []).slice(-3).map((s) => String(s).slice(0, 300)),
        source: msg.source || "auto",
        target: msg.target
      });
    } catch (e) {
      if (e && /HTTP 400/.test(String(e.message))) {
        proBlockedUntil = 0;
        throw new Error("batch unsupported");
      }
      throw e;
    }
    if (!data || !Array.isArray(data.items)) throw new Error("bad batch reply");
    return data.items;
  }
  var voiceBlockedUntil = 0;
  var audioBlockedUntil = 0;
  async function audioApi(payload) {
    if (Date.now() < audioBlockedUntil)
      return { ok: false, error: "cooling down" };
    const { accountToken } = await getLocal({ accountToken: "" });
    if (!accountToken) {
      audioBlockedUntil = Date.now() + 6e4;
      return { ok: false, error: "not signed in" };
    }
    const res = await fetch(SITE_ORIGIN + "/api/pro/audio", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accountToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 402 || res.status === 429) {
      audioBlockedUntil = Date.now() + 10 * 6e4;
      return { ok: false, quota: true, remainingSeconds: 0 };
    }
    if (res.status === 401 || res.status === 403) {
      audioBlockedUntil = Date.now() + 5 * 6e4;
      return { ok: false, error: "not entitled" };
    }
    if (res.status === 503) {
      audioBlockedUntil = Date.now() + 5 * 6e4;
      return { ok: false, error: "provider unavailable" };
    }
    if (!res.ok) {
      audioBlockedUntil = Date.now() + 2 * 6e4;
      return { ok: false, error: "HTTP " + res.status };
    }
    return { ok: true, ...data };
  }
  async function speakPro(msg) {
    if (Date.now() < voiceBlockedUntil) throw new Error("voice cooling down");
    const { accountToken } = await getLocal({ accountToken: "" });
    if (!accountToken) {
      voiceBlockedUntil = Date.now() + 6e4;
      throw new Error("not signed in");
    }
    const res = await fetch(SITE_ORIGIN + "/api/pro/speech", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accountToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: String(msg.text || "").slice(0, 1200),
        lang: msg.lang
      })
    });
    if (res.status === 402 || res.status === 429) {
      voiceBlockedUntil = Date.now() + 10 * 6e4;
      throw new Error("voice quota exhausted");
    }
    if (res.status === 401 || res.status === 403 || res.status === 422) {
      voiceBlockedUntil = Date.now() + 5 * 6e4;
      throw new Error("not entitled");
    }
    if (res.status === 503) {
      voiceBlockedUntil = Date.now() + 5 * 6e4;
      throw new Error("voice provider unconfigured");
    }
    if (!res.ok) throw new Error("HTTP " + res.status);
    const mime = res.headers.get("content-type") || "audio/mpeg";
    const buf = await res.arrayBuffer();
    if (!buf || buf.byteLength === 0) throw new Error("empty audio");
    const bytes = new Uint8Array(buf);
    let bin = "";
    const CHUNK = 32768;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return { audio: btoa(bin), mime };
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
