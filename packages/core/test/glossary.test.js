import { test } from "node:test";
import assert from "node:assert/strict";
import { protectTerms, restoreTerms } from "@voxylio/core";

test("protect/restore keeps technical terms verbatim", () => {
  const src = "Open the playground and write a prompt for the agent.";
  const { protectedText, found } = protectTerms(src);
  assert.equal(found.length, 3);
  assert.ok(!/playground|prompt|agent/i.test(protectedText));
  // simulate a translation that keeps placeholders
  const translated = protectedText
    .replace("Open the", "Ouvre le")
    .replace("and write a", "et écris un")
    .replace("for the", "pour l'");
  const { restored, ok } = restoreTerms(translated, found);
  assert.ok(ok);
  assert.ok(restored.includes("playground"));
  assert.ok(restored.includes("prompt"));
  assert.ok(restored.includes("agent"));
});

test("restore reports failure when the engine mangles placeholders", () => {
  const { protectedText, found } = protectTerms("Deploy the build now.");
  assert.equal(found.length, 2);
  const mangled = protectedText.replace(/⟦0⟧/, "<0>");
  const { ok } = restoreTerms(mangled, found);
  assert.ok(!ok);
});

test("multi-word terms are protected as one unit", () => {
  const { found } = protectTerms("Do a code review of the pull request.");
  assert.deepEqual(
    found.map((f) => f.toLowerCase()),
    ["code review", "pull request"]
  );
});
