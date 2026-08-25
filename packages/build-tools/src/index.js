// Shared extension builder. Every platform build calls this with its own
// output directory and manifest overrides — the engine sources and static
// assets stay single-sourced in apps/chrome.
import { build } from "esbuild";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BANNER =
  "// GENERATED FILE — do not edit. Source: apps/chrome/src (pnpm build).";

/**
 * @param {object} opts
 * @param {string} opts.srcDir     entry scripts (content.js, background.js, popup.js)
 * @param {string} opts.staticDir  manifest.json, popup.html, icons/
 * @param {string} opts.outDir     build destination
 * @param {string} opts.target     esbuild target (e.g. "chrome120", "firefox121")
 * @param {(manifest: object) => object} [opts.transformManifest]
 */
export async function buildExtension({
  srcDir,
  staticDir,
  outDir,
  target,
  transformManifest,
}) {
  mkdirSync(outDir, { recursive: true });

  for (const entry of ["content.js", "background.js", "popup.js", "app.js"]) {
    if (!existsSync(join(srcDir, entry))) continue;
    await build({
      entryPoints: [join(srcDir, entry)],
      bundle: true,
      format: "iife",
      target: [target],
      outfile: join(outDir, entry),
      banner: { js: BANNER },
      legalComments: "none",
      logLevel: "warning",
    });
  }

  let manifest = JSON.parse(
    readFileSync(join(staticDir, "manifest.json"), "utf8")
  );
  if (transformManifest) manifest = transformManifest(manifest);
  writeFileSync(
    join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );

  cpSync(join(staticDir, "popup.html"), join(outDir, "popup.html"));
  cpSync(join(staticDir, "icons"), join(outDir, "icons"), { recursive: true });
  for (const optional of ["app.html", "_locales"]) {
    const src = join(staticDir, optional);
    if (existsSync(src)) cpSync(src, join(outDir, optional), { recursive: true });
  }
}
