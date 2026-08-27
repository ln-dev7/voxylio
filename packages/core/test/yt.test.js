import test from "node:test";
import assert from "node:assert/strict";
import {
  extractCaptionTracks,
  pickCaptionTrack,
  timedtextUrl,
  parseJson3,
  extractAudioTracks,
  isDefaultDubbed,
} from "../src/yt.js";

// A realistic slice of a watch page: nested name objects (the exact
// shape that breaks lazy regexes), escaped URLs, an asr and a manual
// track, and trailing renderer fields after the array.
const HTML =
  '<script>var ytInitialPlayerResponse = {"captions":{"playerCaptionsTracklistRenderer":{"captionTracks":[' +
  '{"baseUrl":"https://www.youtube.com/api/timedtext?v=abc\\u0026lang=en","name":{"runs":[{"text":"English"}]},"vssId":".en","languageCode":"en","isTranslatable":true},' +
  '{"baseUrl":"https://www.youtube.com/api/timedtext?v=abc\\u0026lang=fr\\u0026kind=asr","name":{"simpleText":"French (auto-generated)"},"vssId":"a.fr","languageCode":"fr-FR","kind":"asr"}' +
  '],"audioTracks":[{"captionTrackIndices":[0,1]}],"translationLanguages":[{"languageCode":"ab"}]}},"videoDetails":{}};</script>';

test("extractCaptionTracks parses the nested track array", () => {
  const tracks = extractCaptionTracks(HTML);
  assert.strictEqual(tracks.length, 2);
  assert.strictEqual(tracks[0].languageCode, "en");
  assert.strictEqual(tracks[1].kind, "asr");
});

test("extractCaptionTracks returns [] without captions or on bad markup", () => {
  assert.deepStrictEqual(extractCaptionTracks('<html>"noCaptions":true</html>'), []);
  assert.deepStrictEqual(extractCaptionTracks('"captionTracks":[{"broken":'), []);
  assert.deepStrictEqual(extractCaptionTracks(""), []);
});

test("pickCaptionTrack prefers the wanted language over manual-vs-asr", () => {
  const tracks = extractCaptionTracks(HTML);
  assert.strictEqual(pickCaptionTrack(tracks, "fr").languageCode, "fr-FR");
  // No preference: manual English wins over asr French.
  assert.strictEqual(pickCaptionTrack(tracks, "auto").languageCode, "en");
  assert.strictEqual(pickCaptionTrack(tracks, null).languageCode, "en");
  assert.strictEqual(pickCaptionTrack([], "en"), null);
});

test("pickCaptionTrack avoids the dub language when alternatives exist", () => {
  const tracks = extractCaptionTracks(HTML);
  // Dubbing INTO English: the asr French track is the one to read.
  assert.strictEqual(pickCaptionTrack(tracks, "auto", "en").languageCode, "fr-FR");
  // …but an explicit source choice still wins over the avoidance.
  assert.strictEqual(pickCaptionTrack(tracks, "en", "en").languageCode, "en");
  // Only target-language tracks: better that than nothing.
  const only = [{ baseUrl: "u", languageCode: "en" }];
  assert.strictEqual(pickCaptionTrack(only, "auto", "en").languageCode, "en");
});

test("timedtextUrl unescapes and forces json3", () => {
  const u = timedtextUrl("https://x/api?v=1\\u0026lang=en");
  assert.strictEqual(u, "https://x/api?v=1&lang=en&fmt=json3");
  assert.ok(timedtextUrl("https://x/api").endsWith("?fmt=json3"));
});

test("parseJson3 builds cues, skips append/newline events", () => {
  const cues = parseJson3({
    events: [
      { tStartMs: 0, dDurationMs: 2000, segs: [{ utf8: "Welcome to " }, { utf8: "the course." }] },
      { tStartMs: 1800, aAppend: 1, segs: [{ utf8: "\n" }] },
      { tStartMs: 2500, dDurationMs: 1500, segs: [{ utf8: "\n" }] },
      { tStartMs: 3000, segs: [{ utf8: "Line\ntwo here" }] },
      { tStartMs: 5000, dDurationMs: 1000 },
    ],
  });
  assert.strictEqual(cues.length, 2);
  assert.deepStrictEqual(cues[0], { start: 0, end: 2, text: "Welcome to the course." });
  assert.strictEqual(cues[1].text, "Line two here");
  assert.strictEqual(cues[1].end, cues[1].start + 3); // default duration
  assert.deepStrictEqual(parseJson3(null), []);
});

test("extractAudioTracks + isDefaultDubbed: yt auto-dub default in target", () => {
  const html =
    '..."audioTrack":{"displayName":"English (original)","id":"en.4","audioIsDefault":false}...' +
    '..."audioTrack":{"displayName":"French (auto-dubbed)","id":"fr.3","audioIsDefault":true}...' +
    '..."audioTrack":{"displayName":"French (auto-dubbed)","id":"fr.3","audioIsDefault":true}...';
  const tracks = extractAudioTracks(html);
  assert.equal(tracks.length, 2); // deduped by id
  assert.equal(isDefaultDubbed(tracks, "fr"), true);
  assert.equal(isDefaultDubbed(tracks, "de"), false);
  // Single-language videos never count, whatever the default flag.
  assert.equal(
    isDefaultDubbed(extractAudioTracks('"audioTrack":{"id":"en.4","audioIsDefault":true}'), "en"),
    false,
  );
  assert.equal(isDefaultDubbed([], "fr"), false);
});
