const BFF_PREFIX = "/api/relational-orders";

export async function fetchRelationalOrdersSnapshotJson<T>(
  organizationId: string,
  projection: "summary" | "full" = "summary",
  opts?: { orderCursor?: string; status?: string; relationshipId?: string },
): Promise<T | null> {
  const qs = new URLSearchParams({ organizationId, projection });
  if (opts?.orderCursor) qs.set("orderCursor", opts.orderCursor);
  if (opts?.status) qs.set("status", opts.status);
  if (opts?.relationshipId) qs.set("relationshipId", opts.relationshipId);
  const url = `${BFF_PREFIX}/v1/relational-orders/snapshot?${qs.toString()}`;
  try {
    const r = await fetch(url, { credentials: "include", cache: "no-store" });
    if (r.status === 403 || r.status === 404) return null;
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}
