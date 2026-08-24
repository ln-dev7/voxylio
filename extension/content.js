// GENERATED FILE — do not edit. Source: apps/chrome/src (pnpm build).
(() => {
  // ../../packages/core/src/subtitles.js
  function stripTags(s) {
    return s.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  }
  var SOUND_CUE_RE = /music|musique|applau|laugh|rire|sigh|soupir|cough|toux|inaudible|silence|bruit|noise|chuckle|cheer/i;
  function isSoundCue(inner) {
    return SOUND_CUE_RE.test(inner) || /^[^a-zà-ÿ]*$/.test(inner);
  }
  function cleanCaption(s) {
    return s.replace(/\[[^\]]*\]/g, " ").replace(/\(([^)]*)\)/g, (m, inner) => isSoundCue(inner) ? " " : m).replace(/♪+/g, " ").replace(/^[-–—]\s*/, "").replace(/\s+/g, " ").trim();
  }
  function endsSentence(s) {
    return /[.!?…](["')\]])?$/.test(s.trim());
  }
  function parseTimestamp(ts) {
    const m = ts.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})$/);
    if (!m) return null;
    const h = m[1] ? parseInt(m[1], 10) : 0;
    return h * 3600 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10) + parseInt(m[4].padEnd(3, "0"), 10) / 1e3;
  }
  function parseVTT(text) {
    const cues = [];
    const blocks = text.replace(/\r/g, "").split(/\n\n+/);
    for (const block of blocks) {
      const lines = block.split("\n").filter((l) => l.trim() !== "");
      if (!lines.length) continue;
      let i = 0;
      if (!lines[i].includes("-->")) i++;
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

  // ../../packages/core/src/grouping.js
  var GROUP_MAX_LEN = 280;
  var GROUP_MAX_GAP = 1.4;
  function textHash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = h * 16777619 >>> 0;
    }
    return h.toString(36);
  }
  function normalizeWords(s) {
    return s.toLowerCase().replace(/[.,!?…;:'"«»()\[\]]/g, " ").split(/\s+/).filter(Boolean);
  }
  function wordOverlap(a, b, minWords = 2) {
    const aw = normalizeWords(a);
    const bw = normalizeWords(b);
    const max = Math.min(aw.length, bw.length);
    for (let n = max; n >= minWords; n--) {
      let match = true;
      for (let i = 0; i < n; i++) {
        if (aw[aw.length - n + i] !== bw[i]) {
          match = false;
          break;
        }
      }
      if (match) return n;
    }
    return 0;
  }
  function mergeRollup(last, start, end, text) {
    if (!last) return null;
    if (start > last.end + 0.6) return null;
    if (text.startsWith(last.text) || last.text.startsWith(text)) {
      return {
        text: text.length > last.text.length ? text : last.text,
        end: Math.max(last.end, end),
        grew: text.length > last.text.length
      };
    }
    const overlap = wordOverlap(last.text, text, 2);
    if (overlap > 0) {
      const bw = normalizeWords(text);
      if (overlap >= bw.length) {
        return { text: last.text, end: Math.max(last.end, end), grew: false };
      }
      const re = /\S+/g;
      const starts = [];
      let m;
      while ((m = re.exec(last.text)) !== null) starts.push(m.index);
      const cutIdx = starts[starts.length - overlap] ?? 0;
      const head = last.text.slice(0, cutIdx).trimEnd();
      const merged = head ? head + " " + text : text;
      return {
        text: merged,
        end: Math.max(last.end, end),
        grew: merged.length > last.text.length
      };
    }
    return null;
  }
  function buildGroups(cues, opts = {}) {
    const MAX_LEN = opts.maxLen ?? GROUP_MAX_LEN;
    const MAX_GAP = opts.maxGap ?? GROUP_MAX_GAP;
    const groups = [];
    let cur = null;
    for (const c of cues) {
      const txt = cleanCaption(c.text);
      if (!txt) continue;
      if (cur && (endsSentence(cur.text) || c.start - cur.end > MAX_GAP || cur.text.length > MAX_LEN)) {
        groups.push(cur);
        cur = null;
      }
      if (!cur) {
        cur = { start: c.start, end: c.end, text: txt };
      } else if (cur.text.endsWith(txt)) {
        cur.end = Math.max(cur.end, c.end);
      } else {
        cur.end = Math.max(cur.end, c.end);
        cur.text += " " + txt;
      }
    }
    if (cur) groups.push(cur);
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      g.id = "g" + Math.round(g.start * 100);
      g.version = textHash(g.text);
      g.final = i < groups.length - 1;
      g.key = g.id + ":" + g.version;
    }
    return groups;
  }

  // ../../packages/core/src/glossary.js
  var PROTECTED_TERMS = [
    "playground",
    "prompt",
    "framework",
    "codebase",
    "commit",
    "pull request",
    "code review",
    "backend",
    "frontend",
    "workflow",
    "pipeline",
    "token",
    "embedding",
    "debug",
    "build",
    "deploy",
    "refactoring",
    "refactor",
    "feature flag",
    "context window",
    "agent"
  ];
  var TERM_RE = new RegExp(
    "\\b(" + PROTECTED_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(
      "|"
    ) + ")\\b",
    "gi"
  );
  function protectTerms(text) {
    const found = [];
    const protectedText = text.replace(TERM_RE, (m) => {
      found.push(m);
      return `\u27E6${found.length - 1}\u27E7`;
    });
    return { protectedText, found };
  }
  function restoreTerms(text, found) {
    const seen = (text.match(/⟦\s*\d+\s*⟧/g) || []).length;
    const restored = text.replace(
      /⟦\s*(\d+)\s*⟧/g,
      (_, i) => found[Number(i)] ?? ""
    );
    const ok = seen === found.length && !/⟦|⟧/.test(restored);
    return { restored, ok };
  }

  // ../../packages/core/src/cache.js
  var BoundedMap = class extends Map {
    constructor(max = 3e3) {
      super();
      this.max = max;
    }
    set(key, value) {
      if (!this.has(key) && this.size >= this.max) {
        let n = 0;
        for (const k of this.keys()) {
          this.delete(k);
          if (++n >= this.max / 2) break;
        }
      }
      return super.set(key, value);
    }
  };

  // ../../packages/core/src/pacing.js
  var WORDS_PER_SECOND = 2.6;
  function computeUtteranceRate({
    text,
    cueDur,
    baseRate,
    playbackRate = 1
  }) {
    const words = text.split(/\s+/).length;
    const estimated = words / WORDS_PER_SECOND;
    let rate = baseRate;
    if (cueDur > 0.5) {
      const ratio = estimated / baseRate / cueDur;
      if (ratio > 1.15) {
        rate = Math.min(baseRate * ratio, baseRate * 1.25, 1.45);
      }
    }
    return Math.min(rate * (playbackRate || 1), 3);
  }

  // ../../packages/core/src/voices.js
  function pickVoice(voices, { targetLang, voiceName = "" }) {
    if (voiceName) {
      const v = voices.find((v2) => v2.name === voiceName);
      if (v) return v;
    }
    const lang = targetLang;
    const candidates = voices.filter(
      (v) => v.lang && v.lang.toLowerCase().startsWith(lang)
    );
    if (!candidates.length) return null;
    const score = (v) => {
      let s = 0;
      const n = (v.name || "").toLowerCase();
      if (/premium|enhanced|amélior/i.test(n)) s += 4;
      if (n.includes("google")) s += 3;
      if (v.localService) s += 1;
      if ((v.lang || "").toLowerCase() === lang + "-" + lang) s += 2;
      return s;
    };
    candidates.sort((a, b) => score(b) - score(a));
    return candidates[0];
  }
  var LOCALES = {
    fr: "fr-FR",
    es: "es-ES",
    it: "it-IT",
    de: "de-DE",
    pt: "pt-PT",
    en: "en-US"
  };

  // ../../packages/webext/src/index.js
  var api = typeof browser !== "undefined" && browser?.runtime ? browser : typeof chrome !== "undefined" ? chrome : void 0;
  if (!api) {
    throw new Error("@voxylio/webext: no extension API available");
  }
  var storage = api.storage;
  var runtime = api.runtime;
  function manifestVersion() {
    try {
      return runtime.getManifest().version || "";
    } catch {
      return "";
    }
  }
  function isAlive() {
    try {
      return !!runtime?.id;
    } catch {
      return false;
    }
  }
  function safeSyncSet(patch) {
    try {
      storage.sync.set(patch);
    } catch {
    }
  }
  function safeLocalSet(patch) {
    try {
      storage.local.set(patch);
    } catch {
    }
  }

  // src/content.js
  (() => {
    if (window.__voxylioInjected) return;
    window.__voxylioInjected = true;
    const DEFAULTS = {
      enabled: false,
      rate: 1.1,
      // base voice speed
      duck: 12,
      // original audio volume (%) while dubbing
      voiceName: "",
      // "" = auto (best available voice for the language)
      sourceLang: "auto",
      // "auto" = detect from the subtitle track
      targetLang: "fr",
      subtitles: false,
      // on-screen translated captions
      overlay: true,
      // floating on-page controller
      cloudFallback: true,
      // allow the online translation fallback
      autoPause: false,
      // pause the video when dubbing falls too far behind
      keepTerms: true
      // keep common technical terms untranslated
    };
    const settings = { ...DEFAULTS };
    const controllers = /* @__PURE__ */ new Map();
    let primaryVideo = null;
    function isEligibleVideo(v) {
      if (!v.isConnected) return false;
      const r = v.getBoundingClientRect();
      if (r.width < 200 || r.height < 110) return false;
      return true;
    }
    function scoreVideo(v) {
      const r = v.getBoundingClientRect();
      let s = r.width * r.height;
      const playing = !v.paused && !v.ended && v.readyState > 1;
      if (playing) s += 1e7;
      if (v.muted && v.loop) s -= 5e6;
      return s;
    }
    function pickPrimary() {
      let best = null;
      let bestScore = -Infinity;
      for (const v of controllers.keys()) {
        if (!isEligibleVideo(v)) continue;
        const s = scoreVideo(v);
        if (s > bestScore) {
          bestScore = s;
          best = v;
        }
      }
      return best;
    }
    function onAnyPlay() {
      primaryVideo = pickPrimary();
      refreshAll();
    }
    storage.sync.get(DEFAULTS, (s) => {
      Object.assign(settings, s);
      refreshAll();
    });
    storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;
      for (const [k, v] of Object.entries(changes)) {
        if (k in settings) settings[k] = v.newValue;
      }
      if (changes.targetLang || changes.sourceLang) {
        for (const c of controllers.values()) c.flushSpeech();
      }
      refreshAll();
    });
    function refreshAll() {
      for (const c of controllers.values()) c.onSettingsChanged();
      if (typeof syncOverlay === "function") syncOverlay();
    }
    const cache = new BoundedMap(3e3);
    const translators = /* @__PURE__ */ new Map();
    let builtinBroken = false;
    let pendingCount = 0;
    let translationMode = "none";
    let lastTranslateError = "";
    function getBuiltinTranslator(source, target) {
      const key = source + "->" + target;
      if (!translators.has(key)) {
        translators.set(
          key,
          (async () => {
            try {
              if (typeof Translator === "undefined")
                throw new Error("no Translator API");
              const avail = await Translator.availability({
                sourceLanguage: source,
                targetLanguage: target
              });
              if (avail === "unavailable") throw new Error("pair unavailable");
              return await Translator.create({
                sourceLanguage: source,
                targetLanguage: target
              });
            } catch (e) {
              builtinBroken = true;
              return null;
            }
          })()
        );
      }
      return translators.get(key);
    }
    async function builtinReadyOrNull(source, target, ms) {
      const timeout = new Promise((r) => setTimeout(() => r("__timeout__"), ms));
      const res = await Promise.race([
        getBuiltinTranslator(source, target),
        timeout
      ]);
      return res === "__timeout__" ? null : res;
    }
    async function translateOnce(text, source, target) {
      const t = source && source !== "auto" ? await builtinReadyOrNull(source, target, 2500) : null;
      if (t) {
        try {
          const out = await t.translate(text);
          translationMode = "local";
          return out;
        } catch (e) {
        }
      }
      if (!settings.cloudFallback) {
        translationMode = "none";
        lastTranslateError = "local-only";
        throw new Error("local translator unavailable (strict local mode)");
      }
      const resp = await runtime.sendMessage({
        type: "translate",
        text,
        source: source || "auto",
        target
      });
      if (resp && resp.ok) {
        translationMode = "cloud";
        return resp.text;
      }
      translationMode = "none";
      lastTranslateError = resp && resp.error || "translate failed";
      throw new Error(lastTranslateError);
    }
    function translate(text, source) {
      const target = settings.targetLang;
      const key = source + "->" + target + "::" + text;
      if (cache.has(key)) return cache.get(key);
      const p = (async () => {
        pendingCount++;
        try {
          if (settings.keepTerms) {
            const { protectedText, found } = protectTerms(text);
            if (found.length > 0) {
              const raw = await translateOnce(protectedText, source, target);
              const { restored, ok } = restoreTerms(raw, found);
              if (ok) return restored;
            }
          }
          return await translateOnce(text, source, target);
        } finally {
          pendingCount--;
        }
      })();
      p.catch(() => cache.delete(key));
      cache.set(key, p);
      return p;
    }
    let voices = [];
    function loadVoices() {
      voices = speechSynthesis.getVoices() || [];
    }
    loadVoices();
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    let cachedVoice = null;
    let cachedVoiceKey = "";
    function pickVoice2() {
      loadVoices();
      const k = settings.targetLang + "|" + settings.voiceName + "|" + voices.length;
      if (k === cachedVoiceKey) return cachedVoice;
      cachedVoiceKey = k;
      cachedVoice = pickVoice(voices, {
        targetLang: settings.targetLang,
        voiceName: settings.voiceName
      });
      return cachedVoice;
    }
    function collectVideos() {
      const out = /* @__PURE__ */ new Set();
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
    function makeController(video) {
      const ctl = {
        video,
        cues: [],
        // [{start, end, text}] sorted by start
        cueKeys: /* @__PURE__ */ new Set(),
        // deduplication
        groups: [],
        // full sentences rebuilt from the cues
        lastCueCount: -1,
        trackLang: "",
        // language declared by the chosen subtitle track
        detectedSource: null,
        // source language detected from cue text
        detecting: false,
        captionEl: null,
        // on-screen translated captions container
        trackListened: null,
        staticLoaded: false,
        // Anti-repetition registries (progressive captions can regrow a
        // group; identity is the stable group id, never the mutable text):
        scheduledIds: /* @__PURE__ */ new Set(),
        // groups queued for translation/speech
        spokenIds: /* @__PURE__ */ new Set(),
        // groups already spoken (or deliberately skipped)
        inFlight: /* @__PURE__ */ new Map(),
        // group id -> { version, promise } translation reuse
        generation: 0,
        // bumped on seek/language/track change: voids stale work
        groupMeta: /* @__PURE__ */ new Map(),
        // group id -> { version, changedAt } stability clock
        cleanupAt: 0,
        currentUtterance: null,
        queue: [],
        // pending lines [{text, dur, start, end}] — bounded FIFO
        autoPaused: false,
        // we paused the video to let the voice catch up
        settingVolume: false,
        // our own volume writes (vs the user's)
        savedVolume: null,
        active: false,
        // dubbing actually running on this video
        pollTimer: null,
        lastTime: -1
      };
      function cueKey(start2, text) {
        return Math.round(start2 * 100) + "|" + text;
      }
      function addCue(start2, end, text) {
        text = stripTags(text);
        if (!text) return;
        const key = cueKey(start2, text);
        if (ctl.cueKeys.has(key)) return;
        const last = ctl.cues[ctl.cues.length - 1];
        const merged = mergeRollup(last, start2, end, text);
        if (merged) {
          if (merged.grew) {
            last.text = merged.text;
            ctl.lastCueCount = -1;
          }
          last.end = merged.end;
          ctl.cueKeys.add(key);
          return;
        }
        ctl.cueKeys.add(key);
        ctl.cues.push({ start: start2, end, text, key });
        ctl.cues.sort((a, b) => a.start - b.start);
      }
      function rebuildGroups() {
        if (ctl.cues.length === ctl.lastCueCount) return;
        ctl.lastCueCount = ctl.cues.length;
        ctl.groups = buildGroups(ctl.cues);
        const now = Date.now();
        for (const g of ctl.groups) {
          const meta = ctl.groupMeta.get(g.id);
          if (!meta || meta.version !== g.version) {
            ctl.groupMeta.set(g.id, { version: g.version, changedAt: now });
          }
        }
      }
      function isFinalGroup(g) {
        if (g.final) return true;
        const meta = ctl.groupMeta.get(g.id);
        if (!meta) return false;
        const stableFor = Date.now() - meta.changedAt;
        return stableFor >= (endsSentence(g.text) ? 350 : 650);
      }
      function harvestTextTracks() {
        const tracks = Array.from(video.textTracks || []).filter(
          (t) => t.kind === "subtitles" || t.kind === "captions"
        );
        const wanted = settings.sourceLang;
        const score = (t) => {
          let s = 0;
          const lang = (t.language || "").toLowerCase();
          const label = (t.label || "").toLowerCase();
          if (wanted !== "auto" && lang.startsWith(wanted)) s += 4;
          if (wanted === "auto" && lang.startsWith("en")) s += 2;
          if (label.includes("english") || label.includes("anglais")) s += 1;
          return s;
        };
        tracks.sort((a, b) => score(b) - score(a));
        const track = tracks[0];
        if (!track) return;
        ctl.trackLang = (track.language || "").toLowerCase().split("-")[0];
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
          if (ctl.trackListened && ctl.trackHarvestHandler) {
            ctl.trackListened.removeEventListener(
              "cuechange",
              ctl.trackHarvestHandler
            );
          }
          ctl.trackListened = track;
          ctl.trackHarvestHandler = harvest;
          track.addEventListener("cuechange", harvest);
        }
      }
      async function harvestTrackElements() {
        if (ctl.staticLoaded) return;
        if (ctl.trackRetryAt && Date.now() < ctl.trackRetryAt) return;
        const els = Array.from(video.querySelectorAll("track")).filter(
          (t) => !t.kind || t.kind === "subtitles" || t.kind === "captions"
        );
        els.sort((a, b) => {
          const s = (t) => ((t.srclang || "").toLowerCase().startsWith("en") ? 2 : 0) + (/english/i.test(t.label || "") ? 1 : 0);
          return s(b) - s(a);
        });
        const el = els[0];
        if (!el || !el.src) return;
        ctl.staticLoaded = true;
        try {
          const res = await fetch(el.src, { credentials: "include" });
          if (!res.ok) throw new Error("HTTP " + res.status);
          const cues = parseVTT(await res.text());
          for (const c of cues) addCue(c.start, c.end, c.text);
          ctl.trackRetryAt = 0;
        } catch (e) {
          ctl.staticLoaded = false;
          ctl.trackRetryAt = Date.now() + 6e3;
        }
      }
      function effectiveSource() {
        if (settings.sourceLang !== "auto") return settings.sourceLang;
        if (ctl.trackLang) return ctl.trackLang;
        if (ctl.detectedSource) return ctl.detectedSource;
        maybeDetectSource();
        return "auto";
      }
      async function maybeDetectSource() {
        if (ctl.detecting || ctl.detectedSource || ctl.cues.length < 2) return;
        ctl.detecting = true;
        try {
          if (typeof LanguageDetector === "undefined") return;
          const sample = ctl.cues.slice(0, 5).map((c) => c.text).join(" ");
          const detector = await LanguageDetector.create();
          const results = await detector.detect(sample);
          const best = results && results[0];
          if (best && best.confidence > 0.5) {
            ctl.detectedSource = (best.detectedLanguage || "").split("-")[0];
          }
        } catch (e) {
        } finally {
          ctl.detecting = false;
        }
      }
      function pretranslate() {
        if (!ctl.active) return;
        const t = video.currentTime;
        const upcoming = ctl.groups.filter(
          (g) => g.end >= t && g.start <= t + 90 && isFinalGroup(g)
        );
        const source = effectiveSource();
        if (source !== "auto" && source === settings.targetLang) return;
        let launched = 0;
        for (const g of upcoming) {
          const key = source + "->" + settings.targetLang + "::" + g.text;
          if (!cache.has(key)) {
            translate(g.text, source).catch(() => {
            });
            launched++;
            if (launched >= 8 || pendingCount > 10) break;
          }
        }
      }
      function speak(text, cueDur, id) {
        if (id) {
          ctl.spokenIds.add(id);
          ctl.scheduledIds.delete(id);
          ctl.inFlight.delete(id);
        }
        const u = new SpeechSynthesisUtterance(text);
        const v = pickVoice2();
        if (v) u.voice = v;
        u.lang = LOCALES[settings.targetLang] || settings.targetLang;
        u.rate = computeUtteranceRate({
          text,
          cueDur,
          baseRate: settings.rate,
          playbackRate: video.playbackRate || 1
        });
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
        if (ctl.autoPaused && !ctl.currentUtterance && ctl.queue.length === 0) {
          ctl.autoPaused = false;
          video.play().catch(() => {
          });
        }
        if (ctl.currentUtterance || ctl.queue.length === 0) return;
        if (video.paused && !ctl.autoPaused || video.seeking) {
          ctl.queue.length = 0;
          return;
        }
        const t = video.currentTime;
        while (ctl.queue.length > 0 && ctl.queue[0].end + 4 < t && !ctl.autoPaused) {
          ctl.queue.shift();
        }
        const q = ctl.queue.shift();
        if (!q) return;
        speak(q.text, q.dur, q.id);
      }
      function enqueue(item) {
        ctl.queue.push(item);
        if (ctl.queue.length > 2) {
          if (settings.autoPause && !video.paused && !ctl.autoPaused) {
            ctl.autoPaused = true;
            video.pause();
          } else if (!ctl.autoPaused) {
            ctl.queue.shift();
          }
        }
        drainQueue();
      }
      async function onGroupEnter(group) {
        ctl.scheduledIds.add(group.id);
        const gen = ctl.generation;
        const target = settings.targetLang;
        const source = effectiveSource();
        if (source !== "auto" && source === target) return;
        let entry = ctl.inFlight.get(group.id);
        if (!entry || entry.version !== group.version) {
          entry = {
            version: group.version,
            promise: translate(group.text, source)
          };
          ctl.inFlight.set(group.id, entry);
        }
        let text;
        try {
          text = await entry.promise;
        } catch (e) {
          ctl.scheduledIds.delete(group.id);
          ctl.inFlight.delete(group.id);
          return;
        }
        if (gen !== ctl.generation) return;
        if (settings.targetLang !== target) return;
        const live = ctl.groups.find((g) => g.id === group.id);
        if (!live || live.version !== group.version) {
          ctl.scheduledIds.delete(group.id);
          ctl.inFlight.delete(group.id);
          return;
        }
        if (settings.subtitles) showCaption(group.text, text);
        if (!ctl.active || video.paused && !ctl.autoPaused || video.seeking) {
          ctl.scheduledIds.delete(group.id);
          return;
        }
        if (video.currentTime > group.end + 4) {
          ctl.spokenIds.add(group.id);
          ctl.scheduledIds.delete(group.id);
          ctl.inFlight.delete(group.id);
          return;
        }
        const dur = group.end - group.start;
        if (ctl.currentUtterance) {
          enqueue({ text, dur, start: group.start, end: group.end, id: group.id });
        } else {
          speak(text, dur, group.id);
        }
      }
      function ensureCaptionEl() {
        if (ctl.captionEl) return ctl.captionEl;
        const el = document.createElement("div");
        el.style.cssText = "position:fixed; z-index:2147483646; pointer-events:none;transform:translateX(-50%); max-width:min(80vw,900px);display:none; text-align:center;font-family:'Helvetica Neue',helvetica,arial,sans-serif;";
        const orig = document.createElement("div");
        orig.style.cssText = "color:rgba(255,255,255,0.75); font-size:14px; line-height:1.35;text-shadow:0 1px 3px rgba(0,0,0,0.9); margin-bottom:4px;";
        const trans = document.createElement("div");
        trans.style.cssText = "display:inline-block; color:#ffffff; font-size:19px; font-weight:600;line-height:1.4; background:rgba(0,0,0,0.6); border-radius:8px;padding:4px 12px; text-shadow:0 1px 2px rgba(0,0,0,0.8);";
        el.appendChild(orig);
        el.appendChild(trans);
        document.documentElement.appendChild(el);
        ctl.captionEl = el;
        ctl.captionOrig = orig;
        ctl.captionTrans = trans;
        return el;
      }
      function showCaption(original, translated) {
        const el = ensureCaptionEl();
        ctl.captionOrig.textContent = original;
        ctl.captionTrans.textContent = translated;
        el.style.display = "block";
        positionCaption();
      }
      function hideCaption() {
        if (ctl.captionEl) ctl.captionEl.style.display = "none";
      }
      function positionCaption() {
        if (!ctl.captionEl || ctl.captionEl.style.display === "none") return;
        const r = video.getBoundingClientRect();
        ctl.captionEl.style.left = r.left + r.width / 2 + "px";
        ctl.captionEl.style.bottom = window.innerHeight - r.bottom + Math.max(20, r.height * 0.07) + "px";
      }
      function tick() {
        if (!isAlive()) {
          teardownAll();
          return;
        }
        if (!ctl.active) return;
        const t = video.currentTime;
        if (t < ctl.lastTime - 0.75) {
          fullFlush();
        }
        ctl.lastTime = t;
        if (video.paused && !ctl.autoPaused || video.seeking) return;
        if (ctl.currentUtterance && !speechSynthesis.speaking && !speechSynthesis.pending) {
          ctl.currentUtterance = null;
          drainQueue();
        }
        harvestTextTracks();
        rebuildGroups();
        let current = null;
        for (const g of ctl.groups) {
          if (g.start <= t && t < g.end - 0.4) {
            current = g;
            break;
          }
          if (g.start > t) break;
        }
        if (current && isFinalGroup(current) && !ctl.spokenIds.has(current.id) && !ctl.scheduledIds.has(current.id)) {
          onGroupEnter(current);
        } else if (!current || !settings.subtitles) {
          hideCaption();
        }
        if (Date.now() > ctl.cleanupAt) {
          ctl.cleanupAt = Date.now() + 5e3;
          for (const g of ctl.groups) {
            if (g.end < t - 120) {
              ctl.spokenIds.delete(g.id);
              ctl.scheduledIds.delete(g.id);
              ctl.inFlight.delete(g.id);
              ctl.groupMeta.delete(g.id);
            }
          }
        }
        positionCaption();
        pretranslate();
      }
      function hardStopSpeech() {
        ctl.generation += 1;
        ctl.scheduledIds.clear();
        ctl.inFlight.clear();
        const hadSpeech = ctl.currentUtterance || ctl.queue.length > 0;
        ctl.queue.length = 0;
        ctl.currentUtterance = null;
        ctl.autoPaused = false;
        if (hadSpeech) {
          try {
            speechSynthesis.cancel();
          } catch (e) {
          }
        }
      }
      function setVolume(v) {
        ctl.settingVolume = true;
        video.volume = Math.max(0, Math.min(1, v));
        setTimeout(() => ctl.settingVolume = false, 0);
      }
      function applyDucking() {
        if (ctl.savedVolume == null) ctl.savedVolume = video.volume;
        setVolume(settings.duck / 100);
      }
      function restoreVolume() {
        if (ctl.savedVolume != null) {
          setVolume(ctl.savedVolume);
          ctl.savedVolume = null;
        }
      }
      function onVolumeChange() {
        if (!ctl.settingVolume) ctl.savedVolume = null;
      }
      function start() {
        if (ctl.active) return;
        ctl.active = true;
        applyDucking();
        harvestTextTracks();
        harvestTrackElements();
        ctl.pollTimer = setInterval(tick, 150);
        video.addEventListener("pause", onPauseEvent);
        video.addEventListener("seeking", fullFlush);
        video.addEventListener("ended", hardStopSpeech);
        video.addEventListener("ratechange", hardStopSpeech);
        video.addEventListener("volumechange", onVolumeChange);
      }
      function onPauseEvent() {
        if (!ctl.autoPaused) hardStopSpeech();
      }
      function stop() {
        if (!ctl.active) return;
        ctl.active = false;
        clearInterval(ctl.pollTimer);
        ctl.pollTimer = null;
        video.removeEventListener("pause", onPauseEvent);
        video.removeEventListener("seeking", fullFlush);
        video.removeEventListener("ended", hardStopSpeech);
        video.removeEventListener("ratechange", hardStopSpeech);
        video.removeEventListener("volumechange", onVolumeChange);
        hardStopSpeech();
        restoreVolume();
        hideCaption();
      }
      function fullFlush() {
        hardStopSpeech();
        ctl.spokenIds.clear();
      }
      ctl.onSettingsChanged = () => {
        if (settings.enabled && video === primaryVideo) {
          start();
          applyDucking();
        } else {
          stop();
        }
      };
      ctl.harvest = () => {
        harvestTextTracks();
        harvestTrackElements();
        rebuildGroups();
      };
      video.addEventListener("play", onAnyPlay);
      ctl.destroy = () => {
        stop();
        video.removeEventListener("play", onAnyPlay);
        if (ctl.trackListened && ctl.trackHarvestHandler) {
          ctl.trackListened.removeEventListener(
            "cuechange",
            ctl.trackHarvestHandler
          );
        }
        if (ctl.captionEl) {
          ctl.captionEl.remove();
          ctl.captionEl = null;
        }
      };
      ctl.flushSpeech = hardStopSpeech;
      ctl.fullFlush = fullFlush;
      ctl.harvest();
      ctl.onSettingsChanged();
      return ctl;
    }
    var overlayHost = null;
    var overlayRefs = null;
    function createOverlay() {
      if (overlayHost) return;
      const OVERLAY_LANGS = [
        ["fr", "FR"],
        ["es", "ES"],
        ["it", "IT"],
        ["de", "DE"],
        ["pt", "PT"]
      ];
      overlayHost = document.createElement("div");
      overlayHost.style.cssText = "all:initial; position:fixed; z-index:2147483647; bottom:24px; right:24px; left:auto; top:auto;";
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
        @keyframes speak-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(30,215,96,0.55); }
          50% { box-shadow: 0 0 0 6px rgba(30,215,96,0); }
        }
        .power.speaking { animation: speak-pulse 1.2s ease-out infinite; }
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
      <div class="bar" role="toolbar" aria-label="Voxylio">
        <span class="handle" title="D\xE9placer">\u283F</span>
        <button class="power" aria-label="Activer ou couper le doublage" title="Doublage">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2.5 6.5v3h2.4L8.5 12V4L4.9 6.5H2.5z" fill="currentColor" stroke="none"/>
            <path d="M10.5 5.5a3.4 3.4 0 010 5M12.3 4a5.8 5.8 0 010 8" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </button>
        <select class="lang" aria-label="Langue du doublage" title="Langue"></select>
        <button class="step minus" aria-label="Ralentir la voix" title="Ralentir">\u2212</button>
        <span class="rate">\xD71.10</span>
        <button class="step plus" aria-label="Acc\xE9l\xE9rer la voix" title="Acc\xE9l\xE9rer">+</button>
        <input class="duck" type="range" min="0" max="60" step="1" aria-label="Volume de l\u2019audio original" title="Audio original" />
        <button class="close" aria-label="Masquer le menu flottant" title="Masquer (r\xE9activable depuis le popup)">\u2715</button>
      </div>`;
      const q = (sel) => root.querySelector(sel);
      overlayRefs = {
        bar: q(".bar"),
        power: q(".power"),
        lang: q(".lang"),
        rate: q(".rate"),
        duck: q(".duck")
      };
      for (const [val, label] of OVERLAY_LANGS) {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = label;
        overlayRefs.lang.appendChild(opt);
      }
      q(".power").addEventListener("click", () => {
        safeSyncSet({ enabled: !settings.enabled });
      });
      overlayRefs.lang.addEventListener("change", (e) => {
        safeSyncSet({ targetLang: e.target.value, voiceName: "" });
      });
      const bumpRate = (d) => {
        const r = Math.min(1.6, Math.max(0.8, Math.round((settings.rate + d) * 100) / 100));
        safeSyncSet({ rate: r });
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
        duckTimer = setTimeout(() => safeSyncSet({ duck: v }), 250);
      });
      q(".close").addEventListener("click", () => {
        safeSyncSet({ overlay: false });
      });
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
        safeLocalSet({ overlayPos: { x: r.left, y: r.top } });
      });
      storage.local.get({ overlayPos: null }, ({ overlayPos }) => {
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
      overlayRefs.speakTimer = setInterval(() => {
        if (!isAlive()) {
          teardownAll();
          return;
        }
        if (overlayRefs) {
          overlayRefs.power.classList.toggle("speaking", anySpeaking());
        }
      }, 400);
      overlayRefs.onResize = () => {
        if (!overlayHost || overlayHost.style.left === "auto") return;
        const r = overlayHost.getBoundingClientRect();
        const x = Math.max(0, Math.min(window.innerWidth - r.width - 8, r.left));
        const y = Math.max(0, Math.min(window.innerHeight - r.height - 8, r.top));
        overlayHost.style.left = x + "px";
        overlayHost.style.top = y + "px";
      };
      window.addEventListener("resize", overlayRefs.onResize);
      renderOverlay();
    }
    function destroyOverlay() {
      if (!overlayHost) return;
      if (overlayRefs) {
        clearInterval(overlayRefs.speakTimer);
        window.removeEventListener("resize", overlayRefs.onResize);
      }
      overlayHost.remove();
      overlayHost = null;
      overlayRefs = null;
    }
    function renderOverlay() {
      if (!overlayRefs) return;
      overlayRefs.power.classList.toggle("on", !!settings.enabled);
      overlayRefs.lang.value = settings.targetLang;
      overlayRefs.rate.textContent = "\xD7" + Number(settings.rate).toFixed(2);
      overlayRefs.duck.value = settings.duck;
      const pct = settings.duck / 60 * 100;
      overlayRefs.duck.style.setProperty("--fill", pct + "%");
    }
    function syncOverlay() {
      const wanted = settings.overlay && controllers.size > 0;
      if (wanted) createOverlay();
      else destroyOverlay();
      renderOverlay();
    }
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
      primaryVideo = pickPrimary();
      refreshAll();
    }
    function lightScan() {
      for (const [v, c] of controllers) {
        if (!v.isConnected) {
          c.destroy();
          controllers.delete(v);
        } else {
          c.harvest();
        }
      }
      primaryVideo = pickPrimary();
      refreshAll();
    }
    let scanDirty = true;
    let lastFullScan = 0;
    try {
      new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.addedNodes && m.addedNodes.length) {
            scanDirty = true;
            break;
          }
        }
      }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {
    }
    function scheduledScan() {
      if (document.hidden) return;
      const now = Date.now();
      if (scanDirty || now - lastFullScan > 15e3) {
        scanDirty = false;
        lastFullScan = now;
        scan();
      } else {
        lightScan();
      }
    }
    function teardownAll() {
      try {
        for (const [v, c] of controllers) {
          c.destroy();
          controllers.delete(v);
        }
      } catch (e) {
      }
      destroyOverlay();
      clearInterval(scanTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.__voxylioInjected = false;
    }
    function guardedScheduledScan() {
      if (!isAlive()) {
        teardownAll();
        return;
      }
      scheduledScan();
    }
    function onVisibility() {
      if (!document.hidden) {
        scanDirty = true;
        guardedScheduledScan();
      }
    }
    scan();
    const scanTimer = setInterval(guardedScheduledScan, 3e3);
    document.addEventListener("visibilitychange", onVisibility);
    function anySpeaking() {
      for (const c of controllers.values()) {
        if (c.currentUtterance) return true;
      }
      return false;
    }
    runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg && msg.type === "retry") {
        for (const c of controllers.values()) {
          c.staticLoaded = false;
          c.trackRetryAt = 0;
          c.lastCueCount = -1;
          c.fullFlush();
        }
        builtinBroken = false;
        lastTranslateError = "";
        scanDirty = true;
        scan();
        sendResponse({ ok: true });
        return;
      }
      if (!msg || msg.type !== "getStatus") return;
      scan();
      const nVideos = controllers.size;
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
              cues: t.cues ? t.cues.length : 0
            });
          }
        }
        const targetVoices = voices.filter(
          (v) => (v.lang || "").toLowerCase().startsWith(settings.targetLang)
        );
        const hasSubTracks = tracks.some(
          (t) => t.kind === "subtitles" || t.kind === "captions"
        );
        let state = "no-video";
        if (controllers.size > 0) {
          if (nCues > 0) {
            if (targetVoices.length === 0) state = "no-voice";
            else if (translationMode === "none" && lastTranslateError)
              state = settings.cloudFallback ? "translate-error" : "local-unavailable";
            else state = "ready";
          } else {
            state = hasSubTracks ? "subs-loading" : "no-subs";
          }
        }
        return {
          version: manifestVersion(),
          page: location.hostname,
          state,
          speaking: anySpeaking(),
          translationMode,
          lastTranslateError,
          videos: controllers.size,
          cues: nCues,
          groups: nGroups,
          tracks,
          builtinTranslator: !builtinBroken,
          voices: targetVoices.map((v) => ({ name: v.name, lang: v.lang }))
        };
      };
      if (nVideos === 0) {
        setTimeout(() => {
          try {
            sendResponse(buildStatus());
          } catch (e) {
          }
        }, 600);
      } else {
        sendResponse(buildStatus());
      }
      return true;
    });
  })();
})();
