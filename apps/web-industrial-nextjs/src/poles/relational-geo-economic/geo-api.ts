import type {
  GeoEconomicCriticalZonesDto,
  GeoEconomicExpansionOverviewDto,
  GeoEconomicPressureDto,
  GeoEconomicPropagationDto,
  GeoEconomicZoneDto,
} from "@venext/shared-contracts";

const BFF_PREFIX = "/api/relational-geo-economic";

function qs(organizationId: string) {
  return new URLSearchParams({ organizationId }).toString();
}

export type GeoZonesListResponse = { zones: GeoEconomicZoneDto[] };

export async function fetchGeoZones(
  organizationId: string,
): Promise<{ ok: true; data: GeoZonesListResponse } | { ok: false }> {
  const res = await fetch(`${BFF_PREFIX}/v1/relational-geo-economic/zones?${qs(organizationId)}`, {
    cache: "no-store",
  });
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchGeoPressureMap(
  organizationId: string,
): Promise<{ ok: true; data: GeoEconomicPressureDto } | { ok: false }> {
  const res = await fetch(`${BFF_PREFIX}/v1/relational-geo-economic/pressure-map?${qs(organizationId)}`, {
    cache: "no-store",
  });
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchGeoPropagationMap(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: GeoEconomicPropagationDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-geo-economic/propagation-map/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchGeoExpansionOverview(
  organizationId: string,
): Promise<{ ok: true; data: GeoEconomicExpansionOverviewDto } | { ok: false }> {
  const res = await fetch(`${BFF_PREFIX}/v1/relational-geo-economic/expansion-overview?${qs(organizationId)}`, {
    cache: "no-store",
  });
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchGeoCriticalZones(
  organizationId: string,
): Promise<{ ok: true; data: GeoEconomicCriticalZonesDto } | { ok: false }> {
  const res = await fetch(`${BFF_PREFIX}/v1/relational-geo-economic/critical-zones?${qs(organizationId)}`, {
    cache: "no-store",
  });
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}
