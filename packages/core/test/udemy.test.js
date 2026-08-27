import test from "node:test";
import assert from "node:assert/strict";
import {
  udemyLectureId,
  udemyCourseId,
  udemyCaptionsUrl,
  udemyCaptionTracks,
} from "../src/udemy.js";
import { pickCaptionTrack } from "../src/yt.js";
import { parseVTT } from "../src/subtitles.js";

test("udemyLectureId: learn URLs parse, everything else is 0", () => {
  assert.equal(
    udemyLectureId(
      "https://www.udemy.com/course/fnb-financial-literacy/learn/lecture/39235028#overview",
    ),
    39235028,
  );
  assert.equal(udemyLectureId("https://www.udemy.com/course/x/"), 0);
  assert.equal(udemyLectureId(null), 0);
});

test("udemyCourseId: JSON attribute, object, and loose-regex fallback", () => {
  assert.equal(udemyCourseId('{"courseId": 1234, "other": 1}'), 1234);
  assert.equal(udemyCourseId({ courseId: 77 }), 77);
  // Malformed JSON still yields the id through the regex net.
  assert.equal(udemyCourseId('{"courseId": 555, broken'), 555);
  assert.equal(udemyCourseId('{"course_id": 888}'), 888);
  assert.equal(udemyCourseId(""), 0);
  assert.equal(udemyCourseId('{"somethingElse": 1}'), 0);
});

test("udemyCaptionsUrl embeds both ids, same-origin path", () => {
  const u = udemyCaptionsUrl(11, 22);
  assert.ok(u.startsWith("/api-2.0/users/me/subscribed-courses/11/lectures/22"));
  assert.ok(u.includes("fields[asset]=captions"));
});

test("udemyCaptionTracks: normalizes locales, flags auto as asr", () => {
  const tracks = udemyCaptionTracks({
    asset: {
      captions: [
        { locale: { locale: "en_US" }, url: "https://cdn/x-en.vtt", source: "manual" },
        { locale: { locale: "fr_FR" }, url: "https://cdn/x-fr.vtt", source: "auto" },
        { locale: { locale: "de_DE" }, url: "" }, // no url: dropped
        null,
      ],
    },
  });
  assert.equal(tracks.length, 2);
  assert.deepEqual(tracks[0], {
    languageCode: "en-US",
    kind: "",
    url: "https://cdn/x-en.vtt",
  });
  assert.equal(tracks[1].kind, "asr");
  assert.deepEqual(udemyCaptionTracks({}), []);
});

test("pickCaptionTrack prefers the human track over asr for the source lang", () => {
  const tracks = udemyCaptionTracks({
    asset: {
      captions: [
        { locale: { locale: "en_US" }, url: "https://cdn/asr.vtt", source: "auto" },
        { locale: { locale: "en_US" }, url: "https://cdn/human.vtt", source: "manual" },
        { locale: { locale: "fr_FR" }, url: "https://cdn/fr.vtt", source: "manual" },
      ],
    },
  });
  // Explicit source language: english, human beats asr.
  assert.equal(pickCaptionTrack(tracks, "en", "fr").url, "https://cdn/human.vtt");
  // Auto-detect with french target: the french track is dodged.
  assert.notEqual(pickCaptionTrack(tracks, null, "fr").url, "https://cdn/fr.vtt");
});

test("parseVTT digests a typical udemy caption file", () => {
  const cues = parseVTT(
    "WEBVTT\n\n1\n00:00:01.240 --> 00:00:04.160\nWelcome to the course.\n\n2\n00:00:04.400 --> 00:00:07.900\nIn this video we will look at\nthe importance of budgeting.\n",
  );
  assert.equal(cues.length, 2);
  assert.equal(cues[0].text, "Welcome to the course.");
  assert.ok(Math.abs(cues[0].start - 1.24) < 0.001);
  assert.equal(
    cues[1].text,
    "In this video we will look at the importance of budgeting.",
  );
});
