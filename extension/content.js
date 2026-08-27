// GENERATED FILE — do not edit. Source: apps/chrome/src (pnpm build).
(() => {
  // ../../packages/core/src/subtitles.js
  var NAMED_ENTITIES = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    hellip: "\u2026",
    ndash: "\u2013",
    mdash: "\u2014",
    lsquo: "\u2018",
    rsquo: "\u2019",
    ldquo: "\u201C",
    rdquo: "\u201D",
    laquo: "\xAB",
    raquo: "\xBB",
    shy: "",
    lrm: "",
    rlm: "",
    zwj: "",
    zwnj: ""
  };
  function fromCode(n) {
    try {
      return n > 0 && n <= 1114111 ? String.fromCodePoint(n) : " ";
    } catch (e) {
      return " ";
    }
  }
  function decodeEntities(s) {
    return String(s).replace(/&#x([0-9a-f]{1,6});/gi, (_, h) => fromCode(parseInt(h, 16))).replace(/&#(\d{1,7});/g, (_, d) => fromCode(parseInt(d, 10))).replace(/&([a-z]{2,8});/gi, (m, name) => {
      const key = name.toLowerCase();
      return key in NAMED_ENTITIES ? NAMED_ENTITIES[key] : m;
    });
  }
  function stripTags(s) {
    return decodeEntities(
      String(s).replace(/<[^>]*>/g, " ").replace(/\{\\[^}]*\}/g, " ")
      // ASS/SSA overrides ({\an8}, {\i1})
    ).replace(/\s+/g, " ").trim();
  }
  var SOUND_CUE_RE = /music|musique|applau|laugh|rire|sigh|soupir|cough|toux|inaudible|silence|bruit|noise|chuckle|cheer|gasp|groan|grunt|scream|whisper|chuchot|sob|sanglot|crying|cries|pleur|singing|chante|humming|fredonn|beep|bip|ringing|sonnerie|\bsonne\b|téléphone|phone rings|footsteps|klaxon|explosion|gunshot|coup de feu|thunder|tonnerre|grésill|static|barking|aboie|growl|speaking|parle en|indistinct|chatter|murmur|narrator|narrateur/i;
  function isSoundCue(inner) {
    const s = String(inner).trim();
    if (!new RegExp("\\p{L}", "u").test(s)) return true;
    if (new RegExp("\\p{Lu}", "u").test(s) && !new RegExp("\\p{Ll}", "u").test(s)) return true;
    return SOUND_CUE_RE.test(s);
  }
  var MUSIC_GLYPH = /[♪♫♬♩]/;
  function cleanCaption(s) {
    const raw = String(s);
    const trimmed = raw.trim();
    if (MUSIC_GLYPH.test(trimmed.charAt(0)) || /^#\s.*\s#$/.test(trimmed)) return "";
    return raw.replace(/\[[^\]]*\]/g, " ").replace(/\[[^\]]*$/, " ").replace(/^[^[]*\]/, " ").replace(/\(([^)]*)\)/g, (m, inner) => isSoundCue(inner) ? " " : m).replace(/\(([^)]*)$/, (m, inner) => isSoundCue(inner) ? " " : m).replace(/\s*>>+\s*/g, " ").replace(/(^|\s)([\p{Lu}][\p{Lu}\p{N} .'’-]{1,28}):\s+/gu, "$1").replace(/[♪♫♬♩]+/g, " ").replace(/^\s*[-–—]\s*/, "").replace(/([.!?…])\s+[-–—]\s+/g, "$1 ").replace(/\s+/g, " ").trim();
  }
  var SENTENCE_END_RE = /[.!?…。！？．؟۔।]["'’»」』）)\]]*$/;
  var ABBREV_RE = /(?:^|[\s(«"'’-])(dr|mr|mrs|ms|prof|st|sgt|capt|lt|col|gen|mme|mlle|m)\.$/i;
  function endsSentence(s) {
    const t = String(s).trim();
    if (!SENTENCE_END_RE.test(t)) return false;
    const bare = t.replace(/["'’»」』）)\]]+$/, "");
    if (/\.$/.test(bare) && !/\.\.$/.test(bare) && ABBREV_RE.test(bare)) return false;
    return true;
  }
  function continuesEllipsis(curText, nextText) {
    if (!/(\.\.\.|…)$/.test(String(curText).trim())) return false;
    return new RegExp("^(\\.\\.\\.|\u2026)?\\s*\\p{Ll}", "u").test(String(nextText).trim());
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
      if (!txt || !new RegExp("\\p{L}", "u").test(txt)) continue;
      if (cur && (endsSentence(cur.text) && !continuesEllipsis(cur.text, txt) || c.start - cur.end > MAX_GAP || cur.text.length > MAX_LEN)) {
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
    const used = /* @__PURE__ */ new Map();
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      let id = "g" + Math.round(g.start * 100);
      const n = used.get(id) || 0;
      used.set(id, n + 1);
      if (n > 0) id += "_" + n;
      g.id = id;
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
  var escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var TERM_RE = new RegExp(
    "\\b(" + PROTECTED_TERMS.map(escapeRe).join("|") + ")\\b",
    "gi"
  );
  function compileGlossary(entries) {
    const list = [];
    for (const e of Array.isArray(entries) ? entries : []) {
      const from = e && typeof e.from === "string" ? e.from.trim() : "";
      if (!from) continue;
      const to = e && typeof e.to === "string" ? e.to.trim() : "";
      list.push({ from, to });
    }
    if (!list.length) return null;
    list.sort((a, b) => b.from.length - a.from.length);
    const re = new RegExp(
      "(?<![\\p{L}\\p{N}])(" + list.map((t) => escapeRe(t.from)).join("|") + ")(?![\\p{L}\\p{N}])",
      "giu"
    );
    const map = new Map(list.map((t) => [t.from.toLowerCase(), t.to]));
    return { re, map };
  }
  function protectTerms(text, opts = {}) {
    const { builtin = true, glossary = null } = opts;
    const found = [];
    let out = String(text);
    if (glossary) {
      out = out.replace(glossary.re, (m) => {
        const to = glossary.map.get(m.toLowerCase());
        found.push(to || m);
        return `\u27E6${found.length - 1}\u27E7`;
      });
    }
    if (builtin) {
      out = out.replace(TERM_RE, (m) => {
        found.push(m);
        return `\u27E6${found.length - 1}\u27E7`;
      });
    }
    return { protectedText: out, found };
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
  var SPACELESS_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af\u0e00-\u0e7f]/;
  function estimateWords(text) {
    const s = String(text || "").trim();
    return SPACELESS_RE.test(s) ? Math.max(1, Math.round(s.replace(/\s+/g, "").length / 2.5)) : s.split(/\s+/).filter(Boolean).length;
  }
  function computeUtteranceRate({
    text,
    cueDur,
    baseRate,
    playbackRate = 1,
    wps,
    prevRate = 0
  }) {
    const base = Number.isFinite(baseRate) && baseRate > 0 ? baseRate : 1;
    const perSec = Number.isFinite(wps) && wps > 0.5 && wps < 8 ? wps : WORDS_PER_SECOND;
    const words = estimateWords(text);
    const estimated = words / perSec;
    let rate = base;
    if (cueDur > 0.5) {
      const ratio = estimated / base / cueDur;
      if (ratio > 1.15) {
        rate = Math.min(base * ratio, base * 1.25, 1.45);
      }
    }
    rate = Math.max(rate, base);
    const pr = Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1;
    let out = Math.min(rate * pr, 3);
    if (Number.isFinite(prevRate) && prevRate > 0) {
      out = Math.min(3, prevRate + (out - prevRate) * 0.6);
    }
    return out;
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
    // Pro contextual translation (opt-in; only effective for Pro accounts —
    // the background and the backend both enforce it).
    proTranslation: false,
    // Pro neural voice (opt-in, Aura-2 languages; local voice otherwise).
    proVoice: false,
    // Pro no-subtitle dubbing (opt-in, beta): when a video exposes no
    // subtitles at all, capture its audio and transcribe it live
    // (Deepgram Nova-3) — the transcript feeds the normal pipeline.
    // Metered in minutes server-side; NO local fallback exists for this.
    proAudio: false,
    autoPause: false,
    keepTerms: true,
    // User glossary: [{ from, to }] — `to` empty keeps the source form
    // verbatim, `to` set forces that exact target form. Applied through
    // the placeholder mechanism, so it works with every provider.
    glossary: [],
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
        case "proTranslation":
        case "proVoice":
        case "proAudio":
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
        case "glossary": {
          const list = Array.isArray(v) ? v : [];
          const entries = [];
          const seen = /* @__PURE__ */ new Set();
          for (const e of list) {
            if (entries.length >= 50) break;
            if (!e || typeof e !== "object") continue;
            const from = typeof e.from === "string" ? e.from.trim().slice(0, 40) : "";
            const to = typeof e.to === "string" ? e.to.trim().slice(0, 60) : "";
            const dedup = from.toLowerCase();
            if (!from || seen.has(dedup)) continue;
            seen.add(dedup);
            entries.push({ from, to });
          }
          out.glossary = entries;
          break;
        }
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
      now = () => Date.now(),
      pairState = /* @__PURE__ */ new Map()
      // "providerId:source->target" -> { failures, readyMisses, coolUntil }
    } = opts;
    let lastKind = "none";
    let lastProviderId = "";
    let lastError = "";
    const stateKey = (id, source, target) => `${id}:${source}->${target}`;
    function getState(key) {
      return pairState.get(key) ?? { failures: 0, readyMisses: 0, coolUntil: 0 };
    }
    function inCooldown(id, source, target) {
      const s = pairState.get(stateKey(id, source, target));
      return !!s && s.coolUntil > now();
    }
    function recordFailure(id, source, target) {
      const key = stateKey(id, source, target);
      const s = getState(key);
      s.failures += 1;
      if (s.failures >= failuresBeforeCooldown) {
        s.coolUntil = now() + cooldownMs;
        s.failures = 0;
      }
      pairState.set(key, s);
    }
    function recordReadyMiss(id, source, target) {
      const key = stateKey(id, source, target);
      const s = getState(key);
      s.readyMisses += 1;
      if (s.readyMisses >= 2) {
        s.coolUntil = now() + cooldownMs;
        s.readyMisses = 0;
      }
      pairState.set(key, s);
    }
    function recordSuccess(id, source, target) {
      pairState.delete(stateKey(id, source, target));
    }
    async function translate(text, source, target, opts2) {
      const errors = [];
      for (const p of providers) {
        if (inCooldown(p.id, source, target)) {
          errors.push(`${p.id}: cooling down`);
          continue;
        }
        let translator = null;
        try {
          translator = await withTimeout(p.ready(source, target), readyTimeoutMs, TIMEOUT);
        } catch (e) {
          recordFailure(p.id, source, target);
          errors.push(`${p.id}: ${e && e.message}`);
          continue;
        }
        if (translator === TIMEOUT) {
          recordReadyMiss(p.id, source, target);
          errors.push(`${p.id}: not ready`);
          continue;
        }
        if (!translator) {
          errors.push(`${p.id}: not ready`);
          continue;
        }
        try {
          let out = await withTimeout(translator.translate(text, opts2), attemptTimeoutMs, TIMEOUT);
          if (out === TIMEOUT) throw new Error("attempt timed out");
          let detected;
          if (out && typeof out === "object") {
            detected = typeof out.detected === "string" ? out.detected : void 0;
            out = out.text;
          }
          if (typeof out !== "string") throw new Error("bad translation");
          if (!out.trim()) {
            errors.push(`${p.id}: empty`);
            continue;
          }
          recordSuccess(p.id, source, target);
          lastKind = p.kind;
          lastProviderId = p.id;
          lastError = "";
          return { text: out, providerId: p.id, kind: p.kind, detected };
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

  // ../../packages/core/src/sites.js
  var DOM_CAPTION_SITES = [
    {
      id: "youtube",
      host: /(^|\.)youtube(-nocookie)?\.com$|(^|\.)youtu\.be$/,
      container: ".ytp-caption-window-container",
      segment: ".ytp-caption-segment",
      // Simple on/off toggle: safe to click programmatically.
      cc: ".ytp-subtitles-button"
    },
    {
      id: "netflix",
      host: /(^|\.)netflix\.com$/,
      container: ".player-timedtext",
      segment: ".player-timedtext-text-container"
    },
    {
      id: "primevideo",
      host: /(^|\.)primevideo\.com$|(^|\.)amazon\.[a-z.]+$/,
      container: ".atvwebplayersdk-captions-overlay",
      segment: "span"
    },
    {
      id: "disneyplus",
      host: /(^|\.)disneyplus\.com$/,
      container: ".dss-subtitle-renderer-cue-window",
      segment: "span"
    },
    {
      id: "twitch",
      host: /(^|\.)twitch\.tv$/,
      container: "[data-a-target='player-captions-container']",
      segment: "span"
    },
    {
      // Udemy renders captions in its own overlay (Shaka-style); the video
      // element exposes no track. `data-purpose` attributes are Udemy's
      // stable hooks — the container class is CSS-module-hashed, so match
      // its stable prefix. No `cc`: their captions button opens a language
      // menu, not a toggle — never click it programmatically.
      id: "udemy",
      host: /(^|\.)udemy\.com$/,
      // Real 2026 markup: class "captions-display-module--captions-container--xxx"
      // (owner-verified DOM). Match the stable middle of the CSS-module name
      // so a prefix rename never breaks it again.
      container: "[class*='--captions-container--']",
      segment: "[data-purpose='captions-cue-text']"
    },
    // The entries below come from the 2026-08 sweep of players that draw
    // captions in the DOM without exposing textTracks (sources: Firefox
    // Picture-in-Picture site wrappers, asbplayer, per-site userscripts).
    // A wrong selector fails safe: no cues, the popup keeps its guidance.
    {
      id: "hulu",
      host: /(^|\.)hulu\.com$/,
      container: ".ClosedCaption",
      segment: ".CaptionBox"
    },
    {
      id: "hbomax",
      host: /(^|\.)hbomax\.com$|(^|\.)max\.com$/,
      container: "[data-testid='CueBoxContainer']",
      segment: "span"
    },
    {
      id: "peacock",
      host: /(^|\.)peacocktv\.com$/,
      container: "[data-t='subtitles'], [data-t-subtitles='true']",
      segment: ".video-player__subtitles__line"
    },
    {
      id: "dailymotion",
      host: /(^|\.)dailymotion\.com$/,
      container: ".subtitles",
      segment: ".subtitles-text"
    },
    {
      // Viki runs video.js in emulated-track mode: the video element's
      // textTracks stay empty and cues render into the vjs display div.
      id: "viki",
      host: /(^|\.)viki\.com$/,
      container: ".vjs-text-track-display",
      segment: ".vjs-text-track-cue"
    },
    {
      // LinkedIn Learning and Skillshare are video.js too. When a vjs
      // player uses NATIVE tracks the display div stays empty (the native
      // pipeline feeds us instead), so this entry can never double-feed.
      id: "linkedin",
      host: /(^|\.)linkedin\.com$/,
      container: ".vjs-text-track-display",
      segment: ".vjs-text-track-cue"
    },
    {
      id: "skillshare",
      host: /(^|\.)skillshare\.com$/,
      container: ".vjs-text-track-display",
      segment: ".vjs-text-track-cue"
    },
    {
      // edX swaps plain text inside .closed-captions with no child
      // segments — the harvester falls back to the container's own text
      // when the segment selector matches nothing.
      id: "edx",
      host: /(^|\.)edx\.org$/,
      container: ".closed-captions",
      segment: "span"
    }
  ];
  function domCaptionSiteFor(hostname) {
    const h = String(hostname || "").toLowerCase().replace(/^www\./, "");
    return DOM_CAPTION_SITES.find((s) => s.host.test(h)) || null;
  }
  function domCueEnd(start, text) {
    const words = String(text || "").split(/\s+/).filter(Boolean).length;
    return start + Math.min(7, Math.max(1.5, words / 2.5));
  }

  // ../../packages/core/src/udemy.js
  function udemyLectureId(href) {
    const m = /\/lecture\/(\d+)/.exec(String(href || ""));
    return m ? Number(m[1]) : 0;
  }
  function udemyCourseId(moduleArgs) {
    if (!moduleArgs) return 0;
    try {
      const d = typeof moduleArgs === "string" ? JSON.parse(moduleArgs) : moduleArgs;
      const n = Number(d.courseId || d.course_id || 0);
      if (Number.isFinite(n) && n > 0) return n;
    } catch (e) {
    }
    const m = /"course_?[iI]d"\s*:\s*(\d+)/.exec(String(moduleArgs));
    return m ? Number(m[1]) : 0;
  }
  function udemyCaptionsUrl(courseId, lectureId) {
    return `/api-2.0/users/me/subscribed-courses/${courseId}/lectures/${lectureId}?fields[lecture]=asset&fields[asset]=captions`;
  }
  function udemyCaptionTracks(payload) {
    const caps = payload && payload.asset && payload.asset.captions;
    if (!Array.isArray(caps)) return [];
    return caps.filter((c) => c && typeof c.url === "string" && c.url).map((c) => ({
      languageCode: String(
        c.locale && c.locale.locale || c.video_label || ""
      ).replace("_", "-"),
      kind: c.source === "auto" ? "asr" : "",
      url: c.url
    }));
  }

  // ../../packages/core/src/yt.js
  function extractCaptionTracks(html) {
    const h = String(html || "");
    const at = h.indexOf('"captionTracks":');
    if (at < 0) return [];
    const open = h.indexOf("[", at);
    if (open < 0) return [];
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = open; i < h.length; i++) {
      const c = h[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === "[" || c === "{") depth++;
      else if (c === "]" || c === "}") {
        depth--;
        if (depth === 0) {
          try {
            const arr = JSON.parse(h.slice(open, i + 1));
            return Array.isArray(arr) ? arr.filter((t) => t && typeof t.baseUrl === "string") : [];
          } catch (e) {
            return [];
          }
        }
      }
    }
    return [];
  }
  function pickCaptionTrack(tracks, wanted, avoid) {
    const list = Array.isArray(tracks) ? tracks.filter(Boolean) : [];
    if (!list.length) return null;
    const want = wanted && wanted !== "auto" ? String(wanted).toLowerCase() : "";
    const dodge = !want && avoid ? String(avoid).toLowerCase().split("-")[0] : "";
    const score = (t) => {
      const base = String(t.languageCode || "").toLowerCase().split("-")[0];
      let s = 0;
      if (want && base === want) s += 8;
      if (t.kind !== "asr") s += 2;
      if (!want && base === "en") s += 1;
      if (dodge && base === dodge) s -= 4;
      return s;
    };
    return list.slice().sort((a, b) => score(b) - score(a))[0];
  }
  function timedtextUrl(baseUrl) {
    const url = String(baseUrl || "").replace(/\\u0026/g, "&");
    if (!url) return "";
    return url + (url.includes("?") ? "&" : "?") + "fmt=json3";
  }
  function parseJson3(data) {
    const events = data && Array.isArray(data.events) ? data.events : [];
    const cues = [];
    for (const ev of events) {
      if (!ev || ev.aAppend || !Array.isArray(ev.segs)) continue;
      const text = ev.segs.map((s) => s && typeof s.utf8 === "string" ? s.utf8 : "").join("").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
      if (!text) continue;
      const start = (Number(ev.tStartMs) || 0) / 1e3;
      const durMs = Number(ev.dDurationMs);
      const end = start + (Number.isFinite(durMs) && durMs > 0 ? durMs : 3e3) / 1e3;
      cues.push({ start, end, text });
    }
    return cues;
  }

  // ../../packages/core/src/plan.js
  var FREE_SITE_PATTERNS = [
    /(^|\.)youtube(-nocookie)?\.com$/,
    /(^|\.)youtu\.be$/,
    /(^|\.)netflix\.com$/,
    /(^|\.)primevideo\.com$/,
    /(^|\.)amazon\.[a-z.]+$/,
    // Prime Video lives under amazon.<tld>/video
    /(^|\.)disneyplus\.com$/,
    /(^|\.)twitch\.tv$/
  ];
  function isFreeSite(hostname) {
    const h = String(hostname || "").toLowerCase().replace(/^www\./, "");
    if (!h) return false;
    return FREE_SITE_PATTERNS.some((re) => re.test(h));
  }
  function planGate({ plan, trialEndsAt, now, hostname }) {
    if (plan === "pro") return { allowed: true, reason: "pro" };
    const t = typeof now === "number" ? now : Date.parse(now || "") || 0;
    const end = trialEndsAt ? Date.parse(trialEndsAt) : NaN;
    if (Number.isFinite(end) && t < end) return { allowed: true, reason: "trial" };
    if (isFreeSite(hostname)) return { allowed: true, reason: "freeSite" };
    if (!trialEndsAt) return { allowed: true, reason: "legacy" };
    return { allowed: false, reason: "locked" };
  }
  function trialDaysLeft(trialEndsAt, now) {
    const end = trialEndsAt ? Date.parse(trialEndsAt) : NaN;
    if (!Number.isFinite(end)) return null;
    const t = typeof now === "number" ? now : Date.now();
    if (end <= t) return null;
    return Math.ceil((end - t) / 864e5);
  }

  // ../../packages/core/src/audio.js
  var AUDIO_SAMPLE_RATE = 16e3;
  function deepgramLiveUrl(source) {
    const lang = source && source !== "auto" ? String(source).toLowerCase().split("-")[0] : (
      // Nova-3 multilingual: detects and follows code-switching live.
      "multi"
    );
    return `wss://api.deepgram.com/v1/listen?model=nova-3&encoding=linear16&sample_rate=${AUDIO_SAMPLE_RATE}&channels=1&smart_format=true&interim_results=false&endpointing=300&language=${encodeURIComponent(lang)}`;
  }
  function floatTo16BitPCM(float32) {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      out[i] = s < 0 ? s * 32768 : s * 32767;
    }
    return out;
  }
  function transcriptToCue(msg, t0, playbackRate) {
    if (!msg || msg.type !== "Results" || !msg.is_final) return null;
    const alt = msg.channel && Array.isArray(msg.channel.alternatives) ? msg.channel.alternatives[0] : null;
    const text = alt && typeof alt.transcript === "string" ? alt.transcript.trim() : "";
    if (!text) return null;
    const rate = playbackRate > 0 ? playbackRate : 1;
    const start = (Number(msg.start) || 0) * rate + t0;
    const dur = Math.max(0.4, (Number(msg.duration) || 0) * rate);
    return { start, end: start + dur, text };
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
  var RETRY_MS = 12e4;
  var PENDING_GRACE_MS = 400;
  function createBuiltinProvider({ onBroken } = {}) {
    const instances = /* @__PURE__ */ new Map();
    const graced = (entry) => entry.value !== void 0 ? entry.p : Promise.race([
      entry.p,
      new Promise((res) => setTimeout(() => res(null), PENDING_GRACE_MS))
    ]);
    return {
      id: "builtin",
      kind: "local",
      ready(source, target) {
        if (!source || source === "auto") return Promise.resolve(null);
        const key = source + "->" + target;
        const cached = instances.get(key);
        if (cached && (cached.value !== null || Date.now() - cached.at < RETRY_MS))
          return graced(cached);
        const entry = { value: void 0, at: Date.now(), p: null };
        entry.p = (async () => {
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
            if (onBroken) onBroken(e, key);
            return null;
          }
        })().then((v) => {
          entry.value = v;
          entry.at = Date.now();
          return v;
        });
        instances.set(key, entry);
        return graced(entry);
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
        if (resp && resp.ok)
          return { text: resp.text, detected: resp.detected || "" };
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
      translate: async (text, opts) => {
        const ctx = opts && opts.context || {};
        const resp = await runtime.sendMessage({
          type: "translate",
          provider: "deepl",
          text,
          source: source || "auto",
          target,
          // DeepL's `context` parameter: disambiguation only, free of
          // charge (characters in context are not billed) — BYO-key users
          // get the same context-awareness as the Pro path.
          context: [
            ...Array.isArray(ctx.before) ? ctx.before.slice(-3) : [],
            ...Array.isArray(ctx.after) ? ctx.after.slice(0, 2) : []
          ].join(" ").slice(0, 1500)
        });
        if (resp && resp.ok)
          return { text: resp.text, detected: resp.detected || "" };
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
        if (resp && resp.ok)
          return { text: resp.text, detected: resp.detected || "" };
        throw new Error(resp && resp.error || "googlev2 failed");
      }
    });
    return {
      id: "googlev2",
      kind: "cloud",
      ready: (source, target) => Promise.resolve(hasKey && hasKey() ? translatorFor(source, target) : null)
    };
  }

  // ../../packages/webext/src/providers/pro.js
  var AURA2_LANGS = /* @__PURE__ */ new Set(["en", "es", "de", "fr", "nl", "it", "ja"]);
  function createProProvider() {
    let blockedUntil = 0;
    const translatorFor = (source, target) => ({
      translate: async (text, opts) => {
        const ctx = opts && opts.context || {};
        const resp = await runtime.sendMessage({
          type: "translate-pro",
          text,
          before: Array.isArray(ctx.before) ? ctx.before.slice(-4) : [],
          after: Array.isArray(ctx.after) ? ctx.after.slice(0, 2) : [],
          source: source || "auto",
          target,
          secs: opts && opts.secs > 0 ? Math.min(60, opts.secs) : 0
        });
        if (resp && resp.ok) return resp.text;
        blockedUntil = Date.now() + 2e4;
        throw new Error(resp && resp.error || "pro translate failed");
      }
    });
    return {
      id: "pro",
      kind: "pro",
      ready: (source, target) => Promise.resolve(
        Date.now() < blockedUntil ? null : translatorFor(source, target)
      )
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
    accountNoteFree: "Unlock context-aware translation (beta) and natural neural voices.",
    accountNotePro: "Thanks for supporting Voxylio.",
    accountNoteProCanceled: "Subscription active until the end of the period.",
    statusSearching: "Looking for a video\u2026",
    statusNoVideo: "No video detected on this page.",
    statusVideosDetected: "$COUNT$ video(s) detected",
    statusLinesReady: "$COUNT$ line(s) ready",
    statusSpeaking: "speaking",
    statusSubsLoading: "Subtitle track detected \u2014 play for a few seconds to load the lines.",
    statusNoSubs: "No subtitles detected \u2014 make sure captions (CC) are turned on in the player. If the player has none to offer, dubbing is not possible on this video.",
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
    optGlossary: "Glossary",
    optGlossaryHint: "One term per line. \u201Cterm = translation\u201D forces that translation; a term alone is kept as-is, never translated. Applied with every engine, Pro included.",
    optGlossaryPlaceholder: "Voxylio\nmachine learning = machine learning",
    optGlossaryCount: "$COUNT$ active term(s)",
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
    proBanner: "\u2726 Context-aware translation (beta) and neural voices",
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
    uiLangAuto: "Browser language",
    proTransLabel: "Pro contextual translation (beta)",
    translationPro: "Translation: Pro contextual (beta)",
    proVoiceLabel: "Pro neural voice",
    launchCta: "Start dubbing on this page",
    titleGoPro: "Unlock the Pro plan",
    titlePreview: "Play a voice preview",
    titleAutoPause: "Pauses the video for a few seconds when the voice falls too far behind, instead of skipping lines",
    titleLocalOnly: "Uses only Chrome's local translation: no text leaves your device. When it is unavailable, dubbing waits instead of going online.",
    titleProTrans: "Translates with the context of nearby sentences through the Voxylio cloud (monthly allowance). When it runs out, dubbing continues locally. Beta feature: quality can still vary from video to video.",
    titleProVoice: "Aura-2 neural voice (7 languages: EN ES DE FR NL IT JA). For other languages, or when the allowance runs out, the local voice takes over.",
    titleRetry: "Re-runs detection of the video, subtitles and translation",
    titleDiag: "Copies a technical report to attach to a bug report",
    titleReset: "Restores all default settings",
    titleOptions: "Translation providers, API keys, disabled sites",
    titleAccount: "Manage your Voxylio account on the site",
    optKeepTerms: "Keep technical terms in English (commit, build, prompt\u2026)",
    quotaTitle: "Pro usage this month",
    quotaTrans: "AI translation (beta)",
    quotaVoice: "Neural voice",
    quotaResets: "Resets on {date}",
    statusProSite: "This site is Pro-only. Free plan: YouTube, Netflix, Prime Video, Disney+ and Twitch.",
    statusTrialNote: "Full trial: this site stays unlocked for $COUNT$ more day(s)",
    proAudioLabel: "Pro no-subtitle dubbing (beta)",
    titleProAudio: "Video with no subtitles at all? Its audio is transcribed live (60 min/month) then dubbed normally. No local fallback: minutes out, the feature waits for the next cycle. Beta feature: transcription quality can vary.",
    quotaAudio: "Premium Audio (beta)",
    statusAudioLive: "No subtitles: transcribing the audio live (beta) \u2014 dubbing follows in a few seconds.",
    statusAudioQuota: "Premium Audio minutes exhausted for this month \u2014 no-subtitle dubbing (beta) resumes next cycle.",
    statusAudioUnavailable: "This player's audio can't be captured (site protection) \u2014 no-subtitle dubbing (beta) can't work here.",
    btnCheckUpdate: "Check for updates",
    updChecking: "Checking\u2026",
    updFound: "Update found \u2014 restarting\u2026",
    updNone: "Up to date \u2713",
    updThrottled: "Try again in a few minutes"
  };

  // src/messages/fr.json
  var fr_default = {
    appName: "Voxylio \u2014 doublage multilingue",
    appDesc: "Double les vid\xE9os sous-titr\xE9es en temps r\xE9el : traduction locale, voix synchronis\xE9e. Plus de 65 langues.",
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
    accountNoteFree: "D\xE9bloquez la traduction contextuelle (b\xEAta) et les voix neurales naturelles.",
    accountNotePro: "Merci de soutenir Voxylio.",
    accountNoteProCanceled: "Abonnement actif jusqu\u2019\xE0 la fin de la p\xE9riode.",
    statusSearching: "Recherche d\u2019une vid\xE9o\u2026",
    statusNoVideo: "Aucune vid\xE9o d\xE9tect\xE9e sur cette page.",
    statusVideosDetected: "$COUNT$ vid\xE9o(s) d\xE9tect\xE9e(s)",
    statusLinesReady: "$COUNT$ r\xE9plique(s) pr\xEAte(s)",
    statusSpeaking: "voix en cours",
    statusSubsLoading: "Piste de sous-titres d\xE9tect\xE9e \u2014 lance la lecture quelques secondes pour charger les r\xE9pliques.",
    statusNoSubs: "Aucun sous-titre d\xE9tect\xE9 \u2014 assure-toi que les sous-titres (CC) sont activ\xE9s dans le lecteur. S'il n'en propose pas, le doublage n'est pas possible sur cette vid\xE9o.",
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
    optGlossary: "Glossaire",
    optGlossaryHint: "Un terme par ligne. \xAB terme = traduction \xBB impose cette traduction ; un terme seul est conserv\xE9 tel quel, jamais traduit. Appliqu\xE9 avec tous les moteurs, Pro compris.",
    optGlossaryPlaceholder: "Voxylio\nmachine learning = apprentissage machine",
    optGlossaryCount: "$COUNT$ terme(s) actif(s)",
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
    proBanner: "\u2726 Traduction contextuelle (b\xEAta) et voix neurales",
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
    uiLangAuto: "Langue du navigateur",
    proTransLabel: "Traduction contextuelle Pro (b\xEAta)",
    translationPro: "Traduction : Pro contextuelle (b\xEAta)",
    proVoiceLabel: "Voix neurale Pro",
    launchCta: "Lancer le doublage sur cette page",
    titleGoPro: "D\xE9bloquer le plan Pro",
    titlePreview: "\xC9couter un aper\xE7u de la voix",
    titleAutoPause: "Met la vid\xE9o en pause quelques secondes quand la voix prend trop de retard, au lieu de sauter des phrases",
    titleLocalOnly: "N'utilise que la traduction locale de Chrome : aucun texte ne quitte votre appareil. Si elle est indisponible, le doublage attend au lieu de passer en ligne.",
    titleProTrans: "Traduit avec le contexte des phrases voisines via le cloud Voxylio (volume mensuel). En cas de volume \xE9puis\xE9, le doublage continue en local. Fonction en b\xEAta : la qualit\xE9 peut encore varier selon les vid\xE9os.",
    titleProVoice: "Voix neurale Aura-2 (7 langues : EN ES DE FR NL IT JA). Pour les autres langues ou si le volume est \xE9puis\xE9, la voix locale prend le relais.",
    titleRetry: "Relance la d\xE9tection de la vid\xE9o, des sous-titres et de la traduction",
    titleDiag: "Copie un diagnostic technique \xE0 joindre \xE0 un signalement",
    titleReset: "R\xE9tablit tous les r\xE9glages par d\xE9faut",
    titleOptions: "Fournisseurs de traduction, cl\xE9s API, sites d\xE9sactiv\xE9s",
    titleAccount: "G\xE9rer votre compte Voxylio sur le site",
    optKeepTerms: "Pr\xE9server les termes techniques en anglais (commit, build, prompt\u2026)",
    quotaTitle: "Utilisation Pro du mois",
    quotaTrans: "Traduction IA (b\xEAta)",
    quotaVoice: "Voix neurale",
    quotaResets: "Se r\xE9initialise le {date}",
    statusProSite: "Ce site est r\xE9serv\xE9 au Pro. En gratuit : YouTube, Netflix, Prime Video, Disney+ et Twitch.",
    statusTrialNote: "Essai complet : ce site reste d\xE9bloqu\xE9 encore $COUNT$ j",
    proAudioLabel: "Doublage sans sous-titres Pro (b\xEAta)",
    titleProAudio: "Vid\xE9o sans aucun sous-titre ? L'audio est transcrit en direct (60 min/mois) puis doubl\xE9 normalement. Sans repli local : minutes \xE9puis\xE9es, la fonction attend le prochain cycle. Fonction en b\xEAta : la qualit\xE9 de transcription peut varier.",
    quotaAudio: "Audio Premium (b\xEAta)",
    statusAudioLive: "Aucun sous-titre : transcription en direct de l'audio (b\xEAta) \u2014 le doublage suit dans quelques secondes.",
    statusAudioQuota: "Minutes Premium Audio \xE9puis\xE9es pour ce mois \u2014 le doublage sans sous-titres (b\xEAta) reprend au prochain cycle.",
    statusAudioUnavailable: "Impossible de capturer l'audio de ce lecteur (protection du site) \u2014 le doublage sans sous-titres (b\xEAta) ne peut pas fonctionner ici.",
    btnCheckUpdate: "V\xE9rifier les mises \xE0 jour",
    updChecking: "V\xE9rification\u2026",
    updFound: "Mise \xE0 jour trouv\xE9e \u2014 red\xE9marrage\u2026",
    updNone: "\xC0 jour \u2713",
    updThrottled: "R\xE9essaie dans quelques minutes"
  };

  // src/messages/es.json
  var es_default = {
    appName: "Voxylio \u2014 doblaje multiling\xFCe",
    appDesc: "Dobla v\xEDdeos subtitulados en tiempo real: traducci\xF3n local, voz sincronizada. M\xE1s de 65 idiomas.",
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
    accountNoteFree: "Desbloquea la traducci\xF3n contextual (beta) y las voces neuronales naturales.",
    accountNotePro: "Gracias por apoyar Voxylio.",
    accountNoteProCanceled: "Suscripci\xF3n activa hasta el final del per\xEDodo.",
    statusSearching: "Buscando un v\xEDdeo\u2026",
    statusNoVideo: "No se detecta ning\xFAn v\xEDdeo en esta p\xE1gina.",
    statusVideosDetected: "$COUNT$ v\xEDdeo(s) detectado(s)",
    statusLinesReady: "$COUNT$ l\xEDnea(s) lista(s)",
    statusSpeaking: "voz activa",
    statusSubsLoading: "Pista de subt\xEDtulos detectada \u2014 reproduce unos segundos para cargar las l\xEDneas.",
    statusNoSubs: "No se detectan subt\xEDtulos \u2014 aseg\xFArate de activar los subt\xEDtulos (CC) en el reproductor. Si no ofrece ninguno, el doblaje no es posible en este v\xEDdeo.",
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
    optGlossary: "Glosario",
    optGlossaryHint: "Un t\xE9rmino por l\xEDnea. \xABt\xE9rmino = traducci\xF3n\xBB impone esa traducci\xF3n; un t\xE9rmino solo se conserva tal cual, nunca se traduce. Se aplica con todos los motores, Pro incluido.",
    optGlossaryPlaceholder: "Voxylio\nmachine learning = aprendizaje autom\xE1tico",
    optGlossaryCount: "$COUNT$ t\xE9rmino(s) activo(s)",
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
    proBanner: "\u2726 Traducci\xF3n contextual (beta) y voces neuronales",
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
    uiLangAuto: "Idioma del navegador",
    proTransLabel: "Traducci\xF3n contextual Pro (beta)",
    translationPro: "Traducci\xF3n: Pro contextual (beta)",
    proVoiceLabel: "Voz neuronal Pro",
    launchCta: "Iniciar el doblaje en esta p\xE1gina",
    titleGoPro: "Desbloquear el plan Pro",
    titlePreview: "Escuchar una muestra de la voz",
    titleAutoPause: "Pausa el v\xEDdeo unos segundos cuando la voz se retrasa demasiado, en lugar de saltarse frases",
    titleLocalOnly: "Usa solo la traducci\xF3n local de Chrome: ning\xFAn texto sale de tu dispositivo. Si no est\xE1 disponible, el doblaje espera en lugar de ir en l\xEDnea.",
    titleProTrans: "Traduce con el contexto de las frases cercanas a trav\xE9s de la nube de Voxylio (volumen mensual). Si se agota, el doblaje contin\xFAa en local. Funci\xF3n en beta: la calidad a\xFAn puede variar seg\xFAn el v\xEDdeo.",
    titleProVoice: "Voz neuronal Aura-2 (7 idiomas: EN ES DE FR NL IT JA). Para otros idiomas, o si el volumen se agota, la voz local toma el relevo.",
    titleRetry: "Relanza la detecci\xF3n del v\xEDdeo, los subt\xEDtulos y la traducci\xF3n",
    titleDiag: "Copia un diagn\xF3stico t\xE9cnico para adjuntar a un reporte",
    titleReset: "Restaura todos los ajustes predeterminados",
    titleOptions: "Proveedores de traducci\xF3n, claves API, sitios desactivados",
    titleAccount: "Gestionar tu cuenta Voxylio en el sitio",
    optKeepTerms: "Conservar los t\xE9rminos t\xE9cnicos en ingl\xE9s (commit, build, prompt\u2026)",
    quotaTitle: "Uso Pro del mes",
    quotaTrans: "Traducci\xF3n IA (beta)",
    quotaVoice: "Voz neuronal",
    quotaResets: "Se restablece el {date}",
    statusProSite: "Este sitio es solo Pro. Plan gratuito: YouTube, Netflix, Prime Video, Disney+ y Twitch.",
    statusTrialNote: "Prueba completa: este sitio sigue desbloqueado $COUNT$ d\xEDa(s) m\xE1s",
    proAudioLabel: "Doblaje sin subt\xEDtulos Pro (beta)",
    titleProAudio: "\xBFV\xEDdeo sin ning\xFAn subt\xEDtulo? Su audio se transcribe en directo (60 min/mes) y luego se dobla normalmente. Sin respaldo local: minutos agotados, la funci\xF3n espera al siguiente ciclo. Funci\xF3n en beta: la calidad de la transcripci\xF3n puede variar.",
    quotaAudio: "Audio Premium (beta)",
    statusAudioLive: "Sin subt\xEDtulos: transcribiendo el audio en directo (beta) \u2014 el doblaje llega en unos segundos.",
    statusAudioQuota: "Minutos de Audio Premium agotados este mes \u2014 el doblaje sin subt\xEDtulos (beta) vuelve el pr\xF3ximo ciclo.",
    statusAudioUnavailable: "No se puede capturar el audio de este reproductor (protecci\xF3n del sitio) \u2014 el doblaje sin subt\xEDtulos (beta) no puede funcionar aqu\xED.",
    btnCheckUpdate: "Buscar actualizaciones",
    updChecking: "Comprobando\u2026",
    updFound: "Actualizaci\xF3n encontrada \u2014 reiniciando\u2026",
    updNone: "Actualizado \u2713",
    updThrottled: "Int\xE9ntalo de nuevo en unos minutos"
  };

  // src/messages/de.json
  var de_default = {
    appName: "Voxylio \u2014 mehrsprachige Synchronisation",
    appDesc: "Vertont untertitelte Videos in Echtzeit: lokale \xDCbersetzung, Stimme im Takt der Wiedergabe. \xDCber 65 Sprachen.",
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
    accountNoteFree: "Schalte kontextuelle \xDCbersetzung (Beta) und nat\xFCrliche neuronale Stimmen frei.",
    accountNotePro: "Danke, dass du Voxylio unterst\xFCtzt.",
    accountNoteProCanceled: "Abo aktiv bis zum Ende des Zeitraums.",
    statusSearching: "Suche nach einem Video\u2026",
    statusNoVideo: "Kein Video auf dieser Seite erkannt.",
    statusVideosDetected: "$COUNT$ Video(s) erkannt",
    statusLinesReady: "$COUNT$ Zeile(n) bereit",
    statusSpeaking: "Stimme aktiv",
    statusSubsLoading: "Untertitelspur erkannt \u2014 ein paar Sekunden abspielen, um die Zeilen zu laden.",
    statusNoSubs: "Keine Untertitel erkannt \u2014 stell sicher, dass Untertitel (CC) im Player aktiviert sind. Bietet der Player keine an, ist die Vertonung bei diesem Video nicht m\xF6glich.",
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
    optGlossary: "Glossar",
    optGlossaryHint: "Ein Begriff pro Zeile. \u201EBegriff = \xDCbersetzung\u201C erzwingt diese \xDCbersetzung; ein Begriff allein bleibt unver\xE4ndert und wird nie \xFCbersetzt. Gilt f\xFCr alle Engines, auch Pro.",
    optGlossaryPlaceholder: "Voxylio\nmachine learning = maschinelles Lernen",
    optGlossaryCount: "$COUNT$ aktive(r) Begriff(e)",
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
    proBanner: "\u2726 Kontextuelle \xDCbersetzung (Beta) und neuronale Stimmen",
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
    uiLangAuto: "Browsersprache",
    proTransLabel: "Kontextuelle Pro-\xDCbersetzung (Beta)",
    translationPro: "\xDCbersetzung: Pro kontextuell (Beta)",
    proVoiceLabel: "Neuronale Pro-Stimme",
    launchCta: "Synchronisation auf dieser Seite starten",
    titleGoPro: "Pro-Plan freischalten",
    titlePreview: "Stimmprobe abspielen",
    titleAutoPause: "Pausiert das Video f\xFCr ein paar Sekunden, wenn die Stimme zu weit zur\xFCckf\xE4llt, statt S\xE4tze zu \xFCberspringen",
    titleLocalOnly: "Nutzt nur Chromes lokale \xDCbersetzung: kein Text verl\xE4sst dein Ger\xE4t. Ist sie nicht verf\xFCgbar, wartet die Synchronisation, statt online zu gehen.",
    titleProTrans: "\xDCbersetzt mit dem Kontext der Nachbars\xE4tze \xFCber die Voxylio-Cloud (Monatskontingent). Ist es aufgebraucht, geht es lokal weiter. Beta-Funktion: Die Qualit\xE4t kann je nach Video noch variieren.",
    titleProVoice: "Neuronale Aura-2-Stimme (7 Sprachen: EN ES DE FR NL IT JA). F\xFCr andere Sprachen oder bei ersch\xF6pftem Kontingent \xFCbernimmt die lokale Stimme.",
    titleRetry: "Startet die Erkennung von Video, Untertiteln und \xDCbersetzung neu",
    titleDiag: "Kopiert einen technischen Bericht f\xFCr eine Fehlermeldung",
    titleReset: "Stellt alle Standardeinstellungen wieder her",
    titleOptions: "\xDCbersetzungsanbieter, API-Schl\xFCssel, deaktivierte Seiten",
    titleAccount: "Dein Voxylio-Konto auf der Website verwalten",
    optKeepTerms: "Technische Begriffe auf Englisch lassen (commit, build, prompt\u2026)",
    quotaTitle: "Pro-Nutzung diesen Monat",
    quotaTrans: "KI-\xDCbersetzung (Beta)",
    quotaVoice: "Neuronale Stimme",
    quotaResets: "Wird am {date} zur\xFCckgesetzt",
    statusProSite: "Diese Seite ist Pro vorbehalten. Gratis: YouTube, Netflix, Prime Video, Disney+ und Twitch.",
    statusTrialNote: "Volltest: diese Seite bleibt noch $COUNT$ Tag(e) freigeschaltet",
    proAudioLabel: "Pro-Dubbing ohne Untertitel (Beta)",
    titleProAudio: "Video ganz ohne Untertitel? Der Ton wird live transkribiert (60 Min./Monat) und dann normal synchronisiert. Kein lokaler Fallback: Minuten aufgebraucht, die Funktion wartet auf den n\xE4chsten Zyklus. Beta-Funktion: Die Transkriptionsqualit\xE4t kann variieren.",
    quotaAudio: "Premium Audio (Beta)",
    statusAudioLive: "Keine Untertitel: Der Ton wird live transkribiert (Beta) \u2014 das Dubbing folgt in wenigen Sekunden.",
    statusAudioQuota: "Premium-Audio-Minuten f\xFCr diesen Monat aufgebraucht \u2014 Dubbing ohne Untertitel (Beta) geht im n\xE4chsten Zyklus weiter.",
    statusAudioUnavailable: "Der Ton dieses Players l\xE4sst sich nicht erfassen (Seitenschutz) \u2014 Dubbing ohne Untertitel (Beta) funktioniert hier nicht.",
    btnCheckUpdate: "Nach Updates suchen",
    updChecking: "Wird gepr\xFCft\u2026",
    updFound: "Update gefunden \u2014 Neustart\u2026",
    updNone: "Aktuell \u2713",
    updThrottled: "Versuch es in ein paar Minuten erneut"
  };

  // src/messages/it.json
  var it_default = {
    appName: "Voxylio \u2014 doppiaggio multilingue",
    appDesc: "Doppia i video sottotitolati in tempo reale: traduzione locale, voce sincronizzata. Oltre 65 lingue.",
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
    accountNoteFree: "Sblocca la traduzione contestuale (beta) e le voci neurali naturali.",
    accountNotePro: "Grazie per sostenere Voxylio.",
    accountNoteProCanceled: "Abbonamento attivo fino alla fine del periodo.",
    statusSearching: "Ricerca di un video\u2026",
    statusNoVideo: "Nessun video rilevato in questa pagina.",
    statusVideosDetected: "$COUNT$ video rilevato/i",
    statusLinesReady: "$COUNT$ battuta/e pronte",
    statusSpeaking: "voce attiva",
    statusSubsLoading: "Traccia di sottotitoli rilevata \u2014 riproduci qualche secondo per caricare le battute.",
    statusNoSubs: "Nessun sottotitolo rilevato \u2014 assicurati che i sottotitoli (CC) siano attivi nel player. Se non ne offre, il doppiaggio non \xE8 possibile su questo video.",
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
    optGlossary: "Glossario",
    optGlossaryHint: "Un termine per riga. \xABtermine = traduzione\xBB impone quella traduzione; un termine da solo resta invariato, mai tradotto. Vale con tutti i motori, Pro incluso.",
    optGlossaryPlaceholder: "Voxylio\nmachine learning = apprendimento automatico",
    optGlossaryCount: "$COUNT$ termine/i attivo/i",
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
    proBanner: "\u2726 Traduzione contestuale (beta) e voci neurali",
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
    uiLangAuto: "Lingua del browser",
    proTransLabel: "Traduzione contestuale Pro (beta)",
    translationPro: "Traduzione: Pro contestuale (beta)",
    proVoiceLabel: "Voce neurale Pro",
    launchCta: "Avvia il doppiaggio su questa pagina",
    titleGoPro: "Sblocca il piano Pro",
    titlePreview: "Ascolta un'anteprima della voce",
    titleAutoPause: "Mette il video in pausa per qualche secondo quando la voce \xE8 troppo indietro, invece di saltare frasi",
    titleLocalOnly: "Usa solo la traduzione locale di Chrome: nessun testo lascia il tuo dispositivo. Se non \xE8 disponibile, il doppiaggio attende invece di andare online.",
    titleProTrans: "Traduce con il contesto delle frasi vicine tramite il cloud Voxylio (volume mensile). Se si esaurisce, il doppiaggio continua in locale. Funzione in beta: la qualit\xE0 pu\xF2 ancora variare da un video all'altro.",
    titleProVoice: "Voce neurale Aura-2 (7 lingue: EN ES DE FR NL IT JA). Per le altre lingue, o a volume esaurito, subentra la voce locale.",
    titleRetry: "Rilancia il rilevamento di video, sottotitoli e traduzione",
    titleDiag: "Copia una diagnostica tecnica da allegare a una segnalazione",
    titleReset: "Ripristina tutte le impostazioni predefinite",
    titleOptions: "Fornitori di traduzione, chiavi API, siti disattivati",
    titleAccount: "Gestisci il tuo account Voxylio sul sito",
    optKeepTerms: "Mantieni i termini tecnici in inglese (commit, build, prompt\u2026)",
    quotaTitle: "Utilizzo Pro del mese",
    quotaTrans: "Traduzione IA (beta)",
    quotaVoice: "Voce neurale",
    quotaResets: "Si azzera il {date}",
    statusProSite: "Questo sito \xE8 riservato a Pro. Piano gratuito: YouTube, Netflix, Prime Video, Disney+ e Twitch.",
    statusTrialNote: "Prova completa: questo sito resta sbloccato ancora $COUNT$ giorno/i",
    proAudioLabel: "Doppiaggio senza sottotitoli Pro (beta)",
    titleProAudio: "Video senza alcun sottotitolo? L'audio viene trascritto in diretta (60 min/mese) e poi doppiato normalmente. Nessun ripiego locale: minuti esauriti, la funzione attende il ciclo successivo. Funzione in beta: la qualit\xE0 della trascrizione pu\xF2 variare.",
    quotaAudio: "Audio Premium (beta)",
    statusAudioLive: "Nessun sottotitolo: trascrizione dell'audio in diretta (beta) \u2014 il doppiaggio arriva tra pochi secondi.",
    statusAudioQuota: "Minuti di Audio Premium esauriti per questo mese \u2014 il doppiaggio senza sottotitoli (beta) riprende al prossimo ciclo.",
    statusAudioUnavailable: "Impossibile catturare l'audio di questo player (protezione del sito) \u2014 il doppiaggio senza sottotitoli (beta) non pu\xF2 funzionare qui.",
    btnCheckUpdate: "Cerca aggiornamenti",
    updChecking: "Controllo\u2026",
    updFound: "Aggiornamento trovato \u2014 riavvio\u2026",
    updNone: "Aggiornato \u2713",
    updThrottled: "Riprova tra qualche minuto"
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
    accountNoteFree: "\u6587\u8108\u7FFB\u8A33\uFF08\u30D9\u30FC\u30BF\u7248\uFF09\u3068\u81EA\u7136\u306A\u30CB\u30E5\u30FC\u30E9\u30EB\u97F3\u58F0\u3092\u30A2\u30F3\u30ED\u30C3\u30AF\u3002",
    accountNotePro: "Voxylio\u3078\u306E\u3054\u652F\u63F4\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3059\u3002",
    accountNoteProCanceled: "\u671F\u9593\u7D42\u4E86\u307E\u3067\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u6709\u52B9\u3002",
    statusSearching: "\u52D5\u753B\u3092\u63A2\u3057\u3066\u3044\u307E\u3059\u2026",
    statusNoVideo: "\u3053\u306E\u30DA\u30FC\u30B8\u306B\u52D5\u753B\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002",
    statusVideosDetected: "$COUNT$ \u672C\u306E\u52D5\u753B\u3092\u691C\u51FA",
    statusLinesReady: "$COUNT$ \u4EF6\u306E\u30BB\u30EA\u30D5\u304C\u6E96\u5099\u5B8C\u4E86",
    statusSpeaking: "\u97F3\u58F0\u518D\u751F\u4E2D",
    statusSubsLoading: "\u5B57\u5E55\u30C8\u30E9\u30C3\u30AF\u3092\u691C\u51FA \u2014 \u6570\u79D2\u518D\u751F\u3059\u308B\u3068\u30BB\u30EA\u30D5\u304C\u8AAD\u307F\u8FBC\u307E\u308C\u307E\u3059\u3002",
    statusNoSubs: "\u5B57\u5E55\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 \u2014 \u30D7\u30EC\u30FC\u30E4\u30FC\u3067\u5B57\u5E55\uFF08CC\uFF09\u304C\u30AA\u30F3\u306B\u306A\u3063\u3066\u3044\u308B\u304B\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u5B57\u5E55\u304C\u63D0\u4F9B\u3055\u308C\u3066\u3044\u306A\u3044\u5834\u5408\u3001\u3053\u306E\u52D5\u753B\u306F\u5439\u304D\u66FF\u3048\u3067\u304D\u307E\u305B\u3093\u3002",
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
    optGlossary: "\u7528\u8A9E\u96C6",
    optGlossaryHint: "1\u884C\u306B1\u8A9E\u3002\u300C\u7528\u8A9E = \u8A33\u8A9E\u300D\u3067\u305D\u306E\u8A33\u8A9E\u3092\u5F37\u5236\u3001\u7528\u8A9E\u306E\u307F\u66F8\u304F\u3068\u305D\u306E\u307E\u307E\u7DAD\u6301\u3055\u308C\u3001\u7FFB\u8A33\u3055\u308C\u307E\u305B\u3093\u3002Pro \u3092\u542B\u3080\u3059\u3079\u3066\u306E\u30A8\u30F3\u30B8\u30F3\u306B\u9069\u7528\u3055\u308C\u307E\u3059\u3002",
    optGlossaryPlaceholder: "Voxylio\nmachine learning = \u6A5F\u68B0\u5B66\u7FD2",
    optGlossaryCount: "\u6709\u52B9\u306A\u7528\u8A9E: $COUNT$",
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
    proBanner: "\u2726 \u6587\u8108\u7FFB\u8A33\uFF08\u30D9\u30FC\u30BF\u7248\uFF09\u3068\u30CB\u30E5\u30FC\u30E9\u30EB\u97F3\u58F0",
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
    uiLangAuto: "\u30D6\u30E9\u30A6\u30B6\u306E\u8A00\u8A9E",
    proTransLabel: "Pro\u6587\u8108\u7FFB\u8A33\uFF08\u30D9\u30FC\u30BF\u7248\uFF09",
    translationPro: "\u7FFB\u8A33\uFF1APro\u6587\u8108\uFF08\u30D9\u30FC\u30BF\u7248\uFF09",
    proVoiceLabel: "Pro \u30CB\u30E5\u30FC\u30E9\u30EB\u97F3\u58F0",
    launchCta: "\u3053\u306E\u30DA\u30FC\u30B8\u3067\u5439\u304D\u66FF\u3048\u3092\u958B\u59CB",
    titleGoPro: "Pro \u30D7\u30E9\u30F3\u3092\u89E3\u653E",
    titlePreview: "\u58F0\u306E\u30D7\u30EC\u30D3\u30E5\u30FC\u3092\u518D\u751F",
    titleAutoPause: "\u97F3\u58F0\u304C\u9045\u308C\u3059\u304E\u305F\u3068\u304D\u3001\u6587\u3092\u98DB\u3070\u3059\u4EE3\u308F\u308A\u306B\u52D5\u753B\u3092\u6570\u79D2\u4E00\u6642\u505C\u6B62\u3057\u307E\u3059",
    titleLocalOnly: "Chrome \u306E\u30ED\u30FC\u30AB\u30EB\u7FFB\u8A33\u306E\u307F\u3092\u4F7F\u7528\uFF1A\u30C6\u30AD\u30B9\u30C8\u306F\u7AEF\u672B\u306E\u5916\u306B\u51FA\u307E\u305B\u3093\u3002\u5229\u7528\u3067\u304D\u306A\u3044\u3068\u304D\u306F\u30AA\u30F3\u30E9\u30A4\u30F3\u306B\u884C\u304B\u305A\u5F85\u6A5F\u3057\u307E\u3059\u3002",
    titleProTrans: "Voxylio \u30AF\u30E9\u30A6\u30C9\u7D4C\u7531\u3067\u524D\u5F8C\u306E\u6587\u8108\u3092\u8E0F\u307E\u3048\u3066\u7FFB\u8A33\uFF08\u6708\u9593\u67A0\uFF09\u3002\u4F7F\u3044\u5207\u3063\u3066\u3082\u5439\u304D\u66FF\u3048\u306F\u30ED\u30FC\u30AB\u30EB\u3067\u7D9A\u304D\u307E\u3059\u3002 \u30D9\u30FC\u30BF\u6A5F\u80FD\uFF1A\u54C1\u8CEA\u306F\u52D5\u753B\u306B\u3088\u3063\u3066\u307E\u3060\u3070\u3089\u3064\u304F\u3053\u3068\u304C\u3042\u308A\u307E\u3059\u3002",
    titleProVoice: "Aura-2 \u30CB\u30E5\u30FC\u30E9\u30EB\u97F3\u58F0\uFF087\u8A00\u8A9E\uFF1AEN ES DE FR NL IT JA\uFF09\u3002\u4ED6\u306E\u8A00\u8A9E\u3084\u67A0\u3092\u4F7F\u3044\u5207\u3063\u305F\u5834\u5408\u306F\u30ED\u30FC\u30AB\u30EB\u97F3\u58F0\u304C\u5F15\u304D\u7D99\u304E\u307E\u3059\u3002",
    titleRetry: "\u52D5\u753B\u30FB\u5B57\u5E55\u30FB\u7FFB\u8A33\u306E\u691C\u51FA\u3092\u3084\u308A\u76F4\u3057\u307E\u3059",
    titleDiag: "\u4E0D\u5177\u5408\u5831\u544A\u306B\u6DFB\u3048\u308B\u6280\u8853\u8A3A\u65AD\u3092\u30B3\u30D4\u30FC\u3057\u307E\u3059",
    titleReset: "\u3059\u3079\u3066\u306E\u8A2D\u5B9A\u3092\u65E2\u5B9A\u5024\u306B\u623B\u3057\u307E\u3059",
    titleOptions: "\u7FFB\u8A33\u30D7\u30ED\u30D0\u30A4\u30C0\u30FC\u3001API \u30AD\u30FC\u3001\u7121\u52B9\u5316\u30B5\u30A4\u30C8",
    titleAccount: "\u30B5\u30A4\u30C8\u3067 Voxylio \u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u7BA1\u7406",
    optKeepTerms: "\u6280\u8853\u7528\u8A9E\u3092\u82F1\u8A9E\u306E\u307E\u307E\u6B8B\u3059\uFF08commit\u3001build\u3001prompt\u2026\uFF09",
    quotaTitle: "\u4ECA\u6708\u306EPro\u4F7F\u7528\u72B6\u6CC1",
    quotaTrans: "AI\u7FFB\u8A33\uFF08\u30D9\u30FC\u30BF\u7248\uFF09",
    quotaVoice: "\u30CB\u30E5\u30FC\u30E9\u30EB\u97F3\u58F0",
    quotaResets: "{date}\u306B\u30EA\u30BB\u30C3\u30C8",
    statusProSite: "\u3053\u306E\u30B5\u30A4\u30C8\u306FPro\u5C02\u7528\u3067\u3059\u3002\u7121\u6599\u30D7\u30E9\u30F3\uFF1AYouTube\u3001Netflix\u3001Prime Video\u3001Disney+\u3001Twitch\u3002",
    statusTrialNote: "\u30D5\u30EB\u4F53\u9A13\u4E2D\uFF1A\u3053\u306E\u30B5\u30A4\u30C8\u306F\u3042\u3068$COUNT$\u65E5\u5229\u7528\u3067\u304D\u307E\u3059",
    proAudioLabel: "\u5B57\u5E55\u306A\u3057\u52D5\u753B\u306EPro\u5439\u304D\u66FF\u3048\uFF08\u30D9\u30FC\u30BF\u7248\uFF09",
    titleProAudio: "\u5B57\u5E55\u304C\u307E\u3063\u305F\u304F\u306A\u3044\u52D5\u753B\uFF1F\u97F3\u58F0\u3092\u30E9\u30A4\u30D6\u3067\u6587\u5B57\u8D77\u3053\u3057\uFF08\u670860\u5206\uFF09\u3057\u3001\u901A\u5E38\u3069\u304A\u308A\u5439\u304D\u66FF\u3048\u307E\u3059\u3002\u30ED\u30FC\u30AB\u30EB\u306E\u4EE3\u66FF\u306A\u3057\uFF1A\u5206\u6570\u3092\u4F7F\u3044\u5207\u308B\u3068\u6B21\u306E\u30B5\u30A4\u30AF\u30EB\u307E\u3067\u5F85\u6A5F\u3057\u307E\u3059\u3002 \u30D9\u30FC\u30BF\u6A5F\u80FD\uFF1A\u6587\u5B57\u8D77\u3053\u3057\u306E\u54C1\u8CEA\u306F\u5909\u52D5\u3059\u308B\u3053\u3068\u304C\u3042\u308A\u307E\u3059\u3002",
    quotaAudio: "\u30D7\u30EC\u30DF\u30A2\u30E0\u97F3\u58F0\uFF08\u30D9\u30FC\u30BF\u7248\uFF09",
    statusAudioLive: "\u5B57\u5E55\u306A\u3057\uFF1A\u97F3\u58F0\u3092\u30E9\u30A4\u30D6\u3067\u6587\u5B57\u8D77\u3053\u3057\u4E2D\uFF08\u30D9\u30FC\u30BF\u7248\uFF09 \u2014 \u6570\u79D2\u5F8C\u306B\u5439\u304D\u66FF\u3048\u304C\u59CB\u307E\u308A\u307E\u3059\u3002",
    statusAudioQuota: "\u4ECA\u6708\u306E\u30D7\u30EC\u30DF\u30A2\u30E0\u97F3\u58F0\u306E\u5206\u6570\u3092\u4F7F\u3044\u5207\u308A\u307E\u3057\u305F \u2014 \u5B57\u5E55\u306A\u3057\u5439\u304D\u66FF\u3048\uFF08\u30D9\u30FC\u30BF\u7248\uFF09\u306F\u6B21\u306E\u30B5\u30A4\u30AF\u30EB\u3067\u518D\u958B\u3057\u307E\u3059\u3002",
    statusAudioUnavailable: "\u3053\u306E\u30D7\u30EC\u30FC\u30E4\u30FC\u306E\u97F3\u58F0\u306F\u30AD\u30E3\u30D7\u30C1\u30E3\u3067\u304D\u307E\u305B\u3093\uFF08\u30B5\u30A4\u30C8\u4FDD\u8B77\uFF09\u2014 \u3053\u3053\u3067\u306F\u5B57\u5E55\u306A\u3057\u5439\u304D\u66FF\u3048\uFF08\u30D9\u30FC\u30BF\u7248\uFF09\u306F\u52D5\u4F5C\u3057\u307E\u305B\u3093\u3002",
    btnCheckUpdate: "\u66F4\u65B0\u3092\u78BA\u8A8D",
    updChecking: "\u78BA\u8A8D\u4E2D\u2026",
    updFound: "\u66F4\u65B0\u304C\u898B\u3064\u304B\u308A\u307E\u3057\u305F \u2014 \u518D\u8D77\u52D5\u3057\u307E\u3059\u2026",
    updNone: "\u6700\u65B0\u3067\u3059 \u2713",
    updThrottled: "\u6570\u5206\u5F8C\u306B\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044"
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
    accountNoteFree: "\uBB38\uB9E5 \uBC88\uC5ED(\uBCA0\uD0C0)\uACFC \uC790\uC5F0\uC2A4\uB7EC\uC6B4 \uC2E0\uACBD\uB9DD \uC74C\uC131\uC744 \uC7A0\uAE08 \uD574\uC81C\uD558\uC138\uC694.",
    accountNotePro: "Voxylio\uB97C \uC751\uC6D0\uD574 \uC8FC\uC154\uC11C \uAC10\uC0AC\uD569\uB2C8\uB2E4.",
    accountNoteProCanceled: "\uAE30\uAC04 \uC885\uB8CC\uAE4C\uC9C0 \uAD6C\uB3C5 \uC720\uD6A8.",
    statusSearching: "\uB3D9\uC601\uC0C1\uC744 \uCC3E\uB294 \uC911\u2026",
    statusNoVideo: "\uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB3D9\uC601\uC0C1\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
    statusVideosDetected: "\uB3D9\uC601\uC0C1 $COUNT$\uAC1C \uAC10\uC9C0",
    statusLinesReady: "\uB300\uC0AC $COUNT$\uAC1C \uC900\uBE44\uB428",
    statusSpeaking: "\uC74C\uC131 \uC7AC\uC0DD \uC911",
    statusSubsLoading: "\uC790\uB9C9 \uD2B8\uB799 \uAC10\uC9C0 \u2014 \uBA87 \uCD08 \uC7AC\uC0DD\uD558\uBA74 \uB300\uC0AC\uAC00 \uB85C\uB4DC\uB429\uB2C8\uB2E4.",
    statusNoSubs: "\uC790\uB9C9\uC774 \uAC10\uC9C0\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4 \u2014 \uD50C\uB808\uC774\uC5B4\uC5D0\uC11C \uC790\uB9C9(CC)\uC774 \uCF1C\uC838 \uC788\uB294\uC9C0 \uD655\uC778\uD558\uC138\uC694. \uC790\uB9C9\uC774 \uC81C\uACF5\uB418\uC9C0 \uC54A\uB294 \uB3D9\uC601\uC0C1\uC740 \uB354\uBE59\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
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
    optGlossary: "\uC6A9\uC5B4\uC9D1",
    optGlossaryHint: "\uD55C \uC904\uC5D0 \uD55C \uC6A9\uC5B4. \u201C\uC6A9\uC5B4 = \uBC88\uC5ED\u201D\uC740 \uD574\uB2F9 \uBC88\uC5ED\uC744 \uAC15\uC81C\uD558\uACE0, \uC6A9\uC5B4\uB9CC \uC4F0\uBA74 \uBC88\uC5ED\uB418\uC9C0 \uC54A\uACE0 \uADF8\uB300\uB85C \uC720\uC9C0\uB429\uB2C8\uB2E4. Pro\uB97C \uD3EC\uD568\uD55C \uBAA8\uB4E0 \uC5D4\uC9C4\uC5D0 \uC801\uC6A9\uB429\uB2C8\uB2E4.",
    optGlossaryPlaceholder: "Voxylio\nmachine learning = \uBA38\uC2E0\uB7EC\uB2DD",
    optGlossaryCount: "\uD65C\uC131 \uC6A9\uC5B4: $COUNT$",
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
    proBanner: "\u2726 \uBB38\uB9E5 \uBC88\uC5ED(\uBCA0\uD0C0)\uACFC \uC2E0\uACBD\uB9DD \uC74C\uC131",
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
    uiLangAuto: "\uBE0C\uB77C\uC6B0\uC800 \uC5B8\uC5B4",
    proTransLabel: "Pro \uBB38\uB9E5 \uBC88\uC5ED (\uBCA0\uD0C0)",
    translationPro: "\uBC88\uC5ED: Pro \uBB38\uB9E5 (\uBCA0\uD0C0)",
    proVoiceLabel: "Pro \uC2E0\uACBD\uB9DD \uC74C\uC131",
    launchCta: "\uC774 \uD398\uC774\uC9C0\uC5D0\uC11C \uB354\uBE59 \uC2DC\uC791",
    titleGoPro: "Pro \uD50C\uB79C \uC7A0\uAE08 \uD574\uC81C",
    titlePreview: "\uBAA9\uC18C\uB9AC \uBBF8\uB9AC\uB4E3\uAE30",
    titleAutoPause: "\uC74C\uC131\uC774 \uB108\uBB34 \uB4A4\uCC98\uC9C0\uBA74 \uBB38\uC7A5\uC744 \uAC74\uB108\uB6F0\uB294 \uB300\uC2E0 \uC601\uC0C1\uC744 \uBA87 \uCD08 \uC77C\uC2DC\uC815\uC9C0\uD569\uB2C8\uB2E4",
    titleLocalOnly: "Chrome \uB85C\uCEEC \uBC88\uC5ED\uB9CC \uC0AC\uC6A9: \uD14D\uC2A4\uD2B8\uAC00 \uAE30\uAE30\uB97C \uB5A0\uB098\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uC73C\uBA74 \uC628\uB77C\uC778\uC73C\uB85C \uAC00\uB294 \uB300\uC2E0 \uAE30\uB2E4\uB9BD\uB2C8\uB2E4.",
    titleProTrans: "Voxylio \uD074\uB77C\uC6B0\uB4DC\uB85C \uC8FC\uBCC0 \uBB38\uC7A5\uC758 \uBB38\uB9E5\uAE4C\uC9C0 \uBC18\uC601\uD574 \uBC88\uC5ED(\uC6D4\uAC04 \uC0AC\uC6A9\uB7C9). \uC18C\uC9C4\uB3FC\uB3C4 \uB354\uBE59\uC740 \uB85C\uCEEC\uB85C \uACC4\uC18D\uB429\uB2C8\uB2E4. \uBCA0\uD0C0 \uAE30\uB2A5: \uC601\uC0C1\uC5D0 \uB530\uB77C \uD488\uC9C8\uC774 \uC544\uC9C1 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    titleProVoice: "Aura-2 \uC2E0\uACBD\uB9DD \uC74C\uC131(7\uAC1C \uC5B8\uC5B4: EN ES DE FR NL IT JA). \uB2E4\uB978 \uC5B8\uC5B4\uB098 \uC0AC\uC6A9\uB7C9 \uC18C\uC9C4 \uC2DC \uB85C\uCEEC \uC74C\uC131\uC774 \uC774\uC5B4\uBC1B\uC2B5\uB2C8\uB2E4.",
    titleRetry: "\uC601\uC0C1\xB7\uC790\uB9C9\xB7\uBC88\uC5ED \uAC10\uC9C0\uB97C \uB2E4\uC2DC \uC2E4\uD589\uD569\uB2C8\uB2E4",
    titleDiag: "\uBC84\uADF8 \uC2E0\uACE0\uC5D0 \uCCA8\uBD80\uD560 \uAE30\uC220 \uC9C4\uB2E8\uC744 \uBCF5\uC0AC\uD569\uB2C8\uB2E4",
    titleReset: "\uBAA8\uB4E0 \uC124\uC815\uC744 \uAE30\uBCF8\uAC12\uC73C\uB85C \uB418\uB3CC\uB9BD\uB2C8\uB2E4",
    titleOptions: "\uBC88\uC5ED \uC81C\uACF5\uC790, API \uD0A4, \uBE44\uD65C\uC131\uD654\uD55C \uC0AC\uC774\uD2B8",
    titleAccount: "\uC0AC\uC774\uD2B8\uC5D0\uC11C Voxylio \uACC4\uC815 \uAD00\uB9AC",
    optKeepTerms: "\uAE30\uC220 \uC6A9\uC5B4\uB97C \uC601\uC5B4\uB85C \uC720\uC9C0(commit, build, prompt\u2026)",
    quotaTitle: "\uC774\uBC88 \uB2EC Pro \uC0AC\uC6A9\uB7C9",
    quotaTrans: "AI \uBC88\uC5ED (\uBCA0\uD0C0)",
    quotaVoice: "\uC2E0\uACBD\uB9DD \uC74C\uC131",
    quotaResets: "{date}\uC5D0 \uCD08\uAE30\uD654",
    statusProSite: "\uC774 \uC0AC\uC774\uD2B8\uB294 Pro \uC804\uC6A9\uC785\uB2C8\uB2E4. \uBB34\uB8CC \uD50C\uB79C: YouTube, Netflix, Prime Video, Disney+, Twitch.",
    statusTrialNote: "\uC804\uCCB4 \uCCB4\uD5D8: \uC774 \uC0AC\uC774\uD2B8\uB294 $COUNT$\uC77C \uB354 \uC774\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4",
    proAudioLabel: "\uC790\uB9C9 \uC5C6\uB294 \uC601\uC0C1 Pro \uB354\uBE59 (\uBCA0\uD0C0)",
    titleProAudio: "\uC790\uB9C9\uC774 \uC804\uD600 \uC5C6\uB294 \uC601\uC0C1\uC778\uAC00\uC694? \uC624\uB514\uC624\uB97C \uC2E4\uC2DC\uAC04\uC73C\uB85C \uC804\uC0AC(\uC6D4 60\uBD84)\uD55C \uB4A4 \uD3C9\uC18C\uCC98\uB7FC \uB354\uBE59\uD569\uB2C8\uB2E4. \uB85C\uCEEC \uB300\uCCB4 \uC5C6\uC74C: \uBD84\uC744 \uB2E4 \uC4F0\uBA74 \uB2E4\uC74C \uC8FC\uAE30\uAE4C\uC9C0 \uAE30\uB2E4\uB9BD\uB2C8\uB2E4. \uBCA0\uD0C0 \uAE30\uB2A5: \uC804\uC0AC \uD488\uC9C8\uC740 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    quotaAudio: "\uD504\uB9AC\uBBF8\uC5C4 \uC624\uB514\uC624 (\uBCA0\uD0C0)",
    statusAudioLive: "\uC790\uB9C9 \uC5C6\uC74C: \uC624\uB514\uC624\uB97C \uC2E4\uC2DC\uAC04 \uC804\uC0AC \uC911(\uBCA0\uD0C0) \u2014 \uBA87 \uCD08 \uD6C4 \uB354\uBE59\uC774 \uC2DC\uC791\uB429\uB2C8\uB2E4.",
    statusAudioQuota: "\uC774\uBC88 \uB2EC \uD504\uB9AC\uBBF8\uC5C4 \uC624\uB514\uC624 \uBD84\uC744 \uBAA8\uB450 \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4 \u2014 \uC790\uB9C9 \uC5C6\uB294 \uB354\uBE59(\uBCA0\uD0C0)\uC740 \uB2E4\uC74C \uC8FC\uAE30\uC5D0 \uC7AC\uAC1C\uB429\uB2C8\uB2E4.",
    statusAudioUnavailable: "\uC774 \uD50C\uB808\uC774\uC5B4\uC758 \uC624\uB514\uC624\uB97C \uCEA1\uCC98\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4(\uC0AC\uC774\uD2B8 \uBCF4\uD638) \u2014 \uC5EC\uAE30\uC11C\uB294 \uC790\uB9C9 \uC5C6\uB294 \uB354\uBE59(\uBCA0\uD0C0)\uC774 \uC791\uB3D9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    btnCheckUpdate: "\uC5C5\uB370\uC774\uD2B8 \uD655\uC778",
    updChecking: "\uD655\uC778 \uC911\u2026",
    updFound: "\uC5C5\uB370\uC774\uD2B8 \uBC1C\uACAC \u2014 \uB2E4\uC2DC \uC2DC\uC791\uD569\uB2C8\uB2E4\u2026",
    updNone: "\uCD5C\uC2E0 \uC0C1\uD0DC \u2713",
    updThrottled: "\uBA87 \uBD84 \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694"
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
    accountNoteFree: "\u89E3\u9501\u4E0A\u4E0B\u6587\u7FFB\u8BD1\uFF08\u6D4B\u8BD5\u7248\uFF09\u548C\u81EA\u7136\u7684\u795E\u7ECF\u8BED\u97F3\u3002",
    accountNotePro: "\u611F\u8C22\u4F60\u652F\u6301 Voxylio\u3002",
    accountNoteProCanceled: "\u8BA2\u9605\u6709\u6548\u671F\u81F3\u672C\u671F\u7ED3\u675F\u3002",
    statusSearching: "\u6B63\u5728\u5BFB\u627E\u89C6\u9891\u2026",
    statusNoVideo: "\u672A\u5728\u6B64\u9875\u9762\u68C0\u6D4B\u5230\u89C6\u9891\u3002",
    statusVideosDetected: "\u68C0\u6D4B\u5230 $COUNT$ \u4E2A\u89C6\u9891",
    statusLinesReady: "$COUNT$ \u6761\u53F0\u8BCD\u5DF2\u5C31\u7EEA",
    statusSpeaking: "\u8BED\u97F3\u64AD\u653E\u4E2D",
    statusSubsLoading: "\u68C0\u6D4B\u5230\u5B57\u5E55\u8F68\u9053 \u2014 \u64AD\u653E\u51E0\u79D2\u5373\u53EF\u52A0\u8F7D\u53F0\u8BCD\u3002",
    statusNoSubs: "\u672A\u68C0\u6D4B\u5230\u5B57\u5E55 \u2014 \u8BF7\u786E\u8BA4\u64AD\u653E\u5668\u4E2D\u5DF2\u5F00\u542F\u5B57\u5E55\uFF08CC\uFF09\u3002\u5982\u679C\u64AD\u653E\u5668\u4E0D\u63D0\u4F9B\u5B57\u5E55\uFF0C\u5219\u65E0\u6CD5\u4E3A\u6B64\u89C6\u9891\u914D\u97F3\u3002",
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
    optGlossary: "\u672F\u8BED\u8868",
    optGlossaryHint: "\u6BCF\u884C\u4E00\u4E2A\u8BCD\u6761\u3002\u201C\u8BCD\u6761 = \u8BD1\u6587\u201D\u5F3A\u5236\u4F7F\u7528\u8BE5\u8BD1\u6587\uFF1B\u4EC5\u5199\u8BCD\u6761\u5219\u4FDD\u6301\u539F\u6837\u3001\u4E0D\u88AB\u7FFB\u8BD1\u3002\u9002\u7528\u4E8E\u6240\u6709\u5F15\u64CE\uFF0C\u5305\u62EC Pro\u3002",
    optGlossaryPlaceholder: "Voxylio\nmachine learning = \u673A\u5668\u5B66\u4E60",
    optGlossaryCount: "\u751F\u6548\u8BCD\u6761\uFF1A$COUNT$",
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
    proBanner: "\u2726 \u4E0A\u4E0B\u6587\u7FFB\u8BD1\uFF08\u6D4B\u8BD5\u7248\uFF09\u4E0E\u795E\u7ECF\u8BED\u97F3",
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
    uiLangAuto: "\u6D4F\u89C8\u5668\u8BED\u8A00",
    proTransLabel: "Pro \u4E0A\u4E0B\u6587\u7FFB\u8BD1\uFF08\u6D4B\u8BD5\u7248\uFF09",
    translationPro: "\u7FFB\u8BD1\uFF1APro \u4E0A\u4E0B\u6587\uFF08\u6D4B\u8BD5\u7248\uFF09",
    proVoiceLabel: "Pro \u795E\u7ECF\u8BED\u97F3",
    launchCta: "\u5728\u6B64\u9875\u9762\u5F00\u59CB\u914D\u97F3",
    titleGoPro: "\u89E3\u9501 Pro \u8BA1\u5212",
    titlePreview: "\u8BD5\u542C\u8FD9\u4E2A\u58F0\u97F3",
    titleAutoPause: "\u5F53\u8BED\u97F3\u843D\u540E\u592A\u591A\u65F6\uFF0C\u6682\u505C\u89C6\u9891\u51E0\u79D2\uFF0C\u800C\u4E0D\u662F\u8DF3\u8FC7\u53E5\u5B50",
    titleLocalOnly: "\u4EC5\u4F7F\u7528 Chrome \u672C\u5730\u7FFB\u8BD1\uFF1A\u4EFB\u4F55\u6587\u672C\u90FD\u4E0D\u4F1A\u79BB\u5F00\u4F60\u7684\u8BBE\u5907\u3002\u4E0D\u53EF\u7528\u65F6\uFF0C\u914D\u97F3\u4F1A\u7B49\u5F85\u800C\u4E0D\u662F\u8054\u7F51\u3002",
    titleProTrans: "\u901A\u8FC7 Voxylio \u4E91\u7AEF\u7ED3\u5408\u4E0A\u4E0B\u6587\u7FFB\u8BD1\uFF08\u6708\u5EA6\u7528\u91CF\uFF09\u3002\u7528\u5B8C\u540E\u914D\u97F3\u7EE7\u7EED\u5728\u672C\u5730\u8FDB\u884C\u3002 \u6D4B\u8BD5\u7248\u529F\u80FD\uFF1A\u8D28\u91CF\u5728\u4E0D\u540C\u89C6\u9891\u95F4\u4ECD\u53EF\u80FD\u6709\u6240\u5DEE\u5F02\u3002",
    titleProVoice: "Aura-2 \u795E\u7ECF\u8BED\u97F3\uFF087 \u79CD\u8BED\u8A00\uFF1AEN ES DE FR NL IT JA\uFF09\u3002\u5176\u4ED6\u8BED\u8A00\u6216\u7528\u91CF\u8017\u5C3D\u65F6\uFF0C\u672C\u5730\u8BED\u97F3\u63A5\u624B\u3002",
    titleRetry: "\u91CD\u65B0\u68C0\u6D4B\u89C6\u9891\u3001\u5B57\u5E55\u548C\u7FFB\u8BD1",
    titleDiag: "\u590D\u5236\u6280\u672F\u8BCA\u65AD\uFF0C\u4FBF\u4E8E\u9644\u5728\u53CD\u9988\u4E2D",
    titleReset: "\u6062\u590D\u6240\u6709\u9ED8\u8BA4\u8BBE\u7F6E",
    titleOptions: "\u7FFB\u8BD1\u670D\u52A1\u5546\u3001API \u5BC6\u94A5\u3001\u5DF2\u505C\u7528\u7F51\u7AD9",
    titleAccount: "\u5728\u7F51\u7AD9\u4E0A\u7BA1\u7406\u4F60\u7684 Voxylio \u8D26\u53F7",
    optKeepTerms: "\u4FDD\u7559\u82F1\u6587\u6280\u672F\u672F\u8BED\uFF08commit\u3001build\u3001prompt\u2026\uFF09",
    quotaTitle: "\u672C\u6708 Pro \u7528\u91CF",
    quotaTrans: "AI \u7FFB\u8BD1\uFF08\u6D4B\u8BD5\u7248\uFF09",
    quotaVoice: "\u795E\u7ECF\u8BED\u97F3",
    quotaResets: "{date}\u91CD\u7F6E",
    statusProSite: "\u6B64\u7F51\u7AD9\u4E3A Pro \u4E13\u4EAB\u3002\u514D\u8D39\u7248\uFF1AYouTube\u3001Netflix\u3001Prime Video\u3001Disney+ \u548C Twitch\u3002",
    statusTrialNote: "\u5B8C\u6574\u8BD5\u7528\uFF1A\u6B64\u7F51\u7AD9\u8FD8\u53EF\u4F7F\u7528 $COUNT$ \u5929",
    proAudioLabel: "\u65E0\u5B57\u5E55\u89C6\u9891 Pro \u914D\u97F3\uFF08\u6D4B\u8BD5\u7248\uFF09",
    titleProAudio: "\u89C6\u9891\u5B8C\u5168\u6CA1\u6709\u5B57\u5E55\uFF1F\u5176\u97F3\u9891\u5C06\u88AB\u5B9E\u65F6\u8F6C\u5199\uFF08\u6BCF\u6708 60 \u5206\u949F\uFF09\uFF0C\u7136\u540E\u6B63\u5E38\u914D\u97F3\u3002\u65E0\u672C\u5730\u56DE\u9000\uFF1A\u5206\u949F\u7528\u5B8C\u540E\uFF0C\u8BE5\u529F\u80FD\u7B49\u5F85\u4E0B\u4E00\u5468\u671F\u3002 \u6D4B\u8BD5\u7248\u529F\u80FD\uFF1A\u8F6C\u5199\u8D28\u91CF\u53EF\u80FD\u6709\u6240\u5DEE\u5F02\u3002",
    quotaAudio: "\u9AD8\u7EA7\u97F3\u9891\uFF08\u6D4B\u8BD5\u7248\uFF09",
    statusAudioLive: "\u65E0\u5B57\u5E55\uFF1A\u6B63\u5728\u5B9E\u65F6\u8F6C\u5199\u97F3\u9891\uFF08\u6D4B\u8BD5\u7248\uFF09 \u2014 \u914D\u97F3\u5C06\u5728\u51E0\u79D2\u540E\u5F00\u59CB\u3002",
    statusAudioQuota: "\u672C\u6708\u9AD8\u7EA7\u97F3\u9891\u5206\u949F\u5DF2\u7528\u5B8C \u2014 \u65E0\u5B57\u5E55\u914D\u97F3\uFF08\u6D4B\u8BD5\u7248\uFF09\u5C06\u5728\u4E0B\u4E00\u5468\u671F\u6062\u590D\u3002",
    statusAudioUnavailable: "\u65E0\u6CD5\u6355\u83B7\u6B64\u64AD\u653E\u5668\u7684\u97F3\u9891\uFF08\u7AD9\u70B9\u4FDD\u62A4\uFF09\u2014 \u65E0\u5B57\u5E55\u914D\u97F3\uFF08\u6D4B\u8BD5\u7248\uFF09\u5728\u6B64\u65E0\u6CD5\u5DE5\u4F5C\u3002",
    btnCheckUpdate: "\u68C0\u67E5\u66F4\u65B0",
    updChecking: "\u6B63\u5728\u68C0\u67E5\u2026",
    updFound: "\u53D1\u73B0\u66F4\u65B0 \u2014 \u6B63\u5728\u91CD\u542F\u2026",
    updNone: "\u5DF2\u662F\u6700\u65B0 \u2713",
    updThrottled: "\u8BF7\u51E0\u5206\u949F\u540E\u518D\u8BD5"
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
    accountNoteFree: "\u89E3\u9396\u4E0A\u4E0B\u6587\u7FFB\u8B6F\uFF08\u6E2C\u8A66\u7248\uFF09\u548C\u81EA\u7136\u7684\u795E\u7D93\u8A9E\u97F3\u3002",
    accountNotePro: "\u611F\u8B1D\u4F60\u652F\u6301 Voxylio\u3002",
    accountNoteProCanceled: "\u8A02\u95B1\u6709\u6548\u81F3\u672C\u671F\u7D50\u675F\u3002",
    statusSearching: "\u6B63\u5728\u5C0B\u627E\u5F71\u7247\u2026",
    statusNoVideo: "\u672A\u5728\u6B64\u9801\u9762\u5075\u6E2C\u5230\u5F71\u7247\u3002",
    statusVideosDetected: "\u5075\u6E2C\u5230 $COUNT$ \u90E8\u5F71\u7247",
    statusLinesReady: "$COUNT$ \u53E5\u53F0\u8A5E\u5DF2\u5C31\u7DD2",
    statusSpeaking: "\u8A9E\u97F3\u64AD\u653E\u4E2D",
    statusSubsLoading: "\u5075\u6E2C\u5230\u5B57\u5E55\u8ECC \u2014 \u64AD\u653E\u5E7E\u79D2\u5373\u53EF\u8F09\u5165\u53F0\u8A5E\u3002",
    statusNoSubs: "\u672A\u5075\u6E2C\u5230\u5B57\u5E55 \u2014 \u8ACB\u78BA\u8A8D\u64AD\u653E\u5668\u5DF2\u958B\u555F\u5B57\u5E55\uFF08CC\uFF09\u3002\u82E5\u64AD\u653E\u5668\u672A\u63D0\u4F9B\u5B57\u5E55\uFF0C\u5247\u7121\u6CD5\u70BA\u6B64\u5F71\u7247\u914D\u97F3\u3002",
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
    optGlossary: "\u8853\u8A9E\u8868",
    optGlossaryHint: "\u6BCF\u884C\u4E00\u500B\u8A5E\u689D\u3002\u300C\u8A5E\u689D = \u8B6F\u6587\u300D\u5F37\u5236\u4F7F\u7528\u8A72\u8B6F\u6587\uFF1B\u50C5\u5BEB\u8A5E\u689D\u5247\u4FDD\u6301\u539F\u6A23\u3001\u4E0D\u88AB\u7FFB\u8B6F\u3002\u9069\u7528\u65BC\u6240\u6709\u5F15\u64CE\uFF0C\u5305\u62EC Pro\u3002",
    optGlossaryPlaceholder: "Voxylio\nmachine learning = \u6A5F\u5668\u5B78\u7FD2",
    optGlossaryCount: "\u751F\u6548\u8A5E\u689D\uFF1A$COUNT$",
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
    proBanner: "\u2726 \u4E0A\u4E0B\u6587\u7FFB\u8B6F\uFF08\u6E2C\u8A66\u7248\uFF09\u8207\u795E\u7D93\u8A9E\u97F3",
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
    uiLangAuto: "\u700F\u89BD\u5668\u8A9E\u8A00",
    proTransLabel: "Pro \u4E0A\u4E0B\u6587\u7FFB\u8B6F\uFF08\u6E2C\u8A66\u7248\uFF09",
    translationPro: "\u7FFB\u8B6F\uFF1APro \u4E0A\u4E0B\u6587\uFF08\u6E2C\u8A66\u7248\uFF09",
    proVoiceLabel: "Pro \u795E\u7D93\u8A9E\u97F3",
    launchCta: "\u5728\u6B64\u9801\u9762\u958B\u59CB\u914D\u97F3",
    titleGoPro: "\u89E3\u9396 Pro \u65B9\u6848",
    titlePreview: "\u8A66\u807D\u9019\u500B\u8072\u97F3",
    titleAutoPause: "\u7576\u8A9E\u97F3\u843D\u5F8C\u592A\u591A\u6642\uFF0C\u66AB\u505C\u5F71\u7247\u5E7E\u79D2\uFF0C\u800C\u4E0D\u662F\u8DF3\u904E\u53E5\u5B50",
    titleLocalOnly: "\u50C5\u4F7F\u7528 Chrome \u672C\u6A5F\u7FFB\u8B6F\uFF1A\u4EFB\u4F55\u6587\u5B57\u90FD\u4E0D\u6703\u96E2\u958B\u4F60\u7684\u88DD\u7F6E\u3002\u7121\u6CD5\u4F7F\u7528\u6642\uFF0C\u914D\u97F3\u6703\u7B49\u5F85\u800C\u4E0D\u662F\u9023\u7DDA\u3002",
    titleProTrans: "\u900F\u904E Voxylio \u96F2\u7AEF\u7D50\u5408\u4E0A\u4E0B\u6587\u7FFB\u8B6F\uFF08\u6BCF\u6708\u7528\u91CF\uFF09\u3002\u7528\u5B8C\u5F8C\u914D\u97F3\u7E7C\u7E8C\u5728\u672C\u6A5F\u9032\u884C\u3002 \u6E2C\u8A66\u7248\u529F\u80FD\uFF1A\u54C1\u8CEA\u5728\u4E0D\u540C\u5F71\u7247\u9593\u4ECD\u53EF\u80FD\u6709\u6240\u5DEE\u7570\u3002",
    titleProVoice: "Aura-2 \u795E\u7D93\u8A9E\u97F3\uFF087 \u7A2E\u8A9E\u8A00\uFF1AEN ES DE FR NL IT JA\uFF09\u3002\u5176\u4ED6\u8A9E\u8A00\u6216\u7528\u91CF\u8017\u76E1\u6642\uFF0C\u672C\u6A5F\u8A9E\u97F3\u63A5\u624B\u3002",
    titleRetry: "\u91CD\u65B0\u5075\u6E2C\u5F71\u7247\u3001\u5B57\u5E55\u8207\u7FFB\u8B6F",
    titleDiag: "\u8907\u88FD\u6280\u8853\u8A3A\u65B7\uFF0C\u65B9\u4FBF\u9644\u5728\u56DE\u5831\u4E2D",
    titleReset: "\u6062\u5FA9\u6240\u6709\u9810\u8A2D\u8A2D\u5B9A",
    titleOptions: "\u7FFB\u8B6F\u670D\u52D9\u5546\u3001API \u91D1\u9470\u3001\u5DF2\u505C\u7528\u7DB2\u7AD9",
    titleAccount: "\u5728\u7DB2\u7AD9\u4E0A\u7BA1\u7406\u4F60\u7684 Voxylio \u5E33\u865F",
    optKeepTerms: "\u4FDD\u7559\u82F1\u6587\u6280\u8853\u8853\u8A9E\uFF08commit\u3001build\u3001prompt\u2026\uFF09",
    quotaTitle: "\u672C\u6708 Pro \u7528\u91CF",
    quotaTrans: "AI \u7FFB\u8B6F\uFF08\u6E2C\u8A66\u7248\uFF09",
    quotaVoice: "\u795E\u7D93\u8A9E\u97F3",
    quotaResets: "{date}\u91CD\u7F6E",
    statusProSite: "\u6B64\u7DB2\u7AD9\u70BA Pro \u5C08\u5C6C\u3002\u514D\u8CBB\u7248\uFF1AYouTube\u3001Netflix\u3001Prime Video\u3001Disney+ \u548C Twitch\u3002",
    statusTrialNote: "\u5B8C\u6574\u8A66\u7528\uFF1A\u6B64\u7DB2\u7AD9\u9084\u53EF\u4F7F\u7528 $COUNT$ \u5929",
    proAudioLabel: "\u7121\u5B57\u5E55\u5F71\u7247 Pro \u914D\u97F3\uFF08\u6E2C\u8A66\u7248\uFF09",
    titleProAudio: "\u5F71\u7247\u5B8C\u5168\u6C92\u6709\u5B57\u5E55\uFF1F\u5176\u97F3\u8A0A\u5C07\u88AB\u5373\u6642\u8F49\u5BEB\uFF08\u6BCF\u6708 60 \u5206\u9418\uFF09\uFF0C\u7136\u5F8C\u6B63\u5E38\u914D\u97F3\u3002\u7121\u672C\u6A5F\u56DE\u9000\uFF1A\u5206\u9418\u7528\u5B8C\u5F8C\uFF0C\u8A72\u529F\u80FD\u7B49\u5F85\u4E0B\u4E00\u9031\u671F\u3002 \u6E2C\u8A66\u7248\u529F\u80FD\uFF1A\u8F49\u5BEB\u54C1\u8CEA\u53EF\u80FD\u6709\u6240\u5DEE\u7570\u3002",
    quotaAudio: "\u9032\u968E\u97F3\u8A0A\uFF08\u6E2C\u8A66\u7248\uFF09",
    statusAudioLive: "\u7121\u5B57\u5E55\uFF1A\u6B63\u5728\u5373\u6642\u8F49\u5BEB\u97F3\u8A0A\uFF08\u6E2C\u8A66\u7248\uFF09 \u2014 \u914D\u97F3\u5C07\u5728\u5E7E\u79D2\u5F8C\u958B\u59CB\u3002",
    statusAudioQuota: "\u672C\u6708\u9032\u968E\u97F3\u8A0A\u5206\u9418\u5DF2\u7528\u5B8C \u2014 \u7121\u5B57\u5E55\u914D\u97F3\uFF08\u6E2C\u8A66\u7248\uFF09\u5C07\u5728\u4E0B\u4E00\u9031\u671F\u6062\u5FA9\u3002",
    statusAudioUnavailable: "\u7121\u6CD5\u64F7\u53D6\u6B64\u64AD\u653E\u5668\u7684\u97F3\u8A0A\uFF08\u7DB2\u7AD9\u4FDD\u8B77\uFF09\u2014 \u7121\u5B57\u5E55\u914D\u97F3\uFF08\u6E2C\u8A66\u7248\uFF09\u5728\u6B64\u7121\u6CD5\u904B\u4F5C\u3002",
    btnCheckUpdate: "\u6AA2\u67E5\u66F4\u65B0",
    updChecking: "\u6B63\u5728\u6AA2\u67E5\u2026",
    updFound: "\u767C\u73FE\u66F4\u65B0 \u2014 \u6B63\u5728\u91CD\u65B0\u555F\u52D5\u2026",
    updNone: "\u5DF2\u662F\u6700\u65B0 \u2713",
    updThrottled: "\u8ACB\u5E7E\u5206\u9418\u5F8C\u518D\u8A66"
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
    accountNoteFree: "Desbloqueie a tradu\xE7\xE3o contextual (beta) e as vozes neurais naturais.",
    accountNotePro: "Obrigado por apoiar o Voxylio.",
    accountNoteProCanceled: "Assinatura ativa at\xE9 o fim do per\xEDodo.",
    statusSearching: "Procurando um v\xEDdeo\u2026",
    statusNoVideo: "Nenhum v\xEDdeo detectado nesta p\xE1gina.",
    statusVideosDetected: "$COUNT$ v\xEDdeo(s) detectado(s)",
    statusLinesReady: "$COUNT$ fala(s) pronta(s)",
    statusSpeaking: "voz ativa",
    statusSubsLoading: "Trilha de legendas detectada \u2014 reproduza alguns segundos para carregar as falas.",
    statusNoSubs: "Nenhuma legenda detectada \u2014 confira se as legendas (CC) est\xE3o ativadas no player. Se ele n\xE3o oferecer nenhuma, a dublagem n\xE3o \xE9 poss\xEDvel neste v\xEDdeo.",
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
    optGlossary: "Gloss\xE1rio",
    optGlossaryHint: "Um termo por linha. \u201Ctermo = tradu\xE7\xE3o\u201D imp\xF5e essa tradu\xE7\xE3o; um termo sozinho \xE9 mantido como est\xE1, nunca traduzido. Vale com todos os motores, incluindo o Pro.",
    optGlossaryPlaceholder: "Voxylio\nmachine learning = aprendizado de m\xE1quina",
    optGlossaryCount: "$COUNT$ termo(s) ativo(s)",
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
    proBanner: "\u2726 Tradu\xE7\xE3o contextual (beta) e vozes neurais",
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
    uiLangAuto: "Idioma do navegador",
    proTransLabel: "Tradu\xE7\xE3o contextual Pro (beta)",
    translationPro: "Tradu\xE7\xE3o: Pro contextual (beta)",
    proVoiceLabel: "Voz neural Pro",
    launchCta: "Iniciar a dublagem nesta p\xE1gina",
    titleGoPro: "Desbloquear o plano Pro",
    titlePreview: "Ouvir uma pr\xE9via da voz",
    titleAutoPause: "Pausa o v\xEDdeo por alguns segundos quando a voz fica muito atrasada, em vez de pular frases",
    titleLocalOnly: "Usa apenas a tradu\xE7\xE3o local do Chrome: nenhum texto sai do seu dispositivo. Se estiver indispon\xEDvel, a dublagem espera em vez de ir para a internet.",
    titleProTrans: "Traduz com o contexto das frases vizinhas pela nuvem Voxylio (volume mensal). Se acabar, a dublagem continua no local. Recurso em beta: a qualidade ainda pode variar de um v\xEDdeo para outro.",
    titleProVoice: "Voz neural Aura-2 (7 idiomas: EN ES DE FR NL IT JA). Para outros idiomas, ou com o volume esgotado, a voz local assume.",
    titleRetry: "Reexecuta a detec\xE7\xE3o do v\xEDdeo, das legendas e da tradu\xE7\xE3o",
    titleDiag: "Copia um diagn\xF3stico t\xE9cnico para anexar a um relat\xF3rio",
    titleReset: "Restaura todas as configura\xE7\xF5es padr\xE3o",
    titleOptions: "Provedores de tradu\xE7\xE3o, chaves de API, sites desativados",
    titleAccount: "Gerenciar sua conta Voxylio no site",
    optKeepTerms: "Manter termos t\xE9cnicos em ingl\xEAs (commit, build, prompt\u2026)",
    quotaTitle: "Uso Pro do m\xEAs",
    quotaTrans: "Tradu\xE7\xE3o IA (beta)",
    quotaVoice: "Voz neural",
    quotaResets: "Renovada em {date}",
    statusProSite: "Este site \xE9 exclusivo do Pro. Plano gratuito: YouTube, Netflix, Prime Video, Disney+ e Twitch.",
    statusTrialNote: "Teste completo: este site continua liberado por mais $COUNT$ dia(s)",
    proAudioLabel: "Dublagem sem legendas Pro (beta)",
    titleProAudio: "V\xEDdeo sem nenhuma legenda? O \xE1udio \xE9 transcrito ao vivo (60 min/m\xEAs) e depois dublado normalmente. Sem fallback local: minutos esgotados, o recurso espera o pr\xF3ximo ciclo. Recurso em beta: a qualidade da transcri\xE7\xE3o pode variar.",
    quotaAudio: "\xC1udio Premium (beta)",
    statusAudioLive: "Sem legendas: transcrevendo o \xE1udio ao vivo (beta) \u2014 a dublagem chega em alguns segundos.",
    statusAudioQuota: "Minutos de \xC1udio Premium esgotados neste m\xEAs \u2014 a dublagem sem legendas (beta) volta no pr\xF3ximo ciclo.",
    statusAudioUnavailable: "N\xE3o \xE9 poss\xEDvel capturar o \xE1udio deste player (prote\xE7\xE3o do site) \u2014 a dublagem sem legendas (beta) n\xE3o funciona aqui.",
    btnCheckUpdate: "Buscar atualiza\xE7\xF5es",
    updChecking: "Verificando\u2026",
    updFound: "Atualiza\xE7\xE3o encontrada \u2014 reiniciando\u2026",
    updNone: "Atualizado \u2713",
    updThrottled: "Tente de novo em alguns minutos"
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

  // src/content.js
  (() => {
    if (window.__voxylioInjected) return;
    window.__voxylioInjected = true;
    const DEFAULTS2 = { ...DEFAULTS };
    const settings = { ...DEFAULTS2 };
    let glossaryMatcher = null;
    function rebuildGlossary() {
      glossaryMatcher = compileGlossary(settings.glossary);
    }
    const PERSIST_MAX = 600;
    const persistCache = /* @__PURE__ */ new Map();
    let persistTimer = null;
    function pKey(source, target, text) {
      const mode = settings.proTranslation ? "p" : "s";
      return mode + "|" + source + ">" + target + "|" + textHash(text) + ":" + text.length;
    }
    function loadPersistCache() {
      try {
        storage.local.get({ vxTransCache: null }, (r) => {
          const rows = r && Array.isArray(r.vxTransCache) ? r.vxTransCache : [];
          for (const row of rows) {
            if (row && typeof row[0] === "string" && typeof row[1] === "string")
              persistCache.set(row[0], { v: row[1], at: Number(row[2]) || 0 });
          }
        });
      } catch (e) {
      }
    }
    function persistPut(key, text) {
      persistCache.set(key, { v: text, at: Date.now() });
      if (persistCache.size > PERSIST_MAX) {
        const rows = [...persistCache.entries()].sort((a, b) => b[1].at - a[1].at);
        persistCache.clear();
        for (const [k, v] of rows.slice(0, Math.floor(PERSIST_MAX * 0.75)))
          persistCache.set(k, v);
      }
      if (persistTimer) return;
      persistTimer = setTimeout(() => {
        persistTimer = null;
        try {
          safeLocalSet({
            vxTransCache: [...persistCache.entries()].map(([k, e]) => [k, e.v, e.at])
          });
        } catch (e) {
        }
      }, 4e3);
    }
    function siteDisabled() {
      const host = (location.hostname || "").replace(/^www\./, "").toLowerCase();
      return Array.isArray(settings.disabledSites) && settings.disabledSites.includes(host);
    }
    let accountLinked = false;
    let accountPlan = "free";
    let accountTrialEndsAt = null;
    function sitePlanAllowed() {
      return planGate({
        plan: accountPlan,
        trialEndsAt: accountTrialEndsAt,
        now: Date.now(),
        hostname: location.hostname
      }).allowed;
    }
    function recheckAccount() {
      try {
        const p = runtime.sendMessage({ type: "entitlements" });
        if (p && typeof p.then === "function") {
          p.then((ent) => {
            const linked = !!(ent && ent.linked);
            const plan = ent && ent.plan || "free";
            const trial = ent && ent.trialEndsAt || null;
            if (linked !== accountLinked || plan !== accountPlan || trial !== accountTrialEndsAt) {
              accountLinked = linked;
              accountPlan = plan;
              accountTrialEndsAt = trial;
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
    const cloudAudioCache = new BoundedMap(80);
    let cloudVoiceDownUntil = 0;
    function cloudVoiceActive() {
      return !!settings.proVoice && accountLinked && AURA2_LANGS.has(settings.targetLang) && Date.now() >= cloudVoiceDownUntil;
    }
    function getCloudAudio(text, lang) {
      const voiceLang = lang || settings.targetLang;
      const key = voiceLang + "::" + text;
      if (cloudAudioCache.has(key)) return cloudAudioCache.get(key);
      const p = (async () => {
        try {
          const resp = await runtime.sendMessage({
            type: "speak-pro",
            text,
            lang: voiceLang
          });
          if (resp && resp.ok && resp.audio)
            return "data:" + (resp.mime || "audio/mpeg") + ";base64," + resp.audio;
        } catch (e) {
        }
        return null;
      })();
      cloudAudioCache.set(key, p);
      p.then((v) => {
        if (!v) cloudAudioCache.delete(key);
      });
      return p;
    }
    const domSite = domCaptionSiteFor(location.hostname);
    let domCapContainer = null;
    let domCapObserver = null;
    let domLastText = "";
    function domCaptionText() {
      if (!domCapContainer) return "";
      const parts = [];
      for (const el of domCapContainer.querySelectorAll(domSite.segment)) {
        const s = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (s) parts.push(s);
      }
      if (parts.length === 0) {
        const s = (domCapContainer.textContent || "").replace(/\s+/g, " ").trim();
        if (s) parts.push(s);
      }
      return parts.join(" ").trim();
    }
    function onDomCaptionMutation() {
      const video = primaryVideo;
      const ctl = video && controllers.get(video);
      if (!ctl) return;
      if (ctl.ytStatic === "loaded") return;
      const text = domCaptionText();
      if (!text) {
        if (domLastText) ctl.closeDomCue(video.currentTime);
        domLastText = "";
        return;
      }
      if (text === domLastText) return;
      domLastText = text;
      ctl.addDomCue(video.currentTime, text);
    }
    const CC_LABEL = /\b(cc|sous-?titres?|subtitles?|captions?|untertitel|sottotitoli|leyendas?|legendas?|subt[ií]tulos?)\b|字幕|자막/i;
    let ccClickedFor = "";
    function ccToggleCandidate() {
      if (domSite && domSite.cc) {
        const btn = document.querySelector(domSite.cc);
        if (btn && btn.getAttribute("aria-pressed") !== "true" && btn.getAttribute("aria-disabled") !== "true")
          return btn;
        return null;
      }
      for (const btn of document.querySelectorAll('button[aria-pressed="false"]')) {
        if (btn.getAttribute("aria-haspopup") || btn.hasAttribute("aria-expanded"))
          continue;
        if (btn.getAttribute("aria-disabled") === "true" || btn.disabled) continue;
        const label = (btn.getAttribute("aria-label") || btn.title || btn.textContent || "").trim();
        if (label && label.length <= 60 && CC_LABEL.test(label)) return btn;
      }
      return null;
    }
    function maybeEnableSiteCaptions() {
      if (!settings.enabled || !accountLinked || siteDisabled()) return;
      if (!sitePlanAllowed()) return;
      if (domLastText) return;
      const video = primaryVideo;
      const ctl = video && controllers.get(video);
      if (!ctl || ctl.cues.length > 0) return;
      if (domSite && domSite.id === "youtube" && ctl.active && !ctl.staticLoaded)
        return;
      try {
        if (Array.from(video.textTracks || []).some(
          (t) => t.kind === "subtitles" || t.kind === "captions"
        ))
          return;
      } catch (e) {
      }
      if (ccClickedFor === location.href) return;
      const btn = ccToggleCandidate();
      if (!btn) return;
      ccClickedFor = location.href;
      try {
        btn.click();
      } catch (e) {
      }
    }
    function syncDomCaptions() {
      if (!domSite) return;
      if (domCapContainer && !domCapContainer.isConnected) {
        if (domCapObserver) domCapObserver.disconnect();
        domCapObserver = null;
        domCapContainer = null;
        domLastText = "";
      }
      if (domCapContainer) return;
      const el = document.querySelector(domSite.container);
      if (!el) return;
      domCapContainer = el;
      domCapObserver = new MutationObserver(onDomCaptionMutation);
      domCapObserver.observe(el, {
        childList: true,
        subtree: true,
        characterData: true
      });
      onDomCaptionMutation();
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
      Object.assign(settings, DEFAULTS2, validateSettings(s));
      rebuildGlossary();
      loadPersistCache();
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
      const patch = {};
      for (const [k, v] of Object.entries(changes)) {
        if (!(k in DEFAULTS2)) continue;
        patch[k] = v.newValue === void 0 ? DEFAULTS2[k] : v.newValue;
      }
      Object.assign(settings, validateSettings(patch));
      if (changes.targetLang || changes.sourceLang) {
        for (const c of controllers.values()) c.flushSpeech();
      }
      if (changes.glossary) rebuildGlossary();
      if (changes.provider || changes.cloudFallback || changes.proTranslation || changes.keepTerms || changes.glossary)
        rebuildChain();
      if (changes.duck || changes.voiceVolume) {
        for (const c of controllers.values()) {
          if (typeof c.onAudioSettings === "function") c.onAudioSettings();
        }
      }
      if (changes.uiLang) {
        uiT = null;
        destroyOverlay();
      }
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
    let proBatchBroken = false;
    let providerDetectedSource = "";
    let chainEpoch = 0;
    function cacheKey(source, target, text) {
      return chainEpoch + "|" + source + "->" + target + "::" + text;
    }
    const builtinProvider = createBuiltinProvider({
      onBroken: (e, pairKey) => {
        if (!pairKey || pairKey.endsWith("->" + settings.targetLang))
          builtinBroken = true;
      }
    });
    const providerKeys = { deepl: "", googlev2: "" };
    const proProvider = createProProvider();
    const warmedPairs = /* @__PURE__ */ new Set();
    function warmBuiltin(source, target) {
      if (!source || source === "auto" || !target || source === target) return;
      const k = source + "->" + target;
      if (warmedPairs.has(k)) return;
      warmedPairs.add(k);
      try {
        Promise.resolve(builtinProvider.ready(source, target)).catch(() => {
        });
      } catch (e) {
      }
    }
    const chainPairState = /* @__PURE__ */ new Map();
    let chain = createTranslatorChain([builtinProvider]);
    function rebuildChain() {
      chainEpoch++;
      const list = [];
      if (settings.proTranslation) list.push(proProvider);
      list.push(builtinProvider);
      if (settings.cloudFallback) {
        if (settings.provider === "deepl" && providerKeys.deepl)
          list.push(createDeeplProvider(() => providerKeys.deepl));
        if (settings.provider === "googlev2" && providerKeys.googlev2)
          list.push(createGoogleV2Provider(() => providerKeys.googlev2));
        list.push(createGtxProvider());
      }
      chain = createTranslatorChain(list, { pairState: chainPairState });
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
    async function translateOnce(text, source, target, opts, fromPrefetch) {
      try {
        const res = await chain.translate(text, source, target, opts);
        translationMode = res.kind === "pro" ? "pro" : res.kind === "local" ? "local" : "cloud";
        lastTranslateError = "";
        if (res.detected && !providerDetectedSource)
          providerDetectedSource = res.detected.toLowerCase().split("-")[0];
        return res.text;
      } catch (e) {
        if (!fromPrefetch) {
          translationMode = "none";
          lastTranslateError = settings.cloudFallback ? e && e.message || "translate failed" : "local-only";
        }
        throw e;
      }
    }
    function translate(text, source, context, meta) {
      const target = settings.targetLang;
      const key = cacheKey(source, target, text);
      if (cache.has(key)) return cache.get(key);
      const pk = pKey(source, target, text);
      const persisted = persistCache.get(pk);
      if (persisted) {
        persisted.at = Date.now();
        const hit = Promise.resolve(persisted.v);
        cache.set(key, hit);
        return hit;
      }
      const fromPrefetch = !!(meta && meta.prefetch);
      const opts = {};
      if (context) opts.context = context;
      if (meta && meta.secs > 0) opts.secs = meta.secs;
      const p = (async () => {
        pendingCount++;
        try {
          const gl = glossaryMatcher;
          const useBuiltinTerms = !!settings.keepTerms;
          if (gl || useBuiltinTerms) {
            const { protectedText, found } = protectTerms(text, {
              builtin: useBuiltinTerms,
              glossary: gl
            });
            if (found.length > 0) {
              const raw = await translateOnce(protectedText, source, target, opts, fromPrefetch);
              const { restored, ok } = restoreTerms(raw, found);
              const out2 = ok ? restored : restored.replace(/[⟦⟧]/g, " ").replace(/\s+/g, " ").trim();
              if (out2) {
                persistPut(pk, out2);
                return out2;
              }
            }
          }
          const out = await translateOnce(text, source, target, opts, fromPrefetch);
          persistPut(pk, out);
          return out;
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
      try {
        voices = speechSynthesis.getVoices() || [];
      } catch (e) {
        voices = [];
      }
    }
    if (typeof speechSynthesis !== "undefined") {
      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    let cachedVoice = null;
    let cachedVoiceKey = "";
    let localWps = 0;
    function pickVoice2() {
      if (!voices.length) loadVoices();
      const wanted = settings.voiceByLang && settings.voiceByLang[settings.targetLang] || settings.voiceName;
      const k = settings.targetLang + "|" + wanted + "|" + voices.length;
      if (k === cachedVoiceKey) return cachedVoice;
      cachedVoiceKey = k;
      const next = pickVoice(voices, {
        targetLang: settings.targetLang,
        voiceName: wanted
      });
      if (next !== cachedVoice) localWps = 0;
      cachedVoice = next;
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
    function resetPageFeed() {
      domLastText = "";
      journalSession = null;
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
        savedVolume: null,
        // pre-duck volume (null = not ducked/unknown)
        lastWrittenVolume: null,
        // last volume WE wrote (user-change detector)
        userVolumeOverride: false,
        // user took over the mix: hands off
        ducked: false,
        duckHoldUntil: 0,
        rampTimer: null,
        lastRate: 0,
        // previous line's final utterance rate (tempo smoothing)
        lastPumpAt: 0,
        // speechSynthesis keepalive clock
        inTick: false,
        voicesGraceUntil: 0,
        active: false,
        // dubbing actually running on this video
        pollTimer: null,
        lastTime: -1,
        mediaKey: ""
        // URL+src identity of the media being dubbed
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
          if (merged.grew || merged.end !== last.end) ctl.lastCueCount = -1;
          if (merged.grew) last.text = merged.text;
          last.end = merged.end;
          ctl.cueKeys.add(key);
          return;
        }
        ctl.cueKeys.add(key);
        const cue = { start: start2, end, text, key };
        let lo = 0;
        let hi = ctl.cues.length;
        while (lo < hi) {
          const mid = lo + hi >> 1;
          if (ctl.cues[mid].start <= start2) lo = mid + 1;
          else hi = mid;
        }
        if (lo === ctl.cues.length) ctl.cues.push(cue);
        else ctl.cues.splice(lo, 0, cue);
      }
      ctl.addDomCue = (start2, text) => {
        const clean = stripTags(text);
        if (!clean) return;
        if (ctl.lastDomCue && ctl.lastDomCue.end > start2) {
          ctl.lastDomCue.end = Math.max(ctl.lastDomCue.start + 0.8, start2);
        }
        addCue(start2, domCueEnd(start2, clean), clean);
        ctl.lastDomCue = ctl.cues[ctl.cues.length - 1] || null;
        ctl.domCues = (ctl.domCues || 0) + 1;
      };
      ctl.closeDomCue = (at) => {
        if (ctl.lastDomCue && ctl.lastDomCue.end > at) {
          ctl.lastDomCue.end = Math.max(ctl.lastDomCue.start + 0.8, at);
        }
      };
      function groupContext(groupId) {
        const idx = ctl.groups.findIndex((g) => g.id === groupId);
        if (idx < 0) return void 0;
        return {
          // 4 matches what the backend accepts (clampList(before, 4)).
          before: ctl.groups.slice(Math.max(0, idx - 4), idx).map((g) => g.text),
          // Drafts are still growing on live feeds: half a sentence fed as
          // "upcoming context" misleads more than it helps.
          after: ctl.groups.slice(idx + 1, idx + 3).filter((g) => g.final).map((g) => g.text)
        };
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
        return stableFor >= (endsSentence(g.text) ? 300 : 500);
      }
      function harvestTextTracks() {
        const tracks = Array.from(video.textTracks || []).filter(
          (t) => t.kind === "subtitles" || t.kind === "captions"
        );
        const wanted = settings.sourceLang;
        let track = null;
        if (ctl.trackListened && tracks.includes(ctl.trackListened)) {
          track = ctl.trackListened;
        } else {
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
          track = tracks[0];
          if (track && ctl.trackListened && ctl.trackListened !== track) {
            ctl.cues = [];
            ctl.cueKeys.clear();
            ctl.groups = [];
            ctl.lastCueCount = -1;
            ctl.groupMeta.clear();
            ctl.spokenIds.clear();
            ctl.scheduledIds.clear();
            ctl.inFlight.clear();
            ctl.generation += 1;
          }
        }
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
          ctl.trackRetries = 0;
        } catch (e) {
          ctl.trackRetries = (ctl.trackRetries || 0) + 1;
          ctl.staticLoaded = ctl.trackRetries >= 4;
          ctl.trackRetryAt = Date.now() + 6e3;
        }
      }
      function adoptStaticCues(cues, langBase) {
        const t = video.currentTime;
        const hadActivity = ctl.spokenIds.size > 0 || !!ctl.currentUtterance || ctl.queue.length > 0;
        ctl.generation += 1;
        ctl.queue.length = 0;
        ctl.cues = [];
        ctl.cueKeys.clear();
        ctl.groups = [];
        ctl.lastCueCount = -1;
        ctl.groupMeta.clear();
        ctl.spokenIds.clear();
        ctl.scheduledIds.clear();
        ctl.inFlight.clear();
        ctl.lastDomCue = null;
        for (const c of cues) addCue(c.start, c.end, c.text);
        rebuildGroups();
        for (const g of ctl.groups) {
          if (g.end <= t + 0.2 || hadActivity && g.start <= t && t < g.end) {
            ctl.spokenIds.add(g.id);
          }
        }
        ctl.staticLoaded = true;
        ctl.ytStatic = "loaded";
        if (langBase) ctl.trackLang = langBase;
      }
      async function harvestYouTubeStatic() {
        if (!domSite || domSite.id !== "youtube") return;
        if (ctl.staticLoaded || ctl.ytFetching) return;
        if (ctl.trackRetryAt && Date.now() < ctl.trackRetryAt) return;
        const mk = ctl.mediaKey;
        ctl.ytFetching = true;
        try {
          const pageRes = await fetch(location.href, { credentials: "same-origin" });
          if (!pageRes.ok) throw new Error("page HTTP " + pageRes.status);
          const tracks = extractCaptionTracks(await pageRes.text());
          if (ctl.mediaKey !== mk) return;
          if (!tracks.length) {
            ctl.staticLoaded = true;
            ctl.ytStatic = "none";
            return;
          }
          const wanted = settings.sourceLang !== "auto" ? settings.sourceLang : null;
          const track = pickCaptionTrack(tracks, wanted, settings.targetLang);
          const res = await fetch(timedtextUrl(track.baseUrl), {
            credentials: "same-origin"
          });
          if (!res.ok) throw new Error("timedtext HTTP " + res.status);
          const body = await res.text();
          const cues = body ? parseJson3(JSON.parse(body)) : [];
          if (!cues.length) throw new Error("empty timedtext");
          if (ctl.mediaKey !== mk || !isAlive()) return;
          adoptStaticCues(
            cues,
            String(track.languageCode || "").toLowerCase().split("-")[0]
          );
        } catch (e) {
          if (ctl.mediaKey !== mk) return;
          ctl.trackRetries = (ctl.trackRetries || 0) + 1;
          if (ctl.trackRetries >= 2) {
            ctl.staticLoaded = true;
            ctl.ytStatic = "failed";
          } else {
            ctl.trackRetryAt = Date.now() + 4e3;
          }
        } finally {
          ctl.ytFetching = false;
        }
      }
      ctl.ytHarvest = harvestYouTubeStatic;
      async function harvestUdemyStatic() {
        if (!domSite || domSite.id !== "udemy") return;
        if (ctl.staticLoaded || ctl.ytFetching) return;
        if (ctl.trackRetryAt && Date.now() < ctl.trackRetryAt) return;
        const mk = ctl.mediaKey;
        ctl.ytFetching = true;
        try {
          const lectureId = udemyLectureId(location.href);
          const loader = document.querySelector(".ud-app-loader");
          const courseId = udemyCourseId(
            loader && loader.getAttribute("data-module-args")
          );
          if (!lectureId || !courseId) throw new Error("udemy ids not found");
          const res = await fetch(udemyCaptionsUrl(courseId, lectureId), {
            credentials: "same-origin",
            headers: { Accept: "application/json" }
          });
          if (!res.ok) throw new Error("captions HTTP " + res.status);
          const tracks = udemyCaptionTracks(await res.json());
          if (ctl.mediaKey !== mk) return;
          if (!tracks.length) {
            ctl.staticLoaded = true;
            ctl.ytStatic = "none";
            return;
          }
          const wanted = settings.sourceLang !== "auto" ? settings.sourceLang : null;
          const track = pickCaptionTrack(tracks, wanted, settings.targetLang);
          const vres = await fetch(track.url);
          if (!vres.ok) throw new Error("vtt HTTP " + vres.status);
          const cues = parseVTT(await vres.text());
          if (!cues.length) throw new Error("empty vtt");
          if (ctl.mediaKey !== mk || !isAlive()) return;
          adoptStaticCues(
            cues,
            String(track.languageCode || "").toLowerCase().split("-")[0]
          );
        } catch (e) {
          if (ctl.mediaKey !== mk) return;
          ctl.trackRetries = (ctl.trackRetries || 0) + 1;
          if (ctl.trackRetries >= 2) {
            ctl.staticLoaded = true;
            ctl.ytStatic = "failed";
          } else {
            ctl.trackRetryAt = Date.now() + 4e3;
          }
        } finally {
          ctl.ytFetching = false;
        }
      }
      ctl.udemyHarvest = harvestUdemyStatic;
      function audioEligible() {
        if (!settings.proAudio || accountPlan !== "pro" || !ctl.active) return false;
        if (video.paused || video.seeking) return false;
        const st = ctl.audioState;
        if (st === "starting" || st === "live" || st === "failed" || st === "quota")
          return false;
        if (ctl.audioRetryAt && Date.now() < ctl.audioRetryAt) return false;
        if (ctl.audioFeed) return true;
        if (ctl.cues.length > 0 || domLastText) return false;
        if (domSite && (domSite.id === "youtube" || domSite.id === "udemy") && !ctl.staticLoaded)
          return false;
        if (ctl.ytStatic === "loaded") return false;
        try {
          if (Array.from(video.textTracks || []).some(
            (t) => t.kind === "subtitles" || t.kind === "captions"
          ))
            return false;
        } catch (e) {
        }
        try {
          if (video.querySelector("track")) return false;
        } catch (e) {
        }
        if (!ctl.audioProbeAt) {
          ctl.audioProbeAt = performance.now();
          return false;
        }
        return performance.now() - ctl.audioProbeAt > 4e3;
      }
      function stopAudioGraph() {
        try {
          if (ctl.audioProc) ctl.audioProc.disconnect();
        } catch (e) {
        }
        try {
          if (ctl.audioSrc) ctl.audioSrc.disconnect();
        } catch (e) {
        }
        try {
          if (ctl.audioCtx && ctl.audioCtx.state !== "closed") ctl.audioCtx.close();
        } catch (e) {
        }
        ctl.audioProc = null;
        ctl.audioSrc = null;
        ctl.audioCtx = null;
      }
      function reportAudioUsage(final) {
        const sent = ctl.audioSecSent || 0;
        const delta = Math.round(sent - (ctl.audioSecReported || 0));
        if (delta < (final ? 3 : 20)) return;
        ctl.audioSecReported = sent;
        try {
          const p = runtime.sendMessage({ type: "audio-usage", seconds: delta });
          if (p && typeof p.then === "function") {
            p.then((r) => {
              if (!r) return;
              if (r.quota || r.ok && r.remainingSeconds === 0) {
                stopAudioFeed("quota");
              } else if (r.ok && typeof r.remainingSeconds === "number") {
                ctl.audioRemaining = r.remainingSeconds;
              }
            }).catch(() => {
            });
          }
        } catch (e) {
        }
      }
      function stopAudioFeed(state) {
        reportAudioUsage(true);
        if (ctl.audioWs) {
          try {
            ctl.audioWs.onclose = null;
            ctl.audioWs.onerror = null;
            ctl.audioWs.close();
          } catch (e) {
          }
          ctl.audioWs = null;
        }
        stopAudioGraph();
        if (ctl.audioState === "live" || ctl.audioState === "starting" || state) {
          ctl.audioState = state || "idle";
        }
      }
      ctl.stopAudioFeed = stopAudioFeed;
      function openAudioSocket(token, protocols, isRetry) {
        let ws;
        try {
          ws = new WebSocket(deepgramLiveUrl(effectiveSource()), protocols);
        } catch (e) {
          stopAudioFeed("failed");
          return;
        }
        ws.binaryType = "arraybuffer";
        let opened = false;
        ctl.audioWs = ws;
        ws.onopen = () => {
          if (ctl.audioWs !== ws) return;
          opened = true;
          ctl.audioState = "live";
          ctl.audioT0 = video.currentTime;
          ctl.audioRate = video.playbackRate || 1;
        };
        ws.onmessage = (ev) => {
          if (ctl.audioWs !== ws) return;
          let msg;
          try {
            msg = JSON.parse(ev.data);
          } catch (e) {
            return;
          }
          const cue = transcriptToCue(msg, ctl.audioT0 || 0, ctl.audioRate || 1);
          if (cue) {
            ctl.audioFeed = true;
            addCue(cue.start, cue.end, cue.text);
          }
        };
        ws.onerror = () => {
        };
        ws.onclose = () => {
          if (ctl.audioWs !== ws) return;
          ctl.audioWs = null;
          if (!opened && !isRetry) {
            openAudioSocket(token, ["token", token], true);
            return;
          }
          stopAudioGraph();
          if (ctl.audioState === "live" || ctl.audioState === "starting") {
            ctl.audioState = "idle";
            ctl.audioRetryAt = Date.now() + 8e3;
          }
        };
      }
      async function startAudioFeed() {
        ctl.audioState = "starting";
        ctl.audioStarts = (ctl.audioStarts || 0) + 1;
        if (ctl.audioStarts > 6) {
          ctl.audioState = "failed";
          return;
        }
        let track = null;
        try {
          const cap = video.captureStream || video.mozCaptureStream;
          const stream = cap ? cap.call(video) : null;
          track = stream && stream.getAudioTracks ? stream.getAudioTracks()[0] : null;
        } catch (e) {
        }
        if (!track) {
          ctl.audioState = "failed";
          return;
        }
        let grant = null;
        try {
          grant = await runtime.sendMessage({ type: "audio-grant" });
        } catch (e) {
        }
        if (!ctl.active || !settings.proAudio) {
          ctl.audioState = "idle";
          return;
        }
        if (!grant || !grant.ok || !grant.token) {
          if (grant && grant.quota) {
            ctl.audioState = "quota";
          } else {
            ctl.audioState = "idle";
            ctl.audioRetryAt = Date.now() + 3e4;
          }
          return;
        }
        if (typeof grant.remainingSeconds === "number")
          ctl.audioRemaining = grant.remainingSeconds;
        try {
          const ctx = new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE });
          const src = ctx.createMediaStreamSource(new MediaStream([track]));
          const proc = ctx.createScriptProcessor(4096, 1, 1);
          const mute = ctx.createGain();
          mute.gain.value = 0;
          src.connect(proc);
          proc.connect(mute);
          mute.connect(ctx.destination);
          ctl.audioCtx = ctx;
          ctl.audioSrc = src;
          ctl.audioProc = proc;
          if (ctx.state === "suspended") {
            try {
              await ctx.resume();
            } catch (e) {
            }
          }
          proc.onaudioprocess = (ev) => {
            const ws = ctl.audioWs;
            if (!ws || ws.readyState !== 1) return;
            const data = ev.inputBuffer.getChannelData(0);
            try {
              ws.send(floatTo16BitPCM(data).buffer);
            } catch (e) {
              return;
            }
            ctl.audioSecSent = (ctl.audioSecSent || 0) + data.length / AUDIO_SAMPLE_RATE;
            if (typeof ctl.audioRemaining === "number" && ctl.audioSecSent - (ctl.audioSecReported || 0) >= ctl.audioRemaining + 5) {
              stopAudioFeed("quota");
              return;
            }
            reportAudioUsage(false);
          };
        } catch (e) {
          stopAudioFeed("failed");
          return;
        }
        openAudioSocket(grant.token, ["bearer", grant.token]);
      }
      function effectiveSource() {
        if (settings.sourceLang !== "auto") return settings.sourceLang;
        if (ctl.trackLang) return ctl.trackLang;
        if (ctl.detectedSource) return ctl.detectedSource;
        maybeDetectSource();
        if (providerDetectedSource) return providerDetectedSource;
        return "auto";
      }
      async function maybeDetectSource() {
        if (ctl.detecting || ctl.detectedSource || ctl.cues.length < 2) return;
        ctl.detecting = true;
        try {
          if (typeof LanguageDetector === "undefined") return;
          const parts = [];
          let total = 0;
          for (const c of ctl.cues.slice(0, 25)) {
            const t = cleanCaption(c.text);
            if (!t) continue;
            parts.push(t);
            total += t.length;
            if (total >= 220) break;
          }
          if (total < 40) return;
          const detector = await LanguageDetector.create();
          const results = await detector.detect(parts.join(" "));
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
          (g) => g.end >= t && g.start <= t + 45 && isFinalGroup(g)
        );
        const source = effectiveSource();
        if (source !== "auto" && source === settings.targetLang) return;
        const target = settings.targetLang;
        warmBuiltin(source, target);
        const pending = [];
        for (const g of upcoming) {
          const key = cacheKey(source, target, g.text);
          if (cache.has(key) || ctl.spokenIds.has(g.id)) continue;
          const persisted = persistCache.get(pKey(source, target, g.text));
          if (persisted) {
            persisted.at = Date.now();
            cache.set(key, Promise.resolve(persisted.v));
            continue;
          }
          pending.push(g);
        }
        if (settings.proTranslation && pending.length >= 2 && pendingCount < 6 && proBatchTranslate(pending, source)) {
        } else {
          let launched = 0;
          for (const g of pending) {
            if (launched >= 3 || pendingCount >= 6) break;
            translate(g.text, source, groupContext(g.id), {
              prefetch: true,
              secs: g.end - g.start
            }).catch(() => {
            });
            launched++;
          }
        }
        if (cloudVoiceActive()) {
          for (const g of upcoming) {
            if (g.start - t >= 20 || g.end < t || ctl.spokenIds.has(g.id)) continue;
            const hit = cache.get(cacheKey(source, target, g.text));
            if (hit) hit.then((txt) => getCloudAudio(txt)).catch(() => {
            });
          }
        }
      }
      function proBatchTranslate(groups, source) {
        if (proBatchBroken) return false;
        const target = settings.targetLang;
        const batch = groups.slice(0, 6);
        const entries = batch.map((g) => {
          const gl = glossaryMatcher;
          const prot = protectTerms(g.text, {
            builtin: !!settings.keepTerms,
            glossary: gl
          });
          let resolve;
          let reject;
          const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
          });
          promise.catch(() => {
          });
          return { g, prot, promise, resolve, reject };
        });
        for (const e of entries) {
          const key = cacheKey(source, target, e.g.text);
          e.promise.catch(() => cache.delete(key));
          cache.set(key, e.promise);
        }
        const first = ctl.groups.findIndex((g) => g.id === batch[0].id);
        const before = first > 0 ? ctl.groups.slice(Math.max(0, first - 3), first).map((g) => g.text) : [];
        pendingCount += entries.length;
        runtime.sendMessage({
          type: "translate-pro-batch",
          lines: entries.map((e, i) => ({
            id: String(i),
            text: e.prot.protectedText,
            secs: Math.max(0, Math.round((e.g.end - e.g.start) * 10) / 10)
          })),
          before,
          source,
          target
        }).then((resp) => {
          if (!resp || !resp.ok || !Array.isArray(resp.items))
            throw new Error(resp && resp.error || "batch failed");
          const byId = new Map(resp.items.map((it) => [String(it.id), it.text]));
          for (let i = 0; i < entries.length; i++) {
            const e = entries[i];
            const raw = byId.get(String(i));
            if (typeof raw !== "string" || !raw.trim()) {
              e.reject(new Error("missing line"));
              continue;
            }
            const { restored, ok } = restoreTerms(raw, e.prot.found);
            const out = ok ? restored : restored.replace(/[⟦⟧]/g, " ").replace(/\s+/g, " ").trim();
            if (!out) {
              e.reject(new Error("empty line"));
              continue;
            }
            translationMode = "pro";
            lastTranslateError = "";
            persistPut(pKey(source, target, e.g.text), out);
            e.resolve(out);
          }
        }).catch((err) => {
          const m = String(err && err.message || err || "");
          if (/batch unsupported/.test(m)) proBatchBroken = true;
          for (const e of entries) e.reject(err);
        }).finally(() => {
          pendingCount -= entries.length;
        });
        return true;
      }
      function speak(text, cueDur, id, extras) {
        if (id) {
          ctl.spokenIds.add(id);
          ctl.scheduledIds.delete(id);
          ctl.inFlight.delete(id);
        }
        if (extras && extras.orig && !extras.rec) {
          extras.rec = true;
          recordLine(
            { id, start: extras.start, end: extras.end, text: extras.orig },
            text,
            extras.start
          );
        }
        if (settings.subtitles && extras && extras.orig)
          showCaption(extras.orig, text);
        duckNow();
        if (cloudVoiceActive()) {
          speakCloud(text, cueDur, id, extras);
          return;
        }
        speakLocal(text, cueDur, id, extras);
      }
      async function speakCloud(text, cueDur, id, extras) {
        const token = { cloud: true, at: performance.now(), _vxId: id };
        ctl.currentUtterance = token;
        const url = await getCloudAudio(text, settings.targetLang);
        if (ctl.currentUtterance !== token) {
          if (id) ctl.spokenIds.delete(id);
          return;
        }
        if (!url) {
          cloudVoiceDownUntil = Date.now() + 6e4;
          ctl.currentUtterance = null;
          speakLocal(text, cueDur, id, extras);
          return;
        }
        const a = new Audio(url);
        try {
          a.preservesPitch = true;
        } catch (e) {
        }
        const vv = Number(settings.voiceVolume);
        a.volume = Math.max(0, Math.min(100, Number.isFinite(vv) ? vv : 100)) / 100;
        await new Promise((res) => {
          if (Number.isFinite(a.duration) && a.duration > 0) return res();
          a.onloadedmetadata = () => res();
          setTimeout(res, 250);
        });
        if (ctl.currentUtterance !== token) {
          if (id) ctl.spokenIds.delete(id);
          return;
        }
        const base = Number.isFinite(settings.rate) ? settings.rate : 1.1;
        const cloudBase = Math.max(0.9, 1 + (base - 1) * 0.5);
        let natural = cloudBase;
        if (Number.isFinite(a.duration) && a.duration > 0.2 && cueDur > 0.5) {
          const fit = a.duration / Math.max(0.8, cueDur);
          natural = Math.max(cloudBase, Math.min(fit, cloudBase * 1.3, 1.35));
        }
        a._vxBaseRate = natural;
        a.playbackRate = Math.min(natural * (video.playbackRate || 1), 3);
        ctl.lastRate = a.playbackRate;
        ctl.cloudAudio = a;
        const spokeAt = performance.now();
        const finish = () => {
          if (ctl.cloudAudio === a) ctl.cloudAudio = null;
          if (ctl.currentUtterance === token) ctl.currentUtterance = null;
          recordSpokenSeconds((performance.now() - spokeAt) / 1e3);
          drainQueue();
        };
        a.onended = finish;
        a.onerror = () => {
          if (ctl.cloudAudio === a) ctl.cloudAudio = null;
          if (ctl.currentUtterance === token) ctl.currentUtterance = null;
          drainQueue();
        };
        try {
          await a.play();
        } catch (e) {
          cloudVoiceDownUntil = Date.now() + 6e4;
          if (ctl.cloudAudio === a) ctl.cloudAudio = null;
          if (ctl.currentUtterance === token) {
            ctl.currentUtterance = null;
            speakLocal(text, cueDur, id, extras);
          }
        }
      }
      function speakLocal(text, cueDur, id, extras) {
        const v = pickVoice2();
        if (!v && !voices.length) {
          if (!ctl.voicesGraceUntil)
            ctl.voicesGraceUntil = performance.now() + 1500;
          if (performance.now() < ctl.voicesGraceUntil) {
            if (id) ctl.spokenIds.delete(id);
            ctl.queue.unshift({
              text,
              dur: cueDur,
              start: extras && extras.start != null ? extras.start : video.currentTime,
              end: extras && extras.end != null ? extras.end : video.currentTime + cueDur,
              id,
              orig: extras && extras.orig,
              rec: !!(extras && extras.rec)
            });
            return;
          }
        }
        const u = new SpeechSynthesisUtterance(text);
        if (v) u.voice = v;
        u.lang = v && v.lang || LOCALES[settings.targetLang] || settings.targetLang;
        const vv = Number(settings.voiceVolume);
        u.volume = Math.max(0, Math.min(100, Number.isFinite(vv) ? vv : 100)) / 100;
        u.rate = computeUtteranceRate({
          text,
          cueDur,
          baseRate: settings.rate,
          playbackRate: video.playbackRate || 1,
          wps: localWps || void 0,
          prevRate: ctl.lastRate || 0
        });
        ctl.lastRate = u.rate;
        u._vxAt = performance.now();
        u._vxId = id;
        u.onstart = () => {
          u._vxStarted = performance.now();
        };
        u.onend = () => {
          if (u._vxStarted && !u._vxCancelled) {
            const secs = (performance.now() - u._vxStarted) / 1e3;
            recordSpokenSeconds(secs);
            const words = estimateWords(text);
            if (secs > 0.6 && words >= 3 && u.rate > 0) {
              const measured = Math.max(1.2, Math.min(6, words / (secs * u.rate)));
              localWps = localWps ? localWps * 0.75 + measured * 0.25 : measured;
            }
          } else if (!u._vxStarted && !u._vxCancelled) {
            recordSpokenSeconds((performance.now() - u._vxAt) / 1e3);
          }
          if (ctl.currentUtterance === u) ctl.currentUtterance = null;
          drainQueue();
        };
        u.onerror = () => {
          if (ctl.currentUtterance === u) ctl.currentUtterance = null;
          drainQueue();
        };
        ctl.currentUtterance = u;
        try {
          speechSynthesis.speak(u);
        } catch (e) {
          ctl.currentUtterance = null;
          if (id) ctl.spokenIds.delete(id);
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
          for (const q2 of ctl.queue) {
            if (q2.id) ctl.scheduledIds.delete(q2.id);
          }
          ctl.queue.length = 0;
          return;
        }
        const t = video.currentTime;
        while (ctl.queue.length > 0 && ctl.queue[0].end + 4 < t && !ctl.autoPaused) {
          const stale = ctl.queue.shift();
          if (stale && stale.id) {
            ctl.spokenIds.add(stale.id);
            ctl.scheduledIds.delete(stale.id);
          }
        }
        const q = ctl.queue[0];
        if (!q) return;
        if (!ctl.autoPaused && q.start > t + 0.25) return;
        ctl.queue.shift();
        const late = t - q.start > 0.8;
        const dur = late ? Math.max(1.2, Math.min(q.dur || 1.2, q.end - t)) : q.dur || Math.max(0.6, q.end - t);
        speak(q.text, dur, q.id, q);
      }
      function enqueue(item) {
        ctl.queue.push(item);
        if (ctl.queue.length > 3) {
          if (settings.autoPause && !video.paused && !ctl.autoPaused) {
            ctl.autoPaused = true;
            video.pause();
          } else if (!ctl.autoPaused) {
            const t = video.currentTime;
            let idx = ctl.queue.findIndex((it) => it.end + 1.5 < t);
            if (idx < 0) idx = 0;
            const dropped = ctl.queue.splice(idx, 1)[0];
            if (dropped && dropped.id) {
              ctl.spokenIds.add(dropped.id);
              ctl.scheduledIds.delete(dropped.id);
            }
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
            promise: translate(group.text, source, groupContext(group.id), {
              secs: group.end - group.start
            })
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
        const item = {
          text,
          dur: Math.max(0.6, group.end - group.start),
          start: group.start,
          end: group.end,
          id: group.id,
          orig: group.text,
          rec: false
        };
        if (ctl.currentUtterance) {
          enqueue(item);
        } else {
          speak(item.text, item.dur, item.id, item);
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
        const mediaKey = location.href.split("#")[0] + "|" + (video.currentSrc || "");
        if (ctl.mediaKey && ctl.mediaKey !== mediaKey) resetForNewMedia();
        ctl.mediaKey = mediaKey;
        const t = video.currentTime;
        if (t < ctl.lastTime - 0.75) {
          fullFlush();
        }
        ctl.lastTime = t;
        harvestTextTracks();
        harvestYouTubeStatic();
        harvestUdemyStatic();
        if ((ctl.audioState === "live" || ctl.audioState === "starting") && (!settings.proAudio || accountPlan !== "pro")) {
          stopAudioFeed("idle");
        } else if ((ctl.audioCheckAt || 0) < Date.now()) {
          ctl.audioCheckAt = Date.now() + 1e3;
          if (audioEligible()) startAudioFeed();
        }
        rebuildGroups();
        pretranslate();
        if (video.paused && !ctl.autoPaused || video.seeking) return;
        const now = performance.now();
        if (ctl.currentUtterance && ctl.currentUtterance.cloud) {
          const a = ctl.cloudAudio;
          const stalledFetch = !a && now - (ctl.currentUtterance.at || 0) > 12e3;
          if (a && a.ended || stalledFetch) {
            ctl.currentUtterance = null;
            ctl.cloudAudio = null;
            drainQueue();
          }
        } else if (ctl.currentUtterance) {
          const u = ctl.currentUtterance;
          const age = now - (u._vxAt || 0);
          const engineIdle = !speechSynthesis.speaking && !speechSynthesis.pending;
          if (engineIdle && age > 1500 || age > 45e3) {
            if (age > 45e3) {
              try {
                speechSynthesis.cancel();
              } catch (e) {
              }
            }
            ctl.currentUtterance = null;
            drainQueue();
          } else if (!engineIdle && age > 9e3 && now - (ctl.lastPumpAt || 0) > 9e3 && typeof speechSynthesis.pause === "function" && typeof speechSynthesis.resume === "function") {
            ctl.lastPumpAt = now;
            try {
              speechSynthesis.pause();
              speechSynthesis.resume();
            } catch (e) {
            }
          }
        }
        drainQueue();
        maybeReleaseDuck(now);
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
        } else if (!current) {
          let late = null;
          for (const g of ctl.groups) {
            if (g.start > t) break;
            if (g.end <= t && t - g.end < 4) late = g;
          }
          if (late && isFinalGroup(late) && !ctl.spokenIds.has(late.id) && !ctl.scheduledIds.has(late.id)) {
            onGroupEnter(late);
          }
          hideCaption();
        } else if (!settings.subtitles) {
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
          if (ctl.cues.length > 1200) {
            let cut = 0;
            while (cut < ctl.cues.length && ctl.cues[cut].end < t - 300) cut++;
            if (cut > 0) {
              for (const c of ctl.cues.slice(0, cut)) ctl.cueKeys.delete(c.key);
              ctl.cues.splice(0, cut);
              ctl.lastCueCount = -1;
            }
          }
        }
        positionCaption();
      }
      function hardStopSpeech() {
        ctl.generation += 1;
        ctl.scheduledIds.clear();
        ctl.inFlight.clear();
        const hadSpeech = ctl.currentUtterance || ctl.queue.length > 0;
        const owedResume = ctl.autoPaused;
        ctl.queue.length = 0;
        if (ctl.currentUtterance && !ctl.currentUtterance.cloud)
          ctl.currentUtterance._vxCancelled = true;
        ctl.currentUtterance = null;
        ctl.autoPaused = false;
        ctl.lastRate = 0;
        if (ctl.cloudAudio) {
          try {
            ctl.cloudAudio.pause();
          } catch (e) {
          }
          ctl.cloudAudio = null;
        }
        if (hadSpeech) {
          try {
            speechSynthesis.cancel();
          } catch (e) {
          }
        }
        if (owedResume && ctl.active && video.paused && !video.ended) {
          video.play().catch(() => {
          });
        }
        releaseDuckNow();
      }
      const DUCK_ATTACK_MS = 250;
      const DUCK_RELEASE_MS = 700;
      const DUCK_HOLD_MS = 4500;
      function writeVolume(v) {
        const clamped = Math.max(0, Math.min(1, v));
        ctl.lastWrittenVolume = clamped;
        try {
          video.volume = clamped;
        } catch (e) {
        }
      }
      function stopRamp() {
        if (ctl.rampTimer) {
          clearInterval(ctl.rampTimer);
          ctl.rampTimer = null;
        }
      }
      function rampVolumeTo(target, ms) {
        stopRamp();
        const from = video.volume;
        if (Math.abs(from - target) < 0.015) {
          writeVolume(target);
          return;
        }
        const STEP_MS = 40;
        const steps = Math.max(1, Math.round(ms / STEP_MS));
        const floor = 1e-3;
        const fromDb = 20 * Math.log10(Math.max(floor, from));
        const toDb = 20 * Math.log10(Math.max(floor, target));
        let i = 0;
        ctl.rampTimer = setInterval(() => {
          i++;
          if (i >= steps) {
            stopRamp();
            writeVolume(target);
            return;
          }
          writeVolume(Math.pow(10, (fromDb + (toDb - fromDb) * i / steps) / 20));
        }, STEP_MS);
      }
      function duckNow() {
        if (ctl.userVolumeOverride) return;
        if (ctl.savedVolume == null) ctl.savedVolume = video.volume;
        ctl.duckHoldUntil = Infinity;
        const target = Math.min(
          ctl.savedVolume,
          Math.max(0, Math.min(60, Number(settings.duck) || 0)) / 100
        );
        if (!ctl.ducked || Math.abs(video.volume - target) > 0.02) {
          rampVolumeTo(target, DUCK_ATTACK_MS);
        }
        ctl.ducked = true;
      }
      function maybeReleaseDuck(now) {
        if (!ctl.ducked || ctl.userVolumeOverride) return;
        if (ctl.currentUtterance || ctl.queue.length > 0) {
          ctl.duckHoldUntil = Infinity;
          return;
        }
        if (ctl.duckHoldUntil === Infinity) ctl.duckHoldUntil = now + DUCK_HOLD_MS;
        if (now < ctl.duckHoldUntil) return;
        const t = video.currentTime;
        for (const g of ctl.groups) {
          if (g.start > t + 1.5) break;
          if (g.start > t && !ctl.spokenIds.has(g.id)) return;
        }
        ctl.ducked = false;
        ctl.duckHoldUntil = 0;
        if (ctl.savedVolume != null) rampVolumeTo(ctl.savedVolume, DUCK_RELEASE_MS);
      }
      function releaseDuckNow() {
        ctl.duckHoldUntil = 0;
        if (!ctl.ducked || ctl.userVolumeOverride) return;
        ctl.ducked = false;
        if (ctl.savedVolume != null)
          rampVolumeTo(ctl.savedVolume, DUCK_RELEASE_MS);
      }
      function restoreVolume() {
        stopRamp();
        if (ctl.savedVolume != null && !ctl.userVolumeOverride) {
          writeVolume(ctl.savedVolume);
        }
        ctl.savedVolume = null;
        ctl.ducked = false;
        ctl.duckHoldUntil = 0;
        ctl.userVolumeOverride = false;
        ctl.lastWrittenVolume = null;
      }
      function onVolumeChange() {
        if (ctl.lastWrittenVolume == null) return;
        if (Math.abs(video.volume - ctl.lastWrittenVolume) > 5e-3) {
          ctl.userVolumeOverride = true;
          ctl.savedVolume = null;
          stopRamp();
        }
      }
      ctl.onAudioSettings = () => {
        ctl.userVolumeOverride = false;
        if (ctl.cloudAudio) {
          const vv = Number(settings.voiceVolume);
          ctl.cloudAudio.volume = Math.max(0, Math.min(100, Number.isFinite(vv) ? vv : 100)) / 100;
        }
        if (ctl.ducked && ctl.savedVolume != null) {
          const target = Math.min(
            ctl.savedVolume,
            Math.max(0, Math.min(60, Number(settings.duck) || 0)) / 100
          );
          rampVolumeTo(target, 120);
        }
      };
      function onRateChange() {
        const pr = video.playbackRate || 1;
        if (ctl.audioState === "live" || ctl.audioState === "starting") {
          stopAudioFeed("idle");
        }
        if (ctl.currentUtterance && ctl.currentUtterance.cloud && ctl.cloudAudio) {
          const a = ctl.cloudAudio;
          try {
            a.playbackRate = Math.min((a._vxBaseRate || 1) * pr, 3);
          } catch (e) {
          }
          return;
        }
        const cur = ctl.currentUtterance;
        const curId = cur && cur._vxId;
        hardStopSpeech();
        if (curId) ctl.spokenIds.delete(curId);
      }
      function onBuffering() {
        if (ctl.cloudAudio) {
          try {
            ctl.cloudAudio.pause();
          } catch (e) {
          }
        }
        if (ctl.currentUtterance && !ctl.currentUtterance.cloud && typeof speechSynthesis.pause === "function") {
          try {
            speechSynthesis.pause();
          } catch (e) {
          }
        }
      }
      function onPlayingAgain() {
        if (ctl.cloudAudio && ctl.cloudAudio.paused && ctl.currentUtterance && ctl.currentUtterance.cloud) {
          ctl.cloudAudio.play().catch(() => {
          });
        }
        if (typeof speechSynthesis.resume === "function") {
          try {
            speechSynthesis.resume();
          } catch (e) {
          }
        }
      }
      function start() {
        if (ctl.active) return;
        ctl.active = true;
        harvestTextTracks();
        harvestTrackElements();
        ctl.pollTimer = setInterval(tick, 150);
        video.addEventListener("pause", onPauseEvent);
        video.addEventListener("seeking", fullFlush);
        video.addEventListener("ended", hardStopSpeech);
        video.addEventListener("ratechange", onRateChange);
        video.addEventListener("volumechange", onVolumeChange);
        video.addEventListener("waiting", onBuffering);
        video.addEventListener("playing", onPlayingAgain);
        video.addEventListener("emptied", onMediaEmptied);
        video.addEventListener("timeupdate", onTimeUpdate);
      }
      function onTimeUpdate() {
        if (ctl.inTick) return;
        ctl.inTick = true;
        try {
          tick();
        } finally {
          ctl.inTick = false;
        }
      }
      function onPauseEvent() {
        if (!ctl.autoPaused) {
          hardStopSpeech();
          stopAudioFeed();
        }
      }
      function stop() {
        if (!ctl.active) return;
        ctl.active = false;
        clearInterval(ctl.pollTimer);
        ctl.pollTimer = null;
        video.removeEventListener("pause", onPauseEvent);
        video.removeEventListener("seeking", fullFlush);
        video.removeEventListener("ended", hardStopSpeech);
        video.removeEventListener("ratechange", onRateChange);
        video.removeEventListener("volumechange", onVolumeChange);
        video.removeEventListener("waiting", onBuffering);
        video.removeEventListener("playing", onPlayingAgain);
        video.removeEventListener("emptied", onMediaEmptied);
        video.removeEventListener("timeupdate", onTimeUpdate);
        hardStopSpeech();
        stopAudioFeed();
        restoreVolume();
        hideCaption();
      }
      function fullFlush() {
        hardStopSpeech();
        ctl.spokenIds.clear();
        stopAudioFeed();
      }
      function resetForNewMedia() {
        hardStopSpeech();
        ctl.cues = [];
        ctl.cueKeys.clear();
        ctl.groups = [];
        ctl.lastCueCount = -1;
        ctl.groupMeta.clear();
        ctl.spokenIds.clear();
        ctl.scheduledIds.clear();
        ctl.inFlight.clear();
        ctl.lastDomCue = null;
        ctl.detectedSource = null;
        ctl.trackLang = "";
        ctl.staticLoaded = false;
        ctl.ytStatic = null;
        ctl.trackRetryAt = 0;
        ctl.trackRetries = 0;
        ctl.lastTime = -1;
        if (ctl.trackListened && ctl.trackHarvestHandler) {
          try {
            ctl.trackListened.removeEventListener(
              "cuechange",
              ctl.trackHarvestHandler
            );
          } catch (e) {
          }
        }
        ctl.trackListened = null;
        ctl.trackHarvestHandler = null;
        stopAudioFeed();
        ctl.audioFeed = false;
        ctl.audioState = ctl.audioState === "quota" ? "quota" : "idle";
        ctl.audioStarts = 0;
        ctl.audioSecSent = 0;
        ctl.audioSecReported = 0;
        ctl.audioProbeAt = 0;
        ctl.audioRetryAt = 0;
        ctl.audioT0 = 0;
        resetPageFeed();
        hideCaption();
      }
      function onMediaEmptied() {
        ctl.mediaKey = "";
        resetForNewMedia();
      }
      ctl.onSettingsChanged = () => {
        if (settings.enabled && accountLinked && !siteDisabled() && sitePlanAllowed() && video === primaryVideo) {
          start();
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
          <span class="handle">\u283F</span>
          <span class="status"><span class="dot"></span><span class="stext"></span><span class="timer">00:00</span></span>
          <button class="power">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 6.5v3h2.4L8.5 12V4L4.9 6.5H2.5z" fill="currentColor" stroke="none"/>
              <path d="M10.5 5.5a3.4 3.4 0 010 5M12.3 4a5.8 5.8 0 010 8" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </button>
          <select class="lang"></select>
          <button class="chip voiceBtn">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="5.6" y="1.8" width="4.8" height="8" rx="2.4"/><path d="M3.2 8a4.8 4.8 0 009.6 0M8 12.8v1.6"/></svg>
            <span class="vname"></span><span class="chev">\u25BE</span>
          </button>
          <button class="icon mixBtn">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3.5 2.5v6M3.5 11.5v2M8 2.5v2M8 7.5v6M12.5 2.5v6M12.5 11.5v2"/><circle cx="3.5" cy="10" r="1.6"/><circle cx="8" cy="6" r="1.6"/><circle cx="12.5" cy="10" r="1.6"/></svg>
          </button>
          <button class="icon setBtn">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="2.1"/><path d="M8 1.9v1.8M8 12.3v1.8M1.9 8h1.8M12.3 8h1.8M3.7 3.7L5 5M11 11l1.3 1.3M12.3 3.7L11 5M5 11l-1.3 1.3"/></svg>
          </button>
          <button class="ghost mini">\u2013</button>
          <button class="ghost close">\u2715</button>
        </div>

        <div class="pop pop-voice above" hidden>
          <h3 class="vtitle"></h3>
          <div class="vlist"></div>
        </div>

        <div class="pop pop-mix above" hidden>
          <h3 class="mixTitle"></h3>
          <div class="prow"><span class="plabel lVoiceVol"></span><span class="pval voiceVal"></span></div>
          <input class="voiceVol" type="range" min="0" max="100" step="1" />
          <div class="prow"><span class="plabel lDuck"></span><span class="pval duckVal"></span></div>
          <input class="duckR" type="range" min="0" max="60" step="1" />
          <div class="presets">
            <button class="pImm"></button>
            <button class="pBal"></button>
            <button class="pVo"></button>
          </div>
        </div>

        <div class="pop pop-set above" hidden>
          <h3 class="setTitle"></h3>
          <div class="prow"><span class="plabel lRate"></span><span class="pval rateVal"></span></div>
          <input class="rateR" type="range" min="0.8" max="1.6" step="0.05" />
          <div class="prow"><span class="plabel lCap"></span><span class="pval capVal"></span></div>
          <input class="capR" type="range" min="14" max="34" step="1" />
          <div class="sep"></div>
          <div class="trow"><span class="plabel lSubs"></span>
            <label class="switch"><input type="checkbox" class="subsT" /><span class="knob"></span></label></div>
          <div class="trow"><span class="plabel lPause"></span>
            <label class="switch"><input type="checkbox" class="pauseT" /><span class="knob"></span></label></div>
        </div>
      </div>`;
      const q = (sel) => root.querySelector(sel);
      const setTxt = (sel, txt) => {
        const el = q(sel);
        if (el) el.textContent = txt;
      };
      const setA = (sel, attrs) => {
        const el = q(sel);
        if (!el) return;
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      };
      setA(".handle", { title: T.move });
      setA(".power", { "aria-label": T.power, title: T.power });
      setA(".lang", { "aria-label": T.langT, title: T.langT });
      setA(".voiceBtn", { title: T.voice });
      setA(".mixBtn", { title: T.mixer, "aria-label": T.mixer });
      setA(".setBtn", { title: T.quick, "aria-label": T.quick });
      setA(".mini", { title: T.minimize });
      setA(".close", { "aria-label": T.close, title: T.close });
      setA(".voiceVol", { "aria-label": T.voiceVol });
      setA(".duckR", { "aria-label": T.duckL });
      setA(".rateR", { "aria-label": T.rateL });
      setA(".capR", { "aria-label": T.capL });
      setTxt(".vtitle", T.voice);
      setTxt(".mixTitle", T.mixer);
      setTxt(".setTitle", T.quick);
      setTxt(".lVoiceVol", T.voiceVol);
      setTxt(".lDuck", T.duckL);
      setTxt(".pImm", T.pImm);
      setTxt(".pBal", T.pBal);
      setTxt(".pVo", T.pVo);
      setTxt(".lRate", T.rateL);
      setTxt(".lCap", T.capL);
      setTxt(".lSubs", T.subsL);
      setTxt(".lPause", T.pauseL);
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
    var uiT = null;
    function t2(key, fallback) {
      try {
        if (!uiT) uiT = makeT(resolveUiLang(settings.uiLang, navigator.language));
        return uiT(key) || fallback;
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
      syncDomCaptions();
      maybeEnableSiteCaptions();
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
          if (c.audioState === "failed") c.audioState = "idle";
          c.audioStarts = 0;
          c.audioRetryAt = 0;
          c.fullFlush();
        }
        builtinBroken = false;
        lastTranslateError = "";
        proBatchBroken = false;
        providerDetectedSource = "";
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
        else if (accountLinked && !sitePlanAllowed()) state = "pro-site";
        else if (controllers.size > 0) {
          if (nCues > 0) {
            if (targetVoices.length === 0) state = "no-voice";
            else if (translationMode === "none" && lastTranslateError)
              state = settings.cloudFallback ? "translate-error" : "local-unavailable";
            else state = "ready";
          } else if (hasSubTracks) {
            state = "subs-loading";
          } else {
            const pc = primaryVideo && controllers.get(primaryVideo);
            const audioState = pc && pc.audioState || "idle";
            if (audioState === "live" || audioState === "starting") {
              state = "audio-live";
            } else if (audioState === "quota") {
              state = "audio-quota";
            } else if (audioState === "failed") {
              state = "audio-unavailable";
            } else if (domSite) {
              state = "enable-subs";
            } else {
              state = "no-subs";
            }
          }
        }
        return {
          version: manifestVersion(),
          page: location.hostname,
          state,
          signinRequired: !accountLinked,
          siteFree: isFreeSite(location.hostname),
          trialDaysLeft: trialDaysLeft(accountTrialEndsAt, Date.now()),
          plan: accountPlan,
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
