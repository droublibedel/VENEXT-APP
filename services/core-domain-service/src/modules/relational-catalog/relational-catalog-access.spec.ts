import { describe, expect, it } from "vitest";

import { RelationalCatalogAccessService } from "./relational-catalog-access.service";

const V = {
  producer: "11111111-1111-1111-1111-111111111101",
  wholesaler: "22222222-2222-2222-2222-222222222202",
  retailer: "33333333-3333-3333-3333-333333333303",
  relPw: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  relWr: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
};

describe("Instruction 19.2A — relational catalog access rules", () => {
  it("producer corridor includes only downstream partners", () => {
    const edges = [
      { relationshipId: V.relPw, upstreamOrganizationId: V.producer, downstreamOrganizationId: V.wholesaler },
      { relationshipId: V.relWr, upstreamOrganizationId: V.wholesaler, downstreamOrganizationId: V.retailer },
    ];
    const out = RelationalCatalogAccessService.scopeAccessForRole("PRODUCER", V.producer, edges);
    expect([...out.allowedPartnerOrgIds].sort()).toEqual([V.wholesaler]);
    expect(out.corridorRelationshipIds).toContain(V.relPw);
    expect(out.corridorRelationshipIds).not.toContain(V.relWr);
  });

  it("retailer corridor includes only upstream partners", () => {
    const edges = [
      { relationshipId: V.relPw, upstreamOrganizationId: V.producer, downstreamOrganizationId: V.wholesaler },
      { relationshipId: V.relWr, upstreamOrganizationId: V.wholesaler, downstreamOrganizationId: V.retailer },
    ];
    const out = RelationalCatalogAccessService.scopeAccessForRole("RETAILER", V.retailer, edges);
    expect([...out.allowedPartnerOrgIds].sort()).toEqual([V.wholesaler]);
    expect(out.corridorRelationshipIds).toContain(V.relWr);
    expect(out.corridorRelationshipIds).not.toContain(V.relPw);
  });

  it("wholesaler corridor is upstream-only (supplier side), not downstream catalogs", () => {
    const edges = [
      { relationshipId: V.relPw, upstreamOrganizationId: V.producer, downstreamOrganizationId: V.wholesaler },
      { relationshipId: V.relWr, upstreamOrganizationId: V.wholesaler, downstreamOrganizationId: V.retailer },
    ];
    const out = RelationalCatalogAccessService.scopeAccessForRole("WHOLESALER", V.wholesaler, edges);
    expect([...out.allowedPartnerOrgIds].sort()).toEqual([V.producer]);
    expect(out.corridorRelationshipIds).toContain(V.relPw);
    expect(out.corridorRelationshipIds).not.toContain(V.relWr);
  });

  it("admin viewer includes both directions on incident edges", () => {
    const edges = [
      { relationshipId: V.relPw, upstreamOrganizationId: V.producer, downstreamOrganizationId: V.wholesaler },
      { relationshipId: V.relWr, upstreamOrganizationId: V.wholesaler, downstreamOrganizationId: V.retailer },
    ];
    const w = RelationalCatalogAccessService.scopeAccessForRole("ADMIN_VIEWER", V.wholesaler, edges);
    expect([...w.allowedPartnerOrgIds].sort()).toEqual([V.producer, V.retailer].sort());
    expect(w.corridorRelationshipIds.sort()).toEqual([V.relPw, V.relWr].sort());
  });

  it("unknown commercial viewer is self-only (no partners, no relationship ids)", () => {
    const edges = [
      { relationshipId: V.relPw, upstreamOrganizationId: V.producer, downstreamOrganizationId: V.wholesaler },
    ];
    const out = RelationalCatalogAccessService.scopeAccessForRole("UNKNOWN_COMMERCIAL_VIEWER", V.producer, edges);
    expect(out.allowedPartnerOrgIds.size).toBe(0);
    expect([...out.allowedOrgIds]).toEqual([V.producer]);
    expect(out.corridorRelationshipIds.length).toBe(0);
  });
});

describe("Instruction 19.2B — access helpers", () => {
  it("resolveRoleScopeMode maps viewer roles", () => {
    expect(RelationalCatalogAccessService.resolveRoleScopeMode("WHOLESALER")).toBe("WHOLESALER_UPSTREAM_ONLY");
    expect(RelationalCatalogAccessService.resolveRoleScopeMode("RETAILER")).toBe("RETAILER_SUPPLIER_ONLY");
    expect(RelationalCatalogAccessService.resolveRoleScopeMode("ADMIN_VIEWER")).toBe("ADMIN_NEIGHBOR_ONLY");
    expect(RelationalCatalogAccessService.resolveRoleScopeMode("UNKNOWN_COMMERCIAL_VIEWER")).toBe("UNKNOWN_SELF_ONLY");
    expect(RelationalCatalogAccessService.resolveRoleScopeMode("PRODUCER")).toBe("PRODUCER_DOWNSTREAM_ONLY");
    expect(RelationalCatalogAccessService.resolveRoleScopeMode("INDUSTRIAL_PRODUCER")).toBe("PRODUCER_DOWNSTREAM_ONLY");
  });

  it("filterSponsoredToVisibleProducts retains only visible product injections", () => {
    const rows = [
      { productId: "71111111-1111-1111-1111-111111111101", injectionId: "x" },
      { productId: "82222222-2222-2222-2222-222222222202", injectionId: "y" },
    ];
    const vis = new Set(["71111111-1111-1111-1111-111111111101"]);
    const out = RelationalCatalogAccessService.filterSponsoredToVisibleProducts(rows, vis);
    expect(out).toEqual([{ productId: "71111111-1111-1111-1111-111111111101", injectionId: "x" }]);
  });
});
