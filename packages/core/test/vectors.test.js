// Drift guard for the shared Swift/JS test vectors: the committed JSON
// must always match what the current JS engine produces. If this fails,
// re-run `node packages/core/scripts/export-vectors.mjs` and make sure
// the Swift port (apps/macos/VoxylioKit) still passes `swift test`.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildVectors } from "../scripts/export-vectors.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const FILE = join(
  ROOT,
  "apps/macos/VoxylioKit/Tests/VoxylioKitTests/Fixtures/vectors.json",
);

test("committed shared vectors match the current engine", () => {
  const committed = JSON.parse(readFileSync(FILE, "utf8"));
  assert.deepEqual(committed, buildVectors());
});
