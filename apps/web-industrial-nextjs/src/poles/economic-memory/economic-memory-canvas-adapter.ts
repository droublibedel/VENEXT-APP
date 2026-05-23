import type { EconomicMemoryBundle } from "@venext/shared-contracts";

import { DEMO_OPERATIONAL_BUNDLE } from "../demo/demo-operational-static";

export type GeoFC = { type: "FeatureCollection"; features: unknown[] };

export const ECONOMIC_MEMORY_SYMBOLIC_PROJECTION = {
  geometryMode: "SYMBOLIC_PROJECTION" as const,
  realGeography: false as const,
  projectionNote:
    "Economic memory map layers are symbolic densities derived from stored propagation history — not surveyed geography.",
  projectionLabelFr: "Projection historique symbolique — non géographique réelle",
};

function hash01(s: string, salt: string): number {
  let h = 0;
  const x = `${s}::${salt}`;
  for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export function buildEconomicMemoryCanvasGeo(bundle: EconomicMemoryBundle | null): {
  zones: GeoFC;
  routes: GeoFC;
  source: "economic_memory_bundle" | "silent_empty_state";
  detail: string;
} & typeof ECONOMIC_MEMORY_SYMBOLIC_PROJECTION {
  if (!bundle?.version || bundle.policy === "DISABLED") {
    return {
      zones: { type: "FeatureCollection", features: [] },
      routes: { type: "FeatureCollection", features: [] },
      source: "silent_empty_state",
      detail: "Economic memory unavailable or disabled — map cleared.",
      ...ECONOMIC_MEMORY_SYMBOLIC_PROJECTION,
    };
  }

  const bbox = DEMO_OPERATIONAL_BUNDLE.bbox;
  const spanLon = bbox.east - bbox.west;
  const spanLat = bbox.north - bbox.south;
  const zoneFeatures: unknown[] = [];
  const routeFeatures: unknown[] = [];

  for (let i = 0; i < bundle.crisisSignatures.length; i++) {
    const sig = bundle.crisisSignatures[i]!;
    const u = hash01(sig.id, `sig${i}`);
    const lon = bbox.west + spanLon * (0.1 + u * 0.8);
    const lat = bbox.south + spanLat * (0.12 + u * 0.55);
    const r = 0.02 + sig.systemicRisk * 0.05;
    zoneFeatures.push({
      type: "Feature",
      properties: {
        layer: "crisis_signature_density",
        signatureCode: sig.signatureCode,
        systemicRisk: sig.systemicRisk,
        geometryMode: ECONOMIC_MEMORY_SYMBOLIC_PROJECTION.geometryMode,
      },
      geometry: { type: "Point", coordinates: [lon, lat] },
    });
    routeFeatures.push({
      type: "Feature",
      properties: { layer: "memory_corridor_echo", signatureCode: sig.signatureCode },
      geometry: {
        type: "LineString",
        coordinates: [
          [lon, lat],
          [lon + r, lat + r * 0.8],
        ],
      },
    });
  }

  for (let i = 0; i < bundle.territoryHistoryPreview.length; i++) {
    const row = bundle.territoryHistoryPreview[i]!;
    if (!row.territory) continue;
    const u = hash01(row.id, `th${i}`);
    const lon = bbox.west + spanLon * (0.08 + u * 0.84);
    const lat = bbox.south + spanLat * (0.08 + u * 0.84);
    zoneFeatures.push({
      type: "Feature",
      properties: { layer: "territory_memory", territory: row.territory, eventType: row.eventType },
      geometry: { type: "Point", coordinates: [lon, lat] },
    });
  }

  return {
    zones: { type: "FeatureCollection", features: zoneFeatures },
    routes: { type: "FeatureCollection", features: routeFeatures },
    source: "economic_memory_bundle",
    detail: `Memory bundle · ${bundle.crisisSignatures.length} signature(s) · ${bundle.propagationHistoryPreview.length} history row(s)`,
    ...ECONOMIC_MEMORY_SYMBOLIC_PROJECTION,
  };
}

export function economicMemoryLabeledFallback(detail: string): {
  zones: GeoFC;
  routes: GeoFC;
  source: "economic_memory_demo_fallback";
  detail: string;
} & typeof ECONOMIC_MEMORY_SYMBOLIC_PROJECTION {
  const z = DEMO_OPERATIONAL_BUNDLE.zones as GeoFC;
  const r = DEMO_OPERATIONAL_BUNDLE.routes as GeoFC;
  return {
    zones: { type: "FeatureCollection", features: z.features?.slice(0, 5) ?? [] },
    routes: { type: "FeatureCollection", features: r.features?.slice(0, 3) ?? [] },
    source: "economic_memory_demo_fallback",
    detail,
    ...ECONOMIC_MEMORY_SYMBOLIC_PROJECTION,
  };
}
