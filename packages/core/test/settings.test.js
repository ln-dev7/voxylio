import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULTS,
  SETTINGS_VERSION,
  migrateSettings,
  normalizeHost,
  validateSettings,
} from "../src/settings.js";

test("validateSettings drops unknown keys and coerces types", () => {
  const out = validateSettings({
    enabled: 1,
    rate: "9",
    duck: 999,
    targetLang: "xx",
    provider: "hacker",
    evil: true,
  });
  assert.equal(out.enabled, true);
  assert.equal(out.rate, 1.6); // clamped
  assert.equal(out.duck, 60); // clamped
  assert.equal(out.targetLang, DEFAULTS.targetLang);
  assert.equal(out.provider, "auto");
  assert.ok(!("evil" in out));
});

test("validateSettings normalizes and dedupes disabled sites", () => {
  const out = validateSettings({
    disabledSites: [
      "https://www.YouTube.com/watch?v=1",
      "youtube.com",
      "  udemy.com  ",
      "not a host!!",
      "",
    ],
  });
  assert.deepEqual(out.disabledSites, ["youtube.com", "udemy.com"]);
});

test("normalizeHost handles urls, ports and www", () => {
  assert.equal(normalizeHost("https://www.Example.com:8080/x"), "example.com");
  assert.equal(normalizeHost("player.vimeo.com"), "player.vimeo.com");
  assert.equal(normalizeHost("!!"), "");
});

test("migrateSettings fills v1 payloads and flags the write-back", () => {
  const v1 = { enabled: true, rate: 1.2, targetLang: "es" }; // pre-provider era
  const { settings, changed } = migrateSettings(v1);
  assert.equal(changed, true);
  assert.equal(settings.v, SETTINGS_VERSION);
  assert.equal(settings.enabled, true);
  assert.equal(settings.rate, 1.2);
  assert.equal(settings.targetLang, "es");
  assert.equal(settings.provider, "auto");
  assert.deepEqual(settings.disabledSites, []);
});

test("migrateSettings is a no-op for a complete current payload", () => {
  const { settings } = migrateSettings(null);
  const again = migrateSettings(settings);
  assert.equal(again.changed, false);
  assert.deepEqual(again.settings, settings);
});
