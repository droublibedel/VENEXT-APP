import type {
  RelationalStrategicMemoryActionResponseDto,
  RelationalStrategicMemoryListDto,
  RelationalStrategicMemoryOverviewDto,
} from "@venext/shared-contracts";

const BFF_PREFIX = "/api/relational-strategic-memory";

function qs(org: string, extra?: Record<string, string>) {
  const p = new URLSearchParams({ organizationId: org, ...extra });
  return p.toString();
}

export async function fetchMemories(
  organizationId: string,
  relationshipId?: string,
): Promise<{ ok: true; data: RelationalStrategicMemoryListDto } | { ok: false }> {
  const q = qs(organizationId, relationshipId ? { relationshipId } : undefined);
  const res = await fetch(`${BFF_PREFIX}/v1/relational-strategic-memory/memories?${q}`, { cache: "no-store" });
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalStrategicMemoryListDto };
}

export async function fetchMemoryOverview(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: RelationalStrategicMemoryOverviewDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-strategic-memory/overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalStrategicMemoryOverviewDto };
}

export async function reuseMemory(
  organizationId: string,
  memoryId: string,
  reuseContext: string,
): Promise<{ ok: true; data: RelationalStrategicMemoryActionResponseDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-strategic-memory/memories/${encodeURIComponent(memoryId)}/reuse?${qs(organizationId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reuseContext }),
    },
  );
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalStrategicMemoryActionResponseDto };
}
