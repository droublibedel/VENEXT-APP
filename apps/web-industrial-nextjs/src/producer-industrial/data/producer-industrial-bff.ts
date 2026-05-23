/** Client-side BFF prefix for producer industrial cockpit (Instruction 20.46). */

export const PRODUCER_INDUSTRIAL_BFF_PREFIX = "/api/producer-industrial";

export type ProducerIndustrialBffEndpoint =
  | "overview"
  | "executive"
  | "commercial-network"
  | "marketing-activation"
  | "supply-logistics"
  | "finance-collections"
  | "data-intelligence"
  | "map-control"
  | "alerts"
  | "partners"
  | "products"
  | "orders-summary"
  | "network-activity";

export function producerIndustrialBffUrl(
  endpoint: ProducerIndustrialBffEndpoint,
  organizationId?: string,
): string {
  const qs = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : "";
  return `${PRODUCER_INDUSTRIAL_BFF_PREFIX}/${endpoint}${qs}`;
}
