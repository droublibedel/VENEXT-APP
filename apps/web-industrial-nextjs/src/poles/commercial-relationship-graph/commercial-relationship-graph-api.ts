const BFF_PREFIX = "/api/commercial-relationship-graph";

export async function fetchCommercialRelationshipGraphBundleJson<T>(
  organizationId: string,
  projection: "summary" | "full" = "summary",
): Promise<T | null> {
  const url = `${BFF_PREFIX}/v1/commercial-relationship-graph/bundle?organizationId=${encodeURIComponent(organizationId)}&projection=${projection}`;
  try {
    const r = await fetch(url, { credentials: "include", cache: "no-store" });
    if (r.status === 403 || r.status === 404) return null;
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}
