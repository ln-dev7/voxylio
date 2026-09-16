const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const CONTENT = path.join(__dirname, "..", "..", "extension", "content.js");
const EXE =
  process.env.CHROMIUM_PATH ||
  (fs.existsSync("/opt/pw-browsers/chromium")
    ? "/opt/pw-browsers/chromium"
    : undefined);

// Regression: session A may still await audio-grant when pause/seek stops it
// and session B starts. Resolving A afterwards must not create a second
// AudioContext or replace B's Deepgram socket.
(async () => {
  const browser = await chromium.launch({
    ...(EXE ? { executablePath: EXE } : {}),
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.route("https://example.com/audio-start-race", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: '<!doctype html><video id="v" style="width:800px;height:450px"></video>',
    }),
  );
  await page.goto("https://example.com/audio-start-race");

  await page.evaluate(() => {
    const realNow = performance.now.bind(performance);
    let perfOffset = 0;
    Object.defineProperty(performance, "now", {
      value: () => realNow() + perfOffset,
      configurable: true,
    });

    const video = document.getElementById("v");
    let paused = false;
    Object.defineProperty(video, "currentTime", { get: () => 1, configurable: true });
    Object.defineProperty(video, "paused", { get: () => paused, configurable: true });
    Object.defineProperty(video, "seeking", { get: () => false, configurable: true });
    Object.defineProperty(video, "readyState", { get: () => 4, configurable: true });
    video.captureStream = () => ({ getAudioTracks: () => [{ id: "audio-track" }] });

    window.__grantCalls = 0;
    window.__contexts = 0;
    window.__sockets = 0;
    let resolveFirstGrant;
    const firstGrant = new Promise((resolve) => { resolveFirstGrant = resolve; });

    const listeners = [];
    const store = {
      enabled: true,
      rate: 1,
      duck: 12,
      sourceLang: "en",
      targetLang: "fr",
      subtitles: false,
      overlay: false,
      proAudio: true,
    };
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
          if (message && message.type === "audio-grant") {
            window.__grantCalls += 1;
            if (window.__grantCalls === 1) return firstGrant;
            return Promise.resolve({ ok: true, token: "fresh-token", remainingSeconds: 600 });
          }
          if (message && message.type === "audio-usage")
            return Promise.resolve({ ok: true, remainingSeconds: 600 });
          return Promise.resolve({ ok: false });
        },
      },
    };

    class FakeMediaStream {
      constructor(tracks) { this.tracks = tracks; }
    }
    class FakeAudioContext {
      constructor() {
        window.__contexts += 1;
        this.state = "running";
        this.destination = {};
      }
      createMediaStreamSource() {
        return { connect() {}, disconnect() {} };
      }
      createScriptProcessor() {
        return { connect() {}, disconnect() {}, onaudioprocess: null };
      }
      createGain() {
        return { gain: { value: 1 }, connect() {}, disconnect() {} };
      }
      resume() { return Promise.resolve(); }
      close() { this.state = "closed"; return Promise.resolve(); }
    }
    class FakeWebSocket {
      constructor() {
        window.__sockets += 1;
        this.readyState = 0;
        setTimeout(() => {
          if (this.readyState === 3) return;
          this.readyState = 1;
          if (this.onopen) this.onopen();
        }, 0);
      }
      send() {}
      close() { this.readyState = 3; }
    }
    Object.defineProperty(window, "MediaStream", { value: FakeMediaStream, configurable: true });
    Object.defineProperty(window, "AudioContext", { value: FakeAudioContext, configurable: true });
    Object.defineProperty(window, "WebSocket", { value: FakeWebSocket, configurable: true });

    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: function (text) { this.text = text; },
      configurable: true,
    });
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        speaking: false,
        pending: false,
        speak() {},
        cancel() {},
        getVoices: () => [{ name: "Voix FR", lang: "fr-FR", localService: true }],
        onvoiceschanged: null,
      },
      configurable: true,
    });

    window.__armAudioProbe = () => { perfOffset += 5_000; };
    window.__pauseAndResume = () => {
      paused = true;
      video.dispatchEvent(new Event("pause"));
      paused = false;
      video.dispatchEvent(new Event("play"));
    };
    window.__releaseOldGrant = () =>
      resolveFirstGrant({ ok: true, token: "stale-token", remainingSeconds: 600 });
  });

  await page.addScriptTag({ path: CONTENT });
  await page.evaluate(() => document.getElementById("v").dispatchEvent(new Event("play")));
  await page.waitForTimeout(350);
  await page.evaluate(() => window.__armAudioProbe());
  await page.waitForFunction(() => window.__grantCalls === 1, null, { timeout: 4_000 });
  await page.evaluate(() => window.__pauseAndResume());
  await page.waitForFunction(
    () => window.__grantCalls === 2 && window.__contexts === 1 && window.__sockets === 1,
    null,
    { timeout: 4_000 },
  );
  await page.evaluate(() => window.__releaseOldGrant());
  await page.waitForTimeout(400);

  const result = await page.evaluate(() => ({
    grants: window.__grantCalls,
    contexts: window.__contexts,
    sockets: window.__sockets,
  }));
  await browser.close();

  const failures = [...errors];
  if (result.grants !== 2) failures.push(`audio grants: ${result.grants} (want 2)`);
  if (result.contexts !== 1)
    failures.push(`AudioContexts after stale grant: ${result.contexts} (want 1)`);
  if (result.sockets !== 1)
    failures.push(`Deepgram sockets after stale grant: ${result.sockets} (want 1)`);

  if (failures.length) {
    console.error("\nFAIL:\n - " + failures.join("\n - "));
    process.exit(1);
  }
  console.log("OK: stale audio grant ignored; only the fresh session created graph/socket.");
})();
