import { Injectable } from "@nestjs/common";
import { RelationshipStatus } from "@prisma/client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { relationshipWhereOrgParticipates } from "./strategic-org-scope";

@Injectable()
export class StrategicIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async overview(organizationId: string) {
    const d30 = new Date(Date.now() - 30 * 86400_000);
    const d60 = new Date(Date.now() - 60 * 86400_000);
    const relWhere = relationshipWhereOrgParticipates(organizationId);

    const [
      newRel30,
      newRelPrev30,
      accepted,
      pending,
      signals7,
      signalsPrev7,
      orders30,
      ordersPrev30,
      products,
      sponsoredActive,
      orgSelf,
    ] = await Promise.all([
      this.prisma.relationship.count({ where: { ...relWhere, createdAt: { gte: d30 } } }),
      this.prisma.relationship.count({
        where: { ...relWhere, createdAt: { gte: d60, lt: d30 } },
      }),
      this.prisma.relationship.count({ where: { ...relWhere, status: RelationshipStatus.ACCEPTED } }),
      this.prisma.relationship.count({ where: { ...relWhere, status: RelationshipStatus.PENDING } }),
      this.prisma.economicSignal.count({
        where: { organizationId, createdAt: { gte: new Date(Date.now() - 7 * 86400_000) } },
      }),
      this.prisma.economicSignal.count({
        where: {
          organizationId,
          createdAt: { gte: new Date(Date.now() - 14 * 86400_000), lt: new Date(Date.now() - 7 * 86400_000) },
        },
      }),
      this.prisma.order.count({
        where: {
          OR: [{ buyerOrganizationId: organizationId }, { sellerOrganizationId: organizationId }],
          createdAt: { gte: d30 },
        },
      }),
      this.prisma.order.count({
        where: {
          OR: [{ buyerOrganizationId: organizationId }, { sellerOrganizationId: organizationId }],
          createdAt: { gte: d60, lt: d30 },
        },
      }),
      this.prisma.product.count({ where: { organizationId, active: true } }),
      this.prisma.sponsoredProductInjection.count({ where: { sponsorOrganizationId: organizationId, active: true } }),
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { credibilityScore: true, city: true, country: true },
      }),
    ]);

    const expansionVelocity =
      newRelPrev30 <= 0 ? Math.min(2, newRel30 / Math.max(1, accepted)) : newRel30 / Math.max(1, newRelPrev30);
    const signalDensityRatio = signalsPrev7 <= 0 ? 1 : signals7 / signalsPrev7;
    const orderMomentum = ordersPrev30 <= 0 ? 1 : orders30 / Math.max(1, ordersPrev30);

    const strategicHealth = Number(
      (
        (accepted > 0 ? 0.28 : 0.1) +
        Math.min(0.32, expansionVelocity * 0.14) +
        Math.min(0.22, (orgSelf?.credibilityScore ?? 0.5) * 0.35) +
        Math.min(0.18, 1 / (1 + Math.max(0, signalDensityRatio - 1.6)))
      ).toFixed(3),
    );

    const distributionTension = Number(
      Math.min(1, pending / Math.max(4, accepted) + Math.max(0, signalDensityRatio - 1) * 0.25).toFixed(3),
    );

    const productPressure =
      products > 0 ? Number(Math.min(1, sponsoredActive / Math.max(8, products * 0.08)).toFixed(3)) : 0;

    const sponsorshipImpact = Number(Math.min(1, sponsoredActive / Math.max(3, accepted * 0.15)).toFixed(3));

    const relationshipStability = accepted + pending > 0 ? Number((accepted / (accepted + pending)).toFixed(3)) : 1;

    const regionOpportunity = Number(
      Math.min(1, expansionVelocity * 0.35 + (orgSelf?.credibilityScore ?? 0) * 0.4 + orderMomentum * 0.25).toFixed(3),
    );

    const industrialConfidence = Number((orgSelf?.credibilityScore ?? 0).toFixed(3));

    const crossPoleLayer = await this.crossPoleSynthesis(organizationId);

    return {
      generatedAt: new Date().toISOString(),
      strategicCapsules: {
        strategicHealth: {
          score: strategicHealth,
          interpretation:
            strategicHealth > 0.62
              ? "Industrial posture coherent — graph motion + credibility reinforce strategic runway."
              : "Pressure detected — tighten wholesale governance before weak signals compound.",
        },
        marketExpansionVelocity: {
          ratio: Number(expansionVelocity.toFixed(3)),
          trajectory:
            expansionVelocity >= 1.15 ? "accelerating_edge formation" : "steady industrial rhythm",
        },
        networkGrowth: {
          acceptedEdges: accepted,
          pendingEdges: pending,
          marker: accepted > pending * 3 ? "stable acceptance bias" : "relationship queue building",
        },
        distributionTension: {
          index: distributionTension,
          tensionIndicator:
            distributionTension > 0.45 ? "upstream/downstream coordination stress likely" : "controlled corridor friction",
        },
        abnormalSignalDensity: {
          ratio: Number(signalDensityRatio.toFixed(3)),
          anomalyMarker:
            signalDensityRatio > 1.45 ? "telemetry clustering — validate external overlays" : "normative signal tempo",
        },
        productPressureState: {
          index: productPressure,
          note: "Sponsored + SKU depth interaction — not price comparison theater.",
        },
        sponsorshipImpact: {
          index: sponsorshipImpact,
          note: "Sponsor identity preserved — injections remain inspectable in governance lane.",
        },
        relationshipStability: {
          ratio: relationshipStability,
          note: "Accepted vs pending mix across closed graph — operational truth, not CRM vanity.",
        },
        regionOpportunityLevel: {
          score: regionOpportunity,
          anchorTerritory: `${orgSelf?.city ?? "—"} · ${orgSelf?.country ?? ""}`,
        },
        industrialConfidenceState: {
          score: industrialConfidence,
          note: "Credibility-weighted industrial confidence — informs strategic queue prioritization.",
        },
      },
      crossPoleLayer,
    };
  }

  private async crossPoleSynthesis(organizationId: string) {
    const keys = [
      { pole: "commercial", keys: ["relationship_graph_enabled", "commercial_identity_enabled"] },
      { pole: "marketing", keys: ["sponsored_products_enabled"] },
      { pole: "logistics", keys: ["logistics_map_enabled"] },
      { pole: "finance", keys: ["wallet_enabled", "payments_enabled"] },
      { pole: "data_intelligence", keys: ["ai_assistant_enabled"] },
      { pole: "safety", keys: ["industrial_safety_enabled"] },
    ] as const;

    const layers: {
      pole: string;
      readiness: number;
      signals: { key: string; enabled: boolean }[];
      synthesis: string;
    }[] = [];

    for (const block of keys) {
      const states = await Promise.all(
        block.keys.map(async (key) => ({
          key,
          enabled: await this.flags.isEnabled(key, { organizationId }),
        })),
      );
      const readiness = states.filter((s) => s.enabled).length / Math.max(1, states.length);
      layers.push({
        pole: block.pole,
        readiness: Number(readiness.toFixed(3)),
        signals: states,
        synthesis:
          readiness > 0.66
            ? `${block.pole} lane armed — strategic synthesis can consume live telemetry.`
            : `${block.pole} lane partially muted — interpret Direction/Strategy output as provisional.`,
      });
    }

    return {
      headline: "Cross-pole synthesis — Direction/Strategy aggregates industrial poles without duplicating engines.",
      layers,
    };
  }
}
