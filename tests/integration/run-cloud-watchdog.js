const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const CONTENT = path.join(__dirname, "..", "..", "extension", "content.js");
const EXE =
  process.env.CHROMIUM_PATH ||
  (fs.existsSync("/opt/pw-browsers/chromium")
    ? "/opt/pw-browsers/chromium"
    : undefined);

// Regression: if a cloud MP3 request never resolves, the 12 s watchdog must
// release both the speech slot and its scheduledId. Otherwise the next cue is
// permanently held behind a chronological barrier. The performance clock is
// advanced in-page so this stays a fast integration test.
(async () => {
  const browser = await chromium.launch({
    ...(EXE ? { executablePath: EXE } : {}),
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.route("https://example.com/cloud-watchdog", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: '<!doctype html><video id="v" style="width:800px;height:450px"></video>',
    }),
  );
  await page.goto("https://example.com/cloud-watchdog");

  await page.evaluate(() => {
    const realNow = performance.now.bind(performance);
    let perfOffset = 0;
    Object.defineProperty(performance, "now", {
      value: () => realNow() + perfOffset,
      configurable: true,
    });

    const video = document.getElementById("v");
    let videoTime = 1;
    Object.defineProperty(video, "currentTime", {
      get: () => videoTime,
      configurable: true,
    });
    Object.defineProperty(video, "paused", {
      get: () => false,
      configurable: true,
    });
    Object.defineProperty(video, "seeking", {
      get: () => false,
      configurable: true,
    });
    Object.defineProperty(video, "readyState", {
      get: () => 4,
      configurable: true,
    });
    const track = video.addTextTrack("subtitles", "English", "en");
    track.addCue(new VTTCue(0, 2, "FIRST_CLOUD_LINE."));
    track.addCue(new VTTCue(2, 10, "SECOND_CLOUD_LINE."));

    const listeners = [];
    const store = {
      enabled: true,
      rate: 1,
      duck: 12,
      sourceLang: "en",
      targetLang: "fr",
      subtitles: false,
      overlay: false,
      proVoice: true,
      cloudFallback: true,
    };
    window.__speechRequests = [];
    window.__cloudPlayed = [];
    window.__localSpoken = [];
    window.chrome = {
      storage: {
        sync: {
          get: (defaults, callback) => callback({ ...defaults, ...store }),
          set: (patch) => {
            const changes = {};
            for (const [key, value] of Object.entries(patch)) {
              changes[key] = { oldValue: store[key], newValue: value };
              store[key] = value;
            }
            listeners.forEach((listener) => listener(changes, "sync"));
          },
        },
        local: { get: (defaults, callback) => callback(defaults), set: () => {} },
        onChanged: { addListener: (listener) => listeners.push(listener) },
      },
      runtime: {
        id: "test-extension",
        getManifest: () => ({ version: "test" }),
        onMessage: { addListener: () => {} },
        sendMessage: (message) => {
          if (message && message.type === "entitlements")
            return Promise.resolve({ plan: "pro", status: "active", linked: true });
          if (message && message.type === "translate")
            return Promise.resolve({
              ok: true,
              text: `[fr] ${message.text}`,
              detected: "en",
            });
          if (message && message.type === "speak-pro") {
            window.__speechRequests.push(message.text);
            if (message.text.includes("FIRST_CLOUD_LINE"))
              return new Promise(() => {});
            return Promise.resolve({
              ok: true,
              mime: "audio/mpeg",
              audio: btoa(message.text),
            });
          }
          return Promise.resolve({ ok: false });
        },
      },
    };

    class FakeAudio {
      constructor(src) {
        this.text = atob(String(src).split(",")[1] || "");
        this.readyState = 4;
        this.duration = 0.2;
        this.currentTime = 0;
        this.ended = false;
        this.paused = true;
        this.volume = 1;
      }
      load() {
        queueMicrotask(() => this.onloadedmetadata && this.onloadedmetadata());
      }
      async play() {
        this.paused = false;
        window.__cloudPlayed.push(this.text);
        setTimeout(() => {
          this.paused = true;
          this.ended = true;
          if (this.onended) this.onended();
        }, 80);
      }
      pause() {
        this.paused = true;
      }
    }
    Object.defineProperty(window, "Audio", {
      value: FakeAudio,
      configurable: true,
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: function (text) { this.text = text; },
      configurable: true,
    });
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        speaking: false,
        pending: false,
        current: null,
        speak(utterance) {
          this.speaking = true;
          this.current = utterance;
          window.__localSpoken.push(utterance.text);
          if (utterance.onstart) utterance.onstart();
          utterance._timer = setTimeout(() => {
            if (this.current === utterance) {
              this.current = null;
              this.speaking = false;
            }
            if (utterance.onend) utterance.onend();
          }, 80);
        },
        cancel() {
          if (this.current) clearTimeout(this.current._timer);
          this.current = null;
          this.speaking = false;
        },
        getVoices: () => [{ name: "Voix FR", lang: "fr-FR", localService: true }],
        onvoiceschanged: null,
      },
      configurable: true,
    });

    window.__expireFirstCloudFetch = () => {
      videoTime = 3;
      perfOffset += 13_000;
    };
  });

  await page.addScriptTag({ path: CONTENT });
  await page.evaluate(() => document.getElementById("v").dispatchEvent(new Event("play")));
  await page.waitForFunction(() =>
    window.__speechRequests.some((text) => text.includes("FIRST_CLOUD_LINE")),
  );
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__expireFirstCloudFetch());
  await page.waitForFunction(() =>
    window.__localSpoken.some((text) => text.includes("SECOND_CLOUD_LINE")),
  );
  await page.waitForTimeout(350);

  const result = await page.evaluate(() => ({
    requests: window.__speechRequests,
    played: window.__cloudPlayed,
    local: window.__localSpoken,
  }));
  await browser.close();

  const failures = [...errors];
  if (result.played.length)
    failures.push(`cloud playback continued after timeout: ${result.played.join(" | ")}`);
  const localOrder = result.local.map((text) =>
    text.includes("FIRST_CLOUD_LINE")
      ? "first"
      : text.includes("SECOND_CLOUD_LINE")
        ? "second"
        : "other",
  );
  if (localOrder.join(",") !== "first,second")
    failures.push(`local timeout fallback order was ${localOrder.join(" -> ")}`);

  if (failures.length) {
    console.error("\nFAIL:\n - " + failures.join("\n - "));
    process.exit(1);
  }
  console.log("OK: stalled cloud fetch fell back locally and kept later cues ordered.");
})();
