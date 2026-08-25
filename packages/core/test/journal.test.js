import test from "node:test";
import assert from "node:assert/strict";
import {
  JOURNAL_CAPS,
  journalAppendLine,
  journalUpsert,
  usageAdd,
  fmtTime,
  toTranscriptText,
  toSRT,
} from "../src/journal.js";
import {
  validateSettings,
  migrateSettings,
  DEFAULTS,
} from "../src/settings.js";

const S = (id, updatedAt, lines = []) => ({ id, updatedAt, lines });

test("journalAppendLine bounds the line count, dropping the oldest", () => {
  let s = S("a", 1);
  for (let i = 0; i < JOURNAL_CAPS.linesPerSession + 25; i++) {
    s = journalAppendLine(s, { t: i, src: "s" + i, dst: "d" + i, at: i });
  }
  assert.equal(s.lines.length, JOURNAL_CAPS.linesPerSession);
  assert.equal(s.lines[0].src, "s25"); // oldest dropped
  assert.equal(s.lines.at(-1).src, "s" + (JOURNAL_CAPS.linesPerSession + 24));
});

test("journalUpsert replaces by id, sorts newest first and caps", () => {
  let list = [];
  for (let i = 0; i < JOURNAL_CAPS.sessions + 10; i++) {
    list = journalUpsert(list, S("s" + i, i));
  }
  assert.equal(list.length, JOURNAL_CAPS.sessions);
  assert.equal(list[0].id, "s" + (JOURNAL_CAPS.sessions + 9)); // newest kept first
  // Updating an existing session must not duplicate it.
  const updated = journalUpsert(list, { ...list[3], updatedAt: 10_000 });
  assert.equal(updated.filter((s) => s.id === list[3].id).length, 1);
  assert.equal(updated[0].id, list[3].id);
});

test("usageAdd aggregates per day and per language, trims old days", () => {
  let stats = null;
  stats = usageAdd(stats, "2026-08-01", 30, 5, "fr");
  stats = usageAdd(stats, "2026-08-01", 10, 2, "es");
  stats = usageAdd(stats, "2026-08-02", 5, 1, "fr");
  assert.deepEqual(stats.days["2026-08-01"], { s: 40, l: 7 });
  assert.equal(stats.langs.fr, 6);
  assert.equal(stats.totalS, 45);
  assert.equal(stats.totalL, 8);
  // Trim: only the newest N day keys survive.
  for (let d = 1; d <= JOURNAL_CAPS.days + 5; d++) {
    stats = usageAdd(stats, "2026-09-" + String(d).padStart(2, "0"), 1, 1, "fr");
  }
  assert.ok(Object.keys(stats.days).length <= JOURNAL_CAPS.days);
  assert.ok(!("2026-08-01" in stats.days)); // oldest gone
});

test("fmtTime and transcript modes", () => {
  assert.equal(fmtTime(65), "01:05");
  assert.equal(fmtTime(3671), "1:01:11");
  const session = S("x", 1, [
    { t: 1, src: "Hello there.", dst: "Bonjour." },
    { t: 5, src: "Bye.", dst: "Au revoir." },
  ]);
  assert.equal(
    toTranscriptText(session, "translation"),
    "[00:01] Bonjour.\n[00:05] Au revoir.",
  );
  assert.equal(
    toTranscriptText(session, "original", false),
    "Hello there.\nBye.",
  );
  assert.match(toTranscriptText(session, "bilingual"), /Hello there\.\n\s+Bonjour\./);
});

test("toSRT ends each cue at the next start, bounded", () => {
  const session = S("x", 1, [
    { t: 0, src: "a", dst: "A" },
    { t: 2.5, src: "b", dst: "B" },
    { t: 30, src: "c", dst: "C" }, // big gap: capped at +6 s
  ]);
  const srt = toSRT(session);
  assert.match(srt, /1\n00:00:00,000 --> 00:00:02,500\nA\n/);
  assert.match(srt, /2\n00:00:02,500 --> 00:00:08,500\nB\n/); // capped
  assert.match(srt, /3\n00:00:30,000 --> 00:00:34,000\nC\n/); // last +4 s
});

test("voiceByLang validates as a bounded lang→name map", () => {
  const out = validateSettings({
    voiceByLang: { fr: "Amélie", xx: "Nope", es: 42, de: "Anna" },
  });
  assert.deepEqual(out.voiceByLang, { fr: "Amélie", de: "Anna" });
  // Migration keeps existing choices and fills the default.
  const { settings } = migrateSettings({ v: 2, voiceName: "Amélie" });
  assert.deepEqual(settings.voiceByLang, {});
  assert.equal(settings.voiceName, "Amélie");
  assert.deepEqual(DEFAULTS.voiceByLang, {});
});
