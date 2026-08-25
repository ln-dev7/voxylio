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
  var UI_LANGS = [
    "auto",
    "en",
    "zh-CN",
    "zh-TW",
    "ja",
    "ko",
    "fr",
    "de",
    "es",
    "it",
    "pt-BR"
  ];
  var DEFAULTS = Object.freeze({
    v: SETTINGS_VERSION,
    enabled: false,
    rate: 1.1,
    duck: 12,
    // Synthesized voice volume (0–100) and on-screen caption size (px).
    voiceVolume: 100,
    captionSize: 19,
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
    // Extension UI language ("auto" = follow the browser, English fallback).
    uiLang: "auto",
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
        case "voiceVolume": {
          const n = Number(v);
          out.voiceVolume = clamp(
            Number.isFinite(n) ? Math.round(n) : DEFAULTS.voiceVolume,
            0,
            100
          );
          break;
        }
        case "captionSize":
          out.captionSize = clamp(Math.round(Number(v) || DEFAULTS.captionSize), 14, 34);
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
        case "uiLang":
          out.uiLang = UI_LANGS.includes(v) ? v : "auto";
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

  // src/messages/en.json
  var en_default = {
    appName: "Voxylio \u2014 multilingual dubbing",
    appDesc: "Dubs subtitled videos in real time: local translation, voice synced with playback. 65+ languages.",
    srcLabel: "Video language",
    detectAuto: "Auto-detect",
    targetLabel: "Dubbing language",
    voiceLabel: "Voice",
    voiceAuto: "Automatic",
    rateLabel: "Voice speed",
    duckLabel: "Original audio",
    autoPauseLabel: "Auto-pause when the voice falls behind",
    localOnlyLabel: "Strictly local mode",
    subtitlesLabel: "Translated subtitles on screen",
    overlayLabel: "Floating controls on the page",
    retry: "Retry",
    diag: "Diagnostics",
    copied: "Copied \u2713",
    reset: "Reset",
    options: "Options",
    hint: "Play the video, then flip the switch: the voice follows the subtitles in your language. At 0%, only the dub is audible.",
    accountLabel: "Account",
    accountNotLinked: "Not signed in",
    accountFree: "Free",
    accountPro: "Pro",
    signIn: "Sign in",
    goPro: "Go Pro",
    manage: "Manage",
    accountNoteNotLinked: "Sign in to start dubbing.",
    accountNoteFree: "Unlock context-aware translation and upcoming Pro features.",
    accountNotePro: "Thanks for supporting Voxylio.",
    accountNoteProCanceled: "Subscription active until the end of the period.",
    statusSearching: "Looking for a video\u2026",
    statusNoVideo: "No video detected on this page.",
    statusVideosDetected: "$COUNT$ video(s) detected",
    statusLinesReady: "$COUNT$ line(s) ready",
    statusSpeaking: "speaking",
    statusSubsLoading: "Subtitle track detected \u2014 play for a few seconds to load the lines.",
    statusNoSubs: "This player does not expose its subtitles \u2014 dubbing is not possible on this video.",
    statusNoVoice: "No voice installed for this language. On Mac: System Settings \u2192 Accessibility \u2192 Spoken Content.",
    statusLocalUnavailable: "Local translation unavailable (strict mode on). Chrome may be downloading its model \u2014 retry in a moment.",
    statusTranslateError: "Translation temporarily unavailable \u2014 retrying automatically.",
    statusSiteDisabled: "Voxylio is disabled on this site (see Options).",
    statusNoComm: "Cannot reach the page. Reload it (F5) and reopen this panel.",
    translationLocal: "Translation: local (Chrome)",
    translationCloud: "Translation: online",
    translationWaiting: "Translation: waiting\u2026",
    optTitle: "Voxylio Options",
    optTranslation: "Translation",
    optProviderLabel: "Preferred provider",
    optProviderAuto: "Automatic (local, then online fallback)",
    optProviderDeepl: "DeepL (your API key)",
    optProviderGoogle: "Google Cloud Translation (your API key)",
    optProviderHint: "Chrome's local translation always comes first. The keyless online fallback is an unofficial, best-effort service \u2014 a free DeepL key (500,000 characters/month) is more reliable.",
    optDeeplKey: "DeepL API key",
    optGoogleKey: "Google Cloud API key",
    optKeyStored: "Keys stay on this device (storage.local) \u2014 never synced.",
    optCheckKey: "Check key",
    optKeyOk: "Valid key \u2014 $USED$ / $LIMIT$ characters used this month.",
    optKeyBad: "Invalid key or quota reached.",
    optSites: "Disabled sites",
    optSitesHint: "Voxylio stays completely inactive on these sites (no detection, no dubbing).",
    optSiteAdd: "Add",
    optSitePlaceholder: "e.g. youtube.com",
    optSiteRemove: "Remove",
    optBackup: "Settings backup",
    optExport: "Export (JSON)",
    optImport: "Import",
    optImported: "Settings imported \u2713",
    optImportBad: "Invalid file.",
    optBackupHint: "The export never contains API keys.",
    optPrivacy: "Privacy",
    optSaved: "Saved \u2713",
    proBanner: "\u2726 Context-aware translation and upcoming features",
    signinTitle: "Sign in to start dubbing",
    signinText: "Free with a Google account. Dubbing and your settings stay on your device.",
    signinCta: "Continue with Google",
    signinNote: "No card required.",
    signOut: "Sign out",
    appHistory: "History",
    appVoices: "Voices",
    appSettings: "Settings",
    appAccount: "Account",
    appSearchSessions: "Search sessions\u2026",
    appClearAll: "Clear all",
    appNoSessions: "No sessions yet \u2014 start dubbing and the transcript will appear here, fully on-device.",
    appDeleteSession: "Delete",
    appBilingual: "Bilingual",
    appOriginal: "Original",
    appTranslation: "Translation",
    appTimestamps: "Timestamps",
    appFilterSegments: "Filter segments\u2026",
    appCopy: "Copy",
    appCopied: "Copied \u2713",
    appLines: "lines",
    appVoicesHint: "Pick the voice used for each dubbing language.",
    appCurrentTarget: "Current dubbing language",
    appVoiceAuto: "Automatic",
    appVoiceAutoHint: "Voxylio picks the best installed voice.",
    appVoiceSet: "Chosen voice:",
    appUseVoice: "Use this voice",
    appVoiceInUse: "In use",
    appSearchVoice: "Search voices\u2026",
    appNoVoices: "No voice installed for this language. On Mac: System Settings \u2192 Accessibility \u2192 Spoken Content \u2192 download a voice, then come back.",
    appPreview: "Play a preview",
    appLocalVoice: "on-device",
    appDefaultBadge: "Default",
    appStatsHint: "Stats computed locally \u2014 nothing leaves your device.",
    appMinutesDubbed: "Minutes dubbed",
    appLinesDubbed: "Sentences dubbed",
    appLangsUsed: "Languages used",
    appLast30: "Last 30 days",
    appTopLangs: "Most dubbed languages",
    appNoStats: "Start your first dub to see your stats here.",
    historyLink: "View dubbing history",
    voicesLink: "Voices",
    ovlMove: "Move",
    ovlStatusOn: "Dubbing active",
    ovlStatusOff: "Paused",
    ovlSpeaking: "Voice speaking",
    ovlPower: "Turn dubbing on or off",
    ovlLang: "Dubbing language",
    ovlVoice: "Voice",
    ovlAuto: "Automatic",
    ovlAutoHint: "Best installed voice, picked for you",
    ovlMixer: "Audio mixer",
    ovlOrig: "Original audio",
    ovlVoiceVol: "Voice volume",
    ovlDuck: "Original during the voice",
    ovlPresetImmersion: "Immersion",
    ovlPresetBalanced: "Balanced",
    ovlPresetVO: "Original forward",
    ovlQuick: "Quick settings",
    ovlRate: "Voice speed",
    ovlCaptionSize: "Subtitle size",
    ovlSubs: "On-screen subtitles",
    ovlAutoPause: "Auto-pause when the voice falls behind",
    ovlMinimize: "Minimize",
    ovlExpand: "Expand",
    ovlClose: "Hide (re-enable from the popup)",
    ovlListen: "Play a preview",
    statusEnableSubs: "Turn on subtitles (CC) in the player: Voxylio reads them live on this site.",
    uiLangLabel: "Interface language",
    uiLangHint: "Applies to the popup, this page and the floating bar. Dubbing languages are chosen separately.",
    uiLangAuto: "Browser language"
  };

  // src/messages/fr.json
  var fr_default = {
    appName: "Voxylio \u2014 doublage multilingue",
    appDesc: "Double en temps r\xE9el les vid\xE9os sous-titr\xE9es : traduction locale, voix synchronis\xE9e avec la lecture. Plus de 65 langues.",
    srcLabel: "Langue de la vid\xE9o",
    detectAuto: "D\xE9tection automatique",
    targetLabel: "Langue du doublage",
    voiceLabel: "Voix",
    voiceAuto: "Automatique",
    rateLabel: "Vitesse de la voix",
    duckLabel: "Audio original",
    autoPauseLabel: "Pause auto si la voix est en retard",
    localOnlyLabel: "Mode strictement local",
    subtitlesLabel: "Sous-titres traduits \xE0 l\u2019\xE9cran",
    overlayLabel: "Menu flottant sur la page",
    retry: "R\xE9essayer",
    diag: "Diagnostic",
    copied: "Copi\xE9 \u2713",
    reset: "R\xE9initialiser",
    options: "Options",
    hint: "Lance la vid\xE9o, puis active l\u2019interrupteur : la voix suit les sous-titres dans la langue choisie. \xC0 0 %, seul le doublage est audible.",
    accountLabel: "Compte",
    accountNotLinked: "Non connect\xE9",
    accountFree: "Gratuit",
    accountPro: "Pro",
    signIn: "Se connecter",
    goPro: "Passer Pro",
    manage: "G\xE9rer",
    accountNoteNotLinked: "Connecte-toi pour activer le doublage.",
    accountNoteFree: "D\xE9bloquez la traduction contextuelle et les fonctions Pro \xE0 venir.",
    accountNotePro: "Merci de soutenir Voxylio.",
    accountNoteProCanceled: "Abonnement actif jusqu\u2019\xE0 la fin de la p\xE9riode.",
    statusSearching: "Recherche d\u2019une vid\xE9o\u2026",
    statusNoVideo: "Aucune vid\xE9o d\xE9tect\xE9e sur cette page.",
    statusVideosDetected: "$COUNT$ vid\xE9o(s) d\xE9tect\xE9e(s)",
    statusLinesReady: "$COUNT$ r\xE9plique(s) pr\xEAte(s)",
    statusSpeaking: "voix en cours",
    statusSubsLoading: "Piste de sous-titres d\xE9tect\xE9e \u2014 lance la lecture quelques secondes pour charger les r\xE9pliques.",
    statusNoSubs: "Ce lecteur n\u2019expose pas ses sous-titres \u2014 le doublage n\u2019est pas possible sur cette vid\xE9o.",
    statusNoVoice: "Aucune voix install\xE9e pour cette langue. Sur Mac : R\xE9glages Syst\xE8me \u2192 Accessibilit\xE9 \u2192 Contenu \xE9nonc\xE9.",
    statusLocalUnavailable: "Traduction locale indisponible (mode strict actif). Chrome t\xE9l\xE9charge peut-\xEAtre son mod\xE8le \u2014 r\xE9essaie dans un instant.",
    statusTranslateError: "Traduction temporairement indisponible \u2014 nouvelle tentative automatique.",
    statusSiteDisabled: "Voxylio est d\xE9sactiv\xE9 sur ce site (voir Options).",
    statusNoComm: "Impossible de communiquer avec la page. Recharge la page (F5) puis rouvre ce panneau.",
    translationLocal: "Traduction : locale (Chrome)",
    translationCloud: "Traduction : en ligne",
    translationWaiting: "Traduction : en attente\u2026",
    optTitle: "Options de Voxylio",
    optTranslation: "Traduction",
    optProviderLabel: "Fournisseur pr\xE9f\xE9r\xE9",
    optProviderAuto: "Automatique (local, puis secours en ligne)",
    optProviderDeepl: "DeepL (cl\xE9 API personnelle)",
    optProviderGoogle: "Google Cloud Translation (cl\xE9 API personnelle)",
    optProviderHint: "La traduction locale de Chrome reste toujours prioritaire. Le secours en ligne sans cl\xE9 est un service non officiel, sans garantie \u2014 une cl\xE9 DeepL gratuite (500 000 caract\xE8res/mois) est plus fiable.",
    optDeeplKey: "Cl\xE9 API DeepL",
    optGoogleKey: "Cl\xE9 API Google Cloud",
    optKeyStored: "Les cl\xE9s restent sur cet appareil (storage.local) \u2014 jamais synchronis\xE9es.",
    optCheckKey: "V\xE9rifier la cl\xE9",
    optKeyOk: "Cl\xE9 valide \u2014 $USED$ / $LIMIT$ caract\xE8res utilis\xE9s ce mois-ci.",
    optKeyBad: "Cl\xE9 invalide ou quota atteint.",
    optSites: "Sites d\xE9sactiv\xE9s",
    optSitesHint: "Voxylio reste totalement inactif sur ces sites (aucune d\xE9tection, aucun doublage).",
    optSiteAdd: "Ajouter",
    optSitePlaceholder: "ex. youtube.com",
    optSiteRemove: "Retirer",
    optBackup: "Sauvegarde des r\xE9glages",
    optExport: "Exporter (JSON)",
    optImport: "Importer",
    optImported: "R\xE9glages import\xE9s \u2713",
    optImportBad: "Fichier invalide.",
    optBackupHint: "L\u2019export ne contient jamais les cl\xE9s API.",
    optPrivacy: "Confidentialit\xE9",
    optSaved: "Enregistr\xE9 \u2713",
    proBanner: "\u2726 Traduction contextuelle et fonctions \xE0 venir",
    signinTitle: "Connecte-toi pour activer le doublage",
    signinText: "Gratuit avec un compte Google. Le doublage et tes r\xE9glages restent sur ton appareil.",
    signinCta: "Continuer avec Google",
    signinNote: "Aucune carte demand\xE9e.",
    signOut: "Se d\xE9connecter",
    appHistory: "Historique",
    appVoices: "Voix",
    appSettings: "Param\xE8tres",
    appAccount: "Compte",
    appSearchSessions: "Rechercher une session\u2026",
    appClearAll: "Tout effacer",
    appNoSessions: "Aucune session pour le moment \u2014 lance un doublage et sa transcription appara\xEEtra ici, enti\xE8rement en local.",
    appDeleteSession: "Supprimer",
    appBilingual: "Bilingue",
    appOriginal: "Original",
    appTranslation: "Traduction",
    appTimestamps: "Horodatages",
    appFilterSegments: "Filtrer les segments\u2026",
    appCopy: "Copier",
    appCopied: "Copi\xE9 \u2713",
    appLines: "r\xE9pliques",
    appVoicesHint: "Choisis la voix utilis\xE9e pour chaque langue de doublage.",
    appCurrentTarget: "Langue de doublage actuelle",
    appVoiceAuto: "Automatique",
    appVoiceAutoHint: "Voxylio choisit la meilleure voix install\xE9e.",
    appVoiceSet: "Voix choisie :",
    appUseVoice: "Utiliser cette voix",
    appVoiceInUse: "Utilis\xE9e",
    appSearchVoice: "Rechercher une voix\u2026",
    appNoVoices: "Aucune voix install\xE9e pour cette langue. Sur Mac : R\xE9glages Syst\xE8me \u2192 Accessibilit\xE9 \u2192 Contenu \xE9nonc\xE9 \u2192 t\xE9l\xE9charge une voix, puis reviens ici.",
    appPreview: "\xC9couter un aper\xE7u",
    appLocalVoice: "locale",
    appDefaultBadge: "Par d\xE9faut",
    appStatsHint: "Statistiques calcul\xE9es en local \u2014 rien ne quitte ton appareil.",
    appMinutesDubbed: "Minutes doubl\xE9es",
    appLinesDubbed: "Phrases doubl\xE9es",
    appLangsUsed: "Langues utilis\xE9es",
    appLast30: "30 derniers jours",
    appTopLangs: "Langues les plus doubl\xE9es",
    appNoStats: "Lance un premier doublage pour voir tes statistiques ici.",
    historyLink: "Voir l\u2019historique des doublages",
    voicesLink: "Voix",
    ovlMove: "D\xE9placer",
    ovlStatusOn: "Doublage actif",
    ovlStatusOff: "En pause",
    ovlSpeaking: "Voix en cours",
    ovlPower: "Activer ou couper le doublage",
    ovlLang: "Langue du doublage",
    ovlVoice: "Voix",
    ovlAuto: "Automatique",
    ovlAutoHint: "Meilleure voix install\xE9e, choisie pour vous",
    ovlMixer: "Mixeur audio",
    ovlOrig: "Audio original",
    ovlVoiceVol: "Volume de la voix",
    ovlDuck: "Original pendant la voix",
    ovlPresetImmersion: "Immersion",
    ovlPresetBalanced: "\xC9quilibr\xE9",
    ovlPresetVO: "VO pr\xE9sente",
    ovlQuick: "R\xE9glages rapides",
    ovlRate: "Vitesse de la voix",
    ovlCaptionSize: "Taille des sous-titres",
    ovlSubs: "Sous-titres \xE0 l'\xE9cran",
    ovlAutoPause: "Pause auto si la voix est en retard",
    ovlMinimize: "R\xE9duire",
    ovlExpand: "Agrandir",
    ovlClose: "Masquer (r\xE9activable depuis le popup)",
    ovlListen: "\xC9couter un aper\xE7u",
    statusEnableSubs: "Active les sous-titres (CC) dans le lecteur : Voxylio les lit en direct sur ce site.",
    uiLangLabel: "Langue de l'interface",
    uiLangHint: "S'applique au popup, \xE0 cette page et \xE0 la barre flottante. Les langues de doublage se choisissent \xE0 part.",
    uiLangAuto: "Langue du navigateur"
  };

  // src/messages/es.json
  var es_default = {
    appName: "Voxylio \u2014 doblaje multiling\xFCe",
    appDesc: "Dobla v\xEDdeos subtitulados en tiempo real: traducci\xF3n local, voz sincronizada con la reproducci\xF3n. M\xE1s de 65 idiomas.",
    srcLabel: "Idioma del v\xEDdeo",
    detectAuto: "Detecci\xF3n autom\xE1tica",
    targetLabel: "Idioma del doblaje",
    voiceLabel: "Voz",
    voiceAuto: "Autom\xE1tica",
    rateLabel: "Velocidad de la voz",
    duckLabel: "Audio original",
    autoPauseLabel: "Pausa autom\xE1tica si la voz se retrasa",
    localOnlyLabel: "Modo estrictamente local",
    subtitlesLabel: "Subt\xEDtulos traducidos en pantalla",
    overlayLabel: "Controles flotantes en la p\xE1gina",
    retry: "Reintentar",
    diag: "Diagn\xF3stico",
    copied: "Copiado \u2713",
    reset: "Restablecer",
    options: "Opciones",
    hint: "Reproduce el v\xEDdeo y activa el interruptor: la voz sigue los subt\xEDtulos en tu idioma. Al 0 %, solo se oye el doblaje.",
    accountLabel: "Cuenta",
    accountNotLinked: "Sin conexi\xF3n",
    accountFree: "Gratis",
    accountPro: "Pro",
    signIn: "Iniciar sesi\xF3n",
    goPro: "Pasar a Pro",
    manage: "Gestionar",
    accountNoteNotLinked: "Inicia sesi\xF3n para activar el doblaje.",
    accountNoteFree: "Desbloquea la traducci\xF3n contextual y las pr\xF3ximas funciones Pro.",
    accountNotePro: "Gracias por apoyar Voxylio.",
    accountNoteProCanceled: "Suscripci\xF3n activa hasta el final del per\xEDodo.",
    statusSearching: "Buscando un v\xEDdeo\u2026",
    statusNoVideo: "No se detecta ning\xFAn v\xEDdeo en esta p\xE1gina.",
    statusVideosDetected: "$COUNT$ v\xEDdeo(s) detectado(s)",
    statusLinesReady: "$COUNT$ l\xEDnea(s) lista(s)",
    statusSpeaking: "voz activa",
    statusSubsLoading: "Pista de subt\xEDtulos detectada \u2014 reproduce unos segundos para cargar las l\xEDneas.",
    statusNoSubs: "Este reproductor no expone sus subt\xEDtulos \u2014 el doblaje no es posible en este v\xEDdeo.",
    statusEnableSubs: "Activa los subt\xEDtulos (CC) en el reproductor: Voxylio los lee en directo en este sitio.",
    statusNoVoice: "No hay ninguna voz instalada para este idioma. En Mac: Ajustes del Sistema \u2192 Accesibilidad \u2192 Contenido hablado.",
    statusLocalUnavailable: "Traducci\xF3n local no disponible (modo estricto activo). Chrome puede estar descargando su modelo \u2014 reint\xE9ntalo en un momento.",
    statusTranslateError: "Traducci\xF3n temporalmente no disponible \u2014 reintentando autom\xE1ticamente.",
    statusSiteDisabled: "Voxylio est\xE1 desactivado en este sitio (ver Opciones).",
    statusNoComm: "No se puede comunicar con la p\xE1gina. Rec\xE1rgala (F5) y vuelve a abrir este panel.",
    translationLocal: "Traducci\xF3n: local (Chrome)",
    translationCloud: "Traducci\xF3n: en l\xEDnea",
    translationWaiting: "Traducci\xF3n: en espera\u2026",
    optTitle: "Opciones de Voxylio",
    optTranslation: "Traducci\xF3n",
    optProviderLabel: "Proveedor preferido",
    optProviderAuto: "Autom\xE1tico (local, luego respaldo en l\xEDnea)",
    optProviderDeepl: "DeepL (tu clave API)",
    optProviderGoogle: "Google Cloud Translation (tu clave API)",
    optProviderHint: "La traducci\xF3n local de Chrome siempre va primero. El respaldo en l\xEDnea sin clave es un servicio no oficial \u2014 una clave gratuita de DeepL (500 000 caracteres/mes) es m\xE1s fiable.",
    optDeeplKey: "Clave API de DeepL",
    optGoogleKey: "Clave API de Google Cloud",
    optKeyStored: "Las claves se quedan en este dispositivo \u2014 nunca se sincronizan.",
    optCheckKey: "Comprobar clave",
    optKeyOk: "Clave v\xE1lida \u2014 $USED$ / $LIMIT$ caracteres usados este mes.",
    optKeyBad: "Clave inv\xE1lida o cuota alcanzada.",
    optSites: "Sitios desactivados",
    optSitesHint: "Voxylio permanece totalmente inactivo en estos sitios (sin detecci\xF3n, sin doblaje).",
    optSiteAdd: "A\xF1adir",
    optSitePlaceholder: "ej. youtube.com",
    optSiteRemove: "Quitar",
    optBackup: "Copia de los ajustes",
    optExport: "Exportar (JSON)",
    optImport: "Importar",
    optImported: "Ajustes importados \u2713",
    optImportBad: "Archivo inv\xE1lido.",
    optBackupHint: "La exportaci\xF3n nunca contiene las claves API.",
    optPrivacy: "Privacidad",
    optSaved: "Guardado \u2713",
    proBanner: "\u2726 Traducci\xF3n contextual y pr\xF3ximas funciones",
    signinTitle: "Inicia sesi\xF3n para activar el doblaje",
    signinText: "Gratis con una cuenta de Google. El doblaje y tus ajustes se quedan en tu dispositivo.",
    signinCta: "Continuar con Google",
    signinNote: "No se pide tarjeta.",
    signOut: "Cerrar sesi\xF3n",
    appHistory: "Historial",
    appVoices: "Voces",
    appSettings: "Ajustes",
    appAccount: "Cuenta",
    appSearchSessions: "Buscar una sesi\xF3n\u2026",
    appClearAll: "Borrar todo",
    appNoSessions: "A\xFAn no hay sesiones \u2014 inicia un doblaje y la transcripci\xF3n aparecer\xE1 aqu\xED, totalmente en local.",
    appDeleteSession: "Eliminar",
    appBilingual: "Biling\xFCe",
    appOriginal: "Original",
    appTranslation: "Traducci\xF3n",
    appTimestamps: "Marcas de tiempo",
    appFilterSegments: "Filtrar segmentos\u2026",
    appCopy: "Copiar",
    appCopied: "Copiado \u2713",
    appLines: "l\xEDneas",
    appVoicesHint: "Elige la voz usada para cada idioma de doblaje.",
    appCurrentTarget: "Idioma de doblaje actual",
    appVoiceAuto: "Autom\xE1tica",
    appVoiceAutoHint: "Voxylio elige la mejor voz instalada.",
    appVoiceSet: "Voz elegida:",
    appUseVoice: "Usar esta voz",
    appVoiceInUse: "En uso",
    appSearchVoice: "Buscar una voz\u2026",
    appNoVoices: "No hay voces instaladas para este idioma. En Mac: Ajustes del Sistema \u2192 Accesibilidad \u2192 Contenido hablado \u2192 descarga una voz y vuelve.",
    appPreview: "Escuchar una muestra",
    appLocalVoice: "local",
    appDefaultBadge: "Por defecto",
    appStatsHint: "Estad\xEDsticas calculadas en local \u2014 nada sale de tu dispositivo.",
    appMinutesDubbed: "Minutos doblados",
    appLinesDubbed: "Frases dobladas",
    appLangsUsed: "Idiomas usados",
    appLast30: "\xDAltimos 30 d\xEDas",
    appTopLangs: "Idiomas m\xE1s doblados",
    appNoStats: "Inicia tu primer doblaje para ver aqu\xED tus estad\xEDsticas.",
    historyLink: "Ver el historial de doblajes",
    voicesLink: "Voces",
    ovlMove: "Mover",
    ovlStatusOn: "Doblaje activo",
    ovlStatusOff: "En pausa",
    ovlSpeaking: "Voz activa",
    ovlPower: "Activar o cortar el doblaje",
    ovlLang: "Idioma del doblaje",
    ovlVoice: "Voz",
    ovlAuto: "Autom\xE1tica",
    ovlAutoHint: "La mejor voz instalada, elegida para ti",
    ovlMixer: "Mezclador de audio",
    ovlOrig: "Audio original",
    ovlVoiceVol: "Volumen de la voz",
    ovlDuck: "Original durante la voz",
    ovlPresetImmersion: "Inmersi\xF3n",
    ovlPresetBalanced: "Equilibrado",
    ovlPresetVO: "V.O. presente",
    ovlQuick: "Ajustes r\xE1pidos",
    ovlRate: "Velocidad de la voz",
    ovlCaptionSize: "Tama\xF1o de los subt\xEDtulos",
    ovlSubs: "Subt\xEDtulos en pantalla",
    ovlAutoPause: "Pausa autom\xE1tica si la voz se retrasa",
    ovlMinimize: "Minimizar",
    ovlExpand: "Expandir",
    ovlClose: "Ocultar (reactivable desde el popup)",
    ovlListen: "Escuchar una muestra",
    uiLangLabel: "Idioma de la interfaz",
    uiLangHint: "Se aplica al popup, a esta p\xE1gina y a la barra flotante. Los idiomas de doblaje se eligen aparte.",
    uiLangAuto: "Idioma del navegador"
  };

  // src/messages/de.json
  var de_default = {
    appName: "Voxylio \u2014 mehrsprachige Synchronisation",
    appDesc: "Synchronisiert untertitelte Videos in Echtzeit: lokale \xDCbersetzung, Stimme im Takt der Wiedergabe. \xDCber 65 Sprachen.",
    srcLabel: "Sprache des Videos",
    detectAuto: "Automatisch erkennen",
    targetLabel: "Sprache der Synchronisation",
    voiceLabel: "Stimme",
    voiceAuto: "Automatisch",
    rateLabel: "Sprechtempo",
    duckLabel: "Originalton",
    autoPauseLabel: "Auto-Pause, wenn die Stimme zur\xFCckf\xE4llt",
    localOnlyLabel: "Strikt lokaler Modus",
    subtitlesLabel: "\xDCbersetzte Untertitel im Bild",
    overlayLabel: "Schwebende Steuerung auf der Seite",
    retry: "Erneut versuchen",
    diag: "Diagnose",
    copied: "Kopiert \u2713",
    reset: "Zur\xFCcksetzen",
    options: "Optionen",
    hint: "Starte das Video und lege den Schalter um: die Stimme folgt den Untertiteln in deiner Sprache. Bei 0 % ist nur die Synchronstimme zu h\xF6ren.",
    accountLabel: "Konto",
    accountNotLinked: "Nicht angemeldet",
    accountFree: "Gratis",
    accountPro: "Pro",
    signIn: "Anmelden",
    goPro: "Pro holen",
    manage: "Verwalten",
    accountNoteNotLinked: "Melde dich an, um die Synchronisation zu starten.",
    accountNoteFree: "Schalte kontextbewusste \xDCbersetzung und kommende Pro-Funktionen frei.",
    accountNotePro: "Danke, dass du Voxylio unterst\xFCtzt.",
    accountNoteProCanceled: "Abo aktiv bis zum Ende des Zeitraums.",
    statusSearching: "Suche nach einem Video\u2026",
    statusNoVideo: "Kein Video auf dieser Seite erkannt.",
    statusVideosDetected: "$COUNT$ Video(s) erkannt",
    statusLinesReady: "$COUNT$ Zeile(n) bereit",
    statusSpeaking: "Stimme aktiv",
    statusSubsLoading: "Untertitelspur erkannt \u2014 ein paar Sekunden abspielen, um die Zeilen zu laden.",
    statusNoSubs: "Dieser Player gibt seine Untertitel nicht frei \u2014 Synchronisation ist bei diesem Video nicht m\xF6glich.",
    statusEnableSubs: "Schalte die Untertitel (CC) im Player ein: Voxylio liest sie auf dieser Seite live mit.",
    statusNoVoice: "Keine Stimme f\xFCr diese Sprache installiert. Auf dem Mac: Systemeinstellungen \u2192 Bedienungshilfen \u2192 Gesprochene Inhalte.",
    statusLocalUnavailable: "Lokale \xDCbersetzung nicht verf\xFCgbar (strikter Modus aktiv). Chrome l\xE4dt eventuell gerade sein Modell \u2014 versuch es gleich noch einmal.",
    statusTranslateError: "\xDCbersetzung vor\xFCbergehend nicht verf\xFCgbar \u2014 automatischer neuer Versuch.",
    statusSiteDisabled: "Voxylio ist auf dieser Website deaktiviert (siehe Optionen).",
    statusNoComm: "Keine Verbindung zur Seite. Lade sie neu (F5) und \xF6ffne dieses Panel erneut.",
    translationLocal: "\xDCbersetzung: lokal (Chrome)",
    translationCloud: "\xDCbersetzung: online",
    translationWaiting: "\xDCbersetzung: wartet\u2026",
    optTitle: "Voxylio-Optionen",
    optTranslation: "\xDCbersetzung",
    optProviderLabel: "Bevorzugter Anbieter",
    optProviderAuto: "Automatisch (lokal, dann Online-Fallback)",
    optProviderDeepl: "DeepL (dein API-Schl\xFCssel)",
    optProviderGoogle: "Google Cloud Translation (dein API-Schl\xFCssel)",
    optProviderHint: "Chromes lokale \xDCbersetzung kommt immer zuerst. Der schl\xFCssellose Online-Fallback ist ein inoffizieller Best-Effort-Dienst \u2014 ein kostenloser DeepL-Schl\xFCssel (500.000 Zeichen/Monat) ist zuverl\xE4ssiger.",
    optDeeplKey: "DeepL-API-Schl\xFCssel",
    optGoogleKey: "Google-Cloud-API-Schl\xFCssel",
    optKeyStored: "Schl\xFCssel bleiben auf diesem Ger\xE4t \u2014 nie synchronisiert.",
    optCheckKey: "Schl\xFCssel pr\xFCfen",
    optKeyOk: "G\xFCltiger Schl\xFCssel \u2014 $USED$ / $LIMIT$ Zeichen diesen Monat verbraucht.",
    optKeyBad: "Ung\xFCltiger Schl\xFCssel oder Kontingent erreicht.",
    optSites: "Deaktivierte Websites",
    optSitesHint: "Auf diesen Websites bleibt Voxylio v\xF6llig inaktiv (keine Erkennung, keine Synchronisation).",
    optSiteAdd: "Hinzuf\xFCgen",
    optSitePlaceholder: "z. B. youtube.com",
    optSiteRemove: "Entfernen",
    optBackup: "Einstellungen sichern",
    optExport: "Exportieren (JSON)",
    optImport: "Importieren",
    optImported: "Einstellungen importiert \u2713",
    optImportBad: "Ung\xFCltige Datei.",
    optBackupHint: "Der Export enth\xE4lt nie API-Schl\xFCssel.",
    optPrivacy: "Datenschutz",
    optSaved: "Gespeichert \u2713",
    proBanner: "\u2726 Kontextbewusste \xDCbersetzung und kommende Funktionen",
    signinTitle: "Melde dich an, um zu synchronisieren",
    signinText: "Gratis mit einem Google-Konto. Synchronisation und Einstellungen bleiben auf deinem Ger\xE4t.",
    signinCta: "Weiter mit Google",
    signinNote: "Keine Karte erforderlich.",
    signOut: "Abmelden",
    appHistory: "Verlauf",
    appVoices: "Stimmen",
    appSettings: "Einstellungen",
    appAccount: "Konto",
    appSearchSessions: "Sitzungen durchsuchen\u2026",
    appClearAll: "Alles l\xF6schen",
    appNoSessions: "Noch keine Sitzungen \u2014 starte eine Synchronisation und das Transkript erscheint hier, komplett lokal.",
    appDeleteSession: "L\xF6schen",
    appBilingual: "Zweisprachig",
    appOriginal: "Original",
    appTranslation: "\xDCbersetzung",
    appTimestamps: "Zeitstempel",
    appFilterSegments: "Segmente filtern\u2026",
    appCopy: "Kopieren",
    appCopied: "Kopiert \u2713",
    appLines: "Zeilen",
    appVoicesHint: "W\xE4hle die Stimme f\xFCr jede Synchronsprache.",
    appCurrentTarget: "Aktuelle Synchronsprache",
    appVoiceAuto: "Automatisch",
    appVoiceAutoHint: "Voxylio w\xE4hlt die beste installierte Stimme.",
    appVoiceSet: "Gew\xE4hlte Stimme:",
    appUseVoice: "Diese Stimme verwenden",
    appVoiceInUse: "In Gebrauch",
    appSearchVoice: "Stimmen durchsuchen\u2026",
    appNoVoices: "Keine Stimme f\xFCr diese Sprache installiert. Auf dem Mac: Systemeinstellungen \u2192 Bedienungshilfen \u2192 Gesprochene Inhalte \u2192 Stimme laden und zur\xFCckkommen.",
    appPreview: "H\xF6rprobe abspielen",
    appLocalVoice: "lokal",
    appDefaultBadge: "Standard",
    appStatsHint: "Lokal berechnete Statistiken \u2014 nichts verl\xE4sst dein Ger\xE4t.",
    appMinutesDubbed: "Synchronisierte Minuten",
    appLinesDubbed: "Synchronisierte S\xE4tze",
    appLangsUsed: "Verwendete Sprachen",
    appLast30: "Letzte 30 Tage",
    appTopLangs: "Meistsynchronisierte Sprachen",
    appNoStats: "Starte deine erste Synchronisation, um hier Statistiken zu sehen.",
    historyLink: "Synchronisationsverlauf ansehen",
    voicesLink: "Stimmen",
    ovlMove: "Verschieben",
    ovlStatusOn: "Synchronisation aktiv",
    ovlStatusOff: "Pausiert",
    ovlSpeaking: "Stimme aktiv",
    ovlPower: "Synchronisation ein- oder ausschalten",
    ovlLang: "Sprache der Synchronisation",
    ovlVoice: "Stimme",
    ovlAuto: "Automatisch",
    ovlAutoHint: "Beste installierte Stimme, f\xFCr dich gew\xE4hlt",
    ovlMixer: "Audiomixer",
    ovlOrig: "Originalton",
    ovlVoiceVol: "Lautst\xE4rke der Stimme",
    ovlDuck: "Original w\xE4hrend der Stimme",
    ovlPresetImmersion: "Immersion",
    ovlPresetBalanced: "Ausgewogen",
    ovlPresetVO: "Original pr\xE4sent",
    ovlQuick: "Schnelleinstellungen",
    ovlRate: "Sprechtempo",
    ovlCaptionSize: "Untertitelgr\xF6\xDFe",
    ovlSubs: "Untertitel im Bild",
    ovlAutoPause: "Auto-Pause, wenn die Stimme zur\xFCckf\xE4llt",
    ovlMinimize: "Minimieren",
    ovlExpand: "Vergr\xF6\xDFern",
    ovlClose: "Ausblenden (im Popup reaktivierbar)",
    ovlListen: "H\xF6rprobe abspielen",
    uiLangLabel: "Sprache der Oberfl\xE4che",
    uiLangHint: "Gilt f\xFCr das Popup, diese Seite und die schwebende Leiste. Die Synchronsprachen w\xE4hlst du separat.",
    uiLangAuto: "Browsersprache"
  };

  // src/messages/it.json
  var it_default = {
    appName: "Voxylio \u2014 doppiaggio multilingue",
    appDesc: "Doppia i video sottotitolati in tempo reale: traduzione locale, voce sincronizzata con la riproduzione. Oltre 65 lingue.",
    srcLabel: "Lingua del video",
    detectAuto: "Rilevamento automatico",
    targetLabel: "Lingua del doppiaggio",
    voiceLabel: "Voce",
    voiceAuto: "Automatica",
    rateLabel: "Velocit\xE0 della voce",
    duckLabel: "Audio originale",
    autoPauseLabel: "Pausa automatica se la voce \xE8 in ritardo",
    localOnlyLabel: "Modalit\xE0 rigorosamente locale",
    subtitlesLabel: "Sottotitoli tradotti sullo schermo",
    overlayLabel: "Controlli flottanti sulla pagina",
    retry: "Riprova",
    diag: "Diagnostica",
    copied: "Copiato \u2713",
    reset: "Ripristina",
    options: "Opzioni",
    hint: "Avvia il video e attiva l'interruttore: la voce segue i sottotitoli nella tua lingua. A 0 % si sente solo il doppiaggio.",
    accountLabel: "Account",
    accountNotLinked: "Non connesso",
    accountFree: "Gratis",
    accountPro: "Pro",
    signIn: "Accedi",
    goPro: "Passa a Pro",
    manage: "Gestisci",
    accountNoteNotLinked: "Accedi per attivare il doppiaggio.",
    accountNoteFree: "Sblocca la traduzione contestuale e le prossime funzioni Pro.",
    accountNotePro: "Grazie per sostenere Voxylio.",
    accountNoteProCanceled: "Abbonamento attivo fino alla fine del periodo.",
    statusSearching: "Ricerca di un video\u2026",
    statusNoVideo: "Nessun video rilevato in questa pagina.",
    statusVideosDetected: "$COUNT$ video rilevato/i",
    statusLinesReady: "$COUNT$ battuta/e pronte",
    statusSpeaking: "voce attiva",
    statusSubsLoading: "Traccia di sottotitoli rilevata \u2014 riproduci qualche secondo per caricare le battute.",
    statusNoSubs: "Questo player non espone i suoi sottotitoli \u2014 il doppiaggio non \xE8 possibile su questo video.",
    statusEnableSubs: "Attiva i sottotitoli (CC) nel player: Voxylio li legge in diretta su questo sito.",
    statusNoVoice: "Nessuna voce installata per questa lingua. Su Mac: Impostazioni di Sistema \u2192 Accessibilit\xE0 \u2192 Contenuto letto.",
    statusLocalUnavailable: "Traduzione locale non disponibile (modalit\xE0 rigorosa attiva). Chrome potrebbe stare scaricando il modello \u2014 riprova tra poco.",
    statusTranslateError: "Traduzione momentaneamente non disponibile \u2014 nuovo tentativo automatico.",
    statusSiteDisabled: "Voxylio \xE8 disattivato su questo sito (vedi Opzioni).",
    statusNoComm: "Impossibile comunicare con la pagina. Ricaricala (F5) e riapri questo pannello.",
    translationLocal: "Traduzione: locale (Chrome)",
    translationCloud: "Traduzione: online",
    translationWaiting: "Traduzione: in attesa\u2026",
    optTitle: "Opzioni di Voxylio",
    optTranslation: "Traduzione",
    optProviderLabel: "Fornitore preferito",
    optProviderAuto: "Automatico (locale, poi riserva online)",
    optProviderDeepl: "DeepL (la tua chiave API)",
    optProviderGoogle: "Google Cloud Translation (la tua chiave API)",
    optProviderHint: "La traduzione locale di Chrome viene sempre prima. La riserva online senza chiave \xE8 un servizio non ufficiale \u2014 una chiave DeepL gratuita (500.000 caratteri/mese) \xE8 pi\xF9 affidabile.",
    optDeeplKey: "Chiave API DeepL",
    optGoogleKey: "Chiave API Google Cloud",
    optKeyStored: "Le chiavi restano su questo dispositivo \u2014 mai sincronizzate.",
    optCheckKey: "Verifica chiave",
    optKeyOk: "Chiave valida \u2014 $USED$ / $LIMIT$ caratteri usati questo mese.",
    optKeyBad: "Chiave non valida o quota raggiunta.",
    optSites: "Siti disattivati",
    optSitesHint: "Voxylio resta completamente inattivo su questi siti (nessun rilevamento, nessun doppiaggio).",
    optSiteAdd: "Aggiungi",
    optSitePlaceholder: "es. youtube.com",
    optSiteRemove: "Rimuovi",
    optBackup: "Backup delle impostazioni",
    optExport: "Esporta (JSON)",
    optImport: "Importa",
    optImported: "Impostazioni importate \u2713",
    optImportBad: "File non valido.",
    optBackupHint: "L'esportazione non contiene mai le chiavi API.",
    optPrivacy: "Privacy",
    optSaved: "Salvato \u2713",
    proBanner: "\u2726 Traduzione contestuale e funzioni in arrivo",
    signinTitle: "Accedi per attivare il doppiaggio",
    signinText: "Gratis con un account Google. Il doppiaggio e le tue impostazioni restano sul tuo dispositivo.",
    signinCta: "Continua con Google",
    signinNote: "Nessuna carta richiesta.",
    signOut: "Esci",
    appHistory: "Cronologia",
    appVoices: "Voci",
    appSettings: "Impostazioni",
    appAccount: "Account",
    appSearchSessions: "Cerca una sessione\u2026",
    appClearAll: "Cancella tutto",
    appNoSessions: "Ancora nessuna sessione \u2014 avvia un doppiaggio e la trascrizione apparir\xE0 qui, tutta in locale.",
    appDeleteSession: "Elimina",
    appBilingual: "Bilingue",
    appOriginal: "Originale",
    appTranslation: "Traduzione",
    appTimestamps: "Marcatori temporali",
    appFilterSegments: "Filtra i segmenti\u2026",
    appCopy: "Copia",
    appCopied: "Copiato \u2713",
    appLines: "battute",
    appVoicesHint: "Scegli la voce usata per ogni lingua di doppiaggio.",
    appCurrentTarget: "Lingua di doppiaggio attuale",
    appVoiceAuto: "Automatica",
    appVoiceAutoHint: "Voxylio sceglie la migliore voce installata.",
    appVoiceSet: "Voce scelta:",
    appUseVoice: "Usa questa voce",
    appVoiceInUse: "In uso",
    appSearchVoice: "Cerca una voce\u2026",
    appNoVoices: "Nessuna voce installata per questa lingua. Su Mac: Impostazioni di Sistema \u2192 Accessibilit\xE0 \u2192 Contenuto letto \u2192 scarica una voce e torna qui.",
    appPreview: "Ascolta un'anteprima",
    appLocalVoice: "locale",
    appDefaultBadge: "Predefinita",
    appStatsHint: "Statistiche calcolate in locale \u2014 niente lascia il tuo dispositivo.",
    appMinutesDubbed: "Minuti doppiati",
    appLinesDubbed: "Frasi doppiate",
    appLangsUsed: "Lingue usate",
    appLast30: "Ultimi 30 giorni",
    appTopLangs: "Lingue pi\xF9 doppiate",
    appNoStats: "Avvia il tuo primo doppiaggio per vedere qui le statistiche.",
    historyLink: "Vedi la cronologia dei doppiaggi",
    voicesLink: "Voci",
    ovlMove: "Sposta",
    ovlStatusOn: "Doppiaggio attivo",
    ovlStatusOff: "In pausa",
    ovlSpeaking: "Voce attiva",
    ovlPower: "Attiva o interrompi il doppiaggio",
    ovlLang: "Lingua del doppiaggio",
    ovlVoice: "Voce",
    ovlAuto: "Automatica",
    ovlAutoHint: "La migliore voce installata, scelta per te",
    ovlMixer: "Mixer audio",
    ovlOrig: "Audio originale",
    ovlVoiceVol: "Volume della voce",
    ovlDuck: "Originale durante la voce",
    ovlPresetImmersion: "Immersione",
    ovlPresetBalanced: "Equilibrato",
    ovlPresetVO: "V.O. presente",
    ovlQuick: "Impostazioni rapide",
    ovlRate: "Velocit\xE0 della voce",
    ovlCaptionSize: "Dimensione dei sottotitoli",
    ovlSubs: "Sottotitoli sullo schermo",
    ovlAutoPause: "Pausa automatica se la voce \xE8 in ritardo",
    ovlMinimize: "Riduci",
    ovlExpand: "Espandi",
    ovlClose: "Nascondi (riattivabile dal popup)",
    ovlListen: "Ascolta un'anteprima",
    uiLangLabel: "Lingua dell'interfaccia",
    uiLangHint: "Vale per il popup, questa pagina e la barra flottante. Le lingue di doppiaggio si scelgono a parte.",
    uiLangAuto: "Lingua del browser"
  };

  // src/messages/ja.json
  var ja_default = {
    appName: "Voxylio \u2014 \u591A\u8A00\u8A9E\u5439\u304D\u66FF\u3048",
    appDesc: "\u5B57\u5E55\u4ED8\u304D\u52D5\u753B\u3092\u30EA\u30A2\u30EB\u30BF\u30A4\u30E0\u3067\u5439\u304D\u66FF\u3048\uFF1A\u30ED\u30FC\u30AB\u30EB\u7FFB\u8A33\u3001\u518D\u751F\u306B\u540C\u671F\u3057\u305F\u97F3\u58F0\u300265\u4EE5\u4E0A\u306E\u8A00\u8A9E\u3002",
    srcLabel: "\u52D5\u753B\u306E\u8A00\u8A9E",
    detectAuto: "\u81EA\u52D5\u691C\u51FA",
    targetLabel: "\u5439\u304D\u66FF\u3048\u306E\u8A00\u8A9E",
    voiceLabel: "\u97F3\u58F0",
    voiceAuto: "\u81EA\u52D5",
    rateLabel: "\u8A71\u3059\u901F\u3055",
    duckLabel: "\u5143\u306E\u97F3\u58F0",
    autoPauseLabel: "\u97F3\u58F0\u304C\u9045\u308C\u305F\u3089\u81EA\u52D5\u3067\u4E00\u6642\u505C\u6B62",
    localOnlyLabel: "\u5B8C\u5168\u30ED\u30FC\u30AB\u30EB\u30E2\u30FC\u30C9",
    subtitlesLabel: "\u7FFB\u8A33\u5B57\u5E55\u3092\u753B\u9762\u306B\u8868\u793A",
    overlayLabel: "\u30DA\u30FC\u30B8\u4E0A\u306E\u30D5\u30ED\u30FC\u30C6\u30A3\u30F3\u30B0\u64CD\u4F5C\u30D0\u30FC",
    retry: "\u518D\u8A66\u884C",
    diag: "\u8A3A\u65AD",
    copied: "\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F \u2713",
    reset: "\u30EA\u30BB\u30C3\u30C8",
    options: "\u30AA\u30D7\u30B7\u30E7\u30F3",
    hint: "\u52D5\u753B\u3092\u518D\u751F\u3057\u3066\u30B9\u30A4\u30C3\u30C1\u3092\u30AA\u30F3\u306B\uFF1A\u97F3\u58F0\u304C\u3042\u306A\u305F\u306E\u8A00\u8A9E\u3067\u5B57\u5E55\u3092\u8AAD\u307F\u4E0A\u3052\u307E\u3059\u30020 % \u3067\u306F\u5439\u304D\u66FF\u3048\u3060\u3051\u304C\u805E\u3053\u3048\u307E\u3059\u3002",
    accountLabel: "\u30A2\u30AB\u30A6\u30F3\u30C8",
    accountNotLinked: "\u672A\u30ED\u30B0\u30A4\u30F3",
    accountFree: "\u7121\u6599",
    accountPro: "Pro",
    signIn: "\u30ED\u30B0\u30A4\u30F3",
    goPro: "Pro\u306B\u3059\u308B",
    manage: "\u7BA1\u7406",
    accountNoteNotLinked: "\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u5439\u304D\u66FF\u3048\u3092\u6709\u52B9\u306B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    accountNoteFree: "\u6587\u8108\u3092\u7406\u89E3\u3059\u308B\u7FFB\u8A33\u3068\u4ECA\u5F8C\u306EPro\u6A5F\u80FD\u3092\u89E3\u653E\u3002",
    accountNotePro: "Voxylio\u3078\u306E\u3054\u652F\u63F4\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3059\u3002",
    accountNoteProCanceled: "\u671F\u9593\u7D42\u4E86\u307E\u3067\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u6709\u52B9\u3002",
    statusSearching: "\u52D5\u753B\u3092\u63A2\u3057\u3066\u3044\u307E\u3059\u2026",
    statusNoVideo: "\u3053\u306E\u30DA\u30FC\u30B8\u306B\u52D5\u753B\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002",
    statusVideosDetected: "$COUNT$ \u672C\u306E\u52D5\u753B\u3092\u691C\u51FA",
    statusLinesReady: "$COUNT$ \u4EF6\u306E\u30BB\u30EA\u30D5\u304C\u6E96\u5099\u5B8C\u4E86",
    statusSpeaking: "\u97F3\u58F0\u518D\u751F\u4E2D",
    statusSubsLoading: "\u5B57\u5E55\u30C8\u30E9\u30C3\u30AF\u3092\u691C\u51FA \u2014 \u6570\u79D2\u518D\u751F\u3059\u308B\u3068\u30BB\u30EA\u30D5\u304C\u8AAD\u307F\u8FBC\u307E\u308C\u307E\u3059\u3002",
    statusNoSubs: "\u3053\u306E\u30D7\u30EC\u30FC\u30E4\u30FC\u306F\u5B57\u5E55\u3092\u516C\u958B\u3057\u3066\u3044\u306A\u3044\u305F\u3081\u3001\u3053\u306E\u52D5\u753B\u3067\u306F\u5439\u304D\u66FF\u3048\u3067\u304D\u307E\u305B\u3093\u3002",
    statusEnableSubs: "\u30D7\u30EC\u30FC\u30E4\u30FC\u306E\u5B57\u5E55\uFF08CC\uFF09\u3092\u30AA\u30F3\u306B\uFF1A\u3053\u306E\u30B5\u30A4\u30C8\u3067\u306F Voxylio \u304C\u5B57\u5E55\u3092\u30E9\u30A4\u30D6\u3067\u8AAD\u307F\u53D6\u308A\u307E\u3059\u3002",
    statusNoVoice: "\u3053\u306E\u8A00\u8A9E\u306E\u97F3\u58F0\u304C\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002Mac\uFF1A\u30B7\u30B9\u30C6\u30E0\u8A2D\u5B9A \u2192 \u30A2\u30AF\u30BB\u30B7\u30D3\u30EA\u30C6\u30A3 \u2192 \u8AAD\u307F\u4E0A\u3052\u30B3\u30F3\u30C6\u30F3\u30C4\u3002",
    statusLocalUnavailable: "\u30ED\u30FC\u30AB\u30EB\u7FFB\u8A33\u304C\u5229\u7528\u3067\u304D\u307E\u305B\u3093\uFF08\u53B3\u683C\u30E2\u30FC\u30C9\u6709\u52B9\uFF09\u3002Chrome \u304C\u30E2\u30C7\u30EB\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u4E2D\u304B\u3082\u3057\u308C\u307E\u305B\u3093 \u2014 \u5C11\u3057\u5F85\u3063\u3066\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    statusTranslateError: "\u7FFB\u8A33\u304C\u4E00\u6642\u7684\u306B\u5229\u7528\u3067\u304D\u307E\u305B\u3093 \u2014 \u81EA\u52D5\u3067\u518D\u8A66\u884C\u3057\u307E\u3059\u3002",
    statusSiteDisabled: "\u3053\u306E\u30B5\u30A4\u30C8\u3067\u306F Voxylio \u304C\u7121\u52B9\u3067\u3059\uFF08\u30AA\u30D7\u30B7\u30E7\u30F3\u53C2\u7167\uFF09\u3002",
    statusNoComm: "\u30DA\u30FC\u30B8\u3068\u901A\u4FE1\u3067\u304D\u307E\u305B\u3093\u3002\u518D\u8AAD\u307F\u8FBC\u307F\uFF08F5\uFF09\u3057\u3066\u304B\u3089\u3053\u306E\u30D1\u30CD\u30EB\u3092\u958B\u304D\u76F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    translationLocal: "\u7FFB\u8A33\uFF1A\u30ED\u30FC\u30AB\u30EB\uFF08Chrome\uFF09",
    translationCloud: "\u7FFB\u8A33\uFF1A\u30AA\u30F3\u30E9\u30A4\u30F3",
    translationWaiting: "\u7FFB\u8A33\uFF1A\u5F85\u6A5F\u4E2D\u2026",
    optTitle: "Voxylio \u30AA\u30D7\u30B7\u30E7\u30F3",
    optTranslation: "\u7FFB\u8A33",
    optProviderLabel: "\u512A\u5148\u30D7\u30ED\u30D0\u30A4\u30C0\u30FC",
    optProviderAuto: "\u81EA\u52D5\uFF08\u30ED\u30FC\u30AB\u30EB\u3001\u305D\u306E\u5F8C\u30AA\u30F3\u30E9\u30A4\u30F3\u4E88\u5099\uFF09",
    optProviderDeepl: "DeepL\uFF08\u3042\u306A\u305F\u306EAPI\u30AD\u30FC\uFF09",
    optProviderGoogle: "Google Cloud Translation\uFF08\u3042\u306A\u305F\u306EAPI\u30AD\u30FC\uFF09",
    optProviderHint: "Chrome \u306E\u30ED\u30FC\u30AB\u30EB\u7FFB\u8A33\u304C\u5E38\u306B\u6700\u512A\u5148\u3067\u3059\u3002\u30AD\u30FC\u4E0D\u8981\u306E\u30AA\u30F3\u30E9\u30A4\u30F3\u4E88\u5099\u306F\u975E\u516C\u5F0F\u306E\u30D9\u30B9\u30C8\u30A8\u30D5\u30A9\u30FC\u30C8\u30B5\u30FC\u30D3\u30B9 \u2014 \u7121\u6599\u306E DeepL \u30AD\u30FC\uFF08\u670850\u4E07\u6587\u5B57\uFF09\u306E\u65B9\u304C\u4FE1\u983C\u3067\u304D\u307E\u3059\u3002",
    optDeeplKey: "DeepL API\u30AD\u30FC",
    optGoogleKey: "Google Cloud API\u30AD\u30FC",
    optKeyStored: "\u30AD\u30FC\u306F\u3053\u306E\u7AEF\u672B\u306B\u4FDD\u5B58\u3055\u308C\u3001\u540C\u671F\u3055\u308C\u308B\u3053\u3068\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
    optCheckKey: "\u30AD\u30FC\u3092\u78BA\u8A8D",
    optKeyOk: "\u6709\u52B9\u306A\u30AD\u30FC \u2014 \u4ECA\u6708 $USED$ / $LIMIT$ \u6587\u5B57\u4F7F\u7528\u3002",
    optKeyBad: "\u30AD\u30FC\u304C\u7121\u52B9\u304B\u3001\u4E0A\u9650\u306B\u9054\u3057\u3066\u3044\u307E\u3059\u3002",
    optSites: "\u7121\u52B9\u5316\u3057\u305F\u30B5\u30A4\u30C8",
    optSitesHint: "\u3053\u308C\u3089\u306E\u30B5\u30A4\u30C8\u3067\u306F Voxylio \u306F\u5B8C\u5168\u306B\u505C\u6B62\u3057\u307E\u3059(\u691C\u51FA\u3082\u5439\u304D\u66FF\u3048\u3082\u306A\u3057)\u3002",
    optSiteAdd: "\u8FFD\u52A0",
    optSitePlaceholder: "\u4F8B\uFF1Ayoutube.com",
    optSiteRemove: "\u524A\u9664",
    optBackup: "\u8A2D\u5B9A\u306E\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7",
    optExport: "\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\uFF08JSON\uFF09",
    optImport: "\u30A4\u30F3\u30DD\u30FC\u30C8",
    optImported: "\u8A2D\u5B9A\u3092\u30A4\u30F3\u30DD\u30FC\u30C8\u3057\u307E\u3057\u305F \u2713",
    optImportBad: "\u7121\u52B9\u306A\u30D5\u30A1\u30A4\u30EB\u3067\u3059\u3002",
    optBackupHint: "\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u306BAPI\u30AD\u30FC\u306F\u542B\u307E\u308C\u307E\u305B\u3093\u3002",
    optPrivacy: "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC",
    optSaved: "\u4FDD\u5B58\u3057\u307E\u3057\u305F \u2713",
    proBanner: "\u2726 \u6587\u8108\u3092\u7406\u89E3\u3059\u308B\u7FFB\u8A33\u3068\u4ECA\u5F8C\u306E\u65B0\u6A5F\u80FD",
    signinTitle: "\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u5439\u304D\u66FF\u3048\u3092\u958B\u59CB",
    signinText: "Google \u30A2\u30AB\u30A6\u30F3\u30C8\u3067\u7121\u6599\u3002\u5439\u304D\u66FF\u3048\u3082\u8A2D\u5B9A\u3082\u7AEF\u672B\u4E0A\u306B\u6B8B\u308A\u307E\u3059\u3002",
    signinCta: "Google \u3067\u7D9A\u884C",
    signinNote: "\u30AB\u30FC\u30C9\u306F\u4E0D\u8981\u3067\u3059\u3002",
    signOut: "\u30ED\u30B0\u30A2\u30A6\u30C8",
    appHistory: "\u5C65\u6B74",
    appVoices: "\u97F3\u58F0",
    appSettings: "\u8A2D\u5B9A",
    appAccount: "\u30A2\u30AB\u30A6\u30F3\u30C8",
    appSearchSessions: "\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u691C\u7D22\u2026",
    appClearAll: "\u3059\u3079\u3066\u6D88\u53BB",
    appNoSessions: "\u307E\u3060\u30BB\u30C3\u30B7\u30E7\u30F3\u304C\u3042\u308A\u307E\u305B\u3093 \u2014 \u5439\u304D\u66FF\u3048\u3092\u59CB\u3081\u308B\u3068\u3001\u3053\u3053\u306B\u6587\u5B57\u8D77\u3053\u3057\u304C\u5B8C\u5168\u30ED\u30FC\u30AB\u30EB\u3067\u8868\u793A\u3055\u308C\u307E\u3059\u3002",
    appDeleteSession: "\u524A\u9664",
    appBilingual: "\u30D0\u30A4\u30EA\u30F3\u30AC\u30EB",
    appOriginal: "\u539F\u6587",
    appTranslation: "\u7FFB\u8A33",
    appTimestamps: "\u30BF\u30A4\u30E0\u30B9\u30BF\u30F3\u30D7",
    appFilterSegments: "\u30BB\u30B0\u30E1\u30F3\u30C8\u3092\u7D5E\u308A\u8FBC\u307F\u2026",
    appCopy: "\u30B3\u30D4\u30FC",
    appCopied: "\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F \u2713",
    appLines: "\u4EF6",
    appVoicesHint: "\u5439\u304D\u66FF\u3048\u8A00\u8A9E\u3054\u3068\u306B\u4F7F\u3046\u97F3\u58F0\u3092\u9078\u3079\u307E\u3059\u3002",
    appCurrentTarget: "\u73FE\u5728\u306E\u5439\u304D\u66FF\u3048\u8A00\u8A9E",
    appVoiceAuto: "\u81EA\u52D5",
    appVoiceAutoHint: "Voxylio \u304C\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u6E08\u307F\u306E\u6700\u9069\u306A\u97F3\u58F0\u3092\u9078\u3073\u307E\u3059\u3002",
    appVoiceSet: "\u9078\u629E\u4E2D\u306E\u97F3\u58F0\uFF1A",
    appUseVoice: "\u3053\u306E\u97F3\u58F0\u3092\u4F7F\u3046",
    appVoiceInUse: "\u4F7F\u7528\u4E2D",
    appSearchVoice: "\u97F3\u58F0\u3092\u691C\u7D22\u2026",
    appNoVoices: "\u3053\u306E\u8A00\u8A9E\u306E\u97F3\u58F0\u304C\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002Mac\uFF1A\u30B7\u30B9\u30C6\u30E0\u8A2D\u5B9A \u2192 \u30A2\u30AF\u30BB\u30B7\u30D3\u30EA\u30C6\u30A3 \u2192 \u8AAD\u307F\u4E0A\u3052\u30B3\u30F3\u30C6\u30F3\u30C4 \u2192 \u97F3\u58F0\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u3057\u3066\u623B\u3063\u3066\u304D\u3066\u304F\u3060\u3055\u3044\u3002",
    appPreview: "\u30B5\u30F3\u30D7\u30EB\u3092\u518D\u751F",
    appLocalVoice: "\u30ED\u30FC\u30AB\u30EB",
    appDefaultBadge: "\u30C7\u30D5\u30A9\u30EB\u30C8",
    appStatsHint: "\u7D71\u8A08\u306F\u30ED\u30FC\u30AB\u30EB\u3067\u8A08\u7B97 \u2014 \u7AEF\u672B\u306E\u5916\u306B\u306F\u4F55\u3082\u51FA\u307E\u305B\u3093\u3002",
    appMinutesDubbed: "\u5439\u304D\u66FF\u3048\u305F\u5206\u6570",
    appLinesDubbed: "\u5439\u304D\u66FF\u3048\u305F\u6587",
    appLangsUsed: "\u4F7F\u3063\u305F\u8A00\u8A9E",
    appLast30: "\u904E\u53BB30\u65E5",
    appTopLangs: "\u3088\u304F\u5439\u304D\u66FF\u3048\u308B\u8A00\u8A9E",
    appNoStats: "\u6700\u521D\u306E\u5439\u304D\u66FF\u3048\u3092\u59CB\u3081\u308B\u3068\u3001\u3053\u3053\u306B\u7D71\u8A08\u304C\u8868\u793A\u3055\u308C\u307E\u3059\u3002",
    historyLink: "\u5439\u304D\u66FF\u3048\u5C65\u6B74\u3092\u898B\u308B",
    voicesLink: "\u97F3\u58F0",
    ovlMove: "\u79FB\u52D5",
    ovlStatusOn: "\u5439\u304D\u66FF\u3048\u4E2D",
    ovlStatusOff: "\u4E00\u6642\u505C\u6B62",
    ovlSpeaking: "\u97F3\u58F0\u518D\u751F\u4E2D",
    ovlPower: "\u5439\u304D\u66FF\u3048\u306E\u30AA\u30F3\uFF0F\u30AA\u30D5",
    ovlLang: "\u5439\u304D\u66FF\u3048\u306E\u8A00\u8A9E",
    ovlVoice: "\u97F3\u58F0",
    ovlAuto: "\u81EA\u52D5",
    ovlAutoHint: "\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u6E08\u307F\u306E\u6700\u9069\u306A\u97F3\u58F0\u3092\u81EA\u52D5\u9078\u629E",
    ovlMixer: "\u30AA\u30FC\u30C7\u30A3\u30AA\u30DF\u30AD\u30B5\u30FC",
    ovlOrig: "\u5143\u306E\u97F3\u58F0",
    ovlVoiceVol: "\u97F3\u58F0\u306E\u97F3\u91CF",
    ovlDuck: "\u8AAD\u307F\u4E0A\u3052\u4E2D\u306E\u5143\u306E\u97F3\u58F0",
    ovlPresetImmersion: "\u6CA1\u5165",
    ovlPresetBalanced: "\u30D0\u30E9\u30F3\u30B9",
    ovlPresetVO: "\u539F\u97F3\u91CD\u8996",
    ovlQuick: "\u30AF\u30A4\u30C3\u30AF\u8A2D\u5B9A",
    ovlRate: "\u8A71\u3059\u901F\u3055",
    ovlCaptionSize: "\u5B57\u5E55\u30B5\u30A4\u30BA",
    ovlSubs: "\u753B\u9762\u4E0A\u306E\u5B57\u5E55",
    ovlAutoPause: "\u97F3\u58F0\u304C\u9045\u308C\u305F\u3089\u81EA\u52D5\u3067\u4E00\u6642\u505C\u6B62",
    ovlMinimize: "\u6700\u5C0F\u5316",
    ovlExpand: "\u62E1\u5927",
    ovlClose: "\u975E\u8868\u793A\uFF08\u30DD\u30C3\u30D7\u30A2\u30C3\u30D7\u304B\u3089\u518D\u8868\u793A\u53EF\uFF09",
    ovlListen: "\u30B5\u30F3\u30D7\u30EB\u3092\u518D\u751F",
    uiLangLabel: "\u30A4\u30F3\u30BF\u30FC\u30D5\u30A7\u30FC\u30B9\u306E\u8A00\u8A9E",
    uiLangHint: "\u30DD\u30C3\u30D7\u30A2\u30C3\u30D7\u3001\u3053\u306E\u30DA\u30FC\u30B8\u3001\u30D5\u30ED\u30FC\u30C6\u30A3\u30F3\u30B0\u30D0\u30FC\u306B\u9069\u7528\u3055\u308C\u307E\u3059\u3002\u5439\u304D\u66FF\u3048\u8A00\u8A9E\u306F\u5225\u306B\u9078\u3073\u307E\u3059\u3002",
    uiLangAuto: "\u30D6\u30E9\u30A6\u30B6\u306E\u8A00\u8A9E"
  };

  // src/messages/ko.json
  var ko_default = {
    appName: "Voxylio \u2014 \uB2E4\uAD6D\uC5B4 \uB354\uBE59",
    appDesc: "\uC790\uB9C9 \uC788\uB294 \uB3D9\uC601\uC0C1\uC744 \uC2E4\uC2DC\uAC04\uC73C\uB85C \uB354\uBE59: \uB85C\uCEEC \uBC88\uC5ED, \uC7AC\uC0DD\uC5D0 \uB3D9\uAE30\uD654\uB41C \uC74C\uC131. 65\uAC1C \uC774\uC0C1 \uC5B8\uC5B4.",
    srcLabel: "\uB3D9\uC601\uC0C1 \uC5B8\uC5B4",
    detectAuto: "\uC790\uB3D9 \uAC10\uC9C0",
    targetLabel: "\uB354\uBE59 \uC5B8\uC5B4",
    voiceLabel: "\uC74C\uC131",
    voiceAuto: "\uC790\uB3D9",
    rateLabel: "\uB9D0\uD558\uAE30 \uC18D\uB3C4",
    duckLabel: "\uC6D0\uBCF8 \uC624\uB514\uC624",
    autoPauseLabel: "\uC74C\uC131\uC774 \uB2A6\uC5B4\uC9C0\uBA74 \uC790\uB3D9 \uC77C\uC2DC\uC815\uC9C0",
    localOnlyLabel: "\uC5C4\uACA9 \uB85C\uCEEC \uBAA8\uB4DC",
    subtitlesLabel: "\uBC88\uC5ED \uC790\uB9C9\uC744 \uD654\uBA74\uC5D0 \uD45C\uC2DC",
    overlayLabel: "\uD398\uC774\uC9C0 \uC704 \uD50C\uB85C\uD305 \uCEE8\uD2B8\uB864",
    retry: "\uB2E4\uC2DC \uC2DC\uB3C4",
    diag: "\uC9C4\uB2E8",
    copied: "\uBCF5\uC0AC\uB428 \u2713",
    reset: "\uCD08\uAE30\uD654",
    options: "\uC635\uC158",
    hint: "\uB3D9\uC601\uC0C1\uC744 \uC7AC\uC0DD\uD558\uACE0 \uC2A4\uC704\uCE58\uB97C \uCF1C\uC138\uC694: \uC74C\uC131\uC774 \uB2F9\uC2E0\uC758 \uC5B8\uC5B4\uB85C \uC790\uB9C9\uC744 \uB530\uB77C \uC77D\uC2B5\uB2C8\uB2E4. 0 %\uC5D0\uC11C\uB294 \uB354\uBE59\uB9CC \uB4E4\uB9BD\uB2C8\uB2E4.",
    accountLabel: "\uACC4\uC815",
    accountNotLinked: "\uB85C\uADF8\uC778 \uC548 \uD568",
    accountFree: "\uBB34\uB8CC",
    accountPro: "Pro",
    signIn: "\uB85C\uADF8\uC778",
    goPro: "Pro \uC2DC\uC791",
    manage: "\uAD00\uB9AC",
    accountNoteNotLinked: "\uB85C\uADF8\uC778\uD558\uBA74 \uB354\uBE59\uC774 \uD65C\uC131\uD654\uB429\uB2C8\uB2E4.",
    accountNoteFree: "\uBB38\uB9E5 \uC778\uC2DD \uBC88\uC5ED\uACFC \uC55E\uC73C\uB85C\uC758 Pro \uAE30\uB2A5\uC744 \uC7A0\uAE08 \uD574\uC81C\uD558\uC138\uC694.",
    accountNotePro: "Voxylio\uB97C \uC751\uC6D0\uD574 \uC8FC\uC154\uC11C \uAC10\uC0AC\uD569\uB2C8\uB2E4.",
    accountNoteProCanceled: "\uAE30\uAC04 \uC885\uB8CC\uAE4C\uC9C0 \uAD6C\uB3C5 \uC720\uD6A8.",
    statusSearching: "\uB3D9\uC601\uC0C1\uC744 \uCC3E\uB294 \uC911\u2026",
    statusNoVideo: "\uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB3D9\uC601\uC0C1\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
    statusVideosDetected: "\uB3D9\uC601\uC0C1 $COUNT$\uAC1C \uAC10\uC9C0",
    statusLinesReady: "\uB300\uC0AC $COUNT$\uAC1C \uC900\uBE44\uB428",
    statusSpeaking: "\uC74C\uC131 \uC7AC\uC0DD \uC911",
    statusSubsLoading: "\uC790\uB9C9 \uD2B8\uB799 \uAC10\uC9C0 \u2014 \uBA87 \uCD08 \uC7AC\uC0DD\uD558\uBA74 \uB300\uC0AC\uAC00 \uB85C\uB4DC\uB429\uB2C8\uB2E4.",
    statusNoSubs: "\uC774 \uD50C\uB808\uC774\uC5B4\uB294 \uC790\uB9C9\uC744 \uACF5\uAC1C\uD558\uC9C0 \uC54A\uC544 \uC774 \uB3D9\uC601\uC0C1\uC5D0\uC11C\uB294 \uB354\uBE59\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
    statusEnableSubs: "\uD50C\uB808\uC774\uC5B4\uC5D0\uC11C \uC790\uB9C9(CC)\uC744 \uCF1C\uC138\uC694: \uC774 \uC0AC\uC774\uD2B8\uC5D0\uC11C\uB294 Voxylio\uAC00 \uC790\uB9C9\uC744 \uC2E4\uC2DC\uAC04\uC73C\uB85C \uC77D\uC2B5\uB2C8\uB2E4.",
    statusNoVoice: "\uC774 \uC5B8\uC5B4\uC758 \uC74C\uC131\uC774 \uC124\uCE58\uB418\uC5B4 \uC788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. Mac: \uC2DC\uC2A4\uD15C \uC124\uC815 \u2192 \uC190\uC26C\uC6B4 \uC0AC\uC6A9 \u2192 \uCF58\uD150\uCE20 \uB9D0\uD558\uAE30.",
    statusLocalUnavailable: "\uB85C\uCEEC \uBC88\uC5ED\uC744 \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4(\uC5C4\uACA9 \uBAA8\uB4DC \uCF1C\uC9D0). Chrome\uC774 \uBAA8\uB378\uC744 \uB2E4\uC6B4\uB85C\uB4DC \uC911\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4 \u2014 \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694.",
    statusTranslateError: "\uBC88\uC5ED\uC774 \uC77C\uC2DC\uC801\uC73C\uB85C \uBD88\uAC00\uD569\uB2C8\uB2E4 \u2014 \uC790\uB3D9\uC73C\uB85C \uC7AC\uC2DC\uB3C4\uD569\uB2C8\uB2E4.",
    statusSiteDisabled: "\uC774 \uC0AC\uC774\uD2B8\uC5D0\uC11C\uB294 Voxylio\uAC00 \uBE44\uD65C\uC131\uD654\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4(\uC635\uC158 \uCC38\uC870).",
    statusNoComm: "\uD398\uC774\uC9C0\uC640 \uD1B5\uC2E0\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC0C8\uB85C\uACE0\uCE68(F5) \uD6C4 \uC774 \uD328\uB110\uC744 \uB2E4\uC2DC \uC5EC\uC138\uC694.",
    translationLocal: "\uBC88\uC5ED: \uB85C\uCEEC(Chrome)",
    translationCloud: "\uBC88\uC5ED: \uC628\uB77C\uC778",
    translationWaiting: "\uBC88\uC5ED: \uB300\uAE30 \uC911\u2026",
    optTitle: "Voxylio \uC635\uC158",
    optTranslation: "\uBC88\uC5ED",
    optProviderLabel: "\uC120\uD638 \uC81C\uACF5\uC790",
    optProviderAuto: "\uC790\uB3D9(\uB85C\uCEEC, \uADF8\uB2E4\uC74C \uC628\uB77C\uC778 \uC608\uBE44)",
    optProviderDeepl: "DeepL(\uB0B4 API \uD0A4)",
    optProviderGoogle: "Google Cloud Translation(\uB0B4 API \uD0A4)",
    optProviderHint: "Chrome\uC758 \uB85C\uCEEC \uBC88\uC5ED\uC774 \uD56D\uC0C1 \uC6B0\uC120\uC785\uB2C8\uB2E4. \uD0A4 \uC5C6\uB294 \uC628\uB77C\uC778 \uC608\uBE44\uB294 \uBE44\uACF5\uC2DD \uC11C\uBE44\uC2A4\uC785\uB2C8\uB2E4 \u2014 \uBB34\uB8CC DeepL \uD0A4(\uC6D4 50\uB9CC \uC790)\uAC00 \uB354 \uC548\uC815\uC801\uC785\uB2C8\uB2E4.",
    optDeeplKey: "DeepL API \uD0A4",
    optGoogleKey: "Google Cloud API \uD0A4",
    optKeyStored: "\uD0A4\uB294 \uC774 \uAE30\uAE30\uC5D0\uB9CC \uC800\uC7A5\uB418\uBA70 \uB3D9\uAE30\uD654\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    optCheckKey: "\uD0A4 \uD655\uC778",
    optKeyOk: "\uC720\uD6A8\uD55C \uD0A4 \u2014 \uC774\uBC88 \uB2EC $USED$ / $LIMIT$\uC790 \uC0AC\uC6A9.",
    optKeyBad: "\uD0A4\uAC00 \uC798\uBABB\uB418\uC5C8\uAC70\uB098 \uD55C\uB3C4\uC5D0 \uB3C4\uB2EC\uD588\uC2B5\uB2C8\uB2E4.",
    optSites: "\uBE44\uD65C\uC131\uD654\uD55C \uC0AC\uC774\uD2B8",
    optSitesHint: "\uC774 \uC0AC\uC774\uD2B8\uB4E4\uC5D0\uC11C\uB294 Voxylio\uAC00 \uC644\uC804\uD788 \uBE44\uD65C\uC131\uD654\uB429\uB2C8\uB2E4(\uAC10\uC9C0\uB3C4 \uB354\uBE59\uB3C4 \uC5C6\uC74C).",
    optSiteAdd: "\uCD94\uAC00",
    optSitePlaceholder: "\uC608: youtube.com",
    optSiteRemove: "\uC81C\uAC70",
    optBackup: "\uC124\uC815 \uBC31\uC5C5",
    optExport: "\uB0B4\uBCF4\uB0B4\uAE30(JSON)",
    optImport: "\uAC00\uC838\uC624\uAE30",
    optImported: "\uC124\uC815\uC744 \uAC00\uC838\uC654\uC2B5\uB2C8\uB2E4 \u2713",
    optImportBad: "\uC798\uBABB\uB41C \uD30C\uC77C\uC785\uB2C8\uB2E4.",
    optBackupHint: "\uB0B4\uBCF4\uB0B4\uAE30\uC5D0\uB294 API \uD0A4\uAC00 \uD3EC\uD568\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    optPrivacy: "\uAC1C\uC778\uC815\uBCF4",
    optSaved: "\uC800\uC7A5\uB428 \u2713",
    proBanner: "\u2726 \uBB38\uB9E5 \uC778\uC2DD \uBC88\uC5ED\uACFC \uC55E\uC73C\uB85C\uC758 \uAE30\uB2A5",
    signinTitle: "\uB85C\uADF8\uC778\uD558\uACE0 \uB354\uBE59\uC744 \uC2DC\uC791\uD558\uC138\uC694",
    signinText: "Google \uACC4\uC815\uC73C\uB85C \uBB34\uB8CC. \uB354\uBE59\uACFC \uC124\uC815\uC740 \uAE30\uAE30\uC5D0 \uB0A8\uC2B5\uB2C8\uB2E4.",
    signinCta: "Google\uB85C \uACC4\uC18D",
    signinNote: "\uCE74\uB4DC\uB294 \uD544\uC694 \uC5C6\uC2B5\uB2C8\uB2E4.",
    signOut: "\uB85C\uADF8\uC544\uC6C3",
    appHistory: "\uAE30\uB85D",
    appVoices: "\uC74C\uC131",
    appSettings: "\uC124\uC815",
    appAccount: "\uACC4\uC815",
    appSearchSessions: "\uC138\uC158 \uAC80\uC0C9\u2026",
    appClearAll: "\uBAA8\uB450 \uC9C0\uC6B0\uAE30",
    appNoSessions: "\uC544\uC9C1 \uC138\uC158\uC774 \uC5C6\uC2B5\uB2C8\uB2E4 \u2014 \uB354\uBE59\uC744 \uC2DC\uC791\uD558\uBA74 \uC5EC\uAE30 \uD2B8\uB79C\uC2A4\uD06C\uB9BD\uD2B8\uAC00 \uC644\uC804\uD788 \uB85C\uCEEC\uB85C \uB098\uD0C0\uB0A9\uB2C8\uB2E4.",
    appDeleteSession: "\uC0AD\uC81C",
    appBilingual: "\uC774\uC911 \uC5B8\uC5B4",
    appOriginal: "\uC6D0\uBB38",
    appTranslation: "\uBC88\uC5ED",
    appTimestamps: "\uD0C0\uC784\uC2A4\uD0EC\uD504",
    appFilterSegments: "\uAD6C\uAC04 \uD544\uD130\u2026",
    appCopy: "\uBCF5\uC0AC",
    appCopied: "\uBCF5\uC0AC\uB428 \u2713",
    appLines: "\uAC1C",
    appVoicesHint: "\uB354\uBE59 \uC5B8\uC5B4\uB9C8\uB2E4 \uC0AC\uC6A9\uD560 \uC74C\uC131\uC744 \uACE0\uB974\uC138\uC694.",
    appCurrentTarget: "\uD604\uC7AC \uB354\uBE59 \uC5B8\uC5B4",
    appVoiceAuto: "\uC790\uB3D9",
    appVoiceAutoHint: "Voxylio\uAC00 \uC124\uCE58\uB41C \uCD5C\uC801\uC758 \uC74C\uC131\uC744 \uACE0\uB985\uB2C8\uB2E4.",
    appVoiceSet: "\uC120\uD0DD\uD55C \uC74C\uC131:",
    appUseVoice: "\uC774 \uC74C\uC131 \uC0AC\uC6A9",
    appVoiceInUse: "\uC0AC\uC6A9 \uC911",
    appSearchVoice: "\uC74C\uC131 \uAC80\uC0C9\u2026",
    appNoVoices: "\uC774 \uC5B8\uC5B4\uC758 \uC74C\uC131\uC774 \uC124\uCE58\uB418\uC5B4 \uC788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. Mac: \uC2DC\uC2A4\uD15C \uC124\uC815 \u2192 \uC190\uC26C\uC6B4 \uC0AC\uC6A9 \u2192 \uCF58\uD150\uCE20 \uB9D0\uD558\uAE30 \u2192 \uC74C\uC131\uC744 \uB2E4\uC6B4\uB85C\uB4DC\uD55C \uB4A4 \uB3CC\uC544\uC624\uC138\uC694.",
    appPreview: "\uBBF8\uB9AC \uB4E3\uAE30",
    appLocalVoice: "\uB85C\uCEEC",
    appDefaultBadge: "\uAE30\uBCF8",
    appStatsHint: "\uD1B5\uACC4\uB294 \uB85C\uCEEC\uC5D0\uC11C \uACC4\uC0B0 \u2014 \uC544\uBB34\uAC83\uB3C4 \uAE30\uAE30\uB97C \uB5A0\uB098\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    appMinutesDubbed: "\uB354\uBE59\uD55C \uBD84",
    appLinesDubbed: "\uB354\uBE59\uD55C \uBB38\uC7A5",
    appLangsUsed: "\uC0AC\uC6A9\uD55C \uC5B8\uC5B4",
    appLast30: "\uCD5C\uADFC 30\uC77C",
    appTopLangs: "\uAC00\uC7A5 \uB9CE\uC774 \uB354\uBE59\uD55C \uC5B8\uC5B4",
    appNoStats: "\uCCAB \uB354\uBE59\uC744 \uC2DC\uC791\uD558\uBA74 \uC5EC\uAE30\uC5D0 \uD1B5\uACC4\uAC00 \uD45C\uC2DC\uB429\uB2C8\uB2E4.",
    historyLink: "\uB354\uBE59 \uAE30\uB85D \uBCF4\uAE30",
    voicesLink: "\uC74C\uC131",
    ovlMove: "\uC774\uB3D9",
    ovlStatusOn: "\uB354\uBE59 \uC911",
    ovlStatusOff: "\uC77C\uC2DC\uC815\uC9C0",
    ovlSpeaking: "\uC74C\uC131 \uC7AC\uC0DD \uC911",
    ovlPower: "\uB354\uBE59 \uCF1C\uAE30/\uB044\uAE30",
    ovlLang: "\uB354\uBE59 \uC5B8\uC5B4",
    ovlVoice: "\uC74C\uC131",
    ovlAuto: "\uC790\uB3D9",
    ovlAutoHint: "\uC124\uCE58\uB41C \uCD5C\uC801\uC758 \uC74C\uC131\uC744 \uC790\uB3D9 \uC120\uD0DD",
    ovlMixer: "\uC624\uB514\uC624 \uBBF9\uC11C",
    ovlOrig: "\uC6D0\uBCF8 \uC624\uB514\uC624",
    ovlVoiceVol: "\uC74C\uC131 \uBCFC\uB968",
    ovlDuck: "\uC74C\uC131 \uC7AC\uC0DD \uC911 \uC6D0\uBCF8",
    ovlPresetImmersion: "\uBAB0\uC785",
    ovlPresetBalanced: "\uADE0\uD615",
    ovlPresetVO: "\uC6D0\uC74C \uC911\uC2DC",
    ovlQuick: "\uBE60\uB978 \uC124\uC815",
    ovlRate: "\uB9D0\uD558\uAE30 \uC18D\uB3C4",
    ovlCaptionSize: "\uC790\uB9C9 \uD06C\uAE30",
    ovlSubs: "\uD654\uBA74 \uC790\uB9C9",
    ovlAutoPause: "\uC74C\uC131\uC774 \uB2A6\uC5B4\uC9C0\uBA74 \uC790\uB3D9 \uC77C\uC2DC\uC815\uC9C0",
    ovlMinimize: "\uCD5C\uC18C\uD654",
    ovlExpand: "\uD655\uB300",
    ovlClose: "\uC228\uAE30\uAE30(\uD31D\uC5C5\uC5D0\uC11C \uB2E4\uC2DC \uCF24 \uC218 \uC788\uC74C)",
    ovlListen: "\uBBF8\uB9AC \uB4E3\uAE30",
    uiLangLabel: "\uC778\uD130\uD398\uC774\uC2A4 \uC5B8\uC5B4",
    uiLangHint: "\uD31D\uC5C5, \uC774 \uD398\uC774\uC9C0, \uD50C\uB85C\uD305 \uBC14\uC5D0 \uC801\uC6A9\uB429\uB2C8\uB2E4. \uB354\uBE59 \uC5B8\uC5B4\uB294 \uB530\uB85C \uC120\uD0DD\uD569\uB2C8\uB2E4.",
    uiLangAuto: "\uBE0C\uB77C\uC6B0\uC800 \uC5B8\uC5B4"
  };

  // src/messages/zh-CN.json
  var zh_CN_default = {
    appName: "Voxylio \u2014 \u591A\u8BED\u8A00\u914D\u97F3",
    appDesc: "\u5B9E\u65F6\u4E3A\u5E26\u5B57\u5E55\u7684\u89C6\u9891\u914D\u97F3\uFF1A\u672C\u5730\u7FFB\u8BD1\uFF0C\u8BED\u97F3\u4E0E\u64AD\u653E\u540C\u6B65\u3002\u652F\u6301 65 \u79CD\u4EE5\u4E0A\u8BED\u8A00\u3002",
    srcLabel: "\u89C6\u9891\u8BED\u8A00",
    detectAuto: "\u81EA\u52A8\u68C0\u6D4B",
    targetLabel: "\u914D\u97F3\u8BED\u8A00",
    voiceLabel: "\u58F0\u97F3",
    voiceAuto: "\u81EA\u52A8",
    rateLabel: "\u8BED\u901F",
    duckLabel: "\u539F\u58F0\u97F3\u91CF",
    autoPauseLabel: "\u8BED\u97F3\u843D\u540E\u65F6\u81EA\u52A8\u6682\u505C",
    localOnlyLabel: "\u4E25\u683C\u672C\u5730\u6A21\u5F0F",
    subtitlesLabel: "\u5728\u753B\u9762\u4E0A\u663E\u793A\u7FFB\u8BD1\u5B57\u5E55",
    overlayLabel: "\u9875\u9762\u4E0A\u7684\u60AC\u6D6E\u63A7\u5236\u6761",
    retry: "\u91CD\u8BD5",
    diag: "\u8BCA\u65AD",
    copied: "\u5DF2\u590D\u5236 \u2713",
    reset: "\u91CD\u7F6E",
    options: "\u9009\u9879",
    hint: "\u64AD\u653E\u89C6\u9891\u5E76\u6253\u5F00\u5F00\u5173\uFF1A\u8BED\u97F3\u4F1A\u7528\u4F60\u7684\u8BED\u8A00\u8DDF\u8BFB\u5B57\u5E55\u3002\u8C03\u5230 0% \u65F6\u53EA\u80FD\u542C\u5230\u914D\u97F3\u3002",
    accountLabel: "\u8D26\u6237",
    accountNotLinked: "\u672A\u767B\u5F55",
    accountFree: "\u514D\u8D39",
    accountPro: "Pro",
    signIn: "\u767B\u5F55",
    goPro: "\u5347\u7EA7 Pro",
    manage: "\u7BA1\u7406",
    accountNoteNotLinked: "\u767B\u5F55\u540E\u5373\u53EF\u542F\u7528\u914D\u97F3\u3002",
    accountNoteFree: "\u89E3\u9501\u7ED3\u5408\u4E0A\u4E0B\u6587\u7684\u7FFB\u8BD1\u548C\u5373\u5C06\u63A8\u51FA\u7684 Pro \u529F\u80FD\u3002",
    accountNotePro: "\u611F\u8C22\u4F60\u652F\u6301 Voxylio\u3002",
    accountNoteProCanceled: "\u8BA2\u9605\u6709\u6548\u671F\u81F3\u672C\u671F\u7ED3\u675F\u3002",
    statusSearching: "\u6B63\u5728\u5BFB\u627E\u89C6\u9891\u2026",
    statusNoVideo: "\u672A\u5728\u6B64\u9875\u9762\u68C0\u6D4B\u5230\u89C6\u9891\u3002",
    statusVideosDetected: "\u68C0\u6D4B\u5230 $COUNT$ \u4E2A\u89C6\u9891",
    statusLinesReady: "$COUNT$ \u6761\u53F0\u8BCD\u5DF2\u5C31\u7EEA",
    statusSpeaking: "\u8BED\u97F3\u64AD\u653E\u4E2D",
    statusSubsLoading: "\u68C0\u6D4B\u5230\u5B57\u5E55\u8F68\u9053 \u2014 \u64AD\u653E\u51E0\u79D2\u5373\u53EF\u52A0\u8F7D\u53F0\u8BCD\u3002",
    statusNoSubs: "\u8BE5\u64AD\u653E\u5668\u672A\u516C\u5F00\u5176\u5B57\u5E55 \u2014 \u6B64\u89C6\u9891\u65E0\u6CD5\u914D\u97F3\u3002",
    statusEnableSubs: "\u8BF7\u5728\u64AD\u653E\u5668\u4E2D\u6253\u5F00\u5B57\u5E55\uFF08CC\uFF09\uFF1A\u5728\u6B64\u7F51\u7AD9\u4E0A\uFF0CVoxylio \u4F1A\u5B9E\u65F6\u8BFB\u53D6\u5B83\u4EEC\u3002",
    statusNoVoice: "\u672A\u5B89\u88C5\u8BE5\u8BED\u8A00\u7684\u8BED\u97F3\u3002Mac\uFF1A\u7CFB\u7EDF\u8BBE\u7F6E \u2192 \u8F85\u52A9\u529F\u80FD \u2192 \u6717\u8BFB\u5185\u5BB9\u3002",
    statusLocalUnavailable: "\u672C\u5730\u7FFB\u8BD1\u4E0D\u53EF\u7528\uFF08\u4E25\u683C\u6A21\u5F0F\u5DF2\u5F00\u542F\uFF09\u3002Chrome \u53EF\u80FD\u6B63\u5728\u4E0B\u8F7D\u6A21\u578B \u2014 \u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002",
    statusTranslateError: "\u7FFB\u8BD1\u6682\u65F6\u4E0D\u53EF\u7528 \u2014 \u6B63\u5728\u81EA\u52A8\u91CD\u8BD5\u3002",
    statusSiteDisabled: "Voxylio \u5DF2\u5728\u6B64\u7F51\u7AD9\u505C\u7528\uFF08\u89C1\u9009\u9879\uFF09\u3002",
    statusNoComm: "\u65E0\u6CD5\u4E0E\u9875\u9762\u901A\u4FE1\u3002\u8BF7\u5237\u65B0\uFF08F5\uFF09\u540E\u91CD\u65B0\u6253\u5F00\u6B64\u9762\u677F\u3002",
    translationLocal: "\u7FFB\u8BD1\uFF1A\u672C\u5730\uFF08Chrome\uFF09",
    translationCloud: "\u7FFB\u8BD1\uFF1A\u5728\u7EBF",
    translationWaiting: "\u7FFB\u8BD1\uFF1A\u7B49\u5F85\u4E2D\u2026",
    optTitle: "Voxylio \u9009\u9879",
    optTranslation: "\u7FFB\u8BD1",
    optProviderLabel: "\u9996\u9009\u670D\u52A1\u5546",
    optProviderAuto: "\u81EA\u52A8\uFF08\u672C\u5730\u4F18\u5148\uFF0C\u5728\u7EBF\u5907\u7528\uFF09",
    optProviderDeepl: "DeepL\uFF08\u4F60\u7684 API \u5BC6\u94A5\uFF09",
    optProviderGoogle: "Google Cloud Translation\uFF08\u4F60\u7684 API \u5BC6\u94A5\uFF09",
    optProviderHint: "Chrome \u7684\u672C\u5730\u7FFB\u8BD1\u59CB\u7EC8\u4F18\u5148\u3002\u65E0\u5BC6\u94A5\u7684\u5728\u7EBF\u5907\u7528\u662F\u975E\u5B98\u65B9\u670D\u52A1 \u2014 \u514D\u8D39\u7684 DeepL \u5BC6\u94A5\uFF08\u6BCF\u6708 50 \u4E07\u5B57\u7B26\uFF09\u66F4\u53EF\u9760\u3002",
    optDeeplKey: "DeepL API \u5BC6\u94A5",
    optGoogleKey: "Google Cloud API \u5BC6\u94A5",
    optKeyStored: "\u5BC6\u94A5\u53EA\u4FDD\u5B58\u5728\u6B64\u8BBE\u5907\u4E0A \u2014 \u7EDD\u4E0D\u540C\u6B65\u3002",
    optCheckKey: "\u68C0\u67E5\u5BC6\u94A5",
    optKeyOk: "\u5BC6\u94A5\u6709\u6548 \u2014 \u672C\u6708\u5DF2\u7528 $USED$ / $LIMIT$ \u5B57\u7B26\u3002",
    optKeyBad: "\u5BC6\u94A5\u65E0\u6548\u6216\u5DF2\u8FBE\u9650\u989D\u3002",
    optSites: "\u5DF2\u505C\u7528\u7684\u7F51\u7AD9",
    optSitesHint: "\u5728\u8FD9\u4E9B\u7F51\u7AD9\u4E0A Voxylio \u5B8C\u5168\u4E0D\u5DE5\u4F5C\uFF08\u4E0D\u68C0\u6D4B\u3001\u4E0D\u914D\u97F3\uFF09\u3002",
    optSiteAdd: "\u6DFB\u52A0",
    optSitePlaceholder: "\u5982 youtube.com",
    optSiteRemove: "\u79FB\u9664",
    optBackup: "\u8BBE\u7F6E\u5907\u4EFD",
    optExport: "\u5BFC\u51FA\uFF08JSON\uFF09",
    optImport: "\u5BFC\u5165",
    optImported: "\u8BBE\u7F6E\u5DF2\u5BFC\u5165 \u2713",
    optImportBad: "\u6587\u4EF6\u65E0\u6548\u3002",
    optBackupHint: "\u5BFC\u51FA\u5185\u5BB9\u7EDD\u4E0D\u5305\u542B API \u5BC6\u94A5\u3002",
    optPrivacy: "\u9690\u79C1",
    optSaved: "\u5DF2\u4FDD\u5B58 \u2713",
    proBanner: "\u2726 \u7ED3\u5408\u4E0A\u4E0B\u6587\u7684\u7FFB\u8BD1\u4E0E\u66F4\u591A\u65B0\u529F\u80FD",
    signinTitle: "\u767B\u5F55\u4EE5\u542F\u7528\u914D\u97F3",
    signinText: "\u7528 Google \u8D26\u6237\u5373\u53EF\uFF0C\u514D\u8D39\u3002\u914D\u97F3\u548C\u8BBE\u7F6E\u90FD\u7559\u5728\u4F60\u7684\u8BBE\u5907\u4E0A\u3002",
    signinCta: "\u7528 Google \u7EE7\u7EED",
    signinNote: "\u65E0\u9700\u94F6\u884C\u5361\u3002",
    signOut: "\u9000\u51FA\u767B\u5F55",
    appHistory: "\u5386\u53F2",
    appVoices: "\u58F0\u97F3",
    appSettings: "\u8BBE\u7F6E",
    appAccount: "\u8D26\u6237",
    appSearchSessions: "\u641C\u7D22\u4F1A\u8BDD\u2026",
    appClearAll: "\u5168\u90E8\u6E05\u9664",
    appNoSessions: "\u8FD8\u6CA1\u6709\u4F1A\u8BDD \u2014 \u5F00\u59CB\u4E00\u6B21\u914D\u97F3\uFF0C\u8F6C\u5199\u5C31\u4F1A\u5B8C\u5168\u5728\u672C\u5730\u663E\u793A\u5728\u8FD9\u91CC\u3002",
    appDeleteSession: "\u5220\u9664",
    appBilingual: "\u53CC\u8BED",
    appOriginal: "\u539F\u6587",
    appTranslation: "\u8BD1\u6587",
    appTimestamps: "\u65F6\u95F4\u6233",
    appFilterSegments: "\u7B5B\u9009\u7247\u6BB5\u2026",
    appCopy: "\u590D\u5236",
    appCopied: "\u5DF2\u590D\u5236 \u2713",
    appLines: "\u6761",
    appVoicesHint: "\u4E3A\u6BCF\u79CD\u914D\u97F3\u8BED\u8A00\u9009\u62E9\u4F7F\u7528\u7684\u58F0\u97F3\u3002",
    appCurrentTarget: "\u5F53\u524D\u914D\u97F3\u8BED\u8A00",
    appVoiceAuto: "\u81EA\u52A8",
    appVoiceAutoHint: "Voxylio \u4F1A\u9009\u62E9\u5DF2\u5B89\u88C5\u7684\u6700\u4F73\u58F0\u97F3\u3002",
    appVoiceSet: "\u5DF2\u9009\u58F0\u97F3\uFF1A",
    appUseVoice: "\u4F7F\u7528\u8FD9\u4E2A\u58F0\u97F3",
    appVoiceInUse: "\u4F7F\u7528\u4E2D",
    appSearchVoice: "\u641C\u7D22\u58F0\u97F3\u2026",
    appNoVoices: "\u672A\u5B89\u88C5\u8BE5\u8BED\u8A00\u7684\u58F0\u97F3\u3002Mac\uFF1A\u7CFB\u7EDF\u8BBE\u7F6E \u2192 \u8F85\u52A9\u529F\u80FD \u2192 \u6717\u8BFB\u5185\u5BB9 \u2192 \u4E0B\u8F7D\u58F0\u97F3\u540E\u518D\u56DE\u6765\u3002",
    appPreview: "\u8BD5\u542C",
    appLocalVoice: "\u672C\u5730",
    appDefaultBadge: "\u9ED8\u8BA4",
    appStatsHint: "\u7EDF\u8BA1\u5728\u672C\u5730\u8BA1\u7B97 \u2014 \u4EFB\u4F55\u6570\u636E\u90FD\u4E0D\u4F1A\u79BB\u5F00\u4F60\u7684\u8BBE\u5907\u3002",
    appMinutesDubbed: "\u914D\u97F3\u5206\u949F\u6570",
    appLinesDubbed: "\u914D\u97F3\u53E5\u6570",
    appLangsUsed: "\u4F7F\u7528\u7684\u8BED\u8A00",
    appLast30: "\u6700\u8FD1 30 \u5929",
    appTopLangs: "\u914D\u97F3\u6700\u591A\u7684\u8BED\u8A00",
    appNoStats: "\u5F00\u59CB\u7B2C\u4E00\u6B21\u914D\u97F3\u540E\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u4F60\u7684\u7EDF\u8BA1\u3002",
    historyLink: "\u67E5\u770B\u914D\u97F3\u5386\u53F2",
    voicesLink: "\u58F0\u97F3",
    ovlMove: "\u79FB\u52A8",
    ovlStatusOn: "\u914D\u97F3\u8FDB\u884C\u4E2D",
    ovlStatusOff: "\u5DF2\u6682\u505C",
    ovlSpeaking: "\u8BED\u97F3\u64AD\u653E\u4E2D",
    ovlPower: "\u5F00\u542F\u6216\u5173\u95ED\u914D\u97F3",
    ovlLang: "\u914D\u97F3\u8BED\u8A00",
    ovlVoice: "\u58F0\u97F3",
    ovlAuto: "\u81EA\u52A8",
    ovlAutoHint: "\u81EA\u52A8\u9009\u7528\u5DF2\u5B89\u88C5\u7684\u6700\u4F73\u58F0\u97F3",
    ovlMixer: "\u97F3\u9891\u6DF7\u97F3\u5668",
    ovlOrig: "\u539F\u58F0",
    ovlVoiceVol: "\u914D\u97F3\u97F3\u91CF",
    ovlDuck: "\u914D\u97F3\u65F6\u7684\u539F\u58F0",
    ovlPresetImmersion: "\u6C89\u6D78",
    ovlPresetBalanced: "\u5747\u8861",
    ovlPresetVO: "\u539F\u58F0\u4F18\u5148",
    ovlQuick: "\u5FEB\u901F\u8BBE\u7F6E",
    ovlRate: "\u8BED\u901F",
    ovlCaptionSize: "\u5B57\u5E55\u5927\u5C0F",
    ovlSubs: "\u753B\u9762\u5B57\u5E55",
    ovlAutoPause: "\u8BED\u97F3\u843D\u540E\u65F6\u81EA\u52A8\u6682\u505C",
    ovlMinimize: "\u6700\u5C0F\u5316",
    ovlExpand: "\u5C55\u5F00",
    ovlClose: "\u9690\u85CF\uFF08\u53EF\u4ECE\u5F39\u7A97\u91CD\u65B0\u5F00\u542F\uFF09",
    ovlListen: "\u8BD5\u542C",
    uiLangLabel: "\u754C\u9762\u8BED\u8A00",
    uiLangHint: "\u4F5C\u7528\u4E8E\u5F39\u7A97\u3001\u672C\u9875\u9762\u548C\u60AC\u6D6E\u6761\u3002\u914D\u97F3\u8BED\u8A00\u53E6\u884C\u9009\u62E9\u3002",
    uiLangAuto: "\u6D4F\u89C8\u5668\u8BED\u8A00"
  };

  // src/messages/zh-TW.json
  var zh_TW_default = {
    appName: "Voxylio \u2014 \u591A\u8A9E\u8A00\u914D\u97F3",
    appDesc: "\u5373\u6642\u70BA\u542B\u5B57\u5E55\u7684\u5F71\u7247\u914D\u97F3\uFF1A\u672C\u6A5F\u7FFB\u8B6F\uFF0C\u8A9E\u97F3\u8207\u64AD\u653E\u540C\u6B65\u3002\u652F\u63F4 65 \u7A2E\u4EE5\u4E0A\u8A9E\u8A00\u3002",
    srcLabel: "\u5F71\u7247\u8A9E\u8A00",
    detectAuto: "\u81EA\u52D5\u5075\u6E2C",
    targetLabel: "\u914D\u97F3\u8A9E\u8A00",
    voiceLabel: "\u8072\u97F3",
    voiceAuto: "\u81EA\u52D5",
    rateLabel: "\u8A9E\u901F",
    duckLabel: "\u539F\u97F3\u97F3\u91CF",
    autoPauseLabel: "\u8A9E\u97F3\u843D\u5F8C\u6642\u81EA\u52D5\u66AB\u505C",
    localOnlyLabel: "\u56B4\u683C\u672C\u6A5F\u6A21\u5F0F",
    subtitlesLabel: "\u5728\u756B\u9762\u4E0A\u986F\u793A\u7FFB\u8B6F\u5B57\u5E55",
    overlayLabel: "\u9801\u9762\u4E0A\u7684\u61F8\u6D6E\u63A7\u5236\u5217",
    retry: "\u91CD\u8A66",
    diag: "\u8A3A\u65B7",
    copied: "\u5DF2\u8907\u88FD \u2713",
    reset: "\u91CD\u8A2D",
    options: "\u9078\u9805",
    hint: "\u64AD\u653E\u5F71\u7247\u4E26\u6253\u958B\u958B\u95DC\uFF1A\u8A9E\u97F3\u6703\u7528\u4F60\u7684\u8A9E\u8A00\u8DDF\u8B80\u5B57\u5E55\u3002\u8ABF\u5230 0% \u6642\u53EA\u807D\u5F97\u5230\u914D\u97F3\u3002",
    accountLabel: "\u5E33\u6236",
    accountNotLinked: "\u672A\u767B\u5165",
    accountFree: "\u514D\u8CBB",
    accountPro: "Pro",
    signIn: "\u767B\u5165",
    goPro: "\u5347\u7D1A Pro",
    manage: "\u7BA1\u7406",
    accountNoteNotLinked: "\u767B\u5165\u5F8C\u5373\u53EF\u555F\u7528\u914D\u97F3\u3002",
    accountNoteFree: "\u89E3\u9396\u7D50\u5408\u4E0A\u4E0B\u6587\u7684\u7FFB\u8B6F\u8207\u5373\u5C07\u63A8\u51FA\u7684 Pro \u529F\u80FD\u3002",
    accountNotePro: "\u611F\u8B1D\u4F60\u652F\u6301 Voxylio\u3002",
    accountNoteProCanceled: "\u8A02\u95B1\u6709\u6548\u81F3\u672C\u671F\u7D50\u675F\u3002",
    statusSearching: "\u6B63\u5728\u5C0B\u627E\u5F71\u7247\u2026",
    statusNoVideo: "\u672A\u5728\u6B64\u9801\u9762\u5075\u6E2C\u5230\u5F71\u7247\u3002",
    statusVideosDetected: "\u5075\u6E2C\u5230 $COUNT$ \u90E8\u5F71\u7247",
    statusLinesReady: "$COUNT$ \u53E5\u53F0\u8A5E\u5DF2\u5C31\u7DD2",
    statusSpeaking: "\u8A9E\u97F3\u64AD\u653E\u4E2D",
    statusSubsLoading: "\u5075\u6E2C\u5230\u5B57\u5E55\u8ECC \u2014 \u64AD\u653E\u5E7E\u79D2\u5373\u53EF\u8F09\u5165\u53F0\u8A5E\u3002",
    statusNoSubs: "\u6B64\u64AD\u653E\u5668\u672A\u516C\u958B\u5176\u5B57\u5E55 \u2014 \u9019\u90E8\u5F71\u7247\u7121\u6CD5\u914D\u97F3\u3002",
    statusEnableSubs: "\u8ACB\u5728\u64AD\u653E\u5668\u4E2D\u958B\u555F\u5B57\u5E55\uFF08CC\uFF09\uFF1A\u5728\u6B64\u7DB2\u7AD9\u4E0A\uFF0CVoxylio \u6703\u5373\u6642\u8B80\u53D6\u5B57\u5E55\u3002",
    statusNoVoice: "\u672A\u5B89\u88DD\u6B64\u8A9E\u8A00\u7684\u8072\u97F3\u3002Mac\uFF1A\u7CFB\u7D71\u8A2D\u5B9A \u2192 \u8F14\u52A9\u4F7F\u7528 \u2192 \u6717\u8B80\u5167\u5BB9\u3002",
    statusLocalUnavailable: "\u672C\u6A5F\u7FFB\u8B6F\u7121\u6CD5\u4F7F\u7528\uFF08\u56B4\u683C\u6A21\u5F0F\u958B\u555F\uFF09\u3002Chrome \u53EF\u80FD\u6B63\u5728\u4E0B\u8F09\u6A21\u578B \u2014 \u8ACB\u7A0D\u5F8C\u518D\u8A66\u3002",
    statusTranslateError: "\u7FFB\u8B6F\u66AB\u6642\u7121\u6CD5\u4F7F\u7528 \u2014 \u6B63\u5728\u81EA\u52D5\u91CD\u8A66\u3002",
    statusSiteDisabled: "Voxylio \u5DF2\u5728\u6B64\u7DB2\u7AD9\u505C\u7528\uFF08\u898B\u9078\u9805\uFF09\u3002",
    statusNoComm: "\u7121\u6CD5\u8207\u9801\u9762\u901A\u8A0A\u3002\u8ACB\u91CD\u65B0\u6574\u7406\uFF08F5\uFF09\u5F8C\u518D\u958B\u555F\u6B64\u9762\u677F\u3002",
    translationLocal: "\u7FFB\u8B6F\uFF1A\u672C\u6A5F\uFF08Chrome\uFF09",
    translationCloud: "\u7FFB\u8B6F\uFF1A\u7DDA\u4E0A",
    translationWaiting: "\u7FFB\u8B6F\uFF1A\u7B49\u5F85\u4E2D\u2026",
    optTitle: "Voxylio \u9078\u9805",
    optTranslation: "\u7FFB\u8B6F",
    optProviderLabel: "\u504F\u597D\u4F9B\u61C9\u5546",
    optProviderAuto: "\u81EA\u52D5\uFF08\u672C\u6A5F\u512A\u5148\uFF0C\u7DDA\u4E0A\u5099\u63F4\uFF09",
    optProviderDeepl: "DeepL\uFF08\u4F60\u7684 API \u91D1\u9470\uFF09",
    optProviderGoogle: "Google Cloud Translation\uFF08\u4F60\u7684 API \u91D1\u9470\uFF09",
    optProviderHint: "Chrome \u7684\u672C\u6A5F\u7FFB\u8B6F\u6C38\u9060\u512A\u5148\u3002\u7121\u91D1\u9470\u7684\u7DDA\u4E0A\u5099\u63F4\u662F\u975E\u5B98\u65B9\u670D\u52D9 \u2014 \u514D\u8CBB\u7684 DeepL \u91D1\u9470\uFF08\u6BCF\u6708 50 \u842C\u5B57\u5143\uFF09\u66F4\u53EF\u9760\u3002",
    optDeeplKey: "DeepL API \u91D1\u9470",
    optGoogleKey: "Google Cloud API \u91D1\u9470",
    optKeyStored: "\u91D1\u9470\u53EA\u4FDD\u5B58\u5728\u6B64\u88DD\u7F6E\u4E0A \u2014 \u7D55\u4E0D\u540C\u6B65\u3002",
    optCheckKey: "\u6AA2\u67E5\u91D1\u9470",
    optKeyOk: "\u91D1\u9470\u6709\u6548 \u2014 \u672C\u6708\u5DF2\u7528 $USED$ / $LIMIT$ \u5B57\u5143\u3002",
    optKeyBad: "\u91D1\u9470\u7121\u6548\u6216\u5DF2\u9054\u984D\u5EA6\u3002",
    optSites: "\u5DF2\u505C\u7528\u7684\u7DB2\u7AD9",
    optSitesHint: "\u5728\u9019\u4E9B\u7DB2\u7AD9\u4E0A Voxylio \u5B8C\u5168\u4E0D\u904B\u4F5C\uFF08\u4E0D\u5075\u6E2C\u3001\u4E0D\u914D\u97F3\uFF09\u3002",
    optSiteAdd: "\u65B0\u589E",
    optSitePlaceholder: "\u4F8B\u5982 youtube.com",
    optSiteRemove: "\u79FB\u9664",
    optBackup: "\u8A2D\u5B9A\u5099\u4EFD",
    optExport: "\u532F\u51FA\uFF08JSON\uFF09",
    optImport: "\u532F\u5165",
    optImported: "\u8A2D\u5B9A\u5DF2\u532F\u5165 \u2713",
    optImportBad: "\u6A94\u6848\u7121\u6548\u3002",
    optBackupHint: "\u532F\u51FA\u5167\u5BB9\u7D55\u4E0D\u5305\u542B API \u91D1\u9470\u3002",
    optPrivacy: "\u96B1\u79C1",
    optSaved: "\u5DF2\u5132\u5B58 \u2713",
    proBanner: "\u2726 \u7D50\u5408\u4E0A\u4E0B\u6587\u7684\u7FFB\u8B6F\u8207\u66F4\u591A\u65B0\u529F\u80FD",
    signinTitle: "\u767B\u5165\u4EE5\u555F\u7528\u914D\u97F3",
    signinText: "\u7528 Google \u5E33\u6236\u5373\u53EF\uFF0C\u514D\u8CBB\u3002\u914D\u97F3\u8207\u8A2D\u5B9A\u90FD\u7559\u5728\u4F60\u7684\u88DD\u7F6E\u4E0A\u3002",
    signinCta: "\u7528 Google \u7E7C\u7E8C",
    signinNote: "\u7121\u9700\u4FE1\u7528\u5361\u3002",
    signOut: "\u767B\u51FA",
    appHistory: "\u6B77\u53F2",
    appVoices: "\u8072\u97F3",
    appSettings: "\u8A2D\u5B9A",
    appAccount: "\u5E33\u6236",
    appSearchSessions: "\u641C\u5C0B\u5DE5\u4F5C\u968E\u6BB5\u2026",
    appClearAll: "\u5168\u90E8\u6E05\u9664",
    appNoSessions: "\u9084\u6C92\u6709\u4EFB\u4F55\u5DE5\u4F5C\u968E\u6BB5 \u2014 \u958B\u59CB\u4E00\u6B21\u914D\u97F3\uFF0C\u9010\u5B57\u7A3F\u5C31\u6703\u5B8C\u5168\u5728\u672C\u6A5F\u986F\u793A\u5728\u9019\u88E1\u3002",
    appDeleteSession: "\u522A\u9664",
    appBilingual: "\u96D9\u8A9E",
    appOriginal: "\u539F\u6587",
    appTranslation: "\u8B6F\u6587",
    appTimestamps: "\u6642\u9593\u6233",
    appFilterSegments: "\u7BE9\u9078\u7247\u6BB5\u2026",
    appCopy: "\u8907\u88FD",
    appCopied: "\u5DF2\u8907\u88FD \u2713",
    appLines: "\u53E5",
    appVoicesHint: "\u70BA\u6BCF\u7A2E\u914D\u97F3\u8A9E\u8A00\u9078\u64C7\u4F7F\u7528\u7684\u8072\u97F3\u3002",
    appCurrentTarget: "\u76EE\u524D\u7684\u914D\u97F3\u8A9E\u8A00",
    appVoiceAuto: "\u81EA\u52D5",
    appVoiceAutoHint: "Voxylio \u6703\u9078\u64C7\u5DF2\u5B89\u88DD\u7684\u6700\u4F73\u8072\u97F3\u3002",
    appVoiceSet: "\u5DF2\u9078\u8072\u97F3\uFF1A",
    appUseVoice: "\u4F7F\u7528\u9019\u500B\u8072\u97F3",
    appVoiceInUse: "\u4F7F\u7528\u4E2D",
    appSearchVoice: "\u641C\u5C0B\u8072\u97F3\u2026",
    appNoVoices: "\u672A\u5B89\u88DD\u6B64\u8A9E\u8A00\u7684\u8072\u97F3\u3002Mac\uFF1A\u7CFB\u7D71\u8A2D\u5B9A \u2192 \u8F14\u52A9\u4F7F\u7528 \u2192 \u6717\u8B80\u5167\u5BB9 \u2192 \u4E0B\u8F09\u8072\u97F3\u5F8C\u518D\u56DE\u4F86\u3002",
    appPreview: "\u8A66\u807D",
    appLocalVoice: "\u672C\u6A5F",
    appDefaultBadge: "\u9810\u8A2D",
    appStatsHint: "\u7D71\u8A08\u5728\u672C\u6A5F\u8A08\u7B97 \u2014 \u4EFB\u4F55\u8CC7\u6599\u90FD\u4E0D\u6703\u96E2\u958B\u4F60\u7684\u88DD\u7F6E\u3002",
    appMinutesDubbed: "\u914D\u97F3\u5206\u9418\u6578",
    appLinesDubbed: "\u914D\u97F3\u53E5\u6578",
    appLangsUsed: "\u4F7F\u7528\u7684\u8A9E\u8A00",
    appLast30: "\u6700\u8FD1 30 \u5929",
    appTopLangs: "\u914D\u97F3\u6700\u591A\u7684\u8A9E\u8A00",
    appNoStats: "\u958B\u59CB\u7B2C\u4E00\u6B21\u914D\u97F3\u5F8C\uFF0C\u9019\u88E1\u6703\u986F\u793A\u4F60\u7684\u7D71\u8A08\u3002",
    historyLink: "\u67E5\u770B\u914D\u97F3\u6B77\u53F2",
    voicesLink: "\u8072\u97F3",
    ovlMove: "\u79FB\u52D5",
    ovlStatusOn: "\u914D\u97F3\u9032\u884C\u4E2D",
    ovlStatusOff: "\u5DF2\u66AB\u505C",
    ovlSpeaking: "\u8A9E\u97F3\u64AD\u653E\u4E2D",
    ovlPower: "\u958B\u555F\u6216\u95DC\u9589\u914D\u97F3",
    ovlLang: "\u914D\u97F3\u8A9E\u8A00",
    ovlVoice: "\u8072\u97F3",
    ovlAuto: "\u81EA\u52D5",
    ovlAutoHint: "\u81EA\u52D5\u9078\u7528\u5DF2\u5B89\u88DD\u7684\u6700\u4F73\u8072\u97F3",
    ovlMixer: "\u97F3\u8A0A\u6DF7\u97F3\u5668",
    ovlOrig: "\u539F\u97F3",
    ovlVoiceVol: "\u914D\u97F3\u97F3\u91CF",
    ovlDuck: "\u914D\u97F3\u6642\u7684\u539F\u97F3",
    ovlPresetImmersion: "\u6C89\u6D78",
    ovlPresetBalanced: "\u5747\u8861",
    ovlPresetVO: "\u539F\u97F3\u512A\u5148",
    ovlQuick: "\u5FEB\u901F\u8A2D\u5B9A",
    ovlRate: "\u8A9E\u901F",
    ovlCaptionSize: "\u5B57\u5E55\u5927\u5C0F",
    ovlSubs: "\u756B\u9762\u5B57\u5E55",
    ovlAutoPause: "\u8A9E\u97F3\u843D\u5F8C\u6642\u81EA\u52D5\u66AB\u505C",
    ovlMinimize: "\u6700\u5C0F\u5316",
    ovlExpand: "\u5C55\u958B",
    ovlClose: "\u96B1\u85CF\uFF08\u53EF\u5F9E\u5F48\u51FA\u8996\u7A97\u91CD\u65B0\u958B\u555F\uFF09",
    ovlListen: "\u8A66\u807D",
    uiLangLabel: "\u4ECB\u9762\u8A9E\u8A00",
    uiLangHint: "\u5957\u7528\u65BC\u5F48\u51FA\u8996\u7A97\u3001\u6B64\u9801\u9762\u8207\u61F8\u6D6E\u5217\u3002\u914D\u97F3\u8A9E\u8A00\u53E6\u884C\u9078\u64C7\u3002",
    uiLangAuto: "\u700F\u89BD\u5668\u8A9E\u8A00"
  };

  // src/messages/pt-BR.json
  var pt_BR_default = {
    appName: "Voxylio \u2014 dublagem multil\xEDngue",
    appDesc: "Dubla v\xEDdeos legendados em tempo real: tradu\xE7\xE3o local, voz sincronizada com a reprodu\xE7\xE3o. Mais de 65 idiomas.",
    srcLabel: "Idioma do v\xEDdeo",
    detectAuto: "Detec\xE7\xE3o autom\xE1tica",
    targetLabel: "Idioma da dublagem",
    voiceLabel: "Voz",
    voiceAuto: "Autom\xE1tica",
    rateLabel: "Velocidade da voz",
    duckLabel: "\xC1udio original",
    autoPauseLabel: "Pausa autom\xE1tica se a voz atrasar",
    localOnlyLabel: "Modo estritamente local",
    subtitlesLabel: "Legendas traduzidas na tela",
    overlayLabel: "Controles flutuantes na p\xE1gina",
    retry: "Tentar de novo",
    diag: "Diagn\xF3stico",
    copied: "Copiado \u2713",
    reset: "Redefinir",
    options: "Op\xE7\xF5es",
    hint: "D\xEA play no v\xEDdeo e ative o interruptor: a voz segue as legendas no seu idioma. Em 0 %, s\xF3 a dublagem \xE9 aud\xEDvel.",
    accountLabel: "Conta",
    accountNotLinked: "Desconectado",
    accountFree: "Gr\xE1tis",
    accountPro: "Pro",
    signIn: "Entrar",
    goPro: "Assinar o Pro",
    manage: "Gerenciar",
    accountNoteNotLinked: "Entre para ativar a dublagem.",
    accountNoteFree: "Desbloqueie a tradu\xE7\xE3o contextual e os pr\xF3ximos recursos Pro.",
    accountNotePro: "Obrigado por apoiar o Voxylio.",
    accountNoteProCanceled: "Assinatura ativa at\xE9 o fim do per\xEDodo.",
    statusSearching: "Procurando um v\xEDdeo\u2026",
    statusNoVideo: "Nenhum v\xEDdeo detectado nesta p\xE1gina.",
    statusVideosDetected: "$COUNT$ v\xEDdeo(s) detectado(s)",
    statusLinesReady: "$COUNT$ fala(s) pronta(s)",
    statusSpeaking: "voz ativa",
    statusSubsLoading: "Trilha de legendas detectada \u2014 reproduza alguns segundos para carregar as falas.",
    statusNoSubs: "Este player n\xE3o exp\xF5e suas legendas \u2014 a dublagem n\xE3o \xE9 poss\xEDvel neste v\xEDdeo.",
    statusEnableSubs: "Ative as legendas (CC) no player: o Voxylio as l\xEA ao vivo neste site.",
    statusNoVoice: "Nenhuma voz instalada para este idioma. No Mac: Ajustes do Sistema \u2192 Acessibilidade \u2192 Conte\xFAdo falado.",
    statusLocalUnavailable: "Tradu\xE7\xE3o local indispon\xEDvel (modo estrito ativo). O Chrome pode estar baixando o modelo \u2014 tente de novo em instantes.",
    statusTranslateError: "Tradu\xE7\xE3o temporariamente indispon\xEDvel \u2014 tentando de novo automaticamente.",
    statusSiteDisabled: "O Voxylio est\xE1 desativado neste site (veja Op\xE7\xF5es).",
    statusNoComm: "N\xE3o foi poss\xEDvel falar com a p\xE1gina. Recarregue (F5) e reabra este painel.",
    translationLocal: "Tradu\xE7\xE3o: local (Chrome)",
    translationCloud: "Tradu\xE7\xE3o: on-line",
    translationWaiting: "Tradu\xE7\xE3o: aguardando\u2026",
    optTitle: "Op\xE7\xF5es do Voxylio",
    optTranslation: "Tradu\xE7\xE3o",
    optProviderLabel: "Provedor preferido",
    optProviderAuto: "Autom\xE1tico (local, depois reserva on-line)",
    optProviderDeepl: "DeepL (sua chave de API)",
    optProviderGoogle: "Google Cloud Translation (sua chave de API)",
    optProviderHint: "A tradu\xE7\xE3o local do Chrome vem sempre primeiro. A reserva on-line sem chave \xE9 um servi\xE7o n\xE3o oficial \u2014 uma chave gratuita do DeepL (500.000 caracteres/m\xEAs) \xE9 mais confi\xE1vel.",
    optDeeplKey: "Chave de API do DeepL",
    optGoogleKey: "Chave de API do Google Cloud",
    optKeyStored: "As chaves ficam neste dispositivo \u2014 nunca sincronizadas.",
    optCheckKey: "Verificar chave",
    optKeyOk: "Chave v\xE1lida \u2014 $USED$ / $LIMIT$ caracteres usados este m\xEAs.",
    optKeyBad: "Chave inv\xE1lida ou cota atingida.",
    optSites: "Sites desativados",
    optSitesHint: "O Voxylio fica totalmente inativo nesses sites (sem detec\xE7\xE3o, sem dublagem).",
    optSiteAdd: "Adicionar",
    optSitePlaceholder: "ex.: youtube.com",
    optSiteRemove: "Remover",
    optBackup: "Backup dos ajustes",
    optExport: "Exportar (JSON)",
    optImport: "Importar",
    optImported: "Ajustes importados \u2713",
    optImportBad: "Arquivo inv\xE1lido.",
    optBackupHint: "A exporta\xE7\xE3o nunca cont\xE9m chaves de API.",
    optPrivacy: "Privacidade",
    optSaved: "Salvo \u2713",
    proBanner: "\u2726 Tradu\xE7\xE3o contextual e recursos por vir",
    signinTitle: "Entre para ativar a dublagem",
    signinText: "Gr\xE1tis com uma conta Google. A dublagem e seus ajustes ficam no seu dispositivo.",
    signinCta: "Continuar com o Google",
    signinNote: "Nenhum cart\xE3o \xE9 pedido.",
    signOut: "Sair",
    appHistory: "Hist\xF3rico",
    appVoices: "Vozes",
    appSettings: "Ajustes",
    appAccount: "Conta",
    appSearchSessions: "Buscar uma sess\xE3o\u2026",
    appClearAll: "Limpar tudo",
    appNoSessions: "Nenhuma sess\xE3o ainda \u2014 inicie uma dublagem e a transcri\xE7\xE3o aparecer\xE1 aqui, totalmente local.",
    appDeleteSession: "Excluir",
    appBilingual: "Bil\xEDngue",
    appOriginal: "Original",
    appTranslation: "Tradu\xE7\xE3o",
    appTimestamps: "Marca\xE7\xF5es de tempo",
    appFilterSegments: "Filtrar segmentos\u2026",
    appCopy: "Copiar",
    appCopied: "Copiado \u2713",
    appLines: "falas",
    appVoicesHint: "Escolha a voz usada para cada idioma de dublagem.",
    appCurrentTarget: "Idioma de dublagem atual",
    appVoiceAuto: "Autom\xE1tica",
    appVoiceAutoHint: "O Voxylio escolhe a melhor voz instalada.",
    appVoiceSet: "Voz escolhida:",
    appUseVoice: "Usar esta voz",
    appVoiceInUse: "Em uso",
    appSearchVoice: "Buscar uma voz\u2026",
    appNoVoices: "Nenhuma voz instalada para este idioma. No Mac: Ajustes do Sistema \u2192 Acessibilidade \u2192 Conte\xFAdo falado \u2192 baixe uma voz e volte.",
    appPreview: "Ouvir uma amostra",
    appLocalVoice: "local",
    appDefaultBadge: "Padr\xE3o",
    appStatsHint: "Estat\xEDsticas calculadas localmente \u2014 nada sai do seu dispositivo.",
    appMinutesDubbed: "Minutos dublados",
    appLinesDubbed: "Frases dubladas",
    appLangsUsed: "Idiomas usados",
    appLast30: "\xDAltimos 30 dias",
    appTopLangs: "Idiomas mais dublados",
    appNoStats: "Inicie sua primeira dublagem para ver suas estat\xEDsticas aqui.",
    historyLink: "Ver o hist\xF3rico de dublagens",
    voicesLink: "Vozes",
    ovlMove: "Mover",
    ovlStatusOn: "Dublagem ativa",
    ovlStatusOff: "Em pausa",
    ovlSpeaking: "Voz ativa",
    ovlPower: "Ligar ou desligar a dublagem",
    ovlLang: "Idioma da dublagem",
    ovlVoice: "Voz",
    ovlAuto: "Autom\xE1tica",
    ovlAutoHint: "A melhor voz instalada, escolhida para voc\xEA",
    ovlMixer: "Mixer de \xE1udio",
    ovlOrig: "\xC1udio original",
    ovlVoiceVol: "Volume da voz",
    ovlDuck: "Original durante a voz",
    ovlPresetImmersion: "Imers\xE3o",
    ovlPresetBalanced: "Equilibrado",
    ovlPresetVO: "Original presente",
    ovlQuick: "Ajustes r\xE1pidos",
    ovlRate: "Velocidade da voz",
    ovlCaptionSize: "Tamanho das legendas",
    ovlSubs: "Legendas na tela",
    ovlAutoPause: "Pausa autom\xE1tica se a voz atrasar",
    ovlMinimize: "Minimizar",
    ovlExpand: "Expandir",
    ovlClose: "Ocultar (reativ\xE1vel pelo popup)",
    ovlListen: "Ouvir uma amostra",
    uiLangLabel: "Idioma da interface",
    uiLangHint: "Vale para o popup, esta p\xE1gina e a barra flutuante. Os idiomas de dublagem s\xE3o escolhidos \xE0 parte.",
    uiLangAuto: "Idioma do navegador"
  };

  // src/i18n.js
  var PACKS = {
    en: en_default,
    fr: fr_default,
    es: es_default,
    de: de_default,
    it: it_default,
    ja: ja_default,
    ko: ko_default,
    "zh-CN": zh_CN_default,
    "zh-TW": zh_TW_default,
    "pt-BR": pt_BR_default
  };
  function resolveUiLang(pref, navLang) {
    if (pref && pref !== "auto" && PACKS[pref]) return pref;
    const raw = String(navLang || "en");
    if (PACKS[raw]) return raw;
    const low = raw.toLowerCase();
    const base = low.split("-")[0];
    if (base === "zh") {
      return /tw|hk|mo|hant/.test(low) ? "zh-TW" : "zh-CN";
    }
    if (base === "pt") return "pt-BR";
    const hit = Object.keys(PACKS).find((k) => k.toLowerCase().split("-")[0] === base);
    return hit || "en";
  }
  function makeT(lang) {
    const pack = PACKS[lang] || PACKS.en;
    return (key, subs) => {
      let msg = pack[key] ?? PACKS.en[key] ?? "";
      if (msg && subs && subs.length) {
        let i = 0;
        msg = msg.replace(
          /\$[A-Z_]+\$/g,
          () => i < subs.length ? String(subs[i++]) : ""
        );
      }
      return msg;
    };
  }
  var UI_LANG_LABELS = {
    en: "English",
    "zh-CN": "\u7B80\u4F53\u4E2D\u6587",
    "zh-TW": "\u7E41\u9AD4\u4E2D\u6587",
    ja: "\u65E5\u672C\u8A9E",
    ko: "\uD55C\uAD6D\uC5B4",
    fr: "Fran\xE7ais",
    de: "Deutsch",
    es: "Espa\xF1ol",
    it: "Italiano",
    "pt-BR": "Portugu\xEAs (BR)"
  };

  // src/app.js
  var $ = (id) => document.getElementById(id);
  var t = () => "";
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
    const raw = await chrome.storage.sync.get(null);
    const migrated = migrateSettings(raw);
    settings = migrated.settings;
    if (migrated.changed) chrome.storage.sync.set(settings);
    t = makeT(resolveUiLang(settings.uiLang, navigator.language));
    applyI18n();
    try {
      $("version").textContent = "Voxylio v" + chrome.runtime.getManifest().version;
    } catch (e) {
    }
    const uiSel = $("uiLang");
    for (const code of UI_LANGS) {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = code === "auto" ? (t("uiLangAuto") || "Langue du navigateur") + " \u2014 " + (UI_LANG_LABELS[resolveUiLang("auto", navigator.language)] || "English") : UI_LANG_LABELS[code];
      uiSel.appendChild(opt);
    }
    uiSel.value = settings.uiLang || "auto";
    uiSel.addEventListener("change", (e) => {
      chrome.storage.sync.set(validateSettings({ uiLang: e.target.value }));
      setTimeout(() => window.location.reload(), 150);
    });
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
