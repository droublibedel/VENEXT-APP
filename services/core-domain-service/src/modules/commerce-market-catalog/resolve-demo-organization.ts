/** Maps commerce demo slugs (BFF/mobile) to PostgreSQL Organization UUIDs from prisma/seed.ts */
export const DEMO_ORGANIZATION_SLUG_TO_UUID: Record<string, string> = {
  "org-producer-agronexus-ci": "31111111-1111-1111-1111-111111111101",
  "org-grossiste-a-nord-plus": "31111111-1111-1111-1111-111111111102",
  "org-grossiste-b-demo": "31111111-1111-1111-1111-111111111103",
  "org-detaillant-yopougon": "31111111-1111-1111-1111-111111111201",
  "org-detaillant-aminata": "31111111-1111-1111-1111-111111111202",
};

export function resolveCommerceOrganizationId(organizationId: string): string {
  return DEMO_ORGANIZATION_SLUG_TO_UUID[organizationId] ?? organizationId;
}

export function isDemoOrganizationSlug(organizationId: string): boolean {
  return organizationId in DEMO_ORGANIZATION_SLUG_TO_UUID;
}
