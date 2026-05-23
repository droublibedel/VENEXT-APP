export type TerrainPlaybackListener = (activeId: string | null) => void;

let activePlaybackId: string | null = null;
const listeners = new Set<TerrainPlaybackListener>();

export function subscribeTerrainAudioPlayback(fn: TerrainPlaybackListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(): void {
  for (const fn of listeners) fn(activePlaybackId);
}

/** Un seul audio en lecture à la fois (faible RAM). */
export function requestTerrainAudioPlayback(id: string): boolean {
  activePlaybackId = id;
  notify();
  return true;
}

export function pauseTerrainAudioPlayback(id: string): void {
  if (activePlaybackId === id) {
    activePlaybackId = null;
    notify();
  }
}

export function stopAllTerrainAudioPlayback(): void {
  activePlaybackId = null;
  notify();
}

export function getActiveTerrainAudioPlaybackId(): string | null {
  return activePlaybackId;
}

export function isTerrainAudioPlaying(id: string): boolean {
  return activePlaybackId === id;
}
