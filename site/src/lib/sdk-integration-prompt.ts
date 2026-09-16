import {
  SDK_LICENSE_ENDPOINT,
  SDK_PACKAGE_NAME,
  SDK_VERSION,
} from "@/lib/sdk-product";

/**
 * A framework-neutral implementation brief customers can paste into a coding
 * agent. Keep this aligned with the public v1 API and the packaged docs.
 */
export const SDK_INTEGRATION_PROMPT = `You are integrating ${SDK_PACKAGE_NAME} v${SDK_VERSION} into my existing website or web application.

Voxylio SDK adds synchronized, local-only dubbing to an existing HTML5 video player. It consumes timed captions, optionally translates them on-device when the browser supports it, and speaks them with a local system voice. Do not redesign the application or replace its current video architecture unless that is genuinely necessary.

IMPORTANT: follow the phases below in order.

PHASE 1 — UNDERSTAND THE PROJECT BEFORE CHANGING ANYTHING

Do not install packages, edit files, or generate implementation code yet.

First, inspect the existing project thoroughly and determine:

1. The framework, rendering model, language, package manager, lockfile, build tool, and deployment target.
2. Whether the application uses SSR, React Server Components, client components, SPA navigation, or another lifecycle model.
3. Where video players are created and destroyed.
4. Whether the player exposes a directly accessible HTMLVideoElement.
5. Whether the project uses a native HTML5 player, Video.js, Mux, another wrapper, or a cross-origin YouTube/Vimeo iframe.
6. Where video metadata and language options come from.
7. How captions are stored, authorized, and delivered: WebVTT/SRT URLs, existing TextTrack objects, an API returning normalized cues, same-origin files, or signed cross-origin URLs.
8. Which source and target languages are required, using valid BCP 47 codes such as en, fr, es, or pt-BR.
9. Whether approved translated caption tracks already exist for every target language.
10. The current UI, design system, accessibility conventions, loading states, and error-handling patterns.
11. The current Content Security Policy, CORS configuration, authentication model, and environment-variable conventions.
12. How cleanup happens when a player, lesson, modal, route, or component is removed.
13. Whether another feature on the same page already uses window.speechSynthesis.
14. The existing test setup and browsers officially supported by this project.

Search the actual repository and cite the relevant files in your audit. Do not guess.

Your first response must contain only:

- a concise architecture summary;
- the exact player and caption integration points you found;
- compatibility risks or blockers;
- the files you expect to change;
- your recommended integration plan;
- only the questions that cannot be answered by inspecting the repository.

If the player is only available inside a cross-origin YouTube or Vimeo iframe, explicitly state that the generic Voxylio v1 integration cannot access it. Do not pretend that a CSS selector can reach into that iframe. Recommend a provider-specific adapter or running Voxylio in a same-origin frame instead.

Wait for my confirmation before moving to Phase 2.

PHASE 2 — IMPLEMENT THE INTEGRATION AFTER CONFIRMATION

Before coding, read the installed package README and documentation and treat the installed version as the source of truth. Do not invent undocumented APIs.

1. INSTALL THE PRIVATE PACKAGE SAFELY

Voxylio is distributed as a private GitHub Packages module: ${SDK_PACKAGE_NAME}

Configure the project-level .npmrc without placing a literal token in it:

@ln-dev7:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=\${GITHUB_PACKAGES_TOKEN}

Then use the package manager already present in the project, for example:

pnpm add ${SDK_PACKAGE_NAME}

or the equivalent npm, Yarn, or Bun command.

Security requirements:

- GITHUB_PACKAGES_TOKEN is a private installation credential.
- Give it only the package-read access required by the customer's GitHub configuration.
- Keep it in the developer environment and CI/deployment secret store.
- Never commit it, place it in browser code, or expose it through NEXT_PUBLIC_, VITE_, PUBLIC_, or another client-visible environment variable.
- The token is needed while installing/building the dependency, not while learners use the compiled application.
- The Voxylio site key starts with vx_pk_. It is intentionally public, belongs in browser configuration, and is restricted to licensed domains. It is not the GitHub registry token.

2. PRESERVE THE LOCAL-ONLY PRODUCT BOUNDARY

The built-in Voxylio v1 path must remain local-only:

- do not upload video or audio to Voxylio;
- do not send caption text or translations to Voxylio;
- do not add cloud transcription, translation, or text-to-speech;
- do not add per-minute tracking, playback history, or learner-identity telemetry;
- keep speech.localOnly set to true;
- do not connect a custom network TranslationProvider unless I explicitly approve that product and privacy change.

The production license payload sent to ${SDK_LICENSE_ENDPOINT} contains only the public license key, current page origin/domain, and SDK version. As with any web request, the service infrastructure receives the request's network address. Voxylio derives a daily rotating HMAC bucket from it for abuse prevention, does not store the raw IP address in the license database, and deletes those rate-limit buckets within at most two days. The browser or operating system may separately download a system voice or on-device translation model.

3. CHOOSE THE CORRECT CAPTION STRATEGY

Voxylio v1 does not transcribe videos. Timed captions are required.

Use translation: { strategy: "provided-only" } as the production baseline when translated tracks exist. It works across current desktop Chrome, Edge, Firefox, and Safari when a matching local voice is installed.

Use translation: { strategy: "provided-then-device" } only as progressive enhancement. It uses a supplied target track first, then tries the browser's local Translator API. Firefox and Safari are supplied-track-only browsers in v1.

Use device-only only in a controlled Chrome or Edge desktop environment. Never advertise on-device translation as universally supported.

Caption tracks can be provided as URLs:

{ language: "fr", src: "/captions/lesson-01.fr.vtt" }

or as normalized in-memory cues:

{
  language: "fr",
  cues: [
    { start: 0.8, end: 3.1, text: "Bienvenue." },
    { start: 3.4, end: 6.2, text: "Commençons." }
  ]
}

Cue times are seconds on the video timeline. Use exactly one of src or cues whenever possible. Use BCP 47 tags consistently. If captions are protected, prefer same-origin authenticated URLs, short-lived signed URLs, or short-lived request headers. Never expose a durable server secret in browser JavaScript.

4. INTEGRATE ONLY ON THE CLIENT

Voxylio uses HTMLMediaElement, SpeechSynthesis, and browser events. Do not instantiate it during server rendering.

For Next.js, place the adapter behind a "use client" boundary and initialize it after the HTMLVideoElement ref exists. For another framework, use its browser-only mount lifecycle.

Pass a direct HTMLVideoElement reference. Do not pass a CSS selector, React component, player wrapper, or iframe. For Video.js, Mux, or another compatible wrapper, obtain the actual underlying video element through that player's documented API.

Use one controller per video element and allow only one active dubbing controller per page because Web Speech is shared by the browser document.

5. CREATE THE CONTROLLER USING THE REAL V1 API

Use this as a reference and adapt it to the project instead of copying it blindly:

import {
  Voxylio,
  type VoxylioController,
  type VoxylioErrorEventDetail,
  type VoxylioStatusEventDetail,
} from "${SDK_PACKAGE_NAME}";

let controller: VoxylioController | null = null;

controller = await Voxylio.create({
  player: videoElement,
  captions: {
    sourceLanguage: "en",
    tracks: [
      { language: "en", src: "/captions/lesson-01.en.vtt" },
      { language: "fr", src: "/captions/lesson-01.fr.vtt" },
    ],
  },
  translation: { strategy: "provided-only" },
  speech: {
    localOnly: true,
    rate: 1,
    pitch: 1,
    volume: 1,
    ducking: 0.18,
  },
  ui: { mount: false },
  license: { key: publicVoxylioSiteKey },
});

controller.addEventListener("statuschange", (event) => {
  const { state } = (event as CustomEvent<VoxylioStatusEventDetail>).detail;
  // Map idle, preparing, ready, running, paused, stopped, destroyed,
  // and error into the host application's UI.
});

controller.addEventListener("error", (event) => {
  const { code, error } = (event as CustomEvent<VoxylioErrorEventDetail>).detail;
  // Show a clear, accessible, actionable error without exposing a stack trace.
  console.error(code, error);
});

Voxylio.create(options) and createVoxylio(options) are equivalent and both return Promise<VoxylioController>.

Use ui.mount: false for a localized or branded interface. The packaged v1 widget is minimally styled and English-only. Do not mount it alongside custom controls.

6. REQUIRE AN EXPLICIT USER ACTION

Do not start dubbing on page load. Call prepare() and start() from a click, keyboard activation, or equivalent learner action:

async function startDubbing(targetLanguage: string) {
  if (!controller) return;
  try {
    await controller.prepare({ targetLanguage });
    await controller.start();
  } catch (error) {
    // Reuse the application's accessible error UI.
  }
}

function stopDubbing() {
  controller?.stop();
}

The host application still owns normal video playback. Do not retry prepare() in a tight loop. Handle PREPARE_ABORTED when a language change, stop(), destroy(), or a newer prepare() interrupts an in-flight preparation.

7. IMPLEMENT COMPLETE LIFECYCLE CLEANUP

Call controller.destroy() when the player is permanently removed, and remove every application-owned event listener.

In an SPA, destroy the controller during component or route cleanup. If Voxylio.create() is still pending when the component unmounts, mark the integration as disposed and immediately destroy the controller if that promise later resolves.

A destroyed controller cannot be reused. Recreate it when the underlying video element or caption configuration changes. Never leave a controller attached to a stale lesson or player.

8. BUILD AN ACCESSIBLE HOST UI

Include a target-language selector, explicit start and stop actions, a visible preparing state, an aria-live status region, disabled states during conflicting operations, and actionable messages for missing captions, unavailable translation, missing local voice, CORS failure, or invalid license. Keep original text captions available as an accessibility option.

Use controller.getState() for an initial snapshot and statuschange events for updates; do not poll. Use controller.getVoices() after preparation and controller.setVoice(exactVoiceName), or setVoice(null) for automatic selection. React to utterancestart when recording speech that actually began.

Handle these stable error codes: INVALID_OPTIONS, LICENSE_REQUIRED, LICENSE_INVALID, CAPTIONS_UNAVAILABLE, CAPTIONS_FETCH_FAILED, TRANSLATION_UNAVAILABLE, VOICE_UNAVAILABLE, PREPARE_ABORTED, NOT_PREPARED, DESTROYED, and INTERNAL_ERROR.

9. CONFIGURE CORS AND CSP NARROWLY

Same-origin caption requests use credentials: "same-origin" by default. For cross-origin captions, configure the exact course-site origin whenever possible:

Access-Control-Allow-Origin: https://courses.example.com
Content-Type: text/vtt; charset=utf-8

If cross-origin cookies are genuinely required, configure both sides explicitly with a concrete allowed origin and Access-Control-Allow-Credentials: true. Do not use a wildcard with credentials.

Preserve the existing Content Security Policy and add only the required connect-src origins:

Content-Security-Policy: default-src 'self'; connect-src 'self' https://voxylio.lndev.me https://captions.example.com

Do not use connect-src *. Register every real staging and production domain in the Voxylio license. Localhost, 127.0.0.1, [::1], and *.localhost skip license verification for development; public staging domains do not.

10. RESPECT THE V1 SUPPORT CONTRACT

Baseline: supplied translated tracks plus an installed local voice on desktop Chrome, Edge, Firefox, and Safari on macOS.

Progressive enhancement: on-device translation on compatible Chrome versions/language pairs, and Edge only where it exposes a compatible Translator API.

Outside v1: mobile browsers, videos without timed captions, voice cloning, cloud speech, automatic transcription, cross-origin YouTube/Vimeo iframe control, and identical voice quality across operating systems.

Do not use user-agent sniffing. Let prepare() test the actual captions, translation capability, and installed local voices.

11. VERIFY THE COMPLETE INTEGRATION

Run the existing formatter, linter, type checker, tests, and production build. Add tests for controller creation after the video exists, track configuration, user-initiated start, UI states, missing captions/voice, license rejection, interrupted language switching, cleanup, and the one-active-controller rule.

Also complete a real desktop-browser matrix with supplied tracks on Chrome, Edge, Firefox, and Safari; test Chrome/compatible Edge on-device fallback; then test play, pause, buffering, seeking both directions, playback-rate changes, stop/restart, language changes, CORS failures, invalid licenses, SPA navigation, volume restoration, and absence of repeated or stale speech after seeking.

Serve through HTTPS or localhost, never file://. Verify in the browser's network tools that no captions, audio, video, learner identity, or playback history are sent to Voxylio.

PHASE 3 — REPORT THE RESULT

After implementation, report:

1. Every file changed and why.
2. The selected translation strategy and why.
3. How the HTMLVideoElement and caption tracks are obtained.
4. How lifecycle cleanup and one-controller-per-document behavior are enforced.
5. CSP and CORS requirements.
6. Which checks and browsers were actually tested.
7. Remaining limitations or deployment steps.
8. Every assumption that still needs confirmation.

Do not claim production readiness if licensed domains, real caption delivery, installed voices, production CSP/CORS, or real-browser tests have not been verified.`;
