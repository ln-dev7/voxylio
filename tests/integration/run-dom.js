const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const CONTENT = path.join(__dirname, '..', '..', 'extension', 'content.js');
const EXE = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
// Integration: DOM-caption harvesting (YouTube-style player). The page is
// served under www.youtube.com via request interception, exposes NO
// textTracks, and renders captions in .ytp-caption-segment nodes — the
// engine must dub from those, with roll-up growth handled once.

(async () => {
  const browser = await chromium.launch({
    ...(EXE ? { executablePath: EXE } : {}),
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));

  const PAGE_HTML = `<!doctype html><html><head><meta charset="utf-8"></head>
  <body style="margin:0;background:#000">
    <div id="player">
      <video id="v" style="width:800px;height:450px;background:#111"></video>
      <div class="ytp-caption-window-container"></div>
      <button class="ytp-subtitles-button" aria-pressed="false" aria-label="Subtitles/closed captions"></button>
    </div>
  </body></html>`;

  await page.route('https://www.youtube.com/voxtest', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: PAGE_HTML }));

  await page.goto('https://www.youtube.com/voxtest');

  await page.evaluate(() => {
    const listeners = [];
    const store = { enabled: true, rate: 1.0, duck: 12, voiceName: '', sourceLang: 'en', targetLang: 'fr', subtitles: false, overlay: false };
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
    window.__spoken = [];
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: function (t) { this.text = t; }, configurable: true });
    const fake = { speaking: false, pending: false, _c: null,
      speak(u) { window.__spoken.push(u.text); this.speaking = true; this._c = u;
        u._t = setTimeout(() => { if (this._c === u) { this.speaking = false; this._c = null; } u.onend && u.onend(); }, 700); },
      cancel() { if (this._c) clearTimeout(this._c._t); this._c = null; this.speaking = false; },
      getVoices() { return [{ name: 'Voix FR', lang: 'fr-FR', localService: true }]; },
      onvoiceschanged: null };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  });

  await page.addScriptTag({ path: CONTENT });

  // Simulated playback + YouTube-style caption feed: the container gets
  // segments whose text grows (roll-up), then is replaced.
  await page.evaluate(() => {
    const v = document.getElementById('v');
    // The test video has no media: fake an advancing clock like a player.
    let t = 0;
    Object.defineProperty(v, 'currentTime', { get: () => t, configurable: true });
    Object.defineProperty(v, 'paused', { get: () => false, configurable: true });
    Object.defineProperty(v, 'seeking', { get: () => false, configurable: true });
    Object.defineProperty(v, 'readyState', { get: () => 4, configurable: true });
    setInterval(() => { t += 0.25; }, 250);

    const box = document.querySelector('.ytp-caption-window-container');
    const show = (txt) => {
      box.replaceChildren();
      if (txt) {
        const seg = document.createElement('span');
        seg.className = 'ytp-caption-segment';
        seg.textContent = txt;
        box.appendChild(seg);
      }
    };
    // Captions are OFF like a real player: nothing renders until the CC
    // button is pressed — which the extension itself must do (auto-CC).
    const btn = document.querySelector('.ytp-subtitles-button');
    window.__ccClicked = false;
    btn.addEventListener('click', () => {
      window.__ccClicked = true;
      btn.setAttribute('aria-pressed', 'true');
      const feed = [
        [600, () => show('Welcome to')],
        [1000, () => show('Welcome to the accelerated')],
        [1400, () => show('Welcome to the accelerated coding course.')],
        [3400, () => show('')],
        [3800, () => show('Now we explore the playground together.')],
        [6200, () => show('')],
      ];
      for (const [ms, fn] of feed) setTimeout(fn, ms);
    });
    v.dispatchEvent(new Event('play'));
  });

  await page.waitForTimeout(10500);
  const result = await page.evaluate(() => ({ spoken: window.__spoken, ccClicked: window.__ccClicked }));
  await browser.close();

  console.log('auto-CC clicked:', result.ccClicked);
  console.log('spoken:', result.spoken.length);
  result.spoken.forEach((s) => console.log('  ' + s));

  const fails = [];
  if (!result.ccClicked) fails.push('extension did not auto-enable the captions');
  if (result.spoken.length < 2) fails.push('expected both sentences to be dubbed');
  if (!result.spoken.every((s) => s.startsWith('[fr]'))) fails.push('untranslated speech');
  const first = result.spoken.filter((s) => s.includes('accelerated'));
  if (first.length !== 1) fails.push(`roll-up caption spoken ${first.length} times (want exactly 1, full sentence)`);
  if (first[0] && !first[0].includes('coding course')) fails.push('spoke a draft instead of the final roll-up text');

  if (fails.length) {
    console.error('\nFAIL:\n - ' + fails.join('\n - '));
    process.exit(1);
  }
  console.log('\nOK: DOM captions harvested, roll-up spoken once, fully translated.');
})();
