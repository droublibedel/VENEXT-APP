import {
  RelationalFulfillmentViewResponseSchema,
  type RelationalFulfillmentViewResponseDto,
} from "@venext/shared-contracts";

const BFF_PREFIX = "/api/relational-fulfillment";

export type RelationalFulfillmentViewFetchResult =
  | { ok: true; data: RelationalFulfillmentViewResponseDto }
  | { ok: false; code: "relational_fulfillment_response_invalid" }
  | { ok: false; code: "not_found_or_forbidden" }
  | { ok: false; code: "http_error" };

export async function fetchRelationalFulfillmentView(
  organizationId: string,
  orderId: string,
): Promise<RelationalFulfillmentViewFetchResult> {
  const qs = new URLSearchParams({ organizationId });
  const url = `${BFF_PREFIX}/v1/relational-fulfillment/orders/${encodeURIComponent(orderId)}?${qs.toString()}`;
  try {
    const r = await fetch(url, { credentials: "include", cache: "no-store" });
    if (r.status === 403 || r.status === 404) return { ok: false, code: "not_found_or_forbidden" };
    if (!r.ok) return { ok: false, code: "http_error" };
    const json: unknown = await r.json();
    const parsed = RelationalFulfillmentViewResponseSchema.safeParse(json);
    if (!parsed.success) return { ok: false, code: "relational_fulfillment_response_invalid" };
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, code: "http_error" };
  }
}
