import test from "node:test";
import assert from "node:assert/strict";
import { createTranslatorChain } from "../src/translation.js";
import { validateSettings, DEFAULTS } from "../src/settings.js";

const mkProvider = (id, kind, impl) => ({
  id,
  kind,
  ready: () => Promise.resolve({ translate: impl }),
});

test("chain forwards opts (context) to the provider's translate", async () => {
  let seen = null;
  const pro = mkProvider("pro", "pro", async (text, opts) => {
    seen = opts;
    return "[pro] " + text;
  });
  const chain = createTranslatorChain([pro]);
  const ctx = { context: { before: ["a", "b"], after: ["c"] } };
  const res = await chain.translate("hello", "en", "fr", ctx);
  assert.equal(res.text, "[pro] hello");
  assert.equal(res.kind, "pro");
  assert.deepEqual(seen, ctx);
});

test("a failing pro provider falls through to local, dubbing continues", async () => {
  const pro = mkProvider("pro", "pro", async () => {
    throw new Error("quota exhausted");
  });
  const local = mkProvider("builtin", "local", async (text) => "[local] " + text);
  const chain = createTranslatorChain([pro, local]);
  const res = await chain.translate("hello", "en", "fr");
  assert.equal(res.text, "[local] hello");
  assert.equal(res.kind, "local");
});

test("proTranslation is a validated boolean, defaulting off", () => {
  assert.equal(DEFAULTS.proTranslation, false);
  assert.deepEqual(validateSettings({ proTranslation: 1 }), { proTranslation: true });
  assert.deepEqual(validateSettings({ proTranslation: false }), { proTranslation: false });
});
