const BFF_PREFIX = "/api/relational-sector-intelligence";

function qs(organizationId: string) {
  return new URLSearchParams({ organizationId }).toString();
}

export async function fetchSectorOverview(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-sector-intelligence/sector-overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchSectorMarketStructure(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-sector-intelligence/market-structure/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchSectorPropagationMap(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-sector-intelligence/propagation-map/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchSectorPressureZones(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-sector-intelligence/pressure-zones/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchSectorExpansionOpportunities(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-sector-intelligence/expansion-opportunities/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchSectorDependencyMap(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-sector-intelligence/dependency-map/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchSectorSystemicRisk(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-sector-intelligence/systemic-sector-risk/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}
