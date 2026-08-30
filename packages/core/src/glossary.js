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

// Unicode lookarounds, not ASCII \b: with \b, accented letters count as
// non-word so "commité" matched its "commit" stem mid-word and shielded
// it ("j'ai ⟦0⟧é le build") — the exact bug compileGlossary already
// fixed for user entries.
const TERM_RE = new RegExp(
  "(?<![\\p{L}\\p{N}])(" +
    PROTECTED_TERMS.map(escapeRe).join("|") +
    ")(?![\\p{L}\\p{N}])",
  "giu"
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
  // Collect the actual indices: comparing COUNT alone let a translator
  // that duplicated ⟦0⟧ and dropped ⟦1⟧ pass as ok — speaking a
  // corrupted line instead of triggering the unprotected retry.
  const indices = [];
  const restored = text.replace(/⟦\s*(\d+)\s*⟧/g, (_, i) => {
    indices.push(Number(i));
    return found[Number(i)] ?? "";
  });
  const ok =
    indices.length === found.length &&
    !/⟦|⟧/.test(restored) &&
    new Set(indices).size === found.length &&
    indices.every((i) => i >= 0 && i < found.length);
  return { restored, ok };
}
