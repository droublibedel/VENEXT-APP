import type {
  RelationalOperationalRecommendationActionResponseDto,
  RelationalOperationalRecommendationListDto,
  RelationalOperationalRecommendationOverviewDto,
} from "@venext/shared-contracts";

const BFF_PREFIX = "/api/relational-operational-recommendation";

function qs(org: string, extra?: Record<string, string>) {
  const p = new URLSearchParams({ organizationId: org, ...extra });
  return p.toString();
}

export async function fetchRecommendations(
  organizationId: string,
  relationshipId?: string,
): Promise<{ ok: true; data: RelationalOperationalRecommendationListDto } | { ok: false }> {
  const q = qs(organizationId, relationshipId ? { relationshipId, activeOnly: "true" } : { activeOnly: "true" });
  const res = await fetch(`${BFF_PREFIX}/v1/relational-operational-recommendation/recommendations?${q}`, {
    cache: "no-store",
  });
  if (!res.ok) return { ok: false };
  const data = (await res.json()) as RelationalOperationalRecommendationListDto;
  return { ok: true, data };
}

export async function fetchRecommendationOverview(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: RelationalOperationalRecommendationOverviewDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-operational-recommendation/overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { ok: false };
  const data = (await res.json()) as RelationalOperationalRecommendationOverviewDto;
  return { ok: true, data };
}

export async function acknowledgeRecommendation(
  organizationId: string,
  recommendationId: string,
  notes?: string,
): Promise<{ ok: true; data: RelationalOperationalRecommendationActionResponseDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-operational-recommendation/recommendations/${encodeURIComponent(recommendationId)}/acknowledge?${qs(organizationId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(notes ? { notes } : {}),
    },
  );
  if (!res.ok) return { ok: false };
  const data = (await res.json()) as RelationalOperationalRecommendationActionResponseDto;
  return { ok: true, data };
}
