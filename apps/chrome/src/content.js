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
  DEFAULTS as SHARED_DEFAULTS,
  createTranslatorChain,
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
} from "@voxylio/webext";


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
    if (changes.provider || changes.cloudFallback) rebuildChain();
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
  let chain = createTranslatorChain([builtinProvider]);

  function rebuildChain() {
    const list = [builtinProvider];
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
  async function translateOnce(text, source, target) {
    try {
      const res = await chain.translate(text, source, target);
      translationMode = res.kind === "local" ? "local" : "cloud";
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

  function translate(text, source) {
    // The language pair is frozen when the request is made: the whole
    // pipeline (translator, fallback, cache key) uses these values, even if
    // the user switches languages mid-translation.
    const target = settings.targetLang;
    const key = source + "->" + target + "::" + text;
    if (cache.has(key)) return cache.get(key);
    const p = (async () => {
      pendingCount++;
      try {
        // Protect technical terms; if the placeholders do not survive the
        // engine, silently retry once without protection.
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
    cachedVoice = pickBestVoice(voices, {
      targetLang: settings.targetLang,
      voiceName: settings.voiceName,
    });
    return cachedVoice;
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
          translate(g.text, source).catch(() => {});
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
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) u.voice = v;
      u.lang = LOCALES[settings.targetLang] || settings.targetLang;

      // Pacing lives in @voxylio/core (computeUtteranceRate).
      u.rate = computeUtteranceRate({
        text,
        cueDur,
        baseRate: settings.rate,
        playbackRate: video.playbackRate || 1,
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
          promise: translate(group.text, source),
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

  // Small on-page controller (draggable, dismissible) to drive dubbing
  // without opening the popup. Isolated inside a closed shadow DOM.
  // `var` (hoisted): refreshAll() can be called by the settings callback
  // before this section of the script has been evaluated.
  var overlayHost = null;
  var overlayRefs = null;

  function createOverlay() {
    if (overlayHost) return;
    // Full catalog, compact labels (the floating bar is small).
    const OVERLAY_LANGS = LANGUAGES.map((l) => [l.code, l.code.toUpperCase()]);
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

    // Speaking indicator: pulse the power button while the voice talks
    overlayRefs.speakTimer = setInterval(() => {
      if (!isAlive()) {
        teardownAll();
        return;
      }
      if (overlayRefs) {
        overlayRefs.power.classList.toggle("speaking", anySpeaking());
      }
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
    overlayRefs.rate.textContent = "×" + Number(settings.rate).toFixed(2);
    overlayRefs.duck.value = settings.duck;
    const pct = (settings.duck / 60) * 100;
    overlayRefs.duck.style.setProperty("--fill", pct + "%");
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
        } else {
          state = hasSubTracks ? "subs-loading" : "no-subs";
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
