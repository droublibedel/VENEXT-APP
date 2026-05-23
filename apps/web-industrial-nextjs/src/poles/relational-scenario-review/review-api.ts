import type {
  RelationalScenarioReviewActionResponseDto,
  RelationalScenarioReviewListDto,
  RelationalScenarioReviewOverviewDto,
} from "@venext/shared-contracts";

const BFF_PREFIX = "/api/relational-scenario-review";

function qs(org: string, extra?: Record<string, string>) {
  const p = new URLSearchParams({ organizationId: org, ...extra });
  return p.toString();
}

export async function fetchReviews(
  organizationId: string,
  relationshipId?: string,
): Promise<{ ok: true; data: RelationalScenarioReviewListDto } | { ok: false }> {
  const q = qs(organizationId, relationshipId ? { relationshipId } : undefined);
  const res = await fetch(`${BFF_PREFIX}/v1/relational-scenario-review/reviews?${q}`, { cache: "no-store" });
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalScenarioReviewListDto };
}

export async function fetchReviewOverview(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: RelationalScenarioReviewOverviewDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-scenario-review/overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalScenarioReviewOverviewDto };
}

export async function approveReview(
  organizationId: string,
  reviewId: string,
  decisionSummary: string,
): Promise<{ ok: true; data: RelationalScenarioReviewActionResponseDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-scenario-review/reviews/${encodeURIComponent(reviewId)}/approve?${qs(organizationId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decisionSummary }),
    },
  );
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalScenarioReviewActionResponseDto };
}

export async function rejectReview(
  organizationId: string,
  reviewId: string,
  decisionSummary: string,
  rejectionReason: string,
): Promise<{ ok: true; data: RelationalScenarioReviewActionResponseDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-scenario-review/reviews/${encodeURIComponent(reviewId)}/reject?${qs(organizationId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decisionSummary, rejectionReason }),
    },
  );
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalScenarioReviewActionResponseDto };
}
