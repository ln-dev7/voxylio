// Edge build → apps/edge/dist. Edge runs Chromium MV3 extensions as-is;
// only the store listing differs. The manifest is injected per platform.
import { buildExtension } from "@voxylio/build-tools";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const chrome = join(here, "..", "chrome");

await buildExtension({
  srcDir: join(chrome, "src"),
  staticDir: join(chrome, "static"),
  outDir: join(here, "dist"),
  target: "chrome120", // Edge ≥ 120 tracks Chromium
  // Keep __MSG_appDesc__: the store listing text lives in Partner
  // Center, and a hardcoded French description showed untranslated in
  // edge://extensions for every non-French user.
  transformManifest: (m) => ({ ...m }),
});
console.log("Edge extension built into apps/edge/dist");
