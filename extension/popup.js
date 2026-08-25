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
  var PRIMARY_LOCALE = {
    af: "af-ZA",
    am: "am-ET",
    ar: "ar-SA",
    az: "az-AZ",
    be: "be-BY",
    bg: "bg-BG",
    bn: "bn-BD",
    bs: "bs-BA",
    ca: "ca-ES",
    cs: "cs-CZ",
    cy: "cy-GB",
    da: "da-DK",
    de: "de-DE",
    el: "el-GR",
    en: "en-US",
    es: "es-ES",
    et: "et-EE",
    eu: "eu-ES",
    fa: "fa-IR",
    fi: "fi-FI",
    fr: "fr-FR",
    gl: "gl-ES",
    gu: "gu-IN",
    he: "he-IL",
    hi: "hi-IN",
    hr: "hr-HR",
    hu: "hu-HU",
    hy: "hy-AM",
    id: "id-ID",
    is: "is-IS",
    it: "it-IT",
    ja: "ja-JP",
    ka: "ka-GE",
    kk: "kk-KZ",
    km: "km-KH",
    kn: "kn-IN",
    ko: "ko-KR",
    lo: "lo-LA",
    lt: "lt-LT",
    lv: "lv-LV",
    mk: "mk-MK",
    ml: "ml-IN",
    mn: "mn-MN",
    mr: "mr-IN",
    ms: "ms-MY",
    my: "my-MM",
    ne: "ne-NP",
    nl: "nl-NL",
    no: "nb-NO",
    pa: "pa-IN",
    pl: "pl-PL",
    pt: "pt-PT",
    ro: "ro-RO",
    ru: "ru-RU",
    si: "si-LK",
    sk: "sk-SK",
    sl: "sl-SI",
    sq: "sq-AL",
    sr: "sr-RS",
    sv: "sv-SE",
    sw: "sw-KE",
    ta: "ta-IN",
    te: "te-IN",
    th: "th-TH",
    tl: "fil-PH",
    tr: "tr-TR",
    uk: "uk-UA",
    ur: "ur-PK",
    uz: "uz-UZ",
    vi: "vi-VN",
    zh: "zh-CN"
  };

  // ../../packages/core/src/voices.js
  var LOCALES = PRIMARY_LOCALE;

  // ../../packages/core/src/settings.js
  var SETTINGS_VERSION = 2;
  var SOURCE_LANGS = ["auto", ...LANGUAGE_CODES];
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
    en: "Hi! This is your dubbing voice.",
    nl: "Hallo! Dit is de stem van je nasynchronisatie.",
    pl: "Cze\u015B\u0107! To jest g\u0142os twojego dubbingu.",
    ru: "\u041F\u0440\u0438\u0432\u0435\u0442! \u042D\u0442\u043E \u0433\u043E\u043B\u043E\u0441 \u0432\u0430\u0448\u0435\u0433\u043E \u0434\u0443\u0431\u043B\u044F\u0436\u0430.",
    uk: "\u041F\u0440\u0438\u0432\u0456\u0442! \u0426\u0435 \u0433\u043E\u043B\u043E\u0441 \u0432\u0430\u0448\u043E\u0433\u043E \u0434\u0443\u0431\u043B\u044F\u0436\u0443.",
    tr: "Merhaba! Bu, dublaj sesiniz.",
    ar: "\u0645\u0631\u062D\u0628\u0627\u064B! \u0647\u0630\u0627 \u0635\u0648\u062A \u0627\u0644\u062F\u0628\u0644\u062C\u0629.",
    hi: "\u0928\u092E\u0938\u094D\u0924\u0947! \u092F\u0939 \u0906\u092A\u0915\u0940 \u0921\u092C\u093F\u0902\u0917 \u0915\u0940 \u0906\u0935\u093E\u091C\u093C \u0939\u0948\u0964",
    ja: "\u3053\u3093\u306B\u3061\u306F\uFF01\u3053\u308C\u304C\u3042\u306A\u305F\u306E\u5439\u304D\u66FF\u3048\u306E\u58F0\u3067\u3059\u3002",
    ko: "\uC548\uB155\uD558\uC138\uC694! \uC774\uAC83\uC774 \uB354\uBE59 \uBAA9\uC18C\uB9AC\uC785\uB2C8\uB2E4.",
    zh: "\u4F60\u597D\uFF01\u8FD9\u662F\u4F60\u7684\u914D\u97F3\u58F0\u97F3\u3002",
    vi: "Xin ch\xE0o! \u0110\xE2y l\xE0 gi\u1ECDng l\u1ED3ng ti\u1EBFng c\u1EE7a b\u1EA1n.",
    th: "\u0E2A\u0E27\u0E31\u0E2A\u0E14\u0E35! \u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D\u0E40\u0E2A\u0E35\u0E22\u0E07\u0E1E\u0E32\u0E01\u0E22\u0E4C\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13",
    id: "Halo! Ini suara sulih suara Anda.",
    sv: "Hej! Det h\xE4r \xE4r din dubbningsr\xF6st.",
    el: "\u0393\u03B5\u03B9\u03B1 \u03C3\u03B1\u03C2! \u0391\u03C5\u03C4\u03AE \u03B5\u03AF\u03BD\u03B1\u03B9 \u03B7 \u03C6\u03C9\u03BD\u03AE \u03C4\u03B7\u03C2 \u03BC\u03B5\u03C4\u03B1\u03B3\u03BB\u03CE\u03C4\u03C4\u03B9\u03C3\u03AE\u03C2 \u03C3\u03B1\u03C2.",
    ro: "Salut! Aceasta este vocea dublajului t\u0103u.",
    cs: "Ahoj! Tohle je hlas va\u0161eho dabingu."
  };
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
    try {
      const ent = await chrome.runtime.sendMessage({ type: "entitlements" });
      const linked = !!(ent && ent.linked);
      setSignedOut(!linked);
      banner.hidden = !linked || ent.plan === "pro";
      if (!linked) {
        plan.textContent = t("accountNotLinked") || "Non connect\xE9";
        plan.classList.remove("pro");
        btn.textContent = t("signIn") || "Se connecter";
        btn.classList.remove("ghost");
        note.textContent = t("accountNoteNotLinked") || "Connecte-toi pour activer le doublage.";
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
      setSignedOut(true);
      plan.textContent = t("accountNotLinked") || "Non connect\xE9";
      banner.hidden = true;
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
      u.lang = v ? v.lang : LOCALES[target] || target;
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
    const openAccount = () => {
      chrome.tabs.create({ url: "https://voxylio.lndev.me/fr/account?from=extension" });
    };
    $("accountBtn").addEventListener("click", openAccount);
    $("proBannerBtn").addEventListener("click", openAccount);
    $("signinBtn").addEventListener("click", openAccount);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && (changes.accountToken || changes.entitlements))
        refreshAccount();
    });
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;
    tabId = tab.id;
    refreshStatus();
    setInterval(refreshStatus, 1500);
  }
  init();
})();
