import type { IndustrialSituationRoomBundle } from "@venext/shared-contracts";

import { DEMO_OPERATIONAL_BUNDLE } from "../demo/demo-operational-static";

export const INDUSTRIAL_SITUATION_ROOM_SYMBOLIC = {
  geometryMode: "SYMBOLIC_PROJECTION" as const,
  realGeography: false as const,
  advisoryOnly: true as const,
  symbolicExecution: true as const,
  projectionNote:
    "Industrial situation room map layers are symbolic crisis-cell densities — not surveyed geography or dispatch geometry.",
  projectionLabelFr: "Projection situation symbolique — non géographique réelle",
};

export type GeoFC = { type: "FeatureCollection"; features: unknown[] };

function hash01(s: string, salt: string): number {
  let h = 0;
  const x = `${s}::${salt}`;
  for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export function buildIndustrialSituationRoomCanvasGeo(bundle: IndustrialSituationRoomBundle | null): {
  zones: GeoFC;
  routes: GeoFC;
  source: "industrial_situation_room_bundle" | "silent_empty_state";
  detail: string;
} & typeof INDUSTRIAL_SITUATION_ROOM_SYMBOLIC {
  if (!bundle?.version || bundle.policy === "DISABLED") {
    return {
      zones: { type: "FeatureCollection", features: [] },
      routes: { type: "FeatureCollection", features: [] },
      source: "silent_empty_state",
      detail: "Industrial situation room unavailable or disabled — map cleared.",
      ...INDUSTRIAL_SITUATION_ROOM_SYMBOLIC,
    };
  }

  const bbox = DEMO_OPERATIONAL_BUNDLE.bbox;
  const spanLon = bbox.east - bbox.west;
  const spanLat = bbox.north - bbox.south;
  const zoneFeatures: unknown[] = [];
  const routeFeatures: unknown[] = [];

  for (let i = 0; i < bundle.situationCells.length; i++) {
    const c = bundle.situationCells[i]!;
    const u = hash01(c.cellId, `cell${i}`);
    const lon = bbox.west + spanLon * (0.12 + u * 0.78);
    const lat = bbox.south + spanLat * (0.14 + u * 0.72);
    const r = 0.02 + c.urgency * 0.05;
    zoneFeatures.push({
      type: "Feature",
      properties: {
        layer: "situation_cell_density",
        cellType: c.cellType,
        urgency: c.urgency,
        geometryMode: INDUSTRIAL_SITUATION_ROOM_SYMBOLIC.geometryMode,
      },
      geometry: { type: "Point", coordinates: [lon, lat] },
    });
    routeFeatures.push({
      type: "Feature",
      properties: { layer: "mission_corridor_symbolic", missionCode: bundle.operationalMissions[i]?.missionCode },
      geometry: {
        type: "LineString",
        coordinates: [
          [lon, lat],
          [lon + r, lat + r * 0.65],
        ],
      },
    });
  }

  return {
    zones: { type: "FeatureCollection", features: zoneFeatures },
    routes: { type: "FeatureCollection", features: routeFeatures },
    source: "industrial_situation_room_bundle",
    detail: `Situation room · ${bundle.situationCells.length} cellule(s) · ${bundle.operationalMissions.length} mission(s) · ${bundle.criticalDependencies.length} dépendance(s) critique(s)`,
    ...INDUSTRIAL_SITUATION_ROOM_SYMBOLIC,
  };
}

export function industrialSituationRoomLabeledFallback(reason: string) {
  const geo = buildIndustrialSituationRoomCanvasGeo(null);
  return {
    ...geo,
    source: "silent_empty_state" as const,
    detail: reason,
  };
}
