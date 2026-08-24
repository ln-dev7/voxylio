import { test } from "node:test";
import assert from "node:assert/strict";
import { computeUtteranceRate, BoundedMap, pickVoice } from "@voxylio/core";

test("pacing: short sentences keep the base rate", () => {
  const r = computeUtteranceRate({
    text: "Bonjour.",
    cueDur: 2,
    baseRate: 1.1,
  });
  assert.equal(r, 1.1);
});

test("pacing: long sentences speed up, capped at +25% / ×1.45", () => {
  const text = Array(30).fill("mot").join(" "); // ~11.5s of speech in a 4s slot
  const r = computeUtteranceRate({ text, cueDur: 4, baseRate: 1.1 });
  assert.ok(r <= 1.45 + 1e-9);
  assert.ok(r <= 1.1 * 1.25 + 1e-9);
  assert.ok(r > 1.1);
});

test("pacing: follows the player's playbackRate, capped at 3", () => {
  const r = computeUtteranceRate({
    text: "Une phrase courte.",
    cueDur: 2,
    baseRate: 1.0,
    playbackRate: 1.5,
  });
  assert.equal(r, 1.5);
  const r2 = computeUtteranceRate({
    text: "Une phrase courte.",
    cueDur: 2,
    baseRate: 1.6,
    playbackRate: 2,
  });
  assert.ok(r2 <= 3);
});

test("BoundedMap evicts the oldest half at capacity", () => {
  const m = new BoundedMap(10);
  for (let i = 0; i < 10; i++) m.set("k" + i, i);
  assert.equal(m.size, 10);
  m.set("overflow", 1);
  assert.ok(m.size <= 6);
  assert.ok(!m.has("k0"));
  assert.ok(m.has("overflow"));
  // updating an existing key never evicts
  const before = m.size;
  m.set("overflow", 2);
  assert.equal(m.size, before);
});

test("pickVoice prefers premium > google > local, honors explicit choice", () => {
  const voices = [
    { name: "Basic", lang: "fr-FR", localService: false },
    { name: "Google français", lang: "fr-FR", localService: false },
    { name: "Amélie (Premium)", lang: "fr-FR", localService: true },
    { name: "Spanish", lang: "es-ES", localService: true },
  ];
  assert.equal(
    pickVoice(voices, { targetLang: "fr" }).name,
    "Amélie (Premium)"
  );
  assert.equal(
    pickVoice(voices, { targetLang: "fr", voiceName: "Basic" }).name,
    "Basic"
  );
  assert.equal(pickVoice(voices, { targetLang: "de" }), null);
});

test("pickVoice tie-breaking is stable (documented POC behavior)", () => {
  // A fr-FR Google voice (google+locale = 5) ties with a non-main-locale
  // premium voice (premium+local = 5): the stable sort keeps list order,
  // so the earlier entry wins. Characterization, not a preference.
  const voices = [
    { name: "Google français", lang: "fr-FR", localService: false },
    { name: "Amélie (Premium)", lang: "fr-CA", localService: true },
  ];
  assert.equal(pickVoice(voices, { targetLang: "fr" }).name, "Google français");
});
