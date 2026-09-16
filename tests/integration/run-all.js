// Runs every content-script integration harness against the BUILT bundle
// in /extension. Build first: pnpm build:chrome.
const { spawnSync } = require('child_process');
const path = require('path');

try {
  require.resolve('playwright');
} catch {
  console.error('Playwright is not installed. Run: pnpm install && pnpm exec playwright install chromium');
  process.exit(1);
}

const suites = [
  ['run-progressive.js', 'progressive + sliding-window captions (repetition bug)'],
  ['run.js', 'language switch mid-playback (en→fr→es)'],
  ['run-source.js', 'source detection (fr→en) + same-language silence'],
  ['run-roll.js', 'roll-up captions + playbackRate ×1.5'],
  ['run-gate.js', 'account gate: silent signed out, live unlock on link'],
  ['run-dom.js', 'DOM captions survive an empty native TextTrack'],
  ['run-yt-static.js', 'YouTube static track: lines on cue, no stalls, no forced CC'],
  ['run-plan.js', 'plan gate: expired free silent on Pro-only sites, trial and Pro dub'],
  ['run-cloud-voice.js', 'Pro voice: ahead-of-time MP3 decode and gap-free starts'],
  ['run-cloud-watchdog.js', 'Pro voice: stalled fetch releases chronological barrier'],
  ['run-audio-start-race.js', 'Pro audio: stale grant cannot create a second capture session'],
  ['run-translation-order.js', 'reversed translation latency: chronological voice order + pause/resume'],
  ['run-source-track-switch.js', 'sourceLang EN -> FR reselects one TextTrack without mixing'],
  ['run-static-source-race.js', 'stale static response ignored after source-language switch'],
  ['run-dom-seek.js', 'identical DOM caption is spoken once again after seek'],
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
