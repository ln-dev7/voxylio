const DEFAULTS = {
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
};

const PREVIEW_SAMPLES = {
  fr: "Bonjour ! Voici la voix de votre doublage.",
  es: "¡Hola! Esta es la voz de tu doblaje.",
  it: "Ciao! Questa è la voce del tuo doppiaggio.",
  de: "Hallo! Das ist die Stimme deiner Synchronisation.",
  pt: "Olá! Esta é a voz da sua dublagem.",
  en: "Hi! This is your dubbing voice.",
};

const $ = (id) => document.getElementById(id);

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

function translationLine(resp) {
  if (resp.translationMode === "local") return "Traduction : locale (Chrome)";
  if (resp.translationMode === "cloud") return "Traduction : en ligne";
  return resp.builtinTranslator
    ? "Traduction : locale (Chrome)"
    : "Traduction : en attente…";
}

function statusHTML(resp) {
  const parts = [];
  if (!resp || !resp.videos) {
    parts.push('<span class="warn">Aucune vidéo détectée sur cette page.</span>');
    return parts.join("<br>");
  }
  parts.push(
    `<span class="ok">✓ ${resp.videos} vidéo${resp.videos > 1 ? "s" : ""} détectée${resp.videos > 1 ? "s" : ""}</span>`
  );

  switch (resp.state) {
    case "ready": {
      const n = resp.groups || resp.cues;
      parts.push(
        `<span class="ok">✓ ${n} réplique${n > 1 ? "s" : ""} prête${n > 1 ? "s" : ""}</span>` +
          (resp.speaking ? ' <span class="ok">· 🔊 voix en cours</span>' : "")
      );
      parts.push(translationLine(resp));
      break;
    }
    case "subs-loading":
      parts.push(
        '<span class="warn">Piste de sous-titres détectée — lance la lecture quelques secondes pour charger les répliques.</span>'
      );
      break;
    case "no-subs":
      parts.push(
        "<span class=\"warn\">Ce lecteur n’expose pas ses sous-titres — le doublage n’est pas possible sur cette vidéo.</span>"
      );
      break;
    case "no-voice":
      parts.push(
        "<span class=\"warn\">Aucune voix installée pour cette langue. Sur Mac : Réglages Système → Accessibilité → Contenu énoncé.</span>"
      );
      break;
    case "local-unavailable":
      parts.push(
        "<span class=\"warn\">Traduction locale indisponible (mode strict actif). Chrome télécharge peut-être son modèle — réessaie dans un instant.</span>"
      );
      break;
    case "translate-error":
      parts.push(
        '<span class="warn">Traduction temporairement indisponible — nouvelle tentative automatique.</span>'
      );
      break;
  }
  return parts.join("<br>");
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
  try {
    const resp = await chrome.tabs.sendMessage(tabId, { type: "getStatus" });
    lastResp = resp;
    $("status").innerHTML = statusHTML(resp);
    fillVoices(resp);
  } catch (e) {
    $("status").innerHTML =
      '<span class="warn">Impossible de communiquer avec la page.</span><br>Recharge la page (F5) puis rouvre ce panneau.';
  }
}

async function refreshAccount() {
  const plan = $("accountPlan");
  const btn = $("accountBtn");
  try {
    const ent = await chrome.runtime.sendMessage({ type: "entitlements" });
    if (!ent || !ent.linked) {
      plan.textContent = "Non connecté";
      plan.classList.remove("pro");
      btn.textContent = "Se connecter";
    } else if (ent.plan === "pro") {
      plan.textContent = ent.status === "canceled" ? "Pro · fin de période" : "Pro";
      plan.classList.add("pro");
      btn.textContent = "Gérer";
    } else {
      plan.textContent = "Gratuit";
      plan.classList.remove("pro");
      btn.textContent = "Passer Pro";
    }
  } catch (e) {
    plan.textContent = "Gratuit";
  }
}

async function init() {
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
    u.lang = v ? v.lang : target;
    u.rate = Number($("rate").value) || 1;
    s.speak(u);
  });

  // Recovery + diagnostics + factory reset
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
      $("diag").textContent = "Copié ✓";
      setTimeout(() => ($("diag").textContent = "Diagnostic"), 1600);
    } catch (e) {}
  });
  $("reset").addEventListener("click", async () => {
    await chrome.storage.sync.set(DEFAULTS);
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

  // Account: plan comes from the background's cached entitlements.
  // Free features never require it; the row only unlocks/reflects Pro.
  refreshAccount();
  $("accountBtn").addEventListener("click", () => {
    chrome.tabs.create({ url: "https://voxylio.lndev.me/fr/account?from=extension" });
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
