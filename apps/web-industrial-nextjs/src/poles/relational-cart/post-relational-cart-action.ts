"use client";

/**
 * Instruction 20.7 — POST relational-cart workflow actions via Next BFF (`/api/core/v1/...`).
 */
export async function postRelationalCartAction(args: {
  cartId: string;
  subPath: "review" | "confirm-buyer" | "confirm-seller" | "lock" | "reject" | "expire" | "convert-to-order";
  actingOrganizationId: string;
  userId?: string;
  body?: unknown;
}): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-venext-acting-organization-id": args.actingOrganizationId.trim(),
  };
  const uid = args.userId?.trim();
  if (uid) headers["x-venext-user-id"] = uid;
  return fetch(`/api/core/v1/relational-cart/${encodeURIComponent(args.cartId)}/${args.subPath}`, {
    method: "POST",
    headers,
    credentials: "include",
    body: args.body !== undefined ? JSON.stringify(args.body) : undefined,
  });
}
