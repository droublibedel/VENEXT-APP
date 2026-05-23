import { ABIDJAN_COMMERCIAL_CLUSTER } from "./ci-cities.js";

function norm(c?: string): string {
  return (c ?? "").trim().toLowerCase();
}

function inAbidjanCluster(city: string): boolean {
  const n = norm(city);
  return ABIDJAN_COMMERCIAL_CLUSTER.some((z) => n.includes(z.toLowerCase()) || z.toLowerCase().includes(n));
}

/** Score 0–100 pour feed / suggestions / sponsorisé géographique. */
export function computeGeographicProximityScore(viewerCity?: string, targetCity?: string): number {
  const v = norm(viewerCity);
  const t = norm(targetCity);
  if (!v || !t) return 20;
  if (v === t) return 100;
  if (inAbidjanCluster(v) && inAbidjanCluster(t)) return 78;
  if (v.includes("abidjan") || t.includes("abidjan")) return 65;
  return 25;
}

export const MapEconomicLayerCompatibility = {
  supportsGpsLayer: true,
  supportsHeatmap: true,
  supportsTerritorialIntelligence: true,
  prepareIndustrialPoleIntegration: () => ({ ready: true, version: "v1-stub" }),
};
