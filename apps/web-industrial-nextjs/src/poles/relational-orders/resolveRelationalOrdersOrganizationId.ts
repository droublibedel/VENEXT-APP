import { COMMERCIAL_RELATIONSHIP_GRAPH_DEMO_ORGANIZATION_ID } from "../commercial-relationship-graph/constants";

export function resolveRelationalOrdersOrganizationId(): { organizationId: string; source: string } {
  const fromEnv =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_RELATIONAL_ORDERS_ORGANIZATION_ID?.trim()) || "";
  if (fromEnv) return { organizationId: fromEnv, source: "env" };
  return { organizationId: COMMERCIAL_RELATIONSHIP_GRAPH_DEMO_ORGANIZATION_ID, source: "demo_fallback" };
}
