/** Instruction 18.3A/18.3B — slice routes mirror full compose; diagnostics expose cache reuse. */
export function buildEconomicScenariosSliceDiagnostics(composeCacheHit: boolean) {
  return {
    sliceSource: "FULL_BUNDLE_SLICE" as const,
    serverCost: "FULL_COMPOSE" as const,
    cacheStrategy: "SHORT_TTL_SCENARIO_CACHE" as const,
    composeCacheHit,
  };
}

/** @deprecated Prefer `buildEconomicScenariosSliceDiagnostics(false)` for accurate `composeCacheHit`. */
export const ECONOMIC_SCENARIOS_SLICE_DIAGNOSTICS = buildEconomicScenariosSliceDiagnostics(false);
