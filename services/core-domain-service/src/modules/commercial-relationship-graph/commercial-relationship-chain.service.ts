import type { CommercialRelationshipChain, CommercialRelationshipEdge, CommercialRelationshipNode } from "@venext/shared-contracts";

import { Injectable } from "@nestjs/common";

@Injectable()
export class CommercialRelationshipChainService {
  build(
    nodes: CommercialRelationshipNode[],
    edges: CommercialRelationshipEdge[],
    chainsEnabled: boolean,
  ): CommercialRelationshipChain[] {
    if (!chainsEnabled) return [];
    const adj = new Map<string, CommercialRelationshipEdge[]>();
    for (const e of edges) {
      if (!adj.has(e.upstreamOrganizationId)) adj.set(e.upstreamOrganizationId, []);
      adj.get(e.upstreamOrganizationId)!.push(e);
    }
    for (const [k, list] of adj) {
      list.sort((a, b) => a.downstreamOrganizationId.localeCompare(b.downstreamOrganizationId));
      adj.set(k, list);
    }

    const producers = nodes
      .filter((n) => n.category === "PRODUCER" || n.actorType === "INDUSTRIAL_PRODUCER")
      .map((n) => n.organizationId)
      .sort();

    const results: CommercialRelationshipChain[] = [];
    const seen = new Set<string>();

    const dfs = (cur: string, pathNodes: string[], pathEdges: string[], stack: Set<string>) => {
      const outs = adj.get(cur) ?? [];
      for (const e of outs) {
        const next = e.downstreamOrganizationId;
        if (stack.has(next)) continue;
        if (pathNodes.length >= 6) continue;
        const pn = [...pathNodes, next];
        const pe = [...pathEdges, e.relationshipId];
        const nn = nodes.find((x) => x.organizationId === next);
        if (nn?.category === "RETAILER" && pn.length >= 3) {
          const key = `${pn.join(">")}`;
          if (!seen.has(key)) {
            seen.add(key);
            const strength = Number((0.38 + (pe.length / 7) * 0.55).toFixed(3));
            const frag = Number(
              (
                pe.reduce((acc, eid) => {
                  const ed = edges.find((x) => x.relationshipId === eid);
                  return acc + (ed ? 1 - ed.relationshipStability : 0.45);
                }, 0) / Math.max(1, pe.length)
              ).toFixed(3),
            );
            results.push({
              chainId: `ch-${stableId(key)}`,
              chainType: "PRODUCER_TO_RETAILER",
              nodes: pn,
              edges: pe,
              chainStrength: strength,
              chainFragility: frag,
              explanation:
                "Producer→retailer corridor along validated upstream→downstream edges — consultative chain readout, not operational dispatch sequencing.",
              sourceSignals: [`chain.depth=${pe.length}`, `chain.leaf=${next}`],
            });
          }
        }
        stack.add(next);
        dfs(next, pn, pe, stack);
        stack.delete(next);
      }
    };

    for (const start of producers) {
      const stack = new Set<string>([start]);
      dfs(start, [start], [], stack);
    }

    for (const e of edges) {
      const sid = `single-${e.relationshipId}`;
      if (seen.has(sid)) continue;
      if (e.relationshipType === "SUPPLIER_RELATION") {
        seen.add(sid);
        results.push({
          chainId: `ch-down-${e.relationshipId.slice(0, 8)}`,
          chainType: "DOWNSTREAM_CHAIN",
          nodes: [e.upstreamOrganizationId, e.downstreamOrganizationId],
          edges: [e.relationshipId],
          chainStrength: Number((0.42 + e.relationshipStrength * 0.35).toFixed(3)),
          chainFragility: Number((0.35 + (1 - e.relationshipStability) * 0.4).toFixed(3)),
          explanation: "Single-hop downstream chain on supplier-classified edge — validated commerce direction only.",
          sourceSignals: ["chain.rule=supplier_single_hop"],
        });
      } else if (e.relationshipType === "RETAIL_RELATION") {
        seen.add(sid);
        results.push({
          chainId: `ch-up-${e.relationshipId.slice(0, 8)}`,
          chainType: "UPSTREAM_CHAIN",
          nodes: [e.downstreamOrganizationId, e.upstreamOrganizationId],
          edges: [e.relationshipId],
          chainStrength: Number((0.4 + e.relationshipStrength * 0.33).toFixed(3)),
          chainFragility: Number((0.38 + (1 - e.relationshipStability) * 0.38).toFixed(3)),
          explanation: "Single-hop upstream-facing chain on retail-classified edge — symbolic walk toward supplier anchor.",
          sourceSignals: ["chain.rule=retail_single_hop_upstream"],
        });
      } else if (e.relationshipType === "FRAGILE_RELATION") {
        seen.add(sid);
        results.push({
          chainId: `ch-frag-${e.relationshipId.slice(0, 8)}`,
          chainType: "FRAGILE_CHAIN",
          nodes: [e.upstreamOrganizationId, e.downstreamOrganizationId],
          edges: [e.relationshipId],
          chainStrength: Number((0.33 + e.relationshipStrength * 0.25).toFixed(3)),
          chainFragility: Number(Math.min(1, 0.55 + (1 - e.relationshipStability) * 0.4).toFixed(3)),
          explanation: "Single-edge fragile chain — stability heuristic on trust band.",
          sourceSignals: ["chain.rule=fragile_single_edge"],
        });
      } else if (e.relationshipType === "DORMANT_RELATION") {
        seen.add(sid);
        results.push({
          chainId: `ch-dor-${e.relationshipId.slice(0, 8)}`,
          chainType: "DORMANT_CHAIN",
          nodes: [e.upstreamOrganizationId, e.downstreamOrganizationId],
          edges: [e.relationshipId],
          chainStrength: Number((0.3 + e.relationshipStrength * 0.2).toFixed(3)),
          chainFragility: Number((0.5 + (1 - e.relationshipStability) * 0.35).toFixed(3)),
          explanation: "Single-edge dormant chain — cadence reminder on acceptance-age heuristic.",
          sourceSignals: ["chain.rule=dormant_single_edge"],
        });
      } else if (e.relationshipType === "EXPANSION_RELATION") {
        seen.add(sid);
        results.push({
          chainId: `ch-exp-${e.relationshipId.slice(0, 8)}`,
          chainType: "EXPANSION_CHAIN",
          nodes: [e.upstreamOrganizationId, e.downstreamOrganizationId],
          edges: [e.relationshipId],
          chainStrength: Number((0.45 + e.relationshipStrength * 0.3).toFixed(3)),
          chainFragility: Number((0.36 + (1 - e.relationshipStability) * 0.32).toFixed(3)),
          explanation: "Single-edge expansion chain — recently accepted edge anchor heuristic.",
          sourceSignals: ["chain.rule=expansion_single_edge"],
        });
      }
    }

    return results.sort((a, b) => a.chainId.localeCompare(b.chainId)).slice(0, 48);
  }
}

function stableId(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36).slice(0, 14);
}
