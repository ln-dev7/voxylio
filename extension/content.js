// Video Dub — content script
// Finds page videos (including inside shadow DOMs, e.g. the Mux player),
// reads their English subtitle track, translates it into the chosen language
// (Chrome's built-in API, otherwise a fallback via the service worker), and
// speaks over the video with a synthesized voice while ducking the original audio.

(() => {
  if (window.__videoDubInjected) return;
  window.__videoDubInjected = true;

  // ---------------------------------------------------------------- settings

  const DEFAULTS = {
    enabled: false,
    rate: 1.1, // base voice speed
    duck: 12, // original audio volume (%) while dubbing
    voiceName: "", // "" = auto (best available voice for the language)
    targetLang: "fr",
    overlay: true, // floating on-page controller
  };
  const settings = { ...DEFAULTS };

  const controllers = new Map(); // HTMLVideoElement -> controller

  chrome.storage.sync.get(DEFAULTS, (s) => {
    Object.assign(settings, s);
    refreshAll();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    for (const [k, v] of Object.entries(changes)) {
      if (k in settings) settings[k] = v.newValue;
    }
    // Language change: cut the current voice and queue immediately —
    // no line from the previous language may ever be heard.
    if (changes.targetLang) {
      for (const c of controllers.values()) c.flushSpeech();
    }
    refreshAll();
  });

  function refreshAll() {
    for (const c of controllers.values()) c.onSettingsChanged();
    if (typeof syncOverlay === "function") syncOverlay();
  }

  // ------------------------------------------------------------ translation

  const cache = new Map(); // "lang::text" -> Promise<string>
  // One translator per target language, isolated from each other: switching
  // languages can never file a translation under the wrong cache key.
  const translators = new Map(); // target language -> Promise<Translator|null>
  let builtinBroken = false; // surfaced in the popup status
  let pendingCount = 0;

  function getBuiltinTranslator(target) {
    if (!translators.has(target)) {
      translators.set(
        target,
        (async () => {
          try {
            if (typeof Translator === "undefined")
              throw new Error("no Translator API");
            const avail = await Translator.availability({
              sourceLanguage: "en",
              targetLanguage: target,
            });
            if (avail === "unavailable") throw new Error("pair unavailable");
            return await Translator.create({
              sourceLanguage: "en",
              targetLanguage: target,
            });
          } catch (e) {
            builtinBroken = true;
            return null;
          }
        })()
      );
    }
    return translators.get(target);
  }

  // The local translator may take a while to initialize (model download):
  // never block a line on it. If it is not ready in time, the fallback
  // translates this one, and the local translator takes over once available.
  async function builtinReadyOrNull(target, ms) {
    const timeout = new Promise((r) => setTimeout(() => r("__timeout__"), ms));
    const res = await Promise.race([getBuiltinTranslator(target), timeout]);
    return res === "__timeout__" ? null : res;
  }

  function translate(text) {
    // The target language is frozen when the request is made: the whole
    // pipeline (translator, fallback, cache key) uses this value, even if
    // the user switches languages mid-translation.
    const target = settings.targetLang;
    const key = target + "::" + text;
    if (cache.has(key)) return cache.get(key);
    const p = (async () => {
      pendingCount++;
      try {
        const t = await builtinReadyOrNull(target, 2500);
        if (t) {
          try {
            return await t.translate(text);
          } catch (e) {
            /* try the fallback */
          }
        }
        const resp = await chrome.runtime.sendMessage({
          type: "translate",
          text,
          target,
        });
        if (resp && resp.ok) return resp.text;
        throw new Error((resp && resp.error) || "translate failed");
      } finally {
        pendingCount--;
      }
    })();
    // A failed translation must not stay in the cache
    p.catch(() => cache.delete(key));
    cache.set(key, p);
    return p;
  }

  // ------------------------------------------------------------------ voices

  let voices = [];
  function loadVoices() {
    voices = speechSynthesis.getVoices() || [];
  }
  loadVoices();
  if (typeof speechSynthesis !== "undefined") {
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  // Cached voice: one single voice for the whole session (dubbing
  // consistency), recomputed when the language or user choice changes.
  let cachedVoice = null;
  let cachedVoiceKey = "";

  function pickVoice() {
    loadVoices();
    const k = settings.targetLang + "|" + settings.voiceName + "|" + voices.length;
    if (k === cachedVoiceKey) return cachedVoice;
    cachedVoiceKey = k;
    cachedVoice = pickVoiceUncached();
    return cachedVoice;
  }

  function pickVoiceUncached() {
    if (settings.voiceName) {
      const v = voices.find((v) => v.name === settings.voiceName);
      if (v) return v;
    }
    const lang = settings.targetLang;
    const candidates = voices.filter((v) =>
      v.lang && v.lang.toLowerCase().startsWith(lang)
    );
    if (!candidates.length) return null;
    // Preference: "premium/enhanced" voices > Google > local > the rest
    const score = (v) => {
      let s = 0;
      const n = (v.name || "").toLowerCase();
      if (/premium|enhanced|amélior/i.test(n)) s += 4;
      if (n.includes("google")) s += 3;
      if (v.localService) s += 1;
      // bonus for the “main” locale (fr-FR, es-ES, it-IT, de-DE…)
      if ((v.lang || "").toLowerCase() === lang + "-" + lang) s += 2;
      return s;
    };
    candidates.sort((a, b) => score(b) - score(a));
    return candidates[0];
  }

  // -------------------------------------------------------- DOM utilities

  function collectVideos() {
    const out = new Set();
    const walk = (root) => {
      let list;
      try {
        list = root.querySelectorAll("video, *");
      } catch (e) {
        return;
      }
      for (const el of list) {
        if (el.tagName === "VIDEO") out.add(el);
        if (el.shadowRoot) walk(el.shadowRoot);
      }
    };
    walk(document);
    return out;
  }

  function stripTags(s) {
    return s
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
  }

  // ----------------------------------------------------------- VTT parser

  // Dubbing-style cleanup: strip sound annotations ([Music], (applause), ♪)
  // and dialogue dashes.
  function cleanCaption(s) {
    return s
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\([^)]*\)/g, " ")
      .replace(/♪+/g, " ")
      .replace(/^[-–—]\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function endsSentence(s) {
    return /[.!?…](["')\]])?$/.test(s.trim());
  }

  function parseTimestamp(ts) {
    const m = ts.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})$/);
    if (!m) return null;
    const h = m[1] ? parseInt(m[1], 10) : 0;
    return (
      h * 3600 +
      parseInt(m[2], 10) * 60 +
      parseInt(m[3], 10) +
      parseInt(m[4].padEnd(3, "0"), 10) / 1000
    );
  }

  function parseVTT(text) {
    const cues = [];
    const blocks = text.replace(/\r/g, "").split(/\n\n+/);
    for (const block of blocks) {
      const lines = block.split("\n").filter((l) => l.trim() !== "");
      if (!lines.length) continue;
      let i = 0;
      if (!lines[i].includes("-->")) i++; // optional cue identifier
      if (i >= lines.length || !lines[i].includes("-->")) continue;
      const [startRaw, endRaw] = lines[i].split("-->");
      const start = parseTimestamp(startRaw);
      const end = parseTimestamp(endRaw.trim().split(/\s+/)[0]);
      if (start == null || end == null) continue;
      const textLines = lines.slice(i + 1).map(stripTags).filter(Boolean);
      if (!textLines.length) continue;
      cues.push({ start, end, text: textLines.join(" ") });
    }
    return cues;
  }

  // ------------------------------------------------- per-video controller

  function makeController(video) {
    const ctl = {
      video,
      cues: [], // [{start, end, text}] sorted by start
      cueKeys: new Set(), // deduplication
      groups: [], // full sentences rebuilt from the cues
      lastCueCount: -1,
      trackListened: null,
      staticLoaded: false,
      lastSpokenKey: null,
      currentUtterance: null,
      queued: null, // next pending line {key, text, dur}
      savedVolume: null,
      active: false, // dubbing actually running on this video
      pollTimer: null,
      lastTime: -1,
    };

    // --- subtitle harvesting ----------------------------------------------

    function cueKey(start, text) {
      return Math.round(start * 100) + "|" + text;
    }

    function addCue(start, end, text) {
      text = stripTags(text);
      if (!text) return;
      const key = cueKey(start, text);
      if (ctl.cueKeys.has(key)) return;
      ctl.cueKeys.add(key);
      ctl.cues.push({ start, end, text, key });
      ctl.cues.sort((a, b) => a.start - b.start);
    }

    // Captions arrive as fragments ("We're gonna be doing this" /
    // "by using a playground."): translating them one by one loses context
    // and produces choppy speech. Like YouTube dubbing, we rebuild full
    // sentences before translating and speaking.
    function rebuildGroups() {
      if (ctl.cues.length === ctl.lastCueCount) return;
      ctl.lastCueCount = ctl.cues.length;
      const MAX_LEN = 280; // max characters per sentence (safety cap)
      const MAX_GAP = 1.4; // silence (s) that closes a sentence
      const groups = [];
      let cur = null;
      for (const c of ctl.cues) {
        const txt = cleanCaption(c.text);
        if (!txt) continue;
        if (
          cur &&
          (endsSentence(cur.text) ||
            c.start - cur.end > MAX_GAP ||
            cur.text.length > MAX_LEN)
        ) {
          groups.push(cur);
          cur = null;
        }
        if (!cur) {
          cur = { start: c.start, end: c.end, text: txt };
        } else {
          cur.end = Math.max(cur.end, c.end);
          cur.text += " " + txt;
        }
      }
      if (cur) groups.push(cur);
      for (const g of groups) {
        g.key = Math.round(g.start * 100) + "|" + g.text.slice(0, 48);
      }
      ctl.groups = groups;
    }

    function harvestTextTracks() {
      const tracks = Array.from(video.textTracks || []).filter(
        (t) => t.kind === "subtitles" || t.kind === "captions"
      );
      const score = (t) => {
        let s = 0;
        const lang = (t.language || "").toLowerCase();
        const label = (t.label || "").toLowerCase();
        if (lang.startsWith("en")) s += 2;
        if (label.includes("english") || label.includes("anglais")) s += 1;
        return s;
      };
      tracks.sort((a, b) => score(b) - score(a));
      const track = tracks[0];
      if (!track) return;

      // 'hidden' forces cue loading without rendering them.
      // A track the user is already showing is left untouched.
      if (track.mode === "disabled") track.mode = "hidden";

      const harvest = () => {
        if (!track.cues) return;
        for (const c of Array.from(track.cues)) {
          const raw = typeof c.text === "string" ? c.text : "";
          addCue(c.startTime, c.endTime, raw);
        }
      };
      harvest();
      if (ctl.trackListened !== track) {
        ctl.trackListened = track;
        // HLS streams append cues as playback progresses.
        track.addEventListener("cuechange", harvest);
      }
    }

    async function harvestTrackElements() {
      if (ctl.staticLoaded) return;
      const els = Array.from(video.querySelectorAll("track")).filter(
        (t) =>
          !t.kind || t.kind === "subtitles" || t.kind === "captions"
      );
      els.sort((a, b) => {
        const s = (t) =>
          ((t.srclang || "").toLowerCase().startsWith("en") ? 2 : 0) +
          (/english/i.test(t.label || "") ? 1 : 0);
        return s(b) - s(a);
      });
      const el = els[0];
      if (!el || !el.src) return;
      ctl.staticLoaded = true;
      try {
        const res = await fetch(el.src, { credentials: "include" });
        if (!res.ok) return;
        const cues = parseVTT(await res.text());
        for (const c of cues) addCue(c.start, c.end, c.text);
      } catch (e) {
        /* ignored */
      }
    }

    // --- ahead-of-time translation ----------------------------------------

    function pretranslate() {
      if (!ctl.active) return;
      const t = video.currentTime;
      // Translate sentences in the [t, t+90s] window, max ~8 in flight
      const upcoming = ctl.groups.filter(
        (g) => g.end >= t && g.start <= t + 90
      );
      let launched = 0;
      for (const g of upcoming) {
        const key = settings.targetLang + "::" + g.text;
        if (!cache.has(key)) {
          translate(g.text).catch(() => {});
          launched++;
          if (launched >= 8 || pendingCount > 10) break;
        }
      }
    }

    // --- speech synthesis --------------------------------------------------

    function speak(text, cueDur) {
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) u.voice = v;
      const LOCALES = {
        fr: "fr-FR",
        es: "es-ES",
        it: "it-IT",
        de: "de-DE",
        pt: "pt-PT",
        en: "en-US",
      };
      u.lang = LOCALES[settings.targetLang] || settings.targetLang;

      // Gentle catch-up: when the translated sentence is clearly longer
      // than its segment, speed up only A LITTLE — never more than +25%
      // over the setting, nor ×1.45 absolute. Beyond that, like YouTube
      // dubbing, we let the voice spill into the next segment (the queue
      // handles it) rather than making it unintelligible.
      const words = text.split(/\s+/).length;
      const estimated = words / 2.6; // ~2.6 words/s at rate 1
      let rate = settings.rate;
      if (cueDur > 0.5) {
        const ratio = estimated / settings.rate / cueDur;
        if (ratio > 1.15) {
          rate = Math.min(settings.rate * ratio, settings.rate * 1.25, 1.45);
        }
      }
      u.rate = rate;

      u.onend = () => {
        if (ctl.currentUtterance === u) ctl.currentUtterance = null;
        drainQueue();
      };
      u.onerror = u.onend;
      ctl.currentUtterance = u;
      try {
        speechSynthesis.speak(u);
      } catch (e) {
        ctl.currentUtterance = null;
      }
    }

    function drainQueue() {
      if (ctl.currentUtterance || !ctl.queued) return;
      // Never speak while the video is stopped
      if (video.paused || video.seeking) {
        ctl.queued = null;
        return;
      }
      const q = ctl.queued;
      ctl.queued = null;
      speak(q.text, q.dur);
    }

    async function onCueEnter(cue) {
      ctl.lastSpokenKey = cue.key;
      const target = settings.targetLang; // language at trigger time
      let text;
      try {
        text = await translate(cue.text);
      } catch (e) {
        return; // no translation => do not interrupt the video
      }
      // The user switched languages during translation: this line belongs
      // to the previous language, so it is never spoken.
      if (settings.targetLang !== target) return;
      // A translation may arrive after the video was paused: never speak
      // while the video is stopped.
      if (!ctl.active || video.paused || video.seeking) return;
      const dur = cue.end - cue.start;
      if (ctl.currentUtterance) {
        // Let the current sentence finish; the next one replaces any line
        // already waiting (we skip rather than accumulate).
        ctl.queued = { text, dur };
      } else {
        speak(text, dur);
      }
    }

    // --- sync loop ---------------------------------------------------------

    function tick() {
      if (!ctl.active) return;
      const t = video.currentTime;

      // Seek/backward jump: restart cleanly
      if (t < ctl.lastTime - 0.75) {
        hardStopSpeech();
        ctl.lastSpokenKey = null;
      }
      ctl.lastTime = t;

      if (video.paused || video.seeking) return;

      // Safety net: Chrome sometimes "loses" an utterance's onend event
      // (known garbage-collection bug), which would stall the queue.
      if (
        ctl.currentUtterance &&
        !speechSynthesis.speaking &&
        !speechSynthesis.pending
      ) {
        ctl.currentUtterance = null;
        drainQueue();
      }

      harvestTextTracks(); // HLS cues keep arriving
      rebuildGroups();

      // active sentence (a nearly finished one is skipped: speaking a long
      // line 0.4s before its end would delay everything that follows)
      let current = null;
      for (const g of ctl.groups) {
        if (g.start <= t && t < g.end - 0.4) {
          current = g;
          break;
        }
        if (g.start > t) break;
      }
      if (current && current.key !== ctl.lastSpokenKey) {
        onCueEnter(current);
      }
      pretranslate();
    }

    function hardStopSpeech() {
      ctl.queued = null;
      ctl.currentUtterance = null;
      try {
        speechSynthesis.cancel();
      } catch (e) {}
    }

    // --- original audio (ducking) -----------------------------------------

    function applyDucking() {
      if (ctl.savedVolume == null) ctl.savedVolume = video.volume;
      video.volume = Math.max(0, Math.min(1, settings.duck / 100));
    }
    function restoreVolume() {
      if (ctl.savedVolume != null) {
        video.volume = ctl.savedVolume;
        ctl.savedVolume = null;
      }
    }

    // --- start / stop ------------------------------------------------------

    function start() {
      if (ctl.active) return;
      ctl.active = true;
      applyDucking();
      harvestTextTracks();
      harvestTrackElements();
      ctl.pollTimer = setInterval(tick, 150);
      video.addEventListener("pause", hardStopSpeech);
      video.addEventListener("seeking", hardStopSpeech);
      video.addEventListener("ended", hardStopSpeech);
    }

    function stop() {
      if (!ctl.active) return;
      ctl.active = false;
      clearInterval(ctl.pollTimer);
      ctl.pollTimer = null;
      video.removeEventListener("pause", hardStopSpeech);
      video.removeEventListener("seeking", hardStopSpeech);
      video.removeEventListener("ended", hardStopSpeech);
      hardStopSpeech();
      restoreVolume();
      ctl.lastSpokenKey = null;
    }

    ctl.onSettingsChanged = () => {
      if (settings.enabled) {
        start();
        applyDucking();
      } else {
        stop();
      }
    };

    // Passive harvesting: the subtitle track is read even while dubbing is
    // off, so the popup always shows the real state.
    ctl.harvest = () => {
      harvestTextTracks();
      harvestTrackElements();
      rebuildGroups();
    };

    ctl.destroy = stop;
    ctl.flushSpeech = hardStopSpeech; // immediate cut (language change)
    ctl.harvest();
    ctl.onSettingsChanged();
    return ctl;
  }

  // ------------------------------------------------------ floating menu

  // Small on-page controller (draggable, dismissible) to drive dubbing
  // without opening the popup. Isolated inside a closed shadow DOM.
  // `var` (hoisted): refreshAll() can be called by the settings callback
  // before this section of the script has been evaluated.
  var overlayHost = null;
  var overlayRefs = null;

  function createOverlay() {
    if (overlayHost) return;
    const OVERLAY_LANGS = [
      ["fr", "FR"],
      ["es", "ES"],
      ["it", "IT"],
      ["de", "DE"],
      ["pt", "PT"],
    ];
    overlayHost = document.createElement("div");
    overlayHost.style.cssText =
      "all:initial; position:fixed; z-index:2147483647; bottom:24px; right:24px; left:auto; top:auto;";
    const root = overlayHost.attachShadow({ mode: "closed" });
    root.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .bar {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #181818;
          border-radius: 9999px;
          padding: 8px 12px 8px 8px;
          box-shadow: rgba(0,0,0,0.5) 0px 8px 24px, rgb(124,124,124) 0px 0px 0px 1px inset;
          font-family: "Helvetica Neue", helvetica, arial, sans-serif;
          font-size: 12px;
          color: #ffffff;
          user-select: none;
          -webkit-user-select: none;
        }
        .handle {
          cursor: grab;
          color: #7c7c7c;
          font-size: 14px;
          padding: 4px 2px 4px 6px;
          letter-spacing: -1px;
        }
        .handle:active { cursor: grabbing; }
        button {
          font-family: inherit;
          border: none;
          background: #1f1f1f;
          color: #ffffff;
          cursor: pointer;
          border-radius: 9999px;
        }
        button:hover { background: #242424; }
        button:focus-visible { outline: 2px solid #1ed760; outline-offset: 2px; }
        .power {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          transition: background 0.15s;
        }
        .power svg { display: block; }
        .power.on { background: #1ed760; color: #121212; }
        .power.on:hover { background: #3be477; }
        .power.on svg path { stroke: #121212; }
        select {
          background-color: #1f1f1f;
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 8px;
          cursor: pointer;
          appearance: none;
          text-align: center;
        }
        select:hover { background-color: #242424; }
        select:focus-visible { outline: 2px solid #1ed760; outline-offset: 2px; }
        .step {
          width: 22px;
          height: 22px;
          font-size: 13px;
          font-weight: 700;
          line-height: 1;
          display: grid;
          place-items: center;
        }
        .rate {
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: #b3b3b3;
          min-width: 38px;
          text-align: center;
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 64px;
          height: 4px;
          border-radius: 9999px;
          background: linear-gradient(to right, #1ed760 0%, #1ed760 var(--fill, 20%), #4d4d4d var(--fill, 20%), #4d4d4d 100%);
          cursor: pointer;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: rgba(0,0,0,0.5) 0px 2px 6px;
        }
        input[type="range"]:focus-visible { outline: 2px solid #1ed760; outline-offset: 4px; }
        .vol { color: #7c7c7c; font-size: 11px; }
        .close {
          width: 22px;
          height: 22px;
          background: transparent;
          color: #7c7c7c;
          font-size: 12px;
          display: grid;
          place-items: center;
        }
        .close:hover { background: #1f1f1f; color: #ffffff; }
      </style>
      <div class="bar" role="toolbar" aria-label="Video Dub">
        <span class="handle" title="Déplacer">⠿</span>
        <button class="power" aria-label="Activer ou couper le doublage" title="Doublage">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2.5 6.5v3h2.4L8.5 12V4L4.9 6.5H2.5z" fill="currentColor" stroke="none"/>
            <path d="M10.5 5.5a3.4 3.4 0 010 5M12.3 4a5.8 5.8 0 010 8" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </button>
        <select class="lang" aria-label="Langue du doublage" title="Langue"></select>
        <button class="step minus" aria-label="Ralentir la voix" title="Ralentir">−</button>
        <span class="rate">×1.10</span>
        <button class="step plus" aria-label="Accélérer la voix" title="Accélérer">+</button>
        <input class="duck" type="range" min="0" max="60" step="1" aria-label="Volume de l’audio original" title="Audio original" />
        <button class="close" aria-label="Masquer le menu flottant" title="Masquer (réactivable depuis le popup)">✕</button>
      </div>`;

    const q = (sel) => root.querySelector(sel);
    overlayRefs = {
      bar: q(".bar"),
      power: q(".power"),
      lang: q(".lang"),
      rate: q(".rate"),
      duck: q(".duck"),
    };

    for (const [val, label] of OVERLAY_LANGS) {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = label;
      overlayRefs.lang.appendChild(opt);
    }

    // --- actions ---
    q(".power").addEventListener("click", () => {
      chrome.storage.sync.set({ enabled: !settings.enabled });
    });
    overlayRefs.lang.addEventListener("change", (e) => {
      chrome.storage.sync.set({ targetLang: e.target.value, voiceName: "" });
    });
    const bumpRate = (d) => {
      const r = Math.min(1.6, Math.max(0.8, Math.round((settings.rate + d) * 100) / 100));
      chrome.storage.sync.set({ rate: r });
    };
    q(".minus").addEventListener("click", () => bumpRate(-0.05));
    q(".plus").addEventListener("click", () => bumpRate(0.05));
    let duckTimer = null;
    overlayRefs.duck.addEventListener("input", (e) => {
      const v = Number(e.target.value);
      settings.duck = v;
      renderOverlay();
      refreshAll();
      clearTimeout(duckTimer);
      duckTimer = setTimeout(() => chrome.storage.sync.set({ duck: v }), 250);
    });
    q(".close").addEventListener("click", () => {
      chrome.storage.sync.set({ overlay: false });
    });

    // --- dragging ---
    const handle = q(".handle");
    let drag = null;
    handle.addEventListener("pointerdown", (e) => {
      const r = overlayHost.getBoundingClientRect();
      drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    handle.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const x = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - drag.dx));
      const y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - drag.dy));
      overlayHost.style.left = x + "px";
      overlayHost.style.top = y + "px";
      overlayHost.style.right = "auto";
      overlayHost.style.bottom = "auto";
    });
    handle.addEventListener("pointerup", (e) => {
      if (!drag) return;
      drag = null;
      const r = overlayHost.getBoundingClientRect();
      chrome.storage.local.set({ overlayPos: { x: r.left, y: r.top } });
    });

    // Restore saved position
    chrome.storage.local.get({ overlayPos: null }, ({ overlayPos }) => {
      if (overlayPos && overlayHost) {
        const x = Math.max(0, Math.min(window.innerWidth - 80, overlayPos.x));
        const y = Math.max(0, Math.min(window.innerHeight - 40, overlayPos.y));
        overlayHost.style.left = x + "px";
        overlayHost.style.top = y + "px";
        overlayHost.style.right = "auto";
        overlayHost.style.bottom = "auto";
      }
    });

    document.documentElement.appendChild(overlayHost);
    renderOverlay();
  }

  function destroyOverlay() {
    if (!overlayHost) return;
    overlayHost.remove();
    overlayHost = null;
    overlayRefs = null;
  }

  function renderOverlay() {
    if (!overlayRefs) return;
    overlayRefs.power.classList.toggle("on", !!settings.enabled);
    overlayRefs.lang.value = settings.targetLang;
    overlayRefs.rate.textContent = "×" + Number(settings.rate).toFixed(2);
    overlayRefs.duck.value = settings.duck;
    const pct = (settings.duck / 60) * 100;
    overlayRefs.duck.style.setProperty("--fill", pct + "%");
  }

  function syncOverlay() {
    const wanted = settings.overlay && controllers.size > 0;
    if (wanted) createOverlay();
    else destroyOverlay();
    renderOverlay();
  }

  // -------------------------------------------------------- periodic scan

  function scan() {
    const found = collectVideos();
    for (const v of found) {
      if (!controllers.has(v)) controllers.set(v, makeController(v));
    }
    for (const [v, c] of controllers) {
      if (!v.isConnected) {
        c.destroy();
        controllers.delete(v);
      } else {
        c.harvest();
      }
    }
    syncOverlay();
  }
  scan();
  setInterval(scan, 3000);

  // ----------------------------------------------------- popup messages

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.type !== "getStatus") return;
    scan();
    const nVideos = controllers.size;
    // Only frames that own a video answer immediately. The main frame
    // without a video waits a little: if the video lives in an iframe,
    // the iframe must answer first.
    if (nVideos === 0 && window !== window.top) return;
    const buildStatus = () => {
      loadVoices();
      let nCues = 0;
      let nGroups = 0;
      const tracks = [];
      for (const c of controllers.values()) {
        c.harvest();
        nCues += c.cues.length;
        nGroups += c.groups.length;
        for (const t of Array.from(c.video.textTracks || [])) {
          tracks.push({
            kind: t.kind,
            lang: t.language || "",
            label: t.label || "",
            mode: t.mode,
            cues: t.cues ? t.cues.length : 0,
          });
        }
      }
      return {
        videos: controllers.size,
        cues: nCues,
        groups: nGroups,
        tracks,
        builtinTranslator: !builtinBroken,
        voices: voices
          .filter((v) =>
            (v.lang || "").toLowerCase().startsWith(settings.targetLang)
          )
          .map((v) => ({ name: v.name, lang: v.lang })),
      };
    };
    if (nVideos === 0) {
      setTimeout(() => {
        try {
          sendResponse(buildStatus());
        } catch (e) {}
      }, 600);
    } else {
      sendResponse(buildStatus());
    }
    return true;
  });
})();
