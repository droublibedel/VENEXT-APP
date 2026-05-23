export type IndustrialEvidenceBundleViewSemantic =
  | "FULL_BUNDLE_VIEW"
  | "CACHE_REUSED_BUNDLE_VIEW"
  | "DEGRADED_BUNDLE_VIEW";

/** HTTP header — semantic view cost, not “full compose” on every cache hit. */
export function buildIndustrialEvidenceSliceCostHeaderValue(
  composeCacheHit: boolean,
  degraded: boolean,
): IndustrialEvidenceBundleViewSemantic {
  if (degraded) return "DEGRADED_BUNDLE_VIEW";
  if (composeCacheHit) return "CACHE_REUSED_BUNDLE_VIEW";
  return "FULL_BUNDLE_VIEW";
}

export const INDUSTRIAL_EVIDENCE_SLICE_COST_HEADER_NAME = "x-venext-slice-cost" as const;

export function buildIndustrialEvidenceSliceDiagnostics(
  composeCacheHit: boolean,
  degraded: boolean,
): {
  sliceSource: "FULL_BUNDLE_SLICE";
  serverCost: IndustrialEvidenceBundleViewSemantic;
  independentCompute: false;
  recommendedClientMode: "BUNDLE_FIRST_ONLY";
  parallelSliceWarning: string;
  composeCacheHit: boolean;
  degradedBundleView: boolean;
} {
  const serverCost = buildIndustrialEvidenceSliceCostHeaderValue(composeCacheHit, degraded);
  return {
    sliceSource: "FULL_BUNDLE_SLICE" as const,
    serverCost,
    independentCompute: false as const,
    recommendedClientMode: "BUNDLE_FIRST_ONLY" as const,
    parallelSliceWarning:
      "Industrial evidence: use GET /bundle only — slice routes are bundle projections; no independent compute." as const,
    composeCacheHit,
    degradedBundleView: degraded,
  };
}

export type IndustrialEvidenceSliceDiagnostics = ReturnType<typeof buildIndustrialEvidenceSliceDiagnostics>;
