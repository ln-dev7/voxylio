import test from "node:test";
import assert from "node:assert/strict";
import {
  AUDIO_SAMPLE_RATE,
  deepgramLiveUrl,
  floatTo16BitPCM,
  transcriptToCue,
} from "../src/audio.js";

test("deepgramLiveUrl: explicit source vs multilingual auto", () => {
  const u = deepgramLiveUrl("en-US");
  assert.ok(u.startsWith("wss://api.deepgram.com/v1/listen?"), u);
  assert.ok(u.includes("model=nova-3"));
  assert.ok(u.includes(`sample_rate=${AUDIO_SAMPLE_RATE}`));
  assert.ok(u.includes("encoding=linear16"));
  assert.ok(u.includes("language=en"));
  assert.ok(deepgramLiveUrl("auto").includes("language=multi"));
  assert.ok(deepgramLiveUrl(null).includes("language=multi"));
});

test("floatTo16BitPCM: clamps and scales to int16", () => {
  const pcm = floatTo16BitPCM(new Float32Array([0, 1, -1, 2, -2, 0.5]));
  assert.equal(pcm[0], 0);
  assert.equal(pcm[1], 0x7fff);
  assert.equal(pcm[2], -0x8000);
  assert.equal(pcm[3], 0x7fff); // clamped
  assert.equal(pcm[4], -0x8000); // clamped
  assert.equal(pcm[5], Math.trunc(0.5 * 0x7fff)); // Int16Array truncates
});

const MSG = (over = {}) => ({
  type: "Results",
  is_final: true,
  start: 4,
  duration: 2,
  channel: { alternatives: [{ transcript: "Welcome to the course." }] },
  ...over,
});

test("transcriptToCue: maps stream time onto the video clock", () => {
  // Capture began at video t=100 s, normal speed.
  assert.deepEqual(transcriptToCue(MSG(), 100, 1), {
    start: 104,
    end: 106,
    text: "Welcome to the course.",
  });
  // ×1.5: one stream second covers 1.5 video seconds.
  assert.deepEqual(transcriptToCue(MSG(), 100, 1.5), {
    start: 106,
    end: 109,
    text: "Welcome to the course.",
  });
});

test("transcriptToCue: ignores interim, empty and non-result messages", () => {
  assert.equal(transcriptToCue(MSG({ is_final: false }), 0, 1), null);
  assert.equal(transcriptToCue(MSG({ type: "Metadata" }), 0, 1), null);
  assert.equal(
    transcriptToCue(MSG({ channel: { alternatives: [{ transcript: "  " }] } }), 0, 1),
    null,
  );
  assert.equal(transcriptToCue(null, 0, 1), null);
});
