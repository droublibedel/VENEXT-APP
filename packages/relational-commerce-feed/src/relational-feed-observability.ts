export type RelationalFeedObservabilityEvent =
  | "feed_empty_prevented"
  | "sponsored_relational_inserted"
  | "bootstrap_content_served"
  | "partner_feed_exhausted"
  | "discovery_feed_injected"
  | "relational_invitation_sent"
  | "relational_invitation_auto_accepted";

const buffer: Array<{ name: RelationalFeedObservabilityEvent; metadata: Record<string, string | number | boolean>; at: string }> = [];
let reporter: ((e: (typeof buffer)[0]) => void) | null = null;

export function trackRelationalFeedEvent(
  name: RelationalFeedObservabilityEvent,
  metadata: Record<string, string | number | boolean> = {},
): void {
  const row = { name, metadata, at: new Date().toISOString() };
  buffer.push(row);
  reporter?.(row);
}

export function configureRelationalFeedObservabilityReporter(fn: typeof reporter): void {
  reporter = fn;
}

export function drainRelationalFeedObservabilityEvents() {
  return [...buffer];
}

export function resetRelationalFeedObservabilityForTests(): void {
  buffer.length = 0;
  reporter = null;
}
