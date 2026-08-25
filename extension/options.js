// GENERATED FILE — do not edit. Source: apps/chrome/src (pnpm build).
(() => {
  // ../../packages/core/src/glossary.js
  var PROTECTED_TERMS = [
    "playground",
    "prompt",
    "framework",
    "codebase",
    "commit",
    "pull request",
    "code review",
    "backend",
    "frontend",
    "workflow",
    "pipeline",
    "token",
    "embedding",
    "debug",
    "build",
    "deploy",
    "refactoring",
    "refactor",
    "feature flag",
    "context window",
    "agent"
  ];
  var TERM_RE = new RegExp(
    "\\b(" + PROTECTED_TERMS.map((t2) => t2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(
      "|"
    ) + ")\\b",
    "gi"
  );

  // ../../packages/core/src/languages.js
  var LANGUAGES = [
    { code: "af", name: "Afrikaans", english: "Afrikaans" },
    { code: "am", name: "\u12A0\u121B\u122D\u129B", english: "Amharic" },
    { code: "ar", name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", english: "Arabic" },
    { code: "az", name: "Az\u0259rbaycan", english: "Azerbaijani" },
    { code: "be", name: "\u0411\u0435\u043B\u0430\u0440\u0443\u0441\u043A\u0430\u044F", english: "Belarusian" },
    { code: "bg", name: "\u0411\u044A\u043B\u0433\u0430\u0440\u0441\u043A\u0438", english: "Bulgarian" },
    { code: "bn", name: "\u09AC\u09BE\u0982\u09B2\u09BE", english: "Bengali" },
    { code: "bs", name: "Bosanski", english: "Bosnian" },
    { code: "ca", name: "Catal\xE0", english: "Catalan" },
    { code: "cs", name: "\u010Ce\u0161tina", english: "Czech" },
    { code: "cy", name: "Cymraeg", english: "Welsh" },
    { code: "da", name: "Dansk", english: "Danish" },
    { code: "de", name: "Deutsch", english: "German" },
    { code: "el", name: "\u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC", english: "Greek" },
    { code: "en", name: "English", english: "English" },
    { code: "es", name: "Espa\xF1ol", english: "Spanish" },
    { code: "et", name: "Eesti", english: "Estonian" },
    { code: "eu", name: "Euskara", english: "Basque" },
    { code: "fa", name: "\u0641\u0627\u0631\u0633\u06CC", english: "Persian" },
    { code: "fi", name: "Suomi", english: "Finnish" },
    { code: "fr", name: "Fran\xE7ais", english: "French" },
    { code: "gl", name: "Galego", english: "Galician" },
    { code: "gu", name: "\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0", english: "Gujarati" },
    { code: "he", name: "\u05E2\u05D1\u05E8\u05D9\u05EA", english: "Hebrew" },
    { code: "hi", name: "\u0939\u093F\u0928\u094D\u0926\u0940", english: "Hindi" },
    { code: "hr", name: "Hrvatski", english: "Croatian" },
    { code: "hu", name: "Magyar", english: "Hungarian" },
    { code: "hy", name: "\u0540\u0561\u0575\u0565\u0580\u0565\u0576", english: "Armenian" },
    { code: "id", name: "Bahasa Indonesia", english: "Indonesian" },
    { code: "is", name: "\xCDslenska", english: "Icelandic" },
    { code: "it", name: "Italiano", english: "Italian" },
    { code: "ja", name: "\u65E5\u672C\u8A9E", english: "Japanese" },
    { code: "ka", name: "\u10E5\u10D0\u10E0\u10D7\u10E3\u10DA\u10D8", english: "Georgian" },
    { code: "kk", name: "\u049A\u0430\u0437\u0430\u049B\u0448\u0430", english: "Kazakh" },
    { code: "km", name: "\u1781\u17D2\u1798\u17C2\u179A", english: "Khmer" },
    { code: "kn", name: "\u0C95\u0CA8\u0CCD\u0CA8\u0CA1", english: "Kannada" },
    { code: "ko", name: "\uD55C\uAD6D\uC5B4", english: "Korean" },
    { code: "lo", name: "\u0EA5\u0EB2\u0EA7", english: "Lao" },
    { code: "lt", name: "Lietuvi\u0173", english: "Lithuanian" },
    { code: "lv", name: "Latvie\u0161u", english: "Latvian" },
    { code: "mk", name: "\u041C\u0430\u043A\u0435\u0434\u043E\u043D\u0441\u043A\u0438", english: "Macedonian" },
    { code: "ml", name: "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02", english: "Malayalam" },
    { code: "mn", name: "\u041C\u043E\u043D\u0433\u043E\u043B", english: "Mongolian" },
    { code: "mr", name: "\u092E\u0930\u093E\u0920\u0940", english: "Marathi" },
    { code: "ms", name: "Bahasa Melayu", english: "Malay" },
    { code: "my", name: "\u1019\u103C\u1014\u103A\u1019\u102C", english: "Burmese" },
    { code: "ne", name: "\u0928\u0947\u092A\u093E\u0932\u0940", english: "Nepali" },
    { code: "nl", name: "Nederlands", english: "Dutch" },
    { code: "no", name: "Norsk", english: "Norwegian" },
    { code: "pa", name: "\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40", english: "Punjabi" },
    { code: "pl", name: "Polski", english: "Polish" },
    { code: "pt", name: "Portugu\xEAs", english: "Portuguese" },
    { code: "ro", name: "Rom\xE2n\u0103", english: "Romanian" },
    { code: "ru", name: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439", english: "Russian" },
    { code: "si", name: "\u0DC3\u0DD2\u0D82\u0DC4\u0DBD", english: "Sinhala" },
    { code: "sk", name: "Sloven\u010Dina", english: "Slovak" },
    { code: "sl", name: "Sloven\u0161\u010Dina", english: "Slovenian" },
    { code: "sq", name: "Shqip", english: "Albanian" },
    { code: "sr", name: "\u0421\u0440\u043F\u0441\u043A\u0438", english: "Serbian" },
    { code: "sv", name: "Svenska", english: "Swedish" },
    { code: "sw", name: "Kiswahili", english: "Swahili" },
    { code: "ta", name: "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD", english: "Tamil" },
    { code: "te", name: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41", english: "Telugu" },
    { code: "th", name: "\u0E44\u0E17\u0E22", english: "Thai" },
    { code: "tl", name: "Tagalog", english: "Tagalog" },
    { code: "tr", name: "T\xFCrk\xE7e", english: "Turkish" },
    { code: "uk", name: "\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430", english: "Ukrainian" },
    { code: "ur", name: "\u0627\u0631\u062F\u0648", english: "Urdu" },
    { code: "uz", name: "O\u02BBzbekcha", english: "Uzbek" },
    { code: "vi", name: "Ti\u1EBFng Vi\u1EC7t", english: "Vietnamese" },
    { code: "zh", name: "\u4E2D\u6587", english: "Chinese" }
  ];
  var LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

  // ../../packages/core/src/settings.js
  var SETTINGS_VERSION = 2;
  var TARGET_LANGS = LANGUAGE_CODES;
  var SOURCE_LANGS = ["auto", ...LANGUAGE_CODES];
  var PROVIDERS = ["auto", "deepl", "googlev2"];
  var DEFAULTS = Object.freeze({
    v: SETTINGS_VERSION,
    enabled: false,
    rate: 1.1,
    duck: 12,
    voiceName: "",
    sourceLang: "auto",
    targetLang: "fr",
    subtitles: false,
    overlay: true,
    cloudFallback: true,
    autoPause: false,
    keepTerms: true,
    // Preferred paid provider when a key is configured ("auto" = none:
    // builtin then best-effort fallback).
    provider: "auto",
    // Hostnames where Voxylio must stay completely inactive.
    disabledSites: []
  });
  var clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  function normalizeHost(input) {
    let s = String(input || "").trim().toLowerCase();
    if (!s) return "";
    try {
      if (s.includes("/") || s.includes(":")) s = new URL(s.includes("://") ? s : "https://" + s).hostname;
    } catch {
    }
    s = s.replace(/^www\./, "");
    return /^[a-z0-9.-]+$/.test(s) ? s : "";
  }
  function validateSettings(patch) {
    const out = {};
    if (!patch || typeof patch !== "object") return out;
    for (const [k, v] of Object.entries(patch)) {
      switch (k) {
        case "v":
          out.v = Number(v) || SETTINGS_VERSION;
          break;
        case "enabled":
        case "subtitles":
        case "overlay":
        case "cloudFallback":
        case "autoPause":
        case "keepTerms":
          out[k] = Boolean(v);
          break;
        case "rate":
          out.rate = clamp(Number(v) || DEFAULTS.rate, 0.8, 1.6);
          break;
        case "duck":
          out.duck = clamp(Math.round(Number(v) || 0), 0, 60);
          break;
        case "voiceName":
          out.voiceName = typeof v === "string" ? v.slice(0, 200) : "";
          break;
        case "sourceLang":
          out.sourceLang = SOURCE_LANGS.includes(v) ? v : DEFAULTS.sourceLang;
          break;
        case "targetLang":
          out.targetLang = TARGET_LANGS.includes(v) ? v : DEFAULTS.targetLang;
          break;
        case "provider":
          out.provider = PROVIDERS.includes(v) ? v : "auto";
          break;
        case "disabledSites": {
          const list = Array.isArray(v) ? v : [];
          out.disabledSites = [...new Set(list.map(normalizeHost).filter(Boolean))].slice(0, 200);
          break;
        }
        default:
          break;
      }
    }
    return out;
  }
  function migrateSettings(raw) {
    const base = { ...DEFAULTS };
    const clean = validateSettings(raw);
    const settings2 = { ...base, ...clean, v: SETTINGS_VERSION };
    const hadAllKeys = raw && typeof raw === "object" && Number(raw.v) === SETTINGS_VERSION && Object.keys(DEFAULTS).every((k) => k in raw);
    return { settings: settings2, changed: !hadAllKeys };
  }

  // src/options.js
  var $ = (id) => document.getElementById(id);
  var t = (key, subs) => {
    try {
      return chrome.i18n.getMessage(key, subs) || "";
    } catch (e) {
      return "";
    }
  };
  function applyI18n() {
    for (const el of document.querySelectorAll("[data-i18n]")) {
      const msg = t(el.dataset.i18n);
      if (msg) el.textContent = msg;
    }
    for (const el of document.querySelectorAll("[data-i18n-placeholder]")) {
      const msg = t(el.dataset.i18nPlaceholder);
      if (msg) el.placeholder = msg;
    }
  }
  var settings = { ...DEFAULTS };
  function renderSites() {
    const list = $("siteList");
    list.replaceChildren();
    for (const host of settings.disabledSites) {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = host;
      const btn = document.createElement("button");
      btn.textContent = t("optSiteRemove") || "Retirer";
      btn.addEventListener("click", () => {
        const disabledSites = settings.disabledSites.filter((h) => h !== host);
        chrome.storage.sync.set({ disabledSites });
      });
      li.append(span, btn);
      list.appendChild(li);
    }
  }
  function render() {
    $("provider").value = settings.provider;
    renderSites();
  }
  function flash(el, text, ok) {
    el.textContent = text;
    el.className = "feedback " + (ok ? "ok" : "bad");
    setTimeout(() => {
      el.textContent = "";
    }, 4e3);
  }
  async function init() {
    applyI18n();
    const raw = await chrome.storage.sync.get(null);
    const migrated = migrateSettings(raw);
    settings = migrated.settings;
    if (migrated.changed) chrome.storage.sync.set(settings);
    render();
    const keys = await chrome.storage.local.get({ deeplKey: "", googleKey: "" });
    $("deeplKey").value = keys.deeplKey;
    $("googleKey").value = keys.googleKey;
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;
      let touched = false;
      for (const [k, v] of Object.entries(changes)) {
        if (k in settings) {
          settings[k] = v.newValue;
          touched = true;
        }
      }
      if (touched) render();
    });
    $("provider").addEventListener("change", (e) => {
      chrome.storage.sync.set(validateSettings({ provider: e.target.value }));
    });
    $("deeplKey").addEventListener("change", (e) => {
      chrome.storage.local.set({ deeplKey: e.target.value.trim() });
    });
    $("googleKey").addEventListener("change", (e) => {
      chrome.storage.local.set({ googleKey: e.target.value.trim() });
    });
    $("checkDeepl").addEventListener("click", async () => {
      await chrome.storage.local.set({ deeplKey: $("deeplKey").value.trim() });
      const resp = await chrome.runtime.sendMessage({ type: "deepl-usage" });
      if (resp && resp.ok) {
        flash(
          $("deeplFeedback"),
          t("optKeyOk", [String(resp.count), String(resp.limit)]) || `Cl\xE9 valide \u2014 ${resp.count} / ${resp.limit} caract\xE8res utilis\xE9s ce mois-ci.`,
          true
        );
      } else {
        flash($("deeplFeedback"), t("optKeyBad") || "Cl\xE9 invalide ou quota atteint.", false);
      }
    });
    $("siteAdd").addEventListener("click", () => {
      const host = normalizeHost($("siteInput").value);
      if (!host) return;
      $("siteInput").value = "";
      const disabledSites = [.../* @__PURE__ */ new Set([...settings.disabledSites, host])];
      chrome.storage.sync.set({ disabledSites });
    });
    $("siteInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") $("siteAdd").click();
    });
    $("exportBtn").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(settings, null, 2)], {
        type: "application/json"
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "voxylio-settings.json";
      a.click();
      URL.revokeObjectURL(a.href);
    });
    $("importBtn").addEventListener("click", () => $("importFile").click());
    $("importFile").addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file) return;
      try {
        const raw2 = JSON.parse(await file.text());
        const { settings: next } = migrateSettings(raw2);
        await chrome.storage.sync.set(next);
        flash($("backupFeedback"), t("optImported") || "R\xE9glages import\xE9s \u2713", true);
      } catch (err) {
        flash($("backupFeedback"), t("optImportBad") || "Fichier invalide.", false);
      }
    });
  }
  init();
})();
