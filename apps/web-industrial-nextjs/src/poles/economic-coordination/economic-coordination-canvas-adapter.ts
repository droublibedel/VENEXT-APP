import type { EconomicCoordinationBundle } from "@venext/shared-contracts";

import { DEMO_OPERATIONAL_BUNDLE } from "../demo/demo-operational-static";

export type GeoFC = { type: "FeatureCollection"; features: unknown[] };

export const ECONOMIC_COORDINATION_SYMBOLIC_PROJECTION = {
  geometryMode: "SYMBOLIC_PROJECTION" as const,
  realGeography: false as const,
  projectionNote:
    "Coordination map layers are symbolic systemic densities from the orchestration engine — not surveyed geography.",
  /** Instruction 18.4 — explicit symbolic canvas label (FR). */
  projectionLabelFr: "Projection systémique symbolique — non géographique réelle",
};

function hash01(s: string, salt: string): number {
  let h = 0;
  const x = `${s}::${salt}`;
  for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export function buildEconomicCoordinationCanvasGeo(bundle: EconomicCoordinationBundle | null): {
  zones: GeoFC;
  routes: GeoFC;
  source: "economic_coordination_bundle" | "silent_empty_state";
  detail: string;
} & typeof ECONOMIC_COORDINATION_SYMBOLIC_PROJECTION {
  if (!bundle?.version || bundle.policy === "DISABLED") {
    return {
      zones: { type: "FeatureCollection", features: [] },
      routes: { type: "FeatureCollection", features: [] },
      source: "silent_empty_state",
      detail: "Economic coordination unavailable or disabled — map cleared.",
      ...ECONOMIC_COORDINATION_SYMBOLIC_PROJECTION,
    };
  }

  const bbox = DEMO_OPERATIONAL_BUNDLE.bbox;
  const spanLon = bbox.east - bbox.west;
  const spanLat = bbox.north - bbox.south;
  const zoneFeatures: unknown[] = [];
  const routeFeatures: unknown[] = [];

  const pts = bundle.priorities.slice(0, 10);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!;
    const u = hash01(p.priorityId, `prio${i}`);
    const lon = bbox.west + spanLon * (0.1 + u * 0.8);
    const lat = bbox.south + spanLat * (0.12 + u * 0.7);
    const r = 0.018 + p.priorityScore * 0.055;
    zoneFeatures.push({
      type: "Feature",
      properties: {
        layer: "coordination_priority_density",
        priorityId: p.priorityId,
        priorityScore: p.priorityScore,
        geometryMode: ECONOMIC_COORDINATION_SYMBOLIC_PROJECTION.geometryMode,
      },
      geometry: { type: "Point", coordinates: [lon, lat] },
    });
    routeFeatures.push({
      type: "Feature",
      properties: { layer: "coordination_arbitration_corridor", posture: bundle.posture.posture },
      geometry: {
        type: "LineString",
        coordinates: [
          [lon, lat],
          [lon + r, lat + r * 0.72],
        ],
      },
    });
  }

  return {
    zones: { type: "FeatureCollection", features: zoneFeatures },
    routes: { type: "FeatureCollection", features: routeFeatures },
    source: "economic_coordination_bundle",
    detail: `Coordination bundle · posture ${bundle.posture.posture} · ${bundle.conflicts.length} conflict(s) · ${bundle.priorities.length} priorities`,
    ...ECONOMIC_COORDINATION_SYMBOLIC_PROJECTION,
  };
}

export function economicCoordinationLabeledFallback(detail: string): {
  zones: GeoFC;
  routes: GeoFC;
  source: "economic_coordination_demo_fallback";
  detail: string;
} & typeof ECONOMIC_COORDINATION_SYMBOLIC_PROJECTION {
  return {
    zones: { type: "FeatureCollection", features: [] },
    routes: { type: "FeatureCollection", features: [] },
    source: "economic_coordination_demo_fallback",
    detail,
    ...ECONOMIC_COORDINATION_SYMBOLIC_PROJECTION,
  };
}
