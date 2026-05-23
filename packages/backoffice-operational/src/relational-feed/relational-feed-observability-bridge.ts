import {
  configureRelationalFeedObservabilityReporter,
  type RelationalFeedObservabilityEvent,
} from "relational-commerce-feed/resolver";

import { reportLiveOperationalSignal } from "../live-observability/backoffice-live-observability.js";

export function wireRelationalFeedObservabilityBridge(): void {
  configureRelationalFeedObservabilityReporter((event: { name: RelationalFeedObservabilityEvent; metadata: Record<string, string | number | boolean>; at: string }) => {
    reportLiveOperationalSignal({
      signal: event.name,
      level: "INFO",
      partial: { ...event.metadata, at: event.at, domain: "relational_commerce_feed" },
    });
  });
}
