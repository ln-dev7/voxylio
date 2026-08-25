// Popup: settings surface + live status of the active tab's dubbing.
// The settings schema is shared with the options page and the content
// script (packages/core/src/settings.js). All status rendering is DOM
// building — no innerHTML with dynamic content.
import { DEFAULTS, LANGUAGES, LOCALES } from "@voxylio/core";

const PREVIEW_SAMPLES = {
  fr: "Bonjour ! Voici la voix de votre doublage.",
  es: "¡Hola! Esta es la voz de tu doblaje.",
  it: "Ciao! Questa è la voce del tuo doppiaggio.",
  de: "Hallo! Das ist die Stimme deiner Synchronisation.",
  pt: "Olá! Esta é a voz da sua dublagem.",
  en: "Hi! This is your dubbing voice.",
  nl: "Hallo! Dit is de stem van je nasynchronisatie.",
  pl: "Cześć! To jest głos twojego dubbingu.",
  ru: "Привет! Это голос вашего дубляжа.",
  uk: "Привіт! Це голос вашого дубляжу.",
  tr: "Merhaba! Bu, dublaj sesiniz.",
  ar: "مرحباً! هذا صوت الدبلجة.",
  hi: "नमस्ते! यह आपकी डबिंग की आवाज़ है।",
  ja: "こんにちは！これがあなたの吹き替えの声です。",
  ko: "안녕하세요! 이것이 더빙 목소리입니다.",
  zh: "你好！这是你的配音声音。",
  vi: "Xin chào! Đây là giọng lồng tiếng của bạn.",
  th: "สวัสดี! นี่คือเสียงพากย์ของคุณ",
  id: "Halo! Ini suara sulih suara Anda.",
  sv: "Hej! Det här är din dubbningsröst.",
  el: "Γεια σας! Αυτή είναι η φωνή της μεταγλώττισής σας.",
  ro: "Salut! Aceasta este vocea dublajului tău.",
  cs: "Ahoj! Tohle je hlas vašeho dabingu.",
};

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

// i18n: message from _locales, French markup text as fallback.
const t = (key, subs) => {
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
  for (const el of document.querySelectorAll("[data-i18n-title]")) {
    const msg = t(el.dataset.i18nTitle);
    if (msg) el.title = msg;
  }
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

// --- status rendering (DOM building, never innerHTML) ---

function line(text, cls) {
  const span = document.createElement("span");
  if (cls) span.className = cls;
  span.textContent = text;
  return span;
}

function translationLine(resp) {
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
      add(line(t("statusNoSubs") || "Ce lecteur n’expose pas ses sous-titres — le doublage n’est pas possible sur cette vidéo.", "warn"));
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
    status.replaceChildren(
      line(
        t("statusNoComm") ||
          "Impossible de communiquer avec la page. Recharge la page (F5) puis rouvre ce panneau.",
        "warn",
      ),
    );
  }
}

// The whole popup is gated: signed out, only the sign-in card shows —
// the dubbing engine itself refuses to start without a linked account.
function setSignedOut(out) {
  document.body.classList.toggle("signed-out", out);
  $("signinCard").hidden = !out;
  $("mainUi").hidden = out;
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
    setSignedOut(!linked);
    // The promoted CTA up top: visible for every linked non-Pro user.
    banner.hidden = !linked || ent.plan === "pro";
    // Which account is linked (DubTab-style) + a way out of it.
    email.textContent = (linked && ent.email) || "";
    email.hidden = !(linked && ent.email);
    signout.hidden = !linked;
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
    } else {
      plan.textContent = t("accountFree") || "Gratuit";
      plan.classList.remove("pro");
      btn.textContent = t("goPro") || "Passer Pro";
      btn.classList.remove("ghost");
      note.textContent =
        t("accountNoteFree") ||
        "Débloquez la traduction contextuelle et les fonctions Pro à venir.";
    }
  } catch (e) {
    // No background answer: same as not linked — the engine is gated on
    // the very same call, so the popup and the page always agree.
    setSignedOut(true);
    plan.textContent = t("accountNotLinked") || "Non connecté";
    banner.hidden = true;
    email.hidden = true;
    signout.hidden = true;
  }
}

async function init() {
  applyI18n();
  populateLanguageSelects();
  settings = await chrome.storage.sync.get(DEFAULTS);
  render(settings);

  $("enabled").addEventListener("change", (e) => save({ enabled: e.target.checked }));
  $("overlay").addEventListener("change", (e) => save({ overlay: e.target.checked }));
  $("subtitles").addEventListener("change", (e) => save({ subtitles: e.target.checked }));
  $("sourceLang").addEventListener("change", (e) => save({ sourceLang: e.target.value }));
  $("autoPause").addEventListener("change", (e) => save({ autoPause: e.target.checked }));
  $("localOnly").addEventListener("change", (e) => save({ cloudFallback: !e.target.checked }));

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
  $("voice").addEventListener("change", (e) => save({ voiceName: e.target.value }));
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
    chrome.tabs.create({ url: "https://voxylio.lndev.me/fr/account?from=extension" });
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
  // Unlock live when the site relays the token while the popup is open.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.accountToken || changes.entitlements))
      refreshAccount();
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
