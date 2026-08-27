// Store release packager. Builds every dist and produces the zips the
// stores expect under dist-store/. NEVER uploads anywhere — publication
// is a manual owner action, by design.
//
//   node scripts/release.mjs            # all targets
//   node scripts/release.mjs chrome     # one target: chrome|edge|firefox|source
//
// The single version source is apps/chrome/static/manifest.json.
import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
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

// Keep only the two most recent versions in dist-store — older zips are
// re-buildable from git history and just pile up (owner request).
function pruneOldVersions() {
  const zips = readdirSync(OUT).filter((f) =>
    /^voxylio-[a-z]+-\d+\.\d+\.\d+\.zip$/.test(f),
  );
  const versions = [...new Set(zips.map((f) => f.match(/(\d+\.\d+\.\d+)/)[1]))];
  versions.sort((a, b) => {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2];
  });
  for (const v of versions.slice(0, -2)) {
    for (const f of zips.filter((z) => z.includes(`-${v}.`))) {
      rmSync(join(OUT, f), { force: true });
      console.log("pruned", f);
    }
  }
}
pruneOldVersions();
console.log(`\nRelease ${VERSION} packaged in dist-store/ — upload manually.`);
