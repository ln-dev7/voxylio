// Firefox build → apps/firefox/dist.
// Gecko differences handled here (never in the engine):
//  - MV3 background is an event page ("scripts"), not a service worker
//  - browser_specific_settings.gecko is required for signing/AMO
//  - Chrome's built-in Translator/LanguageDetector APIs do not exist:
//    the engine already feature-detects them and uses the online fallback.
import { buildExtension } from "@voxylio/build-tools";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const chrome = join(here, "..", "chrome");

await buildExtension({
  srcDir: join(chrome, "src"),
  staticDir: join(chrome, "static"),
  outDir: join(here, "dist"),
  target: "firefox115",
  transformManifest: (m) => {
    const manifest = {
      ...m,
      background: { scripts: ["background.js"] },
      browser_specific_settings: {
        gecko: {
          id: "voxylio@lndev.me",
          strict_min_version: "140.0",
          data_collection_permissions: { required: ["none"] },
        },
      },
    };
    // Firefox does not support externally_connectable (addons-linter
    // warns on every submission); the content-script relay carries the
    // account link there instead.
    delete manifest.externally_connectable;
    return manifest;
  },
});
console.log("Firefox extension built into apps/firefox/dist");
