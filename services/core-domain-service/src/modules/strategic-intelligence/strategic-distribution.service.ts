import { Injectable } from "@nestjs/common";
import { OrganizationCategory, RelationshipStatus } from "@prisma/client";

function isWholesaler(cat: OrganizationCategory): boolean {
  return cat === OrganizationCategory.WHOLESALER_A || cat === OrganizationCategory.WHOLESALER_B;
}
import { PrismaService } from "../../prisma/prisma.service";
import { orderWhereOrgParticipates, relationshipWhereOrgParticipates } from "./strategic-org-scope";

@Injectable()
export class StrategicDistributionService {
  constructor(private readonly prisma: PrismaService) {}

  async network(organizationId: string) {
    const relWhere = relationshipWhereOrgParticipates(organizationId);
    const rels = await this.prisma.relationship.findMany({
      where: { ...relWhere, status: RelationshipStatus.ACCEPTED },
      select: {
        id: true,
        trustLevel: true,
        commerceCategory: true,
        upstreamOrganizationId: true,
        downstreamOrganizationId: true,
      },
      take: 200,
    });

    const ids = [
      ...new Set(rels.flatMap((r) => [r.upstreamOrganizationId, r.downstreamOrganizationId].filter(Boolean) as string[])),
    ].filter((id) => id !== organizationId);

    const orgs =
      ids.length > 0
        ? await this.prisma.organization.findMany({
            where: { id: { in: ids } },
            select: {
              id: true,
              displayName: true,
              category: true,
              city: true,
              country: true,
              commune: true,
              credibilityScore: true,
            },
          })
        : [];

    const orders45 = await this.prisma.order.findMany({
      where: {
        ...orderWhereOrgParticipates(organizationId),
        createdAt: { gte: new Date(Date.now() - 45 * 86400_000) },
      },
      select: { sellerOrganizationId: true, buyerOrganizationId: true },
      take: 300,
    });

    const orderIntensity = new Map<string, number>();
    for (const o of orders45) {
      const counter = o.buyerOrganizationId === organizationId ? o.sellerOrganizationId : o.buyerOrganizationId;
      orderIntensity.set(counter, (orderIntensity.get(counter) ?? 0) + 1);
    }

    const wholesalers = orgs.filter((o) => isWholesaler(o.category));
    const retailers = orgs.filter((o) => o.category === OrganizationCategory.RETAILER);

    const scoredWholesalers = wholesalers.map((w) => ({
      organizationId: w.id,
      label: w.displayName,
      category: w.category,
      geography: `${w.city}/${w.country}`,
      edgeStrength: Number(
        (
          (rels.filter((r) => r.upstreamOrganizationId === w.id || r.downstreamOrganizationId === w.id).length /
            Math.max(1, rels.length)) *
          0.55 +
          (orderIntensity.get(w.id) ?? 0) * 0.08 +
          w.credibilityScore * 0.25
        ).toFixed(4),
      ),
      trustMedian: Number(w.credibilityScore.toFixed(3)),
      instability:
        rels.filter((r) => r.upstreamOrganizationId === w.id || r.downstreamOrganizationId === w.id).length < 2 ||
        w.credibilityScore < 0.48,
    }));

    scoredWholesalers.sort((a, b) => b.edgeStrength - a.edgeStrength);

    const unstableWholesalers = scoredWholesalers.filter((w) => w.instability).slice(0, 8);

    const retailerRegions = retailers.reduce(
      (acc, r) => {
        const k = `${r.country}/${r.city}`;
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const weakRetailerRegions = Object.entries(retailerRegions)
      .filter(([, n]) => n <= 2)
      .map(([region]) => ({ region, retailerNodes: retailerRegions[region] ?? 0 }));

    const concentration = scoredWholesalers[0]
      ? Number(
          (
            scoredWholesalers[0]!.edgeStrength /
            Math.max(1e-6, scoredWholesalers.reduce((s, x) => s + x.edgeStrength, 0))
          ).toFixed(4),
        )
      : 0;

    const highGrowth = scoredWholesalers.filter((w) => !w.instability && w.edgeStrength > 0.42).slice(0, 6);

    const inactivePartners = orgs
      .filter((o) => (orderIntensity.get(o.id) ?? 0) === 0 && isWholesaler(o.category))
      .slice(0, 8)
      .map((o) => ({ id: o.id, label: o.displayName, reason: "No recent order co-occurrence in window." }));

    return {
      strongestWholesalers: scoredWholesalers.slice(0, 8),
      unstableWholesalers,
      weakRetailerRegions,
      networkConcentration: concentration,
      relationshipDependency: Number((1 - concentration).toFixed(4)),
      highGrowthPartners: highGrowth,
      inactivePartners,
      supplyFragility:
        unstableWholesalers.length >= 3 || concentration > 0.58
          ? "HIGH"
          : unstableWholesalers.length >= 1
            ? "MODERATE"
            : "CONTROLLED",
      segmentation: {
        geography: ["country/city", "commune"],
        category: ["WHOLESALER_A", "WHOLESALER_B", "RETAILER"],
        confidence: "credibility-weighted edge strength + recent order co-occurrence",
      },
    };
  }
}
