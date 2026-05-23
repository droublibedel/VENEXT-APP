/** Bounded contexts — foundation identifiers only */
export const VENEXT_BOUNDED_CONTEXTS = [
  "identity_authentication",
  "relationship_graph",
  "relational_catalog",
  "orders_negotiation",
  "messaging_context",
  "wallet_payments",
  "geo_intelligence",
  "industrial_intelligence",
  "sponsored_visibility",
  "ai_gateway",
  "offline_sync",
  "supply_monitoring",
  "notifications",
  "backoffice_governance",
] as const;

export type VenextBoundedContext = (typeof VENEXT_BOUNDED_CONTEXTS)[number];
