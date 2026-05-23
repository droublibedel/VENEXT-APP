import { describe, expect, it, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { NegotiationStatus, TemporaryCommercialHandshakeState, ThreadType } from "@prisma/client";

import { NegotiationEngineService } from "../negotiation-engine/negotiation-engine.service";
import { NegotiationToCartConverterService } from "../negotiation-engine/negotiation-to-cart-converter.service";
import { SponsoredNegotiationAccessService } from "../commerce-thread-access/sponsored-negotiation-access.service";
import { SponsoredConversationExpirationService } from "./sponsored-conversation-expiration.service";

describe("Instruction 20.2A — sponsored negotiation hardening", () => {
  it("accept does not set NegotiationStatus.ACCEPTED when sponsored without corridor", async () => {
    const prisma = {
      negotiation: {
        findUnique: vi.fn().mockResolvedValue({
          id: "n1",
          productId: "p1",
          buyerOrganizationId: "b1",
          sellerOrganizationId: "s1",
          proposedQuantity: { toString: () => "10" },
          proposedPrice: { toString: () => "100" },
          proposedPaymentMode: null,
          negotiationDraftMetadata: {},
        }),
        update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "n1", ...data })),
      },
      messageThread: {
        findFirst: vi.fn().mockResolvedValue({
          id: "t1",
          threadType: ThreadType.SPONSORED_DISCOVERY_THREAD,
          buyerOrganizationId: "b1",
          sellerOrganizationId: "s1",
          sponsoredConversationWindowId: "w1",
        }),
      },
      message: { create: vi.fn().mockResolvedValue({ id: "m1" }) },
      relationship: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const sponsored = new SponsoredNegotiationAccessService(prisma as never);
    const engine = new NegotiationEngineService(prisma as never, sponsored);
    const out = await engine.accept("n1", "u1", "b1", {});
    expect(prisma.negotiation.update).toHaveBeenCalled();
    const call = prisma.negotiation.update.mock.calls[0][0] as { data: { status: NegotiationStatus } };
    expect(call.data.status).toBe(NegotiationStatus.PROPOSED);
    expect((out as { status: NegotiationStatus }).status).toBe(NegotiationStatus.PROPOSED);
  });

  it("convert-to-cart is blocked for sponsored negotiation without ACCEPTED relationship", async () => {
    const relationalCart = {
      createCartFromNegotiation: vi.fn().mockRejectedValue(
        new BadRequestException({ code: "sponsored_convert_to_cart_blocked" }),
      ),
    };
    const cart = new NegotiationToCartConverterService(relationalCart as never);
    await expect(cart.convertToCart("n1", "u1", "b1")).rejects.toThrow(BadRequestException);
    expect(relationalCart.createCartFromNegotiation).toHaveBeenCalledWith("n1", "u1", "b1", { markNegotiationConverted: true });
  });
});

describe("Instruction 20.2A — expiration idempotency shape", () => {
  it("expireDueWindows queries windows not already marked SPONSORED_WINDOW_EXPIRED", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { sponsoredConversationWindow: { findMany, updateMany: vi.fn() } };
    const realtime = { publish: vi.fn() };
    const analytics = { bumpWindowExpired: vi.fn() };
    const svc = new SponsoredConversationExpirationService(
      prisma as never,
      realtime as never,
      analytics as never,
    );
    await svc.expireDueWindows(new Date("2026-06-01T00:00:00Z"));
    expect(findMany).toHaveBeenCalled();
    const where = findMany.mock.calls[0][0].where as {
      state: { not: TemporaryCommercialHandshakeState };
    };
    expect(where.state.not).toBe(TemporaryCommercialHandshakeState.SPONSORED_WINDOW_EXPIRED);
  });
});
