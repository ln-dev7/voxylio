// GENERATED FILE — do not edit. Source: apps/chrome/src (pnpm build).
(() => {
  // src/popup.js
  var DEFAULTS = {
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
    keepTerms: true
  };
  var PREVIEW_SAMPLES = {
    fr: "Bonjour ! Voici la voix de votre doublage.",
    es: "\xA1Hola! Esta es la voz de tu doblaje.",
    it: "Ciao! Questa \xE8 la voce del tuo doppiaggio.",
    de: "Hallo! Das ist die Stimme deiner Synchronisation.",
    pt: "Ol\xE1! Esta \xE9 a voz da sua dublagem.",
    en: "Hi! This is your dubbing voice."
  };
  var $ = (id) => document.getElementById(id);
  function save(patch) {
    chrome.storage.sync.set(patch);
  }
  var saveTimer = null;
  var pendingPatch = {};
  function saveDebounced(patch) {
    Object.assign(pendingPatch, patch);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      chrome.storage.sync.set(pendingPatch);
      pendingPatch = {};
    }, 200);
  }
  function updateFill(el) {
    const min = Number(el.min), max = Number(el.max), val = Number(el.value);
    const pct = (val - min) / (max - min) * 100;
    el.style.setProperty("--fill", pct + "%");
  }
  function render(settings2) {
    $("enabled").checked = settings2.enabled;
    $("sourceLang").value = settings2.sourceLang;
    $("lang").value = settings2.targetLang;
    $("subtitles").checked = settings2.subtitles;
    $("autoPause").checked = settings2.autoPause;
    $("localOnly").checked = !settings2.cloudFallback;
    $("rate").value = settings2.rate;
    $("rateVal").textContent = "\xD7" + Number(settings2.rate).toFixed(2);
    $("duck").value = settings2.duck;
    $("duckVal").textContent = settings2.duck + " %";
    $("overlay").checked = settings2.overlay;
    updateFill($("rate"));
    updateFill($("duck"));
  }
  var tabId = null;
  var settings = null;
  var voicesFilled = false;
  var lastResp = null;
  function translationLine(resp) {
    if (resp.translationMode === "local") return "Traduction : locale (Chrome)";
    if (resp.translationMode === "cloud") return "Traduction : en ligne";
    return resp.builtinTranslator ? "Traduction : locale (Chrome)" : "Traduction : en attente\u2026";
  }
  function statusHTML(resp) {
    const parts = [];
    if (!resp || !resp.videos) {
      parts.push('<span class="warn">Aucune vid\xE9o d\xE9tect\xE9e sur cette page.</span>');
      return parts.join("<br>");
    }
    parts.push(
      `<span class="ok">\u2713 ${resp.videos} vid\xE9o${resp.videos > 1 ? "s" : ""} d\xE9tect\xE9e${resp.videos > 1 ? "s" : ""}</span>`
    );
    switch (resp.state) {
      case "ready": {
        const n = resp.groups || resp.cues;
        parts.push(
          `<span class="ok">\u2713 ${n} r\xE9plique${n > 1 ? "s" : ""} pr\xEAte${n > 1 ? "s" : ""}</span>` + (resp.speaking ? ' <span class="ok">\xB7 \u{1F50A} voix en cours</span>' : "")
        );
        parts.push(translationLine(resp));
        break;
      }
      case "subs-loading":
        parts.push(
          '<span class="warn">Piste de sous-titres d\xE9tect\xE9e \u2014 lance la lecture quelques secondes pour charger les r\xE9pliques.</span>'
        );
        break;
      case "no-subs":
        parts.push(
          '<span class="warn">Ce lecteur n\u2019expose pas ses sous-titres \u2014 le doublage n\u2019est pas possible sur cette vid\xE9o.</span>'
        );
        break;
      case "no-voice":
        parts.push(
          '<span class="warn">Aucune voix install\xE9e pour cette langue. Sur Mac : R\xE9glages Syst\xE8me \u2192 Accessibilit\xE9 \u2192 Contenu \xE9nonc\xE9.</span>'
        );
        break;
      case "local-unavailable":
        parts.push(
          '<span class="warn">Traduction locale indisponible (mode strict actif). Chrome t\xE9l\xE9charge peut-\xEAtre son mod\xE8le \u2014 r\xE9essaie dans un instant.</span>'
        );
        break;
      case "translate-error":
        parts.push(
          '<span class="warn">Traduction temporairement indisponible \u2014 nouvelle tentative automatique.</span>'
        );
        break;
    }
    return parts.join("<br>");
  }
  function fillVoices(resp) {
    if (voicesFilled) return;
    const list = resp && resp.voices || [];
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
      $("status").innerHTML = '<span class="warn">Impossible de communiquer avec la page.</span><br>Recharge la page (F5) puis rouvre ce panneau.';
    }
  }
  async function refreshAccount() {
    const plan = $("accountPlan");
    const btn = $("accountBtn");
    try {
      const ent = await chrome.runtime.sendMessage({ type: "entitlements" });
      if (!ent || !ent.linked) {
        plan.textContent = "Non connect\xE9";
        plan.classList.remove("pro");
        btn.textContent = "Se connecter";
      } else if (ent.plan === "pro") {
        plan.textContent = ent.status === "canceled" ? "Pro \xB7 fin de p\xE9riode" : "Pro";
        plan.classList.add("pro");
        btn.textContent = "G\xE9rer";
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
    $("preview").addEventListener("click", () => {
      const s = window.speechSynthesis;
      if (!s) return;
      s.cancel();
      const target = $("lang").value || "fr";
      const u = new SpeechSynthesisUtterance(PREVIEW_SAMPLES[target] || PREVIEW_SAMPLES.en);
      const wanted = $("voice").value;
      const voices = s.getVoices() || [];
      const v = wanted ? voices.find((x) => x.name === wanted) : voices.find((x) => (x.lang || "").toLowerCase().startsWith(target));
      if (v) u.voice = v;
      u.lang = v ? v.lang : target;
      u.rate = Number($("rate").value) || 1;
      s.speak(u);
    });
    $("retry").addEventListener("click", async () => {
      if (tabId != null) {
        try {
          await chrome.tabs.sendMessage(tabId, { type: "retry" });
        } catch (e) {
        }
      }
      refreshStatus();
    });
    $("diag").addEventListener("click", async () => {
      const diag = {
        when: (/* @__PURE__ */ new Date()).toISOString(),
        settings: await chrome.storage.sync.get(DEFAULTS),
        status: lastResp
      };
      try {
        await navigator.clipboard.writeText(JSON.stringify(diag, null, 2));
        $("diag").textContent = "Copi\xE9 \u2713";
        setTimeout(() => $("diag").textContent = "Diagnostic", 1600);
      } catch (e) {
      }
    });
    $("reset").addEventListener("click", async () => {
      await chrome.storage.sync.set(DEFAULTS);
      await chrome.storage.local.remove("overlayPos");
      window.location.reload();
    });
    $("rate").addEventListener("input", (e) => {
      $("rateVal").textContent = "\xD7" + Number(e.target.value).toFixed(2);
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
      save({ targetLang: e.target.value, voiceName: "" });
      setTimeout(() => window.location.reload(), 250);
    });
    refreshAccount();
    $("accountBtn").addEventListener("click", () => {
      chrome.tabs.create({ url: "https://voxylio.lndev.me/fr/account?from=extension" });
    });
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;
    tabId = tab.id;
    refreshStatus();
    setInterval(refreshStatus, 1500);
  }
  init();
})();
