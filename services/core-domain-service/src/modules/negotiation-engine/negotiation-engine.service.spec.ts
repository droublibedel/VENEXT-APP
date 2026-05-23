import { describe, expect, it, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { NegotiationStatus, PaymentMode } from "@prisma/client";

import { NegotiationEngineService } from "./negotiation-engine.service";

describe("Instruction 20.4A — negotiation corridor gate", () => {
  it("throws commercial_corridor_required when no relationship and not sponsored-temporary", async () => {
    const prisma = {
      negotiation: {
        findUnique: vi.fn().mockResolvedValue({
          id: "n1",
          status: NegotiationStatus.OPEN,
          buyerOrganizationId: "b1",
          sellerOrganizationId: "s1",
          productId: "p1",
          proposedQuantity: null,
          proposedPrice: null,
          proposedPaymentMode: null,
          negotiationDraftMetadata: null,
        }),
      },
      relationship: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const sponsoredNegotiation = {
      sponsoredNegotiationContext: vi.fn().mockResolvedValue({
        sponsoredNegotiation: false,
        hasAcceptedRelationship: false,
      }),
    };
    const engine = new NegotiationEngineService(
      prisma as never,
      sponsoredNegotiation as never,
      undefined,
      {} as never,
      undefined,
    );
    try {
      await engine.proposePrice("n1", "u1", "b1", 12);
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      const body = (e as BadRequestException).getResponse() as { code?: string };
      expect(body.code).toBe("commercial_corridor_required");
    }
  });

  it("allows sponsored-temporary lane without relationshipId", async () => {
    const prisma = {
      negotiation: {
        findUnique: vi.fn().mockResolvedValue({
          id: "n1",
          status: NegotiationStatus.OPEN,
          buyerOrganizationId: "b1",
          sellerOrganizationId: "s1",
          productId: "p1",
          proposedQuantity: null,
          proposedPrice: null,
          proposedPaymentMode: null,
          negotiationDraftMetadata: null,
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      relationship: { findFirst: vi.fn().mockResolvedValue(null) },
      product: { findUnique: vi.fn().mockResolvedValue({ paymentModes: [PaymentMode.CASH] }) },
      messageThread: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const sponsoredNegotiation = {
      sponsoredNegotiationContext: vi.fn().mockResolvedValue({
        sponsoredNegotiation: true,
        hasAcceptedRelationship: false,
      }),
    };
    const engine = new NegotiationEngineService(
      prisma as never,
      sponsoredNegotiation as never,
      undefined,
      {} as never,
      undefined,
    );
    await expect(engine.proposePaymentMode("n1", "u1", "b1", PaymentMode.CASH)).resolves.toBeDefined();
  });

  it("runs corridor operational check when relationship exists", async () => {
    const assertCorridorOperational = vi.fn().mockResolvedValue(undefined);
    const prisma = {
      negotiation: {
        findUnique: vi.fn().mockResolvedValue({
          id: "n1",
          status: NegotiationStatus.OPEN,
          buyerOrganizationId: "b1",
          sellerOrganizationId: "s1",
          productId: "p1",
          proposedQuantity: null,
          proposedPrice: null,
          proposedPaymentMode: null,
          negotiationDraftMetadata: null,
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      relationship: {
        findFirst: vi.fn().mockResolvedValue({ id: "r1" }),
      },
      product: { findUnique: vi.fn().mockResolvedValue({ paymentModes: [PaymentMode.CASH] }) },
      messageThread: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const sponsoredNegotiation = {
      sponsoredNegotiationContext: vi.fn().mockResolvedValue({
        sponsoredNegotiation: false,
        hasAcceptedRelationship: false,
      }),
    };
    const policy = { assertCorridorOperational };
    const engine = new NegotiationEngineService(
      prisma as never,
      sponsoredNegotiation as never,
      undefined,
      policy as never,
      undefined,
    );
    await engine.proposePaymentMode("n1", "u1", "b1", PaymentMode.CASH);
    expect(assertCorridorOperational).toHaveBeenCalledWith(
      "r1",
      "negotiation",
      expect.objectContaining({ governanceTelemetry: expect.any(Object) }),
    );
  });
});
