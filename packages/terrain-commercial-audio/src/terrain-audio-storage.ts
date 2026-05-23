import {
  MAX_BUSINESS_PROFILE_AUDIO_SECONDS,
  MAX_PRODUCT_VOICE_DESCRIPTION_SECONDS,
  TERRAIN_AUDIO_MAX_FILE_BYTES,
} from "./terrain-audio.constants.js";
import type {
  BusinessProfileAudioRecord,
  ProductVoiceDescriptionRecord,
  TerrainAudioAsset,
  TerrainAudioScopeType,
  TerrainAudioStorageMode,
} from "./terrain-audio.types.js";

const assets = new Map<string, TerrainAudioAsset>();
const productByProductId = new Map<string, string>();
const profileByActor = new Map<string, string>();
const pendingUploads: TerrainAudioAsset[] = [];

let storageMode: TerrainAudioStorageMode = "MOCK_URL";

export function setTerrainAudioStorageMode(mode: TerrainAudioStorageMode): void {
  storageMode = mode;
}

export function getTerrainAudioStorageMode(): TerrainAudioStorageMode {
  return storageMode;
}

export function resolveTerrainAudioUrl(assetId: string): string {
  if (storageMode === "LOCAL_DEV") return `blob:terrain-audio-local-${assetId}`;
  return `https://mock.venext.ci/terrain-audio/${assetId}.webm`;
}

export function clampTerrainAudioDuration(
  seconds: number,
  scope: TerrainAudioScopeType,
): { durationSeconds: number; exceeded: boolean } {
  const max =
    scope === "BUSINESS_PROFILE"
      ? MAX_BUSINESS_PROFILE_AUDIO_SECONDS
      : MAX_PRODUCT_VOICE_DESCRIPTION_SECONDS;
  if (seconds <= max) return { durationSeconds: seconds, exceeded: false };
  return { durationSeconds: max, exceeded: true };
}

export function createTerrainAudioAsset(input: {
  ownerActorId: string;
  scopeType: TerrainAudioScopeType;
  scopeId: string;
  durationSeconds: number;
  mimeType?: string;
  sizeBytes?: number;
  waveformData?: number[];
  pending?: boolean;
}): TerrainAudioAsset {
  const { durationSeconds, exceeded } = clampTerrainAudioDuration(
    input.durationSeconds,
    input.scopeType,
  );
  const id = `ta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const asset: TerrainAudioAsset = {
    id,
    ownerActorId: input.ownerActorId,
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    audioUrl: resolveTerrainAudioUrl(id),
    durationSeconds,
    mimeType: input.mimeType ?? "audio/webm",
    sizeBytes: Math.min(input.sizeBytes ?? 120_000, TERRAIN_AUDIO_MAX_FILE_BYTES),
    waveformData: input.waveformData,
    status: input.pending ? "pending" : "ready",
    createdAt: new Date().toISOString(),
    deletedAt: null,
  };
  assets.set(id, asset);
  if (input.pending) pendingUploads.push(asset);
  if (exceeded) asset.status = "ready";
  if (input.scopeType === "PRODUCT_DESCRIPTION") productByProductId.set(input.scopeId, id);
  if (input.scopeType === "BUSINESS_PROFILE") profileByActor.set(input.ownerActorId, id);
  return asset;
}

export function getTerrainAudioAsset(id: string): TerrainAudioAsset | null {
  const a = assets.get(id);
  if (!a || a.deletedAt) return null;
  return a;
}

export function softDeleteTerrainAudioAsset(id: string): boolean {
  const a = assets.get(id);
  if (!a) return false;
  a.deletedAt = new Date().toISOString();
  a.status = "deleted";
  if (a.scopeType === "PRODUCT_DESCRIPTION") productByProductId.delete(a.scopeId);
  if (a.scopeType === "BUSINESS_PROFILE") profileByActor.delete(a.ownerActorId);
  return true;
}

export function getProductVoiceDescription(productId: string): ProductVoiceDescriptionRecord | null {
  const aid = productByProductId.get(productId);
  if (!aid) return null;
  const a = getTerrainAudioAsset(aid);
  if (!a) return null;
  return toProductVoiceRecord(a);
}

export function getBusinessProfileAudio(ownerActorId: string): BusinessProfileAudioRecord | null {
  const aid = profileByActor.get(ownerActorId);
  if (!aid) return null;
  const a = getTerrainAudioAsset(aid);
  if (!a) return null;
  return toBusinessProfileRecord(a);
}

function toProductVoiceRecord(a: TerrainAudioAsset): ProductVoiceDescriptionRecord {
  return {
    id: a.id,
    productId: a.scopeId,
    ownerActorId: a.ownerActorId,
    audioUrl: a.audioUrl,
    durationSeconds: a.durationSeconds,
    waveform: a.waveformData,
    createdAt: a.createdAt,
    deletedAt: a.deletedAt,
    status: a.status,
  };
}

function toBusinessProfileRecord(a: TerrainAudioAsset): BusinessProfileAudioRecord {
  return {
    id: a.id,
    ownerActorId: a.ownerActorId,
    audioUrl: a.audioUrl,
    durationSeconds: a.durationSeconds,
    waveform: a.waveformData,
    createdAt: a.createdAt,
    deletedAt: a.deletedAt,
    status: a.status,
  };
}

export function listPendingTerrainAudioUploads(): TerrainAudioAsset[] {
  return pendingUploads.filter((a) => a.status === "pending" && !a.deletedAt);
}

export function markTerrainAudioUploadReady(id: string): void {
  const a = assets.get(id);
  if (!a) return;
  a.status = "ready";
  const idx = pendingUploads.findIndex((p) => p.id === id);
  if (idx >= 0) pendingUploads.splice(idx, 1);
}

export function resetTerrainAudioStorageForTests(): void {
  assets.clear();
  productByProductId.clear();
  profileByActor.clear();
  pendingUploads.length = 0;
  storageMode = "MOCK_URL";
}
