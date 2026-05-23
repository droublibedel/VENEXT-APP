import type { OperationalSignalItem } from "../types";

export const RELATIONAL_ORDERS_REALTIME_CLASS_LABELS: Record<
  NonNullable<OperationalSignalItem["relationalOrdersRealtimeClass"]>,
  string
> = {
  DOMAIN_LIVE: "Signal domaine commandes relationnelles (core)",
  DEMO_MIRROR: "Miroir démo — non confondre avec exécution corridor réelle",
  SYNTHETIC_TICK: "Tick synthétique gateway — pas logistique temps réel",
};

export function classifyRelationalOrdersStreamItem(
  ev: OperationalSignalItem,
): OperationalSignalItem["relationalOrdersRealtimeClass"] | null {
  if (ev.pole !== "RELATIONAL_ORDERS" && !ev.relationalOrdersEnvelope) return null;
  return ev.relationalOrdersRealtimeClass ?? null;
}
