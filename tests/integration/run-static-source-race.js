const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const CONTENT = path.join(__dirname, "..", "..", "extension", "content.js");
const EXE =
  process.env.CHROMIUM_PATH ||
  (fs.existsSync("/opt/pw-browsers/chromium")
    ? "/opt/pw-browsers/chromium"
    : undefined);

const json3 = (text) =>
  JSON.stringify({
    events: [
      { tStartMs: 0, dDurationMs: 4000, segs: [{ utf8: text }] },
    ],
  });

// Regression: an EN static response that resolves after sourceLang became FR
// must not adopt its cue list or block the fresh FR fetch. A backward seek
// while FR is pending must also re-anchor the "past" cutoff at the new time.
(async () => {
  const browser = await chromium.launch({
    ...(EXE ? { executablePath: EXE } : {}),
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  const enUrl = "https://www.youtube.com/api/timedtext?v=race&lang=en";
  const frUrl = "https://www.youtube.com/api/timedtext?v=race&lang=fr";
  const html = `<!doctype html><video id="v" style="width:800px;height:450px"></video>
    <div class="ytp-caption-window-container"></div>
    <button class="ytp-subtitles-button" aria-pressed="false" aria-label="Subtitles"></button>
    <script>/*"captionTracks":[
      {"baseUrl":"${enUrl.replace(/&/g, "\\u0026")}","languageCode":"en","name":{"simpleText":"English"}},
      {"baseUrl":"${frUrl.replace(/&/g, "\\u0026")}","languageCode":"fr","name":{"simpleText":"Français"}}
    ],"audioTracks":[]*/</script>`;

  let releaseEnglish;
  const englishGate = new Promise((resolve) => { releaseEnglish = resolve; });
  let markEnglishStarted;
  const englishStarted = new Promise((resolve) => { markEnglishStarted = resolve; });
  let markFrenchStarted;
  const frenchStarted = new Promise((resolve) => { markFrenchStarted = resolve; });
  let releaseFrench;
  const frenchGate = new Promise((resolve) => { releaseFrench = resolve; });
  let frenchRequests = 0;

  await page.route("https://www.youtube.com/watch?v=race", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: html }),
  );
  await page.route("https://www.youtube.com/api/timedtext*", async (route) => {
    const lang = new URL(route.request().url()).searchParams.get("lang");
    if (lang === "en") {
      markEnglishStarted();
      await englishGate;
      try {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: json3("EN_STALE_STATIC."),
        });
      } catch (_) {}
      return;
    }
    frenchRequests += 1;
    markFrenchStarted();
    await frenchGate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: json3("FR_FRESH_STATIC."),
    });
  });
  await page.goto("https://www.youtube.com/watch?v=race");

  await page.evaluate(() => {
    const v = document.getElementById("v");
    let mediaTime = 8;
    Object.defineProperty(v, "currentTime", { get: () => mediaTime, configurable: true });
    Object.defineProperty(v, "paused", { get: () => false, configurable: true });
    Object.defineProperty(v, "seeking", { get: () => false, configurable: true });
    Object.defineProperty(v, "readyState", { get: () => 4, configurable: true });

    const listeners = [];
    const store = {
      enabled: true, rate: 1, duck: 12, voiceName: "",
      sourceLang: "en", targetLang: "es", subtitles: false, overlay: false,
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
            return Promise.resolve({ plan: "free", status: "none", linked: true });
          if (msg && typeof msg.text === "string") {
            window.__translations.push({ text: msg.text, source: msg.source });
            return Promise.resolve({ ok: true, text: `[${msg.source}] ${msg.text}` });
          }
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
        window.__spoken.push(utterance.text);
        if (utterance.onstart) utterance.onstart();
        utterance._timer = setTimeout(() => {
          if (this.current === utterance) { this.current = null; this.speaking = false; }
          if (utterance.onend) utterance.onend();
        }, 150);
      },
      cancel() {
        if (this.current) clearTimeout(this.current._timer);
        this.current = null; this.speaking = false;
      },
      getVoices() { return [{ name: "Voz ES", lang: "es-ES", localService: true }]; },
      onvoiceschanged: null,
    };
    Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
    window.__switchSource = () => chrome.storage.sync.set({ sourceLang: "fr" });
    window.__seekBack = () => {
      mediaTime = 1;
      v.dispatchEvent(new Event("seeking"));
      v.dispatchEvent(new Event("seeked"));
    };
  });

  await page.addScriptTag({ path: CONTENT });
  await page.evaluate(() => document.getElementById("v").dispatchEvent(new Event("play")));
  await englishStarted;
  await page.evaluate(() => window.__switchSource());
  await frenchStarted;
  await page.evaluate(() => window.__seekBack());
  releaseEnglish();
  releaseFrench();
  await page.waitForFunction(() =>
    window.__spoken.some((text) => text.includes("FR_FRESH_STATIC")),
  );
  await page.waitForTimeout(500);

  const result = await page.evaluate(() => ({
    spoken: window.__spoken,
    translations: window.__translations,
  }));
  await browser.close();

  const fails = [...errors];
  if (frenchRequests !== 1)
    fails.push(`fresh French static track fetched ${frenchRequests} times (want 1)`);
  if (result.spoken.filter((text) => text.includes("FR_FRESH_STATIC")).length !== 1)
    fails.push("fresh French static cue was not spoken exactly once");
  if (
    result.spoken.some((text) => text.includes("EN_STALE_STATIC")) ||
    result.translations.some((item) => item.text.includes("EN_STALE_STATIC"))
  )
    fails.push("stale English static response reached translation or speech");
  if (
    !result.translations.some(
      (item) => item.text.includes("FR_FRESH_STATIC") && item.source === "fr",
    )
  )
    fails.push("fresh static cue was not translated with source=fr");

  if (fails.length) {
    console.error("\nFAIL:\n - " + fails.join("\n - "));
    process.exit(1);
  }
  console.log("OK: stale EN ignored and pending FR re-anchored after backward seek.");
})();
