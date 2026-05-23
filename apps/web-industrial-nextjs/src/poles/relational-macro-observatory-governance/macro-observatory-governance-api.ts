const BFF_PREFIX = "/api/relational-macro-observatory-governance";

function qs(organizationId: string) {
  return `organizationId=${encodeURIComponent(organizationId)}`;
}

export async function fetchMacroObservatoryGovernanceOverview(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-macro-observatory-governance/macro-observatory-governance-overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return { ok: res.ok, data: res.ok ? await res.json() : null };
}
