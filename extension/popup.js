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

  // src/popup.js
  var PREVIEW_SAMPLES = {
    fr: "Bonjour ! Voici la voix de votre doublage.",
    es: "\xA1Hola! Esta es la voz de tu doblaje.",
    it: "Ciao! Questa \xE8 la voce del tuo doppiaggio.",
    de: "Hallo! Das ist die Stimme deiner Synchronisation.",
    pt: "Ol\xE1! Esta \xE9 a voz da sua dublagem.",
    en: "Hi! This is your dubbing voice."
  };
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
    for (const el of document.querySelectorAll("[data-i18n-title]")) {
      const msg = t(el.dataset.i18nTitle);
      if (msg) el.title = msg;
    }
  }
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
    return resp.builtinTranslator ? t("translationLocal") || "Traduction : locale (Chrome)" : t("translationWaiting") || "Traduction : en attente\u2026";
  }
  function statusFragment(resp) {
    const frag = document.createDocumentFragment();
    const add = (node) => {
      if (frag.childNodes.length) frag.appendChild(document.createElement("br"));
      frag.appendChild(node);
    };
    if (!resp || !resp.videos) {
      add(line(t("statusNoVideo") || "Aucune vid\xE9o d\xE9tect\xE9e sur cette page.", "warn"));
      return frag;
    }
    add(
      line(
        "\u2713 " + (t("statusVideosDetected", [String(resp.videos)]) || `${resp.videos} vid\xE9o(s) d\xE9tect\xE9e(s)`),
        "ok"
      )
    );
    switch (resp.state) {
      case "ready": {
        const n = resp.groups || resp.cues;
        const ready = line(
          "\u2713 " + (t("statusLinesReady", [String(n)]) || `${n} r\xE9plique(s) pr\xEAte(s)`),
          "ok"
        );
        add(ready);
        if (resp.speaking) {
          ready.after(line(" \xB7 \u{1F50A} " + (t("statusSpeaking") || "voix en cours"), "ok"));
        }
        add(line(translationLine(resp)));
        break;
      }
      case "subs-loading":
        add(line(t("statusSubsLoading") || "Piste de sous-titres d\xE9tect\xE9e \u2014 lance la lecture quelques secondes pour charger les r\xE9pliques.", "warn"));
        break;
      case "no-subs":
        add(line(t("statusNoSubs") || "Ce lecteur n\u2019expose pas ses sous-titres \u2014 le doublage n\u2019est pas possible sur cette vid\xE9o.", "warn"));
        break;
      case "no-voice":
        add(line(t("statusNoVoice") || "Aucune voix install\xE9e pour cette langue. Sur Mac : R\xE9glages Syst\xE8me \u2192 Accessibilit\xE9 \u2192 Contenu \xE9nonc\xE9.", "warn"));
        break;
      case "local-unavailable":
        add(line(t("statusLocalUnavailable") || "Traduction locale indisponible (mode strict actif). Chrome t\xE9l\xE9charge peut-\xEAtre son mod\xE8le \u2014 r\xE9essaie dans un instant.", "warn"));
        break;
      case "translate-error":
        add(line(t("statusTranslateError") || "Traduction temporairement indisponible \u2014 nouvelle tentative automatique.", "warn"));
        break;
      case "site-disabled":
        add(line(t("statusSiteDisabled") || "Voxylio est d\xE9sactiv\xE9 sur ce site (voir Options).", "warn"));
        break;
    }
    return frag;
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
    const status = $("status");
    try {
      const resp = await chrome.tabs.sendMessage(tabId, { type: "getStatus" });
      lastResp = resp;
      status.replaceChildren(statusFragment(resp));
      fillVoices(resp);
    } catch (e) {
      status.replaceChildren(
        line(
          t("statusNoComm") || "Impossible de communiquer avec la page. Recharge la page (F5) puis rouvre ce panneau.",
          "warn"
        )
      );
    }
  }
  async function refreshAccount() {
    const plan = $("accountPlan");
    const btn = $("accountBtn");
    const note = $("accountNote");
    try {
      const ent = await chrome.runtime.sendMessage({ type: "entitlements" });
      if (!ent || !ent.linked) {
        plan.textContent = t("accountNotLinked") || "Non connect\xE9";
        plan.classList.remove("pro");
        btn.textContent = t("signIn") || "Se connecter";
        btn.classList.remove("ghost");
        note.textContent = t("accountNoteNotLinked") || "Le doublage local reste gratuit, illimit\xE9 et sans compte.";
      } else if (ent.plan === "pro") {
        plan.textContent = t("accountPro") || "Pro";
        plan.classList.add("pro");
        btn.textContent = t("manage") || "G\xE9rer";
        btn.classList.add("ghost");
        note.textContent = ent.status === "canceled" ? t("accountNoteProCanceled") || "Abonnement actif jusqu'\xE0 la fin de la p\xE9riode." : t("accountNotePro") || "Merci de soutenir Voxylio.";
      } else {
        plan.textContent = t("accountFree") || "Gratuit";
        plan.classList.remove("pro");
        btn.textContent = t("goPro") || "Passer Pro";
        btn.classList.remove("ghost");
        note.textContent = t("accountNoteFree") || "D\xE9bloquez la traduction contextuelle et les fonctions Pro \xE0 venir.";
      }
    } catch (e) {
      plan.textContent = t("accountFree") || "Gratuit";
    }
  }
  async function init() {
    applyI18n();
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
        $("diag").textContent = t("copied") || "Copi\xE9 \u2713";
        setTimeout(() => {
          $("diag").textContent = t("diag") || "Diagnostic";
        }, 1600);
      } catch (e) {
      }
    });
    $("optionsBtn").addEventListener("click", () => chrome.runtime.openOptionsPage());
    $("reset").addEventListener("click", async () => {
      await chrome.storage.sync.set({ ...DEFAULTS });
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
