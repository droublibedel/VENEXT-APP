import {
  RelationalOrderExecutionViewResponseSchema,
  type RelationalOrderExecutionViewResponseDto,
} from "@venext/shared-contracts";

const BFF_PREFIX = "/api/relational-order-execution";

export type RelationalOrderExecutionViewFetchResult =
  | { ok: true; data: RelationalOrderExecutionViewResponseDto }
  | { ok: false; code: "relational_order_execution_response_invalid" }
  | { ok: false; code: "not_found_or_forbidden" }
  | { ok: false; code: "http_error" };

/** @deprecated use RelationalOrderExecutionViewResponseDto from successful fetch */
export type RelationalOrderExecutionViewJson = RelationalOrderExecutionViewResponseDto;

export async function fetchRelationalOrderExecutionView(
  organizationId: string,
  orderId: string,
): Promise<RelationalOrderExecutionViewFetchResult> {
  const qs = new URLSearchParams({ organizationId });
  const url = `${BFF_PREFIX}/v1/relational-order-execution/orders/${encodeURIComponent(orderId)}?${qs.toString()}`;
  try {
    const r = await fetch(url, { credentials: "include", cache: "no-store" });
    if (r.status === 403 || r.status === 404) return { ok: false, code: "not_found_or_forbidden" };
    if (!r.ok) return { ok: false, code: "http_error" };
    const json: unknown = await r.json();
    const parsed = RelationalOrderExecutionViewResponseSchema.safeParse(json);
    if (!parsed.success) return { ok: false, code: "relational_order_execution_response_invalid" };
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, code: "http_error" };
  }
}
