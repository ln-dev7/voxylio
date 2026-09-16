// Regression harness for Pro voice continuity. Neural MP3s must be created
// and metadata-warmed during lookahead, not at the cue boundary; otherwise
// every sentence pays a decode gap even when the backend answered early.
const path = require("path");
const fs = require("fs");
const http = require("http");
const { chromium } = require("playwright");

const FIXTURES = __dirname;
const CONTENT = path.join(__dirname, "..", "..", "extension", "content.js");
const EXE =
  process.env.CHROMIUM_PATH ||
  (fs.existsSync("/opt/pw-browsers/chromium")
    ? "/opt/pw-browsers/chromium"
    : undefined);

(async () => {
  const MIME = {
    ".html": "text/html",
    ".vtt": "text/vtt",
    ".webm": "video/webm",
  };
  const server = http.createServer((req, res) => {
    const file = path.join(FIXTURES, req.url === "/" ? "page.html" : req.url);
    let data;
    try {
      data = fs.readFileSync(file);
    } catch {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
    });
    res.end(data);
  });
  await new Promise((resolve) => server.listen(8980, resolve));

  const browser = await chromium.launch({
    ...(EXE ? { executablePath: EXE } : {}),
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage();
  page.on("pageerror", (error) => console.log("PAGEERROR:", error.message));

  await page.addInitScript(() => {
    const listeners = [];
    const store = {
      enabled: true,
      rate: 1,
      duck: 12,
      sourceLang: "en",
      targetLang: "fr",
      subtitles: true,
      overlay: false,
      proVoice: true,
      cloudFallback: true,
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
        sendMessage: async (message) => {
          if (message && message.type === "entitlements") {
            return { plan: "pro", status: "active", linked: true };
          }
          if (message && message.type === "speak-pro") {
            await new Promise((resolve) => setTimeout(resolve, 70));
            return {
              ok: true,
              mime: "audio/mpeg",
              audio: btoa(message.text),
            };
          }
          if (message && message.type === "translate") {
            await new Promise((resolve) => setTimeout(resolve, 35));
            return { ok: true, text: `[fr] ${message.text}`, detected: "en" };
          }
          return { ok: false };
        },
      },
    };

    window.__cloudCreated = [];
    window.__cloudPlayed = [];
    window.__localSpoken = [];

    class PreparedAudio {
      constructor(src) {
        this.src = src;
        this.preload = "";
        this.preservesPitch = false;
        this.readyState = 0;
        this.duration = Number.NaN;
        this.currentTime = 0;
        this.ended = false;
        this.paused = true;
        this.volume = 1;
        this.onloadedmetadata = null;
        this.onended = null;
        this.onerror = null;
        const encoded = String(src).split(",")[1] || "";
        this.text = atob(encoded);
        this.createdAt = performance.now();
        window.__cloudCreated.push({ text: this.text, at: this.createdAt });
      }
      load() {
        setTimeout(() => {
          this.readyState = 4;
          this.duration = 0.55;
          this.readyAt = performance.now();
          if (this.onloadedmetadata) this.onloadedmetadata();
        }, 25);
      }
      async play() {
        this.paused = false;
        this.ended = false;
        window.__cloudPlayed.push({
          text: this.text,
          at: performance.now(),
          createdAt: this.createdAt,
          readyAt: this.readyAt || 0,
          readyState: this.readyState,
        });
        setTimeout(() => {
          if (this.paused) return;
          this.paused = true;
          this.ended = true;
          if (this.onended) this.onended();
        }, 550);
      }
      pause() {
        this.paused = true;
      }
    }
    Object.defineProperty(window, "Audio", {
      value: PreparedAudio,
      configurable: true,
    });

    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: function (text) {
        this.text = text;
      },
      configurable: true,
    });
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        speaking: false,
        pending: false,
        speak: (utterance) => window.__localSpoken.push(utterance.text),
        cancel: () => {},
        pause: () => {},
        resume: () => {},
        getVoices: () => [{ name: "Voix FR", lang: "fr-FR", localService: true }],
        onvoiceschanged: null,
      },
      configurable: true,
    });
  });

  await page.goto("http://localhost:8980/");
  await page.addScriptTag({ path: CONTENT });
  await page.evaluate(() => document.getElementById("v").play());
  await page.waitForTimeout(7200);

  const result = await page.evaluate(() => ({
    created: window.__cloudCreated,
    played: window.__cloudPlayed,
    local: window.__localSpoken,
    videoVolume: document.getElementById("v").volume,
  }));

  await browser.close();
  server.close();

  const fails = [];
  if (result.played.length < 3)
    fails.push(`au moins 3 phrases cloud attendues, ${result.played.length} jouées`);
  if (result.local.length)
    fails.push(`fallback local inattendu: ${result.local.join(" | ")}`);
  for (const play of result.played) {
    if (play.readyState < 1 || !play.readyAt || play.readyAt > play.at) {
      fails.push(`audio non préparé avant play(): ${play.text}`);
    }
  }
  // Exclude the first line, which legitimately has the smallest startup
  // budget. Every later line should have been decoded well before its cue.
  for (const play of result.played.slice(1)) {
    const lead = play.at - play.createdAt;
    if (lead < 500) fails.push(`préchargement trop tardif (${lead.toFixed(0)} ms): ${play.text}`);
  }
  const playedTexts = result.played.map((item) => item.text);
  if (new Set(playedTexts).size !== playedTexts.length)
    fails.push("une phrase cloud a été jouée plusieurs fois");

  console.log("voix cloud préparées/jouées:");
  result.played.forEach((item) =>
    console.log(
      `  · avance ${(item.at - item.createdAt).toFixed(0)} ms | ${item.text}`,
    ),
  );
  if (fails.length) {
    console.log("❌", fails);
    process.exit(1);
  }
  console.log("\n✅ CLOUD VOICE OK : MP3 pré-décodés, départs chauds, aucun fallback");
})();
