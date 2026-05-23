const BFF_PREFIX = "/api/relational-catalog";

export async function fetchRelationalCatalogSnapshotJson<T>(
  organizationId: string,
  projection: "summary" | "full" = "summary",
  cursors?: { productCursor?: string; catalogCursor?: string },
): Promise<T | null> {
  const qs = new URLSearchParams({ organizationId, projection });
  if (cursors?.productCursor) qs.set("productCursor", cursors.productCursor);
  if (cursors?.catalogCursor) qs.set("catalogCursor", cursors.catalogCursor);
  const url = `${BFF_PREFIX}/v1/relational-catalog/snapshot?${qs.toString()}`;
  try {
    const r = await fetch(url, { credentials: "include", cache: "no-store" });
    if (r.status === 403 || r.status === 404) return null;
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}
