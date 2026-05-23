"use client";

import { useMemo, useRef, useState } from "react";

type Props = {
  mine: boolean;
  durationSec?: number;
  voiceUrl: string | null;
};

/** Voice-first commerce — waveform + speed are UI stubs; compression handled upstream (Instruction 7 §8). */
export function VoiceMessageBubble({ mine, durationSec = 42, voiceUrl }: Props) {
  const [rate, setRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bars = useMemo(() => Array.from({ length: 28 }, (_, i) => 0.25 + (Math.sin(i * 0.7) + 1) * 0.35), []);

  return (
    <div
      className={`max-w-[min(100%,22rem)] rounded-lg border px-3 py-2 text-[11px] ${
        mine
          ? "border-cyan-700/50 bg-cyan-950/40 text-cyan-50"
          : "border-slate-700/80 bg-slate-900/80 text-slate-100"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium uppercase tracking-wide text-[9px] text-slate-400">
          Note vocale · compression adaptive
        </span>
        <span className="font-mono text-[10px] text-slate-500">{durationSec}s</span>
      </div>
      <div className="mt-2 flex h-10 items-end gap-px">
        {bars.map((h, i) => (
          <span
            key={i}
            className={`w-0.5 rounded-sm ${mine ? "bg-cyan-400/70" : "bg-slate-400/70"}`}
            style={{ height: `${h * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {voiceUrl ? <audio ref={audioRef} src={voiceUrl} preload="none" className="hidden" /> : null}
        <button
          type="button"
          className="rounded border border-slate-600 px-2 py-0.5 text-[10px] hover:border-cyan-500/50"
          onClick={() => {
            const a = audioRef.current;
            if (!a) return;
            void a.play().catch(() => undefined);
          }}
        >
          Lecture
        </button>
        <label className="flex items-center gap-1 text-[10px] text-slate-500">
          Vitesse
          <select
            className="rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-slate-200"
            value={String(rate)}
            onChange={(e) => {
              const v = Number(e.target.value);
              setRate(v);
              if (audioRef.current) audioRef.current.playbackRate = v;
            }}
          >
            <option value="1">1×</option>
            <option value="1.25">1.25×</option>
            <option value="1.5">1.5×</option>
          </select>
        </label>
        <span className="text-[9px] text-slate-600">Upload progressif · 2G/3G</span>
      </div>
    </div>
  );
}
