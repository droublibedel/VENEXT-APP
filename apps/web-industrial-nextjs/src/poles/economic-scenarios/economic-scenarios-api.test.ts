import { describe, expect, it, vi } from "vitest";

import { fetchEconomicScenariosBundleJson, fetchPersistedEconomicScenariosAudit } from "./economic-scenarios-api";

describe("economic-scenarios-api BFF paths", () => {
  it("bundle fetch targets local BFF route (no /api/core) and does not attach browser actor headers", async () => {
    const calls: RequestInit[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        calls.push(init ?? {});
        return {
          ok: true,
          status: 200,
          json: async () => ({
            version: "1",
            generatedAt: "2026-01-01T00:00:00.000Z",
            organizationId: "31111111-1111-1111-1111-111111111101",
            policy: "ACTIVE",
            headline: "h",
            disclaimer: "d",
            overview: {
              version: "1",
              generatedAt: "2026-01-01T00:00:00.000Z",
              organizationId: "31111111-1111-1111-1111-111111111101",
              policy: "ACTIVE",
              headline: "o",
              scenarioCount: 0,
              maxProjectedRisk: 0,
              meanStabilizationProbability: 0,
              dominantScenarioTypes: [],
            },
            scenarios: [],
            comparisons: [],
            sourceMode: "LIVE_COMPOSED_SCENARIO",
            liveComposeDiagnostics: {
              composeCacheHit: false,
              cacheStrategy: "SHORT_TTL_SCENARIO_CACHE",
              serverCost: "FULL_COMPOSE",
            },
          }),
        } as Response;
      }),
    );
    const org = "31111111-1111-1111-1111-111111111101";
    await fetchEconomicScenariosBundleJson(org);
    expect(String((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0])).toContain("/api/economic-scenarios/");
    expect(String((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0])).not.toContain("/api/core/");
    const headers = new Headers((calls[0] as RequestInit).headers ?? {});
    expect(headers.get("x-venext-user-id")).toBeNull();
    expect(headers.get("x-venext-demo-actor")).toBeNull();
    vi.unstubAllGlobals();
  });

  it("persisted audit fetch uses BFF persisted route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        void input;
        return {
        ok: true,
        status: 200,
        json: async () => ({
          sourceMode: "PERSISTED_SCENARIO_AUDIT",
          organizationId: "31111111-1111-1111-1111-111111111101",
          rows: [],
          page: { limit: 10, nextCursor: null, hasMore: false },
        }),
        } as Response;
      }),
    );
    await fetchPersistedEconomicScenariosAudit("31111111-1111-1111-1111-111111111101");
    expect(String((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0])).toContain("/economic-scenarios/persisted");
    vi.unstubAllGlobals();
  });
});
