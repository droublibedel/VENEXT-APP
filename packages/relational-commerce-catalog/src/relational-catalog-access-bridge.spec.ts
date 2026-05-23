import { describe, expect, it } from "vitest";

import { canBrowseCatalog, buildCatalogAccessContext } from "./relational-catalog-access-bridge";

describe("relational-catalog-access-bridge", () => {
  const flags = {
    commerce_access_control_enabled: true,
    commerce_visibility_guard_enabled: true,
    relational_catalog_enabled: true,
    partner_catalog_visibility_enabled: true,
  };

  it("browse with active relation", () => {
    const ctx = buildCatalogAccessContext({
      viewerRole: "grossiste_b",
      organizationId: "org-b",
      relationshipId: "rel-1",
      flags,
    });
    expect(canBrowseCatalog(ctx)).toBe(true);
  });

  it("browse blocked without relation", () => {
    const ctx = buildCatalogAccessContext({
      viewerRole: "grossiste_b",
      organizationId: "org-b",
      flags,
    });
    expect(canBrowseCatalog(ctx)).toBe(false);
  });
});
