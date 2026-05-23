import type { EconomicPropagationBundle } from "@venext/shared-contracts";

import { DEMO_OPERATIONAL_BUNDLE } from "../demo/demo-operational-static";

export type GeoFC = { type: "FeatureCollection"; features: unknown[] };

/** Instruction 18.1A — canvas geometry is symbolic, not surveyed GIS. */
export const ECONOMIC_PROPAGATION_SYMBOLIC_PROJECTION = {
  geometryMode: "SYMBOLIC_PROJECTION" as const,
  realGeography: false as const,
  projectionNote:
    "Economic propagation zones are symbolic coordinates derived from bundle risk scores, not surveyed territory geometries.",
  projectionLabelFr: "Projection systémique symbolique — non géographique réelle",
};

function hash01(s: string, salt: string): number {
  let h = 0;
  const x = `${s}::${salt}`;
  for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export function buildEconomicPropagationCanvasGeo(bundle: EconomicPropagationBundle | null): {
  zones: GeoFC;
  routes: GeoFC;
  source: "economic_propagation_bundle" | "silent_empty_state";
  detail: string;
} & typeof ECONOMIC_PROPAGATION_SYMBOLIC_PROJECTION {
  if (!bundle?.version) {
    return {
      zones: { type: "FeatureCollection", features: [] },
      routes: { type: "FeatureCollection", features: [] },
      source: "silent_empty_state",
      detail: "No economic propagation bundle — map cleared.",
      ...ECONOMIC_PROPAGATION_SYMBOLIC_PROJECTION,
    };
  }

  const bbox = DEMO_OPERATIONAL_BUNDLE.bbox;
  const spanLon = bbox.east - bbox.west;
  const spanLat = bbox.north - bbox.south;
  const zoneFeatures: unknown[] = [];
  const routeFeatures: unknown[] = [];

  for (let i = 0; i < bundle.territoryFragility.length; i++) {
    const row = bundle.territoryFragility[i]!;
    const u = hash01(row.territory, `epz${i}`);
    const v = hash01(row.territory, `epw${i}`);
    const lon = bbox.west + spanLon * (0.08 + u * 0.84);
    const lat = bbox.south + spanLat * (0.08 + v * 0.84);
    const dw = spanLon * (0.035 + row.fragilityScore * 0.07);
    const dh = spanLat * (0.035 + row.fragilityScore * 0.07);
    zoneFeatures.push({
      type: "Feature",
      properties: {
        layer: "fragile_territory",
        territory: row.territory,
        fragilityScore: row.fragilityScore,
        systemicHint: row.explanation.slice(0, 120),
        geometryMode: ECONOMIC_PROPAGATION_SYMBOLIC_PROJECTION.geometryMode,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [lon, lat],
            [lon + dw, lat],
            [lon + dw, lat + dh],
            [lon, lat + dh],
            [lon, lat],
          ],
        ],
      },
    });
  }

  for (const sh of bundle.shocks.slice(0, 5)) {
    const u = hash01(sh.id, "shock");
    const lon = bbox.west + spanLon * (0.12 + u * 0.76);
    const lat = bbox.south + spanLat * (0.15 + u * 0.55);
    zoneFeatures.push({
      type: "Feature",
      properties: {
        layer: "shock_origin",
        shockType: sh.type,
        severity: sh.severity,
        systemicRisk: sh.systemicRisk,
        geometryMode: ECONOMIC_PROPAGATION_SYMBOLIC_PROJECTION.geometryMode,
      },
      geometry: { type: "Point", coordinates: [lon, lat] },
    });
  }

  for (let i = 0; i < bundle.chains.length; i++) {
    const ch = bundle.chains[i]!;
    const u0 = hash01(ch.chainId, "c0");
    const u1 = hash01(ch.chainId, "c1");
    const lon0 = bbox.west + spanLon * (0.1 + u0 * 0.8);
    const lat0 = bbox.south + spanLat * (0.12 + u0 * 0.55);
    const lon1 = bbox.west + spanLon * (0.1 + u1 * 0.8);
    const lat1 = bbox.south + spanLat * (0.12 + u1 * 0.55);
    routeFeatures.push({
      type: "Feature",
      properties: {
        layer: "propagation_chain",
        chainId: ch.chainId,
        depth: ch.propagationDepth,
        systemicRiskScore: ch.systemicRiskScore,
        geometryMode: ECONOMIC_PROPAGATION_SYMBOLIC_PROJECTION.geometryMode,
      },
      geometry: { type: "LineString", coordinates: [[lon0, lat0], [lon1, lat1]] },
    });
  }

  return {
    zones: { type: "FeatureCollection", features: zoneFeatures },
    routes: { type: "FeatureCollection", features: routeFeatures },
    source: "economic_propagation_bundle",
    detail: `Systemic rollup ${bundle.overview.systemicRiskRollup.toFixed(2)} · shocks ${bundle.shocks.length} · chains ${bundle.chains.length}`,
    ...ECONOMIC_PROPAGATION_SYMBOLIC_PROJECTION,
  };
}

export function economicPropagationLabeledFallback(detail: string): {
  zones: GeoFC;
  routes: GeoFC;
  source: "economic_propagation_demo_fallback";
  detail: string;
} & typeof ECONOMIC_PROPAGATION_SYMBOLIC_PROJECTION {
  const z = DEMO_OPERATIONAL_BUNDLE.zones as GeoFC;
  const r = DEMO_OPERATIONAL_BUNDLE.routes as GeoFC;
  return {
    zones: { type: "FeatureCollection", features: z.features?.slice(0, 6) ?? [] },
    routes: { type: "FeatureCollection", features: r.features?.slice(0, 4) ?? [] },
    source: "economic_propagation_demo_fallback",
    detail,
    ...ECONOMIC_PROPAGATION_SYMBOLIC_PROJECTION,
  };
}
