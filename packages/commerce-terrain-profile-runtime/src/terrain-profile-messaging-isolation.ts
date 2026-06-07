import type { TerrainProfileId } from "./types.js";

const DRAFT_PREFIX = "venext_terrain_messaging_draft_v1";

function draftKey(profile: TerrainProfileId, conversationId: string): string {
  return `${DRAFT_PREFIX}:${profile}:${conversationId}`;
}

const activeRecordingProfiles = new Set<TerrainProfileId>();
const activeUploadTokens = new Map<string, TerrainProfileId>();

export function setMessagingDraft(
  profile: TerrainProfileId,
  conversationId: string,
  text: string,
): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(draftKey(profile, conversationId), text);
}

export function getMessagingDraft(profile: TerrainProfileId, conversationId: string): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(draftKey(profile, conversationId)) ?? "";
}

export function clearMessagingDraftsForProfile(profile: TerrainProfileId): void {
  if (typeof localStorage === "undefined") return;
  const prefix = `${DRAFT_PREFIX}:${profile}:`;
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) localStorage.removeItem(key);
  }
  activeRecordingProfiles.delete(profile);
  for (const [token, owner] of activeUploadTokens) {
    if (owner === profile) activeUploadTokens.delete(token);
  }
}

export function markMessagingAudioRecording(profile: TerrainProfileId, active: boolean): void {
  if (active) activeRecordingProfiles.add(profile);
  else activeRecordingProfiles.delete(profile);
}

export function isMessagingAudioRecording(profile: TerrainProfileId): boolean {
  return activeRecordingProfiles.has(profile);
}

export function registerMessagingUpload(profile: TerrainProfileId, token: string): void {
  activeUploadTokens.set(token, profile);
}

export function cancelMessagingUploadsForProfile(profile: TerrainProfileId): number {
  let cancelled = 0;
  for (const [token, owner] of activeUploadTokens) {
    if (owner === profile) {
      activeUploadTokens.delete(token);
      cancelled += 1;
    }
  }
  return cancelled;
}

export function resetMessagingIsolationRuntime(): void {
  activeRecordingProfiles.clear();
  activeUploadTokens.clear();
}
