// THE regression test for the repetition bug heard on real course videos:
// progressive (roll-up) and sliding-window captions injected LIVE into a
// TextTrack while the video plays, with random translation latency.
// A partial sentence must NEVER be spoken; the final sentence exactly once.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const http = require('http');
const FIXTURES = __dirname;
const CONTENT = path.join(__dirname, '..', '..', 'extension', 'content.js');
const EXE = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

(async () => {
  const MIME = { '.html': 'text/html', '.webm': 'video/webm' };
  const server = http.createServer((req, res) => {
    const f = path.join(FIXTURES, req.url === '/' ? 'page-live.html' : req.url);
    let data; try { data = fs.readFileSync(f); } catch (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(data);
  });
  await new Promise((r) => server.listen(8974, r));
  const browser = await chromium.launch({
    ...(EXE ? { executablePath: EXE } : {}),
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));

  await page.addInitScript(() => {
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
        // random latency 100-400 ms, like a real translator
        sendMessage: (msg) => new Promise((res) =>
          setTimeout(() => res({ ok: true, text: `[fr] ${msg.text}` }), 100 + Math.random() * 300)),
      },
    };
    window.__spoken = [];
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: function (t) { this.text = t; }, configurable: true });
    const fake = { speaking: false, pending: false, _c: null,
      speak(u) { window.__spoken.push(u.text); this.speaking = true; this._c = u;
        u._t = setTimeout(() => { if (this._c === u) { this.speaking = false; this._c = null; } u.onend && u.onend(); }, 800); },
      cancel() { if (this._c) clearTimeout(this._c._t); this._c = null; this.speaking = false; },
      getVoices() { return [{ name: 'Voix FR', lang: 'fr-FR', localService: true }]; },
      onvoiceschanged: null };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  });

  await page.goto('http://localhost:8974/');
  await page.addScriptTag({ path: CONTENT });

  // Live caption feed: roll-up growth, then a sliding window — the two
  // real-world shapes that used to trigger repeated speech.
  await page.evaluate(() => {
    const v = document.getElementById('v');
    const track = v.addTextTrack('subtitles', 'English', 'en');
    let growCue = null;
    const feed = [
      // [delay ms, fn]
      [400, () => { growCue = new VTTCue(0.4, 4.2, 'Welcome'); track.addCue(growCue); }],
      [750, () => { track.removeCue(growCue); growCue = new VTTCue(0.4, 4.2, 'Welcome to the accelerated'); track.addCue(growCue); }],
      [1100, () => { track.removeCue(growCue); growCue = new VTTCue(0.4, 4.2, 'Welcome to the accelerated coding course.'); track.addCue(growCue); }],
      // sliding window, overlapping fragments
      [4600, () => track.addCue(new VTTCue(4.6, 6.6, 'Now we will explore the playground'))],
      [5300, () => track.addCue(new VTTCue(5.4, 7.6, 'explore the playground together in depth'))],
    ];
    for (const [ms, fn] of feed) setTimeout(fn, ms);
    return v.play();
  });

  await page.waitForTimeout(10500);
  const spoken = await page.evaluate(() => window.__spoken);

  // --- extension reloaded while the tab stays open (orphaned script) ---
  const orphan = await page.evaluate(async () => {
    const v = document.getElementById('v');
    const before = { volume: v.volume, spoken: window.__spoken.length };
    delete window.chrome.runtime.id; // context invalidated
    await new Promise((r) => setTimeout(r, 800)); // > one 150ms tick
    return {
      before,
      after: {
        volume: v.volume,
        spoken: window.__spoken.length,
        flagReleased: window.__voxylioInjected === false,
      },
    };
  });
  await browser.close();
  server.close();

  console.log('répliques prononcées :');
  spoken.forEach((s) => console.log('  ·', s));

  const fails = [];
  const FINAL_A = '[fr] Welcome to the accelerated coding course.';
  const FINAL_B = '[fr] Now we will explore the playground together in depth';
  if (spoken.filter((s) => s === FINAL_A).length !== 1)
    fails.push('la phrase A finale doit être prononcée exactement une fois');
  if (spoken.filter((s) => s === FINAL_B).length !== 1)
    fails.push('la phrase B (fenêtre glissante recousue) doit être prononcée exactement une fois');
  // no partial version: no spoken line may be a strict prefix of another
  for (const a of spoken) for (const b of spoken) {
    if (a !== b && b.startsWith(a)) fails.push(`version partielle prononcée : "${a}"`);
  }
  // no duplicated overlap inside a sentence ("explore the playground explore…")
  for (const s of spoken) {
    const w = s.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    for (let i = 0; i + 3 < w.length - 3; i++) {
      const tri = w.slice(i, i + 3).join(' ');
      if (w.slice(i + 3).join(' ').includes(tri) && tri.split(' ').length === 3)
        fails.push(`chevauchement dupliqué dans : "${s}" (${tri})`);
    }
  }
  if (spoken.length !== 2) fails.push(`exactement 2 répliques attendues, ${spoken.length} entendues`);
  // teardown de l'orphelin : volume restauré, plus aucune parole, place libérée
  if (orphan.before.volume >= 0.5) fails.push('le duck aurait dû être actif avant invalidation');
  if (orphan.after.volume < 0.99) fails.push(`volume non restauré après invalidation (${orphan.after.volume})`);
  if (orphan.after.spoken !== orphan.before.spoken) fails.push('l’orphelin a parlé après invalidation');
  if (!orphan.after.flagReleased) fails.push('le flag d’injection n’a pas été libéré');

  if (fails.length) { console.log('❌', [...new Set(fails)]); process.exit(1); }
  console.log('\n✅ PROGRESSIF OK : aucune version partielle, chaque phrase une seule fois, couture sans doublon');
})();
