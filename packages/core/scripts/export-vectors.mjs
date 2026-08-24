// Shared engine test vectors: computed by the JS engine (the reference
// implementation) and consumed by BOTH `node --test` (drift guard) and
// `swift test` in apps/macos/VoxylioKit (parity guard). A behavior change
// re-runs this script once; both sides follow.
//
//   node packages/core/scripts/export-vectors.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildGroups,
  cleanCaption,
  computeUtteranceRate,
  endsSentence,
  mergeRollup,
  protectTerms,
  restoreTerms,
  textHash,
  wordOverlap,
} from "../src/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

export function buildVectors() {
  const textHashCases = [
    "",
    "Welcome",
    "Welcome to the accelerated coding course.",
    "Nous allons faire cela en utilisant un playground.",
    "É bom té-lo aqui! ♪",
  ].map((input) => ({ input, expected: textHash(input) }));

  const wordOverlapCases = [
    { a: "Now we will explore the playground", b: "explore the playground together in depth", minWords: 2 },
    { a: "Welcome to the course", b: "to the course of coding", minWords: 2 },
    { a: "hello world", b: "completely different", minWords: 2 },
    { a: "one two three", b: "three four", minWords: 2 },
    { a: "one two three", b: "three four", minWords: 1 },
    { a: "A B, c d!", b: "c d e f", minWords: 2 },
  ].map((c) => ({ ...c, expected: wordOverlap(c.a, c.b, c.minWords) }));

  const mergeRollupCases = [
    { last: { text: "Welcome", end: 4.2 }, start: 0.4, end: 4.2, text: "Welcome to the accelerated" },
    { last: { text: "Welcome to the accelerated", end: 4.2 }, start: 0.4, end: 4.2, text: "Welcome to the accelerated coding course." },
    { last: { text: "Now we will explore the playground", end: 6.6 }, start: 5.4, end: 7.6, text: "explore the playground together in depth" },
    { last: { text: "A full sentence here", end: 2.0 }, start: 5.0, end: 6.0, text: "Too late to merge" },
    { last: { text: "the tail of the sentence", end: 3.0 }, start: 3.1, end: 3.5, text: "of the sentence" },
    { last: null, start: 0, end: 1, text: "anything" },
  ].map((c) => ({ ...c, expected: mergeRollup(c.last, c.start, c.end, c.text) }));

  const buildGroupsCases = [
    {
      name: "two sentences split by punctuation",
      cues: [
        { start: 0.4, end: 2.0, text: "Welcome to the accelerated" },
        { start: 2.0, end: 4.2, text: "coding course." },
        { start: 4.6, end: 6.6, text: "Now we will explore the playground together in depth" },
      ],
    },
    {
      name: "gap closes a sentence",
      cues: [
        { start: 0, end: 1, text: "First part" },
        { start: 3.5, end: 4.5, text: "after a long silence" },
      ],
    },
    {
      name: "duplicated fragment extends without repeating",
      cues: [
        { start: 0, end: 2, text: "we will explore the playground" },
        { start: 1.5, end: 3, text: "the playground" },
      ],
    },
    {
      name: "sound cues and dashes are cleaned",
      cues: [
        { start: 0, end: 1.5, text: "[Music] - Hello everyone (applause)" },
        { start: 1.5, end: 3, text: "the API (introduced in v2) is here." },
      ],
    },
  ].map((c) => ({ ...c, expected: buildGroups(c.cues) }));

  const pacingCases = [
    { text: "a short line", cueDur: 4, baseRate: 1.1, playbackRate: 1 },
    { text: "this is a very long translated sentence that clearly cannot fit inside its short segment at all", cueDur: 3, baseRate: 1.1, playbackRate: 1 },
    { text: "this is a very long translated sentence that clearly cannot fit inside its short segment at all", cueDur: 3, baseRate: 1.1, playbackRate: 1.5 },
    { text: "tiny", cueDur: 0.3, baseRate: 1.4, playbackRate: 2 },
    { text: "six words in this exact sentence", cueDur: 2, baseRate: 1.0, playbackRate: 1 },
  ].map((c) => ({ ...c, expected: computeUtteranceRate(c) }));

  const glossaryCases = [
    "Open the playground and write a prompt.",
    "No protected words here.",
    "The agent explores the codebase before any commit.",
  ].map((input) => {
    const { protectedText, found } = protectTerms(input);
    // Simulate a translator that keeps placeholders intact.
    const translated = protectedText.replace("Open", "Ouvre").replace("write", "écris");
    const { restored, ok } = restoreTerms(translated, found);
    return { input, protectedText, found, translated, restored, ok };
  });

  const cleanCaptionCases = [
    "[Music] Hello there",
    "- Hi! (laughs)",
    "the API (introduced in v2) lets you…",
    "♪♪ la la ♪♪",
    "  spaced   out  ",
  ].map((input) => ({ input, expected: cleanCaption(input) }));

  const endsSentenceCases = [
    "Done.",
    "Done!",
    "Really?",
    "wait…",
    'He said "stop."',
    "not finished",
    "trailing.)",
  ].map((input) => ({ input, expected: endsSentence(input) }));

  return {
    generator: "packages/core/scripts/export-vectors.mjs",
    textHash: textHashCases,
    wordOverlap: wordOverlapCases,
    mergeRollup: mergeRollupCases,
    buildGroups: buildGroupsCases,
    pacing: pacingCases,
    glossary: glossaryCases,
    cleanCaption: cleanCaptionCases,
    endsSentence: endsSentenceCases,
  };
}

const isMain = process.argv[1] && import.meta.url === new URL("file://" + resolve(process.argv[1])).href;
if (isMain) {
  const out = join(ROOT, "apps/macos/VoxylioKit/Tests/VoxylioKitTests/Fixtures/vectors.json");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(buildVectors(), null, 2) + "\n");
  console.log("→", out);
}
