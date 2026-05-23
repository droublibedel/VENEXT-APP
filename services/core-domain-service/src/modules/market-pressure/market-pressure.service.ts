import { Injectable } from "@nestjs/common";
import { EconomicSignalType, RelationshipStatus } from "@prisma/client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { orderWhereOrgParticipates, relationshipWhereOrgParticipates } from "../strategic-intelligence/strategic-org-scope";

export type MarketPressureBand = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

@Injectable()
export class MarketPressureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async snapshot(organizationId: string) {
    if (!(await this.flags.isEnabled("market_pressure_enabled", { organizationId }))) {
      return {
        policy: "DISABLED" as const,
        headline: "Market pressure telemetry disabled by policy.",
        band: "LOW" as MarketPressureBand,
        confidence: 0,
        impactedRegions: [] as string[],
        impactedProductCategories: [] as string[],
        probableCauses: [] as string[],
        drivers: [] as { code: string; detail: string; deltaHint: string }[],
      };
    }

    const now = Date.now();
    const d7 = new Date(now - 7 * 86400_000);
    const d14 = new Date(now - 14 * 86400_000);

    const relWhere = relationshipWhereOrgParticipates(organizationId);
    const orderWhere = orderWhereOrgParticipates(organizationId);

    const [orders7, ordersPrev7, sig7, sigPrev7, neg7, negPrev7, msg7, msgPrev7, sponsoredActive, stockTension] =
      await Promise.all([
        this.prisma.order.count({ where: { ...orderWhere, createdAt: { gte: d7 } } }),
        this.prisma.order.count({
          where: { ...orderWhere, createdAt: { gte: d14, lt: d7 } },
        }),
        this.prisma.economicSignal.count({
          where: { organizationId, createdAt: { gte: d7 } },
        }),
        this.prisma.economicSignal.count({
          where: { organizationId, createdAt: { gte: d14, lt: d7 } },
        }),
        this.prisma.negotiation.count({
          where: {
            OR: [{ buyerOrganizationId: organizationId }, { sellerOrganizationId: organizationId }],
            createdAt: { gte: d7 },
          },
        }),
        this.prisma.negotiation.count({
          where: {
            OR: [{ buyerOrganizationId: organizationId }, { sellerOrganizationId: organizationId }],
            createdAt: { gte: d14, lt: d7 },
          },
        }),
        this.prisma.message.count({
          where: { senderOrganizationId: organizationId, createdAt: { gte: d7 } },
        }),
        this.prisma.message.count({
          where: { senderOrganizationId: organizationId, createdAt: { gte: d14, lt: d7 } },
        }),
        this.prisma.sponsoredProductInjection.count({
          where: { sponsorOrganizationId: organizationId, active: true },
        }),
        this.prisma.economicSignal.count({
          where: {
            organizationId,
            signalType: EconomicSignalType.STOCK_TENSION,
            createdAt: { gte: d7 },
          },
        }),
      ]);

    const pendingRel = await this.prisma.relationship.count({
      where: { ...relWhere, status: RelationshipStatus.PENDING },
    });

    const ratio = (a: number, b: number) => (b <= 0 ? a : a / b);

    const orderSpike = ratio(orders7, Math.max(1, ordersPrev7));
    const sigSpike = ratio(sig7, Math.max(1, sigPrev7));
    const negSpike = ratio(neg7, Math.max(1, negPrev7));
    const msgSpike = ratio(msg7, Math.max(1, msgPrev7));

    const drivers: { code: string; detail: string; deltaHint: string }[] = [];
    if (orderSpike > 1.35) drivers.push({ code: "ORDER_BURST", detail: "Order cadence elevated vs prior window.", deltaHint: `${orderSpike.toFixed(2)}×` });
    if (sigSpike > 1.45) drivers.push({ code: "SIGNAL_DENSITY", detail: "Economic signal density increased.", deltaHint: `${sigSpike.toFixed(2)}×` });
    if (negSpike > 1.4) drivers.push({ code: "NEGOTIATION_SURGE", detail: "Negotiation threads accelerating.", deltaHint: `${negSpike.toFixed(2)}×` });
    if (msgSpike > 1.5) drivers.push({ code: "MESSAGE_VELOCITY", detail: "Commerce message velocity abnormal.", deltaHint: `${msgSpike.toFixed(2)}×` });
    if (stockTension >= 3) drivers.push({ code: "STOCK_TENSION", detail: "Stock tension signals clustering.", deltaHint: String(stockTension) });
    if (sponsoredActive >= 4) drivers.push({ code: "SPONSORSHIP_EXPOSURE", detail: "Active sponsored lanes elevated.", deltaHint: String(sponsoredActive) });
    if (pendingRel >= 5) drivers.push({ code: "RELATIONSHIP_QUEUE", detail: "Pending relationship edges accumulating.", deltaHint: String(pendingRel) });

    const score =
      Math.min(1, orderSpike / 3) * 0.22 +
      Math.min(1, sigSpike / 3) * 0.2 +
      Math.min(1, negSpike / 3) * 0.18 +
      Math.min(1, msgSpike / 3) * 0.15 +
      Math.min(1, stockTension / 8) * 0.12 +
      Math.min(1, sponsoredActive / 10) * 0.08 +
      Math.min(1, pendingRel / 12) * 0.05;

    let band: MarketPressureBand = "LOW";
    if (score > 0.72) band = "CRITICAL";
    else if (score > 0.52) band = "HIGH";
    else if (score > 0.28) band = "MODERATE";

    const topCategories = await this.prisma.product.groupBy({
      by: ["category"],
      where: { organizationId, active: true },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 4,
    });

    const relEnds = await this.prisma.relationship.findMany({
      where: { ...relWhere, status: RelationshipStatus.ACCEPTED },
      select: { upstreamOrganizationId: true, downstreamOrganizationId: true },
      take: 80,
    });
    const partnerSpotIds = [...new Set(relEnds.flatMap((r) => [r.upstreamOrganizationId, r.downstreamOrganizationId].filter(Boolean) as string[]))];
    const regions =
      partnerSpotIds.length > 0
        ? await this.prisma.organization.findMany({
            where: { id: { in: partnerSpotIds } },
            select: { city: true, country: true },
            take: 40,
          })
        : [];
    const impactedRegions = [...new Set(regions.map((r) => `${r.city}/${r.country}`))].slice(0, 8);

    const probableCauses: string[] = [];
    if (orderSpike > 1.25) probableCauses.push("Demand redistribution across wholesale corridors.");
    if (sigSpike > 1.3) probableCauses.push("Internal telemetry stacking with seasonal overlay.");
    if (negSpike > 1.25) probableCauses.push("Pricing friction or allocation contests upstream.");
    if (msgSpike > 1.35) probableCauses.push("Operational coordination spike (messages as proxy for field intensity).");

    return {
      policy: "ACTIVE" as const,
      headline:
        band === "CRITICAL"
          ? "Critical market pressure — coordinate allocation and sponsorship carefully."
          : band === "HIGH"
            ? "High pressure window — validate upstream commitments."
            : band === "MODERATE"
              ? "Moderate tension — monitor wholesale stability."
              : "Low pressure — stable industrial rhythm.",
      band,
      confidence: Number((0.55 + score * 0.38).toFixed(3)),
      impactedRegions,
      impactedProductCategories: topCategories.map((c) => c.category),
      probableCauses: probableCauses.length ? probableCauses : ["No dominant causal hypothesis — maintain watch."],
      drivers,
      metrics: {
        orders7d: orders7,
        signals7d: sig7,
        negotiations7d: neg7,
        messages7d: msg7,
        activeSponsoredLanes: sponsoredActive,
        pendingRelationships: pendingRel,
      },
    };
  }
}
