import { Injectable } from "@nestjs/common";
import { RelationshipStatus } from "@prisma/client";
import type { GraphIntelligenceResponse } from "@venext/shared-contracts";
import type { DataIntelligenceCrossCutSnapshot } from "../data-intelligence-data.service";

@Injectable()
export class GraphIntelligenceService {
  build(s: DataIntelligenceCrossCutSnapshot, enabled: boolean, graphOn: boolean): GraphIntelligenceResponse {
    const graphEngineReuse =
      "RelationalCommerceNetworkTraverserService.traverseNetwork(depth=2)+partnersPack | CommercialRelationshipGraphEngineService=official_bundle_materializer (not invoked by graph_intelligence pole)";
    if (!enabled) {
      return {
        version: "1",
        generatedAt: s.generatedAt,
        organizationId: s.organizationId,
        policy: "DISABLED",
        networkStress: 0,
        clusterHealth: 0,
        orphanEdges: 0,
        trustCompression: 0,
        narrative: "Data intelligence disabled.",
        graphEngineReuse: `${graphEngineReuse} — not invoked (pole disabled).`,
      };
    }
    if (!graphOn) {
      return {
        version: "1",
        generatedAt: s.generatedAt,
        organizationId: s.organizationId,
        policy: "DISABLED",
        networkStress: 0,
        clusterHealth: 0,
        orphanEdges: 0,
        trustCompression: 0,
        narrative: "Graph intelligence disabled by flag.",
        graphEngineReuse: `${graphEngineReuse} — not invoked (graph_intelligence_enabled).`,
      };
    }

    const rel = s.commercial.relationships;
    const accepted = rel.filter((r) => r.status === RelationshipStatus.ACCEPTED).length;
    const clusterHealth = rel.length > 0 ? Number((accepted / rel.length).toFixed(3)) : 0.5;

    const relIds = new Set(rel.map((r) => r.id));
    const orphanEdges = s.finance.orders.filter((o) => o.relationshipId && !relIds.has(o.relationshipId)).length;

    const trustAvg =
      rel.length > 0 ? rel.reduce((sum, r) => sum + (typeof r.trustLevel === "number" ? r.trustLevel : 0.5), 0) / rel.length : 0.55;
    const trustCompression = Number(Math.min(1, Math.max(0, 1 - trustAvg)).toFixed(3));

    const orderStress = s.orderAdv.orders.length / 120;
    const networkStress = Number(Math.min(1, orderStress * 0.4 + orphanEdges * 0.08 + (1 - clusterHealth) * 0.35).toFixed(3));

    const pack = s.commercial.partnersPack;
    const orgId = s.organizationId;
    const deg = new Map<string, number>();
    for (const e of pack.edges) {
      const peer =
        e.upstreamOrganizationId === orgId
          ? e.downstreamOrganizationId
          : e.downstreamOrganizationId === orgId
            ? e.upstreamOrganizationId
            : null;
      if (peer) {
        deg.set(peer, (deg.get(peer) ?? 0) + 1);
      }
    }
    const weakClusters = pack.counterparties.filter((c) => (c.credibilityScore ?? 0.5) < 0.42).length;
    const dependencyHubs = [...deg.values()].filter((d) => d >= 2).length;
    const maxDeg = deg.size > 0 ? Math.max(...deg.values()) : 0;
    const graphDensity = Number(Math.min(1, pack.edges.length / 200).toFixed(3));
    const centralityProxy = Number(Math.min(1, maxDeg / Math.max(1, pack.edges.length || 1)).toFixed(3));
    const isolatedActors = Math.max(0, pack.counterparties.length - deg.size);
    const bridgeActors = Math.max(
      0,
      Math.min(12, Math.floor(s.graphTraversal.exploredEdges / 35) + (s.graphTraversal.truncated ? 2 : 0)),
    );
    const resilienceScore = Number((clusterHealth * 0.55 + (1 - trustCompression) * 0.45).toFixed(3));

    return {
      version: "1",
      generatedAt: s.generatedAt,
      organizationId: s.organizationId,
      policy: "ACTIVE",
      networkStress,
      clusterHealth,
      orphanEdges,
      trustCompression,
      graphDensity,
      weakClusters,
      dependencyHubs,
      centralityProxy,
      resilienceScore,
      isolatedActors,
      bridgeActors,
      graphEngineReuse: `${graphEngineReuse} · visited=${s.graphTraversal.visitedCount} edges=${s.graphTraversal.exploredEdges} truncated=${s.graphTraversal.truncated}`,
      narrative:
        "Commercial graph reuses graph-engine partners slice + bounded traverse — hubs/bridges are heuristics on that slice, not full betweenness centrality.",
    };
  }
}
