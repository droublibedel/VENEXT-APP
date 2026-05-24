import { memo } from "react";

import { TerrainAudioHoldRecorder } from "./TerrainAudioHoldRecorder.js";
import { VenextAudioSpeakerButton } from "./VenextAudioSpeakerButton.js";
import {
  createTerrainAudioAsset,
  getProductVoiceDescription,
  softDeleteTerrainAudioAsset,
} from "./terrain-audio-storage.js";
import { tTerrainAudio, type TerrainAudioLocale } from "./terrain-audio-i18n.js";
import type { ProductVoiceDescriptionRecord } from "./terrain-audio.types.js";
import { trackTerrainAudioEvent } from "./terrain-audio-observability.js";

export const ProductVoiceDescription = memo(function ProductVoiceDescription({
  productId,
  ownerActorId,
  locale = "fr",
  mode = "editor",
  record,
  onChange,
  testId = "tca-product-voice",
}: {
  productId: string;
  ownerActorId: string;
  locale?: TerrainAudioLocale;
  /** editor = grossiste, viewer = détaillant (speaker only if audio exists) */
  mode?: "editor" | "viewer";
  record?: ProductVoiceDescriptionRecord | null;
  onChange?: (record: ProductVoiceDescriptionRecord | null) => void;
  testId?: string;
}) {
  const current = record ?? getProductVoiceDescription(productId);

  if (mode === "viewer") {
    if (!current?.audioUrl || current.deletedAt) return null;
    return (
      <VenextAudioSpeakerButton
        audioId={current.id}
        audioUrl={current.audioUrl}
        durationSeconds={current.durationSeconds}
        locale={locale}
        testId={`${testId}-speaker`}
      />
    );
  }

  return (
    <section data-testid={testId} className="tca-product-voice-editor">
      <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--venext-text-secondary, #526059)" }}>
        {tTerrainAudio("recordProduct", locale)} ({tTerrainAudio("maxDuration", locale)})
      </p>
      {current && !current.deletedAt ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <VenextAudioSpeakerButton
            audioId={current.id}
            audioUrl={current.audioUrl}
            durationSeconds={current.durationSeconds}
            locale={locale}
            testId={`${testId}-preview-speaker`}
          />
          <button
            type="button"
            data-testid={`${testId}-delete`}
            onClick={() => {
              softDeleteTerrainAudioAsset(current.id);
              trackTerrainAudioEvent("audio_product_deleted", { productId });
              onChange?.(null);
            }}
          >
            {tTerrainAudio("deleteAudio", locale)}
          </button>
          <TerrainAudioHoldRecorder
            scopeType="PRODUCT_DESCRIPTION"
            locale={locale}
            testId={`${testId}-re-record`}
            onRecorded={(r) => {
              softDeleteTerrainAudioAsset(current.id);
              const asset = createTerrainAudioAsset({
                ownerActorId,
                scopeType: "PRODUCT_DESCRIPTION",
                scopeId: productId,
                durationSeconds: r.durationSeconds,
                waveformData: r.waveform,
              });
              trackTerrainAudioEvent("audio_product_record_completed", {
                productId,
                durationSeconds: r.durationSeconds,
              });
              onChange?.({
                id: asset.id,
                productId,
                ownerActorId,
                audioUrl: asset.audioUrl,
                durationSeconds: asset.durationSeconds,
                waveform: asset.waveformData,
                createdAt: asset.createdAt,
                status: asset.status,
              });
            }}
          />
        </div>
      ) : (
        <TerrainAudioHoldRecorder
          scopeType="PRODUCT_DESCRIPTION"
          locale={locale}
          testId={`${testId}-record`}
          onRecorded={(r) => {
            trackTerrainAudioEvent("audio_product_record_started", { productId });
            const asset = createTerrainAudioAsset({
              ownerActorId,
              scopeType: "PRODUCT_DESCRIPTION",
              scopeId: productId,
              durationSeconds: r.durationSeconds,
              waveformData: r.waveform,
              pending: false,
            });
            trackTerrainAudioEvent("audio_product_record_completed", {
              productId,
              durationSeconds: r.durationSeconds,
            });
            onChange?.({
              id: asset.id,
              productId,
              ownerActorId,
              audioUrl: asset.audioUrl,
              durationSeconds: asset.durationSeconds,
              waveform: asset.waveformData,
              createdAt: asset.createdAt,
              status: asset.status,
            });
          }}
        />
      )}
    </section>
  );
});
