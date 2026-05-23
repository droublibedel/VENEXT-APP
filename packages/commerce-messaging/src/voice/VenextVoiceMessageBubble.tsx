import { memo } from "react";

import type { CommerceMessage } from "../hooks/commerce-messaging.types.js";
import { VenextVoiceWaveform, useVoicePlayback } from "./VenextVoiceWaveform.js";

export const VenextVoiceMessageBubble = memo(function VenextVoiceMessageBubble({
  message,
  isSelf,
  onDelete,
  testId,
}: {
  message: CommerceMessage;
  isSelf: boolean;
  onDelete?: (id: string) => void;
  testId?: string;
}) {
  const duration = message.voiceDurationSec ?? 1;
  const playback = useVoicePlayback(duration);
  const peaks = message.voiceWaveform ?? [];

  return (
    <article
      data-testid={testId ?? `cm-voice-msg-${message.id}`}
      className={`cm-bubble cm-bubble--voice ${isSelf ? "cm-bubble--self" : "cm-bubble--partner"}`}
      style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}
    >
      <button
        type="button"
        data-testid="cm-voice-play"
        onClick={playback.toggle}
        aria-label={playback.playing ? "Pause" : "Lecture"}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "none",
          background: isSelf ? "#005c4b" : "#1f2c29",
          color: "#00a884",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {playback.playing ? "❚❚" : "▶"}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <VenextVoiceWaveform peaks={peaks} progress={playback.progress} active={playback.playing} />
        <span style={{ fontSize: 11, color: "#8fa39a" }}>{formatDuration(duration)}</span>
      </div>
      {message.status === "sending" ? (
        <span data-testid="cm-voice-status" style={{ fontSize: 10, color: "#8fa39a" }}>
          …
        </span>
      ) : null}
      {isSelf && onDelete ? (
        <button
          type="button"
          data-testid="cm-msg-delete"
          onClick={() => onDelete(message.id)}
          aria-label="Supprimer le message"
          style={{ fontSize: 10, color: "#8fa39a", background: "none", border: "none" }}
        >
          Supprimer
        </button>
      ) : null}
      {message.displayTime ? (
        <p style={{ margin: "4px 0 0", fontSize: 10, color: "#6b8078", textAlign: "right", width: "100%" }}>
          {message.displayTime}
        </p>
      ) : null}
    </article>
  );
});

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
