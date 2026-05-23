import { memo, useCallback, useEffect, useRef, useState } from "react";

import { generateVoiceWaveformPeaks } from "../realtime/commerce-messaging-realtime.js";
import { VenextVoiceWaveform } from "./VenextVoiceWaveform.js";

export type VoiceRecordingResult = {
  durationSec: number;
  waveform: number[];
  previewUrl: string;
};

export const VenextVoiceRecorder = memo(function VenextVoiceRecorder({
  onRecorded,
  onCancel,
  testId = "venext-voice-recorder",
}: {
  onRecorded: (result: VoiceRecordingResult) => void;
  onCancel?: () => void;
  testId?: string;
}) {
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState<VoiceRecordingResult | null>(null);
  const [slideCancel, setSlideCancel] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startY = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const livePeaks = useRef<number[]>(generateVoiceWaveformPeaks(1, 1));

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(() => () => stopTimer(), []);

  const startRecording = useCallback(() => {
    setRecording(true);
    setSlideCancel(false);
    setPreview(null);
    setElapsed(0);
    let t = 0;
    timer.current = setInterval(() => {
      t += 0.2;
      setElapsed(t);
      livePeaks.current = generateVoiceWaveformPeaks(t, Math.floor(t * 10));
    }, 200);
  }, []);

  const finishRecording = useCallback(() => {
    stopTimer();
    setRecording(false);
    if (slideCancel || elapsed < 0.4) {
      onCancel?.();
      setSlideCancel(false);
      return;
    }
    const durationSec = Math.min(120, Math.max(0.5, elapsed));
    const result: VoiceRecordingResult = {
      durationSec,
      waveform: generateVoiceWaveformPeaks(durationSec, 42),
      previewUrl: "blob:venext-voice-preview",
    };
    setPreview(result);
  }, [elapsed, onCancel, slideCancel]);

  const confirmSend = () => {
    if (preview) onRecorded(preview);
    setPreview(null);
  };

  return (
    <div className="cm-voice-recorder" data-testid={testId}>
      {preview ? (
        <div data-testid="cm-voice-preview" style={{ display: "flex", alignItems: "center", gap: 8, padding: 8 }}>
          <VenextVoiceWaveform peaks={preview.waveform} />
          <span style={{ fontSize: 12 }}>{preview.durationSec.toFixed(1)} s</span>
          <button type="button" data-testid="cm-voice-send" onClick={confirmSend} className="cm-voice-recorder-send">
            Envoyer
          </button>
          <button
            type="button"
            data-testid="cm-voice-discard"
            onClick={() => {
              setPreview(null);
              onCancel?.();
            }}
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          type="button"
          data-testid="cm-voice-hold-mic"
          className={`cm-voice-mic-btn${recording ? " cm-voice-mic-btn--active" : ""}${slideCancel ? " cm-voice-mic-btn--cancel" : ""}`}
          aria-label="Maintenir pour enregistrer"
          onPointerDown={(e) => {
            startY.current = e.clientY;
            const el = e.currentTarget;
            if (typeof el.setPointerCapture === "function") {
              el.setPointerCapture(e.pointerId);
            }
            startRecording();
          }}
          onPointerMove={(e) => {
            if (!recording) return;
            setSlideCancel(startY.current - e.clientY > 72);
          }}
          onPointerUp={() => finishRecording()}
          onPointerCancel={() => finishRecording()}
        >
          {recording ? (
            <>
              <VenextVoiceWaveform peaks={livePeaks.current} active />
              <span>{slideCancel ? "Relâcher pour annuler" : "Glisser ↑ pour annuler"}</span>
            </>
          ) : (
            "🎤"
          )}
        </button>
      )}
    </div>
  );
});
