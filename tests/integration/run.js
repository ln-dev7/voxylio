const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const FIXTURES = __dirname;
const CONTENT = path.join(__dirname, '..', '..', 'extension', 'content.js');
const EXE = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
// Test d'intégration : bascule de langue FR -> ES en pleine lecture.
// Vraie vidéo, vraie piste VTT ; TTS et traduction instrumentés.
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
  await new Promise((r) => server.listen(8971, r));
  const browser = await chromium.launch({
    ...(EXE ? { executablePath: EXE } : {}),
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));

  await page.addInitScript(() => {
    // ---- stub chrome.storage (comportement réel : set() notifie onChanged)
    const listeners = [];
    const store = {
      enabled: true, rate: 1.0, duck: 12, voiceName: '',
      targetLang: 'fr', overlay: false,
    };
    window.chrome = {
      storage: {
        sync: {
          get: (d, cb) => cb({ ...d, ...store }),
          set: (patch) => {
            const changes = {};
            for (const [k, v] of Object.entries(patch)) {
              changes[k] = { newValue: v, oldValue: store[k] };
              store[k] = v;
            }
            listeners.forEach((l) => l(changes, 'sync'));
          },
        },
        local: { get: (d, cb) => cb(d), set: () => {} },
        onChanged: { addListener: (l) => listeners.push(l) },
      },
      runtime: {
        onMessage: { addListener: () => {} },
        // La "traduction" marque la langue cible : détecte tout mélange.
        sendMessage: (msg) =>
          new Promise((res) =>
            setTimeout(
              () => res({ ok: true, text: `[${msg.target}] ${msg.text}` }),
              120 // latence réseau simulée
            )
          ),
      },
    };

    // ---- faux moteur vocal instrumenté
    window.__spoken = [];
    window.__cancels = 0;
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: function (t) { this.text = t; }, configurable: true,
    });
    const fakeSynth = {
      speaking: false,
      pending: false,
      _current: null,
      speak(u) {
        window.__spoken.push({
          text: u.text,
          lang: u.lang,
          voice: u.voice && u.voice.name,
          rate: u.rate,
          at: performance.now(),
        });
        this.speaking = true;
        this._current = u;
        u._t = setTimeout(() => {
          if (this._current === u) { this.speaking = false; this._current = null; }
          u.onend && u.onend();
        }, 1100);
      },
      cancel() {
        window.__cancels++;
        if (this._current) clearTimeout(this._current._t);
        this._current = null;
        this.speaking = false;
      },
      getVoices() {
        return [
          { name: 'Voix FR', lang: 'fr-FR', localService: true },
          { name: 'Voz ES', lang: 'es-ES', localService: true },
        ];
      },
      onvoiceschanged: null,
    };
    Object.defineProperty(window, 'speechSynthesis', { value: fakeSynth, configurable: true });
    // Pas d'API Translator intégrée -> le fallback instrumenté est utilisé
  });

  await page.goto('http://localhost:8971/');
  await page.addScriptTag({ path: CONTENT });
  await page.evaluate(() => document.getElementById('v').play());

  // Phase FR : ~6,5 s de lecture
  await page.waitForTimeout(6500);
  const switchMark = await page.evaluate(() => {
    const n = window.__spoken.length;
    const cancelsBefore = window.__cancels;
    const speakingBefore = window.speechSynthesis.speaking;
    // Bascule vers l'espagnol en pleine phrase
    window.chrome.storage.sync.set({ targetLang: 'es', voiceName: '' });
    const speakingAfter = window.speechSynthesis.speaking;
    return { countAtSwitch: n, cancelsBefore, speakingBefore, speakingAfter };
  });

  // Phase ES : ~8 s de lecture
  await page.waitForTimeout(8000);
  const result = await page.evaluate(() => ({
    spoken: window.__spoken,
    cancels: window.__cancels,
    paused: document.getElementById('v').paused,
    t: document.getElementById('v').currentTime,
  }));
  await browser.close();
  server.close();

  // ---------- assertions ----------
  const { spoken, cancels } = result;
  const before = spoken.slice(0, switchMark.countAtSwitch);
  const after = spoken.slice(switchMark.countAtSwitch);
  console.log('--- répliques AVANT bascule ---');
  before.forEach((s) => console.log(` ${s.lang} | ${s.voice} | ×${s.rate.toFixed(2)} | ${s.text}`));
  console.log('--- répliques APRÈS bascule ---');
  after.forEach((s) => console.log(` ${s.lang} | ${s.voice} | ×${s.rate.toFixed(2)} | ${s.text}`));
  console.log('cancels:', cancels, '| video t =', result.t.toFixed(1), 's');

  const fails = [];
  if (before.length < 2) fails.push('trop peu de répliques FR avant bascule');
  if (!before.every((s) => s.text.startsWith('[fr]') && s.lang === 'fr-FR' && s.voice === 'Voix FR'))
    fails.push('mélange dans la phase FR');
  if (after.length < 2) fails.push('trop peu de répliques ES après bascule');
  if (!after.every((s) => s.text.startsWith('[es]') && s.lang === 'es-ES' && s.voice === 'Voz ES'))
    fails.push('MÉLANGE : réplique non-ES après la bascule');
  // Une annulation n'est due QUE si une voix parlait ou attendait :
  // le moteur ne fait plus d'annulation globale à vide.
  if (switchMark.speakingBefore && cancels <= switchMark.cancelsBefore)
    fails.push('la voix en cours n’a pas été coupée à la bascule');
  if (switchMark.speakingAfter)
    fails.push('la voix parlait encore juste après la bascule');
  console.log('parlait avant bascule:', switchMark.speakingBefore, '| après:', switchMark.speakingAfter);
  const texts = spoken.map((s) => s.text);
  if (new Set(texts).size !== texts.length) fails.push('doublon de réplique (fluidité)');
  // fluidité : les phrases doivent sortir dans l'ordre du script
  const nums = spoken.map((s) => (s.text.match(/Sentence (\w+)/) || [])[1]);
  const order = ['one','two','three','four','five','six','seven','eight','nine','ten'];
  const idx = nums.map((n) => order.indexOf(n));
  if (!idx.every((v, i) => i === 0 || v > idx[i - 1]))
    fails.push('répliques désordonnées: ' + nums.join(','));

  if (fails.length) {
    console.log('\n❌ ÉCHECS:'); fails.forEach((f) => console.log(' -', f));
    process.exit(1);
  }
  console.log('\n✅ TOUS LES TESTS PASSENT : coupure nette, zéro mélange, ordre fluide');
})();
