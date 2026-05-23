const BFF_PREFIX = "/api/relational-supply-flow";

function qs(organizationId: string) {
  return new URLSearchParams({ organizationId }).toString();
}

export async function fetchSupplyFlowOverview(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-supply-flow/flow-overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchSupplyFlowPressureOverview(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-supply-flow/pressure-overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchSupplyFlowBottlenecks(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-supply-flow/bottlenecks/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchSupplyFlowDependencyMap(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-supply-flow/dependency-map/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchSupplyFlowPropagationMap(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-supply-flow/propagation-map/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}

export async function fetchSupplyFlowCriticalFlows(organizationId: string, relationshipId: string) {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-supply-flow/critical-flows?${qs(organizationId)}&relationshipId=${encodeURIComponent(relationshipId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true as const, data: await res.json() } : { ok: false as const };
}
