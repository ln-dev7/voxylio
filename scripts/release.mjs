// Store release packager. Builds every dist and produces the zips the
// stores expect under dist-store/. NEVER uploads anywhere — publication
// is a manual owner action, by design.
//
//   node scripts/release.mjs            # all targets
//   node scripts/release.mjs chrome     # one target: chrome|edge|firefox|source
//
// The single version source is apps/chrome/static/manifest.json.
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const OUT = join(ROOT, "dist-store");
const manifest = JSON.parse(
  readFileSync(join(ROOT, "apps/chrome/static/manifest.json"), "utf8"),
);
const VERSION = manifest.version;

const sh = (cmd, cwd = ROOT) => execSync(cmd, { cwd, stdio: "inherit" });

function zipDir(srcDir, zipPath, excludes = []) {
  rmSync(zipPath, { force: true });
  const ex = excludes.map((e) => `-x '${e}'`).join(" ");
  sh(`zip -qr '${zipPath}' . ${ex}`, srcDir);
  console.log("→", zipPath);
}

const targets = {
  chrome() {
    sh("pnpm build:chrome");
    zipDir(join(ROOT, "extension"), join(OUT, `voxylio-chrome-${VERSION}.zip`), [
      "*.md",
    ]);
  },
  edge() {
    sh("pnpm build:edge");
    zipDir(join(ROOT, "apps/edge/dist"), join(OUT, `voxylio-edge-${VERSION}.zip`));
  },
  firefox() {
    sh("pnpm build:firefox");
    zipDir(
      join(ROOT, "apps/firefox/dist"),
      join(OUT, `voxylio-firefox-${VERSION}.zip`),
    );
    // AMO requires the source for bundled code (reviewers rebuild it —
    // see docs/BUILDING.md).
    targets.source();
  },
  source() {
    zipDir(ROOT, join(OUT, `voxylio-source-${VERSION}.zip`), [
      "node_modules/*",
      "*/node_modules/*",
      ".git/*",
      "dist-store/*",
      "site/.next/*",
      "site/node_modules/*",
      "apps/*/dist/*",
      "*.zip",
      ".DS_Store",
    ]);
  },
};

const arg = process.argv[2];
mkdirSync(OUT, { recursive: true });
if (arg && !targets[arg]) {
  console.error(`unknown target "${arg}" (chrome|edge|firefox|source)`);
  process.exit(1);
}
const list = arg ? [arg] : ["chrome", "edge", "firefox"];
for (const t of list) targets[t]();
console.log(`\nRelease ${VERSION} packaged in dist-store/ — upload manually.`);
