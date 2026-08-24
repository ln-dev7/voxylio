# Roadmap

What Voxylio does today is documented in the [README](README.md). This
roadmap tracks where it goes next, roughly in order.

## Near term

- **Publish a beta on the Chrome Web Store**, with real compatibility and
  latency measurements across platforms (Udemy, Coursera,
  Teachable, Thinkific, Kajabi, Vimeo, Mux, YouTube, standalone HTML5
  players) — a public compatibility matrix on the website.
- **Privacy page & permission narrowing**: publish a full privacy policy,
  explore optional host permissions / per-site activation instead of
  `<all_urls>`, and document exactly what leaves the device when the online
  fallback is used.
- **Configurable translation provider**: replace the unofficial fallback
  endpoint with an official API (user-provided key) while keeping the
  strict-local mode as the default recommendation.
- **TTML and platform-specific subtitle formats** (WebVTT and SRT are
  supported today).

## Premium track

- **Audio-capture dubbing** for videos without subtitle tracks: tab audio
  capture → streaming transcription → translation → voice. Keeps the free
  tier fully local and subtitle-based; premium unlocks "any video".
- **Cloud voices** (natural TTS) with per-voice preview, styles (neutral,
  energetic, tutorial) and volume normalization.

## Course-companion suite

The dubbing is the entry point; the durable value is the learning layer on
top of it — this is where Voxylio diverges from generic dubbing tools:

- Searchable transcript across all videos of a course
- Timecoded notes and voice bookmarks
- Automatic technical glossary per course, with user corrections that are
  remembered and reapplied
- Chapter summaries, flashcards and lesson Q&A
- Export to Notion / Markdown / PDF
- Bilingual mode for language learning (original + translation side by side)
- Replay a difficult sentence, slowed down
- Consistent terminology across an entire course

## Translation quality

- Custom glossary UI (the engine already protects common technical terms)
- Domain presets: programming, marketing, finance, medicine, design
- More context for the translator (previous sentences, pronoun resolution)
- "Natural" vs "faithful" translation modes
