import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGroups, mergeRollup } from "@voxylio/core";

test("buildGroups merges fragments into full sentences", () => {
  const cues = [
    { start: 0, end: 2, text: "We're gonna be doing this" },
    { start: 2, end: 4, text: "by using a playground." },
    { start: 4, end: 6, text: "[Music]" },
    { start: 6, end: 8, text: "So the first thing" },
    { start: 8, end: 10, text: "we need to do is set up." },
    { start: 14, end: 16, text: "Cut off by a long gap" },
    { start: 18, end: 20, text: "New sentence after gap!" },
  ];
  const g = buildGroups(cues);
  assert.equal(g.length, 4);
  assert.equal(g[0].text, "We're gonna be doing this by using a playground.");
  assert.equal(g[0].start, 0);
  assert.equal(g[0].end, 4);
  assert.equal(g[1].text, "So the first thing we need to do is set up.");
  assert.ok(g[2].text.startsWith("Cut off"));
  assert.ok(g[0].key.length > 0);
});

test("buildGroups drops duplicated trailing fragments", () => {
  const cues = [
    { start: 0, end: 2, text: "Hello there my friend" },
    { start: 2, end: 3, text: "my friend" },
    { start: 3, end: 4, text: "and welcome." },
  ];
  const g = buildGroups(cues);
  assert.equal(g.length, 1);
  assert.equal(g[0].text, "Hello there my friend and welcome.");
});

test("mergeRollup merges growing roll-up captions", () => {
  const last = { start: 0.5, end: 2, text: "Rolling captions grow" };
  const merged = mergeRollup(last, 2, 4, "Rolling captions grow like this.");
  assert.ok(merged);
  assert.equal(merged.text, "Rolling captions grow like this.");
  assert.equal(merged.end, 4);
  assert.ok(merged.grew);
});

test("mergeRollup refuses unrelated or distant cues", () => {
  const last = { start: 0, end: 2, text: "One sentence." };
  assert.equal(mergeRollup(last, 4, 6, "One sentence. Extended"), null);
  assert.equal(mergeRollup(last, 2, 4, "A different sentence"), null);
  assert.equal(mergeRollup(null, 0, 2, "Anything"), null);
});
