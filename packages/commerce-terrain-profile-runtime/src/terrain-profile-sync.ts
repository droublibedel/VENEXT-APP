import { bootTerrainProfileFromBackend, resyncTerrainProfileFromBackend } from "./profile-runtime-engine.js";
import { loadTerrainProfileState } from "./storage.js";
import type { TerrainProfileState } from "./types.js";
import { isOnline } from "./types.js";

export type TerrainProfileRecoveryResult = {
  recovered: boolean;
  source: "backend" | "cache" | "empty";
  state: TerrainProfileState;
};

export async function recoverTerrainProfileFromServer(userKey: string): Promise<TerrainProfileRecoveryResult> {
  const state = await bootTerrainProfileFromBackend(userKey);
  if (state.currentActiveProfile && !state.cachedProfile) {
    return { recovered: true, source: "backend", state };
  }
  if (state.currentActiveProfile && state.cachedProfile) {
    return { recovered: true, source: "cache", state };
  }
  return { recovered: false, source: "empty", state };
}

export async function syncTerrainProfileWithRetry(userKey: string, maxAttempts = 3): Promise<boolean> {
  if (!isOnline()) return false;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      await resyncTerrainProfileFromBackend(userKey);
      return !loadTerrainProfileState().cachedProfile;
    } catch {
      if (attempt === maxAttempts - 1) return false;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  return false;
}

export function attachTerrainProfileOnlineSync(userKey: string): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onOnline = () => {
    void resyncTerrainProfileFromBackend(userKey);
  };

  window.addEventListener("online", onOnline);
  return () => window.removeEventListener("online", onOnline);
}
