import { loadTerrainProfileState, saveTerrainProfileState } from "./storage.js";

const SESSION_PREFIX = "venext-terrain-";

export function createProfileSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${SESSION_PREFIX}${crypto.randomUUID()}`;
  }
  return `${SESSION_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ensureProfileSessionId(): string {
  const state = loadTerrainProfileState();
  if (state.profileSessionId) return state.profileSessionId;
  const profileSessionId = createProfileSessionId();
  saveTerrainProfileState({ ...state, profileSessionId });
  return profileSessionId;
}

export function rotateProfileSessionId(): string {
  const state = loadTerrainProfileState();
  const profileSessionId = createProfileSessionId();
  saveTerrainProfileState({ ...state, profileSessionId });
  return profileSessionId;
}
