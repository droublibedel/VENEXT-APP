import type { SupplyLogisticsBundleResponse } from "@venext/shared-contracts";

import { DEMO_OPERATIONAL_BUNDLE } from "../demo/demo-operational-static";

export type GeoFC = { type: "FeatureCollection"; features: unknown[] };

export type SupplyLogisticsCanvasSource =
  | "supply_logistics_bundle"
  | "supply_logistics_api_fallback"
  | "silent_empty_state";

function hash01(s: string, salt: string): number {
  let h = 0;
  const x = `${s}::${salt}`;
  for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

/**
 * Instruction 15A — map layers from supply-logistics bundle (territory, routes, hub, delay, risk).
 * Does not substitute silent demo-operational geometry when bundle is present.
 */
export function buildSupplyLogisticsCanvasGeo(bundle: SupplyLogisticsBundleResponse | null): {
  zones: GeoFC;
  routes: GeoFC;
  source: SupplyLogisticsCanvasSource;
  detail: string;
} {
  if (!bundle?.version) {
    return {
      zones: { type: "FeatureCollection", features: [] },
      routes: { type: "FeatureCollection", features: [] },
      source: "silent_empty_state",
      detail: "No bundle — map cleared (Instruction 15A: no silent demo substitution).",
    };
  }

  const tf = bundle.territoryFlow;
  const rt = bundle.routes;
  const wh = bundle.warehousePressure;
  const dr = bundle.delayRadar;
  const risk = bundle.riskMatrix;
  const bbox = DEMO_OPERATIONAL_BUNDLE.bbox;
  const spanLon = bbox.east - bbox.west;
  const spanLat = bbox.north - bbox.south;

  const zoneFeatures: unknown[] = [];
  const routeFeatures: unknown[] = [];

  if (tf.policy === "ACTIVE" && tf.cells.length) {
    for (let i = 0; i < tf.cells.length; i++) {
      const cell = tf.cells[i]!;
      const u = hash01(cell.territoryKey, `z${i}`);
      const v = hash01(cell.territoryKey, `y${i}`);
      const lon = bbox.west + spanLon * (0.1 + u * 0.78);
      const lat = bbox.south + spanLat * (0.1 + v * 0.78);
      const dw = spanLon * 0.055;
      const dh = spanLat * 0.055;
      zoneFeatures.push({
        type: "Feature",
        properties: {
          tension: cell.flowPressure,
          label: `${cell.label} · territory_pressure`,
          layer: "territory_pressure",
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

  if (wh.policy === "ACTIVE" && wh.rows.length) {
    wh.rows.forEach((row, i) => {
      const u = hash01(row.hubCode, `hub${i}`);
      const lon = bbox.west + spanLon * (0.04 + u * 0.22);
      const lat = bbox.south + spanLat * (0.04 + (i * 0.06) % 0.2);
      const dw = spanLon * 0.04;
      const dh = spanLat * 0.04;
      zoneFeatures.push({
        type: "Feature",
        properties: {
          tension: row.saturation,
          label: `${row.label} · warehouse_pressure (${row.source})`,
          layer: "warehouse_pressure",
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
    });
  }

  if (dr.policy === "ACTIVE" && dr.hotspots.length) {
    dr.hotspots.forEach((hot, i) => {
      const u = hash01(hot.key, `d${i}`);
      const lon = bbox.west + spanLon * (0.55 + u * 0.35);
      const lat = bbox.south + spanLat * (0.35 + hash01(hot.key, `d2${i}`) * 0.45);
      zoneFeatures.push({
        type: "Feature",
        properties: {
          tension: hot.intensity,
          label: `${hot.label} · delay_radar`,
          layer: "delay_radar",
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [lon, lat],
              [lon + spanLon * 0.03, lat],
              [lon + spanLon * 0.03, lat + spanLat * 0.03],
              [lon, lat + spanLat * 0.03],
              [lon, lat],
            ],
          ],
        },
      });
    });
  }

  if (risk.policy === "ACTIVE" && risk.rows.length) {
    risk.rows.forEach((row, i) => {
      const sev = row.severity === "critical" ? 0.95 : row.severity === "elevated" ? 0.75 : 0.5;
      const u = hash01(row.id, `r${i}`);
      const lon = bbox.west + spanLon * (0.72 + (u % 0.2));
      const lat = bbox.south + spanLat * (0.08 + (i * 0.05) % 0.2);
      zoneFeatures.push({
        type: "Feature",
        properties: {
          tension: sev,
          label: `${row.id} · fulfillment_risk (${row.severity})`,
          layer: "fulfillment_risk",
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [lon, lat],
              [lon + spanLon * 0.035, lat],
              [lon + spanLon * 0.035, lat + spanLat * 0.035],
              [lon, lat + spanLat * 0.035],
              [lon, lat],
            ],
          ],
        },
      });
    });
  }

  if (rt.policy === "ACTIVE" && rt.rows.length) {
    rt.rows.forEach((row, i) => {
      const parts = row.corridorKey.split("→");
      const h0 = hash01(parts[0] ?? "a", `c0${i}`);
      const h1 = hash01(parts[1] ?? "b", `c1${i}`);
      const lon0 = bbox.west + spanLon * (0.12 + h0 * 0.75);
      const lat0 = bbox.south + spanLat * (0.12 + h0 * 0.55);
      const lon1 = bbox.west + spanLon * (0.12 + h1 * 0.75);
      const lat1 = bbox.south + spanLat * (0.12 + h1 * 0.55);
      routeFeatures.push({
        type: "Feature",
        properties: {
          etaRisk: row.instability,
          anomaly: row.delayCorridor,
          label: `${row.label} · route_congestion`,
          layer: "route_congestion",
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [lon0, lat0],
            [(lon0 + lon1) / 2, (lat0 + lat1) / 2],
            [lon1, lat1],
          ],
        },
      });
    });
  }

  if (zoneFeatures.length === 0 && routeFeatures.length === 0) {
    return {
      zones: { type: "FeatureCollection", features: [] },
      routes: { type: "FeatureCollection", features: [] },
      source: "silent_empty_state",
      detail: "Bundle present but no drawable logistics layers (policies or sparse data).",
    };
  }

  return {
    zones: { type: "FeatureCollection", features: zoneFeatures },
    routes: { type: "FeatureCollection", features: routeFeatures },
    source: "supply_logistics_bundle",
    detail: `Supply bundle v${bundle.version} — territory, warehouse, delay, risk, routes (Instruction 15A).`,
  };
}

export function labeledDemoOperationalFallback(detail: string): {
  zones: GeoFC;
  routes: GeoFC;
  source: SupplyLogisticsCanvasSource;
  detail: string;
} {
  return {
    zones: DEMO_OPERATIONAL_BUNDLE.zones as GeoFC,
    routes: DEMO_OPERATIONAL_BUNDLE.routes as GeoFC,
    source: "supply_logistics_api_fallback",
    detail,
  };
}
