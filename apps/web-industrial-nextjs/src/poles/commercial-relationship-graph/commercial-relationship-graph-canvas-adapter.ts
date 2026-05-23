import type { CommercialRelationshipGraphBundle } from "@venext/shared-contracts";

import { DEMO_OPERATIONAL_BUNDLE } from "../demo/demo-operational-static";

export const COMMERCIAL_RELATIONSHIP_GRAPH_SYMBOLIC = {
  geometryMode: "SYMBOLIC_PROJECTION" as const,
  graphMode: "RELATIONSHIP_GRAPH" as const,
  realGeography: false as const,
  openMarketplace: false as const,
  socialNetworkMode: false as const,
  advisoryOnly: true as const,
  projectionLabelFr: "Projection relationnelle symbolique — non géographique réelle",
};

function hash01(s: string, salt: string): number {
  let h = 0;
  const x = `${s}::${salt}`;
  for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export function commercialRelationshipGraphLabeledFallback(detail: string): {
  zones: { type: "FeatureCollection"; features: unknown[] };
  routes: { type: "FeatureCollection"; features: unknown[] };
  source: "silent_empty_state";
  detail: string;
} & typeof COMMERCIAL_RELATIONSHIP_GRAPH_SYMBOLIC {
  return {
    zones: { type: "FeatureCollection", features: [] },
    routes: { type: "FeatureCollection", features: [] },
    source: "silent_empty_state",
    detail,
    ...COMMERCIAL_RELATIONSHIP_GRAPH_SYMBOLIC,
  };
}

export function buildCommercialRelationshipGraphCanvasGeo(bundle: CommercialRelationshipGraphBundle | null): {
  zones: { type: "FeatureCollection"; features: unknown[] };
  routes: { type: "FeatureCollection"; features: unknown[] };
  source: "commercial_relationship_graph_bundle" | "silent_empty_state";
  detail: string;
} & typeof COMMERCIAL_RELATIONSHIP_GRAPH_SYMBOLIC {
  if (!bundle?.version || bundle.policy === "DISABLED") {
    return {
      zones: { type: "FeatureCollection", features: [] },
      routes: { type: "FeatureCollection", features: [] },
      source: "silent_empty_state",
      detail: "Graphe relationnel indisponible ou désactivé — canevas vidé (Instruction 19.1).",
      ...COMMERCIAL_RELATIONSHIP_GRAPH_SYMBOLIC,
    };
  }
  const bbox = DEMO_OPERATIONAL_BUNDLE.bbox;
  const spanLon = bbox.east - bbox.west;
  const spanLat = bbox.north - bbox.south;
  const zoneFeatures: unknown[] = [];
  const routeFeatures: unknown[] = [];
  const nodes = bundle.snapshot.nodes.slice(0, 14);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]!;
    const u = hash01(n.organizationId, `n${i}`);
    const lon = bbox.west + spanLon * (0.1 + u * 0.8);
    const lat = bbox.south + spanLat * (0.12 + u * 0.7);
    zoneFeatures.push({
      type: "Feature",
      properties: {
        layer: "commercial_relationship_symbolic_node",
        organizationId: n.organizationId,
        nodeRole: n.nodeRole,
        graphMode: COMMERCIAL_RELATIONSHIP_GRAPH_SYMBOLIC.graphMode,
      },
      geometry: { type: "Point", coordinates: [lon, lat] },
    });
  }
  const edges = bundle.snapshot.edges.slice(0, 12);
  for (let j = 0; j < edges.length; j++) {
    const e = edges[j]!;
    const u1 = hash01(e.upstreamOrganizationId, `eu${j}`);
    const u2 = hash01(e.downstreamOrganizationId, `ed${j}`);
    routeFeatures.push({
      type: "Feature",
      properties: {
        layer: "commercial_relationship_validated_edge",
        relationshipId: e.relationshipId,
        relationshipType: e.relationshipType,
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [bbox.west + spanLon * (0.1 + u1 * 0.8), bbox.south + spanLat * (0.12 + u1 * 0.7)],
          [bbox.west + spanLon * (0.1 + u2 * 0.8), bbox.south + spanLat * (0.12 + u2 * 0.7)],
        ],
      },
    });
  }
  return {
    zones: { type: "FeatureCollection", features: zoneFeatures },
    routes: { type: "FeatureCollection", features: routeFeatures },
    source: "commercial_relationship_graph_bundle",
    detail: `Lattice symbolique — ${nodes.length} nœuds partenaires · ${edges.length} arêtes validées (projection non géographique).`,
    ...COMMERCIAL_RELATIONSHIP_GRAPH_SYMBOLIC,
  };
}
