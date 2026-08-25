// GENERATED FILE — do not edit. Source: apps/chrome/src (pnpm build).
(() => {
  // ../../packages/core/src/subtitles.js
  function stripTags(s) {
    return s.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  }
  var SOUND_CUE_RE = /music|musique|applau|laugh|rire|sigh|soupir|cough|toux|inaudible|silence|bruit|noise|chuckle|cheer/i;
  function isSoundCue(inner) {
    return SOUND_CUE_RE.test(inner) || /^[^a-zà-ÿ]*$/.test(inner);
  }
  function cleanCaption(s) {
    return s.replace(/\[[^\]]*\]/g, " ").replace(/\(([^)]*)\)/g, (m, inner) => isSoundCue(inner) ? " " : m).replace(/♪+/g, " ").replace(/^[-–—]\s*/, "").replace(/\s+/g, " ").trim();
  }
  function endsSentence(s) {
    return /[.!?…](["')\]])?$/.test(s.trim());
  }
  function parseTimestamp(ts) {
    const m = ts.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})$/);
    if (!m) return null;
    const h = m[1] ? parseInt(m[1], 10) : 0;
    return h * 3600 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10) + parseInt(m[4].padEnd(3, "0"), 10) / 1e3;
  }
  function parseVTT(text) {
    const cues = [];
    const blocks = text.replace(/\r/g, "").split(/\n\n+/);
    for (const block of blocks) {
      const lines = block.split("\n").filter((l) => l.trim() !== "");
      if (!lines.length) continue;
      let i = 0;
      if (!lines[i].includes("-->")) i++;
      if (i >= lines.length || !lines[i].includes("-->")) continue;
      const [startRaw, endRaw] = lines[i].split("-->");
      const start = parseTimestamp(startRaw);
      const end = parseTimestamp(endRaw.trim().split(/\s+/)[0]);
      if (start == null || end == null) continue;
      const textLines = lines.slice(i + 1).map(stripTags).filter(Boolean);
      if (!textLines.length) continue;
      cues.push({ start, end, text: textLines.join(" ") });
    }
    return cues;
  }

  // ../../packages/core/src/grouping.js
  var GROUP_MAX_LEN = 280;
  var GROUP_MAX_GAP = 1.4;
  function textHash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(36);
  }
  function normalizeWords(s) {
    return s.toLowerCase().replace(/[.,!?…;:'"«»()\[\]]/g, " ").split(/\s+/).filter(Boolean);
  }
  function wordOverlap(a, b, minWords = 2) {
    const aw = normalizeWords(a);
    const bw = normalizeWords(b);
    const max = Math.min(aw.length, bw.length);
    for (let n = max; n >= minWords; n--) {
      let match = true;
      for (let i = 0; i < n; i++) {
        if (aw[aw.length - n + i] !== bw[i]) {
          match = false;
          break;
        }
      }
      if (match) return n;
    }
    return 0;
  }
  function mergeRollup(last, start, end, text) {
    if (!last) return null;
    if (start > last.end + 0.6) return null;
    if (text.startsWith(last.text) || last.text.startsWith(text)) {
      return {
        text: text.length > last.text.length ? text : last.text,
        end: Math.max(last.end, end),
        grew: text.length > last.text.length
      };
    }
    const overlap = wordOverlap(last.text, text, 2);
    if (overlap > 0) {
      const bw = normalizeWords(text);
      if (overlap >= bw.length) {
        return { text: last.text, end: Math.max(last.end, end), grew: false };
      }
      const re = /\S+/g;
      const starts = [];
      let m;
      while ((m = re.exec(last.text)) !== null) starts.push(m.index);
      const cutIdx = starts[starts.length - overlap] ?? 0;
      const head = last.text.slice(0, cutIdx).trimEnd();
      const merged = head ? head + " " + text : text;
      return {
        text: merged,
        end: Math.max(last.end, end),
        grew: merged.length > last.text.length
      };
    }
    return null;
  }
  function buildGroups(cues, opts = {}) {
    const MAX_LEN = opts.maxLen ?? GROUP_MAX_LEN;
    const MAX_GAP = opts.maxGap ?? GROUP_MAX_GAP;
    const groups = [];
    let cur = null;
    for (const c of cues) {
      const txt = cleanCaption(c.text);
      if (!txt) continue;
      if (cur && (endsSentence(cur.text) || c.start - cur.end > MAX_GAP || cur.text.length > MAX_LEN)) {
        groups.push(cur);
        cur = null;
      }
      if (!cur) {
        cur = { start: c.start, end: c.end, text: txt };
      } else if (cur.text.endsWith(txt)) {
        cur.end = Math.max(cur.end, c.end);
      } else {
        cur.end = Math.max(cur.end, c.end);
        cur.text += " " + txt;
      }
    }
    if (cur) groups.push(cur);
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      g.id = "g" + Math.round(g.start * 100);
      g.version = textHash(g.text);
      g.final = i < groups.length - 1;
      g.key = g.id + ":" + g.version;
    }
    return groups;
  }

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
    "\\b(" + PROTECTED_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(
      "|"
    ) + ")\\b",
    "gi"
  );
  function protectTerms(text) {
    const found = [];
    const protectedText = text.replace(TERM_RE, (m) => {
      found.push(m);
      return `\u27E6${found.length - 1}\u27E7`;
    });
    return { protectedText, found };
  }
  function restoreTerms(text, found) {
    const seen = (text.match(/⟦\s*\d+\s*⟧/g) || []).length;
    const restored = text.replace(
      /⟦\s*(\d+)\s*⟧/g,
      (_, i) => found[Number(i)] ?? ""
    );
    const ok = seen === found.length && !/⟦|⟧/.test(restored);
    return { restored, ok };
  }

  // ../../packages/core/src/cache.js
  var BoundedMap = class extends Map {
    constructor(max = 3e3) {
      super();
      this.max = max;
    }
    set(key, value) {
      if (!this.has(key) && this.size >= this.max) {
        let n = 0;
        for (const k of this.keys()) {
          this.delete(k);
          if (++n >= this.max / 2) break;
        }
      }
      return super.set(key, value);
    }
  };

  // ../../packages/core/src/pacing.js
  var WORDS_PER_SECOND = 2.6;
  function computeUtteranceRate({
    text,
    cueDur,
    baseRate,
    playbackRate = 1
  }) {
    const words = text.split(/\s+/).length;
    const estimated = words / WORDS_PER_SECOND;
    let rate = baseRate;
    if (cueDur > 0.5) {
      const ratio = estimated / baseRate / cueDur;
      if (ratio > 1.15) {
        rate = Math.min(baseRate * ratio, baseRate * 1.25, 1.45);
      }
    }
    return Math.min(rate * (playbackRate || 1), 3);
  }

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
  function pickVoice(voices, { targetLang, voiceName = "" }) {
    if (voiceName) {
      const v = voices.find((v2) => v2.name === voiceName);
      if (v) return v;
    }
    const lang = targetLang;
    const prefixes = [lang, ...VOICE_PREFIX_ALIASES[lang] || []];
    const candidates = voices.filter((v) => {
      const vl = (v.lang || "").toLowerCase();
      return prefixes.some((p) => vl.startsWith(p));
    });
    if (!candidates.length) return null;
    const primary = (PRIMARY_LOCALE[lang] || "").toLowerCase();
    const score = (v) => {
      let s = 0;
      const n = (v.name || "").toLowerCase();
      if (/premium|enhanced|amélior/i.test(n)) s += 4;
      if (n.includes("google")) s += 3;
      if (v.localService) s += 1;
      const vl = (v.lang || "").toLowerCase();
      if (vl === lang + "-" + lang || primary && vl === primary) s += 2;
      return s;
    };
    candidates.sort((a, b) => score(b) - score(a));
    return candidates[0];
  }
  var LOCALES = PRIMARY_LOCALE;

  // ../../packages/core/src/settings.js
  var SETTINGS_VERSION = 3;
  var SOURCE_LANGS = ["auto", ...LANGUAGE_CODES];
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
    // Hostnames where Voxylio must stay completely inactive.
    disabledSites: []
  });

  // ../../packages/core/src/translation.js
  var READY_TIMEOUT_MS = 2500;
  var ATTEMPT_TIMEOUT_MS = 8e3;
  var COOLDOWN_MS = 6e4;
  var FAILURES_BEFORE_COOLDOWN = 2;
  function withTimeout(promise, ms, fallbackValue) {
    if (!(ms > 0) || ms === Infinity) return promise;
    let timer;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve(fallbackValue), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }
  var TIMEOUT = /* @__PURE__ */ Symbol("timeout");
  function createTranslatorChain(providers, opts = {}) {
    const {
      readyTimeoutMs = READY_TIMEOUT_MS,
      attemptTimeoutMs = ATTEMPT_TIMEOUT_MS,
      cooldownMs = COOLDOWN_MS,
      failuresBeforeCooldown = FAILURES_BEFORE_COOLDOWN,
      now = () => Date.now()
    } = opts;
    const pairState = /* @__PURE__ */ new Map();
    let lastKind = "none";
    let lastProviderId = "";
    let lastError = "";
    const stateKey = (id, source, target) => `${id}:${source}->${target}`;
    function inCooldown(id, source, target) {
      const s = pairState.get(stateKey(id, source, target));
      return !!s && s.coolUntil > now();
    }
    function recordFailure(id, source, target) {
      const key = stateKey(id, source, target);
      const s = pairState.get(key) ?? { failures: 0, coolUntil: 0 };
      s.failures += 1;
      if (s.failures >= failuresBeforeCooldown) {
        s.coolUntil = now() + cooldownMs;
        s.failures = 0;
      }
      pairState.set(key, s);
    }
    function recordSuccess(id, source, target) {
      pairState.delete(stateKey(id, source, target));
    }
    async function translate(text, source, target) {
      const errors = [];
      for (const p of providers) {
        if (inCooldown(p.id, source, target)) {
          errors.push(`${p.id}: cooling down`);
          continue;
        }
        let translator = null;
        try {
          translator = await withTimeout(p.ready(source, target), readyTimeoutMs, null);
        } catch (e) {
          recordFailure(p.id, source, target);
          errors.push(`${p.id}: ${e && e.message}`);
          continue;
        }
        if (!translator) {
          errors.push(`${p.id}: not ready`);
          continue;
        }
        try {
          const out = await withTimeout(translator.translate(text), attemptTimeoutMs, TIMEOUT);
          if (out === TIMEOUT) throw new Error("attempt timed out");
          if (typeof out !== "string" || !out) throw new Error("empty translation");
          recordSuccess(p.id, source, target);
          lastKind = p.kind;
          lastProviderId = p.id;
          lastError = "";
          return { text: out, providerId: p.id, kind: p.kind };
        } catch (e) {
          recordFailure(p.id, source, target);
          errors.push(`${p.id}: ${e && e.message || "failed"}`);
        }
      }
      lastKind = "none";
      lastProviderId = "";
      lastError = errors.join(" | ") || "no provider";
      throw new Error(lastError);
    }
    return {
      translate,
      lastKind: () => lastKind,
      lastProviderId: () => lastProviderId,
      lastError: () => lastError,
      /** Test/diagnostic hook. */
      _pairState: pairState
    };
  }

  // ../../packages/core/src/journal.js
  var JOURNAL_CAPS = Object.freeze({
    sessions: 40,
    // most recent kept
    linesPerSession: 400,
    days: 60
    // usage stats horizon
  });
  function journalAppendLine(session, line, cap = JOURNAL_CAPS.linesPerSession) {
    const lines = [...session.lines || [], line];
    while (lines.length > cap) lines.shift();
    return { ...session, lines, updatedAt: line.at || session.updatedAt };
  }
  function journalUpsert(list, session, cap = JOURNAL_CAPS.sessions) {
    const rest = (Array.isArray(list) ? list : []).filter((s) => s && s.id !== session.id);
    const out = [session, ...rest];
    out.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return out.slice(0, cap);
  }
  function usageAdd(stats, day, seconds, lines, lang, capDays = JOURNAL_CAPS.days) {
    const s = stats && typeof stats === "object" ? stats : {};
    const days = { ...s.days || {} };
    const prev = days[day] || { s: 0, l: 0 };
    days[day] = { s: prev.s + seconds, l: prev.l + lines };
    const keys = Object.keys(days).sort();
    while (keys.length > capDays) delete days[keys.shift()];
    const langs = { ...s.langs || {} };
    if (lang) langs[lang] = (langs[lang] || 0) + lines;
    return {
      days,
      langs,
      totalS: (s.totalS || 0) + seconds,
      totalL: (s.totalL || 0) + lines
    };
  }
  function fmtTime(sec) {
    const t = Math.max(0, Math.floor(Number(sec) || 0));
    const h = Math.floor(t / 3600);
    const m = Math.floor(t % 3600 / 60);
    const s = t % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  // ../../packages/webext/src/providers/builtin.js
  function createBuiltinProvider({ onBroken } = {}) {
    const instances = /* @__PURE__ */ new Map();
    return {
      id: "builtin",
      kind: "local",
      ready(source, target) {
        if (!source || source === "auto") return Promise.resolve(null);
        const key = source + "->" + target;
        if (!instances.has(key)) {
          instances.set(
            key,
            (async () => {
              try {
                if (typeof Translator === "undefined")
                  throw new Error("no Translator API");
                const avail = await Translator.availability({
                  sourceLanguage: source,
                  targetLanguage: target
                });
                if (avail === "unavailable") throw new Error("pair unavailable");
                const t = await Translator.create({
                  sourceLanguage: source,
                  targetLanguage: target
                });
                return { translate: (text) => t.translate(text) };
              } catch (e) {
                if (onBroken) onBroken(e);
                return null;
              }
            })()
          );
        }
        return instances.get(key);
      }
    };
  }

  // ../../packages/webext/src/providers/gtx.js
  function createGtxProvider() {
    const translatorFor = (source, target) => ({
      translate: async (text) => {
        const resp = await runtime.sendMessage({
          type: "translate",
          provider: "gtx",
          text,
          source: source || "auto",
          target
        });
        if (resp && resp.ok) return resp.text;
        throw new Error(resp && resp.error || "gtx failed");
      }
    });
    return {
      id: "gtx",
      kind: "cloud",
      ready: (source, target) => Promise.resolve(translatorFor(source, target))
    };
  }

  // ../../packages/webext/src/providers/deepl.js
  var DEEPL_TARGETS = /* @__PURE__ */ new Set([
    "ar",
    "bg",
    "cs",
    "da",
    "de",
    "el",
    "en",
    "es",
    "et",
    "fi",
    "fr",
    "he",
    "hu",
    "id",
    "it",
    "ja",
    "ko",
    "lt",
    "lv",
    "nl",
    "no",
    "pl",
    "pt",
    "ro",
    "ru",
    "sk",
    "sl",
    "sv",
    "th",
    "tr",
    "uk",
    "vi",
    "zh"
  ]);
  function createDeeplProvider(hasKey) {
    const translatorFor = (source, target) => ({
      translate: async (text) => {
        const resp = await runtime.sendMessage({
          type: "translate",
          provider: "deepl",
          text,
          source: source || "auto",
          target
        });
        if (resp && resp.ok) return resp.text;
        throw new Error(resp && resp.error || "deepl failed");
      }
    });
    return {
      id: "deepl",
      kind: "cloud",
      ready: (source, target) => Promise.resolve(
        hasKey && hasKey() && DEEPL_TARGETS.has(target) ? translatorFor(source, target) : null
      )
    };
  }

  // ../../packages/webext/src/providers/googlev2.js
  function createGoogleV2Provider(hasKey) {
    const translatorFor = (source, target) => ({
      translate: async (text) => {
        const resp = await runtime.sendMessage({
          type: "translate",
          provider: "googlev2",
          text,
          source: source || "auto",
          target
        });
        if (resp && resp.ok) return resp.text;
        throw new Error(resp && resp.error || "googlev2 failed");
      }
    });
    return {
      id: "googlev2",
      kind: "cloud",
      ready: (source, target) => Promise.resolve(hasKey && hasKey() ? translatorFor(source, target) : null)
    };
  }

  // ../../packages/webext/src/index.js
  var api = typeof browser !== "undefined" && browser?.runtime ? browser : typeof chrome !== "undefined" ? chrome : void 0;
  if (!api) {
    throw new Error("@voxylio/webext: no extension API available");
  }
  var storage = api.storage;
  var runtime = api.runtime;
  function manifestVersion() {
    try {
      return runtime.getManifest().version || "";
    } catch {
      return "";
    }
  }
  function isAlive() {
    try {
      return !!runtime?.id;
    } catch {
      return false;
    }
  }
  function safeSyncSet(patch) {
    try {
      storage.sync.set(patch);
    } catch {
    }
  }
  function safeLocalSet(patch) {
    try {
      storage.local.set(patch);
    } catch {
    }
  }

  // src/content.js
  (() => {
    if (window.__voxylioInjected) return;
    window.__voxylioInjected = true;
    const DEFAULTS2 = { ...DEFAULTS };
    const settings = { ...DEFAULTS2 };
    function siteDisabled() {
      const host = (location.hostname || "").replace(/^www\./, "").toLowerCase();
      return Array.isArray(settings.disabledSites) && settings.disabledSites.includes(host);
    }
    let accountLinked = false;
    function recheckAccount() {
      try {
        const p = runtime.sendMessage({ type: "entitlements" });
        if (p && typeof p.then === "function") {
          p.then((ent) => {
            const linked = !!(ent && ent.linked);
            if (linked !== accountLinked) {
              accountLinked = linked;
              refreshAll();
            }
          }).catch(() => {
          });
        }
      } catch (e) {
      }
    }
    recheckAccount();
    const ACCOUNT_HOSTS = ["voxylio.lndev.me", "localhost", "127.0.0.1"];
    if (ACCOUNT_HOSTS.includes(location.hostname) && window === window.top) {
      window.addEventListener("message", (event) => {
        if (event.source !== window || event.origin !== location.origin) return;
        const msg = event.data;
        if (!msg || typeof msg !== "object") return;
        if (msg.type === "voxylio:link" && typeof msg.token === "string" && msg.token.startsWith("vxt_")) {
          try {
            const p = runtime.sendMessage({
              type: "voxylio:link-relay",
              token: msg.token
            });
            if (p && typeof p.then === "function") {
              p.then((resp) => {
                window.postMessage(
                  {
                    type: "voxylio:linked",
                    ok: !!(resp && resp.ok),
                    plan: resp && resp.plan || "free"
                  },
                  location.origin
                );
              }).catch(() => {
              });
            }
          } catch (e) {
          }
        }
        if (msg.type === "voxylio:unlink") {
          try {
            const p = runtime.sendMessage({ type: "voxylio:unlink-relay" });
            if (p && typeof p.catch === "function") p.catch(() => {
            });
          } catch (e) {
          }
        }
      });
    }
    const controllers = /* @__PURE__ */ new Map();
    let primaryVideo = null;
    function isEligibleVideo(v) {
      if (!v.isConnected) return false;
      const r = v.getBoundingClientRect();
      if (r.width < 200 || r.height < 110) return false;
      return true;
    }
    function scoreVideo(v) {
      const r = v.getBoundingClientRect();
      let s = r.width * r.height;
      const playing = !v.paused && !v.ended && v.readyState > 1;
      if (playing) s += 1e7;
      if (v.muted && v.loop) s -= 5e6;
      return s;
    }
    function pickPrimary() {
      let best = null;
      let bestScore = -Infinity;
      for (const v of controllers.keys()) {
        if (!isEligibleVideo(v)) continue;
        const s = scoreVideo(v);
        if (s > bestScore) {
          bestScore = s;
          best = v;
        }
      }
      return best;
    }
    function onAnyPlay() {
      primaryVideo = pickPrimary();
      refreshAll();
    }
    storage.sync.get(DEFAULTS2, (s) => {
      Object.assign(settings, s);
      refreshAll();
    });
    storage.onChanged.addListener((changes, area) => {
      if (area === "local") {
        if (changes.accountToken || changes.entitlements) recheckAccount();
        if (changes.deeplKey) providerKeys.deepl = changes.deeplKey.newValue || "";
        if (changes.googleKey)
          providerKeys.googlev2 = changes.googleKey.newValue || "";
        if (changes.deeplKey || changes.googleKey) rebuildChain();
        return;
      }
      if (area !== "sync") return;
      for (const [k, v] of Object.entries(changes)) {
        if (k in settings) settings[k] = v.newValue;
      }
      if (changes.targetLang || changes.sourceLang) {
        for (const c of controllers.values()) c.flushSpeech();
      }
      if (changes.provider || changes.cloudFallback) rebuildChain();
      refreshAll();
    });
    function refreshAll() {
      for (const c of controllers.values()) c.onSettingsChanged();
      if (typeof syncOverlay === "function") syncOverlay();
    }
    const cache = new BoundedMap(3e3);
    let builtinBroken = false;
    let pendingCount = 0;
    let translationMode = "none";
    let lastTranslateError = "";
    const builtinProvider = createBuiltinProvider({
      onBroken: () => {
        builtinBroken = true;
      }
    });
    const providerKeys = { deepl: "", googlev2: "" };
    let chain = createTranslatorChain([builtinProvider]);
    function rebuildChain() {
      const list = [builtinProvider];
      if (settings.cloudFallback) {
        if (settings.provider === "deepl" && providerKeys.deepl)
          list.push(createDeeplProvider(() => providerKeys.deepl));
        if (settings.provider === "googlev2" && providerKeys.googlev2)
          list.push(createGoogleV2Provider(() => providerKeys.googlev2));
        list.push(createGtxProvider());
      }
      chain = createTranslatorChain(list);
    }
    rebuildChain();
    try {
      storage.local.get({ deeplKey: "", googleKey: "" }, (k) => {
        providerKeys.deepl = k && k.deeplKey || "";
        providerKeys.googlev2 = k && k.googleKey || "";
        rebuildChain();
      });
    } catch (e) {
    }
    async function translateOnce(text, source, target) {
      try {
        const res = await chain.translate(text, source, target);
        translationMode = res.kind === "local" ? "local" : "cloud";
        lastTranslateError = "";
        return res.text;
      } catch (e) {
        translationMode = "none";
        lastTranslateError = settings.cloudFallback ? e && e.message || "translate failed" : "local-only";
        throw e;
      }
    }
    function translate(text, source) {
      const target = settings.targetLang;
      const key = source + "->" + target + "::" + text;
      if (cache.has(key)) return cache.get(key);
      const p = (async () => {
        pendingCount++;
        try {
          if (settings.keepTerms) {
            const { protectedText, found } = protectTerms(text);
            if (found.length > 0) {
              const raw = await translateOnce(protectedText, source, target);
              const { restored, ok } = restoreTerms(raw, found);
              if (ok) return restored;
            }
          }
          return await translateOnce(text, source, target);
        } finally {
          pendingCount--;
        }
      })();
      p.catch(() => cache.delete(key));
      cache.set(key, p);
      return p;
    }
    let voices = [];
    function loadVoices() {
      voices = speechSynthesis.getVoices() || [];
    }
    loadVoices();
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    let cachedVoice = null;
    let cachedVoiceKey = "";
    function pickVoice2() {
      loadVoices();
      const wanted = settings.voiceByLang && settings.voiceByLang[settings.targetLang] || settings.voiceName;
      const k = settings.targetLang + "|" + wanted + "|" + voices.length;
      if (k === cachedVoiceKey) return cachedVoice;
      cachedVoiceKey = k;
      cachedVoice = pickVoice(voices, {
        targetLang: settings.targetLang,
        voiceName: wanted
      });
      return cachedVoice;
    }
    let journalSession = null;
    let journalDirty = false;
    let journalTimer = null;
    let statsPending = { seconds: 0, lines: 0 };
    function dayKey() {
      const d = /* @__PURE__ */ new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
    function journalFlushSoon() {
      if (journalTimer) return;
      journalTimer = setTimeout(() => {
        journalTimer = null;
        if (!journalDirty || !journalSession || !isAlive()) return;
        journalDirty = false;
        const session = journalSession;
        const spent = statsPending;
        statsPending = { seconds: 0, lines: 0 };
        try {
          storage.local.get({ journal: [], usageStats: null }, (data) => {
            const patch = { journal: journalUpsert(data.journal || [], session) };
            if (spent.lines > 0 || spent.seconds > 0) {
              patch.usageStats = usageAdd(
                data.usageStats,
                dayKey(),
                spent.seconds,
                spent.lines,
                session.target
              );
            }
            safeLocalSet(patch);
          });
        } catch (e) {
        }
      }, 2500);
    }
    function recordLine(group, text, videoTime) {
      const target = settings.targetLang;
      if (!journalSession || journalSession.target !== target) {
        journalSession = {
          id: "js_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7),
          host: (location.hostname || "").replace(/^www\./, ""),
          url: String(location.href || "").slice(0, 300),
          title: (document.title || location.hostname || "").slice(0, 160),
          source: settings.sourceLang,
          target,
          startedAt: Date.now(),
          updatedAt: Date.now(),
          lines: []
        };
      }
      journalSession = journalAppendLine(journalSession, {
        t: Math.round(videoTime * 10) / 10,
        src: group.text,
        dst: text,
        at: Date.now()
      });
      journalDirty = true;
      journalFlushSoon();
    }
    function recordSpokenSeconds(sec) {
      if (!journalSession) return;
      statsPending.seconds += sec;
      statsPending.lines += 1;
      journalDirty = true;
      journalFlushSoon();
    }
    function collectVideos() {
      const out = /* @__PURE__ */ new Set();
      const walk = (root) => {
        let list;
        try {
          list = root.querySelectorAll("video, *");
        } catch (e) {
          return;
        }
        for (const el of list) {
          if (el.tagName === "VIDEO") out.add(el);
          if (el.shadowRoot) walk(el.shadowRoot);
        }
      };
      walk(document);
      return out;
    }
    function makeController(video) {
      const ctl = {
        video,
        cues: [],
        // [{start, end, text}] sorted by start
        cueKeys: /* @__PURE__ */ new Set(),
        // deduplication
        groups: [],
        // full sentences rebuilt from the cues
        lastCueCount: -1,
        trackLang: "",
        // language declared by the chosen subtitle track
        detectedSource: null,
        // source language detected from cue text
        detecting: false,
        captionEl: null,
        // on-screen translated captions container
        trackListened: null,
        staticLoaded: false,
        // Anti-repetition registries (progressive captions can regrow a
        // group; identity is the stable group id, never the mutable text):
        scheduledIds: /* @__PURE__ */ new Set(),
        // groups queued for translation/speech
        spokenIds: /* @__PURE__ */ new Set(),
        // groups already spoken (or deliberately skipped)
        inFlight: /* @__PURE__ */ new Map(),
        // group id -> { version, promise } translation reuse
        generation: 0,
        // bumped on seek/language/track change: voids stale work
        groupMeta: /* @__PURE__ */ new Map(),
        // group id -> { version, changedAt } stability clock
        cleanupAt: 0,
        currentUtterance: null,
        queue: [],
        // pending lines [{text, dur, start, end}] — bounded FIFO
        autoPaused: false,
        // we paused the video to let the voice catch up
        settingVolume: false,
        // our own volume writes (vs the user's)
        savedVolume: null,
        active: false,
        // dubbing actually running on this video
        pollTimer: null,
        lastTime: -1
      };
      function cueKey(start2, text) {
        return Math.round(start2 * 100) + "|" + text;
      }
      function addCue(start2, end, text) {
        text = stripTags(text);
        if (!text) return;
        const key = cueKey(start2, text);
        if (ctl.cueKeys.has(key)) return;
        const last = ctl.cues[ctl.cues.length - 1];
        const merged = mergeRollup(last, start2, end, text);
        if (merged) {
          if (merged.grew) {
            last.text = merged.text;
            ctl.lastCueCount = -1;
          }
          last.end = merged.end;
          ctl.cueKeys.add(key);
          return;
        }
        ctl.cueKeys.add(key);
        ctl.cues.push({ start: start2, end, text, key });
        ctl.cues.sort((a, b) => a.start - b.start);
      }
      function rebuildGroups() {
        if (ctl.cues.length === ctl.lastCueCount) return;
        ctl.lastCueCount = ctl.cues.length;
        ctl.groups = buildGroups(ctl.cues);
        const now = Date.now();
        for (const g of ctl.groups) {
          const meta = ctl.groupMeta.get(g.id);
          if (!meta || meta.version !== g.version) {
            ctl.groupMeta.set(g.id, { version: g.version, changedAt: now });
          }
        }
      }
      function isFinalGroup(g) {
        if (g.final) return true;
        const meta = ctl.groupMeta.get(g.id);
        if (!meta) return false;
        const stableFor = Date.now() - meta.changedAt;
        return stableFor >= (endsSentence(g.text) ? 350 : 650);
      }
      function harvestTextTracks() {
        const tracks = Array.from(video.textTracks || []).filter(
          (t) => t.kind === "subtitles" || t.kind === "captions"
        );
        const wanted = settings.sourceLang;
        const score = (t) => {
          let s = 0;
          const lang = (t.language || "").toLowerCase();
          const label = (t.label || "").toLowerCase();
          if (wanted !== "auto" && lang.startsWith(wanted)) s += 4;
          if (wanted === "auto" && lang.startsWith("en")) s += 2;
          if (label.includes("english") || label.includes("anglais")) s += 1;
          return s;
        };
        tracks.sort((a, b) => score(b) - score(a));
        const track = tracks[0];
        if (!track) return;
        ctl.trackLang = (track.language || "").toLowerCase().split("-")[0];
        if (track.mode === "disabled") track.mode = "hidden";
        const harvest = () => {
          if (!track.cues) return;
          for (const c of Array.from(track.cues)) {
            const raw = typeof c.text === "string" ? c.text : "";
            addCue(c.startTime, c.endTime, raw);
          }
        };
        harvest();
        if (ctl.trackListened !== track) {
          if (ctl.trackListened && ctl.trackHarvestHandler) {
            ctl.trackListened.removeEventListener(
              "cuechange",
              ctl.trackHarvestHandler
            );
          }
          ctl.trackListened = track;
          ctl.trackHarvestHandler = harvest;
          track.addEventListener("cuechange", harvest);
        }
      }
      async function harvestTrackElements() {
        if (ctl.staticLoaded) return;
        if (ctl.trackRetryAt && Date.now() < ctl.trackRetryAt) return;
        const els = Array.from(video.querySelectorAll("track")).filter(
          (t) => !t.kind || t.kind === "subtitles" || t.kind === "captions"
        );
        els.sort((a, b) => {
          const s = (t) => ((t.srclang || "").toLowerCase().startsWith("en") ? 2 : 0) + (/english/i.test(t.label || "") ? 1 : 0);
          return s(b) - s(a);
        });
        const el = els[0];
        if (!el || !el.src) return;
        ctl.staticLoaded = true;
        try {
          const res = await fetch(el.src, { credentials: "include" });
          if (!res.ok) throw new Error("HTTP " + res.status);
          const cues = parseVTT(await res.text());
          for (const c of cues) addCue(c.start, c.end, c.text);
          ctl.trackRetryAt = 0;
        } catch (e) {
          ctl.staticLoaded = false;
          ctl.trackRetryAt = Date.now() + 6e3;
        }
      }
      function effectiveSource() {
        if (settings.sourceLang !== "auto") return settings.sourceLang;
        if (ctl.trackLang) return ctl.trackLang;
        if (ctl.detectedSource) return ctl.detectedSource;
        maybeDetectSource();
        return "auto";
      }
      async function maybeDetectSource() {
        if (ctl.detecting || ctl.detectedSource || ctl.cues.length < 2) return;
        ctl.detecting = true;
        try {
          if (typeof LanguageDetector === "undefined") return;
          const sample = ctl.cues.slice(0, 5).map((c) => c.text).join(" ");
          const detector = await LanguageDetector.create();
          const results = await detector.detect(sample);
          const best = results && results[0];
          if (best && best.confidence > 0.5) {
            ctl.detectedSource = (best.detectedLanguage || "").split("-")[0];
          }
        } catch (e) {
        } finally {
          ctl.detecting = false;
        }
      }
      function pretranslate() {
        if (!ctl.active) return;
        const t = video.currentTime;
        const upcoming = ctl.groups.filter(
          (g) => g.end >= t && g.start <= t + 90 && isFinalGroup(g)
        );
        const source = effectiveSource();
        if (source !== "auto" && source === settings.targetLang) return;
        let launched = 0;
        for (const g of upcoming) {
          const key = source + "->" + settings.targetLang + "::" + g.text;
          if (!cache.has(key)) {
            translate(g.text, source).catch(() => {
            });
            launched++;
            if (launched >= 8 || pendingCount > 10) break;
          }
        }
      }
      function speak(text, cueDur, id) {
        if (id) {
          ctl.spokenIds.add(id);
          ctl.scheduledIds.delete(id);
          ctl.inFlight.delete(id);
        }
        const u = new SpeechSynthesisUtterance(text);
        const v = pickVoice2();
        if (v) u.voice = v;
        u.lang = LOCALES[settings.targetLang] || settings.targetLang;
        const vv = Number(settings.voiceVolume);
        u.volume = Math.max(0, Math.min(100, Number.isFinite(vv) ? vv : 100)) / 100;
        u.rate = computeUtteranceRate({
          text,
          cueDur,
          baseRate: settings.rate,
          playbackRate: video.playbackRate || 1
        });
        const spokeAt = performance.now();
        u.onend = () => {
          recordSpokenSeconds((performance.now() - spokeAt) / 1e3);
          if (ctl.currentUtterance === u) ctl.currentUtterance = null;
          drainQueue();
        };
        u.onerror = u.onend;
        ctl.currentUtterance = u;
        try {
          speechSynthesis.speak(u);
        } catch (e) {
          ctl.currentUtterance = null;
        }
      }
      function drainQueue() {
        if (ctl.autoPaused && !ctl.currentUtterance && ctl.queue.length === 0) {
          ctl.autoPaused = false;
          video.play().catch(() => {
          });
        }
        if (ctl.currentUtterance || ctl.queue.length === 0) return;
        if (video.paused && !ctl.autoPaused || video.seeking) {
          ctl.queue.length = 0;
          return;
        }
        const t = video.currentTime;
        while (ctl.queue.length > 0 && ctl.queue[0].end + 4 < t && !ctl.autoPaused) {
          ctl.queue.shift();
        }
        const q = ctl.queue.shift();
        if (!q) return;
        speak(q.text, q.dur, q.id);
      }
      function enqueue(item) {
        ctl.queue.push(item);
        if (ctl.queue.length > 2) {
          if (settings.autoPause && !video.paused && !ctl.autoPaused) {
            ctl.autoPaused = true;
            video.pause();
          } else if (!ctl.autoPaused) {
            ctl.queue.shift();
          }
        }
        drainQueue();
      }
      async function onGroupEnter(group) {
        ctl.scheduledIds.add(group.id);
        const gen = ctl.generation;
        const target = settings.targetLang;
        const source = effectiveSource();
        if (source !== "auto" && source === target) return;
        let entry = ctl.inFlight.get(group.id);
        if (!entry || entry.version !== group.version) {
          entry = {
            version: group.version,
            promise: translate(group.text, source)
          };
          ctl.inFlight.set(group.id, entry);
        }
        let text;
        try {
          text = await entry.promise;
        } catch (e) {
          ctl.scheduledIds.delete(group.id);
          ctl.inFlight.delete(group.id);
          return;
        }
        if (gen !== ctl.generation) return;
        if (settings.targetLang !== target) return;
        const live = ctl.groups.find((g) => g.id === group.id);
        if (!live || live.version !== group.version) {
          ctl.scheduledIds.delete(group.id);
          ctl.inFlight.delete(group.id);
          return;
        }
        if (settings.subtitles) showCaption(group.text, text);
        if (!ctl.active || video.paused && !ctl.autoPaused || video.seeking) {
          ctl.scheduledIds.delete(group.id);
          return;
        }
        if (video.currentTime > group.end + 4) {
          ctl.spokenIds.add(group.id);
          ctl.scheduledIds.delete(group.id);
          ctl.inFlight.delete(group.id);
          return;
        }
        const dur = group.end - group.start;
        recordLine(group, text, group.start);
        if (ctl.currentUtterance) {
          enqueue({ text, dur, start: group.start, end: group.end, id: group.id });
        } else {
          speak(text, dur, group.id);
        }
      }
      function ensureCaptionEl() {
        if (ctl.captionEl) return ctl.captionEl;
        const el = document.createElement("div");
        el.style.cssText = "position:fixed; z-index:2147483646; pointer-events:none;transform:translateX(-50%); max-width:min(80vw,900px);display:none; text-align:center;font-family:'Helvetica Neue',helvetica,arial,sans-serif;";
        const orig = document.createElement("div");
        orig.style.cssText = "color:rgba(255,255,255,0.75); font-size:14px; line-height:1.35;text-shadow:0 1px 3px rgba(0,0,0,0.9); margin-bottom:4px;";
        const trans = document.createElement("div");
        trans.style.cssText = "display:inline-block; color:#ffffff; font-size:19px; font-weight:600;line-height:1.4; background:rgba(0,0,0,0.6); border-radius:8px;padding:4px 12px; text-shadow:0 1px 2px rgba(0,0,0,0.8);";
        el.appendChild(orig);
        el.appendChild(trans);
        document.documentElement.appendChild(el);
        ctl.captionEl = el;
        ctl.captionOrig = orig;
        ctl.captionTrans = trans;
        return el;
      }
      function showCaption(original, translated) {
        const el = ensureCaptionEl();
        const size = Number(settings.captionSize) || 19;
        ctl.captionTrans.style.fontSize = size + "px";
        ctl.captionOrig.style.fontSize = Math.max(12, size - 5) + "px";
        ctl.captionOrig.textContent = original;
        ctl.captionTrans.textContent = translated;
        el.style.display = "block";
        positionCaption();
      }
      function hideCaption() {
        if (ctl.captionEl) ctl.captionEl.style.display = "none";
      }
      function positionCaption() {
        if (!ctl.captionEl || ctl.captionEl.style.display === "none") return;
        const r = video.getBoundingClientRect();
        ctl.captionEl.style.left = r.left + r.width / 2 + "px";
        ctl.captionEl.style.bottom = window.innerHeight - r.bottom + Math.max(20, r.height * 0.07) + "px";
      }
      function tick() {
        if (!isAlive()) {
          teardownAll();
          return;
        }
        if (!ctl.active) return;
        const t = video.currentTime;
        if (t < ctl.lastTime - 0.75) {
          fullFlush();
        }
        ctl.lastTime = t;
        if (video.paused && !ctl.autoPaused || video.seeking) return;
        if (ctl.currentUtterance && !speechSynthesis.speaking && !speechSynthesis.pending) {
          ctl.currentUtterance = null;
          drainQueue();
        }
        harvestTextTracks();
        rebuildGroups();
        let current = null;
        for (const g of ctl.groups) {
          if (g.start <= t && t < g.end - 0.4) {
            current = g;
            break;
          }
          if (g.start > t) break;
        }
        if (current && isFinalGroup(current) && !ctl.spokenIds.has(current.id) && !ctl.scheduledIds.has(current.id)) {
          onGroupEnter(current);
        } else if (!current || !settings.subtitles) {
          hideCaption();
        }
        if (Date.now() > ctl.cleanupAt) {
          ctl.cleanupAt = Date.now() + 5e3;
          for (const g of ctl.groups) {
            if (g.end < t - 120) {
              ctl.spokenIds.delete(g.id);
              ctl.scheduledIds.delete(g.id);
              ctl.inFlight.delete(g.id);
              ctl.groupMeta.delete(g.id);
            }
          }
        }
        positionCaption();
        pretranslate();
      }
      function hardStopSpeech() {
        ctl.generation += 1;
        ctl.scheduledIds.clear();
        ctl.inFlight.clear();
        const hadSpeech = ctl.currentUtterance || ctl.queue.length > 0;
        ctl.queue.length = 0;
        ctl.currentUtterance = null;
        ctl.autoPaused = false;
        if (hadSpeech) {
          try {
            speechSynthesis.cancel();
          } catch (e) {
          }
        }
      }
      function setVolume(v) {
        ctl.settingVolume = true;
        video.volume = Math.max(0, Math.min(1, v));
        setTimeout(() => ctl.settingVolume = false, 0);
      }
      function applyDucking() {
        if (ctl.savedVolume == null) ctl.savedVolume = video.volume;
        setVolume(settings.duck / 100);
      }
      function restoreVolume() {
        if (ctl.savedVolume != null) {
          setVolume(ctl.savedVolume);
          ctl.savedVolume = null;
        }
      }
      function onVolumeChange() {
        if (!ctl.settingVolume) ctl.savedVolume = null;
      }
      function start() {
        if (ctl.active) return;
        ctl.active = true;
        applyDucking();
        harvestTextTracks();
        harvestTrackElements();
        ctl.pollTimer = setInterval(tick, 150);
        video.addEventListener("pause", onPauseEvent);
        video.addEventListener("seeking", fullFlush);
        video.addEventListener("ended", hardStopSpeech);
        video.addEventListener("ratechange", hardStopSpeech);
        video.addEventListener("volumechange", onVolumeChange);
      }
      function onPauseEvent() {
        if (!ctl.autoPaused) hardStopSpeech();
      }
      function stop() {
        if (!ctl.active) return;
        ctl.active = false;
        clearInterval(ctl.pollTimer);
        ctl.pollTimer = null;
        video.removeEventListener("pause", onPauseEvent);
        video.removeEventListener("seeking", fullFlush);
        video.removeEventListener("ended", hardStopSpeech);
        video.removeEventListener("ratechange", hardStopSpeech);
        video.removeEventListener("volumechange", onVolumeChange);
        hardStopSpeech();
        restoreVolume();
        hideCaption();
      }
      function fullFlush() {
        hardStopSpeech();
        ctl.spokenIds.clear();
      }
      ctl.onSettingsChanged = () => {
        if (settings.enabled && accountLinked && !siteDisabled() && video === primaryVideo) {
          start();
          applyDucking();
        } else {
          stop();
        }
      };
      ctl.harvest = () => {
        harvestTextTracks();
        harvestTrackElements();
        rebuildGroups();
      };
      video.addEventListener("play", onAnyPlay);
      ctl.destroy = () => {
        stop();
        video.removeEventListener("play", onAnyPlay);
        if (ctl.trackListened && ctl.trackHarvestHandler) {
          ctl.trackListened.removeEventListener(
            "cuechange",
            ctl.trackHarvestHandler
          );
        }
        if (ctl.captionEl) {
          ctl.captionEl.remove();
          ctl.captionEl = null;
        }
      };
      ctl.flushSpeech = hardStopSpeech;
      ctl.fullFlush = fullFlush;
      ctl.harvest();
      ctl.onSettingsChanged();
      return ctl;
    }
    var overlayHost = null;
    var overlayRefs = null;
    function voicesForTarget() {
      loadVoices();
      const code = settings.targetLang;
      const prefixes = [code, ...VOICE_PREFIX_ALIASES[code] || []];
      return voices.filter((v) => {
        const l = (v.lang || "").toLowerCase();
        return prefixes.some(
          (p) => l === p || l.startsWith(p + "-") || l.startsWith(p + "_")
        );
      });
    }
    function previewVoice(v) {
      try {
        const u = new SpeechSynthesisUtterance(
          PREVIEW_SAMPLES[settings.targetLang] || PREVIEW_SAMPLES.en
        );
        if (v) u.voice = v;
        u.lang = v ? v.lang : LOCALES[settings.targetLang] || settings.targetLang;
        const vv = Number(settings.voiceVolume);
        u.volume = Math.max(0, Math.min(100, Number.isFinite(vv) ? vv : 100)) / 100;
        speechSynthesis.speak(u);
      } catch (e) {
      }
    }
    function createOverlay() {
      if (overlayHost) return;
      const T = {
        move: t2("ovlMove", "D\xE9placer"),
        on: t2("ovlStatusOn", "Doublage actif"),
        off: t2("ovlStatusOff", "En pause"),
        speaking: t2("ovlSpeaking", "Voix en cours"),
        power: t2("ovlPower", "Activer ou couper le doublage"),
        langT: t2("ovlLang", "Langue du doublage"),
        voice: t2("ovlVoice", "Voix"),
        auto: t2("ovlAuto", "Automatique"),
        autoHint: t2("ovlAutoHint", "Meilleure voix install\xE9e, choisie pour vous"),
        mixer: t2("ovlMixer", "Mixeur audio"),
        voiceVol: t2("ovlVoiceVol", "Volume de la voix"),
        duckL: t2("ovlDuck", "Original pendant la voix"),
        pImm: t2("ovlPresetImmersion", "Immersion"),
        pBal: t2("ovlPresetBalanced", "\xC9quilibr\xE9"),
        pVo: t2("ovlPresetVO", "VO pr\xE9sente"),
        quick: t2("ovlQuick", "R\xE9glages rapides"),
        rateL: t2("ovlRate", "Vitesse de la voix"),
        capL: t2("ovlCaptionSize", "Taille des sous-titres"),
        subsL: t2("ovlSubs", "Sous-titres \xE0 l'\xE9cran"),
        pauseL: t2("ovlAutoPause", "Pause auto si la voix est en retard"),
        minimize: t2("ovlMinimize", "R\xE9duire"),
        expand: t2("ovlExpand", "Agrandir"),
        close: t2("ovlClose", "Masquer (r\xE9activable depuis le popup)"),
        listen: t2("ovlListen", "\xC9couter un aper\xE7u"),
        local: t2("appLocalVoice", "locale")
      };
      overlayHost = document.createElement("div");
      overlayHost.style.cssText = "all:initial; position:fixed; z-index:2147483647; bottom:24px; right:24px; left:auto; top:auto;";
      const root = overlayHost.attachShadow({ mode: "closed" });
      root.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .wrap { position: relative; font-family: "Helvetica Neue", helvetica, arial, sans-serif; }
        .bar {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #161616;
          border-radius: 9999px;
          padding: 7px 10px 7px 6px;
          box-shadow: rgba(0,0,0,0.55) 0px 10px 28px, rgb(90,90,90) 0px 0px 0px 1px inset;
          font-size: 12px;
          color: #ffffff;
          user-select: none;
          -webkit-user-select: none;
        }
        .handle { cursor: grab; color: #7c7c7c; font-size: 14px; padding: 4px 0 4px 6px; letter-spacing: -1px; }
        .handle:active { cursor: grabbing; }
        .status {
          display: flex; align-items: center; gap: 7px;
          padding: 0 8px 0 4px; min-width: 0; white-space: nowrap;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #7c7c7c; flex: 0 0 auto; }
        .dot.on { background: #1ed760; }
        @keyframes dot-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(30,215,96,0.5);} 50% { box-shadow: 0 0 0 5px rgba(30,215,96,0);} }
        .dot.speaking { animation: dot-pulse 1.2s ease-out infinite; }
        .stext { font-weight: 700; font-size: 11.5px; color: #e8e8e8; }
        .timer { font-size: 11px; color: #7c7c7c; font-variant-numeric: tabular-nums; border-left: 1px solid #2c2c2c; padding-left: 7px; }
        button {
          font-family: inherit; border: none; background: #222222; color: #ffffff;
          cursor: pointer; border-radius: 9999px;
        }
        button:hover { background: #2c2c2c; }
        button:focus-visible { outline: 2px solid #1ed760; outline-offset: 2px; }
        .power { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; flex: 0 0 auto; transition: background 0.15s; }
        .power svg { display: block; }
        .power.on { background: #1ed760; color: #121212; }
        .power.on:hover { background: #3be477; }
        .power.on svg path { stroke: #121212; }
        select {
          background-color: #222222; color: #ffffff; border: none; border-radius: 9999px;
          font-family: inherit; font-size: 11px; font-weight: 700; padding: 6px 8px;
          cursor: pointer; appearance: none; text-align: center;
        }
        select:hover { background-color: #2c2c2c; }
        select:focus-visible { outline: 2px solid #1ed760; outline-offset: 2px; }
        .chip {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; padding: 6px 10px; max-width: 130px;
        }
        .chip .vname { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .chip .chev, .chip svg { color: #9a9a9a; flex: 0 0 auto; }
        .icon { width: 28px; height: 28px; display: grid; place-items: center; flex: 0 0 auto; color: #d9d9d9; }
        .icon svg { display: block; }
        .ghost { background: transparent; color: #7c7c7c; width: 24px; height: 24px; font-size: 12px; display: grid; place-items: center; }
        .ghost:hover { background: #222222; color: #ffffff; }
        .bar.mini .status, .bar.mini .lang, .bar.mini .voiceBtn, .bar.mini .mixBtn,
        .bar.mini .setBtn, .bar.mini .close { display: none; }

        .pop {
          position: absolute; right: 0; width: 272px;
          background: #161616; border-radius: 14px; padding: 14px;
          box-shadow: rgba(0,0,0,0.55) 0px 14px 34px, rgb(90,90,90) 0px 0px 0px 1px inset;
          color: #ffffff;
        }
        .pop[hidden] { display: none; }
        .pop.above { bottom: calc(100% + 10px); }
        .pop.below { top: calc(100% + 10px); }
        .pop h3 {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1.4px; color: #b3b3b3; margin-bottom: 12px;
        }
        .prow { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 10px 0 6px; }
        .prow .plabel { font-size: 12px; font-weight: 600; color: #e8e8e8; }
        .prow .pval { font-size: 11.5px; color: #b3b3b3; font-variant-numeric: tabular-nums; }
        input[type="range"] {
          -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 9999px;
          background: linear-gradient(to right, #1ed760 0%, #1ed760 var(--fill, 20%), #4d4d4d var(--fill, 20%), #4d4d4d 100%);
          cursor: pointer; display: block;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 12px; height: 12px;
          border-radius: 50%; background: #ffffff; box-shadow: rgba(0,0,0,0.5) 0px 2px 6px;
        }
        input[type="range"]:focus-visible { outline: 2px solid #1ed760; outline-offset: 4px; }
        .presets { display: flex; gap: 6px; margin-top: 12px; }
        .presets button { flex: 1; font-size: 10.5px; font-weight: 700; padding: 7px 4px; }
        .presets button.on { background: #1ed760; color: #121212; }
        .sep { border-top: 1px solid #262626; margin: 12px 0; }
        .trow { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 10px 0; }
        .trow .plabel { font-size: 12px; font-weight: 600; color: #e8e8e8; }
        .switch { position: relative; width: 36px; height: 21px; flex: 0 0 auto; cursor: pointer; display: inline-block; }
        .switch input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
        .knob { position: absolute; inset: 0; background: #333333; border-radius: 9999px; pointer-events: none; transition: background 0.15s; }
        .knob::before { content: ""; position: absolute; width: 15px; height: 15px; left: 3px; top: 3px; background: #ffffff; border-radius: 50%; transition: transform 0.15s; }
        .switch input:checked + .knob { background: #1ed760; }
        .switch input:checked + .knob::before { transform: translateX(15px); background: #121212; }

        .vlist { max-height: 250px; overflow-y: auto; margin: 0 -4px; padding: 0 4px; }
        .vitem {
          width: 100%; display: flex; align-items: center; gap: 8px;
          background: none; border-radius: 10px; padding: 8px 10px; text-align: left;
        }
        .vitem:hover { background: #222222; }
        .vitem.sel { background: #1f2b22; box-shadow: rgba(30,215,96,0.5) 0px 0px 0px 1px inset; }
        .vitem .vmain { flex: 1; min-width: 0; }
        .vitem .vlabel { display: block; font-size: 12.5px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vitem.sel .vlabel { color: #1ed760; }
        .vitem .vsub { display: block; font-size: 10.5px; color: #8f8f8f; margin-top: 1px; }
        .vplay {
          flex: 0 0 auto; width: 26px; height: 26px; border-radius: 50%;
          display: grid; place-items: center; background: #222222; color: #1ed760;
          font-size: 10px; cursor: pointer;
        }
        .vplay:hover { background: #2c2c2c; }
      </style>
      <div class="wrap">
        <div class="bar" role="toolbar" aria-label="Voxylio">
          <span class="handle" title="${T.move}">\u283F</span>
          <span class="status"><span class="dot"></span><span class="stext"></span><span class="timer">00:00</span></span>
          <button class="power" aria-label="${T.power}" title="${T.power}">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 6.5v3h2.4L8.5 12V4L4.9 6.5H2.5z" fill="currentColor" stroke="none"/>
              <path d="M10.5 5.5a3.4 3.4 0 010 5M12.3 4a5.8 5.8 0 010 8" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </button>
          <select class="lang" aria-label="${T.langT}" title="${T.langT}"></select>
          <button class="chip voiceBtn" title="${T.voice}">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="5.6" y="1.8" width="4.8" height="8" rx="2.4"/><path d="M3.2 8a4.8 4.8 0 009.6 0M8 12.8v1.6"/></svg>
            <span class="vname"></span><span class="chev">\u25BE</span>
          </button>
          <button class="icon mixBtn" title="${T.mixer}" aria-label="${T.mixer}">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3.5 2.5v6M3.5 11.5v2M8 2.5v2M8 7.5v6M12.5 2.5v6M12.5 11.5v2"/><circle cx="3.5" cy="10" r="1.6"/><circle cx="8" cy="6" r="1.6"/><circle cx="12.5" cy="10" r="1.6"/></svg>
          </button>
          <button class="icon setBtn" title="${T.quick}" aria-label="${T.quick}">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="2.1"/><path d="M8 1.9v1.8M8 12.3v1.8M1.9 8h1.8M12.3 8h1.8M3.7 3.7L5 5M11 11l1.3 1.3M12.3 3.7L11 5M5 11l-1.3 1.3"/></svg>
          </button>
          <button class="ghost mini" title="${T.minimize}">\u2013</button>
          <button class="ghost close" aria-label="${T.close}" title="${T.close}">\u2715</button>
        </div>

        <div class="pop pop-voice above" hidden>
          <h3 class="vtitle">${T.voice}</h3>
          <div class="vlist"></div>
        </div>

        <div class="pop pop-mix above" hidden>
          <h3>${T.mixer}</h3>
          <div class="prow"><span class="plabel">${T.voiceVol}</span><span class="pval voiceVal"></span></div>
          <input class="voiceVol" type="range" min="0" max="100" step="1" aria-label="${T.voiceVol}" />
          <div class="prow"><span class="plabel">${T.duckL}</span><span class="pval duckVal"></span></div>
          <input class="duckR" type="range" min="0" max="60" step="1" aria-label="${T.duckL}" />
          <div class="presets">
            <button class="pImm">${T.pImm}</button>
            <button class="pBal">${T.pBal}</button>
            <button class="pVo">${T.pVo}</button>
          </div>
        </div>

        <div class="pop pop-set above" hidden>
          <h3>${T.quick}</h3>
          <div class="prow"><span class="plabel">${T.rateL}</span><span class="pval rateVal"></span></div>
          <input class="rateR" type="range" min="0.8" max="1.6" step="0.05" aria-label="${T.rateL}" />
          <div class="prow"><span class="plabel">${T.capL}</span><span class="pval capVal"></span></div>
          <input class="capR" type="range" min="14" max="34" step="1" aria-label="${T.capL}" />
          <div class="sep"></div>
          <div class="trow"><span class="plabel">${T.subsL}</span>
            <label class="switch"><input type="checkbox" class="subsT" /><span class="knob"></span></label></div>
          <div class="trow"><span class="plabel">${T.pauseL}</span>
            <label class="switch"><input type="checkbox" class="pauseT" /><span class="knob"></span></label></div>
        </div>
      </div>`;
      const q = (sel) => root.querySelector(sel);
      overlayRefs = {
        T,
        bar: q(".bar"),
        wrap: q(".wrap"),
        dot: q(".dot"),
        stext: q(".stext"),
        timer: q(".timer"),
        power: q(".power"),
        lang: q(".lang"),
        vname: q(".vname"),
        pops: {
          voice: q(".pop-voice"),
          mix: q(".pop-mix"),
          set: q(".pop-set")
        },
        vlist: q(".vlist"),
        vtitle: q(".vtitle"),
        voiceVol: q(".voiceVol"),
        voiceVal: q(".voiceVal"),
        duckR: q(".duckR"),
        duckVal: q(".duckVal"),
        rateR: q(".rateR"),
        rateVal: q(".rateVal"),
        capR: q(".capR"),
        capVal: q(".capVal"),
        subsT: q(".subsT"),
        pauseT: q(".pauseT"),
        mini: false,
        activeMs: 0,
        lastTick: performance.now()
      };
      for (const l of LANGUAGES) {
        const opt = document.createElement("option");
        opt.value = l.code;
        opt.textContent = l.code.toUpperCase();
        overlayRefs.lang.appendChild(opt);
      }
      const openPop = (name) => {
        const target = overlayRefs.pops[name];
        const willOpen = target.hidden;
        for (const p of Object.values(overlayRefs.pops)) p.hidden = true;
        if (!willOpen) return;
        const rect = overlayHost.getBoundingClientRect();
        const below = rect.top < 340;
        for (const p of Object.values(overlayRefs.pops)) {
          p.classList.toggle("above", !below);
          p.classList.toggle("below", below);
        }
        if (name === "voice") renderVoiceList();
        target.hidden = false;
        renderOverlay();
      };
      overlayRefs.closePops = () => {
        if (!overlayRefs) return;
        for (const p of Object.values(overlayRefs.pops)) p.hidden = true;
      };
      q(".voiceBtn").addEventListener("click", () => openPop("voice"));
      q(".mixBtn").addEventListener("click", () => openPop("mix"));
      q(".setBtn").addEventListener("click", () => openPop("set"));
      overlayRefs.onDocDown = (e) => {
        if (!overlayHost) return;
        if (!e.composedPath().includes(overlayHost)) overlayRefs.closePops();
      };
      window.addEventListener("pointerdown", overlayRefs.onDocDown, true);
      function renderVoiceList() {
        const list = overlayRefs.vlist;
        list.replaceChildren();
        const langMeta = LANGUAGES.find((l) => l.code === settings.targetLang);
        overlayRefs.vtitle.textContent = T.voice + " \u2014 " + (langMeta ? langMeta.name : settings.targetLang);
        const chosen = settings.voiceByLang && settings.voiceByLang[settings.targetLang] || settings.voiceName;
        const mkItem = (label, sub, sel, voice, name) => {
          const item = document.createElement("button");
          item.className = "vitem" + (sel ? " sel" : "");
          const main = document.createElement("span");
          main.className = "vmain";
          const lab = document.createElement("span");
          lab.className = "vlabel";
          lab.textContent = label;
          const s = document.createElement("span");
          s.className = "vsub";
          s.textContent = sub;
          main.append(lab, s);
          const play = document.createElement("span");
          play.className = "vplay";
          play.textContent = "\u25B6";
          play.title = T.listen;
          play.addEventListener("click", (e) => {
            e.stopPropagation();
            previewVoice(voice);
          });
          item.append(main, play);
          item.addEventListener("click", () => {
            const vb = { ...settings.voiceByLang || {} };
            if (name) vb[settings.targetLang] = name;
            else delete vb[settings.targetLang];
            settings.voiceByLang = vb;
            settings.voiceName = name;
            safeSyncSet({ voiceName: name, voiceByLang: vb });
            renderVoiceList();
            renderOverlay();
          });
          list.appendChild(item);
        };
        mkItem(T.auto, T.autoHint, !chosen, null, "");
        for (const v of voicesForTarget()) {
          mkItem(
            v.name,
            v.lang + (v.localService ? " \xB7 " + T.local : ""),
            chosen === v.name,
            v,
            v.name
          );
        }
      }
      q(".power").addEventListener("click", () => {
        safeSyncSet({ enabled: !settings.enabled });
      });
      overlayRefs.lang.addEventListener("change", (e) => {
        const next = e.target.value;
        safeSyncSet({
          targetLang: next,
          voiceName: (settings.voiceByLang || {})[next] || ""
        });
      });
      q(".mini").addEventListener("click", (e) => {
        overlayRefs.mini = !overlayRefs.mini;
        e.target.textContent = overlayRefs.mini ? "\u2922" : "\u2013";
        e.target.title = overlayRefs.mini ? T.expand : T.minimize;
        overlayRefs.closePops();
        renderOverlay();
      });
      q(".close").addEventListener("click", () => {
        safeSyncSet({ overlay: false });
      });
      let volTimer = null;
      overlayRefs.voiceVol.addEventListener("input", (e) => {
        const v = Number(e.target.value);
        settings.voiceVolume = v;
        renderOverlay();
        clearTimeout(volTimer);
        volTimer = setTimeout(() => safeSyncSet({ voiceVolume: v }), 250);
      });
      let duckTimer = null;
      overlayRefs.duckR.addEventListener("input", (e) => {
        const v = Number(e.target.value);
        settings.duck = v;
        renderOverlay();
        refreshAll();
        clearTimeout(duckTimer);
        duckTimer = setTimeout(() => safeSyncSet({ duck: v }), 250);
      });
      q(".pImm").addEventListener("click", () => safeSyncSet({ duck: 0 }));
      q(".pBal").addEventListener("click", () => safeSyncSet({ duck: 12 }));
      q(".pVo").addEventListener("click", () => safeSyncSet({ duck: 35 }));
      let rateTimer = null;
      overlayRefs.rateR.addEventListener("input", (e) => {
        const v = Number(e.target.value);
        settings.rate = v;
        renderOverlay();
        clearTimeout(rateTimer);
        rateTimer = setTimeout(() => safeSyncSet({ rate: v }), 250);
      });
      let capTimer = null;
      overlayRefs.capR.addEventListener("input", (e) => {
        const v = Number(e.target.value);
        settings.captionSize = v;
        renderOverlay();
        clearTimeout(capTimer);
        capTimer = setTimeout(() => safeSyncSet({ captionSize: v }), 250);
      });
      overlayRefs.subsT.addEventListener("change", (e) => {
        safeSyncSet({ subtitles: e.target.checked });
      });
      overlayRefs.pauseT.addEventListener("change", (e) => {
        safeSyncSet({ autoPause: e.target.checked });
      });
      const handle = q(".handle");
      let drag = null;
      handle.addEventListener("pointerdown", (e) => {
        const r = overlayHost.getBoundingClientRect();
        drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
        handle.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      handle.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const x = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - drag.dx));
        const y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - drag.dy));
        overlayHost.style.left = x + "px";
        overlayHost.style.top = y + "px";
        overlayHost.style.right = "auto";
        overlayHost.style.bottom = "auto";
      });
      handle.addEventListener("pointerup", () => {
        if (!drag) return;
        drag = null;
        const r = overlayHost.getBoundingClientRect();
        safeLocalSet({ overlayPos: { x: r.left, y: r.top } });
      });
      storage.local.get({ overlayPos: null }, ({ overlayPos }) => {
        if (overlayPos && overlayHost) {
          const x = Math.max(0, Math.min(window.innerWidth - 80, overlayPos.x));
          const y = Math.max(0, Math.min(window.innerHeight - 40, overlayPos.y));
          overlayHost.style.left = x + "px";
          overlayHost.style.top = y + "px";
          overlayHost.style.right = "auto";
          overlayHost.style.bottom = "auto";
        }
      });
      document.documentElement.appendChild(overlayHost);
      overlayRefs.speakTimer = setInterval(() => {
        if (!isAlive()) {
          teardownAll();
          return;
        }
        if (!overlayRefs) return;
        const now = performance.now();
        const delta = now - overlayRefs.lastTick;
        overlayRefs.lastTick = now;
        if (settings.enabled && primaryVideo && !primaryVideo.paused && delta < 2e3) {
          overlayRefs.activeMs += delta;
        }
        const speaking = anySpeaking();
        overlayRefs.dot.classList.toggle("speaking", speaking);
        overlayRefs.stext.textContent = !settings.enabled ? overlayRefs.T.off : speaking ? overlayRefs.T.speaking : overlayRefs.T.on;
        overlayRefs.timer.textContent = fmtTime(overlayRefs.activeMs / 1e3);
      }, 400);
      overlayRefs.onResize = () => {
        if (!overlayHost || overlayHost.style.left === "auto") return;
        const r = overlayHost.getBoundingClientRect();
        const x = Math.max(0, Math.min(window.innerWidth - r.width - 8, r.left));
        const y = Math.max(0, Math.min(window.innerHeight - r.height - 8, r.top));
        overlayHost.style.left = x + "px";
        overlayHost.style.top = y + "px";
      };
      window.addEventListener("resize", overlayRefs.onResize);
      renderOverlay();
    }
    function t2(key, fallback) {
      try {
        return runtime && chrome.i18n && chrome.i18n.getMessage(key) || fallback;
      } catch (e) {
        return fallback;
      }
    }
    function destroyOverlay() {
      if (!overlayHost) return;
      if (overlayRefs) {
        clearInterval(overlayRefs.speakTimer);
        window.removeEventListener("resize", overlayRefs.onResize);
        window.removeEventListener("pointerdown", overlayRefs.onDocDown, true);
      }
      overlayHost.remove();
      overlayHost = null;
      overlayRefs = null;
    }
    const setFill = (el, pct) => el.style.setProperty("--fill", pct + "%");
    function renderOverlay() {
      if (!overlayRefs) return;
      const r = overlayRefs;
      r.bar.classList.toggle("mini", !!r.mini);
      r.power.classList.toggle("on", !!settings.enabled);
      r.dot.classList.toggle("on", !!settings.enabled);
      r.lang.value = settings.targetLang;
      const chosen = settings.voiceByLang && settings.voiceByLang[settings.targetLang] || settings.voiceName;
      r.vname.textContent = chosen ? chosen.split(" ")[0] : r.T.auto;
      r.voiceVol.value = settings.voiceVolume;
      r.voiceVal.textContent = settings.voiceVolume + " %";
      setFill(r.voiceVol, settings.voiceVolume);
      r.duckR.value = settings.duck;
      r.duckVal.textContent = settings.duck + " %";
      setFill(r.duckR, settings.duck / 60 * 100);
      r.rateR.value = settings.rate;
      r.rateVal.textContent = "\xD7" + Number(settings.rate).toFixed(2);
      setFill(r.rateR, (settings.rate - 0.8) / 0.8 * 100);
      r.capR.value = settings.captionSize;
      r.capVal.textContent = settings.captionSize + " px";
      setFill(r.capR, (settings.captionSize - 14) / 20 * 100);
      r.subsT.checked = !!settings.subtitles;
      r.pauseT.checked = !!settings.autoPause;
    }
    function syncOverlay() {
      const wanted = settings.overlay && accountLinked && controllers.size > 0;
      if (wanted) createOverlay();
      else destroyOverlay();
      renderOverlay();
    }
    function scan() {
      const found = collectVideos();
      for (const v of found) {
        if (!controllers.has(v)) controllers.set(v, makeController(v));
      }
      for (const [v, c] of controllers) {
        if (!v.isConnected) {
          c.destroy();
          controllers.delete(v);
        } else {
          c.harvest();
        }
      }
      primaryVideo = pickPrimary();
      refreshAll();
    }
    function lightScan() {
      for (const [v, c] of controllers) {
        if (!v.isConnected) {
          c.destroy();
          controllers.delete(v);
        } else {
          c.harvest();
        }
      }
      primaryVideo = pickPrimary();
      refreshAll();
    }
    let scanDirty = true;
    let lastFullScan = 0;
    try {
      new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.addedNodes && m.addedNodes.length) {
            scanDirty = true;
            break;
          }
        }
      }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {
    }
    function scheduledScan() {
      if (document.hidden) return;
      const now = Date.now();
      if (scanDirty || now - lastFullScan > 15e3) {
        scanDirty = false;
        lastFullScan = now;
        scan();
      } else {
        lightScan();
      }
    }
    function teardownAll() {
      try {
        for (const [v, c] of controllers) {
          c.destroy();
          controllers.delete(v);
        }
      } catch (e) {
      }
      destroyOverlay();
      clearInterval(scanTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.__voxylioInjected = false;
    }
    function guardedScheduledScan() {
      if (!isAlive()) {
        teardownAll();
        return;
      }
      scheduledScan();
    }
    function onVisibility() {
      if (!document.hidden) {
        scanDirty = true;
        guardedScheduledScan();
      }
    }
    scan();
    const scanTimer = setInterval(guardedScheduledScan, 3e3);
    document.addEventListener("visibilitychange", onVisibility);
    function anySpeaking() {
      for (const c of controllers.values()) {
        if (c.currentUtterance) return true;
      }
      return false;
    }
    runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg && msg.type === "retry") {
        for (const c of controllers.values()) {
          c.staticLoaded = false;
          c.trackRetryAt = 0;
          c.lastCueCount = -1;
          c.fullFlush();
        }
        builtinBroken = false;
        lastTranslateError = "";
        scanDirty = true;
        scan();
        sendResponse({ ok: true });
        return;
      }
      if (!msg || msg.type !== "getStatus") return;
      scan();
      const nVideos = controllers.size;
      if (nVideos === 0 && window !== window.top) return;
      const buildStatus = () => {
        loadVoices();
        let nCues = 0;
        let nGroups = 0;
        const tracks = [];
        for (const c of controllers.values()) {
          c.harvest();
          nCues += c.cues.length;
          nGroups += c.groups.length;
          for (const t of Array.from(c.video.textTracks || [])) {
            tracks.push({
              kind: t.kind,
              lang: t.language || "",
              label: t.label || "",
              mode: t.mode,
              cues: t.cues ? t.cues.length : 0
            });
          }
        }
        const targetVoices = voices.filter(
          (v) => (v.lang || "").toLowerCase().startsWith(settings.targetLang)
        );
        const hasSubTracks = tracks.some(
          (t) => t.kind === "subtitles" || t.kind === "captions"
        );
        let state = "no-video";
        if (siteDisabled()) state = "site-disabled";
        else if (controllers.size > 0) {
          if (nCues > 0) {
            if (targetVoices.length === 0) state = "no-voice";
            else if (translationMode === "none" && lastTranslateError)
              state = settings.cloudFallback ? "translate-error" : "local-unavailable";
            else state = "ready";
          } else {
            state = hasSubTracks ? "subs-loading" : "no-subs";
          }
        }
        return {
          version: manifestVersion(),
          page: location.hostname,
          state,
          signinRequired: !accountLinked,
          speaking: anySpeaking(),
          translationMode,
          lastTranslateError,
          videos: controllers.size,
          cues: nCues,
          groups: nGroups,
          tracks,
          builtinTranslator: !builtinBroken,
          provider: chain.lastProviderId(),
          siteDisabled: siteDisabled(),
          voices: targetVoices.map((v) => ({ name: v.name, lang: v.lang }))
        };
      };
      if (nVideos === 0) {
        setTimeout(() => {
          try {
            sendResponse(buildStatus());
          } catch (e) {
          }
        }, 600);
      } else {
        sendResponse(buildStatus());
      }
      return true;
    });
  })();
})();
