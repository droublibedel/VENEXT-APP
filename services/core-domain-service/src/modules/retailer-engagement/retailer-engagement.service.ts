import { Injectable } from "@nestjs/common";
import { OrderStatus, OrganizationCategory } from "@prisma/client";
import type { RetailerEngagementObservatoryResponse, RetailerEngagementRow } from "@venext/shared-contracts";
import { PrismaService } from "../../prisma/prisma.service";
import type { CommercialNetworkContext } from "../commercial-network-intelligence/commercial-network-context.service";
import type { SponsoredInjectionListSnapshot } from "../sponsorship-pressure/sponsorship-pressure.service";

/** Instruction 13A — BATCHED_FINDMANY_V1: bounded `findMany` queries + in-memory maps per retailer (no per-retailer Prisma loop). */
@Injectable()
export class RetailerEngagementService {
  constructor(private readonly prisma: PrismaService) {}

  async fromContext(
    ctx: CommercialNetworkContext,
    snapshot: SponsoredInjectionListSnapshot | null,
    enabled: boolean,
  ): Promise<RetailerEngagementObservatoryResponse> {
    const orgId = ctx.organizationId;
    if (!enabled) {
      return {
        generatedAt: ctx.generatedAt,
        organizationId: orgId,
        policy: "DISABLED",
        segmentCounts: { highlyEngaged: 0, weaklyEngaged: 0, dormant: 0, activationSensitive: 0, sponsorReactive: 0 },
        rows: [],
      };
    }

    const t30 = new Date(Date.now() - 30 * 86400000);
    const retailers = ctx.partnersPack.counterparties.filter((c) => c.category === OrganizationCategory.RETAILER);
    const retailerIds = retailers.map((r) => r.id);
    const sponsoredSkus = new Set(snapshot?.items.map((i) => i.product.id) ?? []);

    if (retailerIds.length === 0) {
      return {
        generatedAt: ctx.generatedAt,
        organizationId: orgId,
        policy: "ACTIVE",
        aggregationStrategy: "BATCHED_FINDMANY_V1",
        segmentCounts: { highlyEngaged: 0, weaklyEngaged: 0, dormant: 0, activationSensitive: 0, sponsorReactive: 0 },
        rows: [],
      };
    }

    const [ordersRaw, negsRaw, threadsRaw, sponsoredOrderItemsRaw, allOrderItemsRaw] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          status: { notIn: [OrderStatus.CANCELLED] },
          createdAt: { gte: t30 },
          OR: [
            { sellerOrganizationId: orgId, buyerOrganizationId: { in: retailerIds } },
            { buyerOrganizationId: orgId, sellerOrganizationId: { in: retailerIds } },
          ],
        },
        select: { buyerOrganizationId: true, sellerOrganizationId: true },
        take: 15000,
      }),
      this.prisma.negotiation.findMany({
        where: {
          createdAt: { gte: t30 },
          OR: [
            { sellerOrganizationId: orgId, buyerOrganizationId: { in: retailerIds } },
            { buyerOrganizationId: orgId, sellerOrganizationId: { in: retailerIds } },
          ],
        },
        select: { buyerOrganizationId: true, sellerOrganizationId: true },
        take: 15000,
      }),
      this.prisma.messageThread.findMany({
        where: {
          createdAt: { gte: t30 },
          OR: [
            { sellerOrganizationId: orgId, buyerOrganizationId: { in: retailerIds } },
            { buyerOrganizationId: orgId, sellerOrganizationId: { in: retailerIds } },
          ],
        },
        select: { buyerOrganizationId: true, sellerOrganizationId: true },
        take: 15000,
      }),
      sponsoredSkus.size === 0
        ? Promise.resolve([] as { order: { buyerOrganizationId: string | null } }[])
        : this.prisma.orderItem.findMany({
            where: {
              productId: { in: [...sponsoredSkus] },
              order: {
                sellerOrganizationId: orgId,
                buyerOrganizationId: { in: retailerIds },
                createdAt: { gte: t30 },
                status: { notIn: [OrderStatus.CANCELLED] },
              },
            },
            select: { order: { select: { buyerOrganizationId: true } } },
            take: 12000,
          }),
      this.prisma.orderItem.findMany({
        where: {
          order: {
            sellerOrganizationId: orgId,
            buyerOrganizationId: { in: retailerIds },
            createdAt: { gte: t30 },
            status: { notIn: [OrderStatus.CANCELLED] },
          },
        },
        select: { order: { select: { buyerOrganizationId: true } } },
        take: 12000,
      }),
    ]);

    const ordersByRetailer = new Map<string, number>();
    for (const o of ordersRaw) {
      const counterparty = o.sellerOrganizationId === orgId ? o.buyerOrganizationId : o.sellerOrganizationId;
      if (!retailerIds.includes(counterparty)) continue;
      ordersByRetailer.set(counterparty, (ordersByRetailer.get(counterparty) ?? 0) + 1);
    }

    const negsByRetailer = new Map<string, number>();
    for (const n of negsRaw) {
      const counterparty = n.sellerOrganizationId === orgId ? n.buyerOrganizationId : n.sellerOrganizationId;
      if (!retailerIds.includes(counterparty)) continue;
      negsByRetailer.set(counterparty, (negsByRetailer.get(counterparty) ?? 0) + 1);
    }

    const threadsByRetailer = new Map<string, number>();
    for (const t of threadsRaw) {
      const buyer = t.buyerOrganizationId;
      const seller = t.sellerOrganizationId;
      const counterparty =
        seller === orgId && buyer && retailerIds.includes(buyer)
          ? buyer
          : buyer === orgId && seller && retailerIds.includes(seller)
            ? seller
            : null;
      if (!counterparty) continue;
      threadsByRetailer.set(counterparty, (threadsByRetailer.get(counterparty) ?? 0) + 1);
    }

    const productInteractionByRetailer = new Map<string, number>();
    for (const it of allOrderItemsRaw) {
      const b = it.order.buyerOrganizationId;
      if (!b || !retailerIds.includes(b)) continue;
      productInteractionByRetailer.set(b, (productInteractionByRetailer.get(b) ?? 0) + 1);
    }

    const sponsoredInteractionByRetailer = new Map<string, number>();
    for (const it of sponsoredOrderItemsRaw) {
      const b = it.order.buyerOrganizationId;
      if (!b || !retailerIds.includes(b)) continue;
      sponsoredInteractionByRetailer.set(b, (sponsoredInteractionByRetailer.get(b) ?? 0) + 1);
    }

    const rows: RetailerEngagementRow[] = [];
    let highlyEngaged = 0;
    let weaklyEngaged = 0;
    let dormant = 0;
    let activationSensitive = 0;
    let sponsorReactive = 0;

    for (const r of retailers) {
      const orders30 = ordersByRetailer.get(r.id) ?? 0;
      const negs = negsByRetailer.get(r.id) ?? 0;
      const threads = threadsByRetailer.get(r.id) ?? 0;
      const productInteractionCount = productInteractionByRetailer.get(r.id) ?? 0;
      const sponsoredInteractionCount = sponsoredInteractionByRetailer.get(r.id) ?? 0;

      const engagementScore = Number(
        Math.min(1, orders30 / 8 + threads / 15 + negs / 10 + productInteractionCount / 40).toFixed(3),
      );
      const activationSensitivity = Number(Math.min(1, negs / Math.max(1, orders30 + 1)).toFixed(3));
      const sponsorshipReactivity = sponsoredSkus.size
        ? Number(Math.min(1, sponsoredInteractionCount / Math.max(1, orders30 + 1)).toFixed(3))
        : 0;

      let cluster: RetailerEngagementRow["cluster"] = "mixed";
      if (engagementScore > 0.55) {
        cluster = "high";
        highlyEngaged += 1;
      } else if (engagementScore < 0.08) {
        cluster = "dormant";
        dormant += 1;
      } else if (engagementScore < 0.28) {
        cluster = "weak";
        weaklyEngaged += 1;
      } else if (activationSensitivity > 0.45) {
        cluster = "sensitive";
        activationSensitive += 1;
      } else if (sponsorshipReactivity > 0.35) {
        cluster = "sponsor_reactive";
        sponsorReactive += 1;
      } else {
        weaklyEngaged += 1;
      }

      rows.push({
        organizationId: r.id,
        displayName: r.displayName,
        engagementScore,
        activationSensitivity,
        sponsorshipReactivity,
        cluster,
        regionKey: `${r.country ?? "?"}/${r.city ?? "?"}`,
      });
    }

    rows.sort((a, b) => b.engagementScore - a.engagementScore);

    return {
      generatedAt: ctx.generatedAt,
      organizationId: orgId,
      policy: "ACTIVE",
      aggregationStrategy: "BATCHED_FINDMANY_V1",
      segmentCounts: {
        highlyEngaged,
        weaklyEngaged,
        dormant,
        activationSensitive,
        sponsorReactive,
      },
      rows: rows.slice(0, 48),
    };
  }
}
