import type { CommercialBridge, CommercialRelationshipEdge, CommercialRelationshipNode } from "@venext/shared-contracts";

import { Injectable } from "@nestjs/common";

@Injectable()
export class CommercialBridgeService {
  build(nodes: CommercialRelationshipNode[], edges: CommercialRelationshipEdge[]): CommercialBridge[] {
    const out: CommercialBridge[] = [];
    const upDeg = new Map<string, number>();
    const downDeg = new Map<string, number>();
    const terr = new Map<string, Set<string>>();
    for (const e of edges) {
      upDeg.set(e.upstreamOrganizationId, (upDeg.get(e.upstreamOrganizationId) ?? 0) + 1);
      downDeg.set(e.downstreamOrganizationId, (downDeg.get(e.downstreamOrganizationId) ?? 0) + 1);
    }
    for (const n of nodes) {
      if (n.nodeRole !== "DISTRIBUTOR_BRIDGE" && n.nodeRole !== "STRATEGIC_HUB") continue;
      const u = upDeg.get(n.organizationId) ?? 0;
      const d = downDeg.get(n.organizationId) ?? 0;
      const load = Number(Math.min(1, (u + d) / 18).toFixed(3));
      const overload = Number(Math.min(1, Math.max(0, load - 0.55) * 2.1).toFixed(3));
      const tset = new Set<string>();
      tset.add(n.territory);
      for (const e of edges) {
        if (e.upstreamOrganizationId === n.organizationId || e.downstreamOrganizationId === n.organizationId) {
          const other = e.upstreamOrganizationId === n.organizationId ? e.downstreamOrganizationId : e.upstreamOrganizationId;
          const on = nodes.find((x) => x.organizationId === other);
          if (on) tset.add(on.territory);
        }
      }
      terr.set(n.organizationId, tset);
      const bridgeType =
        n.nodeRole === "STRATEGIC_HUB" ? ("STRATEGIC_DISTRIBUTOR" as const) : ("WHOLESALER_BRIDGE" as const);
      out.push({
        bridgeId: `br-${n.organizationId.slice(0, 8)}`,
        organizationId: n.organizationId,
        bridgeType: tset.size >= 3 ? "MULTI_TERRITORY_CONNECTOR" : bridgeType,
        connectedTerritories: [...tset].sort().slice(0, 24),
        upstreamLinks: u,
        downstreamLinks: d,
        bridgeLoad: load,
        overloadRisk: overload,
        explanation:
          "Bridge readout highlights wholesalers/distributors with multi-territory connectors in this validated subgraph — heuristic load, not logistics capacity.",
        sourceSignals: [`bridge.up=${u}`, `bridge.down=${d}`, `bridge.load=${load}`],
      });
    }
    return out.sort((a, b) => a.organizationId.localeCompare(b.organizationId)).slice(0, 32);
  }
}
