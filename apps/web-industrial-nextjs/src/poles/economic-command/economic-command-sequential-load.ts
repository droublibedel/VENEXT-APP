import {
  EconomicCommandArbitrationsSliceSchema,
  EconomicCommandDecisionRisksSliceSchema,
  EconomicCommandNarrativeSchema,
  EconomicCommandOverviewSchema,
  EconomicCommandPressureZonesSliceSchema,
  EconomicCommandSilentTensionsSliceSchema,
  EconomicSystemStressSchema,
} from "@venext/shared-contracts";

import { fetchEconomicCommandJson } from "./economic-command-api";
import type { EconomicCommandSliceBag } from "./economic-command-fallback-build";

function parseSlice<T>(schema: { safeParse: (input: unknown) => { success: boolean; data?: T } }, raw: unknown): T | null {
  const r = schema.safeParse(raw);
  return r.success ? (r.data as T) : null;
}

/**
 * Loads all economic-command HTTP slices in parallel (Instruction 18.5A).
 * Each slice still triggers a full server compose unless the command cache hits — same cost profile as the bundle.
 */
export async function loadEconomicCommandSlicesAll(organizationId: string): Promise<EconomicCommandSliceBag> {
  const [
    overviewRaw,
    pressureRaw,
    risksRaw,
    arbRaw,
    tensionsRaw,
    narrativeRaw,
    stressRaw,
  ] = await Promise.all([
    fetchEconomicCommandJson<unknown>("/overview", organizationId),
    fetchEconomicCommandJson<unknown>("/pressure-zones", organizationId),
    fetchEconomicCommandJson<unknown>("/risks", organizationId),
    fetchEconomicCommandJson<unknown>("/arbitrations", organizationId),
    fetchEconomicCommandJson<unknown>("/tensions", organizationId),
    fetchEconomicCommandJson<unknown>("/narrative", organizationId),
    fetchEconomicCommandJson<unknown>("/stress", organizationId),
  ]);

  return {
    overview: parseSlice(EconomicCommandOverviewSchema, overviewRaw),
    pressureZones: parseSlice(EconomicCommandPressureZonesSliceSchema, pressureRaw),
    decisionRisks: parseSlice(EconomicCommandDecisionRisksSliceSchema, risksRaw),
    arbitrations: parseSlice(EconomicCommandArbitrationsSliceSchema, arbRaw),
    silentTensions: parseSlice(EconomicCommandSilentTensionsSliceSchema, tensionsRaw),
    narrative: parseSlice(EconomicCommandNarrativeSchema, narrativeRaw),
    systemStress: parseSlice(EconomicSystemStressSchema, stressRaw),
  };
}

/** @deprecated Prefer {@link loadEconomicCommandSlicesAll} — name kept for tests / imports. */
export async function loadEconomicCommandSlicesSequential(organizationId: string): Promise<EconomicCommandSliceBag> {
  return loadEconomicCommandSlicesAll(organizationId);
}
