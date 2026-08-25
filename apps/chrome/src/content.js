// Voxylio — Chrome content script (built from apps/chrome/src).
// Orchestrates the page: video detection, subtitle harvesting, translation
// scheduling, speech, captions and the floating controller. All pure engine
// logic lives in @voxylio/core; extension APIs go through @voxylio/webext.
import {
  BoundedMap,
  buildGroups,
  mergeRollup,
  endsSentence,
  cleanCaption,
  parseVTT,
  stripTags,
  protectTerms,
  restoreTerms,
  computeUtteranceRate,
  pickVoice as pickBestVoice,
  LOCALES,
  LANGUAGES,
  VOICE_PREFIX_ALIASES,
  PREVIEW_SAMPLES,
  fmtTime,
  domCaptionSiteFor,
  domCueEnd,
  DEFAULTS as SHARED_DEFAULTS,
  createTranslatorChain,
  journalAppendLine,
  journalUpsert,
  usageAdd,
} from "@voxylio/core";
import {
  storage,
  runtime,
  manifestVersion,
  isAlive,
  safeSyncSet,
  safeLocalSet,
  createBuiltinProvider,
  createGtxProvider,
  createDeeplProvider,
  createGoogleV2Provider,
  createProProvider,
  AURA2_LANGS,
} from "@voxylio/webext";
import { makeT, resolveUiLang } from "./i18n.js";


(() => {
  if (window.__voxylioInjected) return;
  window.__voxylioInjected = true;

  // ---------------------------------------------------------------- settings

  // Shared schema (packages/core/src/settings.js): includes provider
  // selection and the per-site disable list.
  const DEFAULTS = { ...SHARED_DEFAULTS };
  const settings = { ...DEFAULTS };

  // Voxylio can be switched off per hostname from the options page.
  function siteDisabled() {
    const host = (location.hostname || "").replace(/^www\./, "").toLowerCase();
    return (
      Array.isArray(settings.disabledSites) &&
      settings.disabledSites.includes(host)
    );
  }

  // ---------------------------------------------------------------- account
  // Dubbing requires a linked Voxylio account (free plan included).
  // The background owns the token and caches entitlements: once linked,
  // the check also succeeds offline, so a bad connection never locks a
  // signed-in user out mid-video.
  let accountLinked = false;

  function recheckAccount() {
    try {
      const p = runtime.sendMessage({ type: "entitlements" });
      if (p && typeof p.then === "function") {
        p.then((ent) => {
          const linked = !!(ent && ent.linked);
          if (linked !== accountLinked) {
            accountLinked = linked;
            refreshAll();
          }
        }).catch(() => {});
      }
    } catch (e) {}
  }
  recheckAccount();

  // On the Voxylio site, relay the account link from the page to the
  // background. Unlike externally_connectable messaging this does not
  // depend on the extension ID the site was built with, so it works for
  // ANY installed copy — store build and load-unpacked alike.
  const ACCOUNT_HOSTS = ["voxylio.lndev.me", "localhost", "127.0.0.1"];
  if (ACCOUNT_HOSTS.includes(location.hostname) && window === window.top) {
    window.addEventListener("message", (event) => {
      if (event.source !== window || event.origin !== location.origin) return;
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;
      if (
        msg.type === "voxylio:link" &&
        typeof msg.token === "string" &&
        msg.token.startsWith("vxt_")
      ) {
        try {
          const p = runtime.sendMessage({
            type: "voxylio:link-relay",
            token: msg.token,
          });
          if (p && typeof p.then === "function") {
            p.then((resp) => {
              window.postMessage(
                {
                  type: "voxylio:linked",
                  ok: !!(resp && resp.ok),
                  plan: (resp && resp.plan) || "free",
                },
                location.origin,
              );
            }).catch(() => {});
          }
        } catch (e) {}
      }
      if (msg.type === "voxylio:unlink") {
        try {
          const p = runtime.sendMessage({ type: "voxylio:unlink-relay" });
          if (p && typeof p.catch === "function") p.catch(() => {});
        } catch (e) {}
      }
    });
  }

  // ------------------------------------------------------ cloud voice (Pro)
  // Aura-2 neural voices, generated per sentence by the backend (which
  // holds the key and meters usage). Bounded cache of ready audio; any
  // refusal falls back to the local engine in speak().
  const cloudAudioCache = new BoundedMap(80); // "lang::text" -> Promise<dataUrl|null>

  function cloudVoiceActive() {
    return (
      !!settings.proVoice &&
      accountLinked &&
      AURA2_LANGS.has(settings.targetLang)
    );
  }

  function getCloudAudio(text) {
    const key = settings.targetLang + "::" + text;
    if (cloudAudioCache.has(key)) return cloudAudioCache.get(key);
    const p = (async () => {
      try {
        const resp = await runtime.sendMessage({
          type: "speak-pro",
          text,
          lang: settings.targetLang,
        });
        if (resp && resp.ok && resp.audio)
          return "data:" + (resp.mime || "audio/mpeg") + ";base64," + resp.audio;
      } catch (e) {}
      return null;
    })();
    cloudAudioCache.set(key, p);
    p.then((v) => {
      if (!v) cloudAudioCache.delete(key); // failures are retryable
    });
    return p;
  }

  // ------------------------------------------------- DOM captions (sites)
  // YouTube, Netflix & co never expose textTracks: their captions are
  // rendered in the page. Watch the player's caption container and feed
  // whatever appears to the primary controller as synthetic cues.
  const domSite = domCaptionSiteFor(location.hostname);
  let domCapContainer = null;
  let domCapObserver = null;
  let domLastText = "";

  function domCaptionText() {
    if (!domCapContainer) return "";
    const parts = [];
    for (const el of domCapContainer.querySelectorAll(domSite.segment)) {
      const s = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (s) parts.push(s);
    }
    return parts.join(" ").trim();
  }

  function onDomCaptionMutation() {
    const video = primaryVideo;
    const ctl = video && controllers.get(video);
    if (!ctl) return;
    const text = domCaptionText();
    if (!text) {
      // Caption cleared: close the running cue at the playhead.
      if (domLastText) ctl.closeDomCue(video.currentTime);
      domLastText = "";
      return;
    }
    if (text === domLastText) return;
    domLastText = text;
    ctl.addDomCue(video.currentTime, text);
  }

  function syncDomCaptions() {
    if (!domSite) return;
    if (domCapContainer && !domCapContainer.isConnected) {
      if (domCapObserver) domCapObserver.disconnect();
      domCapObserver = null;
      domCapContainer = null;
      domLastText = "";
    }
    if (domCapContainer) return;
    const el = document.querySelector(domSite.container);
    if (!el) return;
    domCapContainer = el;
    domCapObserver = new MutationObserver(onDomCaptionMutation);
    domCapObserver.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    onDomCaptionMutation();
  }

  const controllers = new Map(); // HTMLVideoElement -> controller

  // Only ONE video is dubbed at a time: the "primary" — playing, visible
  // and largest. Thumbnails, previews and hidden players never qualify.
  let primaryVideo = null;

  function isEligibleVideo(v) {
    if (!v.isConnected) return false;
    const r = v.getBoundingClientRect();
    if (r.width < 200 || r.height < 110) return false; // thumbnails, pips
    return true;
  }

  function scoreVideo(v) {
    const r = v.getBoundingClientRect();
    let s = r.width * r.height;
    const playing = !v.paused && !v.ended && v.readyState > 1;
    if (playing) s += 1e7; // the video actually playing wins
    if (v.muted && v.loop) s -= 5e6; // ad/preview pattern
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

  // Re-arbitrate as soon as any video starts playing
  function onAnyPlay() {
    primaryVideo = pickPrimary();
    refreshAll();
  }

  storage.sync.get(DEFAULTS, (s) => {
    Object.assign(settings, s);
    refreshAll();
  });

  storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      // Link/unlink from the site (any tab) lands in storage.local first.
      if (changes.accountToken || changes.entitlements) recheckAccount();
      // Provider API keys are stored in storage.local by the options page.
      if (changes.deeplKey) providerKeys.deepl = changes.deeplKey.newValue || "";
      if (changes.googleKey)
        providerKeys.googlev2 = changes.googleKey.newValue || "";
      if (changes.deeplKey || changes.googleKey) rebuildChain();
      return;
    }
    if (area !== "sync") return;
    for (const [k, v] of Object.entries(changes)) {
      if (k in settings) settings[k] = v.newValue;
    }
    // Language change (source or target): cut the current voice and queue
    // immediately — no line from the previous pair may ever be heard.
    if (changes.targetLang || changes.sourceLang) {
      for (const c of controllers.values()) c.flushSpeech();
    }
    if (changes.provider || changes.cloudFallback || changes.proTranslation)
      rebuildChain();
    if (changes.uiLang) {
      // Rebuild the floating bar in the new language.
      uiT = null;
      destroyOverlay();
    }
    refreshAll();
  });

  function refreshAll() {
    for (const c of controllers.values()) c.onSettingsChanged();
    if (typeof syncOverlay === "function") syncOverlay();
  }

  // ------------------------------------------------------------ translation

  const cache = new BoundedMap(3000); // "source->target::text" -> Promise<string>
  let builtinBroken = false; // surfaced in the popup status
  let pendingCount = 0;
  // What actually translated the last lines: "local" | "cloud" | "none".
  let translationMode = "none";
  let lastTranslateError = "";

  // Provider chain (packages/core/src/translation.js): ordering, ready
  // timeout (never block a line on a model download), attempt timeout and
  // per-pair cooldown are pure engine logic; the providers themselves are
  // platform adapters. The builtin provider is a singleton so its per-pair
  // translator instances survive chain rebuilds.
  const builtinProvider = createBuiltinProvider({
    onBroken: () => {
      builtinBroken = true;
    },
  });
  const providerKeys = { deepl: "", googlev2: "" };
  const proProvider = createProProvider();
  let chain = createTranslatorChain([builtinProvider]);

  function rebuildChain() {
    const list = [];
    // Pro contextual translation first (opt-in): background + backend
    // enforce the plan and the quota; any refusal falls through to the
    // local engine below without interrupting dubbing.
    if (settings.proTranslation) list.push(proProvider);
    list.push(builtinProvider);
    if (settings.cloudFallback) {
      if (settings.provider === "deepl" && providerKeys.deepl)
        list.push(createDeeplProvider(() => providerKeys.deepl));
      if (settings.provider === "googlev2" && providerKeys.googlev2)
        list.push(createGoogleV2Provider(() => providerKeys.googlev2));
      list.push(createGtxProvider());
    }
    chain = createTranslatorChain(list);
  }
  rebuildChain();
  try {
    storage.local.get({ deeplKey: "", googleKey: "" }, (k) => {
      providerKeys.deepl = (k && k.deeplKey) || "";
      providerKeys.googlev2 = (k && k.googleKey) || "";
      rebuildChain();
    });
  } catch (e) {
    /* no local storage (test stub): chain stays builtin+gtx */
  }

  // One translation attempt (optionally with protected technical terms).
  async function translateOnce(text, source, target, opts) {
    try {
      const res = await chain.translate(text, source, target, opts);
      translationMode =
        res.kind === "pro" ? "pro" : res.kind === "local" ? "local" : "cloud";
      lastTranslateError = "";
      return res.text;
    } catch (e) {
      translationMode = "none";
      lastTranslateError = settings.cloudFallback
        ? (e && e.message) || "translate failed"
        : "local-only";
      throw e;
    }
  }

  function translate(text, source, context) {
    // The language pair is frozen when the request is made: the whole
    // pipeline (translator, fallback, cache key) uses these values, even if
    // the user switches languages mid-translation.
    const target = settings.targetLang;
    const key = source + "->" + target + "::" + text;
    if (cache.has(key)) return cache.get(key);
    const opts = context ? { context } : undefined;
    const p = (async () => {
      pendingCount++;
      try {
        // Protect technical terms; if the placeholders do not survive the
        // engine, silently retry once without protection.
        if (settings.keepTerms) {
          const { protectedText, found } = protectTerms(text);
          if (found.length > 0) {
            const raw = await translateOnce(protectedText, source, target, opts);
            const { restored, ok } = restoreTerms(raw, found);
            if (ok) return restored;
          }
        }
        return await translateOnce(text, source, target, opts);
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
    // Per-language preference first (hub page), then the global choice.
    const wanted =
      (settings.voiceByLang && settings.voiceByLang[settings.targetLang]) ||
      settings.voiceName;
    const k = settings.targetLang + "|" + wanted + "|" + voices.length;
    if (k === cachedVoiceKey) return cachedVoice;
    cachedVoiceKey = k;
    cachedVoice = pickBestVoice(voices, {
      targetLang: settings.targetLang,
      voiceName: wanted,
    });
    return cachedVoice;
  }

  // ------------------------------------------------------------- journal
  // Local history + usage stats, rendered by the hub page. Bounded and
  // throttled (packages/core/src/journal.js); strictly on-device.
  let journalSession = null;
  let journalDirty = false;
  let journalTimer = null;
  let statsPending = { seconds: 0, lines: 0 };

  function dayKey() {
    const d = new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function journalFlushSoon() {
    if (journalTimer) return;
    journalTimer = setTimeout(() => {
      journalTimer = null;
      if (!journalDirty || !journalSession || !isAlive()) return;
      journalDirty = false;
      const session = journalSession;
      const spent = statsPending;
      statsPending = { seconds: 0, lines: 0 };
      try {
        storage.local.get({ journal: [], usageStats: null }, (data) => {
          const patch = { journal: journalUpsert(data.journal || [], session) };
          if (spent.lines > 0 || spent.seconds > 0) {
            patch.usageStats = usageAdd(
              data.usageStats,
              dayKey(),
              spent.seconds,
              spent.lines,
              session.target,
            );
          }
          safeLocalSet(patch);
        });
      } catch (e) {}
    }, 2500);
  }

  function recordLine(group, text, videoTime) {
    const target = settings.targetLang;
    if (!journalSession || journalSession.target !== target) {
      journalSession = {
        id:
          "js_" +
          Date.now().toString(36) +
          "_" +
          Math.random().toString(36).slice(2, 7),
        host: (location.hostname || "").replace(/^www\./, ""),
        url: String(location.href || "").slice(0, 300),
        title: (document.title || location.hostname || "").slice(0, 160),
        source: settings.sourceLang,
        target,
        startedAt: Date.now(),
        updatedAt: Date.now(),
        lines: [],
      };
    }
    journalSession = journalAppendLine(journalSession, {
      t: Math.round(videoTime * 10) / 10,
      src: group.text,
      dst: text,
      at: Date.now(),
    });
    journalDirty = true;
    journalFlushSoon();
  }

  function recordSpokenSeconds(sec) {
    if (!journalSession) return;
    statsPending.seconds += sec;
    statsPending.lines += 1;
    journalDirty = true;
    journalFlushSoon();
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


  // ----------------------------------------------------------- VTT parser




  // ------------------------------------------------- per-video controller

  function makeController(video) {
    const ctl = {
      video,
      cues: [], // [{start, end, text}] sorted by start
      cueKeys: new Set(), // deduplication
      groups: [], // full sentences rebuilt from the cues
      lastCueCount: -1,
      trackLang: "", // language declared by the chosen subtitle track
      detectedSource: null, // source language detected from cue text
      detecting: false,
      captionEl: null, // on-screen translated captions container
      trackListened: null,
      staticLoaded: false,
      // Anti-repetition registries (progressive captions can regrow a
      // group; identity is the stable group id, never the mutable text):
      scheduledIds: new Set(), // groups queued for translation/speech
      spokenIds: new Set(), // groups already spoken (or deliberately skipped)
      inFlight: new Map(), // group id -> { version, promise } translation reuse
      generation: 0, // bumped on seek/language/track change: voids stale work
      groupMeta: new Map(), // group id -> { version, changedAt } stability clock
      cleanupAt: 0,
      currentUtterance: null,
      queue: [], // pending lines [{text, dur, start, end}] — bounded FIFO
      autoPaused: false, // we paused the video to let the voice catch up
      settingVolume: false, // our own volume writes (vs the user's)
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
      // Roll-up captions (YouTube-style): merge into one growing cue
      // instead of stacking duplicates (@voxylio/core mergeRollup).
      const last = ctl.cues[ctl.cues.length - 1];
      const merged = mergeRollup(last, start, end, text);
      if (merged) {
        if (merged.grew) {
          last.text = merged.text;
          ctl.lastCueCount = -1; // groups must be rebuilt
        }
        last.end = merged.end;
        ctl.cueKeys.add(key);
        return;
      }
      ctl.cueKeys.add(key);
      ctl.cues.push({ start, end, text, key });
      ctl.cues.sort((a, b) => a.start - b.start);
    }

    // DOM-harvested captions (YouTube, Netflix…): synthetic cues stamped
    // at the playhead. The previous DOM cue is closed when replaced so
    // grouping sees realistic durations.
    ctl.addDomCue = (start, text) => {
      const clean = stripTags(text);
      if (!clean) return;
      if (ctl.lastDomCue && ctl.lastDomCue.end > start) {
        ctl.lastDomCue.end = Math.max(ctl.lastDomCue.start + 0.8, start);
      }
      addCue(start, domCueEnd(start, clean), clean);
      ctl.lastDomCue = ctl.cues[ctl.cues.length - 1] || null;
      ctl.domCues = (ctl.domCues || 0) + 1;
    };
    ctl.closeDomCue = (at) => {
      if (ctl.lastDomCue && ctl.lastDomCue.end > at) {
        ctl.lastDomCue.end = Math.max(ctl.lastDomCue.start + 0.8, at);
      }
    };

    // Neighbouring sentences for context-aware translation (Pro): what
    // was said just before and what comes next. Pure read, tiny window.
    function groupContext(groupId) {
      const idx = ctl.groups.findIndex((g) => g.id === groupId);
      if (idx < 0) return undefined;
      return {
        before: ctl.groups.slice(Math.max(0, idx - 3), idx).map((g) => g.text),
        after: ctl.groups.slice(idx + 1, idx + 3).map((g) => g.text),
      };
    }

    // Sentence reconstruction lives in @voxylio/core (buildGroups).
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

    // A group may be spoken only once it is FINAL: every group but the
    // trailing one is final by construction; the trailing one becomes
    // final when its text has stopped changing (shorter wait when it
    // already ends like a sentence). Speaking drafts is what caused the
    // "Bienvenue / Bienvenue dans le cours / …" repetitions.
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
      const wanted = settings.sourceLang; // "auto" or an explicit source
      const score = (t) => {
        let s = 0;
        const lang = (t.language || "").toLowerCase();
        const label = (t.label || "").toLowerCase();
        // Explicit source choice wins; otherwise slight bias toward English,
        // the most common source for course content.
        if (wanted !== "auto" && lang.startsWith(wanted)) s += 4;
        if (wanted === "auto" && lang.startsWith("en")) s += 2;
        if (label.includes("english") || label.includes("anglais")) s += 1;
        return s;
      };
      tracks.sort((a, b) => score(b) - score(a));
      const track = tracks[0];
      if (!track) return;
      ctl.trackLang = (track.language || "").toLowerCase().split("-")[0];

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
        // Detach the listener from a previously watched track
        if (ctl.trackListened && ctl.trackHarvestHandler) {
          ctl.trackListened.removeEventListener(
            "cuechange",
            ctl.trackHarvestHandler
          );
        }
        ctl.trackListened = track;
        ctl.trackHarvestHandler = harvest;
        // HLS streams append cues as playback progresses.
        track.addEventListener("cuechange", harvest);
      }
    }

    async function harvestTrackElements() {
      if (ctl.staticLoaded) return;
      // A failed fetch (network hiccup, cross-origin refusal) is retried
      // after a short delay instead of giving up for good.
      if (ctl.trackRetryAt && Date.now() < ctl.trackRetryAt) return;
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
        if (!res.ok) throw new Error("HTTP " + res.status);
        // The parser accepts both WebVTT and SRT (comma decimals,
        // numeric counters) — whatever the file actually contains.
        const cues = parseVTT(await res.text());
        for (const c of cues) addCue(c.start, c.end, c.text);
        ctl.trackRetryAt = 0;
      } catch (e) {
        // Retry in 6 s
        ctl.staticLoaded = false;
        ctl.trackRetryAt = Date.now() + 6000;
      }
    }

    // --- source language --------------------------------------------------

    // Effective source: explicit user choice > track metadata > detection
    // from cue text (Chrome's LanguageDetector) > "auto" (online fallback).
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
        const sample = ctl.cues
          .slice(0, 5)
          .map((c) => c.text)
          .join(" ");
        const detector = await LanguageDetector.create();
        const results = await detector.detect(sample);
        const best = results && results[0];
        if (best && best.confidence > 0.5) {
          ctl.detectedSource = (best.detectedLanguage || "").split("-")[0];
        }
      } catch (e) {
        /* detection is best-effort */
      } finally {
        ctl.detecting = false;
      }
    }

    // --- ahead-of-time translation ----------------------------------------

    function pretranslate() {
      if (!ctl.active) return;
      const t = video.currentTime;
      // Translate sentences in the [t, t+90s] window, max ~8 in flight
      const upcoming = ctl.groups.filter(
        (g) => g.end >= t && g.start <= t + 90 && isFinalGroup(g)
      );
      const source = effectiveSource();
      if (source !== "auto" && source === settings.targetLang) return;
      let launched = 0;
      for (const g of upcoming) {
        const key = source + "->" + settings.targetLang + "::" + g.text;
        if (!cache.has(key)) {
          translate(g.text, source, groupContext(g.id))
            .then((txt) => {
              // Pre-generate the neural voice shortly before its moment,
              // never the whole window: skipped lines must cost nothing.
              if (cloudVoiceActive() && g.start - video.currentTime < 25)
                getCloudAudio(txt);
            })
            .catch(() => {});
          launched++;
          if (launched >= 8 || pendingCount > 10) break;
        }
      }
    }

    // --- speech synthesis --------------------------------------------------

    function speak(text, cueDur, id) {
      if (id) {
        // The group is now truly being voiced: lock it forever.
        ctl.spokenIds.add(id);
        ctl.scheduledIds.delete(id);
        ctl.inFlight.delete(id);
      }
      // Pro neural voice (Aura-2 languages only): cloud engine first,
      // automatic local fallback — dubbing never stops on a cloud hiccup.
      if (cloudVoiceActive()) {
        speakCloud(text, cueDur);
        return;
      }
      speakLocal(text, cueDur);
    }

    async function speakCloud(text, cueDur) {
      // Occupy the speech slot immediately: drainQueue and anySpeaking
      // treat currentUtterance as "voice busy" whatever the engine.
      const token = { cloud: true };
      ctl.currentUtterance = token;
      const url = await getCloudAudio(text);
      if (ctl.currentUtterance !== token) return; // cancelled meanwhile
      if (!url) {
        // Cloud refused (quota, offline, unsupported): local takes over.
        ctl.currentUtterance = null;
        speakLocal(text, cueDur);
        return;
      }
      const a = new Audio(url);
      const vv = Number(settings.voiceVolume);
      a.volume = Math.max(0, Math.min(100, Number.isFinite(vv) ? vv : 100)) / 100;
      a.playbackRate = computeUtteranceRate({
        text,
        cueDur,
        baseRate: settings.rate,
        playbackRate: video.playbackRate || 1,
      });
      ctl.cloudAudio = a;
      const spokeAt = performance.now();
      const finish = () => {
        if (ctl.cloudAudio === a) ctl.cloudAudio = null;
        if (ctl.currentUtterance === token) ctl.currentUtterance = null;
        recordSpokenSeconds((performance.now() - spokeAt) / 1000);
        drainQueue();
      };
      a.onended = finish;
      a.onerror = finish;
      try {
        await a.play();
      } catch (e) {
        // Autoplay refusal or decode error: same sentence, local voice.
        if (ctl.cloudAudio === a) ctl.cloudAudio = null;
        if (ctl.currentUtterance === token) {
          ctl.currentUtterance = null;
          speakLocal(text, cueDur);
        }
      }
    }

    function speakLocal(text, cueDur) {
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) u.voice = v;
      u.lang = LOCALES[settings.targetLang] || settings.targetLang;

      const vv = Number(settings.voiceVolume);
      u.volume = Math.max(0, Math.min(100, Number.isFinite(vv) ? vv : 100)) / 100;
      // Pacing lives in @voxylio/core (computeUtteranceRate).
      u.rate = computeUtteranceRate({
        text,
        cueDur,
        baseRate: settings.rate,
        playbackRate: video.playbackRate || 1,
      });

      const spokeAt = performance.now();
      u.onend = () => {
        // Local usage stats: how long the voice actually spoke.
        recordSpokenSeconds((performance.now() - spokeAt) / 1000);
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
      // Resume a video we auto-paused once the voice has caught up
      if (ctl.autoPaused && !ctl.currentUtterance && ctl.queue.length === 0) {
        ctl.autoPaused = false;
        video.play().catch(() => {});
      }
      if (ctl.currentUtterance || ctl.queue.length === 0) return;
      // Never speak while the video is stopped (except our own catch-up pause)
      if ((video.paused && !ctl.autoPaused) || video.seeking) {
        ctl.queue.length = 0;
        return;
      }
      // Drop lines whose moment is already well past (stale)
      const t = video.currentTime;
      while (
        ctl.queue.length > 0 &&
        ctl.queue[0].end + 4 < t &&
        !ctl.autoPaused
      ) {
        ctl.queue.shift();
      }
      const q = ctl.queue.shift();
      if (!q) return;
      speak(q.text, q.dur, q.id);
    }

    // Bounded enqueue: never lose a line silently. When the voice falls
    // behind, either auto-pause the video (opt-in) or drop the OLDEST
    // waiting line — never the newest, which is the most relevant.
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
      const gen = ctl.generation; // work is void if this changes
      const target = settings.targetLang; // language at trigger time
      const source = effectiveSource();
      // Video already in the target language: nothing to dub.
      if (source !== "auto" && source === target) return;

      // Reuse an identical in-flight translation; never translate two
      // versions of the same group concurrently.
      let entry = ctl.inFlight.get(group.id);
      if (!entry || entry.version !== group.version) {
        entry = {
          version: group.version,
          promise: translate(group.text, source, groupContext(group.id)),
        };
        ctl.inFlight.set(group.id, entry);
      }
      let text;
      try {
        text = await entry.promise;
      } catch (e) {
        // Translation failed: release so a later tick can retry.
        ctl.scheduledIds.delete(group.id);
        ctl.inFlight.delete(group.id);
        return;
      }
      // Anything relevant changed while we were translating? Then this
      // result is history — it must never reach the voice queue.
      if (gen !== ctl.generation) return;
      if (settings.targetLang !== target) return;
      const live = ctl.groups.find((g) => g.id === group.id);
      if (!live || live.version !== group.version) {
        // The group grew after being finalized (rare regroup): drop this
        // stale text and let the next tick reschedule the new version.
        ctl.scheduledIds.delete(group.id);
        ctl.inFlight.delete(group.id);
        return;
      }
      if (settings.subtitles) showCaption(group.text, text);
      // A translation may arrive after the video was paused: never speak
      // while the video is stopped (except our own catch-up pause).
      if (!ctl.active || (video.paused && !ctl.autoPaused) || video.seeking) {
        ctl.scheduledIds.delete(group.id);
        return;
      }
      // A line translated too late must not play once its moment is gone
      if (video.currentTime > group.end + 4) {
        ctl.spokenIds.add(group.id); // deliberately skipped, never revisited
        ctl.scheduledIds.delete(group.id);
        ctl.inFlight.delete(group.id);
        return;
      }
      const dur = group.end - group.start;
      // This line WILL be voiced (now or queued): journal it.
      recordLine(group, text, group.start);
      if (ctl.currentUtterance) {
        enqueue({ text, dur, start: group.start, end: group.end, id: group.id });
      } else {
        speak(text, dur, group.id);
      }
    }

    // --- on-screen captions (original + translation) ----------------------

    function ensureCaptionEl() {
      if (ctl.captionEl) return ctl.captionEl;
      const el = document.createElement("div");
      el.style.cssText =
        "position:fixed; z-index:2147483646; pointer-events:none;" +
        "transform:translateX(-50%); max-width:min(80vw,900px);" +
        "display:none; text-align:center;" +
        "font-family:'Helvetica Neue',helvetica,arial,sans-serif;";
      const orig = document.createElement("div");
      orig.style.cssText =
        "color:rgba(255,255,255,0.75); font-size:14px; line-height:1.35;" +
        "text-shadow:0 1px 3px rgba(0,0,0,0.9); margin-bottom:4px;";
      const trans = document.createElement("div");
      trans.style.cssText =
        "display:inline-block; color:#ffffff; font-size:19px; font-weight:600;" +
        "line-height:1.4; background:rgba(0,0,0,0.6); border-radius:8px;" +
        "padding:4px 12px; text-shadow:0 1px 2px rgba(0,0,0,0.8);";
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
      // User-adjustable size (overlay quick settings).
      const size = Number(settings.captionSize) || 19;
      ctl.captionTrans.style.fontSize = size + "px";
      ctl.captionOrig.style.fontSize = Math.max(12, size - 5) + "px";
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
      ctl.captionEl.style.bottom =
        window.innerHeight - r.bottom + Math.max(20, r.height * 0.07) + "px";
    }

    // --- sync loop ---------------------------------------------------------

    function tick() {
      if (!isAlive()) {
        teardownAll();
        return;
      }
      if (!ctl.active) return;
      const t = video.currentTime;

      // Seek/backward jump: restart cleanly
      if (t < ctl.lastTime - 0.75) {
        fullFlush();
      }
      ctl.lastTime = t;

      if ((video.paused && !ctl.autoPaused) || video.seeking) return;

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
      if (
        current &&
        isFinalGroup(current) &&
        !ctl.spokenIds.has(current.id) &&
        !ctl.scheduledIds.has(current.id)
      ) {
        onGroupEnter(current);
      } else if (!current || !settings.subtitles) {
        hideCaption();
      }
      // Registries are bounded: forget groups far behind the playhead.
      if (Date.now() > ctl.cleanupAt) {
        ctl.cleanupAt = Date.now() + 5000;
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

    // Transient flush: cuts voice + queue and voids in-flight work, but
    // KEEPS spokenIds (a pause must not cause re-speaking on resume).
    function hardStopSpeech() {
      ctl.generation += 1;
      ctl.scheduledIds.clear();
      ctl.inFlight.clear();
      const hadSpeech = ctl.currentUtterance || ctl.queue.length > 0;
      ctl.queue.length = 0;
      ctl.currentUtterance = null;
      ctl.autoPaused = false;
      if (ctl.cloudAudio) {
        try {
          ctl.cloudAudio.pause();
        } catch (e) {}
        ctl.cloudAudio = null;
      }
      // Only cancel the engine when WE were speaking — never interrupt a
      // page's own use of speech synthesis.
      if (hadSpeech) {
        try {
          speechSynthesis.cancel();
        } catch (e) {}
      }
    }

    // --- original audio (ducking) -----------------------------------------

    function setVolume(v) {
      ctl.settingVolume = true;
      video.volume = Math.max(0, Math.min(1, v));
      // volumechange fires asynchronously; release the flag right after
      setTimeout(() => (ctl.settingVolume = false), 0);
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
    // The user moved the volume themselves while dubbing: respect it —
    // never restore a stale value on stop.
    function onVolumeChange() {
      if (!ctl.settingVolume) ctl.savedVolume = null;
    }

    // --- start / stop ------------------------------------------------------

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

    // A pause WE triggered to let the voice catch up must not kill the
    // speech it is waiting for.
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

    // Full flush: also forgets what was spoken — after a seek or a
    // language change the user expects the current passage to be re-dubbed.
    function fullFlush() {
      hardStopSpeech();
      ctl.spokenIds.clear();
    }

    ctl.onSettingsChanged = () => {
      // Dub only the primary video — one voice, one duck, per page.
      // A hostname on the options page's disabled list stays untouched,
      // and nothing starts without a linked account (free plan included).
      if (settings.enabled && accountLinked && !siteDisabled() && video === primaryVideo) {
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
    ctl.flushSpeech = hardStopSpeech; // immediate cut (language change)
    ctl.fullFlush = fullFlush; // seek-grade reset (also forgets spoken groups)
    ctl.harvest();
    ctl.onSettingsChanged();
    return ctl;
  }

  // ------------------------------------------------------ floating menu

  // On-page controller (draggable, dismissible): status + session timer,
  // dubbing toggle, language, voice picker with previews, audio mixer and
  // quick settings — in a closed shadow DOM so page styles never leak in.
  // `var` (hoisted): refreshAll() can run before this section evaluates.
  var overlayHost = null;
  var overlayRefs = null;

  function voicesForTarget() {
    loadVoices();
    const code = settings.targetLang;
    const prefixes = [code, ...(VOICE_PREFIX_ALIASES[code] || [])];
    return voices.filter((v) => {
      const l = (v.lang || "").toLowerCase();
      return prefixes.some(
        (p) => l === p || l.startsWith(p + "-") || l.startsWith(p + "_"),
      );
    });
  }

  function previewVoice(v) {
    try {
      const u = new SpeechSynthesisUtterance(
        PREVIEW_SAMPLES[settings.targetLang] || PREVIEW_SAMPLES.en,
      );
      if (v) u.voice = v;
      u.lang = v ? v.lang : LOCALES[settings.targetLang] || settings.targetLang;
      const vv = Number(settings.voiceVolume);
      u.volume = Math.max(0, Math.min(100, Number.isFinite(vv) ? vv : 100)) / 100;
      speechSynthesis.speak(u); // queued: never cuts the dub mid-line
    } catch (e) {}
  }

  function createOverlay() {
    if (overlayHost) return;
    const T = {
      move: t2("ovlMove", "Déplacer"),
      on: t2("ovlStatusOn", "Doublage actif"),
      off: t2("ovlStatusOff", "En pause"),
      speaking: t2("ovlSpeaking", "Voix en cours"),
      power: t2("ovlPower", "Activer ou couper le doublage"),
      langT: t2("ovlLang", "Langue du doublage"),
      voice: t2("ovlVoice", "Voix"),
      auto: t2("ovlAuto", "Automatique"),
      autoHint: t2("ovlAutoHint", "Meilleure voix installée, choisie pour vous"),
      mixer: t2("ovlMixer", "Mixeur audio"),
      voiceVol: t2("ovlVoiceVol", "Volume de la voix"),
      duckL: t2("ovlDuck", "Original pendant la voix"),
      pImm: t2("ovlPresetImmersion", "Immersion"),
      pBal: t2("ovlPresetBalanced", "Équilibré"),
      pVo: t2("ovlPresetVO", "VO présente"),
      quick: t2("ovlQuick", "Réglages rapides"),
      rateL: t2("ovlRate", "Vitesse de la voix"),
      capL: t2("ovlCaptionSize", "Taille des sous-titres"),
      subsL: t2("ovlSubs", "Sous-titres à l'écran"),
      pauseL: t2("ovlAutoPause", "Pause auto si la voix est en retard"),
      minimize: t2("ovlMinimize", "Réduire"),
      expand: t2("ovlExpand", "Agrandir"),
      close: t2("ovlClose", "Masquer (réactivable depuis le popup)"),
      listen: t2("ovlListen", "Écouter un aperçu"),
      local: t2("appLocalVoice", "locale"),
    };
    overlayHost = document.createElement("div");
    overlayHost.style.cssText =
      "all:initial; position:fixed; z-index:2147483647; bottom:24px; right:24px; left:auto; top:auto;";
    const root = overlayHost.attachShadow({ mode: "closed" });
    root.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .wrap { position: relative; font-family: "Helvetica Neue", helvetica, arial, sans-serif; }
        .bar {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #161616;
          border-radius: 9999px;
          padding: 7px 10px 7px 6px;
          box-shadow: rgba(0,0,0,0.55) 0px 10px 28px, rgb(90,90,90) 0px 0px 0px 1px inset;
          font-size: 12px;
          color: #ffffff;
          user-select: none;
          -webkit-user-select: none;
        }
        .handle { cursor: grab; color: #7c7c7c; font-size: 14px; padding: 4px 0 4px 6px; letter-spacing: -1px; }
        .handle:active { cursor: grabbing; }
        .status {
          display: flex; align-items: center; gap: 7px;
          padding: 0 8px 0 4px; min-width: 0; white-space: nowrap;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #7c7c7c; flex: 0 0 auto; }
        .dot.on { background: #1ed760; }
        @keyframes dot-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(30,215,96,0.5);} 50% { box-shadow: 0 0 0 5px rgba(30,215,96,0);} }
        .dot.speaking { animation: dot-pulse 1.2s ease-out infinite; }
        .stext { font-weight: 700; font-size: 11.5px; color: #e8e8e8; }
        .timer { font-size: 11px; color: #7c7c7c; font-variant-numeric: tabular-nums; border-left: 1px solid #2c2c2c; padding-left: 7px; }
        button {
          font-family: inherit; border: none; background: #222222; color: #ffffff;
          cursor: pointer; border-radius: 9999px;
        }
        button:hover { background: #2c2c2c; }
        button:focus-visible { outline: 2px solid #1ed760; outline-offset: 2px; }
        .power { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; flex: 0 0 auto; transition: background 0.15s; }
        .power svg { display: block; }
        .power.on { background: #1ed760; color: #121212; }
        .power.on:hover { background: #3be477; }
        .power.on svg path { stroke: #121212; }
        select {
          background-color: #222222; color: #ffffff; border: none; border-radius: 9999px;
          font-family: inherit; font-size: 11px; font-weight: 700; padding: 6px 8px;
          cursor: pointer; appearance: none; text-align: center;
        }
        select:hover { background-color: #2c2c2c; }
        select:focus-visible { outline: 2px solid #1ed760; outline-offset: 2px; }
        .chip {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; padding: 6px 10px; max-width: 130px;
        }
        .chip .vname { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .chip .chev, .chip svg { color: #9a9a9a; flex: 0 0 auto; }
        .icon { width: 28px; height: 28px; display: grid; place-items: center; flex: 0 0 auto; color: #d9d9d9; }
        .icon svg { display: block; }
        .ghost { background: transparent; color: #7c7c7c; width: 24px; height: 24px; font-size: 12px; display: grid; place-items: center; }
        .ghost:hover { background: #222222; color: #ffffff; }
        .bar.mini .status, .bar.mini .lang, .bar.mini .voiceBtn, .bar.mini .mixBtn,
        .bar.mini .setBtn, .bar.mini .close { display: none; }

        .pop {
          position: absolute; right: 0; width: 272px;
          background: #161616; border-radius: 14px; padding: 14px;
          box-shadow: rgba(0,0,0,0.55) 0px 14px 34px, rgb(90,90,90) 0px 0px 0px 1px inset;
          color: #ffffff;
        }
        .pop[hidden] { display: none; }
        .pop.above { bottom: calc(100% + 10px); }
        .pop.below { top: calc(100% + 10px); }
        .pop h3 {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1.4px; color: #b3b3b3; margin-bottom: 12px;
        }
        .prow { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 10px 0 6px; }
        .prow .plabel { font-size: 12px; font-weight: 600; color: #e8e8e8; }
        .prow .pval { font-size: 11.5px; color: #b3b3b3; font-variant-numeric: tabular-nums; }
        input[type="range"] {
          -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 9999px;
          background: linear-gradient(to right, #1ed760 0%, #1ed760 var(--fill, 20%), #4d4d4d var(--fill, 20%), #4d4d4d 100%);
          cursor: pointer; display: block;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 12px; height: 12px;
          border-radius: 50%; background: #ffffff; box-shadow: rgba(0,0,0,0.5) 0px 2px 6px;
        }
        input[type="range"]:focus-visible { outline: 2px solid #1ed760; outline-offset: 4px; }
        .presets { display: flex; gap: 6px; margin-top: 12px; }
        .presets button { flex: 1; font-size: 10.5px; font-weight: 700; padding: 7px 4px; }
        .presets button.on { background: #1ed760; color: #121212; }
        .sep { border-top: 1px solid #262626; margin: 12px 0; }
        .trow { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 10px 0; }
        .trow .plabel { font-size: 12px; font-weight: 600; color: #e8e8e8; }
        .switch { position: relative; width: 36px; height: 21px; flex: 0 0 auto; cursor: pointer; display: inline-block; }
        .switch input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
        .knob { position: absolute; inset: 0; background: #333333; border-radius: 9999px; pointer-events: none; transition: background 0.15s; }
        .knob::before { content: ""; position: absolute; width: 15px; height: 15px; left: 3px; top: 3px; background: #ffffff; border-radius: 50%; transition: transform 0.15s; }
        .switch input:checked + .knob { background: #1ed760; }
        .switch input:checked + .knob::before { transform: translateX(15px); background: #121212; }

        .vlist { max-height: 250px; overflow-y: auto; margin: 0 -4px; padding: 0 4px; }
        .vitem {
          width: 100%; display: flex; align-items: center; gap: 8px;
          background: none; border-radius: 10px; padding: 8px 10px; text-align: left;
        }
        .vitem:hover { background: #222222; }
        .vitem.sel { background: #1f2b22; box-shadow: rgba(30,215,96,0.5) 0px 0px 0px 1px inset; }
        .vitem .vmain { flex: 1; min-width: 0; }
        .vitem .vlabel { display: block; font-size: 12.5px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vitem.sel .vlabel { color: #1ed760; }
        .vitem .vsub { display: block; font-size: 10.5px; color: #8f8f8f; margin-top: 1px; }
        .vplay {
          flex: 0 0 auto; width: 26px; height: 26px; border-radius: 50%;
          display: grid; place-items: center; background: #222222; color: #1ed760;
          font-size: 10px; cursor: pointer;
        }
        .vplay:hover { background: #2c2c2c; }
      </style>
      <div class="wrap">
        <div class="bar" role="toolbar" aria-label="Voxylio">
          <span class="handle" title="${T.move}">⠿</span>
          <span class="status"><span class="dot"></span><span class="stext"></span><span class="timer">00:00</span></span>
          <button class="power" aria-label="${T.power}" title="${T.power}">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 6.5v3h2.4L8.5 12V4L4.9 6.5H2.5z" fill="currentColor" stroke="none"/>
              <path d="M10.5 5.5a3.4 3.4 0 010 5M12.3 4a5.8 5.8 0 010 8" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </button>
          <select class="lang" aria-label="${T.langT}" title="${T.langT}"></select>
          <button class="chip voiceBtn" title="${T.voice}">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="5.6" y="1.8" width="4.8" height="8" rx="2.4"/><path d="M3.2 8a4.8 4.8 0 009.6 0M8 12.8v1.6"/></svg>
            <span class="vname"></span><span class="chev">▾</span>
          </button>
          <button class="icon mixBtn" title="${T.mixer}" aria-label="${T.mixer}">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3.5 2.5v6M3.5 11.5v2M8 2.5v2M8 7.5v6M12.5 2.5v6M12.5 11.5v2"/><circle cx="3.5" cy="10" r="1.6"/><circle cx="8" cy="6" r="1.6"/><circle cx="12.5" cy="10" r="1.6"/></svg>
          </button>
          <button class="icon setBtn" title="${T.quick}" aria-label="${T.quick}">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="2.1"/><path d="M8 1.9v1.8M8 12.3v1.8M1.9 8h1.8M12.3 8h1.8M3.7 3.7L5 5M11 11l1.3 1.3M12.3 3.7L11 5M5 11l-1.3 1.3"/></svg>
          </button>
          <button class="ghost mini" title="${T.minimize}">–</button>
          <button class="ghost close" aria-label="${T.close}" title="${T.close}">✕</button>
        </div>

        <div class="pop pop-voice above" hidden>
          <h3 class="vtitle">${T.voice}</h3>
          <div class="vlist"></div>
        </div>

        <div class="pop pop-mix above" hidden>
          <h3>${T.mixer}</h3>
          <div class="prow"><span class="plabel">${T.voiceVol}</span><span class="pval voiceVal"></span></div>
          <input class="voiceVol" type="range" min="0" max="100" step="1" aria-label="${T.voiceVol}" />
          <div class="prow"><span class="plabel">${T.duckL}</span><span class="pval duckVal"></span></div>
          <input class="duckR" type="range" min="0" max="60" step="1" aria-label="${T.duckL}" />
          <div class="presets">
            <button class="pImm">${T.pImm}</button>
            <button class="pBal">${T.pBal}</button>
            <button class="pVo">${T.pVo}</button>
          </div>
        </div>

        <div class="pop pop-set above" hidden>
          <h3>${T.quick}</h3>
          <div class="prow"><span class="plabel">${T.rateL}</span><span class="pval rateVal"></span></div>
          <input class="rateR" type="range" min="0.8" max="1.6" step="0.05" aria-label="${T.rateL}" />
          <div class="prow"><span class="plabel">${T.capL}</span><span class="pval capVal"></span></div>
          <input class="capR" type="range" min="14" max="34" step="1" aria-label="${T.capL}" />
          <div class="sep"></div>
          <div class="trow"><span class="plabel">${T.subsL}</span>
            <label class="switch"><input type="checkbox" class="subsT" /><span class="knob"></span></label></div>
          <div class="trow"><span class="plabel">${T.pauseL}</span>
            <label class="switch"><input type="checkbox" class="pauseT" /><span class="knob"></span></label></div>
        </div>
      </div>`;

    const q = (sel) => root.querySelector(sel);
    overlayRefs = {
      T,
      bar: q(".bar"),
      wrap: q(".wrap"),
      dot: q(".dot"),
      stext: q(".stext"),
      timer: q(".timer"),
      power: q(".power"),
      lang: q(".lang"),
      vname: q(".vname"),
      pops: {
        voice: q(".pop-voice"),
        mix: q(".pop-mix"),
        set: q(".pop-set"),
      },
      vlist: q(".vlist"),
      vtitle: q(".vtitle"),
      voiceVol: q(".voiceVol"),
      voiceVal: q(".voiceVal"),
      duckR: q(".duckR"),
      duckVal: q(".duckVal"),
      rateR: q(".rateR"),
      rateVal: q(".rateVal"),
      capR: q(".capR"),
      capVal: q(".capVal"),
      subsT: q(".subsT"),
      pauseT: q(".pauseT"),
      mini: false,
      activeMs: 0,
      lastTick: performance.now(),
    };

    for (const l of LANGUAGES) {
      const opt = document.createElement("option");
      opt.value = l.code;
      opt.textContent = l.code.toUpperCase();
      overlayRefs.lang.appendChild(opt);
    }

    // --- popovers ---
    const openPop = (name) => {
      const target = overlayRefs.pops[name];
      const willOpen = target.hidden;
      for (const p of Object.values(overlayRefs.pops)) p.hidden = true;
      if (!willOpen) return;
      // Open upward unless the bar sits near the top of the viewport.
      const rect = overlayHost.getBoundingClientRect();
      const below = rect.top < 340;
      for (const p of Object.values(overlayRefs.pops)) {
        p.classList.toggle("above", !below);
        p.classList.toggle("below", below);
      }
      if (name === "voice") renderVoiceList();
      target.hidden = false;
      renderOverlay();
    };
    overlayRefs.closePops = () => {
      if (!overlayRefs) return;
      for (const p of Object.values(overlayRefs.pops)) p.hidden = true;
    };
    q(".voiceBtn").addEventListener("click", () => openPop("voice"));
    q(".mixBtn").addEventListener("click", () => openPop("mix"));
    q(".setBtn").addEventListener("click", () => openPop("set"));
    overlayRefs.onDocDown = (e) => {
      if (!overlayHost) return;
      if (!e.composedPath().includes(overlayHost)) overlayRefs.closePops();
    };
    window.addEventListener("pointerdown", overlayRefs.onDocDown, true);

    function renderVoiceList() {
      const list = overlayRefs.vlist;
      list.replaceChildren();
      const langMeta = LANGUAGES.find((l) => l.code === settings.targetLang);
      overlayRefs.vtitle.textContent =
        T.voice + " — " + (langMeta ? langMeta.name : settings.targetLang);
      const chosen =
        (settings.voiceByLang && settings.voiceByLang[settings.targetLang]) ||
        settings.voiceName;
      const mkItem = (label, sub, sel, voice, name) => {
        const item = document.createElement("button");
        item.className = "vitem" + (sel ? " sel" : "");
        const main = document.createElement("span");
        main.className = "vmain";
        const lab = document.createElement("span");
        lab.className = "vlabel";
        lab.textContent = label;
        const s = document.createElement("span");
        s.className = "vsub";
        s.textContent = sub;
        main.append(lab, s);
        const play = document.createElement("span");
        play.className = "vplay";
        play.textContent = "▶";
        play.title = T.listen;
        play.addEventListener("click", (e) => {
          e.stopPropagation();
          previewVoice(voice);
        });
        item.append(main, play);
        item.addEventListener("click", () => {
          const vb = { ...(settings.voiceByLang || {}) };
          if (name) vb[settings.targetLang] = name;
          else delete vb[settings.targetLang];
          settings.voiceByLang = vb;
          settings.voiceName = name;
          safeSyncSet({ voiceName: name, voiceByLang: vb });
          renderVoiceList();
          renderOverlay();
        });
        list.appendChild(item);
      };
      mkItem(T.auto, T.autoHint, !chosen, null, "");
      for (const v of voicesForTarget()) {
        mkItem(
          v.name,
          v.lang + (v.localService ? " · " + T.local : ""),
          chosen === v.name,
          v,
          v.name,
        );
      }
    }

    // --- bar actions ---
    q(".power").addEventListener("click", () => {
      safeSyncSet({ enabled: !settings.enabled });
    });
    overlayRefs.lang.addEventListener("change", (e) => {
      const next = e.target.value;
      // Per-language voice memory survives language hops.
      safeSyncSet({
        targetLang: next,
        voiceName: (settings.voiceByLang || {})[next] || "",
      });
    });
    q(".mini").addEventListener("click", (e) => {
      overlayRefs.mini = !overlayRefs.mini;
      e.target.textContent = overlayRefs.mini ? "⤢" : "–";
      e.target.title = overlayRefs.mini ? T.expand : T.minimize;
      overlayRefs.closePops();
      renderOverlay();
    });
    q(".close").addEventListener("click", () => {
      safeSyncSet({ overlay: false });
    });

    // --- mixer ---
    let volTimer = null;
    overlayRefs.voiceVol.addEventListener("input", (e) => {
      const v = Number(e.target.value);
      settings.voiceVolume = v;
      renderOverlay();
      clearTimeout(volTimer);
      volTimer = setTimeout(() => safeSyncSet({ voiceVolume: v }), 250);
    });
    let duckTimer = null;
    overlayRefs.duckR.addEventListener("input", (e) => {
      const v = Number(e.target.value);
      settings.duck = v;
      renderOverlay();
      refreshAll();
      clearTimeout(duckTimer);
      duckTimer = setTimeout(() => safeSyncSet({ duck: v }), 250);
    });
    q(".pImm").addEventListener("click", () => safeSyncSet({ duck: 0 }));
    q(".pBal").addEventListener("click", () => safeSyncSet({ duck: 12 }));
    q(".pVo").addEventListener("click", () => safeSyncSet({ duck: 35 }));

    // --- quick settings ---
    let rateTimer = null;
    overlayRefs.rateR.addEventListener("input", (e) => {
      const v = Number(e.target.value);
      settings.rate = v;
      renderOverlay();
      clearTimeout(rateTimer);
      rateTimer = setTimeout(() => safeSyncSet({ rate: v }), 250);
    });
    let capTimer = null;
    overlayRefs.capR.addEventListener("input", (e) => {
      const v = Number(e.target.value);
      settings.captionSize = v;
      renderOverlay();
      clearTimeout(capTimer);
      capTimer = setTimeout(() => safeSyncSet({ captionSize: v }), 250);
    });
    overlayRefs.subsT.addEventListener("change", (e) => {
      safeSyncSet({ subtitles: e.target.checked });
    });
    overlayRefs.pauseT.addEventListener("change", (e) => {
      safeSyncSet({ autoPause: e.target.checked });
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
    handle.addEventListener("pointerup", () => {
      if (!drag) return;
      drag = null;
      const r = overlayHost.getBoundingClientRect();
      safeLocalSet({ overlayPos: { x: r.left, y: r.top } });
    });

    // Restore saved position
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

    // Status heartbeat: speaking pulse + on-page dubbing time.
    overlayRefs.speakTimer = setInterval(() => {
      if (!isAlive()) {
        teardownAll();
        return;
      }
      if (!overlayRefs) return;
      const now = performance.now();
      const delta = now - overlayRefs.lastTick;
      overlayRefs.lastTick = now;
      if (
        settings.enabled &&
        primaryVideo &&
        !primaryVideo.paused &&
        delta < 2000
      ) {
        overlayRefs.activeMs += delta;
      }
      const speaking = anySpeaking();
      overlayRefs.dot.classList.toggle("speaking", speaking);
      overlayRefs.stext.textContent = !settings.enabled
        ? overlayRefs.T.off
        : speaking
          ? overlayRefs.T.speaking
          : overlayRefs.T.on;
      overlayRefs.timer.textContent = fmtTime(overlayRefs.activeMs / 1000);
    }, 400);

    // Keep the controller on-screen after a window resize
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

  // Bundled i18n with a French fallback (the overlay builds its markup
  // once, so labels are resolved at creation time; a UI-language change
  // tears the overlay down and rebuilds it).
  var uiT = null;
  function t2(key, fallback) {
    try {
      if (!uiT) uiT = makeT(resolveUiLang(settings.uiLang, navigator.language));
      return uiT(key) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function destroyOverlay() {
    if (!overlayHost) return;
    if (overlayRefs) {
      clearInterval(overlayRefs.speakTimer);
      window.removeEventListener("resize", overlayRefs.onResize);
      window.removeEventListener("pointerdown", overlayRefs.onDocDown, true);
    }
    overlayHost.remove();
    overlayHost = null;
    overlayRefs = null;
  }

  const setFill = (el, pct) => el.style.setProperty("--fill", pct + "%");

  function renderOverlay() {
    if (!overlayRefs) return;
    const r = overlayRefs;
    r.bar.classList.toggle("mini", !!r.mini);
    r.power.classList.toggle("on", !!settings.enabled);
    r.dot.classList.toggle("on", !!settings.enabled);
    r.lang.value = settings.targetLang;
    const chosen =
      (settings.voiceByLang && settings.voiceByLang[settings.targetLang]) ||
      settings.voiceName;
    r.vname.textContent = chosen ? chosen.split(" ")[0] : r.T.auto;
    // mixer
    r.voiceVol.value = settings.voiceVolume;
    r.voiceVal.textContent = settings.voiceVolume + " %";
    setFill(r.voiceVol, settings.voiceVolume);
    r.duckR.value = settings.duck;
    r.duckVal.textContent = settings.duck + " %";
    setFill(r.duckR, (settings.duck / 60) * 100);
    // quick settings
    r.rateR.value = settings.rate;
    r.rateVal.textContent = "×" + Number(settings.rate).toFixed(2);
    setFill(r.rateR, ((settings.rate - 0.8) / 0.8) * 100);
    r.capR.value = settings.captionSize;
    r.capVal.textContent = settings.captionSize + " px";
    setFill(r.capR, ((settings.captionSize - 14) / 20) * 100);
    r.subsT.checked = !!settings.subtitles;
    r.pauseT.checked = !!settings.autoPause;
  }

  function syncOverlay() {
    // No overlay without a linked account: a dead power button would only
    // confuse — the popup carries the sign-in call to action instead.
    const wanted = settings.overlay && accountLinked && controllers.size > 0;
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
    primaryVideo = pickPrimary();
    syncDomCaptions();
    refreshAll();
  }

  // Cheap maintenance without the DOM walk: harvest known videos and
  // re-arbitrate the primary.
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

  // Mutation-driven scanning: the full DOM walk only runs when nodes were
  // added to the page — plus a slow fallback for players that appear
  // inside existing shadow roots (invisible to the observer).
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
    /* observer unavailable: the slow fallback still covers us */
  }

  function scheduledScan() {
    if (document.hidden) return; // background tab: no scanning work
    const now = Date.now();
    if (scanDirty || now - lastFullScan > 15000) {
      scanDirty = false;
      lastFullScan = now;
      scan();
    } else {
      lightScan();
    }
  }

  // When the extension is reloaded/updated, this script becomes an orphan:
  // chrome.* calls start throwing "Extension context invalidated". Detect
  // it and dismantle everything — restore the volume, remove the overlay
  // and captions, stop the voice and every timer — then release the
  // injection flag so a freshly injected script can take over.
  function teardownAll() {
    try {
      for (const [v, c] of controllers) {
        c.destroy();
        controllers.delete(v);
      }
    } catch (e) {}
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
  const scanTimer = setInterval(guardedScheduledScan, 3000);
  document.addEventListener("visibilitychange", onVisibility);

  // ----------------------------------------------------- popup messages

  function anySpeaking() {
    for (const c of controllers.values()) {
      if (c.currentUtterance) return true;
    }
    return false;
  }

  runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "retry") {
      // User-triggered recovery: re-detect everything from scratch
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
      const targetVoices = voices.filter((v) =>
        (v.lang || "").toLowerCase().startsWith(settings.targetLang)
      );
      const hasSubTracks = tracks.some(
        (t) => t.kind === "subtitles" || t.kind === "captions"
      );
      // Single explicit state for the popup
      let state = "no-video";
      if (siteDisabled()) state = "site-disabled";
      else if (controllers.size > 0) {
        if (nCues > 0) {
          if (targetVoices.length === 0) state = "no-voice";
          else if (translationMode === "none" && lastTranslateError)
            state = settings.cloudFallback
              ? "translate-error"
              : "local-unavailable";
          else state = "ready";
        } else if (hasSubTracks) {
          state = "subs-loading";
        } else if (domSite) {
          // Supported player (YouTube, Netflix…): captions must be
          // switched on in the player for Voxylio to read them.
          state = "enable-subs";
        } else {
          state = "no-subs";
        }
      }
      return {
        version: manifestVersion(),
        page: location.hostname,
        state,
        signinRequired: !accountLinked,
        speaking: anySpeaking(),
        translationMode,
        lastTranslateError,
        videos: controllers.size,
        cues: nCues,
        groups: nGroups,
        tracks,
        builtinTranslator: !builtinBroken,
        provider: chain.lastProviderId(),
        siteDisabled: siteDisabled(),
        voices: targetVoices.map((v) => ({ name: v.name, lang: v.lang })),
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
