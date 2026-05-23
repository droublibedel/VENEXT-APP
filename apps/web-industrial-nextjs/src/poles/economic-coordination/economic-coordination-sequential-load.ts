import { fetchEconomicCoordinationJson } from "./economic-coordination-api";

export type EconomicCoordinationSequentialSlices = {
  overview: unknown;
  posture: unknown;
  priorities: unknown;
  conflicts: unknown;
  orchestrations: unknown;
  escalation: unknown;
  memory: unknown;
};

export async function loadEconomicCoordinationSlicesSequential(organizationId: string): Promise<EconomicCoordinationSequentialSlices> {
  const overview = await fetchEconomicCoordinationJson<unknown>("/overview", organizationId);
  const posture = await fetchEconomicCoordinationJson<unknown>("/posture", organizationId);
  const priorities = await fetchEconomicCoordinationJson<unknown>("/priorities", organizationId);
  const conflicts = await fetchEconomicCoordinationJson<unknown>("/conflicts", organizationId).catch(() => null);
  const orchestrations = await fetchEconomicCoordinationJson<unknown>("/orchestrations", organizationId).catch(() => null);
  const escalation = await fetchEconomicCoordinationJson<unknown>("/escalation", organizationId).catch(() => null);
  const memory = await fetchEconomicCoordinationJson<unknown>("/memory", organizationId).catch(() => null);
  return { overview, posture, priorities, conflicts, orchestrations, escalation, memory };
}
