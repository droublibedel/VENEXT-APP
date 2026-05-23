import type { OperationalSignalItem } from "../types";

export const COMMERCIAL_RELATIONSHIP_GRAPH_REALTIME_CLASS_LABELS: Record<
  NonNullable<OperationalSignalItem["commercialRelationshipGraphRealtimeClass"]>,
  string
> = {
  DOMAIN_LIVE: "Flux domaine (core) — graphe validé rafraîchi",
  DEMO_MIRROR: "Miroir démo — non domaine",
  SYNTHETIC_TICK: "Tick synthétique gateway — non données terrain",
};

export function classifyCommercialRelationshipGraphStreamItem(
  ev: OperationalSignalItem,
): OperationalSignalItem["commercialRelationshipGraphRealtimeClass"] | null {
  if (ev.pole !== "COMMERCIAL_RELATIONSHIP_GRAPH" && !ev.commercialRelationshipGraphEnvelope) return null;
  return ev.commercialRelationshipGraphRealtimeClass ?? null;
}
