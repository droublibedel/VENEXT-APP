import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { StockStatus } from "@prisma/client";
import { RelationalCartConversionResponseSchema, RelationalCartResponseSchema } from "@venext/shared-contracts";

import { RelationalCartPolicyService } from "./relational-cart-policy.service";
import { RelationalCartService } from "./relational-cart.service";

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === "node_modules" || name === "dist") continue;
    const st = statSync(p);
    if (st.isDirectory()) walkTsFiles(p, acc);
    else if (st.isFile() && name.endsWith(".ts") && !name.endsWith(".spec.ts")) acc.push(p);
  }
  return acc;
}

describe("Instruction 20.5 — relational cart", () => {
  it("includes versioned SQL migration for relational cart tables", () => {
    const migrationsDir = join(__dirname, "../../../../../prisma/migrations");
    const names = readdirSync(migrationsDir);
    expect(names.some((n) => n.includes("instruction_20_5_relational_cart"))).toBe(true);
  });

  it("includes versioned SQL migration for relational cart confirmation columns (20.7)", () => {
    const migrationsDir = join(__dirname, "../../../../../prisma/migrations");
    const names = readdirSync(migrationsDir);
    expect(names.some((n) => n.includes("instruction_20_7_relational_cart_confirmation"))).toBe(true);
  });

  it("Zod RelationalCartResponseSchema accepts diagnostics with sourceTypeReadiness", () => {
    const parsed = RelationalCartResponseSchema.safeParse({
      cart: {
        id: "550e8400-e29b-41d4-a716-446655440001",
        organizationId: "550e8400-e29b-41d4-a716-446655440002",
        buyerOrganizationId: "550e8400-e29b-41d4-a716-446655440002",
        sellerOrganizationId: "550e8400-e29b-41d4-a716-446655440003",
        relationshipId: "550e8400-e29b-41d4-a716-446655440004",
        negotiationId: null,
        threadId: null,
        sourceType: "NEGOTIATION_ACCEPTED",
        status: "READY_FOR_REVIEW",
        corridorStateAtCreation: "ACTIVE",
        corridorGovernanceValidated: true,
        corridorOperationalWarnings: [],
        corridorPolicySource: "RelationshipGovernancePolicyService.assertCorridorOperational",
        commercialTrustBand: null,
        requiresBuyerSellerConfirmation: true,
        conversionBlockedReason: null,
        cartConvertibleToOrder: true,
        createdByUserId: "550e8400-e29b-41d4-a716-446655440005",
        expiresAt: null,
        convertedOrderId: null,
        metadata: {},
        buyerConfirmedAt: null,
        sellerConfirmedAt: null,
        buyerConfirmedByUserId: null,
        sellerConfirmedByUserId: null,
        lockedAt: null,
        lockedByUserId: null,
        rejectedAt: null,
        rejectedByUserId: null,
        rejectionReason: null,
        confirmationDiagnostics: {},
        lockDiagnostics: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
      },
      diagnostics: {
        relationshipScoped: true,
        publicMarketplaceDisabled: true,
        checkoutPublicDisabled: true,
        paymentExecutionDisabled: true,
        stockReservationDisabled: true,
        walletDebitDisabled: true,
        corridorGovernanceRequired: true,
        corridorGovernanceValidated: true,
        corridorPolicySource: "x",
        heuristicOnly: true,
        sourceTypeReadiness: {
          NEGOTIATION_ACCEPTED: "READY",
          CONVERSATIONAL_DRAFT_CONFIRMED: "READY",
          SPONSORED_PRINCIPLE_AGREEMENT: "READY",
          MANUAL_RELATIONAL_ENTRY: "CONNECTED",
          RELATIONAL_REORDER: "NOT_CONNECTED_YET",
        },
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("RelationalCartConversionResponseSchema accepts idempotent replay flag", () => {
    const p = RelationalCartConversionResponseSchema.safeParse({
      orderId: "550e8400-e29b-41d4-a716-446655440099",
      cartId: "550e8400-e29b-41d4-a716-446655440001",
      conversionIdempotentReplay: true,
      diagnostics: {
        relationshipScoped: true,
        publicMarketplaceDisabled: true,
        checkoutPublicDisabled: true,
        paymentExecutionDisabled: true,
        stockReservationDisabled: true,
        walletDebitDisabled: true,
        corridorGovernanceRequired: true,
        corridorGovernanceValidated: true,
        corridorPolicySource: "x",
        heuristicOnly: true,
      },
    });
    expect(p.success).toBe(true);
  });

  it("prisma.order.create exists only in RelationalCartConversionService (src)", () => {
    const srcRoot = join(__dirname, "..");
    const hits: string[] = [];
    for (const f of walkTsFiles(srcRoot)) {
      const c = readFileSync(f, "utf8");
      if (c.includes("prisma.order.create")) hits.push(f);
    }
    expect(hits.length).toBe(1);
    expect(hits[0]).toContain("relational-cart-conversion.service.ts");
  });

  it("createCartFromSponsoredPrincipleAgreement does not persist when relationship missing", async () => {
    const prisma = {} as never;
    const sponsored = {
      assertConvertToCartAllowed: vi.fn(),
      sponsoredNegotiationContext: vi.fn().mockResolvedValue({
        sponsoredNegotiation: true,
        hasAcceptedRelationship: false,
      }),
    };
    const policy = new RelationalCartPolicyService(prisma);
    const flags = { isEnabled: vi.fn().mockResolvedValue(false), evaluate: vi.fn() };
    const svc = new RelationalCartService(prisma, sponsored as never, policy, flags as never);
    const out = await svc.createCartFromSponsoredPrincipleAgreement("n1");
    expect(out.created).toBe(false);
    expect(out.reason).toBe("RELATIONSHIP_REQUIRED");
  });

  it("RelationalCartPolicyService rejects product not owned by seller", async () => {
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          organizationId: "other",
          catalogId: "cat",
          catalog: { visibilityMode: "RELATIONSHIP_ONLY" },
          visibility: [],
          stockStatus: StockStatus.AVAILABLE,
        }),
      },
    } as never;
    const policy = new RelationalCartPolicyService(prisma);
    await expect(
      policy.validateLineForCart("p1", {
        buyerOrganizationId: "b1",
        sellerOrganizationId: "s1",
        relationshipId: "r1",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
