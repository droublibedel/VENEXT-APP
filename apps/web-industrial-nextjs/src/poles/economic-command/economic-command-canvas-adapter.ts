import type { EconomicCommandBundle } from "@venext/shared-contracts";

import { DEMO_OPERATIONAL_BUNDLE } from "../demo/demo-operational-static";

export type GeoFC = { type: "FeatureCollection"; features: unknown[] };

export const ECONOMIC_COMMAND_SYMBOLIC_PROJECTION = {
  geometryMode: "SYMBOLIC_PROJECTION" as const,
  realGeography: false as const,
  advisoryOnly: true as const,
  projectionNote:
    "Economic command map layers are symbolic systemic densities — not surveyed geography or dispatch geometry.",
  projectionLabelFr: "Projection systémique symbolique — non géographique réelle",
};

function hash01(s: string, salt: string): number {
  let h = 0;
  const x = `${s}::${salt}`;
  for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export function buildEconomicCommandCanvasGeo(bundle: EconomicCommandBundle | null): {
  zones: GeoFC;
  routes: GeoFC;
  source: "economic_command_bundle" | "silent_empty_state";
  detail: string;
} & typeof ECONOMIC_COMMAND_SYMBOLIC_PROJECTION {
  if (!bundle?.version || bundle.policy === "DISABLED") {
    return {
      zones: { type: "FeatureCollection", features: [] },
      routes: { type: "FeatureCollection", features: [] },
      source: "silent_empty_state",
      detail: "Economic command unavailable or disabled — map cleared.",
      ...ECONOMIC_COMMAND_SYMBOLIC_PROJECTION,
    };
  }

  const bbox = DEMO_OPERATIONAL_BUNDLE.bbox;
  const spanLon = bbox.east - bbox.west;
  const spanLat = bbox.north - bbox.south;
  const zoneFeatures: unknown[] = [];
  const routeFeatures: unknown[] = [];

  const zones = bundle.pressureZones.slice(0, 10);
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i]!;
    const u = hash01(z.zoneId, `pz${i}`);
    const lon = bbox.west + spanLon * (0.1 + u * 0.8);
    const lat = bbox.south + spanLat * (0.12 + u * 0.7);
    const r = 0.018 + z.pressureScore * 0.055;
    zoneFeatures.push({
      type: "Feature",
      properties: {
        layer: "economic_command_pressure_density",
        zoneId: z.zoneId,
        zoneType: z.zoneType,
        pressureScore: z.pressureScore,
        geometryMode: ECONOMIC_COMMAND_SYMBOLIC_PROJECTION.geometryMode,
      },
      geometry: { type: "Point", coordinates: [lon, lat] },
    });
    routeFeatures.push({
      type: "Feature",
      properties: { layer: "economic_command_arbitration_corridor", systemicWeight: z.systemicWeight },
      geometry: {
        type: "LineString",
        coordinates: [
          [lon, lat],
          [lon + r, lat + r * 0.72],
        ],
      },
    });
  }

  const tens = bundle.silentTensions.slice(0, 6);
  for (let j = 0; j < tens.length; j++) {
    const t = tens[j]!;
    const u = hash01(t.tensionId, `st${j}`);
    const lon = bbox.west + spanLon * (0.15 + u * 0.7);
    const lat = bbox.south + spanLat * (0.2 + u * 0.55);
    zoneFeatures.push({
      type: "Feature",
      properties: {
        layer: "silent_tension_trace",
        tensionType: t.tensionType,
        intensity: t.intensity,
      },
      geometry: { type: "Point", coordinates: [lon, lat] },
    });
  }

  return {
    zones: { type: "FeatureCollection", features: zoneFeatures },
    routes: { type: "FeatureCollection", features: routeFeatures },
    source: "economic_command_bundle",
    detail: `Command bundle · stress global ${bundle.systemStress.globalStress.toFixed(2)} · ${bundle.pressureZones.length} zone(s) · ${bundle.arbitrations.length} arbitrage(s)`,
    ...ECONOMIC_COMMAND_SYMBOLIC_PROJECTION,
  };
}

export function economicCommandLabeledFallback(detail: string): {
  zones: GeoFC;
  routes: GeoFC;
  source: "economic_command_demo_fallback";
  detail: string;
} & typeof ECONOMIC_COMMAND_SYMBOLIC_PROJECTION {
  return {
    zones: { type: "FeatureCollection", features: [] },
    routes: { type: "FeatureCollection", features: [] },
    source: "economic_command_demo_fallback",
    detail,
    ...ECONOMIC_COMMAND_SYMBOLIC_PROJECTION,
  };
}
