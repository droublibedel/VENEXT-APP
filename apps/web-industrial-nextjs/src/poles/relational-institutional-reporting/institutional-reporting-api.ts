const BFF_PREFIX = "/api/relational-institutional-reporting";

function qs(organizationId: string) {
  return `organizationId=${encodeURIComponent(organizationId)}`;
}

export async function fetchInstitutionalReportingOverview(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-institutional-reporting/institutional-reporting-overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return { ok: res.ok, data: res.ok ? await res.json() : null };
}
