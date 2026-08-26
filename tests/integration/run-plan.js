const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const FIXTURES = __dirname;
const CONTENT = path.join(__dirname, '..', '..', 'extension', 'content.js');
const EXE = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
// Integration: the plan/site gate (v1.8.0 model). On a NON-free host
// (localhost stands in for a course platform), a free account with an
// EXPIRED trial must stay silent (state "pro-site"); an ACTIVE trial
// and a Pro plan must both dub. The free-platform allowlist itself is
// unit-tested in packages/core/test/plan.test.js.
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
  await new Promise((r) => server.listen(8977, r));
  const browser = await chromium.launch({
    ...(EXE ? { executablePath: EXE } : {}),
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  const PAST = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const FUTURE = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  async function scenario(label, ent) {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.log(`PAGEERROR[${label}]:`, e.message));
    await page.addInitScript((entArg) => {
      const listeners = [];
      const store = { enabled: true, rate: 1.0, duck: 12, voiceName: '', targetLang: 'fr', overlay: false };
      window.chrome = {
        storage: {
          sync: { get: (d, cb) => cb({ ...d, ...store }),
            set: (patch) => { const ch = {}; for (const [k, v] of Object.entries(patch)) { ch[k] = { newValue: v }; store[k] = v; } listeners.forEach((l) => l(ch, 'sync')); } },
          local: { get: (d, cb) => cb(d), set: () => {} },
          onChanged: { addListener: (l) => listeners.push(l) },
        },
        runtime: {
          id: 'test-extension',
          onMessage: { addListener: (l) => { window.__onMsg = l; } },
          getManifest: () => ({ version: 'test' }),
          sendMessage: (msg) => msg && msg.type === 'entitlements'
            ? Promise.resolve(entArg)
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
    }, ent);
    await page.goto('http://localhost:8977/');
    await page.addScriptTag({ path: CONTENT });
    await page.evaluate(() => document.getElementById('v').play());
    await page.waitForTimeout(6000);
    // The popup's status call: the gate must also be VISIBLE.
    const state = await page.evaluate(
      () => new Promise((res) => {
        const timer = setTimeout(() => res('(no status)'), 1500);
        try {
          window.__onMsg({ type: 'getStatus' }, {}, (r) => {
            clearTimeout(timer);
            res(r && r.state);
          });
        } catch (e) {
          clearTimeout(timer);
          res('(no status)');
        }
      }),
    );
    const spoken = await page.evaluate(() => window.__spoken.length);
    await page.close();
    console.log(`${label}: spoken=${spoken} state=${state}`);
    return { spoken, state };
  }

  const locked = await scenario('free+expired-trial', {
    plan: 'free', status: 'none', linked: true, trialEndsAt: PAST,
  });
  const trial = await scenario('free+active-trial', {
    plan: 'free', status: 'none', linked: true, trialEndsAt: FUTURE,
  });
  const pro = await scenario('pro+expired-trial', {
    plan: 'pro', status: 'active', linked: true, trialEndsAt: PAST,
  });

  await browser.close();
  server.close();

  const fails = [];
  if (locked.spoken !== 0) fails.push(`expired-trial free account spoke ${locked.spoken} lines on a Pro-only site`);
  if (locked.state !== 'pro-site') fails.push(`locked state is "${locked.state}" (want "pro-site")`);
  if (trial.spoken < 1) fails.push('active trial did not dub on a Pro-only site');
  if (pro.spoken < 1) fails.push('pro plan did not dub on a Pro-only site');

  if (fails.length) {
    console.error('\nFAIL:\n - ' + fails.join('\n - '));
    process.exit(1);
  }
  console.log('\nOK: expired free is silent+announced, trial and Pro dub on Pro-only sites.');
})();
