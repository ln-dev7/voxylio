// Provider-agnostic translation chain: pure orchestration (ordering,
// readiness timeout, attempt timeout, per-pair failure cooldown). The
// providers themselves live in the platform adapter — this module never
// touches a browser API.
//
// A provider is: {
//   id: string,               // "builtin" | "deepl" | "gtx" | …
//   kind: "local" | "cloud",  // surfaced as the popup's translationMode
//   // Resolve a ready translator for the pair, or null when the provider
//   // cannot serve it (unsupported pair, needs explicit source, no key…).
//   // May be slow (model download): the chain races it with readyTimeoutMs
//   // and simply moves on this time when it loses the race.
//   ready(source, target): Promise<{ translate(text): Promise<string> } | null>,
// }

export const READY_TIMEOUT_MS = 2500;
export const ATTEMPT_TIMEOUT_MS = 8000;
export const COOLDOWN_MS = 60_000;
export const FAILURES_BEFORE_COOLDOWN = 2;

function withTimeout(promise, ms, fallbackValue) {
  if (!(ms > 0) || ms === Infinity) return promise;
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallbackValue), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const TIMEOUT = Symbol("timeout");

/**
 * Builds the chain. `providers` is the ordered list to try; opts allow
 * injecting timeouts and a clock for tests.
 */
export function createTranslatorChain(providers, opts = {}) {
  const {
    readyTimeoutMs = READY_TIMEOUT_MS,
    attemptTimeoutMs = ATTEMPT_TIMEOUT_MS,
    cooldownMs = COOLDOWN_MS,
    failuresBeforeCooldown = FAILURES_BEFORE_COOLDOWN,
    now = () => Date.now(),
  } = opts;

  // "providerId:source->target" -> { failures, coolUntil }
  const pairState = new Map();
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

  /**
   * Translates through the chain. Resolves { text, providerId, kind };
   * rejects when every provider failed or was unavailable.
   */
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
        // ready() threw: treat as a real failure for this pair.
        recordFailure(p.id, source, target);
        errors.push(`${p.id}: ${e && e.message}`);
        continue;
      }
      if (!translator) {
        // Not ready / not applicable this time: no penalty, next provider.
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
        errors.push(`${p.id}: ${(e && e.message) || "failed"}`);
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
    _pairState: pairState,
  };
}
