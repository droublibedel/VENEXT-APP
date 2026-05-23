import { DirectCatalogCartRequestSchema, RelationalCartResponseSchema, type RelationalCartResponseDto } from "@venext/shared-contracts";

export type PostRelationalCartFromCatalogResult =
  | { ok: true; data: RelationalCartResponseDto }
  | { ok: false; error: "http" | "invalid_payload" | "missing_org" | "invalid_request" };

/**
 * Instruction 20.6 — POST `/v1/relational-cart/from-catalog` via Next `/api/core` proxy.
 * Request body validated with Zod before send; response validated with `RelationalCartResponseSchema`.
 */
export async function postRelationalCartFromCatalog(args: {
  actingOrganizationId: string;
  userId?: string;
  body: unknown;
}): Promise<PostRelationalCartFromCatalogResult> {
  if (!args.actingOrganizationId.trim()) {
    return { ok: false, error: "missing_org" };
  }
  const parsedBody = DirectCatalogCartRequestSchema.safeParse(args.body);
  if (!parsedBody.success) {
    return { ok: false, error: "invalid_request" };
  }
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-venext-acting-organization-id": args.actingOrganizationId.trim(),
  };
  const uid = args.userId?.trim();
  if (uid) headers["x-venext-user-id"] = uid;

  const r = await fetch("/api/core/v1/relational-cart/from-catalog", {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(parsedBody.data),
  });
  if (!r.ok) {
    return { ok: false, error: "http" };
  }
  const j: unknown = await r.json();
  const parsed = RelationalCartResponseSchema.safeParse(j);
  if (!parsed.success) {
    return { ok: false, error: "invalid_payload" };
  }
  return { ok: true, data: parsed.data };
}
