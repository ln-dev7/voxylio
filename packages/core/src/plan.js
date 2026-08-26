// Free/Pro site policy (owner decision, 2026-08-26 — docs/PRICING.md).
//
// The free plan covers the big consumer platforms; every other player
// (course platforms, corporate video, anything with textTracks) is Pro.
// A NEW account gets a 3-day full trial — every site unlocked — started
// server-side at the first authenticated entitlements call, so existing
// accounts get their full window too. The server sends `trialEndsAt`;
// a missing value means an old server (or a stubbed test) and MUST
// fail open: a rollout ordering problem must never lock paying-nothing
// users out of what yesterday's build allowed.

/** Hostnames (and their subdomains) the FREE plan may dub on. */
const FREE_SITE_PATTERNS = [
  /(^|\.)youtube(-nocookie)?\.com$/,
  /(^|\.)youtu\.be$/,
  /(^|\.)netflix\.com$/,
  /(^|\.)primevideo\.com$/,
  /(^|\.)amazon\.[a-z.]+$/, // Prime Video lives under amazon.<tld>/video
  /(^|\.)disneyplus\.com$/,
  /(^|\.)twitch\.tv$/,
];

/** True when the hostname belongs to the free-plan site list. */
export function isFreeSite(hostname) {
  const h = String(hostname || "")
    .toLowerCase()
    .replace(/^www\./, "");
  if (!h) return false;
  return FREE_SITE_PATTERNS.some((re) => re.test(h));
}

/**
 * The one gate deciding whether dubbing may run on this site for this
 * account. Pure — the extension and the tests share it.
 * Returns { allowed, reason } with reason ∈
 * "pro" | "trial" | "freeSite" | "legacy" | "locked".
 */
export function planGate({ plan, trialEndsAt, now, hostname }) {
  if (plan === "pro") return { allowed: true, reason: "pro" };
  const t = typeof now === "number" ? now : Date.parse(now || "") || 0;
  const end = trialEndsAt ? Date.parse(trialEndsAt) : NaN;
  if (Number.isFinite(end) && t < end) return { allowed: true, reason: "trial" };
  if (isFreeSite(hostname)) return { allowed: true, reason: "freeSite" };
  // No trial info at all: old server / offline cache from before the
  // rollout — fail open rather than locking sites down by accident.
  if (!trialEndsAt) return { allowed: true, reason: "legacy" };
  return { allowed: false, reason: "locked" };
}

/** Whole days left in the trial (ceil), or null when no trial applies. */
export function trialDaysLeft(trialEndsAt, now) {
  const end = trialEndsAt ? Date.parse(trialEndsAt) : NaN;
  if (!Number.isFinite(end)) return null;
  const t = typeof now === "number" ? now : Date.now();
  if (end <= t) return null;
  return Math.ceil((end - t) / 86400000);
}
