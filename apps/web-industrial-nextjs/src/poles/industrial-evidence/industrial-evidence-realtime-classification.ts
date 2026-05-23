import type { OperationalSignalItem } from "../types";

export const INDUSTRIAL_EVIDENCE_REALTIME_CLASS_LABELS: Record<
  NonNullable<OperationalSignalItem["industrialEvidenceRealtimeClass"]>,
  string
> = {
  DOMAIN_LIVE: "Flux domaine (core) — registre rafraîchi",
  DEMO_MIRROR: "Miroir démo — non domaine",
  SYNTHETIC_TICK: "Tick synthétique gateway — non données terrain",
};

export function classifyIndustrialEvidenceStreamItem(
  ev: OperationalSignalItem,
): OperationalSignalItem["industrialEvidenceRealtimeClass"] | null {
  if (ev.pole !== "INDUSTRIAL_EVIDENCE" && !ev.industrialEvidenceEnvelope) return null;
  return ev.industrialEvidenceRealtimeClass ?? null;
}
