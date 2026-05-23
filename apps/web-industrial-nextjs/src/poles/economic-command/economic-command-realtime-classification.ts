import type { OperationalSignalItem } from "../types";

/** Instruction 18.5A — classify economic-command stream rows for industrial UX honesty. */
export type EconomicCommandRealtimeClass = "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";

export const ECONOMIC_COMMAND_REALTIME_CLASS_LABELS: Record<EconomicCommandRealtimeClass, string> = {
  DOMAIN_LIVE: "Signal domaine réel",
  DEMO_MIRROR: "Miroir démonstration",
  SYNTHETIC_TICK: "Signal synthétique de démonstration",
};

export function classifyEconomicCommandStreamItem(it: OperationalSignalItem): EconomicCommandRealtimeClass | null {
  if (it.economicCommandRealtimeClass) return it.economicCommandRealtimeClass;
  if (it.pole !== "ECONOMIC_COMMAND") return null;
  const env = it.economicCommandEnvelope ?? "";
  if (env.startsWith("live.economic_command.")) return "DOMAIN_LIVE";
  if (env.startsWith("demo.economic_command.")) return "DEMO_MIRROR";
  return "SYNTHETIC_TICK";
}
