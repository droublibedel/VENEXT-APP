import { COMMERCIAL_RELATIONSHIP_GRAPH_DEMO_ORGANIZATION_ID } from "../commercial-relationship-graph/constants";

/** Acting org for GET relational-cart (buyer or seller corridor participant). */
export function resolveRelationalCartOrganizationId(): { organizationId: string; source: string } {
  const fromEnv =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_RELATIONAL_CART_ACTING_ORG_ID?.trim()) || "";
  if (fromEnv) return { organizationId: fromEnv, source: "env" };
  return { organizationId: COMMERCIAL_RELATIONSHIP_GRAPH_DEMO_ORGANIZATION_ID, source: "demo_fallback" };
}
