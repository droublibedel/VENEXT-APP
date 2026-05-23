import { afterEach, describe, expect, it, vi } from "vitest";
import { DATA_INTELLIGENCE_DEMO_ORGANIZATION_ID } from "./constants";
import { resolveDataIntelligenceOrganizationId } from "./resolveDataIntelligenceOrganizationId";

describe("resolveDataIntelligenceOrganizationId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses demo UUID when env unset", () => {
    vi.stubEnv("NEXT_PUBLIC_VENEXT_ACTING_ORGANIZATION_ID", "");
    vi.stubEnv("NEXT_PUBLIC_DATA_INTELLIGENCE_ORGANIZATION_ID", "");
    const r = resolveDataIntelligenceOrganizationId();
    expect(r.organizationId).toBe(DATA_INTELLIGENCE_DEMO_ORGANIZATION_ID);
    expect(r.usedDemoFallback).toBe(true);
  });

  it("uses env UUID for HTTP + WS alignment when set", () => {
    const id = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    vi.stubEnv("NEXT_PUBLIC_VENEXT_ACTING_ORGANIZATION_ID", id);
    const r = resolveDataIntelligenceOrganizationId();
    expect(r.organizationId).toBe(id);
    expect(r.usedDemoFallback).toBe(false);
  });
});
