import { describe, expect, it, vi } from "vitest";
import { HEADERS_METADATA } from "@nestjs/common/constants";
import {
  INDUSTRIAL_OPERATIONAL_CONTINUITY_SLICE_COST_HEADER,
  buildIndustrialOperationalContinuitySliceDiagnostics,
} from "@venext/shared-contracts";

import { IndustrialOperationalContinuityController } from "./industrial-operational-continuity.controller";

vi.mock("../../platform-authz/venext-auth-context", () => ({
  devAuthBypassEnabled: () => true,
}));

describe("IndustrialOperationalContinuityController", () => {
  const org = "31111111-1111-1111-1111-111111111101";

  it("slice routes expose FULL_COMPOSE slice diagnostics and cost header metadata", () => {
    const hdr = Reflect.getMetadata(HEADERS_METADATA, IndustrialOperationalContinuityController.prototype.stabilityStates);
    expect(hdr).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: INDUSTRIAL_OPERATIONAL_CONTINUITY_SLICE_COST_HEADER.name,
          value: INDUSTRIAL_OPERATIONAL_CONTINUITY_SLICE_COST_HEADER.value,
        }),
      ]),
    );
    expect(buildIndustrialOperationalContinuitySliceDiagnostics(false).parallelSliceWarning).toContain("bundle first");
    expect(buildIndustrialOperationalContinuitySliceDiagnostics(false).recommendedClientMode).toBe("BUNDLE_FIRST_ONLY");
  });

  it("stabilityStates slice wraps engine data with slice diagnostics", async () => {
    const bundle = {
      version: "1" as const,
      generatedAt: "2026-01-01T00:00:00.000Z",
      organizationId: org,
      policy: "ACTIVE" as const,
      disclaimer: "d",
      snapshot: {} as never,
      stabilityStates: [{ stateId: "s1" } as never],
      continuityPressures: [],
      continuityCorridors: [],
      cadenceSignals: [],
      briefings: { executiveLines: [], operationalLines: [], stabilizationLines: [] },
      diagnostics: {} as never,
    };
    const engine = { getBundleWithCacheMeta: vi.fn().mockResolvedValue({ bundle, composeCacheHit: true }) };
    const flags = {
      isEnabled: vi.fn().mockImplementation(async (key: string) => {
        if (
          key === "industrial_operational_continuity_enabled" ||
          key === "industrial_situation_room_enabled" ||
          key === "economic_command_enabled" ||
          key === "economic_coordination_enabled"
        ) {
          return true;
        }
        return false;
      }),
    };
    const prisma = { organization: { findUnique: vi.fn().mockResolvedValue({ category: "PRODUCER", actorType: null }) } };
    const controller = new IndustrialOperationalContinuityController(prisma as never, flags as never, engine as never);
    const res = await controller.stabilityStates(org);
    expect(res.sliceDiagnostics).toEqual(buildIndustrialOperationalContinuitySliceDiagnostics(true));
    expect(res.data).toEqual(bundle.stabilityStates);
  });
});
