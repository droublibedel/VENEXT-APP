import { OrganizationCategory } from "@prisma/client";
import type { Relationship } from "@prisma/client";
import type { CommercialRelationshipEdge, CommercialRelationshipEdgeType } from "@venext/shared-contracts";

import { Injectable } from "@nestjs/common";

type OrgLite = { id: string; category: OrganizationCategory };

function pairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

@Injectable()
export class CommercialRelationshipEdgeService {
  buildEdges(
    rels: Pick<
      Relationship,
      | "id"
      | "upstreamOrganizationId"
      | "downstreamOrganizationId"
      | "status"
      | "source"
      | "trustLevel"
      | "acceptedAt"
      | "createdAt"
    >[],
    orgById: Map<string, OrgLite>,
    orderCountByRelationshipId: Map<string, number>,
    downstreamExclusive: Set<string>,
    context: {
      negotiationPairCount: Map<string, number>;
      reservationIntentCount: Map<string, number>;
      shipmentCount: Map<string, number>;
      groupBuyingSessionCount: Map<string, number>;
      productVisibilityCount: Map<string, number>;
    },
  ): CommercialRelationshipEdge[] {
    const sorted = [...rels].sort((a, b) => a.id.localeCompare(b.id));
    const out: CommercialRelationshipEdge[] = [];
    const now = Date.now();
    for (const r of sorted) {
      const upId = r.upstreamOrganizationId;
      const downId = r.downstreamOrganizationId;
      if (!upId || !downId) continue;
      const up = orgById.get(upId);
      const down = orgById.get(downId);
      if (!up || !down) continue;
      const ageMs = r.acceptedAt ? now - r.acceptedAt.getTime() : now - r.createdAt.getTime();
      const dormant = ageMs > 365 * 24 * 60 * 60 * 1000;
      const expansion = ageMs < 90 * 24 * 60 * 60 * 1000;
      const strength = Number(Math.min(1, Math.max(0, r.trustLevel)).toFixed(3));
      const stability = Number(
        Math.min(1, 0.35 + strength * 0.45 + (dormant ? 0 : 0.2)).toFixed(3),
      );
      const dep = downstreamExclusive.has(r.id) ? 0.82 : Number((0.25 + strength * 0.35).toFixed(3));
      const orders = orderCountByRelationshipId.get(r.id) ?? 0;
      const neg = context.negotiationPairCount.get(pairKey(upId, downId)) ?? 0;
      const resC = context.reservationIntentCount.get(r.id) ?? 0;
      const shipC = context.shipmentCount.get(r.id) ?? 0;
      const gbsC = context.groupBuyingSessionCount.get(r.id) ?? 0;
      const visC = context.productVisibilityCount.get(r.id) ?? 0;
      const intensity = Number(
        Math.min(1, orders / 40 + neg / 25 + resC / 18 + shipC / 22 + gbsC / 12 + visC / 30 + strength * 0.22).toFixed(3),
      );
      const relType = this.classifyEdgeType(up.category, down.category, strength, dormant, expansion, downstreamExclusive.has(r.id));
      const baseExplain = this.explain(relType, up.category, down.category, dormant, downstreamExclusive.has(r.id));
      const ctxNote =
        neg + resC + shipC + gbsC + visC > 0
          ? ` Supporting counts (bounded Prisma reads): negotiations(pair)=${neg}, reservationIntents=${resC}, shipments=${shipC}, groupBuyingSessions=${gbsC}, productVisibilityLinks=${visC}.`
          : "";
      out.push({
        relationshipId: r.id,
        upstreamOrganizationId: upId,
        downstreamOrganizationId: downId,
        relationshipType: relType,
        status: String(r.status),
        source: String(r.source),
        relationshipStrength: strength,
        relationshipStability: stability,
        dependencyLevel: dep,
        commercialIntensity: intensity,
        activityState: dormant ? "DORMANT" : "ACTIVE",
        visibilityScope: "RELATIONSHIP_ONLY",
        negotiationPairCount: neg,
        supportingReservationIntentCount: resC,
        supportingShipmentCount: shipC,
        supportingGroupBuyingSessionCount: gbsC,
        supportingProductVisibilityCount: visC,
        sourceSignals: [
          `edge.trustLevel=${r.trustLevel}`,
          `edge.ageMs=${Math.floor(ageMs)}`,
          `edge.orders=${orders}`,
          `edge.negotiationsPair=${neg}`,
          `edge.reservationIntents=${resC}`,
          `edge.shipments=${shipC}`,
          `edge.groupBuyingSessions=${gbsC}`,
          `edge.productVisibilityLinks=${visC}`,
          `edge.upstreamCategory=${up.category}`,
          `edge.downstreamCategory=${down.category}`,
          `edge.downstreamExclusive=${downstreamExclusive.has(r.id)}`,
        ],
        explanation: `${baseExplain}${ctxNote}`,
      });
    }
    return out;
  }

  private explain(
    t: CommercialRelationshipEdgeType,
    up: OrganizationCategory,
    down: OrganizationCategory,
    dormant: boolean,
    highDep: boolean,
  ): string {
    const base = `Directed commercial edge ${up}→${down} — validated relationship scope only (not open discovery).`;
    if (dormant) return `${base} Classification: dormant cadence from acceptance age heuristic.`;
    if (highDep) return `${base} Classification: downstream concentration on a single upstream in this subgraph.`;
    if (t === "STRATEGIC_RELATION") return `${base} Higher trust band in this subgraph — still heuristic advisory.`;
    return base;
  }

  private classifyEdgeType(
    up: OrganizationCategory,
    down: OrganizationCategory,
    trust: number,
    dormant: boolean,
    expansion: boolean,
    highDep: boolean,
  ): CommercialRelationshipEdgeType {
    if (dormant) return "DORMANT_RELATION";
    if (highDep) return "HIGH_DEPENDENCY_RELATION";
    if (trust >= 0.72) return "STRATEGIC_RELATION";
    if (trust < 0.42) return "FRAGILE_RELATION";
    if (expansion) return "EXPANSION_RELATION";
    if (up === OrganizationCategory.PRODUCER && (down === OrganizationCategory.WHOLESALER_A || down === OrganizationCategory.WHOLESALER_B)) {
      return "SUPPLIER_RELATION";
    }
    if (
      (up === OrganizationCategory.WHOLESALER_A || up === OrganizationCategory.WHOLESALER_B) &&
      down === OrganizationCategory.RETAILER
    ) {
      return "RETAIL_RELATION";
    }
    if (up === OrganizationCategory.WHOLESALER_A || up === OrganizationCategory.WHOLESALER_B) {
      return "DISTRIBUTION_RELATION";
    }
    return "DISTRIBUTION_RELATION";
  }
}
