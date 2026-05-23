export type CommercialRelationshipGraphBundleViewSemantic =
  | "FULL_BUNDLE_VIEW"
  | "CACHE_REUSED_BUNDLE_VIEW"
  | "DEGRADED_BUNDLE_VIEW";

export function buildCommercialRelationshipGraphSliceCostHeaderValue(
  composeCacheHit: boolean,
  degraded: boolean,
): CommercialRelationshipGraphBundleViewSemantic {
  if (degraded) return "DEGRADED_BUNDLE_VIEW";
  if (composeCacheHit) return "CACHE_REUSED_BUNDLE_VIEW";
  return "FULL_BUNDLE_VIEW";
}

export const COMMERCIAL_RELATIONSHIP_GRAPH_SLICE_COST_HEADER_NAME = "x-venext-slice-cost" as const;

export function buildCommercialRelationshipGraphSliceDiagnostics(
  composeCacheHit: boolean,
  degraded: boolean,
): {
  sliceSource: "FULL_BUNDLE_SLICE";
  serverCost: CommercialRelationshipGraphBundleViewSemantic;
  independentCompute: false;
  recommendedClientMode: "BUNDLE_FIRST_ONLY";
  parallelSliceWarning: string;
  composeCacheHit: boolean;
  degradedBundleView: boolean;
} {
  const serverCost = buildCommercialRelationshipGraphSliceCostHeaderValue(composeCacheHit, degraded);
  return {
    sliceSource: "FULL_BUNDLE_SLICE" as const,
    serverCost,
    independentCompute: false as const,
    recommendedClientMode: "BUNDLE_FIRST_ONLY" as const,
    parallelSliceWarning:
      "Commercial relationship graph: slice routes are projections of the same bundle materialization — no independent graph engine compute." as const,
    composeCacheHit,
    degradedBundleView: degraded,
  };
}
