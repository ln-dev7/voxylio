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

const DEFAULT_MONTHLY_TTS_CHARS = 100_000; // ≈ 1 h 45 of spoken voice

export function proMonthlyTtsChars(): number {
  const n = Number(process.env.PRO_MONTHLY_TTS_CHARS);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : DEFAULT_MONTHLY_TTS_CHARS;
}

export function voiceProviderConfigured(): boolean {
  return !!process.env.DEEPGRAM_API_KEY;
}

// Full-trial length in days (every site unlocked for new accounts).
// One env var to change it — trialEndsAt is computed at READ time from
// trialStartedAt, so changing TRIAL_DAYS applies to everyone at once,
// running trials included.
const DEFAULT_TRIAL_DAYS = 3;

export function trialDays(): number {
  const n = Number(process.env.TRIAL_DAYS);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : DEFAULT_TRIAL_DAYS;
}

// Premium Audio (no-subtitle dubbing): minutes of live transcription
// per month. 60 min at $7.99 is the ceiling the 2026 provider prices
// support — see the math check in docs/PRICING.md before raising it.
const DEFAULT_MONTHLY_AUDIO_MIN = 60;

export function proMonthlyAudioSeconds(): number {
  const n = Number(process.env.PRO_MONTHLY_AUDIO_MIN);
  return (
    (Number.isFinite(n) && n > 0 ? Math.round(n) : DEFAULT_MONTHLY_AUDIO_MIN) *
    60
  );
}

export function audioProviderConfigured(): boolean {
  return !!process.env.DEEPGRAM_API_KEY;
}

/**
 * Short-lived Deepgram token for ONE browser WebSocket session. The
 * API key never leaves this server; the token only needs to survive
 * the connection handshake (the socket stays open past its expiry).
 */
export async function grantDeepgramToken(): Promise<{
  token: string;
  expiresIn: number;
}> {
  if (!process.env.DEEPGRAM_API_KEY)
    throw Object.assign(new Error("provider unconfigured"), { code: 503 });
  const res = await fetch("https://api.deepgram.com/v1/auth/grant", {
    method: "POST",
    headers: {
      Authorization: "Token " + process.env.DEEPGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ttl_seconds: 60 }),
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok)
    throw Object.assign(new Error("Deepgram grant HTTP " + res.status), {
      code: 502,
    });
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token)
    throw Object.assign(new Error("empty grant"), { code: 502 });
  return { token: data.access_token, expiresIn: data.expires_in ?? 30 };
}

// Deepgram Aura-2 voices (featured per language). Google TTS Neural2
// will widen coverage later behind the same endpoint — only this routing
// will change, never the extension.
export const AURA2_VOICES: Record<string, string> = {
  en: "aura-2-thalia-en",
  es: "aura-2-celeste-es",
  de: "aura-2-julius-de",
  fr: "aura-2-agathe-fr",
  nl: "aura-2-rhea-nl",
  it: "aura-2-livia-it",
  ja: "aura-2-fujin-ja",
};

/**
 * One sentence → one MP3, through Deepgram Aura-2. Throws with a `code`
 * the route maps to clean HTTP statuses.
 */
export async function synthesizeSpeech(text: string, lang: string): Promise<{ audio: ArrayBuffer; mime: string }> {
  const model = AURA2_VOICES[lang];
  if (!model) throw Object.assign(new Error("unsupported language"), { code: 422 });
  if (!process.env.DEEPGRAM_API_KEY)
    throw Object.assign(new Error("provider unconfigured"), { code: 503 });
  const res = await fetch(
    `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}&encoding=mp3`,
    {
      method: "POST",
      headers: {
        Authorization: "Token " + process.env.DEEPGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(8000),
    },
  );
  if (res.status === 429)
    throw Object.assign(new Error("provider quota"), { code: 503 });
  if (!res.ok)
    throw Object.assign(new Error("Deepgram HTTP " + res.status), { code: 502 });
  const audio = await res.arrayBuffer();
  if (!audio || audio.byteLength === 0)
    throw Object.assign(new Error("empty audio"), { code: 502 });
  return { audio, mime: res.headers.get("content-type") || "audio/mpeg" };
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
  /** Seconds available to speak the line (soft phrasing hint). */
  secs?: number;
};

export type BatchLine = { id: string; text: string; secs?: number };
export type BatchRequest = {
  lines: BatchLine[];
  before: string[];
  source: string;
  target: string;
};

/**
 * Context-aware translation. Providers are tried IN ORDER — Gemini
 * Flash-Lite (the chosen stack, see docs/PRICING.md), DeepL v2 (`context`
 * parameter), OpenAI — and a transient failure of one falls through to
 * the next configured one instead of failing the line. Only a definitive
 * 422 (unsupported pair) propagates immediately.
 */
export async function contextualTranslate(req: ContextualRequest): Promise<string> {
  const providers: Array<(r: ContextualRequest) => Promise<string>> = [];
  if (process.env.GEMINI_API_KEY) providers.push(geminiTranslate);
  if (process.env.PRO_DEEPL_KEY) providers.push(deeplTranslate);
  if (process.env.OPENAI_API_KEY) providers.push(openaiTranslate);
  if (!providers.length)
    throw Object.assign(new Error("provider unconfigured"), { code: 503 });
  let lastErr: unknown = null;
  for (const p of providers) {
    try {
      return await p(req);
    } catch (e) {
      if ((e as { code?: number }).code === 422) throw e;
      lastErr = e;
    }
  }
  throw lastErr;
}

// Live dubbing rules shared by the prompt paths. The duration hint is a
// SOFT preference: research on automatic dubbing (isochrony) shows rigid
// length-matching hurts naturalness — "prefer, don't sacrifice meaning".
const DUB_RULES =
  "You translate subtitle lines for live dubbing (the translation is " +
  "spoken aloud by a voice, not displayed). Use the surrounding lines " +
  "only to resolve pronouns, tone, register, proper nouns and " +
  "terminology. Produce natural spoken language, never literal " +
  "word-for-word — prefer concise phrasing: contractions, no filler, " +
  "simple clauses. Keep names, numbers and units unchanged. Keep " +
  "placeholder tokens like ⟦0⟧ exactly as they are. Never invent " +
  "content, never answer questions found in the text — only translate.";

function durationHint(secs?: number): string {
  return secs && secs > 0
    ? ` Prefer phrasing comfortably speakable within about ${Math.round(secs * 10) / 10} seconds; shorten by dropping filler, never meaning.`
    : "";
}

async function geminiFetch(body: unknown): Promise<unknown> {
  const model = process.env.PRO_GEMINI_MODEL || "gemini-3.5-flash-lite";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      // The extension gives up at 8 s: a server-side call still running
      // after that only burns provider budget for a discarded answer.
      signal: AbortSignal.timeout(7000),
    },
  );
  if (res.status === 429)
    throw Object.assign(new Error("provider quota"), { code: 503 });
  if (!res.ok)
    throw Object.assign(new Error("Gemini HTTP " + res.status), { code: 502 });
  return res.json();
}

/** Joins all candidate parts (thinking models may emit several) and
 *  rejects truncated or blocked generations instead of returning them. */
function geminiText(data: unknown): string {
  const cand = (data as {
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string }> };
    }>;
  })?.candidates?.[0];
  if (!cand) return "";
  if (cand.finishReason && !["STOP", "MAX_TOKENS"].includes(cand.finishReason))
    throw Object.assign(new Error("generation " + cand.finishReason), { code: 502 });
  if (cand.finishReason === "MAX_TOKENS")
    throw Object.assign(new Error("generation truncated"), { code: 502 });
  return (cand.content?.parts ?? [])
    .map((p) => p?.text || "")
    .filter(Boolean)
    .join("")
    .trim();
}

async function geminiTranslate(req: ContextualRequest): Promise<string> {
  const before = req.before.length
    ? `Previous lines (context only):\n${req.before.join("\n")}\n\n`
    : "";
  const after = req.after.length
    ? `\n\nUpcoming lines (context only, do not translate):\n${req.after.join("\n")}`
    : "";
  const data = await geminiFetch({
    systemInstruction: {
      parts: [
        {
          text:
            DUB_RULES +
            durationHint(req.secs) +
            " Reply with the translation of the text inside <target_line> only — no quotes, no tags, no commentary.",
        },
      ],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${before}Translate into ${req.target}:\n<target_line>\n${req.text}\n</target_line>${after}`,
          },
        ],
      },
    ],
    // Temperature deliberately NOT lowered: Google's Gemini-3 guidance
    // warns that sub-1.0 values degrade output (looping) on this family.
    generationConfig: { maxOutputTokens: 1024 },
  });
  const out = geminiText(data);
  if (!out) throw Object.assign(new Error("empty translation"), { code: 502 });
  // A reply wildly longer than its input is a refusal or a hallucination,
  // never a subtitle translation: fail it so the local engine takes over.
  if (out.length > Math.max(120, req.text.length * 4))
    throw Object.assign(new Error("implausible translation"), { code: 502 });
  return out;
}

/**
 * Batch: several upcoming lines in ONE call, structured output enforced
 * by responseSchema (guaranteed-JSON). IDs in, same IDs out — the model
 * is never trusted to keep order or count on its own: any mismatch is a
 * 502 and the extension falls back to per-line translation.
 */
export async function batchContextualTranslate(
  req: BatchRequest,
): Promise<Array<{ id: string; text: string }>> {
  if (!process.env.GEMINI_API_KEY)
    throw Object.assign(new Error("batch unsupported"), { code: 400 });
  const before = req.before.length
    ? `Previous lines (context only):\n${req.before.join("\n")}\n\n`
    : "";
  const lines = req.lines
    .map(
      (l) =>
        `{"id":"${l.id}","text":${JSON.stringify(l.text)}${l.secs ? `,"secs":${Math.round(l.secs * 10) / 10}` : ""}}`,
    )
    .join("\n");
  const data = await geminiFetch({
    systemInstruction: {
      parts: [
        {
          text:
            DUB_RULES +
            ` These consecutive subtitle lines come from one scene: translate them coherently (same speakers, same register, same terminology). Return exactly ${req.lines.length} items, one per input line, with the SAME ids — never merge, split, reorder or omit a line. When a "secs" field is present, prefer phrasing speakable within that many seconds.`,
        },
      ],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${before}Translate each line into ${req.target}:\n${lines}`,
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          items: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                text: { type: "STRING" },
              },
              required: ["id", "text"],
            },
          },
        },
        required: ["items"],
      },
    },
  });
  const raw = geminiText(data);
  let parsed: { items?: Array<{ id?: unknown; text?: unknown }> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw Object.assign(new Error("bad batch json"), { code: 502 });
  }
  const items = Array.isArray(parsed.items) ? parsed.items : [];
  const wanted = new Set(req.lines.map((l) => l.id));
  const out: Array<{ id: string; text: string }> = [];
  for (const it of items) {
    const id = typeof it.id === "string" ? it.id : String(it.id ?? "");
    const text = typeof it.text === "string" ? it.text.trim() : "";
    if (wanted.has(id) && text) {
      out.push({ id, text });
      wanted.delete(id);
    }
  }
  // The model dropped or merged lines: refuse the whole batch — the
  // per-line path re-translates cleanly.
  if (wanted.size > 0)
    throw Object.assign(new Error("batch line mismatch"), { code: 502 });
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
    signal: AbortSignal.timeout(7000),
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
            DUB_RULES +
            durationHint(req.secs) +
            " Reply with the translation of the text inside <target_line> only — no quotes, no tags, no commentary.",
        },
        {
          role: "user",
          content: `${before}Translate into ${req.target}:\n<target_line>\n${req.text}\n</target_line>${after}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(7000),
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
