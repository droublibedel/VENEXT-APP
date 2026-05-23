import type { CommercialCoverageCell, CommercialCoverageModel, CommercialRelationshipEdge, CommercialRelationshipNode } from "@venext/shared-contracts";

import { Injectable } from "@nestjs/common";

@Injectable()
export class CommercialCoverageService {
  build(nodes: CommercialRelationshipNode[], edges: CommercialRelationshipEdge[]): CommercialCoverageModel {
    const territorySet = new Set<string>();
    for (const n of nodes) territorySet.add(n.territory);
    const territories = [...territorySet].sort();
    const cells: CommercialCoverageCell[] = [];
    for (const t of territories) {
      const inTerritory = nodes.filter((n) => n.territory === t);
      const eIn = edges.filter((e) => {
        const a = nodes.find((n) => n.organizationId === e.upstreamOrganizationId);
        const b = nodes.find((n) => n.organizationId === e.downstreamOrganizationId);
        return a?.territory === t && b?.territory === t;
      });
      const density = Math.min(1, eIn.length / Math.max(1, inTerritory.length * 2));
      const distCov = Math.min(1, inTerritory.filter((n) => n.category === "RETAILER").length / 6);
      const upCov = Math.min(1, inTerritory.filter((n) => n.category === "PRODUCER").length / 4);
      const downCov = Math.min(1, inTerritory.filter((n) => n.category !== "PRODUCER").length / 10);
      const isolated = inTerritory.length === 1 && eIn.length === 0;
      const gap = inTerritory.length > 0 && eIn.length === 0;
      cells.push({
        cellId: `cell-${hashTerritory(t)}`,
        territoryLabel: t,
        relationshipDensity: Number(density.toFixed(3)),
        distributionCoverage: Number(distCov.toFixed(3)),
        upstreamCoverage: Number(upCov.toFixed(3)),
        downstreamCoverage: Number(downCov.toFixed(3)),
        isolatedArea: isolated,
        coverageGap: gap,
        explanation:
          `Symbolic coverage cell — territory label is organizational locale metadata, not GPS survey. Density is a deterministic function of local nodes/edges (nodes=${inTerritory.length}, edges=${eIn.length}).`,
      });
    }
    const isolatedAreas = cells.filter((c) => c.isolatedArea).map((c) => c.territoryLabel);
    const coverageGaps = cells.filter((c) => c.coverageGap).map((c) => c.territoryLabel);
    const relD = edges.length / Math.max(1, nodes.length * 2);
    return {
      version: "1",
      symbolicProjection: true,
      territories,
      relationshipDensity: Number(Math.min(1, relD).toFixed(3)),
      distributionCoverage: Number(
        Math.min(1, nodes.filter((n) => n.category === "RETAILER").length / 8).toFixed(3),
      ),
      upstreamCoverage: Number(Math.min(1, nodes.filter((n) => n.category === "PRODUCER").length / 6).toFixed(3)),
      downstreamCoverage: Number(
        Math.min(1, nodes.filter((n) => n.category !== "PRODUCER").length / 14).toFixed(3),
      ),
      isolatedAreas,
      coverageGaps,
      cells: cells.slice(0, 48),
      coverageExplanation:
        "Coverage model is a symbolic lattice derived from organization locale strings and local edge density — not a geographic map layer.",
    };
  }
}

function hashTerritory(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return String(h % 1_000_000_000);
}
