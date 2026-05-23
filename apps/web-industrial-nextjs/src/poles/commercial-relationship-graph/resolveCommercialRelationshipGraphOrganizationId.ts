import { COMMERCIAL_RELATIONSHIP_GRAPH_DEMO_ORGANIZATION_ID } from "./constants";

export function resolveCommercialRelationshipGraphOrganizationId(): { organizationId: string; source: string } {
  const fromEnv =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_COMMERCIAL_RELATIONSHIP_GRAPH_ORGANIZATION_ID?.trim()) || "";
  if (fromEnv) return { organizationId: fromEnv, source: "env" };
  return { organizationId: COMMERCIAL_RELATIONSHIP_GRAPH_DEMO_ORGANIZATION_ID, source: "demo_fallback" };
}
