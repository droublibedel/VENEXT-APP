import { ForbiddenException } from "@nestjs/common";
import { OrganizationActorType, OrganizationCategory } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { DomainRealtimeFanoutClient } from "./domain-realtime/domain-realtime-fanout.client";
import {
  rankInterventionBySignalScore,
  urgencyScoreFromLevels,
} from "./intervention-ranking/intervention-signal-ranking.util";
import { StrategicIntelligenceController } from "./strategic-intelligence/strategic-intelligence.controller";
import { territoryNormalizedCodeFromOrg } from "./supply-logistics-intelligence/territory-code-normalizer";

describe("Instruction 16A — strategic producer scope", () => {
  it("refuses non-producer organization when DEV_AUTH_BYPASS is off", async () => {
    const prev = process.env.DEV_AUTH_BYPASS;
    delete process.env.DEV_AUTH_BYPASS;
    try {
      const prisma = {
        organization: {
          findUnique: vi.fn().mockResolvedValue({
            category: OrganizationCategory.WHOLESALER_A,
            actorType: OrganizationActorType.WHOLESALER,
          }),
        },
      };
      const flags = { isEnabled: vi.fn().mockResolvedValue(true) };
      const stub = {} as never;
      const controller = new StrategicIntelligenceController(
        prisma as never,
        flags as never,
        stub,
        stub,
        stub,
        stub,
        stub,
        stub,
        stub,
        stub,
        stub,
      );
      const err = await controller.bundle("31111111-1111-1111-1111-111111111199").catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ForbiddenException);
      expect((err as ForbiddenException).getResponse()).toEqual({ code: "strategic_intelligence_producer_scope_required" });
    } finally {
      if (prev === undefined) delete process.env.DEV_AUTH_BYPASS;
      else process.env.DEV_AUTH_BYPASS = prev;
    }
  });
});

describe("Instruction 16A — DomainRealtimeFanoutClient", () => {
  it("no-ops when gateway env is absent", async () => {
    delete process.env.VENEXT_API_GATEWAY_INTERNAL_URL;
    delete process.env.VENEXT_INTERNAL_REALTIME_KEY;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    const client = new DomainRealtimeFanoutClient();
    expect(client.isConfigured()).toBe(false);
    await client.postDomainSignal("/internal/v1/realtime/order-adv/domain-signal", { organizationId: "x" });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("POSTs JSON with internal key when configured", async () => {
    process.env.VENEXT_API_GATEWAY_INTERNAL_URL = "http://gateway.internal";
    process.env.VENEXT_INTERNAL_REALTIME_KEY = "secret-test-key";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
    const client = new DomainRealtimeFanoutClient();
    expect(client.isConfigured()).toBe(true);
    const body = { organizationId: "o1", eventType: "live.test", source: "DOMAIN_ANALYSIS", body: { n: 1 } };
    await client.postDomainSignal("/internal/v1/realtime/supply-logistics/domain-signal", body);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0]! as [string, RequestInit];
    expect(url).toBe("http://gateway.internal/internal/v1/realtime/supply-logistics/domain-signal");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["x-venext-internal-key"]).toBe("secret-test-key");
    expect(init.body).toBe(JSON.stringify(body));
    fetchSpy.mockRestore();
    delete process.env.VENEXT_API_GATEWAY_INTERNAL_URL;
    delete process.env.VENEXT_INTERNAL_REALTIME_KEY;
  });
});

describe("Instruction 16A — territory normalizer shared with finance geo", () => {
  it("normalizes Dakar + SN consistently for correlation codes", () => {
    const code = territoryNormalizedCodeFromOrg("Dakar", "SN");
    expect(code).toMatch(/DAKAR/);
    expect(code).toMatch(/SN/);
  });
});

describe("Instruction 16A — intervention signal ranking", () => {
  it("sorts descending by finalScore when urgency differs", () => {
    const low = rankInterventionBySignalScore({
      urgencyScore: urgencyScoreFromLevels("low"),
      impactScore: 0.9,
      confidenceScore: 0.9,
      signalStrengthScore: 0.9,
      territoryFactor: 0.9,
    });
    const high = rankInterventionBySignalScore({
      urgencyScore: urgencyScoreFromLevels("critical"),
      impactScore: 0.1,
      confidenceScore: 0.1,
      signalStrengthScore: 0.1,
      territoryFactor: 0.1,
    });
    const sorted = [low, high].sort((a, b) => b.finalScore - a.finalScore);
    expect(sorted[0]!.finalScore).toBe(high.finalScore);
  });
});
