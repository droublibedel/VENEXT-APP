const BFF_PREFIX = "/api/relational-economic-stabilization";

function qs(organizationId: string) {
  return `organizationId=${encodeURIComponent(organizationId)}`;
}

export async function fetchStabilizationOverview(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-stabilization/stabilization-overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return { ok: res.ok, data: res.ok ? await res.json() : null };
}
