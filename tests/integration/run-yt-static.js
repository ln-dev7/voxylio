const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const CONTENT = path.join(__dirname, '..', '..', 'extension', 'content.js');
const EXE = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
// Integration: YouTube STATIC track. The watch page embeds captionTracks;
// the engine must fetch the timedtext json3, adopt every cue upfront and
// speak each line ON its cue — continuous flow, no per-line stability or
// translation latency between phrases (the "says a sentence, stops,
// continues" bug), and no forced CC click since the DOM feed is unused.

(async () => {
  const browser = await chromium.launch({
    ...(EXE ? { executablePath: EXE } : {}),
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));

  const TIMEDTEXT = 'https://www.youtube.com/api/timedtext?v=abc&lang=en';
  const PAGE_HTML = `<!doctype html><html><head><meta charset="utf-8"></head>
  <body style="margin:0;background:#000">
    <div id="player">
      <video id="v" style="width:800px;height:450px;background:#111"></video>
      <div class="ytp-caption-window-container"></div>
      <button class="ytp-subtitles-button" aria-pressed="false" aria-label="Subtitles"></button>
    </div>
    <script>/*"captionTracks":[{"baseUrl":"${TIMEDTEXT.replace(/&/g, '\\u0026')}","name":{"runs":[{"text":"English"}]},"vssId":".en","languageCode":"en","isTranslatable":true}],"audioTracks":[]*/</script>
  </body></html>`;

  const JSON3 = JSON.stringify({
    events: [
      { tStartMs: 0, dDurationMs: 2500, segs: [{ utf8: 'Welcome to the accelerated coding course.' }] },
      { tStartMs: 3000, dDurationMs: 2500, segs: [{ utf8: 'Today we build a translator.' }] },
      { tStartMs: 6000, dDurationMs: 2500, segs: [{ utf8: 'It runs fully on your device.' }] },
      { tStartMs: 9000, dDurationMs: 2500, segs: [{ utf8: "Let's begin the first lesson." }] },
    ],
  });

  await page.route('https://www.youtube.com/watch?v=abc', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: PAGE_HTML }));
  await page.route('https://www.youtube.com/api/timedtext*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON3 }));

  await page.goto('https://www.youtube.com/watch?v=abc');

  await page.evaluate(() => {
    const listeners = [];
    const store = { enabled: true, rate: 1.0, duck: 12, voiceName: '', sourceLang: 'auto', targetLang: 'fr', subtitles: false, overlay: false };
    window.chrome = {
      storage: {
        sync: { get: (d, cb) => cb({ ...d, ...store }),
          set: (p) => { const ch = {}; for (const [k, v] of Object.entries(p)) { ch[k] = { newValue: v }; store[k] = v; } listeners.forEach((l) => l(ch, 'sync')); } },
        local: { get: (d, cb) => cb(d), set: () => {} },
        onChanged: { addListener: (l) => listeners.push(l) },
      },
      runtime: {
        id: 'test-extension',
        onMessage: { addListener: () => {} },
        getManifest: () => ({ version: 'test' }),
        sendMessage: (msg) => msg && msg.type === 'entitlements'
          ? Promise.resolve({ plan: 'free', status: 'none', linked: true })
          : new Promise((res) => setTimeout(() => res({ ok: true, text: `[fr] ${msg.text}` }), 100)),
      },
    };
    window.__spoken = []; // {text, at (wall ms), vt (video time)}
    window.__t0 = Date.now();
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: function (t) { this.text = t; }, configurable: true });
    const fake = { speaking: false, pending: false, _c: null,
      speak(u) {
        window.__spoken.push({ text: u.text, at: Date.now() - window.__t0, vt: document.getElementById('v').currentTime });
        this.speaking = true; this._c = u;
        u.onstart && u.onstart();
        u._t = setTimeout(() => { if (this._c === u) { this.speaking = false; this._c = null; } u.onend && u.onend(); }, 900);
      },
      cancel() { if (this._c) clearTimeout(this._c._t); this._c = null; this.speaking = false; },
      getVoices() { return [{ name: 'Voix FR', lang: 'fr-FR', localService: true }]; },
      onvoiceschanged: null };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  });

  await page.addScriptTag({ path: CONTENT });

  // Simulated playback: a real-time clock (1 video second per wall
  // second) so cue starts map to wall-clock and gaps are measurable.
  await page.evaluate(() => {
    const v = document.getElementById('v');
    const born = Date.now();
    Object.defineProperty(v, 'currentTime', { get: () => (Date.now() - born) / 1000, configurable: true });
    Object.defineProperty(v, 'paused', { get: () => false, configurable: true });
    Object.defineProperty(v, 'seeking', { get: () => false, configurable: true });
    Object.defineProperty(v, 'readyState', { get: () => 4, configurable: true });
    window.__ccClicked = false;
    document.querySelector('.ytp-subtitles-button').addEventListener('click', () => { window.__ccClicked = true; });
    v.dispatchEvent(new Event('play'));
  });

  await page.waitForTimeout(12500);

  const r = await page.evaluate(() => ({ spoken: window.__spoken, cc: window.__ccClicked }));
  await browser.close();

  console.log('CC forced:', r.cc);
  for (const s of r.spoken) console.log(`  vt=${s.vt.toFixed(2)}s  "${s.text}"`);

  const CUES = [
    [0, 'accelerated coding course'],
    [3, 'build a translator'],
    [6, 'on your device'],
    [9, 'first lesson'],
  ];
  const fails = [];
  if (r.cc) fails.push('CC button was clicked — static track should make the DOM feed (and its forced captions) unnecessary');
  if (r.spoken.length !== 4) fails.push(`expected exactly 4 lines, got ${r.spoken.length}`);
  if (!r.spoken.every((s) => s.text.startsWith('[fr]'))) fails.push('untranslated speech');
  for (const [start, marker] of CUES) {
    const hits = r.spoken.filter((s) => s.text.includes(marker));
    if (hits.length !== 1) { fails.push(`"${marker}" spoken ${hits.length} times (want 1)`); continue; }
    const delay = hits[0].vt - start;
    // THE bug under test: each line must start ON its cue. The first
    // line pays the initial page+track fetch; later lines are
    // prefetched and must be effectively gapless.
    const budget = start === 0 ? 1.6 : 0.9;
    if (delay < -0.3) fails.push(`"${marker}" spoke ${(-delay).toFixed(2)}s BEFORE its cue`);
    if (delay > budget) fails.push(`"${marker}" started ${delay.toFixed(2)}s after its cue (budget ${budget}s) — the choppy-dub latency is back`);
  }
  // Order preserved
  const order = r.spoken.map((s) => CUES.findIndex(([, m]) => s.text.includes(m)));
  if (order.some((v, i) => v !== i)) fails.push(`lines out of order: ${order.join(',')}`);

  if (fails.length) {
    console.error('\nFAIL:\n - ' + fails.join('\n - '));
    process.exit(1);
  }
  console.log('\nOK: static track adopted — 4 lines on cue, no forced CC, no inter-line stalls.');
})();
