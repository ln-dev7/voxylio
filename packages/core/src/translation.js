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
//
// translate() may resolve a plain string, or { text, detected } when the
// provider learned the actual source language along the way (gtx, DeepL
// and Google v2 all report it) — the caller can use it to stop dubbing a
// video that is already in the target language.

export const READY_TIMEOUT_MS = 2500;
export const ATTEMPT_TIMEOUT_MS = 8000;
export const COOLDOWN_MS = 60_000;
export const FAILURES_BEFORE_COOLDOWN = 2;
// Half-open probe: during a cooldown, one line per this interval still
// tries the cooling provider — a recovered backend must not stay silent
// for the whole cooldown (field report 2026-08-27: rolling 60 s
// blackouts on fresh profiles whose only leg is the online provider).
export const PROBE_MS = 10_000;

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
 * injecting timeouts, a clock for tests, and a shared `pairState` Map so
 * cooldowns survive chain rebuilds (settings toggles must not un-cool a
 * provider that is known to be down).
 */
export function createTranslatorChain(providers, opts = {}) {
  const {
    readyTimeoutMs = READY_TIMEOUT_MS,
    attemptTimeoutMs = ATTEMPT_TIMEOUT_MS,
    cooldownMs = COOLDOWN_MS,
    failuresBeforeCooldown = FAILURES_BEFORE_COOLDOWN,
    probeMs = PROBE_MS,
    now = () => Date.now(),
    pairState = new Map(), // "providerId:source->target" -> { failures, readyMisses, coolUntil }
  } = opts;

  let lastKind = "none";
  let lastProviderId = "";
  let lastError = "";

  const stateKey = (id, source, target) => `${id}:${source}->${target}`;

  function getState(key) {
    return pairState.get(key) ?? { failures: 0, readyMisses: 0, coolUntil: 0 };
  }

  function inCooldown(id, source, target) {
    const key = stateKey(id, source, target);
    const s = pairState.get(key);
    if (!s || s.coolUntil <= now()) return false;
    // Half-open: let one probe line through per probeMs. On success
    // recordSuccess clears the whole state; on failure the probe counts
    // like any failure and the pair re-cools.
    if (now() - (s.lastProbeAt || 0) >= probeMs) {
      s.lastProbeAt = now();
      pairState.set(key, s);
      return false;
    }
    return true;
  }

  function recordFailure(id, source, target) {
    const key = stateKey(id, source, target);
    const s = getState(key);
    s.failures += 1;
    if (s.failures >= failuresBeforeCooldown) {
      s.coolUntil = now() + cooldownMs;
      s.failures = 0;
      // Anchor the half-open window: without this stamp the FIRST
      // inCooldown check after cooling sees lastProbeAt 0 and lets the
      // very next line probe the just-declared-dead provider (a third
      // consecutive multi-second stall on a real clock).
      s.lastProbeAt = now();
    }
    pairState.set(key, s);
  }

  // A ready() that keeps losing the race (model download that never ends,
  // dead backend) must not cost every future line the full readyTimeoutMs:
  // after two consecutive misses the pair cools down like a failure —
  // without counting as one (the provider did nothing wrong yet).
  function recordReadyMiss(id, source, target) {
    const key = stateKey(id, source, target);
    const s = getState(key);
    s.readyMisses += 1;
    if (s.readyMisses >= 2) {
      s.coolUntil = now() + cooldownMs;
      s.readyMisses = 0;
      s.lastProbeAt = now(); // same half-open anchoring as recordFailure
    }
    pairState.set(key, s);
  }

  function recordSuccess(id, source, target) {
    pairState.delete(stateKey(id, source, target));
  }

  /**
   * Translates through the chain. Resolves { text, providerId, kind,
   * detected? }; rejects when every provider failed or was unavailable.
   * `opts` is forwarded to the provider's translate — e.g. { context:
   * { before, after }, secs } for context-aware providers; others simply
   * ignore it.
   */
  async function translate(text, source, target, opts) {
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
        // ready() threw: treat as a real failure for this pair.
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
        // Not applicable (unsupported pair, no key): no penalty of any kind.
        errors.push(`${p.id}: not ready`);
        continue;
      }
      try {
        let out = await withTimeout(translator.translate(text, opts), attemptTimeoutMs, TIMEOUT);
        if (out === TIMEOUT) throw new Error("attempt timed out");
        let detected;
        if (out && typeof out === "object") {
          detected = typeof out.detected === "string" ? out.detected : undefined;
          out = out.text;
        }
        if (typeof out !== "string") throw new Error("bad translation");
        if (!out.trim()) {
          // An empty result is "nothing to say", not a provider fault —
          // two junk lines in a row must never cool a healthy provider.
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
