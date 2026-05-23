import { describe, expect, it, vi } from "vitest";
import { RelationalCartResponseSchema } from "@venext/shared-contracts";

import { fetchRelationalCart } from "./fetch-relational-cart";

describe("Instruction 20.5A — fetchRelationalCart", () => {
  it("returns invalid_payload when JSON does not match RelationalCartResponseSchema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ unexpected: true }),
      }),
    );
    const out = await fetchRelationalCart({
      cartId: "550e8400-e29b-41d4-a716-446655440001",
      actingOrganizationId: "550e8400-e29b-41d4-a716-446655440002",
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toBe("invalid_payload");
    vi.unstubAllGlobals();
  });

  it("returns ok when response matches schema", async () => {
    const payload = {
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
    };
    expect(RelationalCartResponseSchema.safeParse(payload).success).toBe(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      }),
    );
    const out = await fetchRelationalCart({
      cartId: "550e8400-e29b-41d4-a716-446655440001",
      actingOrganizationId: "550e8400-e29b-41d4-a716-446655440002",
    });
    expect(out.ok).toBe(true);
    vi.unstubAllGlobals();
  });
});
