import type {
  RelationalEconomicClusterListDto,
  RelationalEconomicGraphOverviewDto,
  RelationalEconomicPropagationDto,
  RelationalEconomicSignalListDto,
} from "@venext/shared-contracts";

const BFF_PREFIX = "/api/relational-economic-signal-graph";

function qs(organizationId: string, extra?: Record<string, string | undefined>) {
  return new URLSearchParams({ organizationId, ...extra }).toString();
}

export async function fetchSignals(
  organizationId: string,
  relationshipId?: string,
): Promise<{ ok: true; data: RelationalEconomicSignalListDto } | { ok: false }> {
  const q = qs(organizationId, relationshipId ? { relationshipId } : undefined);
  const res = await fetch(`${BFF_PREFIX}/v1/relational-economic-signal-graph/signals?${q}`, { cache: "no-store" });
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchGraphOverview(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: RelationalEconomicGraphOverviewDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-signal-graph/graph-overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchPropagation(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: RelationalEconomicPropagationDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-signal-graph/propagation/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchClusters(
  organizationId: string,
  relationshipId?: string,
): Promise<{ ok: true; data: RelationalEconomicClusterListDto } | { ok: false }> {
  const q = qs(organizationId, relationshipId ? { relationshipId } : undefined);
  const res = await fetch(`${BFF_PREFIX}/v1/relational-economic-signal-graph/clusters?${q}`, { cache: "no-store" });
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function archiveSignal(
  organizationId: string,
  nodeId: string,
  archiveReason: string,
): Promise<{ ok: boolean }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-signal-graph/signals/${encodeURIComponent(nodeId)}/archive?${qs(organizationId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ archiveReason }),
    },
  );
  return { ok: res.ok };
}
