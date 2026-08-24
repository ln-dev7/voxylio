"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  Captions,
  Settings,
  Maximize,
} from "lucide-react";

/**
 * Video placeholder styled as a real player, with a live dubbing demo:
 * an English caption line and its rotating translation, a fake player
 * chrome, and a miniature of the extension's floating dub bar.
 */
const LINES = [
  {
    en: "We're gonna be doing this by using a playground.",
    lang: "FR",
    out: "Nous allons faire cela en utilisant un playground.",
  },
  {
    en: "Context is the most important thing to manage.",
    lang: "ES",
    out: "El contexto es lo más importante que hay que gestionar.",
  },
  {
    en: "Let your agent explore the codebase first.",
    lang: "DE",
    out: "Lass deinen Agenten zuerst die Codebasis erkunden.",
  },
] as const;

const WAVE_DELAYS = [0, 0.15, 0.3, 0.1, 0.25];

// Fake lesson length: 3:38, like a short course video
const DURATION = 218;

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return `${m}:${sec}`;
}

export function DubDemo() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(26);
  const fadeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real clock: the timeline only moves forward while playing, and only
  // restarts when it reaches the end (or when the user drags the slider).
  useEffect(() => {
    if (!playing) return;
    const tick = setInterval(() => {
      setTime((t) => (t + 0.25 >= DURATION ? 0 : t + 0.25));
    }, 250);
    return () => clearInterval(tick);
  }, [playing]);

  // Caption rotation, paused together with the player
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setVisible(false);
      fadeTimeout.current = setTimeout(() => {
        setIndex((i) => (i + 1) % LINES.length);
        setVisible(true);
      }, 350);
    }, 3800);
    return () => {
      clearInterval(timer);
      // Also clear the in-flight fade timeout on unmount / pause
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    };
  }, [playing]);

  const line = LINES[index];
  const progress = (time / DURATION) * 100;

  return (
    <div
      className={`group relative mx-auto max-w-5xl ${
        playing
          ? ""
          : "[&_.wave-bar]:[animation-play-state:paused] [&_.play-ring]:[animation-play-state:paused] [&_.animate-ping]:[animation-play-state:paused]"
      }`}
    >
      {/* Gradient border frame */}
      <div className="rounded-2xl bg-gradient-to-b from-white/12 via-white/5 to-transparent p-px">
        <div className="dot-grid relative aspect-video overflow-hidden rounded-2xl bg-[#0a0c0d] shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
          {/* Ambient glow inside the "video" */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-[60%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-3xl"
          />

          {/* LIVE dub chip */}
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 backdrop-blur-sm sm:left-5 sm:top-5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90">
              Live dub · {line.lang}
            </span>
          </div>

          {/* Play / pause: really drives the demo animation */}
          <button
            type="button"
            aria-label={playing ? "Pause the demo" : "Play the demo"}
            aria-pressed={playing}
            onClick={() => setPlaying((p) => !p)}
            className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <span
              aria-hidden="true"
              className="play-ring absolute size-20 rounded-full border border-primary/50 sm:size-24"
            />
            <span
              aria-hidden="true"
              className="play-ring absolute size-20 rounded-full border border-primary/30 [animation-delay:0.7s] sm:size-24"
            />
            <span className="grid size-16 place-items-center rounded-full bg-primary text-black shadow-[0_0_60px_rgba(30,215,96,0.45)] transition-transform duration-200 group-hover:scale-105 sm:size-20">
              {playing ? (
                <Pause className="size-7 fill-current sm:size-8" />
              ) : (
                <Play className="ml-1 size-7 fill-current sm:size-8" />
              )}
            </span>
          </button>

          {/* Mini floating dub bar (extension replica) */}
          <div className="absolute bottom-16 right-4 hidden items-center gap-2.5 rounded-full border border-white/10 bg-[#181818]/95 py-2 pl-2.5 pr-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] sm:bottom-20 sm:right-6 sm:flex">
            <span className="grid size-7 place-items-center rounded-full bg-primary">
              <Volume2 className="size-3.5 text-black" />
            </span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white">
              {line.lang}
            </span>
            <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
              {WAVE_DELAYS.map((d, i) => (
                <span
                  key={i}
                  className="wave-bar w-[3px] rounded-full bg-primary"
                  style={{ height: "100%", animationDelay: `${d}s` }}
                />
              ))}
            </span>
            <span className="text-[10px] font-semibold tabular-nums text-white/60">
              ×1.10
            </span>
          </div>

          {/* Captions: original + dubbed line */}
          <div
            className={`absolute inset-x-6 bottom-16 text-center transition-all duration-300 sm:bottom-20 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            }`}
          >
            <p className="text-xs text-white/45 sm:text-sm">{line.en}</p>
            <p className="mx-auto mt-1.5 max-w-2xl text-sm font-semibold text-white drop-shadow-md sm:text-lg">
              “{line.out}”
            </p>
          </div>

          {/* Player chrome */}
          <div className="absolute inset-x-0 bottom-0 border-t border-white/[0.06] bg-gradient-to-t from-black/70 to-transparent px-4 pb-3.5 pt-6 sm:px-5">
            {/* Seekable timeline: a real slider driven by the clock */}
            <input
              type="range"
              min={0}
              max={DURATION}
              step={0.1}
              value={time}
              onChange={(e) => setTime(Number(e.target.value))}
              aria-label="Timeline"
              className="demo-seek block w-full"
              style={{
                background: `linear-gradient(to right, #1ed760 0%, #1ed760 ${progress}%, rgba(255,255,255,0.15) ${progress}%, rgba(255,255,255,0.15) 100%)`,
              }}
            />
            <div className="mt-2.5 flex items-center gap-4 text-white/70">
              <button
                type="button"
                aria-label={playing ? "Pause" : "Play"}
                onClick={() => setPlaying((p) => !p)}
                className="cursor-pointer transition-colors hover:text-white"
              >
                {playing ? (
                  <Pause className="size-4 fill-current" />
                ) : (
                  <Play className="size-4 fill-current" />
                )}
              </button>
              <Volume2 className="size-4" />
              <span className="text-[11px] font-medium tabular-nums">
                {fmt(time)} / {fmt(DURATION)}
              </span>
              <span className="flex-1" />
              <Captions className="size-4.5 text-primary" />
              <Settings className="size-4" />
              <Maximize className="size-4" />
            </div>
            <style>{`
              .demo-seek {
                -webkit-appearance: none;
                appearance: none;
                height: 4px;
                border-radius: 9999px;
                cursor: pointer;
              }
              .demo-seek::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #ffffff;
                box-shadow: rgba(0,0,0,0.6) 0px 1px 4px;
                transition: transform 0.15s;
              }
              .demo-seek:hover::-webkit-slider-thumb { transform: scale(1.2); }
              .demo-seek:focus-visible {
                outline: 2px solid #1ed760;
                outline-offset: 3px;
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
}
