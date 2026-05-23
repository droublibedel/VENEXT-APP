/**
 * Instruction 20.44 — single boundary for all level-5 analytical relational layers.
 * Spread into DTOs / realtime payloads; do not duplicate literals in each module.
 */

export const RELATIONAL_STRATEGIC_READONLY_BOUNDARY = {
  paymentExecutionDisabled: true as const,
  publicTrackingDisabled: true as const,
  noAutopilot: true as const,
  noBusinessMutation: true as const,
  noWallet: true as const,
  noGps: true as const,
  noSocialGraph: true as const,
  noPublicTracking: true as const,
  noScraping: true as const,
  noMarketingAnalytics: true as const,
  appendOnlyEvents: true as const,
  analyticalReadOnly: true as const,
} as const;

export type RelationalStrategicReadonlyBoundary = typeof RELATIONAL_STRATEGIC_READONLY_BOUNDARY;

/** Wire flags for shared-contracts Zod DTO spreads. */
export const relationalStrategicReadonlyWireFlags = {
  paymentExecutionDisabled: RELATIONAL_STRATEGIC_READONLY_BOUNDARY.paymentExecutionDisabled,
  publicTrackingDisabled: RELATIONAL_STRATEGIC_READONLY_BOUNDARY.publicTrackingDisabled,
} as const;

export const RELATIONAL_STRATEGIC_FORBIDDEN_CAPABILITIES = [
  "autopilot",
  "payment_execution",
  "wallet",
  "gps",
  "social_graph",
  "public_tracking",
  "scraping",
  "marketing_analytics",
  "supply_order_payment_mutation",
] as const;

export function assertRelationalStrategicReadonlyPayload(
  payload: Record<string, unknown>,
): { ok: true } | { ok: false; reason: string } {
  for (const key of RELATIONAL_STRATEGIC_FORBIDDEN_CAPABILITIES) {
    if (key in payload && payload[key] !== undefined) {
      return { ok: false, reason: `forbidden_field:${key}` };
    }
  }
  if (payload.paymentExecutionDisabled === false) {
    return { ok: false, reason: "paymentExecutionDisabled_must_be_true" };
  }
  if (payload.publicTrackingDisabled === false) {
    return { ok: false, reason: "publicTrackingDisabled_must_be_true" };
  }
  return { ok: true };
}
