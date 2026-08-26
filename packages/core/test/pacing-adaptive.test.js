// Adaptive pacing: calibrated words-per-second, tempo smoothing, and the
// "never slower than the user's setting" floor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeUtteranceRate, estimateWords } from "@voxylio/core";

test("estimateWords: whitespace scripts vs space-less scripts", () => {
  assert.equal(estimateWords("three little words"), 3);
  assert.ok(estimateWords("これは長い日本語の文章です") >= 4);
  assert.equal(estimateWords(""), 0);
});

test("calibrated wps changes the catch-up decision", () => {
  const text = Array(12).fill("mot").join(" "); // 12 words
  // A fast voice (4 wps) fits 12 words in 3s: no catch-up needed.
  const fast = computeUtteranceRate({ text, cueDur: 3.2, baseRate: 1.0, wps: 4 });
  assert.equal(fast, 1.0);
  // A slow voice (2 wps → 6s of speech) must speed up in the same slot.
  const slow = computeUtteranceRate({ text, cueDur: 3.2, baseRate: 1.0, wps: 2 });
  assert.ok(slow > 1.0);
  // Nonsense calibration values fall back to the default.
  const bad = computeUtteranceRate({ text, cueDur: 4, baseRate: 1.1, wps: 99 });
  const def = computeUtteranceRate({ text, cueDur: 4, baseRate: 1.1 });
  assert.equal(bad, def);
});

test("long lines are never slower than the user's base rate", () => {
  const text = Array(40).fill("mot").join(" ");
  const r = computeUtteranceRate({ text, cueDur: 4, baseRate: 1.6 });
  assert.ok(r >= 1.6); // the old 1.45 absolute cap used to invert this
});

test("prevRate smooths tempo changes between adjacent lines", () => {
  const long = Array(30).fill("mot").join(" ");
  const target = computeUtteranceRate({ text: long, cueDur: 4, baseRate: 1.0 });
  assert.ok(target > 1.2);
  // Coming from a calm 1.0, the jump is eased (60% of the way).
  const eased = computeUtteranceRate({
    text: long,
    cueDur: 4,
    baseRate: 1.0,
    prevRate: 1.0,
  });
  assert.ok(eased > 1.0 && eased < target);
  assert.ok(Math.abs(eased - (1.0 + (target - 1.0) * 0.6)) < 1e-9);
  // Identical tempo passes through unchanged.
  const steady = computeUtteranceRate({
    text: "Une phrase courte.",
    cueDur: 2,
    baseRate: 1.0,
    playbackRate: 1.5,
    prevRate: 1.5,
  });
  assert.equal(steady, 1.5);
});
