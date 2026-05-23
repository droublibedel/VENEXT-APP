import type {
  RelationalEconomicCommandCenterOverviewDto,
  RelationalEconomicCommandCenterSnapshotDto,
  RelationalEconomicCommandCenterSnapshotListDto,
  RelationalEconomicCriticalCorridorListDto,
  RelationalEconomicCommandCenterClusterListDto,
  RelationalEconomicSystemicViewDto,
} from "@venext/shared-contracts";

const BFF_PREFIX = "/api/relational-economic-command-center";

function qs(organizationId: string, extra?: Record<string, string | undefined>) {
  return new URLSearchParams({ organizationId, ...extra }).toString();
}

export async function fetchCommandOverview(
  organizationId: string,
): Promise<{ ok: true; data: RelationalEconomicCommandCenterOverviewDto } | { ok: false }> {
  const res = await fetch(`${BFF_PREFIX}/v1/relational-economic-command-center/overview?${qs(organizationId)}`, {
    cache: "no-store",
  });
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchSystemicView(
  organizationId: string,
  relationshipId?: string | null,
): Promise<{ ok: true; data: RelationalEconomicSystemicViewDto } | { ok: false }> {
  const q = qs(organizationId, relationshipId ? { relationshipId } : undefined);
  const res = await fetch(`${BFF_PREFIX}/v1/relational-economic-command-center/systemic-view?${q}`, {
    cache: "no-store",
  });
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchSnapshots(
  organizationId: string,
  relationshipId?: string | null,
): Promise<{ ok: true; data: RelationalEconomicCommandCenterSnapshotListDto } | { ok: false }> {
  const q = qs(organizationId, relationshipId ? { relationshipId } : undefined);
  const res = await fetch(`${BFF_PREFIX}/v1/relational-economic-command-center/snapshots?${q}`, {
    cache: "no-store",
  });
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchSnapshotDetail(
  organizationId: string,
  snapshotId: string,
): Promise<{ ok: true; data: RelationalEconomicCommandCenterSnapshotDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-command-center/snapshots/${encodeURIComponent(snapshotId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchCriticalCorridors(
  organizationId: string,
): Promise<{ ok: true; data: RelationalEconomicCriticalCorridorListDto } | { ok: false }> {
  const res = await fetch(`${BFF_PREFIX}/v1/relational-economic-command-center/critical-corridors?${qs(organizationId)}`, {
    cache: "no-store",
  });
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function fetchClusterPressure(
  organizationId: string,
  relationshipId?: string | null,
): Promise<{ ok: true; data: RelationalEconomicCommandCenterClusterListDto } | { ok: false }> {
  const q = qs(organizationId, relationshipId ? { relationshipId } : undefined);
  const res = await fetch(`${BFF_PREFIX}/v1/relational-economic-command-center/cluster-pressure?${q}`, {
    cache: "no-store",
  });
  return res.ok ? { ok: true, data: await res.json() } : { ok: false };
}

export async function archiveSnapshot(
  organizationId: string,
  snapshotId: string,
  archiveReason: string,
): Promise<{ ok: boolean }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-economic-command-center/snapshots/${encodeURIComponent(snapshotId)}/archive?${qs(organizationId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ archiveReason }),
    },
  );
  return { ok: res.ok };
}
