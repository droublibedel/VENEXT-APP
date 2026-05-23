import type {
  RelationalOperationalOrchestrationActionResponseDto,
  RelationalOperationalOrchestrationListDto,
  RelationalOperationalOrchestrationOverviewDto,
} from "@venext/shared-contracts";

const BFF_PREFIX = "/api/relational-operational-orchestration";

function qs(org: string, extra?: Record<string, string>) {
  const p = new URLSearchParams({ organizationId: org, ...extra });
  return p.toString();
}

export async function fetchOrchestrations(
  organizationId: string,
  relationshipId?: string,
): Promise<{ ok: true; data: RelationalOperationalOrchestrationListDto } | { ok: false }> {
  const q = qs(organizationId, relationshipId ? { relationshipId, openOnly: "true" } : { openOnly: "true" });
  const res = await fetch(`${BFF_PREFIX}/v1/relational-operational-orchestration/orchestrations?${q}`, {
    cache: "no-store",
  });
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalOperationalOrchestrationListDto };
}

export async function fetchOrchestrationOverview(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: RelationalOperationalOrchestrationOverviewDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-operational-orchestration/overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalOperationalOrchestrationOverviewDto };
}

export async function approveOrchestration(
  organizationId: string,
  orchestrationId: string,
): Promise<{ ok: true; data: RelationalOperationalOrchestrationActionResponseDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-operational-orchestration/orchestrations/${encodeURIComponent(orchestrationId)}/approve?${qs(organizationId)}`,
    { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
  );
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalOperationalOrchestrationActionResponseDto };
}

export async function startOrchestration(
  organizationId: string,
  orchestrationId: string,
): Promise<{ ok: true; data: RelationalOperationalOrchestrationActionResponseDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-operational-orchestration/orchestrations/${encodeURIComponent(orchestrationId)}/start?${qs(organizationId)}`,
    { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
  );
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalOperationalOrchestrationActionResponseDto };
}
