// Chrome build: bundle the engine into /extension, the folder users load
// unpacked (and the folder zipped for the Chrome Web Store). Never edit
// /extension .js files by hand — they are generated from apps/chrome/src.
import { build } from "esbuild";
import { cpSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "..", "extension");
mkdirSync(out, { recursive: true });

const banner =
  "// GENERATED FILE — do not edit. Source: apps/chrome/src (pnpm build:chrome).";

for (const entry of ["content.js", "background.js", "popup.js"]) {
  await build({
    entryPoints: [join(here, "src", entry)],
    bundle: true,
    format: "iife",
    target: ["chrome120"],
    outfile: join(out, entry),
    banner: { js: banner },
    legalComments: "none",
    logLevel: "warning",
  });
}

for (const asset of ["manifest.json", "popup.html"]) {
  cpSync(join(here, "static", asset), join(out, asset));
}
cpSync(join(here, "static", "icons"), join(out, "icons"), { recursive: true });
console.log("Chrome extension built into /extension");
