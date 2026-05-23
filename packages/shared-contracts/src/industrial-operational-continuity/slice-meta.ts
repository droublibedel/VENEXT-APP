/** Instruction 18.7A — slice routes mirror full continuity compose (upstream situation room + economic command pipeline). */
export function buildIndustrialOperationalContinuitySliceDiagnostics(composeCacheHit: boolean) {
  return {
    sliceSource: "FULL_BUNDLE_SLICE" as const,
    serverCost: "FULL_COMPOSE" as const,
    independentCompute: false as const,
    recommendedClientMode: "BUNDLE_FIRST_ONLY" as const,
    parallelSliceWarning:
      "Do not call multiple slices in parallel; use bundle first." as const,
    composeCacheHit,
  };
}

/** HTTP response header for slice routes — same name/value enforced in core-domain controller. */
export const INDUSTRIAL_OPERATIONAL_CONTINUITY_SLICE_COST_HEADER = {
  name: "x-venext-slice-cost" as const,
  value: "FULL_COMPOSE" as const,
};

export type IndustrialOperationalContinuitySliceDiagnostics = ReturnType<
  typeof buildIndustrialOperationalContinuitySliceDiagnostics
>;
