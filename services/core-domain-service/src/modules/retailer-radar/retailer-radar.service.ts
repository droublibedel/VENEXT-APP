import { Injectable } from "@nestjs/common";
import { OrganizationCategory, RelationshipStatus } from "@prisma/client";
import type { GroupBuyingSignals, RetailerRadarResponse, RetailerRadarRow } from "@venext/shared-contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { CommercialNetworkContext } from "../commercial-network-intelligence/commercial-network-context.service";

@Injectable()
export class RetailerRadarService {
  constructor(private readonly prisma: PrismaService) {}

  async fromContext(ctx: CommercialNetworkContext, enabled: boolean): Promise<RetailerRadarResponse> {
    if (!enabled) {
      return {
        generatedAt: ctx.generatedAt,
        organizationId: ctx.organizationId,
        policy: "DISABLED",
        rows: [],
      };
    }

    const orgId = ctx.organizationId;
    const t30 = new Date(Date.now() - 30 * 86400000);
    const accepted = ctx.partnersPack.edges.filter((e) => e.status === RelationshipStatus.ACCEPTED);
    const networkIds = new Set<string>([orgId, ...ctx.partnersPack.counterparties.map((c) => c.id)]);

    const relIds = ctx.relationships
      .filter((r) => r.status === RelationshipStatus.ACCEPTED && r.id)
      .map((r) => r.id)
      .filter(Boolean) as string[];

    const [relationshipScopedSessions30d, sessions30d] = await Promise.all([
      relIds.length
        ? this.prisma.groupBuyingSession.count({
            where: {
              createdAt: { gte: t30 },
              relationshipId: { in: relIds },
            },
          })
        : Promise.resolve(0),
      this.prisma.groupBuyingSession.count({
        where: {
          createdAt: { gte: t30 },
          OR: [
            { initiatorOrganizationId: orgId },
            { initiatorOrganizationId: { in: ctx.partnersPack.counterparties.filter((c) => c.category === OrganizationCategory.RETAILER).map((c) => c.id) } },
          ],
        },
      }),
    ]);

    const groupBuyingSignals: GroupBuyingSignals = {
      available: true,
      sessions30d,
      relationshipScopedSessions30d,
    };

    const retailers = ctx.partnersPack.counterparties.filter((c) => c.category === OrganizationCategory.RETAILER);
    const regionCounts = new Map<string, number>();
    for (const r of retailers) {
      const k = [r.country ?? "?", r.city ?? "?"].join("/");
      regionCounts.set(k, (regionCounts.get(k) ?? 0) + 1);
    }

    const rows: RetailerRadarRow[] = [];

    for (const c of retailers) {
      const edge = accepted.find(
        (e) =>
          (e.upstreamOrganizationId === orgId && e.downstreamOrganizationId === c.id) ||
          (e.downstreamOrganizationId === orgId && e.upstreamOrganizationId === c.id),
      );

      const relatedOrders30 = ctx.orders30d.filter(
        (o) => o.buyerOrganizationId === c.id || o.sellerOrganizationId === c.id,
      ).length;
      const relatedOrdersPrev = ctx.ordersPrev30d.filter(
        (o) => o.buyerOrganizationId === c.id || o.sellerOrganizationId === c.id,
      ).length;

      const peers = [...networkIds].filter((id) => id !== c.id);
      const [negotiations30dRetailer, gbSessions] = await Promise.all([
        this.prisma.negotiation.count({
          where: {
            createdAt: { gte: t30 },
            OR: [
              { buyerOrganizationId: c.id, sellerOrganizationId: { in: peers } },
              { sellerOrganizationId: c.id, buyerOrganizationId: { in: peers } },
            ],
          },
        }),
        this.prisma.groupBuyingSession.count({
          where: { initiatorOrganizationId: c.id, createdAt: { gte: t30 } },
        }),
      ]);

      const velocity =
        relatedOrdersPrev === 0 ? (relatedOrders30 > 0 ? 1.2 : 0.1) : (relatedOrders30 - relatedOrdersPrev) / Math.max(1, relatedOrdersPrev);
      const trustBoost = edge ? edge.trustLevel * 0.2 : 0;
      const negotiationNorm = Math.min(1, negotiations30dRetailer / 12);
      const velocityScore = Math.min(
        1,
        Math.max(0, 0.28 + velocity * 0.45 + trustBoost + negotiationNorm * 0.12 + (gbSessions > 0 ? 0.06 : 0)),
      );

      const rk = [c.country ?? "?", c.city ?? "?"].join("/");
      const clusterPressure = (regionCounts.get(rk) ?? 0) >= 3;

      const segment = pickSegment({
        velocity,
        orders30: relatedOrders30,
        city: c.city,
        category: String(c.category ?? ""),
        clusterPressure,
        gbSessions,
      });

      rows.push({
        organizationId: c.id,
        displayName: c.displayName ?? c.commercialId ?? c.id,
        segment,
        velocityScore: Number(velocityScore.toFixed(3)),
        negotiationFrequency: negotiationNorm,
        catalogTouches: Math.min(1, relatedOrders30 / 10),
        regionKey: rk,
        category: String(c.category),
      });
    }

    rows.sort((a, b) => b.velocityScore - a.velocityScore);

    const segmentSummary = {
      active: rows.filter((r) => r.segment !== "inactive").length,
      inactive: rows.filter((r) => r.segment === "inactive").length,
      rising: rows.filter((r) => r.segment === "rising").length,
      regionalPressure: rows.filter((r) => r.segment === "regional_pressure").length,
      other: rows.filter((r) => !["inactive", "rising", "regional_pressure"].includes(r.segment)).length,
    };

    return {
      generatedAt: ctx.generatedAt,
      organizationId: ctx.organizationId,
      segmentSummary,
      groupBuyingSignals,
      rows: rows.slice(0, 50),
    };
  }
}

function pickSegment(input: {
  velocity: number;
  orders30: number;
  city: string | null;
  category: string;
  clusterPressure: boolean;
  gbSessions: number;
}): RetailerRadarRow["segment"] {
  if (input.orders30 === 0) return "inactive";
  if (input.velocity > 0.4) return "rising";
  if (input.clusterPressure) return "cluster_core";
  if ((input.city ?? "").toLowerCase().includes("dakar")) return "regional_pressure";
  if (input.gbSessions > 0) return "high_demand_zone";
  if (input.category.toLowerCase().includes("retail")) return "cluster_core";
  if (input.orders30 > 5) return "high_demand_zone";
  return "category_hot";
}
