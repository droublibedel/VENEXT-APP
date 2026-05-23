import type {
  RelationalOperationalDriftListResponseDto,
  RelationalPredictiveOverviewDto,
  RelationalPredictiveRiskSignalListResponseDto,
} from "@venext/shared-contracts";

const BFF_PREFIX = "/api/relational-predictive-risk";

function qs(org: string, extra?: Record<string, string>) {
  return new URLSearchParams({ organizationId: org, ...extra }).toString();
}

export async function fetchPredictiveSignals(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: RelationalPredictiveRiskSignalListResponseDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-predictive-risk/signals?${qs(organizationId, { relationshipId, unresolvedOnly: "true" })}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalPredictiveRiskSignalListResponseDto };
}

export async function fetchPredictiveOverview(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: RelationalPredictiveOverviewDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-predictive-risk/predictive-overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalPredictiveOverviewDto };
}

export async function fetchDriftSnapshots(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: RelationalOperationalDriftListResponseDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-predictive-risk/drift/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalOperationalDriftListResponseDto };
}
