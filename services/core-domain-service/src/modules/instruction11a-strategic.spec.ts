import { describe, expect, it, vi } from "vitest";
import { EconomicSignalSource, EconomicSignalType } from "@prisma/client";
import { BackofficeAiGatewayService } from "./backoffice/backoffice-ai-gateway.service";
import { StrategicSignalsRadarService } from "./strategic-intelligence/strategic-signals-radar.service";

describe("Instruction 11A — MockAI gateway executive briefing contract", () => {
  it("returns structured ExecutiveBriefingResponse from gateway", () => {
    const audit = { append: async () => ({}) };
    const gw = new BackofficeAiGatewayService(audit as never);
    const out = gw.generateExecutiveStrategicBriefing({
      pressureBand: "HIGH",
      pressureHeadline: "Test headline",
      impactedRegions: ["SN/Dakar"],
      impactedCategories: ["Beverage"],
      anomalyThesis: "Corr thesis",
      acceptedRelationshipCount: 5,
      signalDensity7d: 14,
      dataSources: ["unit"],
    });
    expect(out.provider).toBe("MockAIProvider");
    expect(out.policy).toBe("ACTIVE");
    expect(out.title).toContain("HIGH");
    expect(out.executiveSummary).toBe("Test headline");
    expect(out.anomalies?.length).toBeGreaterThan(0);
    expect(out.opportunities?.length).toBeGreaterThan(0);
    expect(out.recommendedActions?.length).toBeGreaterThan(0);
    expect(typeof out.confidence).toBe("number");
    expect(out.dataSources?.some((d) => d.includes("mock_ai_gateway"))).toBe(true);
  });
});

describe("Instruction 11A — radar splits EXTERNAL_CONTEXT", () => {
  it("maps DB EXTERNAL_CONTEXT rows into external array", async () => {
    const internalRow = {
      id: "i1",
      signalType: EconomicSignalType.DEMAND_RISE,
      source: EconomicSignalSource.ORDER,
      intensityScore: 0.7,
      zoneCode: "Z1",
      metadata: {},
      createdAt: new Date(),
    };
    const externalRow = {
      id: "e1",
      signalType: EconomicSignalType.PRODUCT_VIEW,
      source: EconomicSignalSource.EXTERNAL_CONTEXT,
      intensityScore: 0.55,
      zoneCode: "SN-DKR",
      metadata: { kind: "WEATHER_STUB", label: "Humidity front" },
      createdAt: new Date(),
    };
    const prisma = {
      economicSignal: {
        findMany: vi.fn().mockImplementation(
          (args: { where?: { source?: EconomicSignalSource | { not: EconomicSignalSource } } }) => {
            const src = args.where?.source;
            if (src && typeof src === "object" && "not" in src && src.not === EconomicSignalSource.EXTERNAL_CONTEXT) {
              return Promise.resolve([internalRow]);
            }
            if (src === EconomicSignalSource.EXTERNAL_CONTEXT) {
              return Promise.resolve([externalRow]);
            }
            return Promise.resolve([]);
          },
        ),
      },
    };
    const radar = new StrategicSignalsRadarService(prisma as never);
    const out = await radar.radar("31111111-1111-1111-1111-111111111101");
    expect(out.internal.length).toBe(1);
    expect(out.external.some((x: { id?: string }) => x.id === "e1")).toBe(true);
  });
});
