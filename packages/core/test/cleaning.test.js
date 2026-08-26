// The ingestion-side cleaning pipeline: what may NEVER reach a
// translator, a quota meter, or a voice — and what must always survive.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  stripTags,
  decodeEntities,
  cleanCaption,
  isSoundCue,
  endsSentence,
  continuesEllipsis,
  buildGroups,
} from "@voxylio/core";

test("decodeEntities handles numeric, hex and named entities", () => {
  assert.equal(decodeEntities("I&#39;m &quot;here&quot;"), 'I\'m "here"');
  assert.equal(decodeEntities("a &lt; b &gt; c &amp; d"), "a < b > c & d");
  assert.equal(decodeEntities("wait&hellip; &#x2014; ok"), "wait… — ok");
  assert.equal(decodeEntities("&unknown; stays"), "&unknown; stays");
});

test("stripTags removes ASS/SSA overrides and decodes entities", () => {
  assert.equal(stripTags("{\\an8}Top text"), "Top text");
  assert.equal(stripTags("{\\i1}slanted{\\i0} word"), "slanted word");
  assert.equal(stripTags("It&#39;s <i>fine</i>"), "It's fine");
  // Real braces in speech are preserved (only {\…} is ASS syntax).
  assert.equal(stripTags("a set {1, 2}"), "a set {1, 2}");
});

test("isSoundCue: all-caps Latin yes, unicameral scripts never", () => {
  assert.ok(isSoundCue("MUSIC PLAYING"));
  assert.ok(isSoundCue("..."));
  assert.ok(isSoundCue("laughs"));
  assert.ok(isSoundCue("téléphone qui sonne"));
  // Japanese / Russian / Arabic parenthetical speech must SURVIVE.
  assert.ok(!isSoundCue("こんにちは"));
  assert.ok(!isSoundCue("привет всем"));
  assert.ok(!isSoundCue("مرحبا بالجميع"));
  assert.ok(!isSoundCue("introduced in v2"));
});

test("cleanCaption drops lyric cues entirely", () => {
  assert.equal(cleanCaption("♪ Never gonna give you up ♪"), "");
  assert.equal(cleanCaption("♪ We are the champions"), "");
  assert.equal(cleanCaption("# sweet dreams are made of this #"), "");
  // Mid-text glyphs are stripped, speech kept (existing behavior).
  assert.equal(cleanCaption("- Hi everyone ♪♪"), "Hi everyone");
});

test("cleanCaption strips bracket remnants split across cues", () => {
  assert.equal(cleanCaption("[MUSIC"), "");
  assert.equal(cleanCaption("PLAYING] Hello there"), "Hello there");
  assert.equal(cleanCaption("(LAUGHING"), "");
  // An informative parenthesis spilling over stays.
  assert.equal(
    cleanCaption("the API (introduced in v2"),
    "the API (introduced in v2"
  );
});

test("cleanCaption strips speaker labels and >> markers", () => {
  assert.equal(cleanCaption(">> JOHN: Hello everyone."), "Hello everyone.");
  assert.equal(cleanCaption("MAN 1: Who's there?"), "Who's there?");
  assert.equal(cleanCaption("- SARAH: On y va."), "On y va.");
  // Lowercase colons are real speech, not labels.
  assert.equal(cleanCaption("Attention: c'est chaud."), "Attention: c'est chaud.");
});

test("endsSentence knows CJK/Arabic punctuation and abbreviations", () => {
  assert.ok(endsSentence("こんにちは。"));
  assert.ok(endsSentence("好了！"));
  assert.ok(endsSentence("ما اسمك؟"));
  assert.ok(endsSentence("It's 3 p.m."));
  assert.ok(!endsSentence("Please welcome Dr."));
  assert.ok(!endsSentence("Voici M."));
});

test("ellipsis continuations keep one sentence together", () => {
  assert.ok(continuesEllipsis("I was going to...", "say something"));
  assert.ok(continuesEllipsis("I was going to…", "…say something"));
  assert.ok(!continuesEllipsis("I was going to...", "Then he left."));
  assert.ok(!continuesEllipsis("Done.", "next"));
  const groups = buildGroups([
    { start: 0, end: 2, text: "I was going to..." },
    { start: 2.2, end: 4, text: "say something important." },
  ]);
  assert.equal(groups.length, 1);
  assert.match(groups[0].text, /going to\.\.\. say something/);
});

test("letterless cues never become groups", () => {
  const groups = buildGroups([
    { start: 0, end: 1, text: "..." },
    { start: 1, end: 2, text: "1:23" },
    { start: 2, end: 4, text: "Real speech here." },
    { start: 4, end: 5, text: "???" },
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].text, "Real speech here.");
});

test("same-start groups get distinct, stable ids", () => {
  const cues = [
    { start: 10, end: 12, text: "First speaker line." },
    { start: 10, end: 12, text: "Second speaker line." },
    { start: 13, end: 14, text: "Later line." },
  ];
  const groups = buildGroups(cues);
  assert.equal(groups.length, 3);
  const ids = groups.map((g) => g.id);
  assert.equal(new Set(ids).size, 3);
  // Rebuilding from the same cues yields the SAME ids (stability).
  const again = buildGroups(cues).map((g) => g.id);
  assert.deepEqual(again, ids);
});
