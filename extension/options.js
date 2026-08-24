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

  // ../../packages/core/src/settings.js
  var SETTINGS_VERSION = 2;
  var TARGET_LANGS = ["fr", "es", "it", "de", "pt"];
  var SOURCE_LANGS = ["auto", "en", "fr", "es", "it", "de", "pt"];
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
