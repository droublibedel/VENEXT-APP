import { Injectable } from "@nestjs/common";
import type { Shipment } from "@prisma/client";
import { GroupBuyingStatus, OrderStatus, Prisma, ThreadType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { ShipmentOutboundSyncService } from "./shipment-outbound-sync.service";

export type SupplyLogisticsRawSnapshot = {
  organizationId: string;
  generatedAt: string;
  orders: Prisma.OrderGetPayload<{
    select: {
      id: true;
      buyerOrganizationId: true;
      sellerOrganizationId: true;
      relationshipId: true;
      status: true;
      paymentStatus: true;
      deliveryStatus: true;
      createdAt: true;
      updatedAt: true;
    };
  }>[];
  orgGeo: Map<string, string>;
  groupSessions: Prisma.GroupBuyingSessionGetPayload<{
    select: { id: true; initiatorOrganizationId: true; productId: true; status: true; currentQuantity: true; targetQuantity: true };
  }>[];
  economicStates: Prisma.ProductEconomicStateGetPayload<{
    select: { productId: true; stockTensionLevel: true; demandVelocity: true; recentOrderCount: true };
  }>[];
  economicSignals: Prisma.EconomicSignalGetPayload<{
    select: { zoneCode: true; signalType: true; intensityScore: true; createdAt: true };
  }>[];
  deliveryThreadIds: string[];
  deliveryMessageVolume: number;
  /** Instruction 15A — outbound rows for producer org (synced from orders when missing). */
  shipments: Shipment[];
};

@Injectable()
export class SupplyLogisticsDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shipmentSync: ShipmentOutboundSyncService,
  ) {}

  async loadSnapshot(organizationId: string): Promise<SupplyLogisticsRawSnapshot> {
    const orgId = organizationId;
    const since = new Date(Date.now() - 45 * 86400000);
    const generatedAt = new Date().toISOString();

    const [orders, groupSessions, economicStates, economicSignals, deliveryThreads] = await Promise.all([
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
          relationshipId: true,
          status: true,
          paymentStatus: true,
          deliveryStatus: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 650,
      }),
      this.prisma.groupBuyingSession.findMany({
        where: {
          OR: [{ initiatorOrganizationId: orgId }, { product: { organizationId: orgId } }],
          status: GroupBuyingStatus.OPEN,
        },
        select: {
          id: true,
          initiatorOrganizationId: true,
          productId: true,
          status: true,
          currentQuantity: true,
          targetQuantity: true,
        },
        take: 120,
      }),
      this.prisma.productEconomicState.findMany({
        where: { product: { organizationId: orgId } },
        select: { productId: true, stockTensionLevel: true, demandVelocity: true, recentOrderCount: true },
        take: 200,
      }),
      this.prisma.economicSignal.findMany({
        where: {
          createdAt: { gte: since },
          OR: [{ organizationId: orgId }, { product: { organizationId: orgId } }],
        },
        select: { zoneCode: true, signalType: true, intensityScore: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 400,
      }),
      this.prisma.messageThread.findMany({
        where: {
          updatedAt: { gte: since },
          threadType: ThreadType.DELIVERY_CONTEXT,
          OR: [{ buyerOrganizationId: orgId }, { sellerOrganizationId: orgId }],
        },
        select: { id: true },
        take: 200,
      }),
    ]);

    const orgIds = new Set<string>();
    for (const o of orders) {
      orgIds.add(o.buyerOrganizationId);
      orgIds.add(o.sellerOrganizationId);
    }
    for (const g of groupSessions) {
      orgIds.add(g.initiatorOrganizationId);
    }

    const orgs = await this.prisma.organization.findMany({
      where: { id: { in: [...orgIds] } },
      select: { id: true, country: true, city: true },
    });
    const orgGeo = new Map<string, string>();
    for (const o of orgs) {
      orgGeo.set(o.id, `${o.country ?? "?"}/${o.city ?? "?"}`);
    }

    const threadIds = deliveryThreads.map((t) => t.id);
    let deliveryMessageVolume = 0;
    if (threadIds.length) {
      deliveryMessageVolume = await this.prisma.message.count({
        where: { threadId: { in: threadIds }, createdAt: { gte: since } },
      });
    }

    await this.shipmentSync.syncFromOrders(
      orgId,
      orders.map((o) => ({
        id: o.id,
        buyerOrganizationId: o.buyerOrganizationId,
        sellerOrganizationId: o.sellerOrganizationId,
        relationshipId: o.relationshipId,
        status: o.status,
        deliveryStatus: o.deliveryStatus,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
      orgGeo,
    );

    const shipments = await this.prisma.shipment.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      take: 220,
    });

    return {
      organizationId: orgId,
      generatedAt,
      orders,
      orgGeo,
      groupSessions,
      economicStates,
      economicSignals,
      deliveryThreadIds: threadIds,
      deliveryMessageVolume,
      shipments,
    };
  }
}
