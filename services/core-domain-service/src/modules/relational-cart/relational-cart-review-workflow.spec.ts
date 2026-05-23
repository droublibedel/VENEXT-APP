import { describe, expect, it, vi } from "vitest";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { Prisma, RelationalCartLineValidationStatus, RelationalCartSourceType, RelationalCartStatus, RelationshipStatus } from "@prisma/client";

import { RelationalCartPolicyService } from "./relational-cart-policy.service";
import { RelationalCartService } from "./relational-cart.service";

const oid = (n: string) => `550e8400-e29b-41d4-a716-446655440${n}`;

function baseCart(over: Partial<{ status: RelationalCartStatus; buyerConfirmedAt: Date | null; sellerConfirmedAt: Date | null }> = {}) {
  return {
    id: oid("001"),
    organizationId: oid("002"),
    buyerOrganizationId: oid("002"),
    sellerOrganizationId: oid("003"),
    relationshipId: oid("004"),
    negotiationId: null as string | null,
    threadId: null as string | null,
    sourceType: RelationalCartSourceType.MANUAL_RELATIONAL_ENTRY,
    status: RelationalCartStatus.READY_FOR_REVIEW,
    corridorStateAtCreation: "ACTIVE" as const,
    corridorGovernanceValidated: true,
    corridorOperationalWarnings: [] as Prisma.JsonValue,
    corridorPolicySource: "RelationshipGovernancePolicyService.assertCorridorOperational",
    commercialTrustBand: null as string | null,
    requiresBuyerSellerConfirmation: true,
    conversionBlockedReason: null as string | null,
    cartConvertibleToOrder: true,
    createdByUserId: oid("005"),
    expiresAt: null as Date | null,
    convertedOrderId: null as string | null,
    metadata: {} as Prisma.JsonValue,
    buyerConfirmedAt: null as Date | null,
    sellerConfirmedAt: null as Date | null,
    buyerConfirmedByUserId: null as string | null,
    sellerConfirmedByUserId: null as string | null,
    lockedAt: null as Date | null,
    lockedByUserId: null as string | null,
    rejectedAt: null as Date | null,
    rejectedByUserId: null as string | null,
    rejectionReason: null as string | null,
    confirmationDiagnostics: {} as Prisma.JsonValue,
    lockDiagnostics: {} as Prisma.JsonValue,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: oid("010"),
        cartId: oid("001"),
        productId: oid("011"),
        catalogId: null,
        quantity: new Prisma.Decimal(1),
        unit: "pcs",
        symbolicStockStatus: "SYMBOLIC_OK",
        sourceMessageId: null,
        sourceNegotiationId: null,
        sourceDraftRevisionId: null,
        lineValidationStatus: RelationalCartLineValidationStatus.VALIDATED,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    ...over,
  };
}

describe("Instruction 20.7 — relational cart review workflow", () => {
  const policy = new RelationalCartPolicyService({} as never);
  vi.spyOn(policy, "assertActorParticipant").mockImplementation(() => undefined);

  it("confirmCartSeller rejects when actor is buyer org", async () => {
    const prisma = {
      relationalCart: {
        findUnique: vi.fn().mockResolvedValue(baseCart()),
        update: vi.fn(),
      },
    } as never;
    const flags = { isEnabled: vi.fn().mockResolvedValue(true), evaluate: vi.fn() };
    const svc = new RelationalCartService(prisma, {} as never, policy, flags as never);
    await expect(svc.confirmCartSeller(oid("001"), oid("005"), oid("002"))).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.relationalCart.update).not.toHaveBeenCalled();
  });

  it("lockCartForOrder refuses when only buyer confirmed", async () => {
    const prisma = {
      relationalCart: {
        findUnique: vi.fn().mockResolvedValue(
          baseCart({
            status: RelationalCartStatus.CONFIRMED_BY_BUYER,
            buyerConfirmedAt: new Date(),
            sellerConfirmedAt: null,
          }),
        ),
        update: vi.fn(),
      },
      relationship: {
        findUnique: vi.fn().mockResolvedValue({ id: oid("004"), status: RelationshipStatus.ACCEPTED }),
      },
    } as never;
    const flags = { isEnabled: vi.fn().mockResolvedValue(true), evaluate: vi.fn() };
    const svc = new RelationalCartService(prisma, {} as never, policy, flags as never);
    await expect(svc.lockCartForOrder(oid("001"), oid("005"), oid("002"))).rejects.toBeInstanceOf(BadRequestException);
  });
});
