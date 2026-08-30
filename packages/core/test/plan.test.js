import test from "node:test";
import assert from "node:assert/strict";
import { isFreeSite, planGate, trialDaysLeft } from "../src/plan.js";
import { domCaptionSiteFor } from "../src/sites.js";

test("isFreeSite: the five platforms and their subdomains, nothing else", () => {
  for (const h of [
    "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com",
    "www.netflix.com", "www.primevideo.com", "www.amazon.com", "www.amazon.co.uk",
    "www.disneyplus.com", "www.twitch.tv",
  ]) assert.ok(isFreeSite(h), h);
  for (const h of [
    "www.udemy.com", "coursera.org", "vimeo.com", "example.com",
    "notyoutube.com", "youtube.com.evil.io", "x.com", "",
  ]) assert.ok(!isFreeSite(h), h || "(empty)");
});

const NOW = Date.parse("2026-08-26T12:00:00Z");
const FUTURE = "2026-08-28T12:00:00Z";
const PAST = "2026-08-20T12:00:00Z";

test("planGate: pro dubs everywhere", () => {
  assert.deepEqual(
    planGate({ plan: "pro", trialEndsAt: PAST, now: NOW, hostname: "udemy.com" }),
    { allowed: true, reason: "pro" },
  );
});

test("planGate: active trial unlocks every site for free accounts", () => {
  assert.deepEqual(
    planGate({ plan: "free", trialEndsAt: FUTURE, now: NOW, hostname: "udemy.com" }),
    { allowed: true, reason: "trial" },
  );
});

test("planGate: expired trial keeps the big platforms, locks the rest", () => {
  assert.deepEqual(
    planGate({ plan: "free", trialEndsAt: PAST, now: NOW, hostname: "www.netflix.com" }),
    { allowed: true, reason: "freeSite" },
  );
  assert.deepEqual(
    planGate({ plan: "free", trialEndsAt: PAST, now: NOW, hostname: "udemy.com" }),
    { allowed: false, reason: "locked" },
  );
});

test("planGate: missing trial info fails open (old server, stubs)", () => {
  assert.deepEqual(
    planGate({ plan: "free", trialEndsAt: null, now: NOW, hostname: "udemy.com" }),
    { allowed: true, reason: "legacy" },
  );
  assert.deepEqual(
    planGate({ plan: "free", now: NOW, hostname: "udemy.com" }).allowed,
    true,
  );
});

test("trialDaysLeft: ceil of remaining days, null when over or absent", () => {
  assert.equal(trialDaysLeft(FUTURE, NOW), 2);
  assert.equal(trialDaysLeft("2026-08-26T18:00:00Z", NOW), 1);
  assert.equal(trialDaysLeft(PAST, NOW), null);
  assert.equal(trialDaysLeft(null, NOW), null);
});

test("udemy is a DOM-caption site (its player exposes no track)", () => {
  assert.equal(domCaptionSiteFor("www.udemy.com")?.id, "udemy");
  assert.equal(domCaptionSiteFor("udemy.com")?.id, "udemy");
  assert.equal(domCaptionSiteFor("coursera.org"), null);
});

test("2026-08 sweep: DOM-caption players resolve, native ones stay null", () => {
  const cases = {
    "www.hulu.com": "hulu",
    "play.hbomax.com": "hbomax",
    "www.max.com": "hbomax",
    "www.peacocktv.com": "peacock",
    "www.dailymotion.com": "dailymotion",
    "www.viki.com": "viki",
    "www.linkedin.com": "linkedin",
    "www.skillshare.com": "skillshare",
    "learning.edx.org": "edx",
  };
  for (const [host, id] of Object.entries(cases)) {
    assert.equal(domCaptionSiteFor(host)?.id, id, host);
  }
  // Native-track or unsupported players must NOT get a DOM config.
  for (const host of ["vimeo.com", "coursera.org", "crunchyroll.com", "tv.apple.com"]) {
    assert.equal(domCaptionSiteFor(host), null, host);
  }
});

test("planGate without `now` uses the real clock (expired trial stays locked)", () => {
  const past = new Date(Date.now() - 30 * 86400_000).toISOString();
  const g = planGate({ plan: "free", trialEndsAt: past, hostname: "www.udemy.com" });
  assert.equal(g.allowed, false);
});

test("domCueEnd estimates CJK durations without whitespace", async () => {
  const { domCueEnd } = await import("../src/sites.js");
  const ja = "これは長い日本語の字幕でスペースがありません";
  // A ~22-char Japanese caption is several seconds of speech, not 1.5 s.
  assert.ok(domCueEnd(10, ja) - 10 > 2, `got ${domCueEnd(10, ja) - 10}`);
  // Short Latin text keeps the floor.
  assert.equal(domCueEnd(10, "Hi."), 11.5);
});
