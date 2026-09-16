const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const CONTENT = path.join(__dirname, "..", "..", "extension", "content.js");
const EXE =
  process.env.CHROMIUM_PATH ||
  (fs.existsSync("/opt/pw-browsers/chromium")
    ? "/opt/pw-browsers/chromium"
    : undefined);

// Regression: synthetic DOM timestamps belong to one playhead epoch. The
// exact same caption mounted after a seek is a new occurrence, not a roll-up
// duplicate of the cue that existed before the seek.
(async () => {
  const browser = await chromium.launch({
    ...(EXE ? { executablePath: EXE } : {}),
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.route("https://www.netflix.com/watch/seek-test", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `<!doctype html><video id="v" style="width:800px;height:450px"></video>
        <div class="player-timedtext"></div>`,
    }),
  );
  await page.goto("https://www.netflix.com/watch/seek-test");

  await page.evaluate(() => {
    const v = document.getElementById("v");
    let time = 10;
    Object.defineProperty(v, "currentTime", { get: () => time, configurable: true });
    Object.defineProperty(v, "paused", { get: () => false, configurable: true });
    Object.defineProperty(v, "seeking", { get: () => false, configurable: true });
    Object.defineProperty(v, "readyState", { get: () => 4, configurable: true });

    const store = {
      enabled: true, rate: 1, duck: 12, voiceName: "",
      sourceLang: "en", targetLang: "fr", subtitles: false, overlay: false,
    };
    const listeners = [];
    window.chrome = {
      storage: {
        sync: {
          get: (defaults, cb) => cb({ ...defaults, ...store }),
          set: (patch) => {
            const changes = {};
            for (const [key, value] of Object.entries(patch)) {
              changes[key] = { oldValue: store[key], newValue: value };
              store[key] = value;
            }
            listeners.forEach((listener) => listener(changes, "sync"));
          },
        },
        local: { get: (defaults, cb) => cb(defaults), set: () => {} },
        onChanged: { addListener: (listener) => listeners.push(listener) },
      },
      runtime: {
        id: "test-extension",
        getManifest: () => ({ version: "test" }),
        onMessage: { addListener: () => {} },
        sendMessage: (msg) => {
          if (msg && msg.type === "entitlements")
            return Promise.resolve({ plan: "pro", status: "active", linked: true });
          if (msg && typeof msg.text === "string")
            return Promise.resolve({ ok: true, text: `[fr] ${msg.text}` });
          return Promise.resolve({ ok: true });
        },
      },
    };

    window.__spoken = [];
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: function (text) { this.text = text; },
      configurable: true,
    });
    const synth = {
      speaking: false, pending: false, current: null,
      speak(utterance) {
        this.speaking = true; this.current = utterance;
        window.__spoken.push({ text: utterance.text, vt: v.currentTime });
        if (utterance.onstart) utterance.onstart();
        utterance._timer = setTimeout(() => {
          if (this.current === utterance) { this.current = null; this.speaking = false; }
          if (utterance.onend) utterance.onend();
        }, 180);
      },
      cancel() {
        if (this.current) clearTimeout(this.current._timer);
        this.current = null; this.speaking = false;
      },
      getVoices() { return [{ name: "Voix FR", lang: "fr-FR", localService: true }]; },
      onvoiceschanged: null,
    };
    Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });

    const box = document.querySelector(".player-timedtext");
    const segment = () => {
      const node = document.createElement("span");
      node.className = "player-timedtext-text-container";
      node.textContent = "SAME_DOM_SENTENCE.";
      return node;
    };
    window.__showFirst = () => box.replaceChildren(segment());
    window.__seekSame = () => {
      time = 50;
      v.dispatchEvent(new Event("seeking"));
      // Atomic replacement: the observer never sees an intermediate blank,
      // so only a proper seek reset can accept the identical text.
      box.replaceChildren(segment());
      v.dispatchEvent(new Event("seeked"));
    };
  });

  await page.addScriptTag({ path: CONTENT });
  await page.evaluate(() => document.getElementById("v").dispatchEvent(new Event("play")));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__showFirst());
  await page.waitForFunction(() =>
    window.__spoken.filter((item) => item.text.includes("SAME_DOM_SENTENCE")).length === 1,
  );
  await page.waitForFunction(() => !window.speechSynthesis.speaking);
  await page.evaluate(() => window.__seekSame());
  await page.waitForFunction(() =>
    window.__spoken.filter((item) => item.text.includes("SAME_DOM_SENTENCE")).length === 2,
  );
  await page.waitForTimeout(700);

  const spoken = await page.evaluate(() => window.__spoken);
  await browser.close();
  const hits = spoken.filter((item) => item.text.includes("SAME_DOM_SENTENCE"));
  const fails = [...errors];
  if (hits.length !== 2)
    fails.push(`identical DOM caption spoken ${hits.length} times (want 2 moments)`);
  if (hits[1] && Math.abs(hits[1].vt - 50) > 0.25)
    fails.push(`post-seek caption voiced at ${hits[1].vt}, expected ~50`);

  if (fails.length) {
    console.error("\nFAIL:\n - " + fails.join("\n - "));
    process.exit(1);
  }
  console.log("OK: identical DOM caption accepted once at the post-seek moment.");
})();
