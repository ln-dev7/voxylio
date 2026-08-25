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
  var VOICE_PREFIX_ALIASES = {
    no: ["nb"],
    tl: ["fil"],
    he: ["iw"]
  };
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

  // ../../packages/core/src/voices.js
  var LOCALES = PRIMARY_LOCALE;

  // ../../packages/core/src/settings.js
  var SETTINGS_VERSION = 3;
  var TARGET_LANGS = LANGUAGE_CODES;
  var SOURCE_LANGS = ["auto", ...LANGUAGE_CODES];
  var PROVIDERS = ["auto", "deepl", "googlev2"];
  var DEFAULTS = Object.freeze({
    v: SETTINGS_VERSION,
    enabled: false,
    rate: 1.1,
    duck: 12,
    voiceName: "",
    // Preferred voice per target language ({ fr: "Amélie", … }); falls
    // back to voiceName, then to the automatic scoring.
    voiceByLang: {},
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
        case "voiceByLang": {
          const map = {};
          if (v && typeof v === "object" && !Array.isArray(v)) {
            for (const [lang, name] of Object.entries(v)) {
              if (TARGET_LANGS.includes(lang) && typeof name === "string" && name)
                map[lang] = name.slice(0, 200);
            }
          }
          out.voiceByLang = map;
          break;
        }
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

  // ../../packages/core/src/journal.js
  var JOURNAL_CAPS = Object.freeze({
    sessions: 40,
    // most recent kept
    linesPerSession: 400,
    days: 60
    // usage stats horizon
  });
  function fmtTime(sec) {
    const t2 = Math.max(0, Math.floor(Number(sec) || 0));
    const h = Math.floor(t2 / 3600);
    const m = Math.floor(t2 % 3600 / 60);
    const s = t2 % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }
  function fmtSrtTime(sec) {
    const t2 = Math.max(0, Number(sec) || 0);
    const h = String(Math.floor(t2 / 3600)).padStart(2, "0");
    const m = String(Math.floor(t2 % 3600 / 60)).padStart(2, "0");
    const s = String(Math.floor(t2 % 60)).padStart(2, "0");
    const ms = String(Math.round(t2 % 1 * 1e3)).padStart(3, "0");
    return `${h}:${m}:${s},${ms}`;
  }
  function toTranscriptText(session, mode = "bilingual", withTimes = true) {
    const out = [];
    for (const line of session.lines || []) {
      const ts = withTimes ? `[${fmtTime(line.t)}] ` : "";
      if (mode === "original") out.push(ts + line.src);
      else if (mode === "translation") out.push(ts + line.dst);
      else out.push(`${ts}${line.src}
${" ".repeat(ts.length)}${line.dst}`);
    }
    return out.join("\n");
  }
  function toSRT(session, mode = "translation") {
    const lines = session.lines || [];
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const start = Number(lines[i].t) || 0;
      const next = i + 1 < lines.length ? Number(lines[i + 1].t) : start + 4;
      const end = Math.max(start + 1, Math.min(next, start + 6));
      const text = mode === "original" ? lines[i].src : lines[i].dst;
      out.push(`${i + 1}
${fmtSrtTime(start)} --> ${fmtSrtTime(end)}
${text}
`);
    }
    return out.join("\n");
  }

  // src/app.js
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
  var journal = [];
  var usageStats = null;
  var currentSessionId = null;
  var transcriptMode = "bilingual";
  var voiceLang = null;
  var VIEWS = ["history", "voices", "settings", "account"];
  function setView(name) {
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
      pair.textContent = `${s.source === "auto" ? "auto" : s.source} \u2192 ${s.target}`;
      const date = document.createElement("span");
      date.textContent = new Date(s.startedAt || s.updatedAt).toLocaleDateString();
      const count = document.createElement("span");
      count.textContent = (s.lines || []).length + " " + (t("appLines") || "r\xE9pliques");
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
    $("tPair").textContent = `${s.source === "auto" ? "auto" : s.source} \u2192 ${s.target}`;
    $("tCount").textContent = (s.lines || []).length + " " + (t("appLines") || "r\xE9pliques");
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
    return "voxylio-" + (s.host || "session").replace(/[^a-z0-9.-]+/gi, "_").slice(0, 40) + "-" + s.target;
  }
  function initHistory() {
    $("sessionSearch").addEventListener("input", renderSessions);
    $("segFilter").addEventListener("input", renderTranscript);
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
        $("copyBtn").textContent = t("appCopied") || "Copi\xE9 \u2713";
        setTimeout(() => {
          $("copyBtn").textContent = t("appCopy") || "Copier";
        }, 1500);
      } catch (e) {
      }
    });
    $("txtBtn").addEventListener("click", () => {
      const s = currentSession();
      if (!s) return;
      download(
        transcriptFileBase(s) + ".txt",
        toTranscriptText(s, transcriptMode, $("tsToggle").checked),
        "text/plain"
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
  function voicesForLang(code) {
    const all = typeof speechSynthesis !== "undefined" && speechSynthesis.getVoices() || [];
    const prefixes = [code, ...VOICE_PREFIX_ALIASES[code] || []];
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
      play.textContent = "\u25B6";
      play.title = t("appPreview") || "\xC9couter";
      play.setAttribute("aria-label", t("appPreview") || "\xC9couter");
      play.addEventListener("click", onPlay);
      actions.appendChild(play);
    }
    const use = document.createElement("button");
    use.className = "btn use" + (isUsed ? " primary" : "");
    use.textContent = isUsed ? t("appVoiceInUse") || "Utilis\xE9e" : t("appUseVoice") || "Utiliser cette voix";
    use.disabled = isUsed;
    use.addEventListener("click", onUse);
    actions.appendChild(use);
    card.append(title, tags, actions);
    return card;
  }
  function setVoiceFor(code, name) {
    const vb = { ...settings.voiceByLang || {} };
    if (name) vb[code] = name;
    else delete vb[code];
    settings.voiceByLang = vb;
    const patch = { voiceByLang: vb };
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
    $("vLangName").textContent = `${lang.name} \xB7 ${lang.english}`;
    $("vCurrent").hidden = lang.code !== settings.targetLang;
    const chosen = settings.voiceByLang && settings.voiceByLang[lang.code] || "";
    $("vChosen").textContent = chosen ? (t("appVoiceSet") || "Voix choisie :") + " " + chosen : t("appVoiceAutoHint") || "Voxylio choisit la meilleure voix install\xE9e.";
    const grid = $("voiceGrid");
    grid.replaceChildren();
    const q = ($("voiceSearch").value || "").trim().toLowerCase();
    const list = voicesForLang(lang.code).filter(
      (v) => !q || (v.name + " " + v.lang).toLowerCase().includes(q)
    );
    grid.appendChild(
      voiceCard({
        name: t("appVoiceAuto") || "Automatique",
        tagList: [{ text: t("appDefaultBadge") || "Par d\xE9faut", green: !chosen }],
        isUsed: !chosen,
        onUse: () => setVoiceFor(lang.code, ""),
        onPlay: () => preview(null, lang.code)
      })
    );
    for (const v of list) {
      grid.appendChild(
        voiceCard({
          name: v.name,
          tagList: [
            { text: v.lang },
            ...v.localService ? [{ text: t("appLocalVoice") || "locale", green: true }] : []
          ],
          isUsed: chosen === v.name,
          onUse: () => setVoiceFor(lang.code, v.name),
          onPlay: () => preview(v, lang.code)
        })
      );
    }
    $("voicesEmpty").hidden = list.length > 0;
  }
  function renderVoicesView() {
    if (!voiceLang) voiceLang = settings.targetLang;
    renderLangList();
    renderVoiceGrid();
  }
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
          disabledSites: settings.disabledSites.filter((h) => h !== host)
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
    }, 4e3);
  }
  function initSettings() {
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
      chrome.storage.sync.set({
        disabledSites: [.../* @__PURE__ */ new Set([...settings.disabledSites, host])]
      });
    });
    $("siteInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") $("siteAdd").click();
    });
    $("exportBtn").addEventListener("click", () => {
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
        flash($("backupFeedback"), t("optImported") || "R\xE9glages import\xE9s \u2713", true);
      } catch (err) {
        flash($("backupFeedback"), t("optImportBad") || "Fichier invalide.", false);
      }
    });
  }
  var openAccount = () => {
    chrome.tabs.create({ url: "https://voxylio.lndev.me/fr/account?from=extension" });
  };
  async function renderAccount() {
    const plan = $("acctPlan");
    const cta = $("acctCta");
    const signout = $("acctSignout");
    try {
      const ent = await chrome.runtime.sendMessage({ type: "entitlements" });
      const linked = !!(ent && ent.linked);
      $("acctEmail").textContent = linked && ent.email || "";
      signout.hidden = !linked;
      if (!linked) {
        plan.textContent = t("accountNotLinked") || "Non connect\xE9";
        plan.classList.remove("pro");
        cta.textContent = t("signIn") || "Se connecter";
      } else if (ent.plan === "pro") {
        plan.textContent = t("accountPro") || "Pro";
        plan.classList.add("pro");
        cta.textContent = t("manage") || "G\xE9rer";
      } else {
        plan.textContent = t("accountFree") || "Gratuit";
        plan.classList.remove("pro");
        cta.textContent = t("goPro") || "Passer Pro";
      }
    } catch (e) {
      plan.textContent = t("accountNotLinked") || "Non connect\xE9";
      signout.hidden = true;
      cta.textContent = t("signIn") || "Se connecter";
    }
    renderStats();
  }
  function dayKeysBack(n) {
    const out = [];
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - (n - 1));
    for (let i = 0; i < n; i++) {
      out.push(
        d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")
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
      slot.title = `${k} \u2014 ${Math.round(sec / 60)} min`;
      if (sec > 0 && max > 0) {
        const bar = document.createElement("div");
        bar.style.height = Math.max(4, Math.round(sec / max * 100)) + "%";
        bar.className = "bar";
        slot.appendChild(bar);
      }
      chart.appendChild(slot);
    }
    const fmtDay = (k) => (/* @__PURE__ */ new Date(k + "T12:00:00")).toLocaleDateString(void 0, { day: "numeric", month: "short" });
    $("chartFrom").textContent = fmtDay(keys[0]);
    $("chartTo").textContent = fmtDay(keys[keys.length - 1]);
    $("chartTotal").textContent = Math.round(windowSeconds / 60) + " min";
    const top = Object.entries(s.langs || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
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
      cnt.textContent = lines + " " + (t("appLines") || "r\xE9pliques");
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
  async function init() {
    applyI18n();
    try {
      $("version").textContent = "Voxylio v" + chrome.runtime.getManifest().version;
    } catch (e) {
    }
    const raw = await chrome.storage.sync.get(null);
    const migrated = migrateSettings(raw);
    settings = migrated.settings;
    if (migrated.changed) chrome.storage.sync.set(settings);
    $("provider").value = settings.provider;
    renderSites();
    const localData = await chrome.storage.local.get({
      journal: [],
      usageStats: null,
      deeplKey: "",
      googleKey: ""
    });
    journal = localData.journal || [];
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
        journal = changes.journal.newValue || [];
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
})();
