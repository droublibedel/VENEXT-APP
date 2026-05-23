import { RelationalCartResponseSchema, type RelationalCartResponseDto } from "@venext/shared-contracts";

export type FetchRelationalCartResult =
  | { ok: true; data: RelationalCartResponseDto }
  | { ok: false; error: "http" | "invalid_payload" | "missing_org" };

/**
 * Instruction 20.5A — load relational cart from core-domain via Next BFF (`/api/core/v1/...`).
 * Response is validated with Zod; callers must not render unchecked JSON as cart lines.
 */
export async function fetchRelationalCart(args: {
  cartId: string;
  actingOrganizationId: string;
  userId?: string;
}): Promise<FetchRelationalCartResult> {
  if (!args.actingOrganizationId.trim()) {
    return { ok: false, error: "missing_org" };
  }
  const headers: Record<string, string> = {
    "x-venext-acting-organization-id": args.actingOrganizationId.trim(),
  };
  const uid = args.userId?.trim();
  if (uid) headers["x-venext-user-id"] = uid;

  const r = await fetch(`/api/core/v1/relational-cart/${encodeURIComponent(args.cartId)}`, {
    headers,
    credentials: "include",
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
