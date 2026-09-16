// Regression harness: translations may finish out of order, but voices must
// always follow cue chronology. The first provider response is deliberately
// much slower than the second; playback is then paused/resumed to verify that
// the ordering barrier does not leak stale work across a generation change.
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
    const file = path.join(
      FIXTURES,
      req.url === "/" ? "page-translation-order.html" : req.url,
    );
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
  await new Promise((resolve) => server.listen(8981, resolve));

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
      subtitles: false,
      overlay: false,
      cloudFallback: true,
      proTranslation: false,
      proVoice: false,
    };
    window.__translationFinished = [];
    window.__spoken = [];
    window.__cancelled = 0;
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
          if (message && message.type === "entitlements") {
            return Promise.resolve({ plan: "free", status: "none", linked: true });
          }
          const match = String(message && message.text).match(/line (\w+)/i);
          const label = match ? match[1].toLowerCase() : "unknown";
          const delay = label === "one" ? 2_800 : label === "two" ? 80 : 120;
          return new Promise((resolve) =>
            setTimeout(() => {
              window.__translationFinished.push({ label, at: performance.now() });
              resolve({ ok: true, text: `[fr] Order line ${label}.`, detected: "en" });
            }, delay),
          );
        },
      },
    };

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
        window.__spoken.push({ text: utterance.text, at: performance.now() });
        if (utterance.onstart) utterance.onstart();
        utterance.timer = setTimeout(() => {
          if (this.current === utterance) {
            this.current = null;
            this.speaking = false;
          }
          if (utterance.onend) utterance.onend();
        }, 360);
      },
      cancel() {
        window.__cancelled++;
        if (this.current) clearTimeout(this.current.timer);
        this.current = null;
        this.speaking = false;
        this.pending = false;
      },
      getVoices: () => [
        { name: "Voix FR", lang: "fr-FR", localService: true },
      ],
      onvoiceschanged: null,
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: synth,
      configurable: true,
    });
  });

  await page.goto("http://localhost:8981/");
  await page.addScriptTag({ path: CONTENT });
  await page.evaluate(() => document.getElementById("v").play());

  // Wait until the two reversed responses have both arrived and the engine
  // has begun catching up, then exercise a real user pause/resume boundary.
  await page.waitForFunction(
    () =>
      window.__translationFinished.some((x) => x.label === "one") &&
      window.__translationFinished.some((x) => x.label === "two"),
    null,
    { timeout: 5_000 },
  );
  await page.waitForTimeout(700);
  await page.evaluate(() => document.getElementById("v").pause());
  await page.waitForTimeout(350);
  await page.evaluate(() => document.getElementById("v").play());
  await page.waitForTimeout(4_500);

  const result = await page.evaluate(() => ({
    finished: window.__translationFinished,
    spoken: window.__spoken,
    cancelled: window.__cancelled,
    time: document.getElementById("v").currentTime,
  }));
  await browser.close();
  server.close();

  const completion = result.finished.map((item) => item.label);
  const spoken = result.spoken
    .map((item) => (item.text.match(/line (\w+)/i) || [])[1])
    .filter(Boolean)
    .map((label) => label.toLowerCase());
  const rank = new Map([
    ["one", 1],
    ["two", 2],
    ["three", 3],
    ["four", 4],
  ]);
  const failures = [];
  if (completion.indexOf("two") < 0 || completion.indexOf("one") < 0) {
    failures.push(`réponses inversées non observées: ${completion.join(", ")}`);
  } else if (completion.indexOf("two") > completion.indexOf("one")) {
    failures.push(`le harnais n'a pas inversé G1/G2: ${completion.join(", ")}`);
  }
  if (spoken.length < 3) failures.push(`trop peu de répliques: ${spoken.join(", ")}`);
  if (!spoken.includes("one") || !spoken.includes("two")) {
    failures.push(`G1 ou G2 perdue: ${spoken.join(", ")}`);
  }
  if (
    !spoken.every(
      (label, index) => index === 0 || rank.get(label) > rank.get(spoken[index - 1]),
    )
  ) {
    failures.push(`ordre vocal non chronologique: ${spoken.join(", ")}`);
  }
  if (new Set(spoken).size !== spoken.length) {
    failures.push(`réplique dupliquée après pause/reprise: ${spoken.join(", ")}`);
  }

  console.log("ordre de fin des traductions:", completion.join(" → "));
  console.log("ordre des voix:", spoken.join(" → "));
  console.log("annulations pendant pause/reprise:", result.cancelled);
  if (failures.length) {
    console.log("❌", failures);
    process.exit(1);
  }
  console.log("\n✅ ORDRE OK : réponses inversées, voix chronologiques, reprise sans doublon");
})();
