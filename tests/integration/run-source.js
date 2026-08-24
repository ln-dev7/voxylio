const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const FIXTURES = __dirname;
const CONTENT = path.join(__dirname, '..', '..', 'extension', 'content.js');
const EXE = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const http = require('http');
// Source-language test: FR video dubbed to EN, then same-language skip.
(async () => {
  const MIME = { '.html': 'text/html', '.vtt': 'text/vtt', '.webm': 'video/webm' };
  const server = http.createServer((req, res) => {
    const f = path.join(FIXTURES, req.url === '/' ? 'page-fr.html' : req.url);
    let data; try { data = fs.readFileSync(f); } catch (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(data);
  });
  await new Promise(r => server.listen(8972, r));
  const browser = await chromium.launch({ ...(EXE ? { executablePath: EXE } : {}),
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.addInitScript(() => {
    const listeners = [];
    const store = { enabled: true, rate: 1.0, duck: 12, voiceName: '', sourceLang: 'auto', targetLang: 'en', subtitles: false, overlay: false };
    window.chrome = {
      storage: { sync: { get: (d, cb) => cb({ ...d, ...store }),
          set: (p) => { const ch = {}; for (const [k, v] of Object.entries(p)) { ch[k] = { newValue: v }; store[k] = v; } listeners.forEach(l => l(ch, 'sync')); } },
        local: { get: (d, cb) => cb(d), set: () => {} }, onChanged: { addListener: l => listeners.push(l) } },
      runtime: { id: 'test-extension', onMessage: { addListener: () => {} },
        // echo the full pair to verify the source is forwarded
        sendMessage: (msg) => new Promise(res => setTimeout(() => res({ ok: true, text: `[${msg.source}->${msg.target}] ${msg.text}` }), 100)) },
    };
    window.__spoken = [];
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: function (t) { this.text = t; }, configurable: true });
    const fake = { speaking: false, pending: false, _c: null,
      speak(u) { window.__spoken.push({ text: u.text, lang: u.lang }); this.speaking = true; this._c = u;
        u._t = setTimeout(() => { if (this._c === u) { this.speaking = false; this._c = null; } u.onend && u.onend(); }, 900); },
      cancel() { if (this._c) clearTimeout(this._c._t); this._c = null; this.speaking = false; },
      getVoices() { return [{ name: 'EN Voice', lang: 'en-US', localService: true }, { name: 'Voix FR', lang: 'fr-FR', localService: true }]; },
      onvoiceschanged: null };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  });
  await page.goto('http://localhost:8972/');
  await page.addScriptTag({ path: CONTENT });
  await page.evaluate(() => document.getElementById('v').play());
  await page.waitForTimeout(6000);
  const phase1 = await page.evaluate(() => {
    const spoken = [...window.__spoken];
    // switch target to FR: source fr == target fr -> must go silent
    window.chrome.storage.sync.set({ targetLang: 'fr', voiceName: '' });
    window.__spoken.length = 0;
    return spoken;
  });
  await page.waitForTimeout(5000);
  const phase2 = await page.evaluate(() => [...window.__spoken]);
  await browser.close(); server.close();

  console.log('--- phase 1 (vidéo FR -> doublage EN) ---');
  phase1.forEach(s => console.log(` ${s.lang} | ${s.text}`));
  console.log('--- phase 2 (cible = FR = source) ---');
  console.log(phase2.length ? phase2.map(s => s.text) : '(silence, attendu)');

  const fails = [];
  if (phase1.length < 2) fails.push('trop peu de répliques dublées');
  if (!phase1.every(s => s.text.startsWith('[fr->en]') && s.lang === 'en-US'))
    fails.push('la paire fr->en n’a pas été utilisée correctement');
  if (phase2.length !== 0) fails.push('le doublage aurait dû se taire (source = cible)');
  if (fails.length) { console.log('❌', fails); process.exit(1); }
  console.log('\n✅ SOURCE OK : fr->en correct, silence quand source = cible');
})();
