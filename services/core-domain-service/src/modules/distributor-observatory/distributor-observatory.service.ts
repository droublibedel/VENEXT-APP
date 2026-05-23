import { Injectable } from "@nestjs/common";
import { OrderStatus, OrganizationCategory, RelationshipStatus } from "@prisma/client";
import type { DistributorObservatoryResponse, DistributorObservatoryRow } from "@venext/shared-contracts";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CommercialNetworkContext,
  isWholesalerCategory,
} from "../commercial-network-intelligence/commercial-network-context.service";

@Injectable()
export class DistributorObservatoryService {
  constructor(private readonly prisma: PrismaService) {}

  async fromContext(ctx: CommercialNetworkContext): Promise<DistributorObservatoryResponse> {
    const orgById = new Map(ctx.partnersPack.counterparties.map((c) => [c.id, c]));
    const accepted = ctx.partnersPack.edges.filter((e) => e.status === RelationshipStatus.ACCEPTED);
    const t30 = new Date(Date.now() - 30 * 86400000);
    const t60 = new Date(Date.now() - 60 * 86400000);
    const orgId = ctx.organizationId;

    const wholesalers = ctx.partnersPack.counterparties.filter((c) => isWholesalerCategory(c.category));

    const rows = await Promise.all(
      wholesalers.map(async (c) => {
        const edge = accepted.find(
          (e) =>
            (e.upstreamOrganizationId === orgId && e.downstreamOrganizationId === c.id) ||
            (e.downstreamOrganizationId === orgId && e.upstreamOrganizationId === c.id),
        );
        const trustLevel = edge?.trustLevel ?? null;
        const wId = c.id;

        const [orderFlow30d, priorOrders30d, negotiations30d, messageThreads30d, sponsoredInteractions30d] =
          await Promise.all([
            this.prisma.order.count({
              where: {
                status: { notIn: [OrderStatus.CANCELLED] },
                createdAt: { gte: t30 },
                OR: [
                  { buyerOrganizationId: wId, sellerOrganizationId: orgId },
                  { buyerOrganizationId: orgId, sellerOrganizationId: wId },
                ],
              },
            }),
            this.prisma.order.count({
              where: {
                status: { notIn: [OrderStatus.CANCELLED] },
                createdAt: { gte: t60, lt: t30 },
                OR: [
                  { buyerOrganizationId: wId, sellerOrganizationId: orgId },
                  { buyerOrganizationId: orgId, sellerOrganizationId: wId },
                ],
              },
            }),
            this.prisma.negotiation.count({
              where: {
                createdAt: { gte: t30 },
                OR: [
                  { AND: [{ buyerOrganizationId: wId }, { sellerOrganizationId: orgId }] },
                  { AND: [{ buyerOrganizationId: orgId }, { sellerOrganizationId: wId }] },
                ],
              },
            }),
            this.prisma.messageThread.count({
              where: {
                createdAt: { gte: t30 },
                OR: [
                  { AND: [{ buyerOrganizationId: wId }, { sellerOrganizationId: orgId }] },
                  { AND: [{ buyerOrganizationId: orgId }, { sellerOrganizationId: wId }] },
                ],
              },
            }),
            this.prisma.sponsoredProductInjection.count({
              where: {
                sponsorOrganizationId: wId,
                createdAt: { gte: t30 },
                active: true,
              },
            }),
          ]);

        const retailerTouches30d = ctx.orders30d.filter(
          (o) =>
            (o.buyerOrganizationId === wId && orgById.get(o.sellerOrganizationId)?.category === OrganizationCategory.RETAILER) ||
            (o.sellerOrganizationId === wId && orgById.get(o.buyerOrganizationId)?.category === OrganizationCategory.RETAILER),
        ).length;

        const growth =
          priorOrders30d === 0 ? (orderFlow30d > 0 ? 2 : 0) : (orderFlow30d - priorOrders30d) / Math.max(1, priorOrders30d);
        const band = pickBand(orderFlow30d, growth, trustLevel, retailerTouches30d);

        return {
          organizationId: c.id,
          displayName: c.displayName ?? c.commercialId ?? c.id,
          category: String(c.category),
          band,
          orderFlow30d,
          priorOrders30d,
          messageThreads30d,
          negotiations30d,
          sponsoredInteractions30d,
          sponsorshipTraction: Math.min(1, sponsoredInteractions30d / 8 + retailerTouches30d / 12),
          retailerEngagement: Math.min(1, retailerTouches30d / 10),
          trustLevel,
        } satisfies DistributorObservatoryRow;
      }),
    );

    rows.sort((a, b) => b.orderFlow30d - a.orderFlow30d);

    return {
      generatedAt: ctx.generatedAt,
      organizationId: ctx.organizationId,
      rows: rows.slice(0, 40),
    };
  }
}

function pickBand(
  flow: number,
  growth: number,
  trust: number | null,
  retailTouch: number,
): DistributorObservatoryRow["band"] {
  if (trust != null && trust < 0.35) return "unstable";
  if (flow === 0 && retailTouch === 0) return "inactive";
  if (growth > 0.35) return "high_growth";
  if (flow > 6 && retailTouch < 2) return "weak_conversion";
  if (flow >= 8) return "strongest";
  if (flow < 3) return "low_activity";
  return "strongest";
}
