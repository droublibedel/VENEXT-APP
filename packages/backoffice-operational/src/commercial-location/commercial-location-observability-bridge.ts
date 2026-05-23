import {
  configureCommercialLocationObservabilityReporter,
  type CommercialLocationObservabilityEvent,
} from "commercial-location-terrain";

import { reportLiveOperationalSignal } from "../live-observability/backoffice-live-observability.js";

export function wireCommercialLocationObservabilityBridge(): void {
  configureCommercialLocationObservabilityReporter((event: {
    name: CommercialLocationObservabilityEvent;
    at: string;
  }) => {
    reportLiveOperationalSignal({
      signal: event.name,
      level: "INFO",
      partial: { at: event.at, domain: "commercial_location_terrain" },
    });
  });
}
