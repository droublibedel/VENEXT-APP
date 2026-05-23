import type {
  CriticalCorridorDto,
  DependencyMapDto,
  FragilityZonesDto,
  PressureOverviewDto,
  PropagationMapDto,
} from "@venext/shared-contracts";

const BFF_PREFIX = "/api/relational-economic-pressure";

function qs(organizationId: string) {
  return new URLSearchParams({ organizationId }).toString();
}

export async function fetchPressureOverview(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: PressureOverviewDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-pressure/pressure-overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchDependencyMap(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: DependencyMapDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-pressure/dependency-map/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchCriticalCorridorsPressure(
  organizationId: string,
): Promise<{ ok: true; data: { corridors: CriticalCorridorDto[] } } | { ok: false }> {
  const res = await fetch(`${BFF_PREFIX}/v1/relational-economic-pressure/critical-corridors?${qs(organizationId)}`, {
    cache: "no-store",
  });
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchFragilityZones(
  organizationId: string,
): Promise<{ ok: true; data: FragilityZonesDto } | { ok: false }> {
  const res = await fetch(`${BFF_PREFIX}/v1/relational-economic-pressure/fragility-zones?${qs(organizationId)}`, {
    cache: "no-store",
  });
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchPropagationMapPressure(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: PropagationMapDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-pressure/propagation-map/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}
