import { memo, useEffect, useRef, useState } from "react";

export const VenextVoiceWaveform = memo(function VenextVoiceWaveform({
  peaks,
  progress = 0,
  active = false,
  height = 28,
  testId = "venext-voice-waveform",
}: {
  peaks: number[];
  progress?: number;
  active?: boolean;
  height?: number;
  testId?: string;
}) {
  const bars = peaks.length ? peaks : [0.3, 0.5, 0.4, 0.7, 0.5, 0.6, 0.4, 0.5];
  const playedUntil = Math.floor(bars.length * Math.min(1, Math.max(0, progress)));

  return (
    <div
      className={`cm-voice-waveform${active ? " cm-voice-waveform--active" : ""}`}
      data-testid={testId}
      role="img"
      aria-label="Forme d'onde vocale"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        height,
        minWidth: Math.min(120, bars.length * 5),
      }}
    >
      {bars.map((p, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: 3,
            height: Math.max(4, p * height),
            borderRadius: 2,
            background: i < playedUntil ? "#00a884" : "rgba(0,168,132,0.35)",
            transition: "height 80ms ease, background 120ms ease",
          }}
        />
      ))}
    </div>
  );
});

export function useVoicePlayback(durationSec: number): {
  playing: boolean;
  progress: number;
  toggle: () => void;
  pause: () => void;
} {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef(0);

  const stop = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    setPlaying(false);
  };

  const tick = (t: number) => {
    if (!start.current) start.current = t;
    const elapsed = (t - start.current) / 1000;
    const p = Math.min(1, elapsed / Math.max(0.1, durationSec));
    setProgress(p);
    if (p >= 1) {
      stop();
      setProgress(0);
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => stop(), []);

  return {
    playing,
    progress,
    toggle: () => {
      if (playing) {
        stop();
        return;
      }
      start.current = 0;
      setPlaying(true);
      raf.current = requestAnimationFrame(tick);
    },
    pause: stop,
  };
}
