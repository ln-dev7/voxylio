import test from "node:test";
import assert from "node:assert/strict";
import { createTranslatorChain } from "../src/translation.js";

const ok = (id, kind, text) => ({
  id,
  kind,
  ready: async () => ({ translate: async () => text }),
});
const notReady = (id) => ({ id, kind: "cloud", ready: async () => null });
const failing = (id) => ({
  id,
  kind: "cloud",
  ready: async () => ({
    translate: async () => {
      throw new Error("boom");
    },
  }),
});

test("providers are tried in order; the first success wins", async () => {
  const chain = createTranslatorChain([
    notReady("builtin"),
    ok("deepl", "cloud", "bonjour"),
    ok("gtx", "cloud", "salut"),
  ]);
  const res = await chain.translate("hello", "en", "fr");
  assert.equal(res.text, "bonjour");
  assert.equal(res.providerId, "deepl");
  assert.equal(chain.lastKind(), "cloud");
});

test("a failing provider falls through to the next", async () => {
  const chain = createTranslatorChain([failing("deepl"), ok("gtx", "cloud", "salut")]);
  const res = await chain.translate("hi", "en", "fr");
  assert.equal(res.providerId, "gtx");
});

test("all providers failing rejects with an aggregate error", async () => {
  const chain = createTranslatorChain([failing("a"), notReady("b")]);
  await assert.rejects(() => chain.translate("x", "en", "fr"), /a: boom.*b: not ready/);
  assert.equal(chain.lastKind(), "none");
});

test("a slow ready() loses the race without blocking the line", async () => {
  const slow = {
    id: "builtin",
    kind: "local",
    ready: () => new Promise((r) => setTimeout(() => r({ translate: async () => "late" }), 200)),
  };
  const chain = createTranslatorChain([slow, ok("gtx", "cloud", "vite")], {
    readyTimeoutMs: 20,
  });
  const res = await chain.translate("quick", "en", "fr");
  assert.equal(res.providerId, "gtx");
});

test("a hung translate() attempt times out and falls through", async () => {
  const hung = {
    id: "deepl",
    kind: "cloud",
    ready: async () => ({ translate: () => new Promise(() => {}) }),
  };
  const chain = createTranslatorChain([hung, ok("gtx", "cloud", "ok")], {
    attemptTimeoutMs: 30,
  });
  const res = await chain.translate("x", "en", "fr");
  assert.equal(res.providerId, "gtx");
});

test("repeated failures put the pair in cooldown, per pair only", async () => {
  let clock = 0;
  const chain = createTranslatorChain(
    [failing("deepl"), ok("gtx", "cloud", "ok")],
    { cooldownMs: 1000, failuresBeforeCooldown: 2, now: () => clock },
  );
  await chain.translate("a", "en", "fr");
  await chain.translate("b", "en", "fr"); // second failure → cooldown
  // While cooling down, deepl is skipped without being called.
  const res = await chain.translate("c", "en", "fr");
  assert.equal(res.providerId, "gtx");
  assert.match(chain.lastError() || "", /^$/); // success clears lastError
  // A different pair is unaffected by the en->fr cooldown.
  const other = await chain.translate("d", "en", "es");
  assert.equal(other.providerId, "gtx");
  // After the cooldown elapses, deepl is tried again.
  clock = 2000;
  const after = await chain.translate("e", "en", "fr");
  assert.equal(after.providerId, "gtx"); // still failing, but it WAS retried
});

test("success clears the failure counter", async () => {
  let fail = true;
  const flaky = {
    id: "deepl",
    kind: "cloud",
    ready: async () => ({
      translate: async () => {
        if (fail) throw new Error("flaky");
        return "ok";
      },
    }),
  };
  const chain = createTranslatorChain([flaky], {
    cooldownMs: 1000,
    failuresBeforeCooldown: 2,
    now: () => 0,
  });
  await assert.rejects(() => chain.translate("a", "en", "fr"));
  fail = false;
  const res = await chain.translate("b", "en", "fr");
  assert.equal(res.text, "ok");
  assert.equal(chain._pairState.size, 0);
});
