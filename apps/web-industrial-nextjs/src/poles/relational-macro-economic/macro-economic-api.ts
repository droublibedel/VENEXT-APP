const BFF_PREFIX = "/api/relational-macro-economic";

function qs(organizationId: string) {
  return new URLSearchParams({ organizationId }).toString();
}

export async function fetchMacroResilienceOverview(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-macro-economic/resilience-overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchMacroFragilityMap(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-macro-economic/fragility-map/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchMacroSystemicPressure(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-macro-economic/systemic-pressure?${qs(organizationId)}&relationshipId=${encodeURIComponent(relationshipId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}
