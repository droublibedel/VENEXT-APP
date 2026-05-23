import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { IndustrialEvidenceWorkspace } from "./IndustrialEvidenceWorkspace";
import { RegistryLegend } from "./RegistryLegend";

afterEach(() => cleanup());

describe("Industrial evidence registry UI (18.8A)", () => {
  it("RegistryLegend renders visible legend test id", () => {
    render(<RegistryLegend />);
    expect(screen.getByTestId("industrial-evidence-registry-legend")).toBeTruthy();
    expect(screen.getByText(/Légende registre/i)).toBeTruthy();
  });

  it("workspace shows legend, evidence scope, and overview records without JSON dump as primary surface", () => {
    render(
      <IndustrialEvidenceWorkspace
        bundle={{
          policy: "ACTIVE",
          disclaimer: "Consultative registry — not forensic proof.",
          snapshot: {
            headline: "Registre test",
            records: [
              {
                evidenceId: "iev-1",
                sourcePole: "ECONOMIC_COMMAND",
                evidenceType: "COMMAND_DERIVED",
                trustLevel: "STRONG_HEURISTIC",
                heuristicConfidence: true,
                demoOrSynthetic: false,
                confidenceHeuristic: "Heuristic confidence estimate",
                confidenceInputs: ["a", "b"],
                symbolicProjection: true,
              },
            ],
            trustMatrix: [
              {
                matrixId: "tm-1",
                scopeKey: "ECONOMIC_COMMAND",
                trustLevel: "STRONG_HEURISTIC",
                trustReason: "Heuristic digest",
                classificationPath: ["heuristic_classification"],
                derivedFromFlags: { heuristicPrimary: true },
              },
            ],
            traces: [],
            limitations: [],
            sourceMap: [
              {
                poleKey: "ECONOMIC_COMMAND",
                included: true,
                sourceFreshness: "FROM_BUNDLE_TIMESTAMP",
                sourceReliability: "UPSTREAM_ROW_OK",
                sourceCompleteness: "ROW_OK",
                sourceAvailability: "AVAILABLE",
              },
            ],
            diagnostics: { bundleViewSemantic: "FULL_BUNDLE_VIEW", composeCacheHit: false, projectionMode: "summary" },
            evidenceScope: {
              what_is_real: "Materialized upstream bundle rows only.",
              what_is_heuristic: "Ordinal estimates from structural inputs.",
              what_is_symbolic: "Presentation overlays.",
              what_is_demo: "Synthetic rows when flagged.",
              what_is_missing: "None in this fixture.",
            },
            interpretationBoundary: "Correlation and alignment only.",
            reliabilityBoundary: "Bounded advisory readout.",
          },
        }}
        loading={false}
        error={null}
        degradedBundleMode={false}
        fallbackSource={null}
        fallbackReason={null}
      />,
    );
    expect(screen.getByTestId("industrial-evidence-registry-legend")).toBeTruthy();
    expect(screen.getByText(/Evidence scope/i)).toBeTruthy();
    expect(screen.getByTestId("evidence-overview-records")).toBeTruthy();
    expect(screen.queryByText(/\{/)).toBeNull();
  });
});
