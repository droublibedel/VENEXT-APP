import { describe, expect, it } from "vitest";

import {
  buildEconomicScenariosUpstreamHeadersFromInput,
  isEconomicScenariosDemoMode,
} from "./economic-scenarios-bff";

describe("economic-scenarios BFF headers", () => {
  it("demo mode attaches demo actor marker from server-side builder (not browser trust)", () => {
    const h = buildEconomicScenariosUpstreamHeadersFromInput(
      {
        searchParams: new URLSearchParams({ organizationId: "31111111-1111-1111-1111-111111111101" }),
        getHeader: () => null,
      },
      { NEXT_PUBLIC_DEMO_MODE: "true" },
    );
    expect(h).toBeInstanceOf(Headers);
    const headers = h as Headers;
    expect(headers.get("x-venext-demo-actor")).toBe("true");
    expect(headers.get("x-venext-user-id")).toBe("browser_demo_unauthenticated");
    expect(headers.get("x-venext-acting-organization-id")).toBe("31111111-1111-1111-1111-111111111101");
  });

  it("production without actor returns 403 envelope", () => {
    const r = buildEconomicScenariosUpstreamHeadersFromInput(
      {
        searchParams: new URLSearchParams({ organizationId: "31111111-1111-1111-1111-111111111101" }),
        getHeader: () => null,
      },
      {},
    );
    expect(r).toMatchObject({ status: 403 });
    expect((r as { body: { code: string } }).body.code).toBe("economic_scenarios_bff_actor_required");
  });

  it("production forwards Authorization without fabricating user id", () => {
    const h = buildEconomicScenariosUpstreamHeadersFromInput(
      {
        searchParams: new URLSearchParams({ organizationId: "31111111-1111-1111-1111-111111111101" }),
        getHeader: (n) => (n === "authorization" ? "Bearer unit-test-token" : null),
      },
      {},
    );
    expect(h).toBeInstanceOf(Headers);
    expect((h as Headers).get("authorization")).toBe("Bearer unit-test-token");
    expect((h as Headers).get("x-venext-user-id")).toBeNull();
  });

  it("isEconomicScenariosDemoMode reads env flags", () => {
    expect(isEconomicScenariosDemoMode({ VENEXT_DEMO_MODE: "1" })).toBe(true);
    expect(isEconomicScenariosDemoMode({})).toBe(false);
  });
});
