import { Injectable } from "@nestjs/common";
import { OrganizationCategory, RelationshipStatus } from "@prisma/client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { relationshipWhereOrgParticipates } from "../strategic-intelligence/strategic-org-scope";

export type TerritoryMapMode = "opportunity" | "risk" | "sponsorship" | "network" | "signal";

@Injectable()
export class TerritoryOpportunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async territoryMap(organizationId: string, mode: TerritoryMapMode = "opportunity") {
    if (!(await this.flags.isEnabled("territory_map_enabled", { organizationId }))) {
      return {
        policy: "DISABLED" as const,
        mode,
        cells: [] as Record<string, unknown>[],
        legend: "Territory map disabled by policy.",
      };
    }

    const relWhere = relationshipWhereOrgParticipates(organizationId);
    const rels = await this.prisma.relationship.findMany({
      where: { ...relWhere, status: RelationshipStatus.ACCEPTED },
      select: {
        id: true,
        commerceCategory: true,
        upstreamOrganizationId: true,
        downstreamOrganizationId: true,
      },
      take: 120,
    });

    const orgIds = [
      ...new Set(
        rels.flatMap((r) => [r.upstreamOrganizationId, r.downstreamOrganizationId].filter(Boolean) as string[]),
      ),
    ];
    if (!orgIds.includes(organizationId)) orgIds.push(organizationId);

    const orgs = await this.prisma.organization.findMany({
      where: { id: { in: orgIds } },
      select: {
        id: true,
        displayName: true,
        category: true,
        city: true,
        country: true,
        commune: true,
        credibilityScore: true,
      },
    });
    const signalsByZone = await this.prisma.economicSignal.groupBy({
      by: ["zoneCode"],
      where: { organizationId, zoneCode: { not: null } },
      _avg: { intensityScore: true },
      _count: { id: true },
    });

    const cells = orgs.map((o) => {
      const territoryKey = [o.commune || o.city, o.country].filter(Boolean).join(" · ") || o.city;
      const edgeCount = rels.filter(
        (r) => r.upstreamOrganizationId === o.id || r.downstreamOrganizationId === o.id,
      ).length;
      const zoneSig = signalsByZone.find((z) => z.zoneCode && o.city && String(z.zoneCode).includes(o.city.slice(0, 4)));
      return this.cellShape(o, territoryKey, edgeCount, zoneSig, mode);
    });

    /** Sort by mode heuristic */
    cells.sort((a, b) => {
      if (mode === "risk") return (b.riskHeat ?? 0) - (a.riskHeat ?? 0);
      if (mode === "signal") return (b.signalDensity ?? 0) - (a.signalDensity ?? 0);
      if (mode === "sponsorship") return (b.sponsorshipRelevance ?? 0) - (a.sponsorshipRelevance ?? 0);
      if (mode === "network") return (b.relationshipGrowth ?? 0) - (a.relationshipGrowth ?? 0);
      return (b.opportunityHeat ?? 0) - (a.opportunityHeat ?? 0);
    });

    return {
      policy: "ACTIVE" as const,
      mode,
      cells: cells.slice(0, 48),
      legend:
        "Operational lattice — density encodes industrial posture (not consumer navigation). Palantir-style staging without consumer map chrome.",
      controls: ["opportunity", "risk", "sponsorship", "network", "signal"] as TerritoryMapMode[],
    };
  }

  private cellShape(
    o: {
      id: string;
      displayName: string;
      category: OrganizationCategory;
      city: string;
      country: string;
      credibilityScore: number;
    },
    territoryKey: string,
    edgeCount: number,
    zoneSig: { _avg: { intensityScore: number | null }; _count: { id: number } } | undefined,
    mode: TerritoryMapMode,
  ) {
    const retailerGrowth = o.category === OrganizationCategory.RETAILER ? Math.min(1, edgeCount / 10 + o.credibilityScore * 0.25) : edgeCount / 14;
    const logisticsPressure = o.country === "SN" && o.city.toLowerCase().includes("dakar") ? 0.62 : 0.35 + edgeCount * 0.02;
    const signalDensity = zoneSig ? Math.min(1, (zoneSig._avg.intensityScore ?? 0.4) * 0.45 + zoneSig._count.id * 0.08) : edgeCount * 0.06;
    const opportunityHeat = Number(
      (retailerGrowth * 0.42 + o.credibilityScore * 0.28 + signalDensity * 0.3).toFixed(3),
    );
    const riskHeat = Number((logisticsPressure * 0.55 + (1 - o.credibilityScore) * 0.35).toFixed(3));
    const sponsorshipRelevance =
      o.category === OrganizationCategory.WHOLESALER_A || o.category === OrganizationCategory.WHOLESALER_B
        ? 0.55 + edgeCount * 0.03
        : 0.25 + signalDensity;

    return {
      territoryKey,
      entityId: o.id,
      label: o.displayName,
      category: o.category,
      opportunityHeat,
      distributionDensity: Number(Math.min(1, edgeCount / 12).toFixed(3)),
      retailerGrowth: Number(retailerGrowth.toFixed(3)),
      partnerQuality: Number(o.credibilityScore.toFixed(3)),
      relationshipGrowth: Number(Math.min(1, edgeCount / 15).toFixed(3)),
      regionalWeakness: Number((1 - o.credibilityScore).toFixed(3)),
      logisticsPressure: Number(logisticsPressure.toFixed(3)),
      signalDensity: Number(signalDensity.toFixed(3)),
      riskHeat,
      sponsorshipRelevance: Number(Math.min(1, sponsorshipRelevance).toFixed(3)),
      activeModeSignal:
        mode === "opportunity"
          ? opportunityHeat
          : mode === "risk"
            ? riskHeat
            : mode === "sponsorship"
              ? sponsorshipRelevance
              : mode === "network"
                ? retailerGrowth
                : signalDensity,
    };
  }
}
