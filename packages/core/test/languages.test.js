import test from "node:test";
import assert from "node:assert/strict";
import {
  LANGUAGES,
  LANGUAGE_CODES,
  PRIMARY_LOCALE,
  pickVoice,
} from "../src/index.js";

test("catalog integrity: unique codes, primary locale for every language", () => {
  assert.ok(LANGUAGE_CODES.length >= 65, `expected 65+, got ${LANGUAGE_CODES.length}`);
  assert.equal(new Set(LANGUAGE_CODES).size, LANGUAGE_CODES.length);
  for (const { code, name, english } of LANGUAGES) {
    assert.ok(PRIMARY_LOCALE[code], `missing primary locale for ${code}`);
    assert.ok(name && english, `missing names for ${code}`);
  }
});

test("pickVoice accepts platform alias prefixes (no → nb-NO, tl → fil-PH)", () => {
  const voices = [
    { name: "Nora", lang: "nb-NO", localService: true },
    { name: "Amelie", lang: "fr-FR", localService: true },
    { name: "Blessica", lang: "fil-PH", localService: true },
  ];
  assert.equal(pickVoice(voices, { targetLang: "no" })?.name, "Nora");
  assert.equal(pickVoice(voices, { targetLang: "tl" })?.name, "Blessica");
  assert.equal(pickVoice(voices, { targetLang: "de" }), null);
});
