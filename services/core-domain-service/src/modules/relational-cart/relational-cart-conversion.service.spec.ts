import { describe, expect, it, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import {
  Prisma,
  RelationalCartLineValidationStatus,
  RelationalCartStatus,
  RelationshipStatus,
} from "@prisma/client";
import { RelationalCartConversionResponseSchema } from "@venext/shared-contracts";

import { RelationalCartPolicyService } from "./relational-cart-policy.service";
import { RelationalCartConversionService } from "./relational-cart-conversion.service";

const oid = (n: string) => `550e8400-e29b-41d4-a716-446655440${n}`;

describe("Instruction 20.5A — RelationalCartConversionService", () => {
  const policy = new RelationalCartPolicyService({} as never);
  vi.spyOn(policy, "assertActorParticipant").mockImplementation(() => undefined);

  it("rejects conversion when cart is only dual-confirmed but not locked", async () => {
    const prisma = {
      relationalCart: {
        findUnique: vi.fn().mockResolvedValue({
          id: oid("001"),
          buyerOrganizationId: oid("002"),
          sellerOrganizationId: oid("003"),
          relationshipId: oid("004"),
          status: RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES,
          cartConvertibleToOrder: true,
          conversionBlockedReason: null,
          convertedOrderId: null,
          negotiationId: null,
          corridorGovernanceValidated: true,
          corridorStateAtCreation: "ACTIVE",
          corridorOperationalWarnings: [],
          relationship: { status: RelationshipStatus.ACCEPTED },
          items: [
            {
              id: oid("010"),
              productId: oid("011"),
              quantity: new Prisma.Decimal(1),
              lineValidationStatus: RelationalCartLineValidationStatus.VALIDATED,
            },
          ],
        }),
      },
    } as never;
    const svc = new RelationalCartConversionService(prisma, policy, undefined, undefined, undefined, undefined);
    let err: unknown;
    try {
      await svc.convertCartToOrder(oid("001"), "u1", oid("002"), {});
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(BadRequestException);
    expect(((err as BadRequestException).getResponse() as { code?: string }).code).toBe("relational_cart_not_locked_for_order");
  });

  it("blocks conversion when line is CATALOG_VISIBILITY_REQUIRES_REVIEW", async () => {
    const prisma = {
      relationalCart: {
        findUnique: vi.fn().mockResolvedValue({
          id: oid("001"),
          buyerOrganizationId: oid("002"),
          sellerOrganizationId: oid("003"),
          relationshipId: oid("004"),
          status: RelationalCartStatus.LOCKED_FOR_ORDER,
          cartConvertibleToOrder: true,
          conversionBlockedReason: null,
          convertedOrderId: null,
          negotiationId: null,
          relationship: { status: RelationshipStatus.ACCEPTED },
          items: [
            {
              id: oid("010"),
              productId: oid("011"),
              quantity: new Prisma.Decimal(1),
              lineValidationStatus: RelationalCartLineValidationStatus.CATALOG_VISIBILITY_REQUIRES_REVIEW,
            },
          ],
        }),
      },
    } as never;
    const svc = new RelationalCartConversionService(prisma, policy, undefined, undefined, undefined, undefined);
    let err: unknown;
    try {
      await svc.convertCartToOrder(oid("001"), "u1", oid("002"), {});
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(BadRequestException);
    expect(((err as BadRequestException).getResponse() as { code?: string }).code).toBe("relational_cart_line_requires_review");
  });

  it("blocks conversion when line is QUANTITY_REQUIRES_REVIEW", async () => {
    const prisma = {
      relationalCart: {
        findUnique: vi.fn().mockResolvedValue({
          id: oid("001"),
          buyerOrganizationId: oid("002"),
          sellerOrganizationId: oid("003"),
          relationshipId: oid("004"),
          status: RelationalCartStatus.LOCKED_FOR_ORDER,
          cartConvertibleToOrder: true,
          conversionBlockedReason: null,
          convertedOrderId: null,
          negotiationId: null,
          relationship: { status: RelationshipStatus.ACCEPTED },
          items: [
            {
              id: oid("010"),
              productId: oid("011"),
              quantity: new Prisma.Decimal(1),
              lineValidationStatus: RelationalCartLineValidationStatus.QUANTITY_REQUIRES_REVIEW,
            },
          ],
        }),
      },
    } as never;
    const svc = new RelationalCartConversionService(prisma, policy, undefined, undefined, undefined, undefined);
    await expect(svc.convertCartToOrder(oid("001"), "u1", oid("002"), {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it("returns idempotent replay when cart already converted", async () => {
    const prisma = {
      relationalCart: {
        findUnique: vi.fn().mockResolvedValue({
          id: oid("001"),
          buyerOrganizationId: oid("002"),
          sellerOrganizationId: oid("003"),
          relationshipId: oid("004"),
          status: RelationalCartStatus.CONVERTED_TO_ORDER,
          cartConvertibleToOrder: true,
          conversionBlockedReason: null,
          convertedOrderId: oid("099"),
          negotiationId: null,
          corridorGovernanceValidated: true,
          corridorStateAtCreation: "ACTIVE",
          corridorOperationalWarnings: [],
          relationship: { status: RelationshipStatus.ACCEPTED },
          items: [
            {
              id: oid("010"),
              lineValidationStatus: RelationalCartLineValidationStatus.VALIDATED,
            },
          ],
        }),
      },
    } as never;
    const svc = new RelationalCartConversionService(prisma, policy, undefined, undefined, undefined, undefined);
    const out = await svc.convertCartToOrder(oid("001"), "u1", oid("002"), {
      backofficeOverrideDiagnostics: {
        backofficeOverrideRequested: false,
        backofficeOverrideGranted: false,
        backofficeOverrideSource: "none",
      },
    });
    const parsed = RelationalCartConversionResponseSchema.safeParse(out);
    expect(parsed.success).toBe(true);
    expect(out.conversionIdempotentReplay).toBe(true);
    expect(out.orderId).toBe(oid("099"));
  });
});
