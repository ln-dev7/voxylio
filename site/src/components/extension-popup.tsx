"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

/**
 * Interactive, pixel-faithful replica of the extension popup.
 * Pure code (no screenshot): every control actually works.
 */
const LANGS = ["Français", "Español", "Italiano", "Deutsch", "Português"];
const VOICES = ["Automatique", "Thomas (fr-FR)", "Amélie (fr-FR)"];

function Toggle({
  checked,
  onChange,
  small = false,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  small?: boolean;
  label: string;
}) {
  const w = small ? 38 : 46;
  const h = small ? 22 : 26;
  const knob = small ? 16 : 20;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1ed760]"
      style={{
        width: w,
        height: h,
        background: checked ? "#1ed760" : "#3a4149",
        boxShadow: checked
          ? "none"
          : "rgb(18,18,18) 0px 1px 0px, rgb(124,124,124) 0px 0px 0px 1px inset",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute rounded-full transition-transform duration-200"
        style={{
          width: knob,
          height: knob,
          top: (h - knob) / 2,
          left: (h - knob) / 2,
          background: checked ? "#121212" : "#ffffff",
          transform: checked ? `translateX(${w - h}px)` : "translateX(0)",
        }}
      />
    </button>
  );
}

function Select({
  value,
  options,
  onChange,
  id,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  id: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-full border-none bg-[#1f1f1f] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#242424] focus-visible:outline-none"
        style={{
          boxShadow:
            "rgb(18,18,18) 0px 1px 0px, rgb(77,77,77) 0px 0px 0px 1px inset",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 size-3.5 -translate-y-1/2 text-[#b3b3b3]"
      />
    </div>
  );
}

function Slider({
  value,
  min,
  max,
  step,
  onChange,
  id,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  id: string;
  format: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ext-slider flex-1"
        style={{
          background: `linear-gradient(to right, #1ed760 0%, #1ed760 ${pct}%, #4d4d4d ${pct}%, #4d4d4d 100%)`,
        }}
      />
      <span className="w-[46px] text-right text-xs font-bold tabular-nums text-[#b3b3b3]">
        {format(value)}
      </span>
      {/* Slider thumb styling scoped to this component */}
      <style>{`
        .ext-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 9999px;
          cursor: pointer;
        }
        .ext-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: rgba(0,0,0,0.5) 0px 2px 6px;
        }
        .ext-slider:focus-visible {
          outline: 2px solid #1ed760;
          outline-offset: 4px;
        }
      `}</style>
    </div>
  );
}

export function ExtensionPopup() {
  const t = useTranslations("Popup");
  const [enabled, setEnabled] = useState(true);
  const [lang, setLang] = useState(LANGS[0]);
  const [voice, setVoice] = useState(VOICES[0]);
  const [rate, setRate] = useState(1.1);
  const [duck, setDuck] = useState(12);

  return (
    <div
      className="w-full max-w-[340px] rounded-2xl bg-[#121212] p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      style={{
        fontFamily: '"Helvetica Neue", helvetica, arial, sans-serif',
        boxShadow:
          "rgba(0,0,0,0.55) 0 24px 80px, rgba(255,255,255,0.07) 0 0 0 1px",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#1ed760]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2.5 6.5v3h2.4L8.5 12V4L4.9 6.5H2.5z" fill="#121212" />
            <path
              d="M10.5 5.5a3.4 3.4 0 010 5M12.3 4a5.8 5.8 0 010 8"
              stroke="#121212"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="flex-1 text-base font-bold tracking-tight">
          Video Dub
        </span>
        <Toggle checked={enabled} onChange={setEnabled} label={t("toggle")} />
      </div>

      {/* Status card */}
      <div
        className="mt-3.5 rounded-lg bg-[#181818] px-3.5 py-3 text-xs leading-relaxed text-[#b3b3b3]"
        aria-live="polite"
        style={{ boxShadow: "rgba(0,0,0,0.3) 0px 8px 8px" }}
      >
        {enabled ? (
          <>
            <span className="block font-bold text-[#1ed760]">
              ✓ {t("statusVideo")}
            </span>
            <span className="block font-bold text-[#1ed760]">
              ✓ {t("statusLines")}
            </span>
          </>
        ) : (
          <span className="block font-bold text-[#ffa42b]">
            {t("statusOff")}
          </span>
        )}
        {t("statusTranslation")}
      </div>

      {/* Language */}
      <div className="mt-4">
        <label
          htmlFor="demo-lang"
          className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[1.5px] text-[#b3b3b3]"
        >
          {t("langLabel")}
        </label>
        <Select id="demo-lang" value={lang} options={LANGS} onChange={setLang} />
      </div>

      {/* Voice */}
      <div className="mt-3.5">
        <label
          htmlFor="demo-voice"
          className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[1.5px] text-[#b3b3b3]"
        >
          {t("voiceLabel")}
        </label>
        <Select
          id="demo-voice"
          value={voice}
          options={VOICES}
          onChange={setVoice}
        />
      </div>

      {/* Rate */}
      <div className="mt-3.5">
        <label
          htmlFor="demo-rate"
          className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[1.5px] text-[#b3b3b3]"
        >
          {t("rateLabel")}
        </label>
        <Slider
          id="demo-rate"
          value={rate}
          min={0.8}
          max={1.6}
          step={0.05}
          onChange={setRate}
          format={(v) => `×${v.toFixed(2)}`}
        />
      </div>

      {/* Original audio */}
      <div className="mt-3.5">
        <label
          htmlFor="demo-duck"
          className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[1.5px] text-[#b3b3b3]"
        >
          {t("duckLabel")}
        </label>
        <Slider
          id="demo-duck"
          value={duck}
          min={0}
          max={60}
          step={1}
          onChange={setDuck}
          format={(v) => `${v} %`}
        />
      </div>

      {/* Hint */}
      <p className="mt-4 border-t border-[#2a2a2a] pt-3 text-[11px] leading-relaxed text-[#7c7c7c]">
        {t("hint")}
      </p>
    </div>
  );
}
