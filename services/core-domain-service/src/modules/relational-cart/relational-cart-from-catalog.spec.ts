import { describe, expect, it, vi } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { CatalogVisibilityMode, StockStatus } from "@prisma/client";
import { DirectCatalogCartRequestSchema } from "@venext/shared-contracts";

import { RelationalCartPolicyService } from "./relational-cart-policy.service";
import { RelationalCartService } from "./relational-cart.service";

describe("Instruction 20.6 — direct relational catalog → cart", () => {
  it("DirectCatalogCartRequestSchema rejects non-positive quantity", () => {
    const p = DirectCatalogCartRequestSchema.safeParse({
      relationshipId: "550e8400-e29b-41d4-a716-446655440001",
      sellerOrganizationId: "550e8400-e29b-41d4-a716-446655440002",
      buyerOrganizationId: "550e8400-e29b-41d4-a716-446655440003",
      productId: "550e8400-e29b-41d4-a716-446655440004",
      quantity: 0,
      unit: "kg",
    });
    expect(p.success).toBe(false);
  });

  it("validateLineForDirectCatalog rejects invisible product (no negotiation shortcut)", async () => {
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          organizationId: "s1",
          catalogId: "c1",
          catalog: { visibilityMode: CatalogVisibilityMode.RELATIONSHIP_ONLY },
          visibility: [{ active: true, visibleToRelationshipId: null, visibleToOrganizationId: null }],
          stockStatus: StockStatus.AVAILABLE,
        }),
      },
    } as never;
    const policy = new RelationalCartPolicyService(prisma);
    try {
      await policy.validateLineForDirectCatalog("p1", {
        buyerOrganizationId: "b1",
        sellerOrganizationId: "s1",
        relationshipId: "r1",
      });
      expect.fail("expected ForbiddenException");
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenException);
      const r = (e as ForbiddenException).getResponse() as { code?: string };
      expect(r.code).toBe("catalog_product_not_visible_for_relationship");
    }
  });

  it("validateLineForDirectCatalog allows relationship visibility", async () => {
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          organizationId: "s1",
          catalogId: "c1",
          catalog: { visibilityMode: CatalogVisibilityMode.RELATIONSHIP_ONLY },
          visibility: [{ active: true, visibleToRelationshipId: "r1", visibleToOrganizationId: null }],
          stockStatus: StockStatus.AVAILABLE,
        }),
      },
    } as never;
    const policy = new RelationalCartPolicyService(prisma);
    const line = await policy.validateLineForDirectCatalog("p1", {
      buyerOrganizationId: "b1",
      sellerOrganizationId: "s1",
      relationshipId: "r1",
    });
    expect(line.lineValidation).toBe("VALIDATED");
  });

  it("addFromDirectCatalog returns 403 when feature flag disabled", async () => {
    const prisma = {} as never;
    const sponsored = {} as never;
    const policy = new RelationalCartPolicyService(prisma);
    const flags = { isEnabled: vi.fn().mockResolvedValue(false), evaluate: vi.fn() };
    const svc = new RelationalCartService(prisma, sponsored as never, policy, flags as never);
    await expect(
      svc.addFromDirectCatalog({
        relationshipId: "550e8400-e29b-41d4-a716-446655440001",
        buyerOrganizationId: "550e8400-e29b-41d4-a716-446655440002",
        sellerOrganizationId: "550e8400-e29b-41d4-a716-446655440003",
        productId: "550e8400-e29b-41d4-a716-446655440004",
        quantity: 1,
        unit: "kg",
        actorUserId: "550e8400-e29b-41d4-a716-446655440005",
        actorOrganizationId: "550e8400-e29b-41d4-a716-446655440002",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(flags.isEnabled).toHaveBeenCalledWith("relational_cart_direct_catalog_enabled", {
      organizationId: "550e8400-e29b-41d4-a716-446655440002",
    });
  });
});
