import {
  configureTerrainAudioObservabilityReporter,
  type TerrainAudioObservabilityEvent,
} from "terrain-commercial-audio";

import { reportLiveOperationalSignal } from "../live-observability/backoffice-live-observability.js";

/** Relie les événements audio terrain au backoffice — métadonnées uniquement. */
export function wireTerrainAudioObservabilityBridge(): void {
  configureTerrainAudioObservabilityReporter((event: TerrainAudioObservabilityEvent) => {
    reportLiveOperationalSignal({
      signal: event.name,
      level: event.name.includes("failed") ? "WARNING" : "INFO",
      partial: {
        ...event.metadata,
        at: event.at,
        domain: "terrain_commercial_audio",
      },
    });
  });
}
