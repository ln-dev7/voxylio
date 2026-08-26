// Voxylio hub page (app.html): history + transcripts, per-language
// voices, settings and account/stats. All rendering is DOM building —
// no innerHTML with dynamic content. Data comes from chrome.storage
// (journal/stats written by the content script) and the background's
// cached entitlements. Everything stays on-device.
import {
  DEFAULTS,
  LANGUAGES,
  LOCALES,
  PREVIEW_SAMPLES,
  VOICE_PREFIX_ALIASES,
  migrateSettings,
  validateSettings,
  normalizeHost,
  fmtTime,
  toTranscriptText,
  toSRT,
} from "@voxylio/core";
import { makeT, resolveUiLang, UI_LANGS, UI_LANG_LABELS } from "./i18n.js";

const $ = (id) => document.getElementById(id);
let t = () => "";
let uiLangResolved = "en";

function applyI18n() {
  for (const el of document.querySelectorAll("[data-i18n]")) {
    const msg = t(el.dataset.i18n);
    if (msg) el.textContent = msg;
  }
  for (const el of document.querySelectorAll("[data-i18n-placeholder]")) {
    const msg = t(el.dataset.i18nPlaceholder);
    if (msg) el.placeholder = msg;
  }
  for (const el of document.querySelectorAll("[data-i18n-title]")) {
    const msg = t(el.dataset.i18nTitle);
    if (msg) el.title = msg;
  }
  document.documentElement.lang = uiLangResolved || "en";
}

let settings = { ...DEFAULTS };
let journal = [];
let usageStats = null;
let currentSessionId = null;
let transcriptMode = "bilingual";
let voiceLang = null;

// ---------------------------------------------------------------- router

const VIEWS = ["history", "voices", "settings", "account"];

function setView(name) {
  // No hash (chrome.runtime.openOptionsPage) lands on Paramètres — this
  // page IS the options page; the popup links deep-link the other views.
  const view = VIEWS.includes(name) ? name : "settings";
  for (const v of VIEWS) {
    $("view-" + v).classList.toggle("active", v === view);
  }
  for (const btn of document.querySelectorAll(".nav-btn")) {
    btn.classList.toggle("active", btn.dataset.view === view);
  }
  if (location.hash !== "#" + view) history.replaceState(null, "", "#" + view);
  if (view === "voices") renderVoicesView();
  if (view === "account") renderAccount();
}

// ---------------------------------------------------------------- history

function sessionMatches(s, q) {
  if (!q) return true;
  const hay = (s.title + " " + s.host + " " + s.source + " " + s.target).toLowerCase();
  return hay.includes(q);
}

function renderSessions() {
  const list = $("sessionList");
  const q = ($("sessionSearch").value || "").trim().toLowerCase();
  list.replaceChildren();
  const shown = journal.filter((s) => sessionMatches(s, q));
  for (const s of shown) {
    const btn = document.createElement("button");
    btn.className = "session-item" + (s.id === currentSessionId ? " active" : "");
    const title = document.createElement("span");
    title.className = "s-title";
    title.textContent = s.title || s.host;
    const meta = document.createElement("span");
    meta.className = "s-meta";
    const pair = document.createElement("span");
    pair.className = "pair";
    pair.textContent = `${s.source === "auto" ? "auto" : s.source} → ${s.target}`;
    const date = document.createElement("span");
    date.textContent = new Date(s.startedAt || s.updatedAt).toLocaleDateString();
    const count = document.createElement("span");
    count.textContent = (s.lines || []).length + " " + (t("appLines") || "répliques");
    meta.append(pair, date, count);
    btn.append(title, meta);
    btn.addEventListener("click", () => {
      currentSessionId = s.id;
      renderSessions();
      renderTranscript();
    });
    list.appendChild(btn);
  }
  $("historyEmpty").hidden = journal.length > 0;
  $("clearAll").hidden = journal.length === 0;
  if (journal.length > 0 && !journal.some((s) => s.id === currentSessionId)) {
    currentSessionId = shown.length ? shown[0].id : journal[0].id;
    renderTranscript();
  }
  if (journal.length === 0) {
    currentSessionId = null;
    $("transcriptBody").hidden = true;
  }
}

function currentSession() {
  return journal.find((s) => s.id === currentSessionId) || null;
}

function renderTranscript() {
  const s = currentSession();
  $("transcriptBody").hidden = !s;
  $("historyEmpty").hidden = !!s || journal.length > 0;
  if (!s) return;
  $("tTitle").textContent = s.title || s.host;
  $("tHost").textContent = s.host;
  $("tDate").textContent = new Date(s.startedAt || s.updatedAt).toLocaleString();
  $("tPair").textContent = `${s.source === "auto" ? "auto" : s.source} → ${s.target}`;
  $("tCount").textContent = (s.lines || []).length + " " + (t("appLines") || "répliques");

  const q = ($("segFilter").value || "").trim().toLowerCase();
  const box = $("lines");
  box.replaceChildren();
  for (const line of s.lines || []) {
    if (q && !(line.src + " " + line.dst).toLowerCase().includes(q)) continue;
    const row = document.createElement("div");
    row.className = "line mode-" + transcriptMode;
    const ts = document.createElement("span");
    ts.className = "ts";
    ts.textContent = "[" + fmtTime(line.t) + "]";
    const txt = document.createElement("div");
    const src = document.createElement("div");
    src.className = "src";
    src.textContent = line.src;
    const dst = document.createElement("div");
    dst.className = "dst";
    dst.textContent = line.dst;
    txt.append(src, dst);
    row.append(ts, txt);
    box.appendChild(row);
  }
}

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function transcriptFileBase(s) {
  return (
    "voxylio-" +
    (s.host || "session").replace(/[^a-z0-9.-]+/gi, "_").slice(0, 40) +
    "-" +
    s.target
  );
}

function initHistory() {
  $("sessionSearch").addEventListener("input", renderSessions);
  $("segFilter").addEventListener("input", renderTranscript);
  $("voiceSearch").addEventListener("input", renderVoiceGrid);
  $("tsToggle").addEventListener("change", (e) => {
    document.body.classList.toggle("no-ts", !e.target.checked);
  });
  $("modeTabs").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-mode]");
    if (!btn) return;
    transcriptMode = btn.dataset.mode;
    for (const b of $("modeTabs").querySelectorAll("button"))
      b.classList.toggle("active", b === btn);
    renderTranscript();
  });
  $("copyBtn").addEventListener("click", async () => {
    const s = currentSession();
    if (!s) return;
    const withTs = $("tsToggle").checked;
    try {
      await navigator.clipboard.writeText(toTranscriptText(s, transcriptMode, withTs));
      $("copyBtn").textContent = t("appCopied") || "Copié ✓";
      setTimeout(() => {
        $("copyBtn").textContent = t("appCopy") || "Copier";
      }, 1500);
    } catch (e) {}
  });
  $("txtBtn").addEventListener("click", () => {
    const s = currentSession();
    if (!s) return;
    download(
      transcriptFileBase(s) + ".txt",
      toTranscriptText(s, transcriptMode, $("tsToggle").checked),
      "text/plain",
    );
  });
  $("srtBtn").addEventListener("click", () => {
    const s = currentSession();
    if (!s) return;
    const mode = transcriptMode === "original" ? "original" : "translation";
    download(transcriptFileBase(s) + ".srt", toSRT(s, mode), "text/plain");
  });
  $("deleteSession").addEventListener("click", () => {
    const s = currentSession();
    if (!s) return;
    journal = journal.filter((x) => x.id !== s.id);
    currentSessionId = null;
    chrome.storage.local.set({ journal });
    renderSessions();
    renderTranscript();
  });
  $("clearAll").addEventListener("click", () => {
    journal = [];
    currentSessionId = null;
    chrome.storage.local.set({ journal: [] });
    renderSessions();
    renderTranscript();
  });
}

// ---------------------------------------------------------------- voices

function voicesForLang(code) {
  const all = (typeof speechSynthesis !== "undefined" && speechSynthesis.getVoices()) || [];
  const prefixes = [code, ...(VOICE_PREFIX_ALIASES[code] || [])];
  return all.filter((v) => {
    const l = (v.lang || "").toLowerCase();
    return prefixes.some((p) => l === p || l.startsWith(p + "-") || l.startsWith(p + "_"));
  });
}

function renderLangList() {
  const list = $("langList");
  list.replaceChildren();
  for (const lang of LANGUAGES) {
    const btn = document.createElement("button");
    btn.className = "lang-item" + (lang.code === voiceLang ? " active" : "");
    const left = document.createElement("span");
    const name = document.createElement("span");
    name.className = "l-name";
    name.textContent = lang.name;
    const sub = document.createElement("span");
    sub.className = "l-sub";
    const chosen = settings.voiceByLang && settings.voiceByLang[lang.code];
    sub.textContent = chosen || (t("appVoiceAuto") || "Automatique");
    left.append(name, sub);
    btn.appendChild(left);
    if (chosen) {
      const dot = document.createElement("span");
      dot.className = "dot";
      btn.appendChild(dot);
    }
    btn.addEventListener("click", () => {
      voiceLang = lang.code;
      renderLangList();
      renderVoiceGrid();
    });
    list.appendChild(btn);
  }
}

function preview(voice, code) {
  const s = window.speechSynthesis;
  if (!s) return;
  s.cancel();
  const u = new SpeechSynthesisUtterance(PREVIEW_SAMPLES[code] || PREVIEW_SAMPLES.en);
  if (voice) u.voice = voice;
  u.lang = voice ? voice.lang : LOCALES[code] || code;
  s.speak(u);
}

function voiceCard({ name, tagList, isUsed, onUse, onPlay }) {
  const card = document.createElement("div");
  card.className = "v-card";
  const title = document.createElement("div");
  title.className = "v-name";
  const nm = document.createElement("span");
  nm.textContent = name;
  title.appendChild(nm);
  const tags = document.createElement("div");
  tags.className = "v-tags";
  for (const tag of tagList) {
    const b = document.createElement("span");
    b.className = "badge" + (tag.green ? " green" : "");
    b.textContent = tag.text;
    tags.appendChild(b);
  }
  const actions = document.createElement("div");
  actions.className = "v-actions";
  if (onPlay) {
    const play = document.createElement("button");
    play.className = "play";
    play.textContent = "▶";
    play.title = t("appPreview") || "Écouter";
    play.setAttribute("aria-label", t("appPreview") || "Écouter");
    play.addEventListener("click", onPlay);
    actions.appendChild(play);
  }
  const use = document.createElement("button");
  use.className = "btn use" + (isUsed ? " primary" : "");
  use.textContent = isUsed
    ? t("appVoiceInUse") || "Utilisée"
    : t("appUseVoice") || "Utiliser cette voix";
  use.disabled = isUsed;
  use.addEventListener("click", onUse);
  actions.appendChild(use);
  card.append(title, tags, actions);
  return card;
}

function setVoiceFor(code, name) {
  const vb = { ...(settings.voiceByLang || {}) };
  if (name) vb[code] = name;
  else delete vb[code];
  settings.voiceByLang = vb;
  const patch = { voiceByLang: vb };
  // Keep the popup's quick pick coherent for the active language.
  if (code === settings.targetLang) {
    patch.voiceName = name || "";
    settings.voiceName = patch.voiceName;
  }
  chrome.storage.sync.set(validateSettings(patch));
  renderLangList();
  renderVoiceGrid();
}

function renderVoiceGrid() {
  const lang = LANGUAGES.find((l) => l.code === voiceLang) || LANGUAGES[0];
  voiceLang = lang.code;
  $("vLangName").textContent = `${lang.name} · ${lang.english}`;
  $("vCurrent").hidden = lang.code !== settings.targetLang;
  const chosen = (settings.voiceByLang && settings.voiceByLang[lang.code]) || "";
  $("vChosen").textContent = chosen
    ? (t("appVoiceSet") || "Voix choisie :") + " " + chosen
    : t("appVoiceAutoHint") || "Voxylio choisit la meilleure voix installée.";

  const grid = $("voiceGrid");
  grid.replaceChildren();
  const q = ($("voiceSearch").value || "").trim().toLowerCase();
  const list = voicesForLang(lang.code).filter(
    (v) => !q || (v.name + " " + v.lang).toLowerCase().includes(q),
  );

  // "Automatic" card first: clears the per-language choice.
  grid.appendChild(
    voiceCard({
      name: t("appVoiceAuto") || "Automatique",
      tagList: [{ text: t("appDefaultBadge") || "Par défaut", green: !chosen }],
      isUsed: !chosen,
      onUse: () => setVoiceFor(lang.code, ""),
      onPlay: () => preview(null, lang.code),
    }),
  );
  for (const v of list) {
    grid.appendChild(
      voiceCard({
        name: v.name,
        tagList: [
          { text: v.lang },
          ...(v.localService ? [{ text: t("appLocalVoice") || "locale", green: true }] : []),
        ],
        isUsed: chosen === v.name,
        onUse: () => setVoiceFor(lang.code, v.name),
        onPlay: () => preview(v, lang.code),
      }),
    );
  }
  $("voicesEmpty").hidden = list.length > 0;
}

function renderVoicesView() {
  if (!voiceLang) voiceLang = settings.targetLang;
  renderLangList();
  renderVoiceGrid();
}

// ---------------------------------------------------------------- settings

function renderSites() {
  const list = $("siteList");
  list.replaceChildren();
  for (const host of settings.disabledSites) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = host;
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = t("optSiteRemove") || "Retirer";
    btn.addEventListener("click", () => {
      chrome.storage.sync.set({
        disabledSites: settings.disabledSites.filter((h) => h !== host),
      });
    });
    li.append(span, btn);
    list.appendChild(li);
  }
}

function flash(el, text, ok) {
  el.textContent = text;
  el.className = "feedback " + (ok ? "ok" : "bad");
  setTimeout(() => {
    el.textContent = "";
  }, 4000);
}

function initSettings() {
  $("provider").addEventListener("change", (e) => {
    chrome.storage.sync.set(validateSettings({ provider: e.target.value }));
  });
  $("keepTermsBox").checked = !!settings.keepTerms;
  $("keepTermsBox").addEventListener("change", (e) => {
    chrome.storage.sync.set(validateSettings({ keepTerms: e.target.checked }));
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
        t("optKeyOk", [String(resp.count), String(resp.limit)]) ||
          `Clé valide — ${resp.count} / ${resp.limit} caractères utilisés ce mois-ci.`,
        true,
      );
    } else {
      flash($("deeplFeedback"), t("optKeyBad") || "Clé invalide ou quota atteint.", false);
    }
  });
  // Glossary editor — plain-text lines, parsed on change:
  //   "term = translation" forces that translation;
  //   "term" alone keeps the source form verbatim.
  const glossaryToText = (list) =>
    (Array.isArray(list) ? list : [])
      .map((e) => (e.to ? `${e.from} = ${e.to}` : e.from))
      .join("\n");
  $("glossaryBox").value = glossaryToText(settings.glossary);
  $("glossaryBox").addEventListener("change", (e) => {
    const entries = e.target.value
      .split("\n")
      .map((line) => {
        const i = line.indexOf("=");
        const from = (i >= 0 ? line.slice(0, i) : line).trim();
        const to = i >= 0 ? line.slice(i + 1).trim() : "";
        return { from, to };
      })
      .filter((x) => x.from);
    const clean = validateSettings({ glossary: entries });
    chrome.storage.sync.set(clean);
    flash(
      $("glossaryFeedback"),
      t("optGlossaryCount", [String((clean.glossary || []).length)]) ||
        `${(clean.glossary || []).length} terme(s) actif(s)`,
      true,
    );
  });
  $("siteAdd").addEventListener("click", () => {
    const host = normalizeHost($("siteInput").value);
    if (!host) return;
    $("siteInput").value = "";
    chrome.storage.sync.set({
      disabledSites: [...new Set([...settings.disabledSites, host])],
    });
  });
  $("siteInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("siteAdd").click();
  });
  $("exportBtn").addEventListener("click", () => {
    // Settings only — keys are deliberately excluded.
    download("voxylio-settings.json", JSON.stringify(settings, null, 2), "application/json");
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

// ---------------------------------------------------------------- account

const openAccount = () => {
  const lang = resolveUiLang(settings.uiLang, navigator.language);
  chrome.tabs.create({
    url: `https://voxylio.lndev.me/${lang}/account?from=extension`,
  });
};

function fmtInt(n) {
  try {
    return new Intl.NumberFormat(uiLangResolved).format(n);
  } catch (e) {
    return String(n);
  }
}

// The account card's quota block: remaining / total characters for the
// two metered Pro features, plus the reset date. Hidden unless the
// server reported totals (Pro plan with the cloud actually configured).
function renderAcctQuota(ent) {
  const box = $("acctQuota");
  const rows = [
    ["acctQuotaTransVal", "acctQuotaTransFill", ent && ent.cloudCharsRemaining, ent && ent.cloudCharsTotal],
    ["acctQuotaVoiceVal", "acctQuotaVoiceFill", ent && ent.ttsCharsRemaining, ent && ent.ttsCharsTotal],
  ];
  const has =
    !!ent &&
    ent.plan === "pro" &&
    rows.some(([, , , total]) => typeof total === "number" && total > 0);
  box.hidden = !has;
  if (!has) return;
  for (const [valId, fillId, remaining, total] of rows) {
    const tot = typeof total === "number" ? total : 0;
    const rem = Math.max(0, Math.min(tot, typeof remaining === "number" ? remaining : 0));
    const pct = tot > 0 ? Math.round((rem / tot) * 100) : 0;
    $(valId).textContent = fmtInt(rem) + " / " + fmtInt(tot);
    const fill = $(fillId);
    fill.style.width = pct + "%";
    fill.classList.toggle("low", pct > 0 && pct <= 20);
    fill.classList.toggle("out", pct === 0);
  }
  const resets = $("acctQuotaResets");
  if (ent.quotaResetsAt) {
    try {
      const date = new Date(ent.quotaResetsAt).toLocaleDateString(uiLangResolved, {
        day: "numeric",
        month: "long",
      });
      resets.textContent = (t("quotaResets") || "Se réinitialise le {date}").replace(
        "{date}",
        date,
      );
    } catch (e) {
      resets.textContent = "";
    }
  } else {
    resets.textContent = "";
  }
}

async function renderAccount() {
  const plan = $("acctPlan");
  const cta = $("acctCta");
  const signout = $("acctSignout");
  try {
    const ent = await chrome.runtime.sendMessage({ type: "entitlements" });
    const linked = !!(ent && ent.linked);
    $("acctEmail").textContent = (linked && ent.email) || "";
    signout.hidden = !linked;
    renderAcctQuota(linked ? ent : null);
    if (!linked) {
      plan.textContent = t("accountNotLinked") || "Non connecté";
      plan.classList.remove("pro");
      cta.textContent = t("signIn") || "Se connecter";
    } else if (ent.plan === "pro") {
      plan.textContent = t("accountPro") || "Pro";
      plan.classList.add("pro");
      cta.textContent = t("manage") || "Gérer";
    } else {
      plan.textContent = t("accountFree") || "Gratuit";
      plan.classList.remove("pro");
      cta.textContent = t("goPro") || "Passer Pro";
    }
  } catch (e) {
    plan.textContent = t("accountNotLinked") || "Non connecté";
    signout.hidden = true;
    cta.textContent = t("signIn") || "Se connecter";
    $("acctQuota").hidden = true;
  }
  renderStats();
}

function dayKeysBack(n) {
  const out = [];
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    out.push(
      d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0"),
    );
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function langLabel(code) {
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang ? lang.name : code;
}

function renderStats() {
  const s = usageStats || { days: {}, langs: {}, totalS: 0, totalL: 0 };
  $("statMinutes").textContent = String(Math.round((s.totalS || 0) / 60));
  $("statLines").textContent = String(s.totalL || 0);
  $("statLangs").textContent = String(Object.keys(s.langs || {}).length);

  const keys = dayKeysBack(30);
  const chart = $("chart");
  chart.replaceChildren();
  let max = 0;
  let windowSeconds = 0;
  for (const k of keys) max = Math.max(max, (s.days[k] || {}).s || 0);
  for (const k of keys) {
    const sec = (s.days[k] || {}).s || 0;
    windowSeconds += sec;
    const slot = document.createElement("div");
    slot.className = "bar-slot";
    slot.title = `${k} — ${Math.round(sec / 60)} min`;
    if (sec > 0 && max > 0) {
      const bar = document.createElement("div");
      bar.style.height = Math.max(4, Math.round((sec / max) * 100)) + "%";
      bar.className = "bar";
      slot.appendChild(bar);
    }
    chart.appendChild(slot);
  }
  const fmtDay = (k) => new Date(k + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" });
  $("chartFrom").textContent = fmtDay(keys[0]);
  $("chartTo").textContent = fmtDay(keys[keys.length - 1]);
  $("chartTotal").textContent = Math.round(windowSeconds / 60) + " min";

  const top = Object.entries(s.langs || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const ol = $("topLangs");
  ol.replaceChildren();
  top.forEach(([code, lines], i) => {
    const li = document.createElement("li");
    const rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = String(i + 1);
    const name = document.createElement("span");
    name.textContent = langLabel(code);
    const cnt = document.createElement("span");
    cnt.className = "cnt";
    cnt.textContent = lines + " " + (t("appLines") || "répliques");
    li.append(rank, name, cnt);
    ol.appendChild(li);
  });
  $("topLangsEmpty").hidden = top.length > 0;
}

function initAccount() {
  $("acctCta").addEventListener("click", openAccount);
  $("acctSignout").addEventListener("click", async () => {
    await chrome.storage.local.remove(["accountToken", "entitlements"]);
    renderAccount();
  });
}

// ---------------------------------------------------------------- init

async function init() {
  const raw = await chrome.storage.sync.get(null);
  const migrated = migrateSettings(raw);
  settings = migrated.settings;
  if (migrated.changed) chrome.storage.sync.set(settings);
  uiLangResolved = resolveUiLang(settings.uiLang, navigator.language);
  t = makeT(uiLangResolved);
  applyI18n();
  try {
    $("version").textContent = "Voxylio v" + chrome.runtime.getManifest().version;
  } catch (e) {}

  // Interface-language selector (auto = browser language).
  const uiSel = $("uiLang");
  for (const code of UI_LANGS) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent =
      code === "auto"
        ? (t("uiLangAuto") || "Langue du navigateur") +
          " — " +
          (UI_LANG_LABELS[resolveUiLang("auto", navigator.language)] || "English")
        : UI_LANG_LABELS[code];
    uiSel.appendChild(opt);
  }
  uiSel.value = settings.uiLang || "auto";
  uiSel.addEventListener("change", (e) => {
    chrome.storage.sync.set(validateSettings({ uiLang: e.target.value }));
    // The whole page re-renders in the new language.
    setTimeout(() => window.location.reload(), 150);
  });

  $("provider").value = settings.provider;
  renderSites();

  const localData = await chrome.storage.local.get({
    journal: [],
    usageStats: null,
    deeplKey: "",
    googleKey: "",
  });
  journal = Array.isArray(localData.journal) ? localData.journal : [];
  usageStats = localData.usageStats;
  $("deeplKey").value = localData.deeplKey;
  $("googleKey").value = localData.googleKey;

  initHistory();
  initSettings();
  initAccount();
  renderSessions();
  renderTranscript();

  for (const btn of document.querySelectorAll(".nav-btn")) {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  }
  window.addEventListener("hashchange", () => setView(location.hash.slice(1)));
  setView(location.hash.slice(1));

  if (typeof speechSynthesis !== "undefined") {
    speechSynthesis.onvoiceschanged = () => {
      if ($("view-voices").classList.contains("active")) renderVoiceGrid();
    };
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
      let touched = false;
      for (const [k, v] of Object.entries(changes)) {
        if (k in settings) {
          settings[k] = v.newValue;
          touched = true;
        }
      }
      if (touched) {
        $("provider").value = settings.provider;
        renderSites();
        if ($("view-voices").classList.contains("active")) renderVoicesView();
      }
      return;
    }
    if (area !== "local") return;
    if (changes.journal) {
      journal = Array.isArray(changes.journal.newValue)
        ? changes.journal.newValue
        : [];
      renderSessions();
      renderTranscript();
    }
    if (changes.usageStats) {
      usageStats = changes.usageStats.newValue;
      if ($("view-account").classList.contains("active")) renderStats();
    }
    if (changes.accountToken || changes.entitlements) {
      if ($("view-account").classList.contains("active")) renderAccount();
    }
  });
}

init();
