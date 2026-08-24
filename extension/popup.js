const DEFAULTS = {
  enabled: false,
  rate: 1.1,
  duck: 12,
  voiceName: "",
  sourceLang: "auto",
  targetLang: "fr",
  subtitles: false,
  overlay: true,
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

function statusHTML(resp) {
  const parts = [];
  if (!resp || !resp.videos) {
    parts.push('<span class="warn">Aucune vidéo détectée sur cette page.</span>');
    return parts.join("<br>");
  }
  parts.push(
    `<span class="ok">✓ ${resp.videos} vidéo${resp.videos > 1 ? "s" : ""} détectée${resp.videos > 1 ? "s" : ""}</span>`
  );

  const subTracks = (resp.tracks || []).filter(
    (t) => t.kind === "subtitles" || t.kind === "captions"
  );
  if (resp.cues > 0) {
    const n = resp.groups || resp.cues;
    parts.push(`<span class="ok">✓ ${n} réplique${n > 1 ? "s" : ""} prête${n > 1 ? "s" : ""}</span>`);
  } else if (subTracks.length > 0) {
    parts.push(
      '<span class="warn">Piste de sous-titres détectée — lance la lecture quelques secondes pour charger les répliques.</span>'
    );
  } else {
    parts.push(
      "<span class=\"warn\">Aucune piste de sous-titres exposée par le lecteur pour l’instant.</span>"
    );
  }
  parts.push(
    resp.builtinTranslator
      ? "Traduction : Chrome (locale)"
      : "Traduction : en ligne (fallback)"
  );
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
    $("status").innerHTML = statusHTML(resp);
    fillVoices(resp);
  } catch (e) {
    $("status").innerHTML =
      '<span class="warn">Impossible de communiquer avec la page.</span><br>Recharge la page (F5) puis rouvre ce panneau.';
  }
}

async function init() {
  settings = await chrome.storage.sync.get(DEFAULTS);
  render(settings);

  $("enabled").addEventListener("change", (e) => save({ enabled: e.target.checked }));
  $("overlay").addEventListener("change", (e) => save({ overlay: e.target.checked }));
  $("subtitles").addEventListener("change", (e) => save({ subtitles: e.target.checked }));
  $("sourceLang").addEventListener("change", (e) => save({ sourceLang: e.target.value }));
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

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;
  tabId = tab.id;

  refreshStatus();
  // HLS cues arrive as playback progresses: keep refreshing while the
  // popup is open.
  setInterval(refreshStatus, 1500);
}

init();
