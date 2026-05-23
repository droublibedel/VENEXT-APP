const BFF_PREFIX = "/api/relational-economic-recovery";

function qs(organizationId: string) {
  return new URLSearchParams({ organizationId }).toString();
}

export async function fetchRecoveryOverview(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-recovery/recovery-overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}
