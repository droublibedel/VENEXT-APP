import type { MarketingActivationBundleResponse } from "@venext/shared-contracts";

import { DEMO_OPERATIONAL_BUNDLE } from "../demo/demo-operational-static";

export type GeoFC = { type: "FeatureCollection"; features: unknown[] };

export type MarketingActivationCanvasSource = "marketing_activation_bundle" | "demo_operational_fallback";

/**
 * Instruction 13A — links operational canvas heat to `/marketing-activation/bundle` opportunity cells.
 * Preserves logistics routes demo layer; zones are synthetic GeoJSON when bundle cells exist.
 */
export function buildMarketingActivationCanvasGeo(bundle: MarketingActivationBundleResponse | null): {
  zones: GeoFC;
  routes: GeoFC;
  source: MarketingActivationCanvasSource;
  detail: string;
} {
  const cells = bundle?.opportunityMap?.cells ?? [];
  const mode = bundle?.opportunityMap?.mode;
  if (!cells.length || !bundle || !mode) {
    return {
      zones: DEMO_OPERATIONAL_BUNDLE.zones as GeoFC,
      routes: DEMO_OPERATIONAL_BUNDLE.routes as GeoFC,
      source: "demo_operational_fallback",
      detail: "Demo-operational corridors (bundle missing or empty opportunity cells).",
    };
  }

  const bbox = DEMO_OPERATIONAL_BUNDLE.bbox;
  const spanLon = bbox.east - bbox.west;
  const spanLat = bbox.north - bbox.south;
  const grid = 5;
  const features = cells.map((cell, i) => {
    const col = i % grid;
    const row = Math.floor(i / grid);
    const u = (col + 0.35) / (grid + 1);
    const v = (row + 0.25) / (grid + 1);
    const lon = bbox.west + spanLon * u;
    const lat = bbox.south + spanLat * v;
    const dw = spanLon * 0.08;
    const dh = spanLat * 0.08;
    return {
      type: "Feature" as const,
      properties: {
        tension: cell.heat,
        label: `${cell.label} · ${mode}`,
      },
      geometry: {
        type: "Polygon" as const,
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
    };
  });

  return {
    zones: { type: "FeatureCollection", features },
    routes: DEMO_OPERATIONAL_BUNDLE.routes as GeoFC,
    source: "marketing_activation_bundle",
    detail: `Live bundle — opportunity map mode "${mode}" · ${cells.length} cell(s).`,
  };
}
