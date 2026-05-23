import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildEconomicScenariosSliceDiagnostics } from "@venext/shared-contracts";

import { EconomicScenariosController } from "./economic-scenarios.controller";

vi.mock("../../platform-authz/venext-auth-context", () => ({
  devAuthBypassEnabled: () => true,
}));

function minimalBundle(overview: object, scenarios: object[]) {
  const org = "31111111-1111-1111-1111-111111111101";
  return {
    version: "1" as const,
    generatedAt: "2026-01-01T00:00:00.000Z",
    organizationId: org,
    policy: "ACTIVE" as const,
    headline: "x",
    disclaimer: "d",
    overview,
    scenarios,
    comparisons: [] as unknown[],
  };
}

describe("EconomicScenariosController", () => {
  const org = "31111111-1111-1111-1111-111111111101";
  let getBundleWithCacheMeta: ReturnType<typeof vi.fn>;
  let prisma: { economicScenario: { findMany: ReturnType<typeof vi.fn> } };
  let controller: EconomicScenariosController;

  beforeEach(() => {
    getBundleWithCacheMeta = vi.fn();
    prisma = {
      economicScenario: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "persisted-1",
            scenarioCode: "c1",
            scenarioType: "supply_disruption",
            triggerType: "t",
            severity: "HIGH",
            projectedRisk: 0.5,
            stabilizationProbability: 0.4,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            _count: { trajectories: 2, impacts: 3 },
          },
        ]),
      },
    };
    const flags = {
      isEnabled: vi.fn().mockImplementation(async (key: string) => {
        if (key === "economic_scenarios_enabled") return true;
        if (key === "scenario_risk_enabled") return true;
        if (key === "scenario_stabilization_enabled") return true;
        if (key === "scenario_memory_enabled") return true;
        return true;
      }),
    };
    controller = new EconomicScenariosController(prisma as never, flags as never, { getBundleWithCacheMeta } as never);
  });

  it("overview slice includes compose cache diagnostics", async () => {
    const overview = {
      version: "1" as const,
      generatedAt: "2026-01-01T00:00:00.000Z",
      organizationId: org,
      policy: "ACTIVE" as const,
      headline: "h",
      scenarioCount: 0,
      maxProjectedRisk: 0,
      meanStabilizationProbability: 0,
      dominantScenarioTypes: [] as string[],
    };
    getBundleWithCacheMeta.mockResolvedValue({
      bundle: minimalBundle(overview, []),
      composeCacheHit: false,
    });
    const res = await controller.overview(org);
    expect(res.sliceDiagnostics).toEqual(buildEconomicScenariosSliceDiagnostics(false));
    expect(res.data).toEqual(overview);
  });

  it("risk slice reuses compose cache meta from single getBundleWithCacheMeta call", async () => {
    getBundleWithCacheMeta.mockResolvedValue({
      bundle: minimalBundle(
        {
          version: "1",
          generatedAt: "2026-01-01T00:00:00.000Z",
          organizationId: org,
          policy: "ACTIVE",
          headline: "h",
          scenarioCount: 1,
          maxProjectedRisk: 0.5,
          meanStabilizationProbability: 0.5,
          dominantScenarioTypes: ["x"],
        },
        [
          {
            scenarioCode: "c",
            scenarioType: "supply_disruption",
            triggerType: "t",
            severity: "HIGH",
            sourcePole: "p",
            confidence: 0.5,
            affectedPoles: [],
            affectedTerritories: [],
            projectedRisk: 0.5,
            stabilizationProbability: 0.5,
            estimatedPropagationDepth: 1,
            trajectory: {
              provenance: ["u"],
              steps: [
                {
                  label: "T0",
                  systemicRisk: 0.1,
                  unstableTerritories: [],
                  impactedPoles: [],
                  stabilizationTrend: "FLAT",
                  volatilityShift: "FLAT",
                  propagationAcceleration: 0.1,
                },
                {
                  label: "T1",
                  systemicRisk: 0.2,
                  unstableTerritories: [],
                  impactedPoles: [],
                  stabilizationTrend: "FLAT",
                  volatilityShift: "FLAT",
                  propagationAcceleration: 0.2,
                },
                {
                  label: "T2",
                  systemicRisk: 0.3,
                  unstableTerritories: [],
                  impactedPoles: [],
                  stabilizationTrend: "FLAT",
                  volatilityShift: "FLAT",
                  propagationAcceleration: 0.3,
                },
                {
                  label: "T3",
                  systemicRisk: 0.4,
                  unstableTerritories: [],
                  impactedPoles: [],
                  stabilizationTrend: "FLAT",
                  volatilityShift: "FLAT",
                  propagationAcceleration: 0.4,
                },
              ],
            },
            impacts: [],
            risk: null,
          },
        ],
      ),
      composeCacheHit: true,
    });
    const res = await controller.risk(org);
    expect(res.sliceDiagnostics).toEqual(buildEconomicScenariosSliceDiagnostics(true));
    expect((res.data as { organizationId: string }).organizationId).toBe(org);
    expect(getBundleWithCacheMeta).toHaveBeenCalledTimes(1);
  });

  it("persisted does not call compose and returns audit sourceMode", async () => {
    const res = await controller.persisted(org, undefined, undefined, undefined, undefined);
    expect(res.sourceMode).toBe("PERSISTED_SCENARIO_AUDIT");
    expect(res.rows.length).toBe(1);
    expect(res.page.limit).toBe(25);
    expect(getBundleWithCacheMeta).not.toHaveBeenCalled();
  });

  it("persisted paginates with nextCursor when more than limit", async () => {
    const rows = Array.from({ length: 26 }, (_, i) => ({
      id: `id-${i}`,
      scenarioCode: `c${i}`,
      scenarioType: "supply_disruption",
      triggerType: "t",
      severity: "HIGH",
      projectedRisk: 0.5,
      stabilizationProbability: 0.5,
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)),
      _count: { trajectories: 1, impacts: 1 },
    }));
    prisma.economicScenario.findMany.mockResolvedValueOnce(rows);
    const res = await controller.persisted(org, "25", undefined, undefined, undefined);
    expect(res.page.hasMore).toBe(true);
    expect(res.rows.length).toBe(25);
    expect(res.page.nextCursor).toBeTruthy();
  });

  it("persisted clamps limit to max 100", async () => {
    prisma.economicScenario.findMany.mockResolvedValueOnce([]);
    const clamped = await controller.persisted(org, "500", undefined, undefined, undefined);
    expect(clamped.page.limit).toBe(100);
  });

  it("persisted passes scenarioType filter to prisma", async () => {
    prisma.economicScenario.findMany.mockResolvedValueOnce([]);
    await controller.persisted(org, "10", undefined, "payment_collapse", undefined);
    const arg = prisma.economicScenario.findMany.mock.calls[0]![0] as { where: { scenarioType?: string } };
    expect(arg.where.scenarioType).toBe("payment_collapse");
  });
});
