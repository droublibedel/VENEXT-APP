import { OrganizationCategory } from "@prisma/client";

/** Default pairing rules — retailer ↔ producer blocked unless sponsored/backoffice (handled in resolver flags). */
const CAN_PAIR: Record<OrganizationCategory, OrganizationCategory[]> = {
  PRODUCER: [OrganizationCategory.WHOLESALER_A, OrganizationCategory.WHOLESALER_B],
  WHOLESALER_A: [
    OrganizationCategory.PRODUCER,
    OrganizationCategory.WHOLESALER_B,
    OrganizationCategory.RETAILER,
  ],
  WHOLESALER_B: [
    OrganizationCategory.PRODUCER,
    OrganizationCategory.WHOLESALER_A,
    OrganizationCategory.RETAILER,
  ],
  RETAILER: [
    OrganizationCategory.WHOLESALER_A,
    OrganizationCategory.WHOLESALER_B,
  ],
  INTERNAL_ADMIN: [],
};

export function canPairCategories(
  a: OrganizationCategory,
  b: OrganizationCategory,
): boolean {
  return CAN_PAIR[a]?.includes(b) ?? false;
}

/** Validates directed edge: upstream supplies downstream per commerce norms */
export function validateDirectedEdge(params: {
  upstreamCategory: OrganizationCategory;
  downstreamCategory: OrganizationCategory;
}): boolean {
  const { upstreamCategory, downstreamCategory } = params;
  if (upstreamCategory === OrganizationCategory.RETAILER) return false;
  if (
    upstreamCategory === OrganizationCategory.PRODUCER &&
    downstreamCategory !== OrganizationCategory.WHOLESALER_A &&
    downstreamCategory !== OrganizationCategory.WHOLESALER_B
  ) {
    return false;
  }
  if (
    downstreamCategory === OrganizationCategory.PRODUCER &&
    upstreamCategory !== OrganizationCategory.WHOLESALER_A &&
    upstreamCategory !== OrganizationCategory.WHOLESALER_B
  ) {
    return false;
  }
  return canPairCategories(upstreamCategory, downstreamCategory);
}
