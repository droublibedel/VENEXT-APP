import { Injectable } from "@nestjs/common";
import { RelationshipStatus } from "@prisma/client";
import type { RelationshipStabilityMatrixResponse, StabilityMatrixRow } from "@venext/shared-contracts";
import { CommercialNetworkContext } from "../commercial-network-intelligence/commercial-network-context.service";

@Injectable()
export class RelationshipStabilityService {
  fromContext(ctx: CommercialNetworkContext, enabled: boolean): RelationshipStabilityMatrixResponse {
    if (!enabled) {
      return {
        generatedAt: ctx.generatedAt,
        organizationId: ctx.organizationId,
        policy: "DISABLED",
        rows: [],
      };
    }
    const rows: StabilityMatrixRow[] = [];
    const accepted = ctx.relationships.filter(
      (r) => r.status === RelationshipStatus.ACCEPTED && r.upstreamOrganizationId && r.downstreamOrganizationId,
    );

    for (const r of accepted) {
      const a = r.upstreamOrganizationId!;
      const b = r.downstreamOrganizationId!;

      const flow30 = ctx.orders30d.filter(
        (o) => (o.buyerOrganizationId === a && o.sellerOrganizationId === b) || (o.buyerOrganizationId === b && o.sellerOrganizationId === a),
      ).length;
      const flowPrev = ctx.ordersPrev30d.filter(
        (o) => (o.buyerOrganizationId === a && o.sellerOrganizationId === b) || (o.buyerOrganizationId === b && o.sellerOrganizationId === a),
      ).length;

      const decline = flowPrev > 0 && flow30 < flowPrev * 0.55;
      const lowTrust = r.trustLevel < 0.42;
      const inactive = flow30 === 0 && flowPrev === 0 && r.trustLevel < 0.55;

      if (!decline && !lowTrust && !inactive) continue;

      let severity: StabilityMatrixRow["severity"] = "low";
      if (lowTrust && decline) severity = "critical";
      else if (lowTrust || decline) severity = "high";
      else if (inactive) severity = "medium";

      const probableCause = decline
        ? "Commercial exchange cadence collapsed vs prior 30d window."
        : lowTrust
          ? "Trust envelope compressed — supervision required on obligations and visibility."
          : "Accepted edge without downstream order resonance — relationship may be ornamental.";

      const recommendation = decline
        ? "Schedule wholesaler alignment — verify catalog isolation and payment rails."
        : lowTrust
          ? "Tighten disclosure on sponsored lanes touching this edge; confirm identity attestations."
          : "Probe dormant corridor with field commerce pulse (QR / contact-sync reactivation).";

      rows.push({
        id: `stab-${r.id}`,
        severity,
        affectedOrganizationIds: [a, b],
        probableCause,
        recommendation,
        confidence: Number(Math.min(0.94, 0.55 + (decline ? 0.2 : 0) + (lowTrust ? 0.15 : 0)).toFixed(3)),
        pattern: decline ? "declining_exchanges" : lowTrust ? "low_trust" : "inactive_edge",
      });
    }

    const suspended = ctx.relationships.filter((x) => x.status === RelationshipStatus.SUSPENDED);
    for (const r of suspended.slice(0, 6)) {
      rows.push({
        id: `susp-${r.id}`,
        severity: "critical",
        affectedOrganizationIds: [r.requesterOrganizationId, r.receiverOrganizationId],
        probableCause: "Relationship suspended — commercial supervision lane active.",
        recommendation: "Investigate upstream/downstream dispute pattern before reactivation.",
        confidence: 0.88,
        pattern: "suspended",
      });
    }

    rows.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

    return {
      generatedAt: ctx.generatedAt,
      organizationId: ctx.organizationId,
      rows: rows.slice(0, 40),
    };
  }
}

function severityRank(s: StabilityMatrixRow["severity"]) {
  switch (s) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}
