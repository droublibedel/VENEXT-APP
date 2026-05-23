/**
 * Relational, composable roles — not mutually exclusive silos.
 * A principal may hold multiple facets (e.g. upstream wholesaler + downstream supplier).
 */
export const VENEXT_ROLE_FACETS = [
  "INDUSTRIAL_PRODUCER",
  "WHOLESALER_A",
  "WHOLESALER_B",
  "RETAILER",
  "BACKOFFICE_ADMIN",
  "INDUSTRIAL_OPERATOR",
  "LOGISTICS_OPERATOR",
  "COMMERCIAL_OPERATOR",
  "FINANCE_OPERATOR",
  "MARKETING_OPERATOR",
] as const;

export type VenextRoleFacet = (typeof VENEXT_ROLE_FACETS)[number];

/** Ordered set of facets for a user within an organization context */
export type RoleComposition = readonly VenextRoleFacet[];

export interface PrincipalRoleContext {
  userId: string;
  organizationId: string;
  facets: RoleComposition;
  /** Locale / region for terminology (i18n), not authorization */
  regionCode?: string;
}

export function hasFacet(
  ctx: PrincipalRoleContext,
  facet: VenextRoleFacet,
): boolean {
  return ctx.facets.includes(facet);
}
