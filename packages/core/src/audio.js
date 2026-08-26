// Premium Audio (Pro, beta): live transcription of videos that expose
// NO subtitles at all. The content script captures the media element's
// audio, streams 16 kHz linear16 PCM to Deepgram Nova-3 over a
// WebSocket (authenticated with a short-lived token minted by OUR
// backend — the API key never ships), and every final transcript
// becomes an ordinary cue: grouping, translation, pacing and ducking
// are the same engine as everywhere else. These helpers are the pure
// part — URL building, PCM conversion, transcript→cue mapping — so the
// timing math is unit-tested.

export const AUDIO_SAMPLE_RATE = 16000;

/** Deepgram live-listen URL for the dubbing feed. */
export function deepgramLiveUrl(source) {
  const lang =
    source && source !== "auto"
      ? String(source).toLowerCase().split("-")[0]
      : // Nova-3 multilingual: detects and follows code-switching live.
        "multi";
  return (
    "wss://api.deepgram.com/v1/listen" +
    "?model=nova-3" +
    "&encoding=linear16" +
    `&sample_rate=${AUDIO_SAMPLE_RATE}` +
    "&channels=1" +
    "&smart_format=true" +
    "&interim_results=false" +
    "&endpointing=300" +
    `&language=${encodeURIComponent(lang)}`
  );
}

/** Float32 [-1..1] samples → little-endian Int16Array (linear16). */
export function floatTo16BitPCM(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

/**
 * One Deepgram live "Results" message → an engine cue, or null when
 * there is nothing final to speak. Stream time is wall-clock seconds of
 * PLAYED audio: with playbackRate r, one stream second covers r video
 * seconds — cues must land on the VIDEO clock (t0 = video.currentTime
 * when the first sample was captured).
 */
export function transcriptToCue(msg, t0, playbackRate) {
  if (!msg || msg.type !== "Results" || !msg.is_final) return null;
  const alt =
    msg.channel && Array.isArray(msg.channel.alternatives)
      ? msg.channel.alternatives[0]
      : null;
  const text = alt && typeof alt.transcript === "string" ? alt.transcript.trim() : "";
  if (!text) return null;
  const rate = playbackRate > 0 ? playbackRate : 1;
  const start = (Number(msg.start) || 0) * rate + t0;
  const dur = Math.max(0.4, (Number(msg.duration) || 0) * rate);
  return { start, end: start + dur, text };
}
