import { describe, expect, it, vi } from "vitest";
import { CommercialCorridorState, RelationshipStatus } from "@prisma/client";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { CommercialCorridorRealtimeSchema } from "@venext/shared-contracts";

import { InternalRelationshipIntelligenceController } from "./internal-relationship-intelligence.controller";
import {
  assertExhaustiveCorridorStateForOperation,
  RelationshipGovernancePolicyService,
} from "./relationship-governance-policy.service";
import { deriveCorridorRiskLevel } from "./relationship-governance.types";

describe("Instruction 20.4 — corridor governance policy", () => {
  it("denies BLOCKED → ACCEPTED automatic reconciliation", () => {
    const policy = new RelationshipGovernancePolicyService({} as never, {} as never);
    const r = policy.validateRelationshipGovernance(CommercialCorridorState.BLOCKED, CommercialCorridorState.ACCEPTED);
    expect(r.ok).toBe(false);
  });

  it("allows TERMINATED from BLOCKed as terminal sink", () => {
    const policy = new RelationshipGovernancePolicyService({} as never, {} as never);
    const r = policy.validateRelationshipGovernance(CommercialCorridorState.BLOCKED, CommercialCorridorState.TERMINATED);
    expect(r.ok).toBe(true);
  });
});

describe("Instruction 20.4 — corridor operational assertions", () => {
  it("blocks order_creation when corridor is SUSPENDED", async () => {
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          id: "00000000-0000-4000-8000-000000000099",
          corridorState: CommercialCorridorState.SUSPENDED,
          status: RelationshipStatus.ACCEPTED,
        }),
      },
    };
    const policy = new RelationshipGovernancePolicyService(prisma as never, {} as never);
    await expect(policy.assertCorridorOperational("00000000-0000-4000-8000-000000000099", "order_creation")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("blocks cart_conversion when corridor is SUSPENDED", async () => {
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          id: "00000000-0000-4000-8000-000000000077",
          corridorState: CommercialCorridorState.SUSPENDED,
          status: RelationshipStatus.ACCEPTED,
        }),
      },
    };
    const policy = new RelationshipGovernancePolicyService(prisma as never, {} as never);
    await expect(policy.assertCorridorOperational("00000000-0000-4000-8000-000000000077", "cart_conversion")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("blocks negotiation when corridor is BLOCKED", async () => {
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          id: "00000000-0000-4000-8000-000000000088",
          corridorState: CommercialCorridorState.BLOCKED,
          status: RelationshipStatus.ACCEPTED,
        }),
      },
    };
    const policy = new RelationshipGovernancePolicyService(prisma as never, {} as never);
    await expect(policy.assertCorridorOperational("00000000-0000-4000-8000-000000000088", "negotiation")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("allows negotiation on DEGRADED with governance telemetry caution codes", async () => {
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          id: "00000000-0000-4000-8000-000000000055",
          corridorState: CommercialCorridorState.DEGRADED,
          status: RelationshipStatus.ACCEPTED,
        }),
      },
    };
    const policy = new RelationshipGovernancePolicyService(prisma as never, {} as never);
    const governanceTelemetry = { warnings: [] as string[], governanceWarningCodes: [] as string[] };
    await policy.assertCorridorOperational("00000000-0000-4000-8000-000000000055", "negotiation", { governanceTelemetry });
    expect(governanceTelemetry.governanceWarningCodes).toContain("CORRIDOR_DEGRADED_OPERATIONAL_CAUTION");
  });

  it("blocks order_execution when corridor is BLOCKED", async () => {
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          id: "00000000-0000-4000-8000-0000000000e1",
          corridorState: CommercialCorridorState.BLOCKED,
          status: RelationshipStatus.ACCEPTED,
        }),
      },
    };
    const policy = new RelationshipGovernancePolicyService(prisma as never, {} as never);
    await expect(
      policy.assertCorridorOperational("00000000-0000-4000-8000-0000000000e1", "order_execution"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("blocks order_execution when corridor is SUSPENDED", async () => {
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          id: "00000000-0000-4000-8000-0000000000e2",
          corridorState: CommercialCorridorState.SUSPENDED,
          status: RelationshipStatus.ACCEPTED,
        }),
      },
    };
    const policy = new RelationshipGovernancePolicyService(prisma as never, {} as never);
    await expect(
      policy.assertCorridorOperational("00000000-0000-4000-8000-0000000000e2", "order_execution"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows order_execution on DEGRADED with governance telemetry caution codes", async () => {
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          id: "00000000-0000-4000-8000-0000000000e3",
          corridorState: CommercialCorridorState.DEGRADED,
          status: RelationshipStatus.ACCEPTED,
        }),
      },
    };
    const policy = new RelationshipGovernancePolicyService(prisma as never, {} as never);
    const governanceTelemetry = { warnings: [] as string[], governanceWarningCodes: [] as string[] };
    await policy.assertCorridorOperational("00000000-0000-4000-8000-0000000000e3", "order_execution", { governanceTelemetry });
    expect(governanceTelemetry.governanceWarningCodes).toContain("CORRIDOR_DEGRADED_OPERATIONAL_CAUTION");
  });
});

describe("Instruction 20.8A — assertExhaustiveCorridorStateForOperation (order_execution matrix)", () => {
  const rid = "00000000-0000-4000-8000-0000000000f0";
  const base = { id: rid, status: RelationshipStatus.ACCEPTED as const };

  it("TERMINATED + order_execution → Forbidden", () => {
    expect(() =>
      assertExhaustiveCorridorStateForOperation({ ...base, corridorState: CommercialCorridorState.TERMINATED }, "order_execution"),
    ).toThrow(ForbiddenException);
  });

  it("INVITED + order_execution → Forbidden", () => {
    expect(() =>
      assertExhaustiveCorridorStateForOperation({ ...base, corridorState: CommercialCorridorState.INVITED }, "order_execution"),
    ).toThrow(ForbiddenException);
  });

  it("PENDING_REVIEW + order_execution → Forbidden", () => {
    expect(() =>
      assertExhaustiveCorridorStateForOperation(
        { ...base, corridorState: CommercialCorridorState.PENDING_REVIEW },
        "order_execution",
      ),
    ).toThrow(ForbiddenException);
  });

  it("RESTRICTED + normal actor → Forbidden", () => {
    expect(() =>
      assertExhaustiveCorridorStateForOperation({ ...base, corridorState: CommercialCorridorState.RESTRICTED }, "order_execution"),
    ).toThrow(ForbiddenException);
  });

  it("RESTRICTED + backoffice override → allowed", () => {
    const log = vi.fn();
    expect(() =>
      assertExhaustiveCorridorStateForOperation(
        { ...base, corridorState: CommercialCorridorState.RESTRICTED },
        "order_execution",
        { allowRestrictedOrderExecutionForBackoffice: true, restrictedOverrideLogger: { log } },
      ),
    ).not.toThrow();
    expect(log).toHaveBeenCalled();
  });

  it("DORMANT without env gate → Forbidden", () => {
    expect(() =>
      assertExhaustiveCorridorStateForOperation({ ...base, corridorState: CommercialCorridorState.DORMANT }, "order_execution"),
    ).toThrow(ForbiddenException);
  });

  it("DORMANT with env gate → allowed + warning codes", () => {
    const governanceTelemetry = { warnings: [] as string[], governanceWarningCodes: [] as string[] };
    assertExhaustiveCorridorStateForOperation(
      { ...base, corridorState: CommercialCorridorState.DORMANT },
      "order_execution",
      { allowDormantOrderExecution: true, governanceTelemetry },
    );
    expect(governanceTelemetry.governanceWarningCodes).toContain("CORRIDOR_DORMANT_ORDER_EXECUTION_ENV_ALLOWED");
  });

  it("ACTIVE → allowed", () => {
    expect(() =>
      assertExhaustiveCorridorStateForOperation({ ...base, corridorState: CommercialCorridorState.ACTIVE }, "order_execution"),
    ).not.toThrow();
  });

  it("TERMINATED + fulfillment_execution → Forbidden", () => {
    expect(() =>
      assertExhaustiveCorridorStateForOperation(
        { ...base, corridorState: CommercialCorridorState.TERMINATED },
        "fulfillment_execution",
      ),
    ).toThrow(ForbiddenException);
  });
});

describe("Instruction 20.4 — internal corridor recompute", () => {
  it("rejects missing internal key", async () => {
    const prev = process.env.VENEXT_INTERNAL_REALTIME_KEY;
    process.env.VENEXT_INTERNAL_REALTIME_KEY = "k1";
    const ctrl = new InternalRelationshipIntelligenceController({ computeCorridorHealth: vi.fn() } as never);
    await expect(ctrl.recompute(undefined, "00000000-0000-4000-8000-000000000001")).rejects.toThrow(UnauthorizedException);
    process.env.VENEXT_INTERNAL_REALTIME_KEY = prev;
  });
});

describe("Instruction 20.4B — Zod realtime contract", () => {
  it("accepts minimal corridor realtime payload with delivery honesty", () => {
    const orgA = "00000000-0000-4000-8000-0000000000aa";
    const orgB = "00000000-0000-4000-8000-0000000000bb";
    const parsed = CommercialCorridorRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      corridorState: "ACTIVE",
      corridorHealthBand: "MEDIUM",
      changedSignals: ["STABLE_ORDER_FLOW"],
      heuristicOnly: true,
      computedAt: "2026-01-01T00:00:00.000Z",
      privateEconomicCorridor: true,
      publicRankingDisabled: true,
      marketplaceExposureDisabled: true,
      intendedTargetOrganizationIds: [orgA, orgB],
      deliveredTargetOrganizationIds: [orgA, orgB],
      emittedToAllCorridorParties: true,
      partialDeliveryReason: null,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid changedSignals entries", () => {
    const orgA = "00000000-0000-4000-8000-0000000000aa";
    const orgB = "00000000-0000-4000-8000-0000000000bb";
    const parsed = CommercialCorridorRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      corridorState: "ACTIVE",
      corridorHealthBand: "MEDIUM",
      changedSignals: ["NOT_A_VALID_TOKEN"],
      heuristicOnly: true,
      computedAt: "2026-01-01T00:00:00.000Z",
      privateEconomicCorridor: true,
      publicRankingDisabled: true,
      marketplaceExposureDisabled: true,
      intendedTargetOrganizationIds: [orgA, orgB],
      deliveredTargetOrganizationIds: [orgA],
      emittedToAllCorridorParties: false,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("Instruction 20.4A — deriveCorridorRiskLevel", () => {
  it("maps ACTIVE + high health to LOW", () => {
    expect(deriveCorridorRiskLevel({ healthScore: 80, corridorState: CommercialCorridorState.ACTIVE })).toBe("LOW");
  });

  it("maps BLOCKED to CRITICAL regardless of health", () => {
    expect(deriveCorridorRiskLevel({ healthScore: 95, corridorState: CommercialCorridorState.BLOCKED })).toBe("CRITICAL");
  });

  it("maps DEGRADED + low health to HIGH", () => {
    expect(
      deriveCorridorRiskLevel({
        healthScore: 30,
        corridorState: CommercialCorridorState.DEGRADED,
        degraded: true,
      }),
    ).toBe("HIGH");
  });
});
