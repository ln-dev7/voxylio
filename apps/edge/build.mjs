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
  transformManifest: (m) => ({
    ...m,
    // Edge Add-ons listing guidelines favor a plain short description.
    description:
      "Double en temps réel les vidéos sous-titrées : traduction locale, voix synchronisée avec la lecture. FR, ES, IT, DE, PT.",
  }),
});
console.log("Edge extension built into apps/edge/dist");
