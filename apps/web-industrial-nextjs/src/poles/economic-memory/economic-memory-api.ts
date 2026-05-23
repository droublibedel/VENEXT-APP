export function economicMemoryActorHeaders(organizationId: string): HeadersInit {
  return {
    "x-venext-user-id": "industrial_pole_operator",
    "x-venext-acting-organization-id": organizationId,
  };
}

export async function fetchEconomicMemoryBundleJson<T>(organizationId: string): Promise<T | null> {
  const url = `/api/core/v1/economic-memory/bundle?organizationId=${encodeURIComponent(organizationId)}`;
  try {
    const r = await fetch(url, { headers: economicMemoryActorHeaders(organizationId), cache: "no-store" });
    if (r.status === 403 || r.status === 404) return null;
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchEconomicMemoryJson<T>(suffix: string, organizationId: string): Promise<T | null> {
  const base = `/api/core/v1/economic-memory${suffix}`;
  const sep = base.includes("?") ? "&" : "?";
  const url = `${base}${sep}organizationId=${encodeURIComponent(organizationId)}`;
  try {
    const r = await fetch(url, { headers: economicMemoryActorHeaders(organizationId), cache: "no-store" });
    if (r.status === 403 || r.status === 404) return null;
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}
