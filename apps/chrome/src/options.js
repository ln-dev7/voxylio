// Options page: translation provider + API keys (storage.local, never
// sync), per-site disable list, settings export/import. Pure settings
// logic (validation, migration, host normalization) lives in core.
import {
  DEFAULTS,
  migrateSettings,
  normalizeHost,
  validateSettings,
} from "@voxylio/core";

const $ = (id) => document.getElementById(id);
const t = (key, subs) => {
  try {
    return chrome.i18n.getMessage(key, subs) || "";
  } catch (e) {
    return "";
  }
};

// Localize static markup (French fallback text stays in the HTML).
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

let settings = { ...DEFAULTS };

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
  }, 4000);
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

  // Keys: saved on change, storage.local ONLY.
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
        t("optKeyOk", [String(resp.count), String(resp.limit)]) ||
          `Clé valide — ${resp.count} / ${resp.limit} caractères utilisés ce mois-ci.`,
        true,
      );
    } else {
      flash($("deeplFeedback"), t("optKeyBad") || "Clé invalide ou quota atteint.", false);
    }
  });

  $("siteAdd").addEventListener("click", () => {
    const host = normalizeHost($("siteInput").value);
    if (!host) return;
    $("siteInput").value = "";
    const disabledSites = [...new Set([...settings.disabledSites, host])];
    chrome.storage.sync.set({ disabledSites });
  });
  $("siteInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("siteAdd").click();
  });

  $("exportBtn").addEventListener("click", () => {
    // Settings only — keys are deliberately excluded.
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
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
      const raw = JSON.parse(await file.text());
      const { settings: next } = migrateSettings(raw);
      await chrome.storage.sync.set(next);
      flash($("backupFeedback"), t("optImported") || "Réglages importés ✓", true);
    } catch (err) {
      flash($("backupFeedback"), t("optImportBad") || "Fichier invalide.", false);
    }
  });
}

init();
