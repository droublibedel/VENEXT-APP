const BFF_PREFIX = "/api/relational-economic-continuity";

function qs(organizationId: string) {
  return new URLSearchParams({ organizationId }).toString();
}

export async function fetchContinuityOverview(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-continuity/continuity-overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchContinuityInstabilityMap(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-continuity/instability-map/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchContinuitySystemicPressure(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-continuity/systemic-pressure?${qs(organizationId)}&relationshipId=${encodeURIComponent(relationshipId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}
