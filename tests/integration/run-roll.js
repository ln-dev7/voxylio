const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const FIXTURES = __dirname;
const CONTENT = path.join(__dirname, '..', '..', 'extension', 'content.js');
const EXE = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const http = require('http');
// Roll-up captions + playbackRate test.
(async () => {
  const MIME = { '.html': 'text/html', '.vtt': 'text/vtt', '.webm': 'video/webm' };
  const server = http.createServer((req, res) => {
    const f = path.join(FIXTURES, req.url === '/' ? 'page-roll.html' : req.url);
    let data; try { data = fs.readFileSync(f); } catch (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(data);
  });
  await new Promise(r => server.listen(8973, r));
  const browser = await chromium.launch({ ...(EXE ? { executablePath: EXE } : {}),
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.addInitScript(() => {
    const listeners = [];
    const store = { enabled: true, rate: 1.0, duck: 12, voiceName: '', sourceLang: 'auto', targetLang: 'fr', subtitles: false, overlay: false };
    window.chrome = {
      storage: { sync: { get: (d, cb) => cb({ ...d, ...store }),
          set: (p) => { const ch = {}; for (const [k, v] of Object.entries(p)) { ch[k] = { newValue: v }; store[k] = v; } listeners.forEach(l => l(ch, 'sync')); } },
        local: { get: (d, cb) => cb(d), set: () => {} }, onChanged: { addListener: l => listeners.push(l) } },
      runtime: { id: 'test-extension', onMessage: { addListener: () => {} }, getManifest: () => ({ version: 'test' }),
        sendMessage: (msg) => msg && msg.type === 'entitlements'
          ? Promise.resolve({ plan: 'free', status: 'none', linked: true })
          : new Promise(res => setTimeout(() => res({ ok: true, text: `[fr] ${msg.text}` }), 80)) },
    };
    window.__spoken = [];
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: function (t) { this.text = t; }, configurable: true });
    const fake = { speaking: false, pending: false, _c: null,
      speak(u) { window.__spoken.push({ text: u.text, rate: u.rate }); this.speaking = true; this._c = u;
        u._t = setTimeout(() => { if (this._c === u) { this.speaking = false; this._c = null; } u.onend && u.onend(); }, 700); },
      cancel() { if (this._c) clearTimeout(this._c._t); this._c = null; this.speaking = false; },
      getVoices() { return [{ name: 'Voix FR', lang: 'fr-FR', localService: true }]; },
      onvoiceschanged: null };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  });
  await page.goto('http://localhost:8973/');
  await page.addScriptTag({ path: CONTENT });
  await page.evaluate(() => { const v = document.getElementById('v'); v.playbackRate = 1.5; return v.play(); });
  await page.waitForTimeout(6000);
  const spoken = await page.evaluate(() => window.__spoken);
  await browser.close(); server.close();

  console.log(spoken.map(s => `×${s.rate.toFixed(2)} | ${s.text}`).join('\n'));
  const fails = [];
  const full = spoken.filter(s => s.text.includes('Rolling captions grow like this one does.'));
  const partial = spoken.filter(s => /Rolling captions grow\.?$/.test(s.text.trim()));
  if (full.length !== 1) fails.push('la phrase rollup complète doit être dite exactement une fois');
  if (partial.length !== 0) fails.push('le fragment partiel du rollup ne doit jamais être dit');
  if (!spoken.every(s => Math.abs(s.rate - 1.5) < 0.35)) fails.push('le débit ne suit pas playbackRate ×1.5: ' + spoken.map(s=>s.rate).join(','));
  if (fails.length) { console.log('❌', fails); process.exit(1); }
  console.log('\n✅ ROLLUP + PLAYBACKRATE OK');
})();
