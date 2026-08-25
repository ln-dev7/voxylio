const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const FIXTURES = __dirname;
const CONTENT = path.join(__dirname, '..', '..', 'extension', 'content.js');
const EXE = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
// Integration: the account gate. Signed out, the engine must stay silent
// even with enabled:true; linking the account (storage.local change) must
// unlock dubbing live, without a reload.
const http = require('http');

(async () => {
  const MIME = { '.html': 'text/html', '.vtt': 'text/vtt', '.webm': 'video/webm' };
  const server = http.createServer((req, res) => {
    const f = path.join(FIXTURES, req.url === '/' ? 'page.html' : req.url);
    let data;
    try { data = fs.readFileSync(f); } catch (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(data);
  });
  await new Promise((r) => server.listen(8975, r));
  const browser = await chromium.launch({
    ...(EXE ? { executablePath: EXE } : {}),
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));

  await page.addInitScript(() => {
    const listeners = [];
    const store = { enabled: true, rate: 1.0, duck: 12, voiceName: '', targetLang: 'fr', overlay: false };
    window.__linked = false; // flipped by the test after "sign-in"
    window.chrome = {
      storage: {
        sync: {
          get: (d, cb) => cb({ ...d, ...store }),
          set: (patch) => {
            const changes = {};
            for (const [k, v] of Object.entries(patch)) { changes[k] = { newValue: v, oldValue: store[k] }; store[k] = v; }
            listeners.forEach((l) => l(changes, 'sync'));
          },
        },
        local: { get: (d, cb) => cb(d), set: () => {} },
        onChanged: { addListener: (l) => listeners.push(l) },
      },
      runtime: {
        id: 'test-extension',
        onMessage: { addListener: () => {} },
        sendMessage: (msg) => msg && msg.type === 'entitlements'
          ? Promise.resolve({ plan: 'free', status: 'none', linked: window.__linked })
          : new Promise((res) => setTimeout(() => res({ ok: true, text: `[fr] ${msg.text}` }), 120)),
      },
    };
    // The test drives the "link" the way the real background does: a
    // storage.local change observed by the content script.
    window.__link = () => {
      window.__linked = true;
      listeners.forEach((l) => l({ accountToken: { newValue: 'vxt_test' } }, 'local'));
    };
    window.__spoken = [];
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: function (t) { this.text = t; }, configurable: true });
    const fake = { speaking: false, pending: false, _c: null,
      speak(u) { window.__spoken.push(u.text); this.speaking = true; this._c = u;
        u._t = setTimeout(() => { if (this._c === u) { this.speaking = false; this._c = null; } u.onend && u.onend(); }, 900); },
      cancel() { if (this._c) clearTimeout(this._c._t); this._c = null; this.speaking = false; },
      getVoices() { return [{ name: 'Voix FR', lang: 'fr-FR', localService: true }]; },
      onvoiceschanged: null };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  });

  await page.goto('http://localhost:8975/');
  await page.addScriptTag({ path: CONTENT });
  await page.evaluate(() => document.getElementById('v').play());

  // Signed out: 5 s of playback with cues on screen — must stay silent.
  await page.waitForTimeout(5000);
  const lockedCount = await page.evaluate(() => window.__spoken.length);

  // "Sign-in": the site relayed the token, storage.local changed.
  await page.evaluate(() => window.__link());
  await page.waitForTimeout(6000);
  const result = await page.evaluate(() => ({ spoken: window.__spoken, t: document.getElementById('v').currentTime }));
  await browser.close();
  server.close();

  console.log('locked phase spoken:', lockedCount);
  console.log('after link spoken:', result.spoken.length, '| video t =', result.t.toFixed(1), 's');
  result.spoken.forEach((s) => console.log('  ' + s));

  const fails = [];
  if (lockedCount !== 0) fails.push(`spoke while signed out (${lockedCount} utterances)`);
  if (result.spoken.length < 1) fails.push('no speech after linking the account');
  if (!result.spoken.every((s) => s.startsWith('[fr]'))) fails.push('untranslated speech after link');

  if (fails.length) {
    console.error('\nFAIL:\n - ' + fails.join('\n - '));
    process.exit(1);
  }
  console.log('\nOK: silent while signed out, dubbing unlocked live on link.');
})();
