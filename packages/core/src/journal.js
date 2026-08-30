// Local dubbing journal + usage stats — pure logic, no storage access.
// The content script records what it dubs (original + translation per
// line); the hub page renders history, transcripts and local stats.
// Everything stays on-device: this is a transcript of PUBLIC subtitles
// the user watched, plus counters. Nothing here ever leaves the browser.

export const JOURNAL_CAPS = Object.freeze({
  sessions: 40, // most recent kept
  linesPerSession: 400,
  days: 60, // usage stats horizon
});

/** Appends a line to a session, bounded (oldest lines dropped). */
export function journalAppendLine(session, line, cap = JOURNAL_CAPS.linesPerSession) {
  const lines = [...(session.lines || []), line];
  while (lines.length > cap) lines.shift();
  return { ...session, lines, updatedAt: line.at || session.updatedAt };
}

/**
 * Upserts a session into the list (matched by id), newest first,
 * bounded to `cap` sessions. Returns a new array.
 */
export function journalUpsert(list, session, cap = JOURNAL_CAPS.sessions) {
  const rest = (Array.isArray(list) ? list : []).filter((s) => s && s.id !== session.id);
  const out = [session, ...rest];
  out.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return out.slice(0, cap);
}

/**
 * Adds dubbed seconds/lines to the aggregates. `day` is a "YYYY-MM-DD"
 * key. Days older than the horizon are trimmed (by key order, which is
 * chronological for this format).
 */
export function usageAdd(stats, day, seconds, lines, lang, capDays = JOURNAL_CAPS.days) {
  const s = stats && typeof stats === "object" ? stats : {};
  const days = { ...(s.days || {}) };
  const prev = days[day] || { s: 0, l: 0 };
  days[day] = { s: prev.s + seconds, l: prev.l + lines };
  const keys = Object.keys(days).sort();
  while (keys.length > capDays) delete days[keys.shift()];
  const langs = { ...(s.langs || {}) };
  if (lang) langs[lang] = (langs[lang] || 0) + lines;
  return {
    days,
    langs,
    totalS: (s.totalS || 0) + seconds,
    totalL: (s.totalL || 0) + lines,
  };
}

/** "MM:SS" (or "H:MM:SS") from seconds — timestamps in transcripts. */
export function fmtTime(sec) {
  const t = Math.max(0, Math.floor(Number(sec) || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function fmtSrtTime(sec) {
  // Round to integer milliseconds FIRST: rounding the fraction on its
  // own turns 59.9996 into "59,1000" — a four-digit ms field strict SRT
  // parsers reject.
  const total = Math.round(Math.max(0, Number(sec) || 0) * 1000);
  const h = String(Math.floor(total / 3_600_000)).padStart(2, "0");
  const m = String(Math.floor((total % 3_600_000) / 60_000)).padStart(2, "0");
  const s = String(Math.floor((total % 60_000) / 1000)).padStart(2, "0");
  const ms = String(total % 1000).padStart(3, "0");
  return `${h}:${m}:${s},${ms}`;
}

/**
 * Plain-text transcript. mode: "bilingual" | "original" | "translation";
 * timestamps prefixed when `withTimes`.
 */
export function toTranscriptText(session, mode = "bilingual", withTimes = true) {
  const out = [];
  for (const line of session.lines || []) {
    const ts = withTimes ? `[${fmtTime(line.t)}] ` : "";
    if (mode === "original") out.push(ts + line.src);
    else if (mode === "translation") out.push(ts + line.dst);
    else out.push(`${ts}${line.src}\n${" ".repeat(ts.length)}${line.dst}`);
  }
  return out.join("\n");
}

/**
 * SubRip export of the translation. Line end = next line start (capped
 * at +6 s), last line gets +4 s.
 */
export function toSRT(session, mode = "translation") {
  const lines = session.lines || [];
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const start = Number(lines[i].t) || 0;
    const next = i + 1 < lines.length ? Number(lines[i + 1].t) : start + 4;
    const end = Math.max(start + 1, Math.min(next, start + 6));
    const text = mode === "original" ? lines[i].src : lines[i].dst;
    out.push(`${i + 1}\n${fmtSrtTime(start)} --> ${fmtSrtTime(end)}\n${text}\n`);
  }
  return out.join("\n");
}
