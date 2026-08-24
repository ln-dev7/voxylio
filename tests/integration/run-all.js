// Runs every content-script integration harness against the BUILT bundle
// in /extension. Build first: pnpm build:chrome.
const { spawnSync } = require('child_process');
const path = require('path');

const suites = [
  ['run.js', 'language switch mid-playback (en→fr→es)'],
  ['run-source.js', 'source detection (fr→en) + same-language silence'],
  ['run-roll.js', 'roll-up captions + playbackRate ×1.5'],
];
let failed = 0;
for (const [file, label] of suites) {
  console.log(`\n=== ${label} ===`);
  const r = spawnSync('node', [path.join(__dirname, file)], { stdio: 'inherit' });
  if (r.status !== 0) failed++;
}
if (failed) {
  console.error(`\n${failed} integration suite(s) failed`);
  process.exit(1);
}
console.log('\nAll integration suites passed');
