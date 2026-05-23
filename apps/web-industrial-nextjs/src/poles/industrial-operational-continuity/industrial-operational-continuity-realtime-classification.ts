import type { OperationalSignalItem } from "../types";

export const INDUSTRIAL_OPERATIONAL_CONTINUITY_REALTIME_CLASS_LABELS: Record<
  NonNullable<OperationalSignalItem["industrialOperationalContinuityRealtimeClass"]>,
  string
> = {
  DOMAIN_LIVE: "Signal domaine (core → gateway)",
  DEMO_MIRROR: "Miroir démo (enveloppe déterministe)",
  SYNTHETIC_TICK: "Tick synthétique (batch démo)",
};

export function classifyIndustrialOperationalContinuityStreamItem(
  it: OperationalSignalItem,
): OperationalSignalItem["industrialOperationalContinuityRealtimeClass"] | null {
  if (it.industrialOperationalContinuityRealtimeClass) return it.industrialOperationalContinuityRealtimeClass;
  const env = it.industrialOperationalContinuityEnvelope ?? "";
  if (env.includes(".synthetic_tick.")) return "SYNTHETIC_TICK";
  if (env.startsWith("live.")) return "DOMAIN_LIVE";
  if (env.startsWith("demo.")) return "DEMO_MIRROR";
  return null;
}
