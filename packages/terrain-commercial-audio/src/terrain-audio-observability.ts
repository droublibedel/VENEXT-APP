import type { TerrainAudioObservabilityEvent, TerrainAudioObservabilityEventName } from "./terrain-audio.types.js";

const buffer: TerrainAudioObservabilityEvent[] = [];
let reporter: ((event: TerrainAudioObservabilityEvent) => void) | null = null;

/** Métadonnées uniquement — jamais de contenu audio brut. */
export function trackTerrainAudioEvent(
  name: TerrainAudioObservabilityEventName,
  metadata: Record<string, string | number | boolean> = {},
): void {
  const event: TerrainAudioObservabilityEvent = {
    name,
    metadata: { ...metadata },
    at: new Date().toISOString(),
  };
  buffer.push(event);
  reporter?.(event);
}

export function configureTerrainAudioObservabilityReporter(
  fn: ((event: TerrainAudioObservabilityEvent) => void) | null,
): void {
  reporter = fn;
}

export function drainTerrainAudioObservabilityEvents(): TerrainAudioObservabilityEvent[] {
  return [...buffer];
}

export function resetTerrainAudioObservabilityForTests(): void {
  buffer.length = 0;
  reporter = null;
}
