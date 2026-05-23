/** Instruction 16 — demo/live finance collections WS envelope labels (api-gateway + client). */
export const FINANCE_COLLECTIONS_REALTIME_EVENT_TYPES = [
  "demo.finance_collections.payment.instability",
  "live.finance_collections.payment.instability",
  "demo.finance_collections.overdue.escalation",
  "live.finance_collections.overdue.escalation",
  "demo.finance_collections.liquidity.degraded",
  "live.finance_collections.liquidity.degraded",
  "demo.finance_collections.settlement.anomaly",
  "live.finance_collections.settlement.anomaly",
  "demo.finance_collections.collection.acceleration",
  "live.finance_collections.collection.acceleration",
  "demo.finance_collections.credit.warning",
  "live.finance_collections.credit.warning",
] as const;
