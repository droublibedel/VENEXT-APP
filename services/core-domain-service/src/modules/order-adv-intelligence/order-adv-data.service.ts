import { Injectable } from "@nestjs/common";
import {
  GroupBuyingStatus,
  MessageType,
  OrderStatus,
  Prisma,
  ReservationIntentSource,
  ReservationIntentStatus,
  ThreadType,
} from "@prisma/client";
import { isSymbolicConversationReservationIntent } from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";

export type OrderAdvLatestMessage = {
  id: string;
  threadId: string;
  messageType: MessageType;
  structuredEvent: Prisma.JsonValue | null;
  createdAt: Date;
};

/** Narrow thread row for ADV snapshot (product pin without full Product model). */
export type OrderAdvMessageThreadSnap = {
  id: string;
  threadType: ThreadType;
  productId: string | null;
  orderId: string | null;
  negotiationId: string | null;
  buyerOrganizationId: string | null;
  sellerOrganizationId: string | null;
  updatedAt: Date;
  product: { id: string; name: string } | null;
};

export type OrderAdvRawSnapshot = {
  organizationId: string;
  generatedAt: string;
  orders: Prisma.OrderGetPayload<{
    select: {
      id: true;
      buyerOrganizationId: true;
      sellerOrganizationId: true;
      status: true;
      paymentStatus: true;
      deliveryStatus: true;
      totalAmount: true;
      currency: true;
      createdAt: true;
      updatedAt: true;
      relationshipId: true;
      items: {
        take: 80;
        select: {
          quantity: true;
          product: { select: { id: true; name: true } };
        };
      };
    };
  }>[];
  negotiations: Prisma.NegotiationGetPayload<{
    select: {
      id: true;
      productId: true;
      buyerOrganizationId: true;
      sellerOrganizationId: true;
      status: true;
      proposedQuantity: true;
      proposedPrice: true;
      createdAt: true;
      updatedAt: true;
      expiresAt: true;
    };
  }>[];
  threads: OrderAdvMessageThreadSnap[];
  groupSessions: Prisma.GroupBuyingSessionGetPayload<{
    include: {
      product: { select: { id: true; name: true; organizationId: true; currency: true } };
      initiator: { select: { id: true; displayName: true } };
    };
  }>[];
  economicStates: Prisma.ProductEconomicStateGetPayload<{
    select: {
      productId: true;
      stockTensionLevel: true;
      demandVelocity: true;
      negotiationCount: true;
      recentOrderCount: true;
      commercialTemperature: true;
    };
  }>[];
  reservationIntents: Prisma.ReservationIntentGetPayload<{
    select: {
      id: true;
      productId: true;
      orderId: true;
      negotiationId: true;
      status: true;
      source: true;
      requestedQuantity: true;
      reservedQuantity: true;
      expiresAt: true;
      metadata: true;
    };
  }>[];
  orgGeo: Map<string, string>;
  messageCountByThread: Map<string, number>;
  /** Up to 6 most recent messages per thread (commerce signals / structured events). */
  latestMessagesByThread: Map<string, OrderAdvLatestMessage[]>;
};

/**
 * Instruction 14 — single batched load for order/ADV pole (avoids N+1 per surface).
 * Instruction 14A — reservation intents + per-thread message tails for conversational depth.
 */
@Injectable()
export class OrderAdvDataService {
  constructor(private readonly prisma: PrismaService) {}

  async loadSnapshot(organizationId: string): Promise<OrderAdvRawSnapshot> {
    const orgId = organizationId;
    const since = new Date(Date.now() - 45 * 86400000);
    const generatedAt = new Date().toISOString();

    const [orders, negotiations, threads, groupSessions, economicStates, reservationIntentsRaw] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          createdAt: { gte: since },
          OR: [{ buyerOrganizationId: orgId }, { sellerOrganizationId: orgId }],
          status: { not: OrderStatus.CANCELLED },
        },
        select: {
          id: true,
          buyerOrganizationId: true,
          sellerOrganizationId: true,
          status: true,
          paymentStatus: true,
          deliveryStatus: true,
          totalAmount: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
          relationshipId: true,
          items: {
            take: 80,
            select: {
              quantity: true,
              product: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 700,
      }),
      this.prisma.negotiation.findMany({
        where: {
          createdAt: { gte: since },
          OR: [{ buyerOrganizationId: orgId }, { sellerOrganizationId: orgId }],
        },
        select: {
          id: true,
          productId: true,
          buyerOrganizationId: true,
          sellerOrganizationId: true,
          status: true,
          proposedQuantity: true,
          proposedPrice: true,
          createdAt: true,
          updatedAt: true,
          expiresAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 450,
      }),
      this.prisma.messageThread.findMany({
        where: {
          updatedAt: { gte: since },
          OR: [{ buyerOrganizationId: orgId }, { sellerOrganizationId: orgId }],
        },
        select: {
          id: true,
          threadType: true,
          productId: true,
          orderId: true,
          negotiationId: true,
          buyerOrganizationId: true,
          sellerOrganizationId: true,
          updatedAt: true,
          product: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 450,
      }),
      this.prisma.groupBuyingSession.findMany({
        where: {
          OR: [{ initiatorOrganizationId: orgId }, { product: { organizationId: orgId } }],
          status: { in: [GroupBuyingStatus.OPEN, GroupBuyingStatus.COMPLETED, GroupBuyingStatus.CONVERTED_TO_ORDER, GroupBuyingStatus.FAILED] },
        },
        include: {
          product: { select: { id: true, name: true, organizationId: true, currency: true } },
          initiator: { select: { id: true, displayName: true } },
        },
        orderBy: { expiresAt: "asc" },
        take: 150,
      }),
      this.prisma.productEconomicState.findMany({
        where: { product: { organizationId: orgId } },
        select: {
          productId: true,
          stockTensionLevel: true,
          demandVelocity: true,
          negotiationCount: true,
          recentOrderCount: true,
          commercialTemperature: true,
        },
        take: 220,
      }),
      this.prisma.reservationIntent.findMany({
        where: {
          organizationId: orgId,
          status: { in: [ReservationIntentStatus.REQUESTED, ReservationIntentStatus.RESERVED] },
          NOT: { source: ReservationIntentSource.CONVERSATIONAL_SYMBOLIC_DRAFT },
        },
        select: {
          id: true,
          productId: true,
          orderId: true,
          negotiationId: true,
          status: true,
          source: true,
          requestedQuantity: true,
          reservedQuantity: true,
          expiresAt: true,
          metadata: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 220,
      }),
    ]);

    const reservationIntents = reservationIntentsRaw.filter(
      (ri) => !isSymbolicConversationReservationIntent({ source: ri.source, metadata: ri.metadata }),
    );

    const threadIds = threads.map((t) => t.id);
    const messageCountByThread = new Map<string, number>();
    const latestMessagesByThread = new Map<string, OrderAdvLatestMessage[]>();

    if (threadIds.length) {
      const grouped = await this.prisma.message.groupBy({
        by: ["threadId"],
        where: { threadId: { in: threadIds }, createdAt: { gte: since } },
        _count: { id: true },
      });
      for (const g of grouped) {
        messageCountByThread.set(g.threadId, g._count.id);
      }

      const recentMessages = await this.prisma.message.findMany({
        where: { threadId: { in: threadIds }, createdAt: { gte: since } },
        select: {
          id: true,
          threadId: true,
          messageType: true,
          structuredEvent: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 2000,
      });
      for (const m of recentMessages) {
        const arr = latestMessagesByThread.get(m.threadId) ?? [];
        if (arr.length >= 6) continue;
        arr.push({
          id: m.id,
          threadId: m.threadId,
          messageType: m.messageType,
          structuredEvent: m.structuredEvent,
          createdAt: m.createdAt,
        });
        latestMessagesByThread.set(m.threadId, arr);
      }
    }

    const orgIds = new Set<string>();
    for (const o of orders) {
      orgIds.add(o.buyerOrganizationId);
      orgIds.add(o.sellerOrganizationId);
    }
    for (const n of negotiations) {
      orgIds.add(n.buyerOrganizationId);
      orgIds.add(n.sellerOrganizationId);
    }
    for (const t of threads) {
      if (t.buyerOrganizationId) orgIds.add(t.buyerOrganizationId);
      if (t.sellerOrganizationId) orgIds.add(t.sellerOrganizationId);
    }

    const orgs = await this.prisma.organization.findMany({
      where: { id: { in: [...orgIds] } },
      select: { id: true, country: true, city: true, displayName: true },
    });
    const orgGeo = new Map<string, string>();
    for (const o of orgs) {
      orgGeo.set(o.id, `${o.country ?? "?"}/${o.city ?? "?"}`);
    }

    return {
      organizationId: orgId,
      generatedAt,
      orders,
      negotiations,
      threads: threads as OrderAdvMessageThreadSnap[],
      groupSessions,
      economicStates,
      reservationIntents,
      orgGeo,
      messageCountByThread,
      latestMessagesByThread,
    };
  }
}
