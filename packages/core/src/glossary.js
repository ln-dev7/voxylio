// Term protection & user glossary.
//
// Two term sources share one placeholder mechanism:
//  - PROTECTED_TERMS: technical vocabulary professionals keep in English
//    (opt-in via the keepTerms setting);
//  - the user glossary: per-user entries { from, to } — `to` empty keeps
//    the source form verbatim ("do not translate"), `to` set forces that
//    exact target form ("Voxylio" → "Voxylio", "the board" → "le CA").
// Matches are shielded as ⟦n⟧ through translation, then the placeholder
// is restored to the replacement — which makes forced translations work
// identically across EVERY provider (builtin, gtx, DeepL, Pro), with no
// server-side prompt work needed.

export const PROTECTED_TERMS = [
  "playground", "prompt", "framework", "codebase", "commit", "pull request",
  "code review", "backend", "frontend", "workflow", "pipeline", "token",
  "embedding", "debug", "build", "deploy", "refactoring", "refactor",
  "feature flag", "context window", "agent",
];

const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const TERM_RE = new RegExp(
  "\\b(" + PROTECTED_TERMS.map(escapeRe).join("|") + ")\\b",
  "gi"
);

/**
 * Compiles user glossary entries ([{ from, to }]) into a matcher, or null
 * when there is nothing to match. Longest-first so "pull request" wins
 * over "pull"; unicode-aware boundaries so accented and CJK terms work.
 */
export function compileGlossary(entries) {
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
    "(?<![\\p{L}\\p{N}])(" +
      list.map((t) => escapeRe(t.from)).join("|") +
      ")(?![\\p{L}\\p{N}])",
    "giu"
  );
  const map = new Map(list.map((t) => [t.from.toLowerCase(), t.to]));
  return { re, map };
}

/**
 * Shields terms with ⟦n⟧ placeholders. `found[n]` holds what the
 * placeholder must restore to: the matched text itself for protected
 * terms and keep-as-is glossary entries, the forced target form for
 * glossary entries that carry one.
 */
export function protectTerms(text, opts = {}) {
  const { builtin = true, glossary = null } = opts;
  const found = [];
  let out = String(text);
  if (glossary) {
    out = out.replace(glossary.re, (m) => {
      const to = glossary.map.get(m.toLowerCase());
      found.push(to || m);
      return `⟦${found.length - 1}⟧`;
    });
  }
  if (builtin) {
    out = out.replace(TERM_RE, (m) => {
      found.push(m);
      return `⟦${found.length - 1}⟧`;
    });
  }
  return { protectedText: out, found };
}

export function restoreTerms(text, found) {
  const seen = (text.match(/⟦\s*\d+\s*⟧/g) || []).length;
  const restored = text.replace(
    /⟦\s*(\d+)\s*⟧/g,
    (_, i) => found[Number(i)] ?? ""
  );
  // ok only if every placeholder survived translation intact
  const ok = seen === found.length && !/⟦|⟧/.test(restored);
  return { restored, ok };
}
