import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGroups, mergeRollup, wordOverlap, textHash } from "@voxylio/core";

// ----- sliding-window merging (the shape that caused duplicated speech) ---

test("mergeRollup stitches sliding-window captions on their overlap", () => {
  const last = { start: 0, end: 2, text: "Bienvenue dans le cours accéléré" };
  const m = mergeRollup(last, 2, 4, "dans le cours accéléré de codage");
  assert.ok(m);
  assert.equal(m.text, "Bienvenue dans le cours accéléré de codage");
  assert.equal(m.end, 4);
  assert.ok(m.grew);
});

test("mergeRollup chains a full sliding sequence without duplication", () => {
  let cue = { start: 0, end: 1.5, text: "Bienvenue dans le cours accéléré" };
  for (const [s, e, t] of [
    [1.5, 3, "dans le cours accéléré de codage"],
    [3, 4.5, "le cours accéléré de codage. Je m'appelle Matt"],
  ]) {
    const m = mergeRollup(cue, s, e, t);
    assert.ok(m, `should merge: ${t}`);
    cue = { start: cue.start, end: m.end, text: m.text };
  }
  assert.equal(
    cue.text,
    "Bienvenue dans le cours accéléré de codage. Je m'appelle Matt"
  );
});

test("mergeRollup: incoming fully contained in the tail is absorbed", () => {
  const last = { start: 0, end: 2, text: "One two three four five" };
  const m = mergeRollup(last, 2, 3, "four five");
  assert.ok(m);
  assert.equal(m.text, "One two three four five");
  assert.ok(!m.grew);
});

test("mergeRollup never merges temporally distant or unrelated captions", () => {
  const last = { start: 0, end: 2, text: "A first idea entirely" };
  assert.equal(mergeRollup(last, 4, 6, "idea entirely continued"), null); // gap
  assert.equal(mergeRollup(last, 2, 4, "a totally different sentence"), null);
});

test("wordOverlap requires a minimum overlap and ignores punctuation/case", () => {
  assert.equal(wordOverlap("Hello brave WORLD.", "brave world again", 2), 2);
  assert.equal(wordOverlap("Hello world", "world again", 2), 0); // 1 word only
});

// ----- stable identity through growth --------------------------------------

test("a growing trailing group keeps its id; only its version changes", () => {
  const versions = [
    "Bienvenue",
    "Bienvenue dans le cours",
    "Bienvenue dans le cours accéléré",
    "Bienvenue dans le cours accéléré de codage.",
  ];
  let id = null;
  let lastVersion = null;
  for (const text of versions) {
    const groups = buildGroups([{ start: 12.54, end: 15, text }]);
    assert.equal(groups.length, 1);
    if (id === null) id = groups[0].id;
    assert.equal(groups[0].id, id, "id must not depend on the text");
    assert.notEqual(groups[0].version, lastVersion, "version must change");
    lastVersion = groups[0].version;
  }
});

test("the trailing group is a draft; earlier groups are final", () => {
  const groups = buildGroups([
    { start: 0, end: 2, text: "A finished sentence." },
    { start: 2.2, end: 4, text: "Another finished one." },
    { start: 4.2, end: 6, text: "Still growing" },
  ]);
  assert.deepEqual(
    groups.map((g) => g.final),
    [true, true, false]
  );
});

test("a fully loaded static file: every group except the last is final", () => {
  const cues = Array.from({ length: 5 }, (_, i) => ({
    start: i * 2,
    end: i * 2 + 1.8,
    text: `Sentence number ${i + 1}.`,
  }));
  const groups = buildGroups(cues);
  assert.equal(groups.length, 5);
  assert.equal(groups.filter((g) => g.final).length, 4);
});

test("textHash is stable and collision-distinct on close strings", () => {
  assert.equal(textHash("abc"), textHash("abc"));
  assert.notEqual(textHash("abc"), textHash("abd"));
});
