// The canonical language catalog — single source of truth for every
// surface (popup, overlay, options, site). Codes are BCP-47 base codes;
// provider-specific quirks (gtx "iw", DeepL "PT-PT"…) live in the
// providers, never here.
//
// Every entry is translatable by the online fallback; the local Chrome
// translator and the installed system voices vary per machine, and the
// popup's status states (no-voice, pair unavailable) already surface
// that honestly.

export const LANGUAGES = [
  { code: "af", name: "Afrikaans", english: "Afrikaans" },
  { code: "am", name: "አማርኛ", english: "Amharic" },
  { code: "ar", name: "العربية", english: "Arabic" },
  { code: "az", name: "Azərbaycan", english: "Azerbaijani" },
  { code: "be", name: "Беларуская", english: "Belarusian" },
  { code: "bg", name: "Български", english: "Bulgarian" },
  { code: "bn", name: "বাংলা", english: "Bengali" },
  { code: "bs", name: "Bosanski", english: "Bosnian" },
  { code: "ca", name: "Català", english: "Catalan" },
  { code: "cs", name: "Čeština", english: "Czech" },
  { code: "cy", name: "Cymraeg", english: "Welsh" },
  { code: "da", name: "Dansk", english: "Danish" },
  { code: "de", name: "Deutsch", english: "German" },
  { code: "el", name: "Ελληνικά", english: "Greek" },
  { code: "en", name: "English", english: "English" },
  { code: "es", name: "Español", english: "Spanish" },
  { code: "et", name: "Eesti", english: "Estonian" },
  { code: "eu", name: "Euskara", english: "Basque" },
  { code: "fa", name: "فارسی", english: "Persian" },
  { code: "fi", name: "Suomi", english: "Finnish" },
  { code: "fr", name: "Français", english: "French" },
  { code: "gl", name: "Galego", english: "Galician" },
  { code: "gu", name: "ગુજરાતી", english: "Gujarati" },
  { code: "he", name: "עברית", english: "Hebrew" },
  { code: "hi", name: "हिन्दी", english: "Hindi" },
  { code: "hr", name: "Hrvatski", english: "Croatian" },
  { code: "hu", name: "Magyar", english: "Hungarian" },
  { code: "hy", name: "Հայերեն", english: "Armenian" },
  { code: "id", name: "Bahasa Indonesia", english: "Indonesian" },
  { code: "is", name: "Íslenska", english: "Icelandic" },
  { code: "it", name: "Italiano", english: "Italian" },
  { code: "ja", name: "日本語", english: "Japanese" },
  { code: "ka", name: "ქართული", english: "Georgian" },
  { code: "kk", name: "Қазақша", english: "Kazakh" },
  { code: "km", name: "ខ្មែរ", english: "Khmer" },
  { code: "kn", name: "ಕನ್ನಡ", english: "Kannada" },
  { code: "ko", name: "한국어", english: "Korean" },
  { code: "lo", name: "ລາວ", english: "Lao" },
  { code: "lt", name: "Lietuvių", english: "Lithuanian" },
  { code: "lv", name: "Latviešu", english: "Latvian" },
  { code: "mk", name: "Македонски", english: "Macedonian" },
  { code: "ml", name: "മലയാളം", english: "Malayalam" },
  { code: "mn", name: "Монгол", english: "Mongolian" },
  { code: "mr", name: "मराठी", english: "Marathi" },
  { code: "ms", name: "Bahasa Melayu", english: "Malay" },
  { code: "my", name: "မြန်မာ", english: "Burmese" },
  { code: "ne", name: "नेपाली", english: "Nepali" },
  { code: "nl", name: "Nederlands", english: "Dutch" },
  { code: "no", name: "Norsk", english: "Norwegian" },
  { code: "pa", name: "ਪੰਜਾਬੀ", english: "Punjabi" },
  { code: "pl", name: "Polski", english: "Polish" },
  { code: "pt", name: "Português", english: "Portuguese" },
  { code: "ro", name: "Română", english: "Romanian" },
  { code: "ru", name: "Русский", english: "Russian" },
  { code: "si", name: "සිංහල", english: "Sinhala" },
  { code: "sk", name: "Slovenčina", english: "Slovak" },
  { code: "sl", name: "Slovenščina", english: "Slovenian" },
  { code: "sq", name: "Shqip", english: "Albanian" },
  { code: "sr", name: "Српски", english: "Serbian" },
  { code: "sv", name: "Svenska", english: "Swedish" },
  { code: "sw", name: "Kiswahili", english: "Swahili" },
  { code: "ta", name: "தமிழ்", english: "Tamil" },
  { code: "te", name: "తెలుగు", english: "Telugu" },
  { code: "th", name: "ไทย", english: "Thai" },
  { code: "tl", name: "Tagalog", english: "Tagalog" },
  { code: "tr", name: "Türkçe", english: "Turkish" },
  { code: "uk", name: "Українська", english: "Ukrainian" },
  { code: "ur", name: "اردو", english: "Urdu" },
  { code: "uz", name: "Oʻzbekcha", english: "Uzbek" },
  { code: "vi", name: "Tiếng Việt", english: "Vietnamese" },
  { code: "zh", name: "中文", english: "Chinese" },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

/** Default utterance locale per language (used when no voice object is
 *  available and as the "main locale" bonus in voice scoring). */
export const PRIMARY_LOCALE = {
  af: "af-ZA", am: "am-ET", ar: "ar-SA", az: "az-AZ", be: "be-BY",
  bg: "bg-BG", bn: "bn-BD", bs: "bs-BA", ca: "ca-ES", cs: "cs-CZ",
  cy: "cy-GB", da: "da-DK", de: "de-DE", el: "el-GR", en: "en-US",
  es: "es-ES", et: "et-EE", eu: "eu-ES", fa: "fa-IR", fi: "fi-FI",
  fr: "fr-FR", gl: "gl-ES", gu: "gu-IN", he: "he-IL", hi: "hi-IN",
  hr: "hr-HR", hu: "hu-HU", hy: "hy-AM", id: "id-ID", is: "is-IS",
  it: "it-IT", ja: "ja-JP", ka: "ka-GE", kk: "kk-KZ", km: "km-KH",
  kn: "kn-IN", ko: "ko-KR", lo: "lo-LA", lt: "lt-LT", lv: "lv-LV",
  mk: "mk-MK", ml: "ml-IN", mn: "mn-MN", mr: "mr-IN", ms: "ms-MY",
  my: "my-MM", ne: "ne-NP", nl: "nl-NL", no: "nb-NO", pa: "pa-IN",
  pl: "pl-PL", pt: "pt-PT", ro: "ro-RO", ru: "ru-RU", si: "si-LK",
  sk: "sk-SK", sl: "sl-SI", sq: "sq-AL", sr: "sr-RS", sv: "sv-SE",
  sw: "sw-KE", ta: "ta-IN", te: "te-IN", th: "th-TH", tl: "fil-PH",
  tr: "tr-TR", uk: "uk-UA", ur: "ur-PK", uz: "uz-UZ", vi: "vi-VN",
  zh: "zh-CN",
};

/** Extra voice-locale prefixes accepted per language: some platforms
 *  tag voices differently (Norwegian → nb, Tagalog → fil, Hebrew → iw). */
export const VOICE_PREFIX_ALIASES = {
  no: ["nb"],
  tl: ["fil"],
  he: ["iw"],
};
