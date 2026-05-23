import { describe, expect, it, vi } from "vitest";
import { MessageType, NegotiationStatus, OrderStatus } from "@prisma/client";
import { ConversationalCommerceService } from "./conversational-commerce/conversational-commerce.service";
import { NegotiationIntelligenceService } from "./negotiation-intelligence/negotiation-intelligence.service";
import type { RealtimeDomainEventPublisher } from "./realtime-commerce/realtime-domain-event.publisher";
import { OrderAdvDomainRealtimeBridgeService } from "./order-adv-intelligence/order-adv-domain-realtime-bridge.service";

describe("Instruction 14A — conversational commerce depth", () => {
  it("exposes cart conversion capability and structured message tails", () => {
    const svc = new ConversationalCommerceService();
    const threadId = "91111111-1111-1111-1111-111111111099";
    const snap = {
      organizationId: "31111111-1111-1111-1111-111111111101",
      generatedAt: new Date().toISOString(),
      orders: [],
      negotiations: [],
      threads: [
        {
          id: threadId,
          threadType: "NEGOTIATION_CONTEXT",
          productId: "61111111-1111-1111-1111-111111111001",
          orderId: null,
          negotiationId: "81111111-1111-1111-1111-111111111001",
          buyerOrganizationId: "31111111-1111-1111-1111-111111111103",
          sellerOrganizationId: "31111111-1111-1111-1111-111111111101",
          updatedAt: new Date(),
          product: { id: "61111111-1111-1111-1111-111111111001", name: "Demo SKU" },
        },
      ],
      groupSessions: [],
      economicStates: [],
      reservationIntents: [],
      orgGeo: new Map(),
      messageCountByThread: new Map([[threadId, 5]]),
      latestMessagesByThread: new Map([
        [
          threadId,
          [
            {
              id: "d1111111-1111-4111-8111-111111119999",
              threadId,
              messageType: MessageType.CART_CONVERSION_EVENT,
              structuredEvent: { kind: "cart_conversion" },
              createdAt: new Date(),
            },
          ],
        ],
      ]),
    };
    const out = svc.build(snap as never, true);
    expect(out.capabilities?.find((c) => c.key === "cart_conversion_from_messages")?.available).toBe(true);
    expect(out.capabilities?.find((c) => c.key === "conversational_cart_order_mutation")?.available).toBe(false);
    expect(out.threads[0]?.cartConversionMessageCount).toBe(1);
    expect(out.threads[0]?.latestStructuredMessages?.length).toBeGreaterThan(0);
    expect(out.threads[0]?.productLinked).toBe(true);
    expect(out.threads[0]?.negotiationLinked).toBe(true);
  });
});

describe("Instruction 14A — negotiation intelligence", () => {
  it("toggles sponsorshipAssisted from sponsored product set", () => {
    const svc = new NegotiationIntelligenceService();
    const pid = "61111111-1111-1111-1111-111111111001";
    const snap = {
      organizationId: "31111111-1111-1111-1111-111111111101",
      generatedAt: new Date().toISOString(),
      orders: [
        {
          id: "a",
          buyerOrganizationId: "b1",
          sellerOrganizationId: "b2",
          status: OrderStatus.ACCEPTED,
          items: [{ quantity: 1, product: { id: pid, name: "P" } }],
        },
        {
          id: "b",
          buyerOrganizationId: "b1",
          sellerOrganizationId: "b2",
          status: OrderStatus.ACCEPTED,
          items: [{ quantity: 1, product: { id: "61111111-1111-1111-1111-111111111002", name: "Q" } }],
        },
      ],
      negotiations: [
        {
          id: "n1",
          productId: pid,
          buyerOrganizationId: "b1",
          sellerOrganizationId: "b2",
          status: NegotiationStatus.OPEN,
          proposedQuantity: null,
          proposedPrice: null,
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(),
          expiresAt: null,
        },
      ],
      threads: [],
      groupSessions: [],
      economicStates: [],
      reservationIntents: [],
      orgGeo: new Map(),
      messageCountByThread: new Map(),
      latestMessagesByThread: new Map(),
    };
    const outSponsored = svc.build(snap as never, true, new Set([pid]));
    expect(outSponsored.rows[0]?.sponsorshipAssisted).toBe(true);
    const outPlain = svc.build(snap as never, true, new Set());
    expect(outPlain.rows[0]?.sponsorshipAssisted).toBe(false);
  });
});

describe("Instruction 14A — domain realtime bridge", () => {
  it("publishes DOMAIN_ANALYSIS shaped payloads when anomalies present", async () => {
    const publishOrderAdvDomainSignal = vi.fn(async () => {});
    const publisher = { publishOrderAdvDomainSignal } as unknown as RealtimeDomainEventPublisher;
    const bridge = new OrderAdvDomainRealtimeBridgeService(publisher);
    const snapshot = {
      generatedAt: new Date().toISOString(),
      reservationIntents: [{ id: "x" }],
    };
    const ctx = {
      overview: {
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "ACTIVE" as const,
        activeOrders: 10,
        delayedOrders: 9,
        negotiationIntensity: 0.7,
        groupedBuyingActivity: 0.6,
        reservationPressure: 0.55,
        deliveryTension: 0.6,
        retailerDemandAcceleration: 0.4,
        transactionConfidence: 0.5,
        conversationalCommerceIntensity: 0.4,
        signalStrips: [],
      },
      negotiations: {
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "ACTIVE" as const,
        unstableNegotiations: 6,
        negotiationBursts24h: 12,
        rows: [],
      },
      groupBuying: {
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "ACTIVE" as const,
        activeSessions: 2,
        rows: [
          {
            sessionId: "00000000-0000-0000-0000-000000000001",
            productId: "00000000-0000-0000-0000-000000000002",
            productName: "x",
            status: "OPEN",
            thresholdProgress: 0.1,
            participantCount: 2,
            expiresAt: new Date().toISOString(),
            pressure: 0.5,
            velocityHint: "stalled" as const,
          },
        ],
        dataSource: "GroupBuyingSession_prisma" as const,
      },
      reservations: {
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "ACTIVE" as const,
        rows: [],
      },
      delivery: {
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "ACTIVE" as const,
        urgentDeliveries: 1,
        blockedDeliveries: 1,
        fulfillmentInstability: 0.5,
        rows: [],
      },
    };
    bridge.maybePublishAfterRead("31111111-1111-1111-1111-111111111101", snapshot as never, ctx);
    await vi.waitFor(() => expect(publishOrderAdvDomainSignal).toHaveBeenCalled(), { timeout: 2000 });
    const arg = publishOrderAdvDomainSignal.mock.calls[0]?.[0] as { source?: string; eventType?: string };
    expect(arg.source).toBe("DOMAIN_ANALYSIS");
    expect(arg.eventType).toContain("live.order_adv.");
  });
});
