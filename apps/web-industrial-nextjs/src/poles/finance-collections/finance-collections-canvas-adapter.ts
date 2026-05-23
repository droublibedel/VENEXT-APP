import type { FinanceCollectionsBundleResponse } from "@venext/shared-contracts";

import { DEMO_OPERATIONAL_BUNDLE } from "../demo/demo-operational-static";
export { labeledDemoOperationalFallback } from "../supply-logistics/supply-logistics-canvas-adapter";

export type GeoFC = { type: "FeatureCollection"; features: unknown[] };

function hash01(s: string, salt: string): number {
  let h = 0;
  const x = `${s}::${salt}`;
  for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export function buildFinanceCollectionsCanvasGeo(bundle: FinanceCollectionsBundleResponse | null): {
  zones: GeoFC;
  routes: GeoFC;
  source: "finance_collections_bundle" | "silent_empty_state";
  detail: string;
} {
  if (!bundle?.version) {
    return {
      zones: { type: "FeatureCollection", features: [] },
      routes: { type: "FeatureCollection", features: [] },
      source: "silent_empty_state",
      detail: "No finance bundle — map cleared (Instruction 16).",
    };
  }

  const bbox = DEMO_OPERATIONAL_BUNDLE.bbox;
  const spanLon = bbox.east - bbox.west;
  const spanLat = bbox.north - bbox.south;
  const zoneFeatures: unknown[] = [];
  const pp = bundle.paymentPressure;
  if (pp.policy === "ACTIVE" && pp.overdueTerritories.length) {
    for (let i = 0; i < pp.overdueTerritories.length; i++) {
      const row = pp.overdueTerritories[i]!;
      const u = hash01(row.territoryCode, `f${i}`);
      const v = hash01(row.territoryCode, `g${i}`);
      const lon = bbox.west + spanLon * (0.12 + u * 0.76);
      const lat = bbox.south + spanLat * (0.12 + v * 0.76);
      const dw = spanLon * 0.05;
      const dh = spanLat * 0.05;
      zoneFeatures.push({
        type: "Feature",
        properties: {
          tension: row.liquidityTension,
          label: `${row.territoryCode} · overdue_mass`,
          layer: "finance_territory_pressure",
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
  }

  for (let i = 0; i < bundle.overview.territoryStressTop.length; i++) {
    const code = bundle.overview.territoryStressTop[i]!;
    const u = hash01(code, `s${i}`);
    const v = hash01(code, `t${i}`);
    const lon = bbox.west + spanLon * (0.08 + u * 0.84);
    const lat = bbox.south + spanLat * (0.08 + v * 0.84);
    zoneFeatures.push({
      type: "Feature",
      properties: { label: `${code} · stress_capsule`, layer: "finance_stress_capsule" },
      geometry: { type: "Point", coordinates: [lon, lat] },
    });
  }

  return {
    zones: { type: "FeatureCollection", features: zoneFeatures },
    routes: { type: "FeatureCollection", features: [] },
    source: "finance_collections_bundle",
    detail: `Finance map from bundle · instability ${bundle.overview.financialInstability.toFixed(2)}`,
  };
}
