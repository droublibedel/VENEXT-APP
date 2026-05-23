import { describe, expect, it } from "vitest";
import { isRelationalCartRealtimeEventType, RelationalCartRealtimeSchema } from "@venext/shared-contracts";

import { extractRelationalCartRealtimePayload } from "./realtime-economic-signal.gateway";

describe("Instruction 20.5 — relational cart realtime gateway", () => {
  it("isRelationalCartRealtimeEventType rejects unknown relational.cart subtype", () => {
    expect(isRelationalCartRealtimeEventType("relational.cart.unknown_custom")).toBe(false);
    expect(isRelationalCartRealtimeEventType("relational.orders.created")).toBe(false);
  });

  it("isRelationalCartRealtimeEventType accepts known domain events", () => {
    expect(isRelationalCartRealtimeEventType("relational.cart.created")).toBe(true);
    expect(isRelationalCartRealtimeEventType("relational.cart.converted_to_order")).toBe(true);
    expect(isRelationalCartRealtimeEventType("relational.cart.catalog_item_added")).toBe(true);
  });

  it("RelationalCartRealtimeSchema accepts MANUAL_RELATIONAL_ENTRY catalog_item_added payload", () => {
    const body = {
      cartId: "550e8400-e29b-41d4-a716-446655440001",
      relationshipId: "550e8400-e29b-41d4-a716-446655440002",
      productId: "550e8400-e29b-41d4-a716-446655440099",
      status: "DRAFT",
      sourceType: "MANUAL_RELATIONAL_ENTRY",
      changedFields: ["items"],
      corridorGovernanceValidated: true,
      paymentExecutionDisabled: true as const,
      computedAt: new Date().toISOString(),
      relationshipScoped: true as const,
      publicMarketplaceDisabled: true as const,
      checkoutPublicDisabled: true as const,
      stockReservationDisabled: true as const,
      corridorGovernanceRequired: true as const,
      heuristicOnly: true as const,
    };
    expect(RelationalCartRealtimeSchema.safeParse(body).success).toBe(true);
  });

  it("isRelationalCartRealtimeEventType accepts Instruction 20.7 workflow events", () => {
    expect(isRelationalCartRealtimeEventType("relational.cart.buyer_confirmed")).toBe(true);
    expect(isRelationalCartRealtimeEventType("relational.cart.seller_confirmed")).toBe(true);
    expect(isRelationalCartRealtimeEventType("relational.cart.both_parties_confirmed")).toBe(true);
    expect(isRelationalCartRealtimeEventType("relational.cart.locked_for_order")).toBe(true);
    expect(isRelationalCartRealtimeEventType("relational.cart.confirmations_reset")).toBe(true);
  });

  it("RelationalCartRealtimeSchema accepts buyer_confirmed minimal payload with workflow flags", () => {
    const body = {
      cartId: "550e8400-e29b-41d4-a716-446655440001",
      relationshipId: "550e8400-e29b-41d4-a716-446655440002",
      status: "CONFIRMED_BY_BUYER",
      sourceType: "MANUAL_RELATIONAL_ENTRY",
      changedFields: ["status"],
      corridorGovernanceValidated: true,
      paymentExecutionDisabled: true as const,
      computedAt: new Date().toISOString(),
      relationshipScoped: true as const,
      publicMarketplaceDisabled: true as const,
      checkoutPublicDisabled: true as const,
      stockReservationDisabled: true as const,
      corridorGovernanceRequired: true as const,
      heuristicOnly: true as const,
      buyerConfirmed: true,
      sellerConfirmed: false,
      bothPartiesConfirmed: false,
      lockEligible: false,
      conversionEligible: false,
    };
    expect(RelationalCartRealtimeSchema.safeParse(body).success).toBe(true);
  });

  it("RelationalCartRealtimeSchema rejects unknown checkout key", () => {
    const bad = {
      cartId: "550e8400-e29b-41d4-a716-446655440001",
      relationshipId: "550e8400-e29b-41d4-a716-446655440002",
      status: "READY_FOR_REVIEW",
      sourceType: "NEGOTIATION_ACCEPTED",
      changedFields: ["status"],
      corridorGovernanceValidated: true,
      paymentExecutionDisabled: true as const,
      computedAt: new Date().toISOString(),
      relationshipScoped: true as const,
      publicMarketplaceDisabled: true as const,
      checkoutPublicDisabled: true as const,
      stockReservationDisabled: true as const,
      corridorGovernanceRequired: true as const,
      checkout: "forbidden",
    };
    expect(RelationalCartRealtimeSchema.safeParse(bad).success).toBe(false);
  });

  it("RelationalCartRealtimeSchema rejects wallet field in strict mode", () => {
    const bad = {
      cartId: "550e8400-e29b-41d4-a716-446655440001",
      relationshipId: "550e8400-e29b-41d4-a716-446655440002",
      status: "READY_FOR_REVIEW",
      sourceType: "NEGOTIATION_ACCEPTED",
      changedFields: ["status"],
      corridorGovernanceValidated: true,
      paymentExecutionDisabled: true as const,
      computedAt: new Date().toISOString(),
      relationshipScoped: true as const,
      publicMarketplaceDisabled: true as const,
      checkoutPublicDisabled: true as const,
      stockReservationDisabled: true as const,
      corridorGovernanceRequired: true as const,
      walletBalance: 123,
    };
    expect(RelationalCartRealtimeSchema.safeParse(bad).success).toBe(false);
  });

  it("extractRelationalCartRealtimePayload accepts minimal valid body", () => {
    const body = {
      cartId: "550e8400-e29b-41d4-a716-446655440001",
      relationshipId: "550e8400-e29b-41d4-a716-446655440002",
      status: "READY_FOR_REVIEW",
      sourceType: "NEGOTIATION_ACCEPTED",
      changedFields: ["status"],
      corridorGovernanceValidated: true,
      paymentExecutionDisabled: true,
      computedAt: new Date().toISOString(),
      relationshipScoped: true,
      publicMarketplaceDisabled: true,
      checkoutPublicDisabled: true,
      stockReservationDisabled: true,
      corridorGovernanceRequired: true,
    };
    const m = extractRelationalCartRealtimePayload("relational.cart.created", body);
    expect(m?.cartId).toBe(body.cartId);
  });

  it("extractRelationalCartRealtimePayload accepts relational.cart.catalog_item_added", () => {
    const body = {
      cartId: "550e8400-e29b-41d4-a716-446655440001",
      relationshipId: "550e8400-e29b-41d4-a716-446655440002",
      productId: "550e8400-e29b-41d4-a716-446655440099",
      status: "DRAFT",
      sourceType: "MANUAL_RELATIONAL_ENTRY",
      changedFields: ["items"],
      corridorGovernanceValidated: true,
      paymentExecutionDisabled: true,
      computedAt: new Date().toISOString(),
      relationshipScoped: true,
      publicMarketplaceDisabled: true,
      checkoutPublicDisabled: true,
      stockReservationDisabled: true,
      corridorGovernanceRequired: true,
      heuristicOnly: true,
    };
    const m = extractRelationalCartRealtimePayload("relational.cart.catalog_item_added", body);
    expect(m?.cartId).toBe(body.cartId);
    expect(m?.productId).toBe(body.productId);
  });
});
