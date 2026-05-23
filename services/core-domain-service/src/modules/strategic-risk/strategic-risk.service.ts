import { Injectable } from "@nestjs/common";
import { OrganizationCategory, RelationshipStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { orderWhereOrgParticipates, relationshipWhereOrgParticipates } from "../strategic-intelligence/strategic-org-scope";

export type StrategicRiskSeverity = "LOW" | "MEDIUM" | "HIGH";

@Injectable()
export class StrategicRiskService {
  constructor(private readonly prisma: PrismaService) {}

  async matrix(organizationId: string) {
    const relWhere = relationshipWhereOrgParticipates(organizationId);
    const accepted = await this.prisma.relationship.findMany({
      where: { ...relWhere, status: RelationshipStatus.ACCEPTED },
      select: {
        id: true,
        downstreamOrganizationId: true,
        upstreamOrganizationId: true,
        commerceCategory: true,
      },
      take: 200,
    });

    const partnerIds = [
      ...new Set(
        accepted.flatMap((r) => [r.upstreamOrganizationId, r.downstreamOrganizationId].filter(Boolean) as string[]),
      ),
    ].filter((id) => id !== organizationId);

    const orders = await this.prisma.order.findMany({
      where: { ...orderWhereOrgParticipates(organizationId), createdAt: { gte: new Date(Date.now() - 45 * 86400_000) } },
      select: { sellerOrganizationId: true, buyerOrganizationId: true, totalAmount: true },
      take: 400,
    });

    const volumeBySeller = new Map<string, number>();
    for (const o of orders) {
      const sid = o.sellerOrganizationId;
      const amt = Number(o.totalAmount);
      volumeBySeller.set(sid, (volumeBySeller.get(sid) ?? 0) + amt);
    }
    const totalVol = [...volumeBySeller.values()].reduce((a, b) => a + b, 0) || 1;
    const shares = [...volumeBySeller.entries()].map(([id, v]) => ({ id, share: v / totalVol }));
    shares.sort((a, b) => b.share - a.share);
    const topShare = shares[0]?.share ?? 0;

    const risks: {
      riskType: string;
      severity: StrategicRiskSeverity;
      affectedEntities: string[];
      estimatedImpact: string;
      recommendedAction: string;
    }[] = [];

    if (topShare > 0.55 && shares[0]) {
      const org = await this.prisma.organization.findUnique({
        where: { id: shares[0].id },
        select: { displayName: true },
      });
      risks.push({
        riskType: "WHOLESALER_CONCENTRATION",
        severity: "HIGH",
        affectedEntities: [org?.displayName ?? shares[0].id],
        estimatedImpact: `${Math.round(topShare * 100)}% of outbound/inbound order value concentrated with one counterparty edge.`,
        recommendedAction: "Rebalance corridor mix — qualify alternate wholesalers and staged allocation shifts.",
      });
    }

    const byCity =
      partnerIds.length > 0
        ? await this.prisma.organization.groupBy({
            by: ["city"],
            where: { id: { in: partnerIds } },
            _count: { id: true },
          })
        : [];
    const topCity = byCity.sort((a, b) => b._count.id - a._count.id)[0];
    if (topCity && partnerIds.length > 6 && topCity._count.id / partnerIds.length > 0.45) {
      risks.push({
        riskType: "REGIONAL_OVERDEPENDENCY",
        severity: "MEDIUM",
        affectedEntities: [topCity.city],
        estimatedImpact: "Partner density skewed to a single metropolitan basin — disruption amplifies.",
        recommendedAction: "Expand verified retailers in adjacent communes to diversify absorption.",
      });
    }

    const weakCategories = await this.prisma.product.groupBy({
      by: ["category"],
      where: { organizationId, active: true },
      _count: { id: true },
      orderBy: { _count: { id: "asc" } },
      take: 3,
    });
    if (weakCategories[0] && weakCategories[0]._count.id <= 2) {
      risks.push({
        riskType: "FRAGILE_CATEGORY_MIX",
        severity: "LOW",
        affectedEntities: [weakCategories[0].category],
        estimatedImpact: "Thin SKU depth in category increases substitution risk during shocks.",
        recommendedAction: "Fortify catalog breadth or tighten exclusivity on strategic SKUs.",
      });
    }

    const inactivePartners =
      partnerIds.length > 0
        ? await this.prisma.organization.count({
            where: {
              id: { in: partnerIds },
              category: { in: [OrganizationCategory.WHOLESALER_A, OrganizationCategory.WHOLESALER_B] },
              credibilityScore: { lt: 0.42 },
            },
          })
        : 0;
    if (inactivePartners >= 3) {
      risks.push({
        riskType: "LOW_TRUST_PARTNER_CLUSTER",
        severity: "MEDIUM",
        affectedEntities: partnerIds.slice(0, 6),
        estimatedImpact: "Several wholesale edges exhibit credibility decay vs network average.",
        recommendedAction: "Governance review — verification uplift or edge suspension.",
      });
    }

    const growthEdges = accepted.length;
    if (growthEdges < 4) {
      risks.push({
        riskType: "WEAK_RELATIONSHIP_GROWTH",
        severity: "MEDIUM",
        affectedEntities: [organizationId],
        estimatedImpact: "Accepted industrial graph thinner than typical producer baseline.",
        recommendedAction: "Accelerate relationship onboarding in high-opportunity territories.",
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      concentration: {
        topCounterpartyShare: Number(topShare.toFixed(4)),
        partnerOrganizations: partnerIds.length,
      },
      risks,
    };
  }
}
