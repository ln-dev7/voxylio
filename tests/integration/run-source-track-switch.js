const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const CONTENT = path.join(__dirname, "..", "..", "extension", "content.js");
const EXE =
  process.env.CHROMIUM_PATH ||
  (fs.existsSync("/opt/pw-browsers/chromium")
    ? "/opt/pw-browsers/chromium"
    : undefined);

// Regression: a sticky TextTrack must be reselected when sourceLang changes.
// Both tracks cover the exact same window so retaining EN while merely telling
// the translator "fr" is immediately observable.
(async () => {
  const browser = await chromium.launch({
    ...(EXE ? { executablePath: EXE } : {}),
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.route("https://example.com/multitrack", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: '<!doctype html><video id="v" style="width:800px;height:450px"></video>',
    }),
  );
  await page.goto("https://example.com/multitrack");

  await page.evaluate(() => {
    const v = document.getElementById("v");
    let time = 2;
    Object.defineProperty(v, "currentTime", {
      get: () => time,
      configurable: true,
    });
    Object.defineProperty(v, "paused", { get: () => false, configurable: true });
    Object.defineProperty(v, "seeking", { get: () => false, configurable: true });
    Object.defineProperty(v, "readyState", { get: () => 4, configurable: true });

    const en = v.addTextTrack("subtitles", "English", "en");
    const fr = v.addTextTrack("subtitles", "Français", "fr");
    en.addCue(new VTTCue(0, 20, "EN_ONLY_SENTENCE."));
    fr.addCue(new VTTCue(0, 20, "PHRASE_FR_UNIQUEMENT."));

    const listeners = [];
    const store = {
      enabled: true,
      rate: 1,
      duck: 12,
      voiceName: "",
      sourceLang: "en",
      targetLang: "es",
      subtitles: false,
      overlay: false,
    };
    window.__translations = [];
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
          if (msg && typeof msg.text === "string") {
            window.__translations.push({
              text: msg.text,
              source: msg.source,
              target: msg.target,
            });
            return Promise.resolve({
              ok: true,
              text: `[${msg.source}->${msg.target}] ${msg.text}`,
            });
          }
          return Promise.resolve({ ok: true });
        },
      },
    };

    window.__spoken = [];
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: function (text) {
        this.text = text;
      },
      configurable: true,
    });
    const synth = {
      speaking: false,
      pending: false,
      current: null,
      speak(utterance) {
        this.speaking = true;
        this.current = utterance;
        window.__spoken.push({ text: utterance.text, vt: v.currentTime });
        if (utterance.onstart) utterance.onstart();
        utterance._timer = setTimeout(() => {
          if (this.current === utterance) {
            this.current = null;
            this.speaking = false;
          }
          if (utterance.onend) utterance.onend();
        }, 180);
      },
      cancel() {
        if (this.current) clearTimeout(this.current._timer);
        this.current = null;
        this.speaking = false;
      },
      getVoices() {
        return [{ name: "Voz ES", lang: "es-ES", localService: true }];
      },
      onvoiceschanged: null,
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: synth,
      configurable: true,
    });
    window.__switchSource = () =>
      window.chrome.storage.sync.set({ sourceLang: "fr" });
  });

  await page.addScriptTag({ path: CONTENT });
  await page.evaluate(() => document.getElementById("v").dispatchEvent(new Event("play")));
  await page.waitForFunction(() =>
    window.__spoken.some((item) => item.text.includes("EN_ONLY_SENTENCE")),
  );
  await page.waitForFunction(() => !window.speechSynthesis.speaking);
  const switchIndex = await page.evaluate(() => {
    const index = window.__spoken.length;
    window.__switchSource();
    return index;
  });
  await page.waitForFunction(() =>
    window.__spoken.some((item) => item.text.includes("PHRASE_FR_UNIQUEMENT")),
  );
  await page.waitForTimeout(500);

  const result = await page.evaluate((at) => ({
    after: window.__spoken.slice(at),
    translations: window.__translations,
  }), switchIndex);
  await browser.close();

  const fails = [...errors];
  const french = result.after.filter((item) =>
    item.text.includes("PHRASE_FR_UNIQUEMENT"),
  );
  if (french.length !== 1)
    fails.push(`French track spoken ${french.length} times after switch (want 1)`);
  if (result.after.some((item) => item.text.includes("EN_ONLY_SENTENCE")))
    fails.push("English track leaked after sourceLang switched to fr");
  if (
    !result.translations.some(
      (item) =>
        item.text.includes("PHRASE_FR_UNIQUEMENT") &&
        item.source === "fr" &&
        item.target === "es",
    )
  )
    fails.push("fresh French cue was not translated as fr -> es");

  if (fails.length) {
    console.error("\nFAIL:\n - " + fails.join("\n - "));
    process.exit(1);
  }
  console.log("OK: sourceLang change reselected the sole TextTrack (EN -> FR).");
})();
