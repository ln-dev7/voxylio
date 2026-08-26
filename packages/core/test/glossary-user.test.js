// User glossary: forced translations and keep-as-is terms through the
// placeholder mechanism — provider-agnostic by construction.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compileGlossary,
  protectTerms,
  restoreTerms,
  validateSettings,
} from "@voxylio/core";

test("compileGlossary: empty and invalid input yield null", () => {
  assert.equal(compileGlossary([]), null);
  assert.equal(compileGlossary(null), null);
  assert.equal(compileGlossary([{ from: "  " }]), null);
});

test("forced translation restores the target form", () => {
  const gl = compileGlossary([{ from: "the board", to: "le CA" }]);
  const { protectedText, found } = protectTerms(
    "We asked the board yesterday.",
    { builtin: false, glossary: gl }
  );
  assert.ok(!/board/.test(protectedText));
  assert.deepEqual(found, ["le CA"]);
  const { restored, ok } = restoreTerms(
    protectedText.replace("We asked", "Nous avons demandé au").replace("yesterday.", "hier."),
    found
  );
  assert.ok(ok);
  assert.ok(restored.includes("le CA"));
});

test("keep-as-is entry restores the source verbatim, case preserved", () => {
  const gl = compileGlossary([{ from: "Voxylio", to: "" }]);
  const { protectedText, found } = protectTerms("VOXYLIO is here", {
    builtin: false,
    glossary: gl,
  });
  assert.deepEqual(found, ["VOXYLIO"]);
  assert.ok(!/VOXYLIO/i.test(protectedText));
});

test("longest term wins and unicode boundaries work", () => {
  const gl = compileGlossary([
    { from: "pull", to: "tirer" },
    { from: "pull request", to: "" },
  ]);
  const { found } = protectTerms("Open the pull request now", {
    builtin: false,
    glossary: gl,
  });
  assert.deepEqual(found, ["pull request"]);
  const gl2 = compileGlossary([{ from: "café", to: "coffee shop" }]);
  const r = protectTerms("Le café est ouvert", { builtin: false, glossary: gl2 });
  assert.deepEqual(r.found, ["coffee shop"]);
  // "café" inside a longer word must not match
  const r2 = protectTerms("les cafés sont là", { builtin: false, glossary: gl2 });
  assert.equal(r2.found.length, 0);
});

test("glossary and keepTerms compose in one placeholder space", () => {
  const gl = compileGlossary([{ from: "Voxylio", to: "" }]);
  const { protectedText, found } = protectTerms(
    "Voxylio ships a new build",
    { builtin: true, glossary: gl }
  );
  assert.equal(found.length, 2); // Voxylio + build
  const { restored, ok } = restoreTerms(protectedText, found);
  assert.ok(ok);
  assert.equal(restored, "Voxylio ships a new build");
});

test("settings.glossary is validated: caps, dedup, shapes", () => {
  const v = validateSettings({
    glossary: [
      { from: " Voxylio ", to: "" },
      { from: "voxylio", to: "dup dropped" },
      { from: "", to: "no from" },
      "not an object",
      { from: "x".repeat(100), to: "y".repeat(100) },
    ],
  });
  assert.equal(v.glossary.length, 2);
  assert.deepEqual(v.glossary[0], { from: "Voxylio", to: "" });
  assert.equal(v.glossary[1].from.length, 40);
  assert.equal(v.glossary[1].to.length, 60);
  const many = validateSettings({
    glossary: Array.from({ length: 80 }, (_, i) => ({ from: "t" + i, to: "" })),
  });
  assert.equal(many.glossary.length, 50);
});
