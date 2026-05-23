export type CommercialLocationObservabilityEvent =
  | "gps_permission_granted"
  | "gps_permission_denied"
  | "city_completed"
  | "commercial_location_completed"
  | "location_soft_prompt_displayed"
  | "inferred_location_used";

const events: CommercialLocationObservabilityEvent[] = [];

type Reporter = (event: { name: CommercialLocationObservabilityEvent; at: string }) => void;
let reporter: Reporter | null = null;

export function configureCommercialLocationObservabilityReporter(fn: Reporter): void {
  reporter = fn;
}

export function reportCommercialLocationEvent(event: CommercialLocationObservabilityEvent): void {
  events.push(event);
  reporter?.({ name: event, at: new Date().toISOString() });
}

export function getCommercialLocationObservabilityEvents(): CommercialLocationObservabilityEvent[] {
  return [...events];
}

export function resetCommercialLocationObservability(): void {
  events.length = 0;
}
