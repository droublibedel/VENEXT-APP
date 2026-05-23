import { memo, useState } from "react";

import { TerrainAudioHoldRecorder } from "./TerrainAudioHoldRecorder.js";
import { VenextAudioSpeakerButton } from "./VenextAudioSpeakerButton.js";
import {
  createTerrainAudioAsset,
  getBusinessProfileAudio,
  softDeleteTerrainAudioAsset,
} from "./terrain-audio-storage.js";
import { tTerrainAudio, type TerrainAudioLocale } from "./terrain-audio-i18n.js";
import type { BusinessProfileAudioRecord } from "./terrain-audio.types.js";
import { trackTerrainAudioEvent } from "./terrain-audio-observability.js";

/** Section profil — non bloquante (GROSSISTE-B-03). */
export const BusinessProfileAudioSection = memo(function BusinessProfileAudioSection({
  ownerActorId,
  locale = "fr",
  initial,
  onChange,
  testId = "tca-business-profile-audio",
}: {
  ownerActorId: string;
  locale?: TerrainAudioLocale;
  initial?: BusinessProfileAudioRecord | null;
  onChange?: (record: BusinessProfileAudioRecord | null) => void;
  testId?: string;
}) {
  const [record, setRecord] = useState(initial ?? getBusinessProfileAudio(ownerActorId));
  const [optionalText, setOptionalText] = useState(record?.optionalText ?? "");

  const update = (next: BusinessProfileAudioRecord | null) => {
    setRecord(next);
    onChange?.(next);
  };

  return (
    <section data-testid={testId} className="tca-business-audio">
      <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>{tTerrainAudio("businessSection", locale)}</h3>
      <p style={{ margin: "0 0 12px", fontSize: 11, color: "#8fa39a" }}>
        {tTerrainAudio("audioPresentation", locale)} — {tTerrainAudio("maxDuration", locale)}
      </p>
      {record && !record.deletedAt ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <VenextAudioSpeakerButton
            audioId={record.id}
            audioUrl={record.audioUrl}
            durationSeconds={record.durationSeconds}
            locale={locale}
            testId={`${testId}-speaker`}
          />
          <button
            type="button"
            data-testid={`${testId}-delete`}
            onClick={() => {
              softDeleteTerrainAudioAsset(record.id);
              update(null);
            }}
          >
            {tTerrainAudio("deleteAudio", locale)}
          </button>
          <TerrainAudioHoldRecorder
            scopeType="BUSINESS_PROFILE"
            locale={locale}
            testId={`${testId}-re-record`}
            onRecorded={(r) => {
              softDeleteTerrainAudioAsset(record.id);
              const asset = createTerrainAudioAsset({
                ownerActorId,
                scopeType: "BUSINESS_PROFILE",
                scopeId: ownerActorId,
                durationSeconds: r.durationSeconds,
                waveformData: r.waveform,
              });
              trackTerrainAudioEvent("business_audio_record_completed", {
                ownerActorId,
                durationSeconds: r.durationSeconds,
              });
              update({
                id: asset.id,
                ownerActorId,
                audioUrl: asset.audioUrl,
                durationSeconds: asset.durationSeconds,
                optionalText,
                waveform: asset.waveformData,
                createdAt: asset.createdAt,
                status: asset.status,
              });
            }}
          />
        </div>
      ) : (
        <TerrainAudioHoldRecorder
          scopeType="BUSINESS_PROFILE"
          locale={locale}
          testId={`${testId}-record`}
          onRecorded={(r) => {
            const asset = createTerrainAudioAsset({
              ownerActorId,
              scopeType: "BUSINESS_PROFILE",
              scopeId: ownerActorId,
              durationSeconds: r.durationSeconds,
              waveformData: r.waveform,
            });
            trackTerrainAudioEvent("business_audio_record_completed", {
              ownerActorId,
              durationSeconds: r.durationSeconds,
            });
            update({
              id: asset.id,
              ownerActorId,
              audioUrl: asset.audioUrl,
              durationSeconds: asset.durationSeconds,
              optionalText,
              waveform: asset.waveformData,
              createdAt: asset.createdAt,
              status: asset.status,
            });
          }}
        />
      )}
      <textarea
        data-testid={`${testId}-optional-text`}
        placeholder="Texte optionnel…"
        value={optionalText}
        onChange={(e) => setOptionalText(e.target.value)}
        rows={2}
        style={{ width: "100%", marginTop: 12, fontSize: 13 }}
      />
    </section>
  );
});
