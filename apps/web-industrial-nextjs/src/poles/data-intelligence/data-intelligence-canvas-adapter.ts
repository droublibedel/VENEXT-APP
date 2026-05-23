import type { DataIntelligenceBundleResponse } from "@venext/shared-contracts";

import { DEMO_OPERATIONAL_BUNDLE } from "../demo/demo-operational-static";
import { labeledDemoOperationalFallback } from "../supply-logistics/supply-logistics-canvas-adapter";

export type GeoFC = { type: "FeatureCollection"; features: unknown[] };

function hash01(s: string, salt: string): number {
  let h = 0;
  const x = `${s}::${salt}`;
  for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

/**
 * Instruction 17 — systemic economic map: fragile territories, propagation stress, cross-pole stress vectors.
 * Not decorative — encodes ontology + territory intelligence as geospatial hints on the demo bbox.
 */
export function buildDataIntelligenceCanvasGeo(bundle: DataIntelligenceBundleResponse | null): {
  zones: GeoFC;
  routes: GeoFC;
  source: "data_intelligence_bundle" | "silent_empty_state";
  detail: string;
} {
  if (!bundle?.version) {
    return {
      zones: { type: "FeatureCollection", features: [] },
      routes: { type: "FeatureCollection", features: [] },
      source: "silent_empty_state",
      detail: "No data-intelligence bundle — map cleared.",
    };
  }

  const bbox = DEMO_OPERATIONAL_BUNDLE.bbox;
  const spanLon = bbox.east - bbox.west;
  const spanLat = bbox.north - bbox.south;
  const zoneFeatures: unknown[] = [];
  const routeFeatures: unknown[] = [];

  for (let i = 0; i < bundle.territoryIntelligence.fragileTerritories.length; i++) {
    const row = bundle.territoryIntelligence.fragileTerritories[i]!;
    const u = hash01(row.territoryCode, `di${i}`);
    const v = hash01(row.territoryCode, `dj${i}`);
    const lon = bbox.west + spanLon * (0.1 + u * 0.8);
    const lat = bbox.south + spanLat * (0.1 + v * 0.8);
    const dw = spanLon * (0.04 + row.fragilityScore * 0.06);
    const dh = spanLat * (0.04 + row.fragilityScore * 0.06);
    zoneFeatures.push({
      type: "Feature",
      properties: {
        fragility: row.fragilityScore,
        label: row.territoryCode,
        layer: "economic_fragility_capsule",
        drivers: row.drivers,
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

  const chains = bundle.ontology.dependencyChains.slice(0, 4);
  for (let i = 0; i < chains.length; i++) {
    const c = chains[i]!;
    const u0 = hash01(c.id, "a");
    const u1 = hash01(c.id, "b");
    const lon0 = bbox.west + spanLon * (0.15 + u0 * 0.7);
    const lat0 = bbox.south + spanLat * (0.2 + u0 * 0.5);
    const lon1 = bbox.west + spanLon * (0.15 + u1 * 0.7);
    const lat1 = bbox.south + spanLat * (0.2 + u1 * 0.5);
    routeFeatures.push({
      type: "Feature",
      properties: {
        label: c.trigger,
        propagation: c.propagationScore,
        poles: c.poles,
        layer: "dependency_chain",
      },
      geometry: { type: "LineString", coordinates: [[lon0, lat0], [lon1, lat1]] },
    });
  }

  return {
    zones: { type: "FeatureCollection", features: zoneFeatures },
    routes: { type: "FeatureCollection", features: routeFeatures },
    source: "data_intelligence_bundle",
    detail: `Propagation ${bundle.ontology.economicPropagationScore.toFixed(2)} · cross-pole stress ${bundle.territoryIntelligence.crossPoleStress.toFixed(2)}`,
  };
}

export { labeledDemoOperationalFallback as dataIntelligenceLabeledFallback };
