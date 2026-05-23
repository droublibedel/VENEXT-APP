/**
 * Economic scenarios reads go through the **Next.js BFF** (`/api/economic-scenarios/...`), not directly to `/api/core/...`.
 *
 * The BFF attaches actor headers server-side (demo mode, `Authorization`, or `VENEXT_SERVER_ACTOR_*` env).
 * The browser must **not** send `x-venext-user-id` as a fake production identity.
 */
const BFF_PREFIX = "/api/economic-scenarios";

function unwrapSliceEnvelope<T>(body: unknown): T | null {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T | null;
}

export async function fetchEconomicScenariosBundleJson<T>(organizationId: string): Promise<T | null> {
  const url = `${BFF_PREFIX}/v1/economic-scenarios/bundle?organizationId=${encodeURIComponent(organizationId)}`;
  try {
    const r = await fetch(url, { credentials: "include", cache: "no-store" });
    if (r.status === 403 || r.status === 404) return null;
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchEconomicScenariosJson<T>(suffix: string, organizationId: string): Promise<T | null> {
  const base = `${BFF_PREFIX}/v1/economic-scenarios${suffix}`;
  const sep = base.includes("?") ? "&" : "?";
  const url = `${base}${sep}organizationId=${encodeURIComponent(organizationId)}`;
  try {
    const r = await fetch(url, { credentials: "include", cache: "no-store" });
    if (r.status === 403 || r.status === 404) return null;
    if (!r.ok) return null;
    const body = await r.json();
    return unwrapSliceEnvelope<T>(body);
  } catch {
    return null;
  }
}

export type PersistedScenariosAuditResponse = {
  sourceMode: "PERSISTED_SCENARIO_AUDIT";
  organizationId: string;
  rows: Array<{
    id: string;
    scenarioCode: string;
    scenarioType: string;
    triggerType: string;
    severity: string;
    projectedRisk: number;
    stabilizationProbability: number;
    createdAt: string;
    trajectoryCount: number;
    impactCount: number;
  }>;
  page: { limit: number; nextCursor: string | null; hasMore: boolean };
};

export async function fetchPersistedEconomicScenariosAudit(
  organizationId: string,
  opts?: { limit?: number; cursor?: string | null },
): Promise<PersistedScenariosAuditResponse | null> {
  const qs = new URLSearchParams();
  qs.set("organizationId", organizationId);
  qs.set("limit", String(opts?.limit ?? 10));
  if (opts?.cursor) qs.set("cursor", opts.cursor);
  try {
    const r = await fetch(`${BFF_PREFIX}/v1/economic-scenarios/persisted?${qs.toString()}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (r.status === 403 || r.status === 404) return null;
    if (!r.ok) return null;
    return (await r.json()) as PersistedScenariosAuditResponse;
  } catch {
    return null;
  }
}
