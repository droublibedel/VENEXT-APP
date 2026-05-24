import { memo, useCallback, useEffect, useRef, useState } from "react";

import {
  MAX_BUSINESS_PROFILE_AUDIO_SECONDS,
  MAX_PRODUCT_VOICE_DESCRIPTION_SECONDS,
  TERRAIN_AUDIO_DURATION_EXCEEDED_MESSAGE,
} from "./terrain-audio.constants.js";
import { tTerrainAudio, type TerrainAudioLocale } from "./terrain-audio-i18n.js";
import type { TerrainAudioScopeType } from "./terrain-audio.types.js";

export type TerrainAudioRecordResult = {
  durationSeconds: number;
  exceeded: boolean;
  waveform: number[];
};

function peaksFromDuration(sec: number): number[] {
  const n = Math.min(32, Math.max(8, Math.round(sec * 6)));
  return Array.from({ length: n }, (_, i) => 0.3 + Math.sin(i * 0.8) * 0.25);
}

export const TerrainAudioHoldRecorder = memo(function TerrainAudioHoldRecorder({
  scopeType,
  locale = "fr",
  onRecorded,
  onCancel,
  testId = "terrain-audio-recorder",
}: {
  scopeType: TerrainAudioScopeType;
  locale?: TerrainAudioLocale;
  onRecorded: (result: TerrainAudioRecordResult) => void;
  onCancel?: () => void;
  testId?: string;
}) {
  const maxSec =
    scopeType === "BUSINESS_PROFILE"
      ? MAX_BUSINESS_PROFILE_AUDIO_SECONDS
      : MAX_PRODUCT_VOICE_DESCRIPTION_SECONDS;
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState<TerrainAudioRecordResult | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const elapsed = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(() => () => stopTimer(), []);

  const finish = useCallback(() => {
    stopTimer();
    setRecording(false);
    const dur = Math.max(0.3, elapsed.current);
    const exceeded = dur > maxSec;
    const clamped = Math.min(dur, maxSec);
    if (exceeded) setWarn(TERRAIN_AUDIO_DURATION_EXCEEDED_MESSAGE);
    const result: TerrainAudioRecordResult = {
      durationSeconds: clamped,
      exceeded,
      waveform: peaksFromDuration(clamped),
    };
    setPreview(result);
    elapsed.current = 0;
  }, [maxSec]);

  return (
    <div data-testid={testId}>
      {preview ? (
        <div data-testid={`${testId}-preview`} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span>{preview.durationSeconds.toFixed(1)} s</span>
          <button type="button" data-testid={`${testId}-confirm`} onClick={() => onRecorded(preview)}>
            OK
          </button>
          <button
            type="button"
            data-testid={`${testId}-discard`}
            onClick={() => {
              setPreview(null);
              setWarn(null);
              onCancel?.();
            }}
          >
            {tTerrainAudio("deleteAudio", locale)}
          </button>
        </div>
      ) : (
        <button
          type="button"
          data-testid={`${testId}-hold`}
          aria-label={tTerrainAudio("holdToRecord", locale)}
          className={recording ? "terrain-rec--active" : ""}
          onPointerDown={() => {
            setRecording(true);
            setWarn(null);
            elapsed.current = 0;
            timer.current = setInterval(() => {
              elapsed.current += 0.25;
            }, 250);
          }}
          onPointerUp={finish}
          onPointerCancel={finish}
          style={{ minHeight: 44, minWidth: 44, borderRadius: 22, border: "none", background: "#00A884", color: "#fff" }}
        >
          🎤
        </button>
      )}
      {warn ? (
        <p data-testid={`${testId}-duration-warn`} style={{ fontSize: 11, color: "#c4a574", margin: "6px 0 0" }}>
          {warn}
        </p>
      ) : null}
      <p style={{ fontSize: 10, color: "#66746D", margin: "4px 0 0" }}>{tTerrainAudio("maxDuration", locale)}</p>
    </div>
  );
});
