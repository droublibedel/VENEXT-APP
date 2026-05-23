import type { IndustrialOperationalContinuityBundle } from "@venext/shared-contracts";

import { DEMO_OPERATIONAL_BUNDLE } from "../demo/demo-operational-static";

export const INDUSTRIAL_OPERATIONAL_CONTINUITY_SYMBOLIC = {
  geometryMode: "SYMBOLIC_PROJECTION" as const,
  realGeography: false as const,
  advisoryOnly: true as const,
  symbolicExecution: true as const,
  projectionNote:
    "Operational continuity map layers are symbolic stability / cadence densities — not surveyed geography or dispatch geometry.",
  projectionLabelFr: "Projection continuité symbolique — non géographique réelle",
};

export type GeoFC = { type: "FeatureCollection"; features: unknown[] };

function hash01(s: string, salt: string): number {
  let h = 0;
  const x = `${s}::${salt}`;
  for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export function buildIndustrialOperationalContinuityCanvasGeo(bundle: IndustrialOperationalContinuityBundle | null): {
  zones: GeoFC;
  routes: GeoFC;
  source: "industrial_operational_continuity_bundle" | "silent_empty_state";
  detail: string;
} & typeof INDUSTRIAL_OPERATIONAL_CONTINUITY_SYMBOLIC {
  if (!bundle?.version || bundle.policy === "DISABLED") {
    return {
      zones: { type: "FeatureCollection", features: [] },
      routes: { type: "FeatureCollection", features: [] },
      source: "silent_empty_state",
      detail: "Industrial operational continuity unavailable or disabled — map cleared.",
      ...INDUSTRIAL_OPERATIONAL_CONTINUITY_SYMBOLIC,
    };
  }

  const bbox = DEMO_OPERATIONAL_BUNDLE.bbox;
  const spanLon = bbox.east - bbox.west;
  const spanLat = bbox.north - bbox.south;
  const zoneFeatures: unknown[] = [];
  const routeFeatures: unknown[] = [];

  for (let i = 0; i < bundle.stabilityStates.length; i++) {
    const s = bundle.stabilityStates[i]!;
    const u = hash01(s.stateId, `st${i}`);
    const lon = bbox.west + spanLon * (0.1 + u * 0.8);
    const lat = bbox.south + spanLat * (0.12 + u * 0.76);
    const r = 0.018 + s.continuityScore * 0.055;
    zoneFeatures.push({
      type: "Feature",
      properties: {
        layer: "stability_state_density",
        stateType: s.stateType,
        continuityScore: s.continuityScore,
        geometryMode: INDUSTRIAL_OPERATIONAL_CONTINUITY_SYMBOLIC.geometryMode,
      },
      geometry: { type: "Point", coordinates: [lon, lat] },
    });
    routeFeatures.push({
      type: "Feature",
      properties: { layer: "continuity_corridor_symbolic", corridorIdx: i % Math.max(1, bundle.continuityCorridors.length) },
      geometry: {
        type: "LineString",
        coordinates: [
          [lon, lat],
          [lon + r, lat + r * 0.62],
        ],
      },
    });
  }

  return {
    zones: { type: "FeatureCollection", features: zoneFeatures },
    routes: { type: "FeatureCollection", features: routeFeatures },
    source: "industrial_operational_continuity_bundle",
    detail: `Continuité · ${bundle.stabilityStates.length} état(s) · ${bundle.continuityPressures.length} pression(s) · ${bundle.continuityCorridors.length} corridor(s) · ${bundle.cadenceSignals.length} signal(x) cadence`,
    ...INDUSTRIAL_OPERATIONAL_CONTINUITY_SYMBOLIC,
  };
}

export function industrialOperationalContinuityLabeledFallback(reason: string) {
  const geo = buildIndustrialOperationalContinuityCanvasGeo(null);
  return {
    ...geo,
    source: "silent_empty_state" as const,
    detail: reason,
  };
}
