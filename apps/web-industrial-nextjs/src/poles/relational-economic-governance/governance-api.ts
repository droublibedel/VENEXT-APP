const BFF_PREFIX = "/api/relational-economic-governance";

function qs(organizationId: string) {
  return `organizationId=${encodeURIComponent(organizationId)}`;
}

export async function fetchGovernanceOverview(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-governance/governance-overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return { ok: res.ok, data: res.ok ? await res.json() : null };
}
