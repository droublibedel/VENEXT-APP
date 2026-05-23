import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CommercialCorridorProfileDto } from "@venext/shared-contracts";

import { CorridorOverviewSurface } from "./CorridorOverviewSurface";

function baseProfile(overrides: Partial<CommercialCorridorProfileDto>): CommercialCorridorProfileDto {
  return {
    relationshipId: "00000000-0000-4000-8000-000000000001",
    corridorState: "ACTIVE",
    corridorHealthNumeric: null,
    corridorHealthBand: "MEDIUM",
    corridorRiskLevel: "MEDIUM",
    corridorVisibilityLevel: "PARTNER_ONLY",
    corridorEconomicImportance: 0.5,
    corridorActivatedAt: "2026-01-01T00:00:00.000Z",
    corridorLastActivityAt: "2026-01-01T00:00:00.000Z",
    relationshipStatus: "ACCEPTED",
    relationshipSource: "SPONSORED_DISCOVERY",
    signals: [],
    diagnostics: {
      heuristicOnly: true,
      privateEconomicCorridor: true,
      publicRankingDisabled: true,
      marketplaceExposureDisabled: true,
      governanceValidated: true,
      transitionAllowed: true,
      governanceReason: "ok",
      governanceDecisionSource: "HEURISTIC_ENGINE",
      humanModerationRequired: false,
      sponsoredOrigin: true,
      sponsoredConversionSuccess: null,
      sponsoredCommercialConsistency: null,
      corridorRiskLevel: "MEDIUM",
      relationshipIntelligenceScope: "RELATIONSHIP_PARTNER_LIMITED",
      emittedSignalTypes: [],
      unavailableSignalTypes: [],
      signalReadiness: {},
    },
    ...overrides,
  };
}

describe("CorridorOverviewSurface — Instruction 20.4B numeric redaction", () => {
  it("does not render 0–100 numeric for partner scope even if numeric leaks in DTO", () => {
    const template = baseProfile({});
    const data = baseProfile({
      corridorHealthNumeric: 87,
      diagnostics: {
        ...template.diagnostics,
        relationshipIntelligenceScope: "RELATIONSHIP_PARTNER_LIMITED",
      },
    });
    const { container } = render(<CorridorOverviewSurface data={data} />);
    expect(container.textContent).not.toMatch(/\b87\b/);
  });

  it("shows internal numeric only for backoffice full scope", () => {
    const template = baseProfile({});
    const data = baseProfile({
      corridorHealthNumeric: 72,
      diagnostics: {
        ...template.diagnostics,
        relationshipIntelligenceScope: "RELATIONSHIP_BACKOFFICE_FULL",
      },
    });
    render(<CorridorOverviewSurface data={data} />);
    expect(screen.getByText(/72/)).toBeTruthy();
    expect(screen.getByText(/Indice interne non public/)).toBeTruthy();
  });
});
