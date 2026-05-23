import {
  canExposeCatalogAcrossRelationship,
  isCommercialRelationshipGovernanceEnabled,
  mapSupplierTypeToActorRole,
} from "commercial-relationship-governance";

import type {
  CatalogVisibilityMode,
  CommercialRelationshipLevel,
  RelationalActorRole,
  RelationalCatalog,
  RelationalCatalogFlags,
  RelationalProduct,
} from "./relational-commerce-catalog.types";
import {
  canViewCatalogWithAccessControl,
  type CatalogAccessBridgeInput,
} from "./relational-catalog-access-bridge";

const ACTIVE_LEVELS: CommercialRelationshipLevel[] = ["APPROVED", "ACTIVE", "PRIORITY_PARTNER"];

export function isFormalActor(role: string): boolean {
  return role === "producteur" || role === "grossiste_a";
}

export function isTerrainActor(role: string): boolean {
  return role === "grossiste_b" || role === "detaillant";
}

export function isRelationalCatalogEnabled(flags: RelationalCatalogFlags = {}): boolean {
  return flags.relational_catalog_enabled !== false;
}

export function isSponsoredDiscoveryEnabled(flags: RelationalCatalogFlags = {}): boolean {
  return (
    flags.sponsored_catalog_discovery_enabled !== false &&
    flags.relational_catalog_enabled !== false
  );
}

export function isPartnerVisibilityEnabled(flags: RelationalCatalogFlags = {}): boolean {
  return flags.partner_catalog_visibility_enabled !== false;
}

export function relationshipAllowsCatalog(level: CommercialRelationshipLevel): boolean {
  return ACTIVE_LEVELS.includes(level) || level === "CONTACT_DISCOVERED";
}

export function visibilityAllowsCatalog(mode: CatalogVisibilityMode): boolean {
  return mode !== "HIDDEN";
}

export function canViewCatalog(
  catalog: RelationalCatalog,
  flags: RelationalCatalogFlags = {},
  viewerRole?: RelationalActorRole,
  accessBridge?: CatalogAccessBridgeInput,
): boolean {
  if (accessBridge && flags.commerce_access_control_enabled !== false) {
    return canViewCatalogWithAccessControl(catalog, flags, viewerRole, accessBridge);
  }
  if (!isPartnerVisibilityEnabled(flags)) return false;
  if (!visibilityAllowsCatalog(catalog.visibilityMode)) return false;
  if (catalog.visibilityMode === "SPONSORED_DISCOVERY") {
    return isSponsoredDiscoveryEnabled(flags);
  }
  if (catalog.visibilityMode === "RELATION_ONLY" || catalog.visibilityMode === "PARTNER_APPROVED") {
    if (!relationshipAllowsCatalog(catalog.relationshipLevel)) return false;
  } else if (catalog.visibilityMode === "NETWORK_EXTENDED") {
    if (
      !relationshipAllowsCatalog(catalog.relationshipLevel) &&
      catalog.sponsored !== true
    ) {
      return false;
    }
  } else if (!relationshipAllowsCatalog(catalog.relationshipLevel)) {
    return false;
  }

  if (viewerRole && isCommercialRelationshipGovernanceEnabled(flags)) {
    const partnerRole = mapSupplierTypeToActorRole(catalog.supplierType);
    return canExposeCatalogAcrossRelationship({ self: viewerRole, partner: partnerRole }, flags);
  }

  return true;
}

export function isProductVisible(
  product: RelationalProduct,
  catalog: RelationalCatalog,
  flags: RelationalCatalogFlags = {},
  viewerRole?: RelationalActorRole,
): boolean {
  if (!canViewCatalog(catalog, flags, viewerRole)) return false;
  if (catalog.restrictedCatalog && product.availability === "unavailable") return false;
  return product.availability !== "unavailable";
}

export function filterVisibleCatalogs(
  catalogs: RelationalCatalog[],
  flags: RelationalCatalogFlags = {},
  viewerRole?: RelationalActorRole,
): RelationalCatalog[] {
  return catalogs
    .filter((c) => canViewCatalog(c, flags, viewerRole))
    .map((c) => ({
      ...c,
      products: c.products.filter((p) => isProductVisible(p, c, flags, viewerRole)),
    }))
    .filter((c) => c.products.length > 0 || c.relationshipLevel === "ACTIVE");
}

export function assertNoGlobalMarketplaceUi(testId: string | undefined): boolean {
  const forbidden = ["global-marketplace", "all-products-market", "price-comparator"];
  if (!testId) return true;
  return !forbidden.some((f) => testId.includes(f));
}
