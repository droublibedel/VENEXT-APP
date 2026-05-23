import type { EconomicScenariosBundle } from "@venext/shared-contracts";

import { DEMO_OPERATIONAL_BUNDLE } from "../demo/demo-operational-static";

export type GeoFC = { type: "FeatureCollection"; features: unknown[] };

export const ECONOMIC_SCENARIOS_SYMBOLIC_PROJECTION = {
  geometryMode: "SYMBOLIC_PROJECTION" as const,
  realGeography: false as const,
  projectionNote:
    "Economic scenario map layers are symbolic prospective densities from the scenario engine — not surveyed geography.",
  projectionLabelFr: "Projection prospective symbolique — non géographique réelle",
};

function hash01(s: string, salt: string): number {
  let h = 0;
  const x = `${s}::${salt}`;
  for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export function buildEconomicScenariosCanvasGeo(bundle: EconomicScenariosBundle | null): {
  zones: GeoFC;
  routes: GeoFC;
  source: "economic_scenarios_bundle" | "silent_empty_state";
  detail: string;
} & typeof ECONOMIC_SCENARIOS_SYMBOLIC_PROJECTION {
  if (!bundle?.version || bundle.policy === "DISABLED") {
    return {
      zones: { type: "FeatureCollection", features: [] },
      routes: { type: "FeatureCollection", features: [] },
      source: "silent_empty_state",
      detail: "Economic scenarios unavailable or disabled — map cleared.",
      ...ECONOMIC_SCENARIOS_SYMBOLIC_PROJECTION,
    };
  }

  const bbox = DEMO_OPERATIONAL_BUNDLE.bbox;
  const spanLon = bbox.east - bbox.west;
  const spanLat = bbox.north - bbox.south;
  const zoneFeatures: unknown[] = [];
  const routeFeatures: unknown[] = [];

  for (let i = 0; i < bundle.scenarios.length; i++) {
    const sc = bundle.scenarios[i]!;
    const u = hash01(sc.scenarioCode, `scn${i}`);
    const lon = bbox.west + spanLon * (0.08 + u * 0.84);
    const lat = bbox.south + spanLat * (0.1 + u * 0.72);
    const r = 0.02 + sc.projectedRisk * 0.06;
    zoneFeatures.push({
      type: "Feature",
      properties: {
        layer: "scenario_stress_density",
        scenarioType: sc.scenarioType,
        projectedRisk: sc.projectedRisk,
        geometryMode: ECONOMIC_SCENARIOS_SYMBOLIC_PROJECTION.geometryMode,
      },
      geometry: { type: "Point", coordinates: [lon, lat] },
    });
    routeFeatures.push({
      type: "Feature",
      properties: { layer: "prospective_propagation_corridor", scenarioType: sc.scenarioType },
      geometry: {
        type: "LineString",
        coordinates: [
          [lon, lat],
          [lon + r, lat + r * 0.75],
        ],
      },
    });
  }

  return {
    zones: { type: "FeatureCollection", features: zoneFeatures },
    routes: { type: "FeatureCollection", features: routeFeatures },
    source: "economic_scenarios_bundle",
    detail: `Scenarios bundle · ${bundle.scenarios.length} projection(s) · ${bundle.comparisons.length} comparison pair(s)`,
    ...ECONOMIC_SCENARIOS_SYMBOLIC_PROJECTION,
  };
}

export function economicScenariosLabeledFallback(detail: string): {
  zones: GeoFC;
  routes: GeoFC;
  source: "economic_scenarios_demo_fallback";
  detail: string;
} & typeof ECONOMIC_SCENARIOS_SYMBOLIC_PROJECTION {
  return {
    zones: { type: "FeatureCollection", features: [] },
    routes: { type: "FeatureCollection", features: [] },
    source: "economic_scenarios_demo_fallback",
    detail,
    ...ECONOMIC_SCENARIOS_SYMBOLIC_PROJECTION,
  };
}
