// Popup: settings surface + live status of the active tab's dubbing.
// The settings schema is shared with the options page and the content
// script (packages/core/src/settings.js). All status rendering is DOM
// building — no innerHTML with dynamic content.
import { DEFAULTS, LANGUAGES, LOCALES, PREVIEW_SAMPLES } from "@voxylio/core";
import { makeT, resolveUiLang } from "./i18n.js";

// The full catalog feeds both selects (source keeps its "auto" entry).
function populateLanguageSelects() {
  const src = $("sourceLang");
  const dst = $("lang");
  for (const l of LANGUAGES) {
    const opt = document.createElement("option");
    opt.value = l.code;
    opt.textContent = l.name;
    src.appendChild(opt);
    dst.appendChild(opt.cloneNode(true));
  }
}

const $ = (id) => document.getElementById(id);

// i18n: bundled packs (user choice > browser language > English); the
// French markup text is only a pre-init fallback.
let t = () => "";
let uiLangResolved = "en";

function applyI18n() {
  for (const el of document.querySelectorAll("[data-i18n]")) {
    const msg = t(el.dataset.i18n);
    if (msg) el.textContent = msg;
  }
  for (const el of document.querySelectorAll("[data-i18n-title]")) {
    const msg = t(el.dataset.i18nTitle);
    if (msg) {
      el.title = msg;
      if (el.hasAttribute("aria-label")) el.setAttribute("aria-label", msg);
    }
  }
  document.documentElement.lang = uiLangResolved || "en";
}

function save(patch) {
  chrome.storage.sync.set(patch);
}

// Sliders fire many events: throttle writes to stay within the
// chrome.storage.sync quota.
let saveTimer = null;
let pendingPatch = {};
function saveDebounced(patch) {
  Object.assign(pendingPatch, patch);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    chrome.storage.sync.set(pendingPatch);
    pendingPatch = {};
  }, 200);
}

// Green fill on the slider track (audio-player-style progress)
function updateFill(el) {
  const min = Number(el.min), max = Number(el.max), val = Number(el.value);
  const pct = ((val - min) / (max - min)) * 100;
  el.style.setProperty("--fill", pct + "%");
}

function render(settings) {
  $("enabled").checked = settings.enabled;
  $("sourceLang").value = settings.sourceLang;
  $("lang").value = settings.targetLang;
  $("subtitles").checked = settings.subtitles;
  $("autoPause").checked = settings.autoPause;
  $("localOnly").checked = !settings.cloudFallback;
  $("proTrans").checked = !!settings.proTranslation;
  $("proVoice").checked = !!settings.proVoice;
  $("proAudio").checked = !!settings.proAudio;
  $("rate").value = settings.rate;
  $("rateVal").textContent = "×" + Number(settings.rate).toFixed(2);
  $("duck").value = settings.duck;
  $("duckVal").textContent = settings.duck + " %";
  $("overlay").checked = settings.overlay;
  updateFill($("rate"));
  updateFill($("duck"));
}

let tabId = null;
let settings = null;
let voicesFilled = false;
let lastResp = null;
let signedIn = false;
let triedInject = false;

// The content script may be missing (extension just installed/updated,
// page opened before). Instead of asking for F5, inject it on demand.
async function ensureContentInjected() {
  if (tabId == null) return;
  try {
    await chrome.tabs.sendMessage(tabId, { type: "getStatus" });
    return; // already there
  } catch (e) {}
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ["content.js"],
    });
  } catch (e) {
    /* restricted page (chrome://, Web Store…): nothing to inject into */
  }
}

// The big one-shot CTA: visible when signed in and dubbing is off.
function updateLaunch() {
  const btn = $("launchBtn");
  if (btn) btn.hidden = !signedIn || !!(settings && settings.enabled);
}

// --- status rendering (DOM building, never innerHTML) ---

function line(text, cls) {
  const span = document.createElement("span");
  if (cls) span.className = cls;
  span.textContent = text;
  return span;
}

function translationLine(resp) {
  if (resp.translationMode === "pro")
    return t("translationPro") || "Traduction : Pro (contextuelle)";
  if (resp.translationMode === "local")
    return t("translationLocal") || "Traduction : locale (Chrome)";
  if (resp.translationMode === "cloud")
    return t("translationCloud") || "Traduction : en ligne";
  return resp.builtinTranslator
    ? t("translationLocal") || "Traduction : locale (Chrome)"
    : t("translationWaiting") || "Traduction : en attente…";
}

function statusFragment(resp) {
  const frag = document.createDocumentFragment();
  const add = (node) => {
    if (frag.childNodes.length) frag.appendChild(document.createElement("br"));
    frag.appendChild(node);
  };

  if (!resp || !resp.videos) {
    add(line(t("statusNoVideo") || "Aucune vidéo détectée sur cette page.", "warn"));
    return frag;
  }
  add(
    line(
      "✓ " +
        (t("statusVideosDetected", [String(resp.videos)]) ||
          `${resp.videos} vidéo(s) détectée(s)`),
      "ok",
    ),
  );

  switch (resp.state) {
    case "ready": {
      const n = resp.groups || resp.cues;
      const ready = line(
        "✓ " + (t("statusLinesReady", [String(n)]) || `${n} réplique(s) prête(s)`),
        "ok",
      );
      add(ready);
      if (resp.speaking) {
        // Same visual line as the ready counter.
        ready.after(line(" · 🔊 " + (t("statusSpeaking") || "voix en cours"), "ok"));
      }
      add(line(translationLine(resp)));
      break;
    }
    case "subs-loading":
      add(line(t("statusSubsLoading") || "Piste de sous-titres détectée — lance la lecture quelques secondes pour charger les répliques.", "warn"));
      break;
    case "no-subs":
      add(line(t("statusNoSubs") || "Aucun sous-titre détecté — assure-toi que les sous-titres (CC) sont activés dans le lecteur. S'il n'en propose pas, le doublage n'est pas possible sur cette vidéo.", "warn"));
      break;
    case "enable-subs":
      add(line(t("statusEnableSubs") || "Active les sous-titres (CC) dans le lecteur : Voxylio les lit en direct sur ce site.", "warn"));
      break;
    case "no-voice":
      add(line(t("statusNoVoice") || "Aucune voix installée pour cette langue. Sur Mac : Réglages Système → Accessibilité → Contenu énoncé.", "warn"));
      break;
    case "local-unavailable":
      add(line(t("statusLocalUnavailable") || "Traduction locale indisponible (mode strict actif). Chrome télécharge peut-être son modèle — réessaie dans un instant.", "warn"));
      break;
    case "translate-error":
      add(line(t("statusTranslateError") || "Traduction temporairement indisponible — nouvelle tentative automatique.", "warn"));
      break;
    case "site-disabled":
      add(line(t("statusSiteDisabled") || "Voxylio est désactivé sur ce site (voir Options).", "warn"));
      break;
    case "pro-site":
      add(
        line(
          "★ " +
            (t("statusProSite") ||
              "Ce site est réservé au Pro. En gratuit : YouTube, Netflix, Prime Video, Disney+ et Twitch."),
          "warn",
        ),
      );
      break;
    case "audio-live":
      add(
        line(
          "🎙 " +
            (t("statusAudioLive") ||
              "Aucun sous-titre : transcription en direct de l'audio — le doublage suit dans quelques secondes."),
          "ok",
        ),
      );
      break;
    case "audio-quota":
      add(
        line(
          t("statusAudioQuota") ||
            "Minutes Premium Audio épuisées pour ce mois — le doublage sans sous-titres reprend au prochain cycle.",
          "warn",
        ),
      );
      break;
    case "audio-unavailable":
      add(
        line(
          t("statusAudioUnavailable") ||
            "Impossible de capturer l'audio de ce lecteur (protection du site) — le doublage sans sous-titres ne peut pas fonctionner ici.",
          "warn",
        ),
      );
      break;
  }
  // Free account, on a Pro-only site, still inside the 3-day trial:
  // say plainly what unlocks this site today and until when.
  if (
    resp.plan !== "pro" &&
    resp.trialDaysLeft != null &&
    !resp.siteFree &&
    resp.state !== "pro-site"
  ) {
    add(
      line(
        "⏳ " +
          (t("statusTrialNote", [String(resp.trialDaysLeft)]) ||
            `Essai complet : ce site reste débloqué encore ${resp.trialDaysLeft} j`),
      ),
    );
  }
  return frag;
}

function fillVoices(resp) {
  if (voicesFilled) return;
  const list = (resp && resp.voices) || [];
  if (!list.length) return;
  voicesFilled = true;
  const sel = $("voice");
  for (const v of list) {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    if (settings && v.name === settings.voiceName) opt.selected = true;
    sel.appendChild(opt);
  }
}

async function refreshStatus() {
  if (tabId == null) return;
  const status = $("status");
  try {
    const resp = await chrome.tabs.sendMessage(tabId, { type: "getStatus" });
    lastResp = resp;
    status.replaceChildren(statusFragment(resp));
    fillVoices(resp);
  } catch (e) {
    // First failure: the content script probably is not there yet —
    // inject it and retry silently before ever bothering the user.
    if (!triedInject) {
      triedInject = true;
      await ensureContentInjected();
      try {
        const resp = await chrome.tabs.sendMessage(tabId, { type: "getStatus" });
        lastResp = resp;
        status.replaceChildren(statusFragment(resp));
        fillVoices(resp);
        return;
      } catch (e2) {}
    }
    status.replaceChildren(
      line(
        t("statusNoComm") ||
          "Impossible de communiquer avec la page. Recharge la page (F5) puis rouvre ce panneau.",
        "warn",
      ),
    );
  }
}

// Mac App Store rule 3.1.1: no buttons or calls to action that lead to
// a purchase made outside the app. The Safari build therefore never
// shows the Pro banner or a "Go Pro" button — sign-in and managing an
// EXISTING subscription stay (the multiplatform-services allowance).
// Chrome reports "Google Inc." and Firefox "" as vendor: false there.
const IS_SAFARI = /apple/i.test(navigator.vendor || "");

// The whole popup is gated: signed out, only the sign-in card shows —
// the dubbing engine itself refuses to start without a linked account.
function setSignedOut(out) {
  document.body.classList.toggle("signed-out", out);
  $("signinCard").hidden = !out;
  $("mainUi").hidden = out;
}

function fmtCompact(n) {
  try {
    return new Intl.NumberFormat(uiLangResolved, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  } catch (e) {
    return String(n);
  }
}

function fmtInt(n) {
  try {
    return new Intl.NumberFormat(uiLangResolved).format(n);
  } catch (e) {
    return String(n);
  }
}

// Two thin meters under the account card: remaining AI-translation and
// neural-voice characters this period. Only rendered when the server
// reported totals — a Pro plan with no configured provider shows nothing.
function renderQuota(ent) {
  const box = $("quotaBox");
  const rows = [
    ["quotaTransVal", "quotaTransFill", "quotaTransBar", ent.cloudCharsRemaining, ent.cloudCharsTotal, "chars"],
    ["quotaVoiceVal", "quotaVoiceFill", "quotaVoiceBar", ent.ttsCharsRemaining, ent.ttsCharsTotal, "chars"],
    ["quotaAudioVal", "quotaAudioFill", "quotaAudioBar", ent.audioSecondsRemaining, ent.audioSecondsTotal, "minutes"],
  ];
  const has = rows.some(([, , , , total]) => typeof total === "number" && total > 0);
  box.hidden = !has;
  if (!has) return;
  // The audio meter only exists when the server reports the feature.
  const audioOn = typeof ent.audioSecondsTotal === "number" && ent.audioSecondsTotal > 0;
  $("quotaAudioRow").hidden = !audioOn;
  $("quotaAudioBar").hidden = !audioOn;
  // CONSUMED display (owner choice): the bar starts empty and fills as
  // the month is used — green, amber past 80 %, red when exhausted.
  for (const [valId, fillId, barId, remaining, total, unit] of rows) {
    const tot = typeof total === "number" ? total : 0;
    if (tot <= 0) continue;
    const rem = Math.max(0, Math.min(tot, typeof remaining === "number" ? remaining : 0));
    const used = Math.max(0, tot - rem);
    const pct = tot > 0 ? Math.round((used / tot) * 100) : 0;
    $(valId).textContent =
      unit === "minutes"
        ? fmtInt(Math.floor(used / 60)) + " / " + Math.floor(tot / 60) + " min"
        : fmtCompact(used) + " / " + fmtCompact(tot);
    const fill = $(fillId);
    fill.style.width = Math.min(100, pct) + "%";
    fill.classList.toggle("low", pct >= 80 && pct < 100);
    fill.classList.toggle("out", pct >= 100);
    $(barId).title =
      unit === "minutes"
        ? Math.floor(used / 60) + " / " + Math.floor(tot / 60) + " min"
        : fmtInt(used) + " / " + fmtInt(tot);
  }
  const resets = $("quotaResets");
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

async function refreshAccount() {
  const plan = $("accountPlan");
  const btn = $("accountBtn");
  const note = $("accountNote");
  const banner = $("proBanner");
  const email = $("accountEmail");
  const signout = $("signoutBtn");
  try {
    const ent = await chrome.runtime.sendMessage({ type: "entitlements" });
    const linked = !!(ent && ent.linked);
    signedIn = linked;
    setSignedOut(!linked);
    updateLaunch();
    // The promoted CTA up top: visible for every linked non-Pro user —
    // never on Safari (App Store external-purchase rule).
    banner.hidden = !linked || ent.plan === "pro" || IS_SAFARI;
    // Which account is linked (DubTab-style) + a way out of it.
    email.textContent = (linked && ent.email) || "";
    email.hidden = !(linked && ent.email);
    signout.hidden = !linked;
    // The Pro toggles only exist for Pro users.
    const isPro = linked && ent.plan === "pro";
    $("proTransRow").hidden = !isPro;
    $("proVoiceRow").hidden = !isPro;
    $("proAudioRow").hidden = !isPro;
    if (isPro) renderQuota(ent);
    else $("quotaBox").hidden = true;
    btn.hidden = false;
    if (!linked) {
      plan.textContent = t("accountNotLinked") || "Non connecté";
      plan.classList.remove("pro");
      btn.textContent = t("signIn") || "Se connecter";
      btn.classList.remove("ghost");
      note.textContent =
        t("accountNoteNotLinked") ||
        "Connecte-toi pour activer le doublage.";
    } else if (ent.plan === "pro") {
      plan.textContent = t("accountPro") || "Pro";
      plan.classList.add("pro");
      btn.textContent = t("manage") || "Gérer";
      btn.classList.add("ghost");
      note.textContent =
        ent.status === "canceled"
          ? t("accountNoteProCanceled") ||
            "Abonnement actif jusqu'à la fin de la période."
          : t("accountNotePro") || "Merci de soutenir Voxylio.";
    } else if (IS_SAFARI) {
      // Free plan on Safari: state the plan — no purchase CTA, no upsell.
      plan.textContent = t("accountFree") || "Gratuit";
      plan.classList.remove("pro");
      btn.hidden = true;
      note.textContent = "";
    } else {
      plan.textContent = t("accountFree") || "Gratuit";
      plan.classList.remove("pro");
      btn.textContent = t("goPro") || "Passer Pro";
      btn.classList.remove("ghost");
      note.textContent =
        t("accountNoteFree") ||
        "Débloquez la traduction contextuelle et les voix neurales naturelles.";
    }
  } catch (e) {
    // No background answer: same as not linked — the engine is gated on
    // the very same call, so the popup and the page always agree.
    setSignedOut(true);
    signedIn = false;
    updateLaunch();
    plan.textContent = t("accountNotLinked") || "Non connecté";
    banner.hidden = true;
    email.hidden = true;
    signout.hidden = true;
    $("quotaBox").hidden = true;
  }
}

async function init() {
  settings = await chrome.storage.sync.get(DEFAULTS);
  uiLangResolved = resolveUiLang(settings.uiLang, navigator.language);
  t = makeT(uiLangResolved);
  applyI18n();
  populateLanguageSelects();
  render(settings);

  $("enabled").addEventListener("change", (e) => {
    settings.enabled = e.target.checked;
    save({ enabled: e.target.checked });
    updateLaunch();
  });
  // One-shot launch (DubTab-style): make sure the page is instrumented,
  // switch dubbing on, kick a fresh scan — no reload ever needed.
  $("launchBtn").addEventListener("click", async () => {
    await ensureContentInjected();
    settings.enabled = true;
    $("enabled").checked = true;
    await chrome.storage.sync.set({ enabled: true });
    updateLaunch();
    if (tabId != null) {
      try {
        await chrome.tabs.sendMessage(tabId, { type: "retry" });
      } catch (e) {}
    }
    refreshStatus();
  });
  $("overlay").addEventListener("change", (e) => save({ overlay: e.target.checked }));
  $("subtitles").addEventListener("change", (e) => save({ subtitles: e.target.checked }));
  $("sourceLang").addEventListener("change", (e) => save({ sourceLang: e.target.value }));
  $("autoPause").addEventListener("change", (e) => save({ autoPause: e.target.checked }));
  $("localOnly").addEventListener("change", (e) => save({ cloudFallback: !e.target.checked }));
  $("proTrans").addEventListener("change", (e) => save({ proTranslation: e.target.checked }));
  $("proVoice").addEventListener("change", (e) => save({ proVoice: e.target.checked }));
  $("proAudio").addEventListener("change", (e) => save({ proAudio: e.target.checked }));

  // Voice preview — spoken from the popup itself (its click counts as
  // the user activation speech synthesis requires)
  $("preview").addEventListener("click", () => {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const target = $("lang").value || "fr";
    const u = new SpeechSynthesisUtterance(PREVIEW_SAMPLES[target] || PREVIEW_SAMPLES.en);
    const wanted = $("voice").value;
    const voices = s.getVoices() || [];
    const v = wanted
      ? voices.find((x) => x.name === wanted)
      : voices.find((x) => (x.lang || "").toLowerCase().startsWith(target));
    if (v) u.voice = v;
    u.lang = v ? v.lang : LOCALES[target] || target;
    u.rate = Number($("rate").value) || 1;
    s.speak(u);
  });

  // Recovery + diagnostics + options + factory reset
  $("retry").addEventListener("click", async () => {
    if (tabId != null) {
      try {
        await chrome.tabs.sendMessage(tabId, { type: "retry" });
      } catch (e) {}
    }
    refreshStatus();
  });
  $("diag").addEventListener("click", async () => {
    const diag = {
      when: new Date().toISOString(),
      settings: await chrome.storage.sync.get(DEFAULTS),
      status: lastResp,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(diag, null, 2));
      $("diag").textContent = t("copied") || "Copié ✓";
      setTimeout(() => {
        $("diag").textContent = t("diag") || "Diagnostic";
      }, 1600);
    } catch (e) {}
  });
  $("optionsBtn").addEventListener("click", () => chrome.runtime.openOptionsPage());
  $("gearBtn").addEventListener("click", () => chrome.runtime.openOptionsPage());
  const openHub = (view) => {
    chrome.tabs.create({ url: chrome.runtime.getURL("app.html#" + view) });
  };
  $("historyLink").addEventListener("click", () => openHub("history"));
  $("voicesLink").addEventListener("click", () => openHub("voices"));
  $("reset").addEventListener("click", async () => {
    await chrome.storage.sync.set({ ...DEFAULTS });
    await chrome.storage.local.remove("overlayPos");
    window.location.reload();
  });
  $("rate").addEventListener("input", (e) => {
    $("rateVal").textContent = "×" + Number(e.target.value).toFixed(2);
    updateFill(e.target);
    saveDebounced({ rate: Number(e.target.value) });
  });
  $("duck").addEventListener("input", (e) => {
    $("duckVal").textContent = e.target.value + " %";
    updateFill(e.target);
    saveDebounced({ duck: Number(e.target.value) });
  });
  $("voice").addEventListener("change", (e) => {
    // Keep the per-language map (hub page) in sync with the quick pick.
    const lang = $("lang").value || settings.targetLang;
    const vb = { ...(settings.voiceByLang || {}) };
    if (e.target.value) vb[lang] = e.target.value;
    else delete vb[lang];
    settings.voiceByLang = vb;
    save({ voiceName: e.target.value, voiceByLang: vb });
  });
  $("lang").addEventListener("change", (e) => {
    // New language: the chosen voice is no longer valid and the voice list
    // must be refreshed — reload the popup after saving.
    save({ targetLang: e.target.value, voiceName: "" });
    setTimeout(() => window.location.reload(), 250);
  });

  // Account: plan comes from the background's cached entitlements. A
  // linked account (free plan included) is required to dub — signed out,
  // the popup collapses to the sign-in card.
  refreshAccount();
  const openAccount = () => {
    const lang = resolveUiLang(settings.uiLang, navigator.language);
    chrome.tabs.create({
      url: `https://voxylio.lndev.me/${lang}/account?from=extension`,
    });
  };
  $("accountBtn").addEventListener("click", openAccount);
  $("proBannerBtn").addEventListener("click", openAccount);
  $("signinBtn").addEventListener("click", openAccount);
  // Sign out from the popup: dropping the token re-locks dubbing
  // everywhere (the content scripts watch this storage key).
  $("signoutBtn").addEventListener("click", async () => {
    await chrome.storage.local.remove(["accountToken", "entitlements"]);
    refreshAccount();
  });
  // Unlock live when the site relays the token while the popup is open;
  // re-render in place when the UI language changes from the hub.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.accountToken || changes.entitlements))
      refreshAccount();
    if (area === "sync" && changes.uiLang) window.location.reload();
  });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;
  tabId = tab.id;

  refreshStatus();
  // HLS cues arrive as playback progresses: keep refreshing while the
  // popup is open.
  setInterval(refreshStatus, 1500);
}

init();
