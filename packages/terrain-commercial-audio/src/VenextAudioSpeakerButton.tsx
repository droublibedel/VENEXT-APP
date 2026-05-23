import { memo, useCallback, useEffect, useState } from "react";

import {
  isTerrainAudioPlaying,
  pauseTerrainAudioPlayback,
  requestTerrainAudioPlayback,
  subscribeTerrainAudioPlayback,
} from "./terrain-audio-playback.js";
import { tTerrainAudio, type TerrainAudioLocale } from "./terrain-audio-i18n.js";
import type { TerrainAudioSpeakerState } from "./terrain-audio.types.js";
import { trackTerrainAudioEvent } from "./terrain-audio-observability.js";
import { TERRAIN_AUDIO_UNAVAILABLE_MESSAGE } from "./terrain-audio.constants.js";

export const VenextAudioSpeakerButton = memo(function VenextAudioSpeakerButton({
  audioId,
  audioUrl,
  durationSeconds,
  locale = "fr",
  lazy = true,
  testId = "venext-audio-speaker",
}: {
  audioId: string;
  audioUrl?: string;
  durationSeconds?: number;
  locale?: TerrainAudioLocale;
  /** Pas de préchargement — lecture au clic */
  lazy?: boolean;
  testId?: string;
}) {
  const [state, setState] = useState<TerrainAudioSpeakerState>("ready");
  const [loaded, setLoaded] = useState(!lazy);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return subscribeTerrainAudioPlayback((active) => {
      if (active === audioId) setState("playing");
      else if (state === "playing") setState("paused");
    });
  }, [audioId, state]);

  const toggle = useCallback(() => {
    if (!audioUrl) {
      setState("error");
      setErrorMsg(TERRAIN_AUDIO_UNAVAILABLE_MESSAGE);
      trackTerrainAudioEvent("audio_play_failed", { audioId, reason: "no_url" });
      return;
    }
    if (isTerrainAudioPlaying(audioId)) {
      pauseTerrainAudioPlayback(audioId);
      setState("paused");
      return;
    }
    setState("loading");
    if (!loaded) setLoaded(true);
    try {
      requestTerrainAudioPlayback(audioId);
      setState("playing");
      setErrorMsg(null);
    } catch {
      setState("error");
      setErrorMsg(tTerrainAudio("audioUnavailable", locale));
      trackTerrainAudioEvent("audio_play_failed", { audioId });
    }
  }, [audioId, audioUrl, loaded, locale]);

  const label =
    state === "playing"
      ? "Pause"
      : state === "loading"
        ? "…"
        : tTerrainAudio("listenDescription", locale);

  return (
    <div data-testid={testId} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <button
        type="button"
        data-testid={`${testId}-btn`}
        data-state={state}
        aria-label={label}
        onClick={toggle}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "none",
          background: state === "playing" ? "#005c4b" : "#1f2c29",
          color: "#00a884",
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {state === "playing" ? "❚❚" : "🔊"}
      </button>
      {durationSeconds ? (
        <span data-testid={`${testId}-duration`} style={{ fontSize: 11, color: "#8fa39a" }}>
          {formatDur(durationSeconds)}
        </span>
      ) : null}
      {state === "error" && errorMsg ? (
        <span data-testid={`${testId}-error`} style={{ fontSize: 10, color: "#c4a574" }}>
          {errorMsg}
        </span>
      ) : null}
      {loaded && audioUrl ? (
        <audio data-testid={`${testId}-element`} preload="none" src={audioUrl} style={{ display: "none" }} />
      ) : null}
    </div>
  );
});

function formatDur(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
