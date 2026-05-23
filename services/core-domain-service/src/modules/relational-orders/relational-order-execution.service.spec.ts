import { describe, expect, it, vi } from "vitest";
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import {
  CommercialCorridorState,
  RelationshipStatus,
  type RelationalOrderExecutionStatus,
} from "@prisma/client";

import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalOrderExecutionPolicyService } from "./relational-order-execution-policy.service";
import { RelationalOrderExecutionService } from "./relational-order-execution.service";

const orderId = "00000000-0000-4000-8000-000000000010";
const relationshipId = "00000000-0000-4000-8000-000000000020";
const buyerOrganizationId = "00000000-0000-4000-8000-000000000030";
const sellerOrganizationId = "00000000-0000-4000-8000-000000000031";
const actorUserId = "00000000-0000-4000-8000-000000000040";

const fulfillmentMock = { ensureFulfillmentRecordForExecution: vi.fn().mockResolvedValue(undefined) };

function baseOrder(executionStatus: RelationalOrderExecutionStatus) {
  return {
    id: orderId,
    relationshipId,
    buyerOrganizationId,
    sellerOrganizationId,
    relationalOrderExecutionStatus: executionStatus,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    relationalExecutionEvents: [] as { createdAt: Date }[],
  };
}

describe("Instruction 20.8A — RelationalOrderExecutionService", () => {
  const policy = new RelationalOrderExecutionPolicyService();

  it("rejects transitions when order.relationshipId is missing", async () => {
    const prisma = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          ...baseOrder("CREATED"),
          relationshipId: null,
        }),
      },
    };
    const svc = new RelationalOrderExecutionService(prisma as never, policy, {} as never, {} as never, fulfillmentMock as never);
    await expect(
      svc.applyTransition({
        orderId,
        actorOrganizationId: buyerOrganizationId,
        actorUserId,
        body: { targetStatus: "PREPARING" },
        allowRestrictedOrderExecutionForBackoffice: false,
        allowDormantOrderExecution: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects non-participant actors", async () => {
    const prisma = {
      order: {
        findUnique: vi.fn().mockResolvedValue(baseOrder("CREATED")),
      },
    };
    const svc = new RelationalOrderExecutionService(prisma as never, policy, {} as never, {} as never, fulfillmentMock as never);
    await expect(
      svc.applyTransition({
        orderId,
        actorOrganizationId: "00000000-0000-4000-8000-000000009999",
        actorUserId,
        body: { targetStatus: "PREPARING" },
        allowRestrictedOrderExecutionForBackoffice: false,
        allowDormantOrderExecution: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects order_execution when corridor is TERMINATED (governance exhaustiveness)", async () => {
    const prisma = {
      order: { findUnique: vi.fn().mockResolvedValue(baseOrder("CREATED")) },
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          id: relationshipId,
          status: RelationshipStatus.ACCEPTED,
          corridorState: CommercialCorridorState.TERMINATED,
        }),
      },
    };
    const corridor = new RelationshipGovernancePolicyService(prisma as never, {} as never);
    const svc = new RelationalOrderExecutionService(
      prisma as never,
      policy,
      corridor,
      { publishBothSides: vi.fn() } as never,
      fulfillmentMock as never,
    );
    await expect(
      svc.applyTransition({
        orderId,
        actorOrganizationId: buyerOrganizationId,
        actorUserId,
        body: { targetStatus: "PREPARING" },
        allowRestrictedOrderExecutionForBackoffice: false,
        allowDormantOrderExecution: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("returns validated idempotent transition response without DB writes", async () => {
    const prisma = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          ...baseOrder("PREPARING"),
          relationalExecutionEvents: [],
        }),
      },
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          id: relationshipId,
          status: RelationshipStatus.ACCEPTED,
          corridorState: CommercialCorridorState.ACTIVE,
        }),
      },
    };
    const svc = new RelationalOrderExecutionService(prisma as never, policy, {} as never, {} as never, fulfillmentMock as never);
    const res = await svc.applyTransition({
      orderId,
      actorOrganizationId: buyerOrganizationId,
      actorUserId,
      body: { targetStatus: "PREPARING" },
      allowRestrictedOrderExecutionForBackoffice: false,
      allowDormantOrderExecution: false,
    });
    expect(res.idempotent).toBe(true);
    expect(res.eventCreated).toBe(false);
    expect(res.paymentExecutionDisabled).toBe(true);
    expect(res.publicTrackingDisabled).toBe(true);
    expect(prisma.order.findUnique).toHaveBeenCalledTimes(1);
  });

  it("does not roll back DB when realtime publish returns false after transaction", async () => {
    const prisma = {
      order: { findUnique: vi.fn().mockResolvedValue(baseOrder("CREATED")) },
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          id: relationshipId,
          status: RelationshipStatus.ACCEPTED,
          corridorState: CommercialCorridorState.ACTIVE,
        }),
      },
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) => {
        const tx = {
          order: {
            findUnique: vi.fn().mockResolvedValue({
              relationalOrderExecutionStatus: "CREATED" as const,
              relationshipId,
            }),
            update: vi.fn(),
          },
          relationalOrderExecutionEvent: { create: vi.fn() },
        };
        await fn(tx);
      }),
    };
    const corridor = new RelationshipGovernancePolicyService(prisma as never, {} as never);
    const realtime = { publishBothSides: vi.fn().mockResolvedValue(false) };
    const svc = new RelationalOrderExecutionService(prisma as never, policy, corridor, realtime as never, fulfillmentMock as never);
    const res = await svc.applyTransition({
      orderId,
      actorOrganizationId: buyerOrganizationId,
      actorUserId,
      body: { targetStatus: "PREPARING" },
      allowRestrictedOrderExecutionForBackoffice: false,
      allowDormantOrderExecution: false,
    });
    expect(res.eventCreated).toBe(true);
    expect(res.realtimePublishAttempted).toBe(true);
    expect(res.realtimePublished).toBe(false);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("rejects missing order", async () => {
    const prisma = { order: { findUnique: vi.fn().mockResolvedValue(null) } };
    const svc = new RelationalOrderExecutionService(prisma as never, policy, {} as never, {} as never, fulfillmentMock as never);
    await expect(
      svc.applyTransition({
        orderId,
        actorOrganizationId: buyerOrganizationId,
        actorUserId,
        body: { targetStatus: "PREPARING" },
        allowRestrictedOrderExecutionForBackoffice: false,
        allowDormantOrderExecution: false,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
