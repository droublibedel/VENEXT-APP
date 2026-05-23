import type { OperationalSignalItem } from "../types";

export const RELATIONAL_CATALOG_REALTIME_CLASS_LABELS: Record<
  NonNullable<OperationalSignalItem["relationalCatalogRealtimeClass"]>,
  string
> = {
  DOMAIN_LIVE: "Événement domaine catalogue relationnel (core)",
  DEMO_MIRROR: "Miroir démo — non confondre avec inventaire réel",
  SYNTHETIC_TICK: "Tick synthétique gateway — jamais inventaire live",
};

export function classifyRelationalCatalogStreamItem(
  ev: OperationalSignalItem,
): OperationalSignalItem["relationalCatalogRealtimeClass"] | null {
  if (ev.pole !== "RELATIONAL_CATALOG" && !ev.relationalCatalogEnvelope) return null;
  return ev.relationalCatalogRealtimeClass ?? null;
}
