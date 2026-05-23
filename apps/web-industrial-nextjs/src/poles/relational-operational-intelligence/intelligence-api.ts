import type {
  RelationalOperationalAlertListResponseDto,
  RelationalOperationalMetricListResponseDto,
  RelationalOperationalRiskOverviewDto,
  RelationalOperationalSlaSnapshotDto,
} from "@venext/shared-contracts";

const BFF_PREFIX = "/api/relational-operational-intelligence";

function qs(org: string, extra?: Record<string, string>) {
  const p = new URLSearchParams({ organizationId: org, ...extra });
  return p.toString();
}

export async function fetchOperationalAlerts(
  organizationId: string,
  relationshipId?: string,
): Promise<{ ok: true; data: RelationalOperationalAlertListResponseDto } | { ok: false }> {
  const q = qs(organizationId, relationshipId ? { relationshipId, unresolvedOnly: "true" } : { unresolvedOnly: "true" });
  const res = await fetch(`${BFF_PREFIX}/v1/relational-operational-intelligence/alerts?${q}`, { cache: "no-store" });
  if (!res.ok) return { ok: false };
  const data = (await res.json()) as RelationalOperationalAlertListResponseDto;
  return { ok: true, data };
}

export async function fetchSlaSnapshot(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: RelationalOperationalSlaSnapshotDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-operational-intelligence/sla-snapshot/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { ok: false };
  const data = (await res.json()) as RelationalOperationalSlaSnapshotDto;
  return { ok: true, data };
}

export async function fetchRiskOverview(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: RelationalOperationalRiskOverviewDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-operational-intelligence/risk-overview?${qs(organizationId, { relationshipId })}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { ok: false };
  const data = (await res.json()) as RelationalOperationalRiskOverviewDto;
  return { ok: true, data };
}

export async function fetchOperationalMetrics(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: RelationalOperationalMetricListResponseDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-operational-intelligence/metrics?${qs(organizationId, { relationshipId })}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { ok: false };
  const data = (await res.json()) as RelationalOperationalMetricListResponseDto;
  return { ok: true, data };
}
