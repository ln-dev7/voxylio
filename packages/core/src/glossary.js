// Technical-term protection — extracted verbatim from the Chrome POC.
// Terms that professionals keep in English are shielded with placeholders
// through translation, then restored verbatim.

export const PROTECTED_TERMS = [
  "playground", "prompt", "framework", "codebase", "commit", "pull request",
  "code review", "backend", "frontend", "workflow", "pipeline", "token",
  "embedding", "debug", "build", "deploy", "refactoring", "refactor",
  "feature flag", "context window", "agent",
];

const TERM_RE = new RegExp(
  "\\b(" +
    PROTECTED_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(
      "|"
    ) +
    ")\\b",
  "gi"
);

export function protectTerms(text) {
  const found = [];
  const protectedText = text.replace(TERM_RE, (m) => {
    found.push(m);
    return `⟦${found.length - 1}⟧`;
  });
  return { protectedText, found };
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
