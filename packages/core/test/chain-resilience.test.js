// Chain resilience: ready-timeout streaks, empty results, shared pair
// state across rebuilds, detected-source passthrough.
import test from "node:test";
import assert from "node:assert/strict";
import { createTranslatorChain } from "../src/translation.js";

const ok = (id, kind, text) => ({
  id,
  kind,
  ready: async () => ({ translate: async () => text }),
});

test("two consecutive ready timeouts cool the pair down", async () => {
  let clock = 0;
  let readyCalls = 0;
  const stuck = {
    id: "builtin",
    kind: "local",
    ready: () => {
      readyCalls++;
      return new Promise(() => {}); // model download that never ends
    },
  };
  const chain = createTranslatorChain([stuck, ok("gtx", "cloud", "ok")], {
    readyTimeoutMs: 10,
    cooldownMs: 1000,
    now: () => clock,
  });
  await chain.translate("a", "en", "fr"); // miss 1
  await chain.translate("b", "en", "fr"); // miss 2 → cooldown
  await chain.translate("c", "en", "fr"); // skipped: no ready() call
  assert.equal(readyCalls, 2);
  clock = 2000; // cooldown over: tried again
  await chain.translate("d", "en", "fr");
  assert.equal(readyCalls, 3);
});

test("an empty result moves on without penalizing the provider", async () => {
  const empty = ok("deepl", "cloud", "   ");
  const chain = createTranslatorChain([empty, ok("gtx", "cloud", "réel")], {
    failuresBeforeCooldown: 1, // any recorded failure would cool down
    now: () => 0,
  });
  const res = await chain.translate("x", "en", "fr");
  assert.equal(res.text, "réel");
  // deepl was NOT put in cooldown: it is tried again next time.
  const res2 = await chain.translate("y", "en", "fr");
  assert.equal(res2.providerId, "gtx");
  assert.equal(chain._pairState.size, 0);
});

test("pairState survives a chain rebuild (cooldowns keep cooling)", async () => {
  let clock = 0;
  const shared = new Map();
  const failing = {
    id: "deepl",
    kind: "cloud",
    ready: async () => ({
      translate: async () => {
        throw new Error("down");
      },
    }),
  };
  const optsA = { pairState: shared, cooldownMs: 1000, failuresBeforeCooldown: 2, now: () => clock };
  const a = createTranslatorChain([failing, ok("gtx", "cloud", "ok")], optsA);
  await a.translate("a", "en", "fr");
  await a.translate("b", "en", "fr"); // → cooldown recorded in shared map
  // Rebuild (same shared map): deepl must STILL be skipped.
  let called = 0;
  const failingSpy = {
    id: "deepl",
    kind: "cloud",
    ready: async () => {
      called++;
      return { translate: async () => "never" };
    },
  };
  const b = createTranslatorChain([failingSpy, ok("gtx", "cloud", "ok")], optsA);
  const res = await b.translate("c", "en", "fr");
  assert.equal(res.providerId, "gtx");
  assert.equal(called, 0);
});

test("detected source is surfaced when the provider reports it", async () => {
  const gtx = {
    id: "gtx",
    kind: "cloud",
    ready: async () => ({
      translate: async () => ({ text: "bonjour", detected: "en" }),
    }),
  };
  const chain = createTranslatorChain([gtx]);
  const res = await chain.translate("hello", "auto", "fr");
  assert.equal(res.text, "bonjour");
  assert.equal(res.detected, "en");
});
