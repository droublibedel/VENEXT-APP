const BFF_PREFIX = "/api/relational-economic-sovereignty";

function qs(organizationId: string) {
  return new URLSearchParams({ organizationId }).toString();
}

export async function fetchSovereigntyOverview(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-sovereignty/sovereignty-overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchSovereigntyCaptivityMap(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-sovereignty/captivity-map/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchSovereigntyResilienceAutonomy(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-sovereignty/resilience-autonomy/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchSovereigntyDashboard(organizationId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-sovereignty/sovereignty-dashboard?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchAutonomyDistribution(organizationId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-sovereignty/autonomy-distribution?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchSystemicCaptivity(organizationId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-sovereignty/systemic-captivity?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchDependencyConcentration(organizationId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-sovereignty/dependency-concentration?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}
