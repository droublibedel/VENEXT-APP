import type {
  CommercialBridge,
  CommercialDependencyCluster,
  CommercialRelationshipEdge,
  CommercialRelationshipNode,
} from "@venext/shared-contracts";

import { Injectable } from "@nestjs/common";

@Injectable()
export class CommercialDependencyClusterService {
  build(
    nodes: CommercialRelationshipNode[],
    edges: CommercialRelationshipEdge[],
    bridges: CommercialBridge[],
  ): CommercialDependencyCluster[] {
    const out: CommercialDependencyCluster[] = [];
    const byDown = new Map<string, CommercialRelationshipEdge[]>();
    for (const e of edges) {
      if (!byDown.has(e.downstreamOrganizationId)) byDown.set(e.downstreamOrganizationId, []);
      byDown.get(e.downstreamOrganizationId)!.push(e);
    }
    for (const n of nodes) {
      if (n.category !== "RETAILER") continue;
      const ins = byDown.get(n.organizationId) ?? [];
      if (ins.length === 1) {
        const e = ins[0]!;
        out.push({
          clusterId: `cl-ret-single-${n.organizationId.slice(0, 8)}`,
          clusterType: "RETAILER_SINGLE_SOURCE",
          involvedOrganizations: [n.organizationId, e.upstreamOrganizationId],
          involvedRelationships: [e.relationshipId],
          dependencyScore: Number(Math.min(1, 0.55 + e.dependencyLevel * 0.35).toFixed(3)),
          fragilityScore: Number(Math.min(1, 0.4 + (1 - e.relationshipStability) * 0.45).toFixed(3)),
          affectedTerritories: [n.territory],
          explanation:
            "Retailer shows a single validated upstream edge in this subgraph — distribution resilience heuristic (not a judgment on the partner).",
          sourceSignals: ["cluster.rule=single_incoming_accepted_edge", `retailerOrg=${n.organizationId}`],
        });
      }
    }

    const wholesalerLoads = new Map<string, number>();
    for (const e of edges) {
      const upNode = nodes.find((x) => x.organizationId === e.upstreamOrganizationId);
      if (upNode && (upNode.category === "WHOLESALER_A" || upNode.category === "WHOLESALER_B")) {
        wholesalerLoads.set(e.upstreamOrganizationId, (wholesalerLoads.get(e.upstreamOrganizationId) ?? 0) + 1);
      }
    }
    for (const [wid, load] of [...wholesalerLoads.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      if (load >= 6) {
        const wnode = nodes.find((x) => x.organizationId === wid);
        out.push({
          clusterId: `cl-whconc-${wid.slice(0, 8)}`,
          clusterType: "WHOLESALER_CONCENTRATION",
          involvedOrganizations: [wid],
          involvedRelationships: edges.filter((e) => e.upstreamOrganizationId === wid).map((e) => e.relationshipId),
          dependencyScore: Number(Math.min(1, 0.35 + load / 20).toFixed(3)),
          fragilityScore: Number(Math.min(1, load / 24).toFixed(3)),
          affectedTerritories: wnode ? [wnode.territory] : [],
          explanation:
            "Wholesaler node concentrates multiple downstream validated edges in this subgraph — corridor load heuristic (not capacity planning).",
          sourceSignals: [`wholesaler.downstreamEdgeCount=${load}`, `wholesalerOrg=${wid}`],
        });
      }
    }

    for (const n of nodes) {
      if (n.category !== "PRODUCER") continue;
      if (n.downstreamCount >= 5) {
        const relIds = edges.filter((e) => e.upstreamOrganizationId === n.organizationId).map((e) => e.relationshipId);
        out.push({
          clusterId: `cl-prod-dep-${n.organizationId.slice(0, 8)}`,
          clusterType: "PRODUCER_DEPENDENCY",
          involvedOrganizations: [n.organizationId],
          involvedRelationships: relIds.slice(0, 24),
          dependencyScore: Number(Math.min(1, 0.42 + n.downstreamCount / 18).toFixed(3)),
          fragilityScore: Number(Math.min(1, 0.35 + n.downstreamCount / 22).toFixed(3)),
          affectedTerritories: [n.territory],
          explanation:
            "Producer anchors many downstream validated edges in this subgraph — corridor dependency concentration heuristic.",
          sourceSignals: [`producer.downstreamCount=${n.downstreamCount}`, `producerOrg=${n.organizationId}`],
        });
      }
    }

    const fragileEdges = edges.filter((e) => e.relationshipType === "FRAGILE_RELATION");
    if (fragileEdges.length >= 3) {
      out.push({
        clusterId: `cl-fragile-${fragileEdges[0]!.relationshipId.slice(0, 8)}`,
        clusterType: "FRAGILE_ZONE",
        involvedOrganizations: [...new Set(fragileEdges.flatMap((e) => [e.upstreamOrganizationId, e.downstreamOrganizationId]))].sort(),
        involvedRelationships: fragileEdges.map((e) => e.relationshipId).sort(),
        dependencyScore: 0.48,
        fragilityScore: Number(Math.min(1, 0.5 + fragileEdges.length / 16).toFixed(3)),
        affectedTerritories: [],
        explanation:
          "Multiple fragile-classified edges co-occur in this subgraph — consultative stability pocket (not a geography hazard map).",
        sourceSignals: [`fragile.edgeCount=${fragileEdges.length}`],
      });
    }

    for (const b of bridges) {
      if (b.overloadRisk >= 0.55) {
        out.push({
          clusterId: `cl-bridge-${b.bridgeId}`,
          clusterType: "BRIDGE_OVERLOAD",
          involvedOrganizations: [b.organizationId],
          involvedRelationships: [],
          dependencyScore: Number(b.bridgeLoad.toFixed(3)),
          fragilityScore: Number(b.overloadRisk.toFixed(3)),
          affectedTerritories: b.connectedTerritories.slice(0, 8),
          explanation:
            "Bridge overload heuristic derived from validated-degree load on distributor-bridge / hub roles — mirrors bridge service readout.",
          sourceSignals: [`bridge.overloadRisk=${b.overloadRisk}`, `bridgeId=${b.bridgeId}`],
        });
      }
    }

    const dormantEdges = edges.filter((e) => e.activityState === "DORMANT");
    if (dormantEdges.length >= 2) {
      out.push({
        clusterId: `cl-dormant-${dormantEdges[0]!.relationshipId.slice(0, 8)}`,
        clusterType: "DORMANT_CLUSTER",
        involvedOrganizations: [...new Set(dormantEdges.flatMap((e) => [e.upstreamOrganizationId, e.downstreamOrganizationId]))].sort(),
        involvedRelationships: dormantEdges.map((e) => e.relationshipId).sort(),
        dependencyScore: 0.45,
        fragilityScore: 0.62,
        affectedTerritories: [],
        explanation:
          "Multiple validated edges show dormant cadence heuristic — review commercial cadence (not automatic churn prediction).",
        sourceSignals: [`dormant.edgeCount=${dormantEdges.length}`],
      });
    }

    return out.slice(0, 32);
  }
}
