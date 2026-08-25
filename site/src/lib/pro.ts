// Pro cloud features: provider calls and quota policy. Provider keys
// live ONLY here, server-side — never in the extension. See
// docs/PRICING.md for the positioning this implements.

const DEFAULT_MONTHLY_CHARS = 1_500_000; // ≈ 40 h of dense subtitles

export function proMonthlyChars(): number {
  const n = Number(process.env.PRO_MONTHLY_CHARS);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : DEFAULT_MONTHLY_CHARS;
}

/** "YYYY-MM" period key, UTC. */
export function currentPeriod(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function proProviderConfigured(): boolean {
  return !!(
    process.env.GEMINI_API_KEY ||
    process.env.PRO_DEEPL_KEY ||
    process.env.OPENAI_API_KEY
  );
}

// DeepL target codes for our catalog subset (regioned where required).
const DEEPL_TARGET: Record<string, string> = {
  ar: "AR", bg: "BG", cs: "CS", da: "DA", de: "DE", el: "EL", en: "EN-US",
  es: "ES", et: "ET", fi: "FI", fr: "FR", he: "HE", hu: "HU", id: "ID",
  it: "IT", ja: "JA", ko: "KO", lt: "LT", lv: "LV", nl: "NL", no: "NB",
  pl: "PL", pt: "PT-PT", ro: "RO", ru: "RU", sk: "SK", sl: "SL", sv: "SV",
  th: "TH", tr: "TR", uk: "UK", vi: "VI", zh: "ZH-HANS",
};

export type ContextualRequest = {
  text: string;
  before: string[];
  after: string[];
  source: string; // "auto" or a language code
  target: string;
};

/**
 * Context-aware translation through the configured provider, in order of
 * preference: GEMINI_API_KEY (Gemini Flash-Lite — the chosen stack, see
 * docs/PRICING.md), PRO_DEEPL_KEY (DeepL v2 `context` parameter), or
 * OPENAI_API_KEY. Throws on provider errors; the caller maps them to
 * clean HTTP codes.
 */
export async function contextualTranslate(req: ContextualRequest): Promise<string> {
  if (process.env.GEMINI_API_KEY) return geminiTranslate(req);
  if (process.env.PRO_DEEPL_KEY) return deeplTranslate(req);
  if (process.env.OPENAI_API_KEY) return openaiTranslate(req);
  throw Object.assign(new Error("provider unconfigured"), { code: 503 });
}

async function geminiTranslate(req: ContextualRequest): Promise<string> {
  const model = process.env.PRO_GEMINI_MODEL || "gemini-3.5-flash-lite";
  const before = req.before.length
    ? `Previous lines:\n${req.before.join("\n")}\n\n`
    : "";
  const after = req.after.length
    ? `\n\nUpcoming lines (context only, do not translate):\n${req.after.join("\n")}`
    : "";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "You translate one subtitle line for live dubbing. Use the surrounding lines only to resolve pronouns, tone, register, proper nouns and terminology. Produce natural spoken language, never literal word-for-word. Never invent content. Reply with the translation of the TARGET line only — no quotes, no commentary.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${before}TARGET line (translate into ${req.target}):\n${req.text}${after}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
      }),
    },
  );
  if (res.status === 429)
    throw Object.assign(new Error("provider quota"), { code: 503 });
  if (!res.ok)
    throw Object.assign(new Error("Gemini HTTP " + res.status), { code: 502 });
  const data = await res.json();
  const out = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!out) throw Object.assign(new Error("empty translation"), { code: 502 });
  return out;
}

async function deeplTranslate(req: ContextualRequest): Promise<string> {
  const key = process.env.PRO_DEEPL_KEY!;
  const target = DEEPL_TARGET[req.target];
  if (!target) throw Object.assign(new Error("unsupported target"), { code: 422 });
  const host = key.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
  const body: Record<string, unknown> = {
    text: [req.text],
    target_lang: target,
    // Neighbouring sentences: DeepL uses them for disambiguation only —
    // they are not translated and not billed.
    context: [...req.before, ...req.after].join(" ").slice(0, 2000) || undefined,
  };
  if (req.source && req.source !== "auto")
    body.source_lang = req.source.toUpperCase();
  const res = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: "DeepL-Auth-Key " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (res.status === 456)
    throw Object.assign(new Error("provider quota"), { code: 503 });
  if (!res.ok)
    throw Object.assign(new Error("DeepL HTTP " + res.status), { code: 502 });
  const data = await res.json();
  const out = data?.translations?.[0]?.text;
  if (!out) throw Object.assign(new Error("empty translation"), { code: 502 });
  return out;
}

async function openaiTranslate(req: ContextualRequest): Promise<string> {
  const before = req.before.length ? `Previous lines:\n${req.before.join("\n")}\n\n` : "";
  const after = req.after.length ? `\n\nUpcoming lines (context only):\n${req.after.join("\n")}` : "";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.PRO_OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You translate one subtitle line for live dubbing. Use the surrounding lines only to resolve pronouns, tone, register, names and terminology. Reply with the translation of the TARGET line only — no quotes, no commentary.",
        },
        {
          role: "user",
          content: `${before}TARGET line (translate into ${req.target}):\n${req.text}${after}`,
        },
      ],
    }),
  });
  if (res.status === 429)
    throw Object.assign(new Error("provider quota"), { code: 503 });
  if (!res.ok)
    throw Object.assign(new Error("OpenAI HTTP " + res.status), { code: 502 });
  const data = await res.json();
  const out = data?.choices?.[0]?.message?.content?.trim();
  if (!out) throw Object.assign(new Error("empty translation"), { code: 502 });
  return out;
}
