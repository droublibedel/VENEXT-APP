const BFF_PREFIX = "/api/relational-economic-monitoring";

function qs(organizationId: string) {
  return `organizationId=${encodeURIComponent(organizationId)}`;
}

export async function fetchMonitoringOverview(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-monitoring/monitoring-overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return { ok: res.ok, data: res.ok ? await res.json() : null };
}
