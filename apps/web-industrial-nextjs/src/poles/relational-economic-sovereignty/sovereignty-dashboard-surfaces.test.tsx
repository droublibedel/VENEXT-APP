import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AutonomyDistributionSurface,
  CaptivityDistributionSurface,
  DependencyConcentrationSurface,
  SovereigntyDashboardSurface,
  SovereigntyScoreLabels,
  SystemicExposureSurface,
} from "./sovereignty-surfaces";

describe("Instruction 20.28 — sovereignty dashboard surfaces", () => {
  it("renders dashboard and confidence labels", () => {
    render(
      <>
        <SovereigntyDashboardSurface
          corridorCount={3}
          aggregateSovereignty={62}
          aggregateAutonomy={58}
          calibrationProfile="BALANCED"
        />
        <SovereigntyScoreLabels
          rawScore={60}
          calibratedScore={62}
          fallbackUsed
          confidenceLevel="MEDIUM"
        />
        <CaptivityDistributionSurface captiveCount={2} />
        <AutonomyDistributionSurface sampleSize={5} fallbackCorridors={1} confidenceLabel="MEDIUM" />
        <DependencyConcentrationSurface meanConcentration={44} meanExternal={38} />
        <SystemicExposureSurface territoryKeys={2} sectorKeys={1} />
      </>,
    );
    expect(screen.getByTestId("sovereignty-dashboard-surface")).toBeTruthy();
    expect(screen.getByTestId("sovereignty-score-labels").textContent).toContain("fallback");
    expect(screen.getByTestId("captivity-distribution-surface")).toBeTruthy();
    expect(screen.getByTestId("autonomy-distribution-surface")).toBeTruthy();
    expect(screen.getByTestId("dependency-concentration-surface")).toBeTruthy();
    expect(screen.getByTestId("systemic-exposure-surface")).toBeTruthy();
  });
});
