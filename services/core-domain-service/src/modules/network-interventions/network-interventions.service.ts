import { Injectable } from "@nestjs/common";
import type {
  NetworkInterventionsResponse,
  RelationshipStabilityMatrixResponse,
  DistributorObservatoryResponse,
  RetailerRadarResponse,
} from "@venext/shared-contracts";

@Injectable()
export class NetworkInterventionsService {
  synthesize(input: {
    ctxGeneratedAt: string;
    organizationId: string;
    stability: RelationshipStabilityMatrixResponse;
    distributors: DistributorObservatoryResponse;
    retailers: RetailerRadarResponse;
  }): NetworkInterventionsResponse {
    const interventions: NetworkInterventionsResponse["interventions"] = [];

    for (const row of input.stability.rows.slice(0, 5)) {
      interventions.push({
        id: `int-stab-${row.id}`,
        kind: "supervise_relationship_decline",
        urgency: row.severity === "critical" ? "critical" : row.severity === "high" ? "high" : "medium",
        expectedImpact: "Stabilize commercial edge before downstream fulfillment stress.",
        affectedRegion: row.affectedOrganizationIds[0]?.slice(0, 8),
        confidence: row.confidence,
        relatedSignals: [row.pattern, row.probableCause.slice(0, 80)],
      });
    }

    for (const d of input.distributors.rows.filter((x) => x.band === "unstable" || x.band === "inactive").slice(0, 3)) {
      interventions.push({
        id: `int-dist-${d.organizationId}`,
        kind: d.band === "inactive" ? "investigate_inactive_territory" : "contact_unstable_wholesaler",
        urgency: d.band === "unstable" ? "high" : "medium",
        expectedImpact: d.band === "inactive" ? "Recover dormant wholesale pull — field verification." : "Rebuild trust envelope on volatile corridor.",
        confidence: 0.62,
        relatedSignals: [`distributor:${d.band}`, `orders30d:${d.orderFlow30d}`],
      });
    }

    for (const r of input.retailers.rows.filter((x) => x.segment === "rising").slice(0, 2)) {
      interventions.push({
        id: `int-ret-${r.organizationId}`,
        kind: "launch_retailer_campaign",
        urgency: "medium",
        expectedImpact: "Capitalize on rising downstream demand cluster.",
        affectedRegion: r.regionKey,
        confidence: 0.58,
        relatedSignals: [`segment:${r.segment}`, `velocity:${r.velocityScore}`],
      });
    }

    for (const r of input.retailers.rows.filter((x) => x.segment === "inactive").slice(0, 2)) {
      interventions.push({
        id: `int-ret-in-${r.organizationId}`,
        kind: "investigate_inactive_territory",
        urgency: "low",
        expectedImpact: "Reignite catalog negotiation cadence for quiet retailer.",
        affectedRegion: r.regionKey,
        confidence: 0.52,
        relatedSignals: ["retailer:inactive_band"],
      });
    }

    interventions.push({
      id: "int-generic-sponsorship",
      kind: "adjust_sponsorship_pressure",
      urgency: "low",
      expectedImpact: "Balance sponsored penetration vs relationship-native lanes.",
      confidence: 0.48,
      relatedSignals: ["sponsorship_governance"],
    });

    return {
      generatedAt: input.ctxGeneratedAt,
      organizationId: input.organizationId,
      interventions: interventions.slice(0, 24),
    };
  }
}
