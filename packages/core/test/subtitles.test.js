import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseVTT,
  parseTimestamp,
  cleanCaption,
  stripTags,
  endsSentence,
} from "@voxylio/core";

test("parseVTT: WebVTT with ids, tags, settings and multi-line cues", () => {
  const vtt = `WEBVTT

1
00:00:01.000 --> 00:00:04.500
Hello, and <b>welcome</b> to the
course.

00:00:04.500 --> 00:00:08.200 align:center
In this lesson we'll explore context management.

NOTE a comment block

00:12.900 --> 00:15,100
Short timestamp &amp; comma decimals.
`;
  const cues = parseVTT(vtt);
  assert.equal(cues.length, 3);
  assert.equal(cues[0].text, "Hello, and welcome to the course.");
  assert.equal(cues[1].end, 8.2);
  assert.ok(Math.abs(cues[2].start - 12.9) < 1e-9);
  assert.equal(cues[2].text, "Short timestamp & comma decimals.");
});

test("parseVTT: SRT format (counters + comma decimals)", () => {
  const srt = `1
00:00:01,000 --> 00:00:03,000
First line.

2
00:00:03,500 --> 00:00:05,000
Second line.
`;
  const cues = parseVTT(srt);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].start, 1);
  assert.equal(cues[1].text, "Second line.");
});

test("parseTimestamp handles hours, and rejects garbage", () => {
  assert.equal(parseTimestamp("01:02:03.500"), 3723.5);
  assert.equal(parseTimestamp("02:03,5"), 123.5);
  assert.equal(parseTimestamp("nonsense"), null);
});

test("cleanCaption strips sound cues but keeps informative parentheses", () => {
  assert.equal(cleanCaption("[Music] Hello there"), "Hello there");
  assert.equal(cleanCaption("(APPLAUSE) Welcome"), "Welcome");
  assert.equal(cleanCaption("(applause) Welcome"), "Welcome");
  assert.equal(
    cleanCaption("the API (introduced in v2) lets you do it"),
    "the API (introduced in v2) lets you do it"
  );
  assert.equal(cleanCaption("- Hi everyone ♪♪"), "Hi everyone");
});

test("stripTags flattens markup and entities", () => {
  assert.equal(stripTags("a <c.color>styled</c> &amp; nested <b>b</b>"), "a styled & nested b");
});

test("endsSentence detects terminal punctuation with closers", () => {
  assert.ok(endsSentence("Done."));
  assert.ok(endsSentence('He said "stop!"'));
  assert.ok(!endsSentence("still going"));
});
