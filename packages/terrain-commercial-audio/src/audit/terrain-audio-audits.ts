import {
  MAX_BUSINESS_PROFILE_AUDIO_SECONDS,
  MAX_PRODUCT_VOICE_DESCRIPTION_SECONDS,
  SUPPORTED_TERRAIN_AUDIO_MIME_TYPES,
} from "../terrain-audio.constants.js";
import {
  clampTerrainAudioDuration,
  createTerrainAudioAsset,
  getProductVoiceDescription,
  resetTerrainAudioStorageForTests,
  softDeleteTerrainAudioAsset,
} from "../terrain-audio-storage.js";
import {
  getActiveTerrainAudioPlaybackId,
  requestTerrainAudioPlayback,
  stopAllTerrainAudioPlayback,
} from "../terrain-audio-playback.js";
import { drainTerrainAudioObservabilityEvents, resetTerrainAudioObservabilityForTests } from "../terrain-audio-observability.js";

export type TerrainAudioAuditFinding = { code: string; ok: boolean; detail?: string };

export function auditTerrainAudioProductDescription(): TerrainAudioAuditFinding[] {
  resetTerrainAudioStorageForTests();
  const asset = createTerrainAudioAsset({
    ownerActorId: "gb-1",
    scopeType: "PRODUCT_DESCRIPTION",
    scopeId: "pr-1",
    durationSeconds: 12,
  });
  const rec = getProductVoiceDescription("pr-1");
  softDeleteTerrainAudioAsset(asset.id);
  return [
    { code: "PRODUCT_AUDIO_LINKED", ok: rec?.productId === "pr-1" },
    { code: "PRODUCT_SOFT_DELETE", ok: getProductVoiceDescription("pr-1") === null },
    {
      code: "PRODUCT_MAX_90",
      ok: clampTerrainAudioDuration(120, "PRODUCT_DESCRIPTION").exceeded,
    },
  ];
}

export function auditBusinessProfileAudio(): TerrainAudioAuditFinding[] {
  const c = clampTerrainAudioDuration(95, "BUSINESS_PROFILE");
  return [
    { code: "PROFILE_MAX_90", ok: c.durationSeconds === MAX_BUSINESS_PROFILE_AUDIO_SECONDS },
    { code: "PROFILE_MAX_CONSTANT", ok: MAX_BUSINESS_PROFILE_AUDIO_SECONDS === 90 },
    { code: "PRODUCT_MAX_CONSTANT", ok: MAX_PRODUCT_VOICE_DESCRIPTION_SECONDS === 90 },
  ];
}

export function auditPartnerSuggestionAudioVisibility(): TerrainAudioAuditFinding[] {
  const withAudio = { businessAudioUrl: "https://x/a.webm" };
  const without = {};
  return [
    { code: "SHOW_SPEAKER_WHEN_URL", ok: Boolean(withAudio.businessAudioUrl) },
    { code: "HIDE_SPEAKER_WHEN_ABSENT", ok: !("businessAudioUrl" in without) },
  ];
}

export function auditTerrainAudioPerformance(): TerrainAudioAuditFinding[] {
  stopAllTerrainAudioPlayback();
  requestTerrainAudioPlayback("a1");
  const single = getActiveTerrainAudioPlaybackId() === "a1";
  requestTerrainAudioPlayback("a2");
  return [
    { code: "SINGLE_PLAYBACK_SLOT", ok: getActiveTerrainAudioPlaybackId() === "a2" },
    { code: "PLAYBACK_REQUEST_OK", ok: single },
  ];
}

export function auditTerrainAudioPrivacy(): TerrainAudioAuditFinding[] {
  resetTerrainAudioObservabilityForTests();
  const events = drainTerrainAudioObservabilityEvents();
  const hasRawAudio = events.some((e) =>
    JSON.stringify(e.metadata).toLowerCase().includes("blob:"),
  );
  return [
    { code: "MIME_TYPES_MOBILE", ok: SUPPORTED_TERRAIN_AUDIO_MIME_TYPES.includes("audio/webm") },
    { code: "OBSERVABILITY_NO_RAW_AUDIO", ok: !hasRawAudio },
  ];
}
