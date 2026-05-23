import { describe, expect, it } from "vitest";

import {
  buildCommercialRelationshipGraphSliceCostHeaderValue,
  buildCommercialRelationshipGraphSliceDiagnostics,
} from "@venext/shared-contracts";

describe("Instruction 19.1 — commercial relationship graph slice meta", () => {
  it("slice cost header matches cache hit / degraded semantics", () => {
    expect(buildCommercialRelationshipGraphSliceCostHeaderValue(false, false)).toBe("FULL_BUNDLE_VIEW");
    expect(buildCommercialRelationshipGraphSliceCostHeaderValue(true, false)).toBe("CACHE_REUSED_BUNDLE_VIEW");
    expect(buildCommercialRelationshipGraphSliceCostHeaderValue(true, true)).toBe("DEGRADED_BUNDLE_VIEW");
    expect(buildCommercialRelationshipGraphSliceCostHeaderValue(false, true)).toBe("DEGRADED_BUNDLE_VIEW");
  });

  it("slice diagnostics forbid independent compute", () => {
    const d = buildCommercialRelationshipGraphSliceDiagnostics(true, false);
    expect(d.independentCompute).toBe(false);
    expect(d.recommendedClientMode).toBe("BUNDLE_FIRST_ONLY");
    expect(d.parallelSliceWarning.toLowerCase()).toContain("bundle");
  });
});
