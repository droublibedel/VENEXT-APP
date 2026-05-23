import type {
  RelationalOperationalSimulationActionResponseDto,
  RelationalOperationalSimulationListDto,
  RelationalOperationalSimulationOverviewDto,
  RelationalOperationalSimulationTypeDto,
} from "@venext/shared-contracts";

const BFF_PREFIX = "/api/relational-operational-simulation";

function qs(org: string, extra?: Record<string, string>) {
  const p = new URLSearchParams({ organizationId: org, ...extra });
  return p.toString();
}

export async function fetchSimulations(
  organizationId: string,
  relationshipId?: string,
): Promise<{ ok: true; data: RelationalOperationalSimulationListDto } | { ok: false }> {
  const q = qs(organizationId, relationshipId ? { relationshipId } : undefined);
  const res = await fetch(`${BFF_PREFIX}/v1/relational-operational-simulation/simulations?${q}`, { cache: "no-store" });
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalOperationalSimulationListDto };
}

export async function fetchSimulationOverview(
  organizationId: string,
  relationshipId: string,
): Promise<{ ok: true; data: RelationalOperationalSimulationOverviewDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-operational-simulation/overview/${encodeURIComponent(relationshipId)}?${qs(organizationId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalOperationalSimulationOverviewDto };
}

export async function runSimulation(
  organizationId: string,
  relationshipId: string,
  simulationType: RelationalOperationalSimulationTypeDto,
): Promise<{ ok: true; data: RelationalOperationalSimulationActionResponseDto } | { ok: false }> {
  const res = await fetch(
    `${BFF_PREFIX}/v1/relational-operational-simulation/simulations/run?${qs(organizationId, { relationshipId })}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ simulationType, stressMultiplier: 1 }),
    },
  );
  if (!res.ok) return { ok: false };
  return { ok: true, data: (await res.json()) as RelationalOperationalSimulationActionResponseDto };
}
