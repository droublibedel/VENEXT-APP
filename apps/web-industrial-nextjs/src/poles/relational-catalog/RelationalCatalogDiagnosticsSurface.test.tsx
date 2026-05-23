import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { RelationalCatalogDiagnostics } from "@venext/shared-contracts";
import { RELATIONAL_CATALOG_GRAPH_REUSE_TOKEN } from "@venext/shared-contracts";

import { RelationalCatalogDiagnosticsSurface } from "./surfaces/RelationalCatalogDiagnosticsSurface";

afterEach(() => {
  cleanup();
});

function baseDiagnostics(over: Partial<RelationalCatalogDiagnostics> = {}): RelationalCatalogDiagnostics {
  return {
    relationshipScopedCatalogs: true,
    validatedRelationshipOnly: true,
    publicMarketplaceDisabled: true,
    publicDiscoveryDisabled: true,
    socialCommerceDisabled: true,
    graphReuse: RELATIONAL_CATALOG_GRAPH_REUSE_TOKEN,
    sourceBundlesEmbedded: false,
    payloadWeightClass: "compact",
    degradedMode: false,
    snapshotSource: "CRG_19.1A_CORRIDOR_PRISMA_VISIBILITY_CATALOG_PRODUCT",
    paginationSupported: true,
    productsLimit: 40,
    catalogsLimit: 24,
    productsTruncated: true,
    catalogsTruncated: false,
    visibilityScopedLoading: true,
    nextProductCursor: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    nextCatalogCursor: null,
    partnerSource: "GRAPH_BUNDLE",
    fallbackUsed: false,
    graphPartnerCount: 2,
    adminBroadReadSupported: false,
    roleScopedAccess: true,
    roleScopeMode: "WHOLESALER_UPSTREAM_ONLY",
    cursorStrategy: "COMPOSITE_KEYSET",
    signalHeuristicOnly: true,
    visibilityPolicy: "RELATIONSHIP_SCOPED_ONLY",
    catalogExposureMode: "PARTNER_NETWORK_ONLY",
    sponsorGlobalInjectionBlocked: true,
    sponsorRequiresRelationshipScope: true,
    ...over,
  };
}

describe("Instruction 19.2B — RelationalCatalogDiagnosticsSurface", () => {
  it("renders viewer scope, heuristic warning, symbolic availability, cursors, sponsor governance", () => {
    render(<RelationalCatalogDiagnosticsSurface diagnostics={baseDiagnostics()} viewerRole="WHOLESALER" />);
    expect(screen.getByTestId("relational-catalog-viewer-scope").textContent).toContain("Grossiste");
    expect(screen.getByTestId("relational-catalog-viewer-scope").textContent).toContain("WHOLESALER_UPSTREAM_ONLY");
    expect(screen.getByTestId("relational-catalog-heuristic-warning").textContent).toContain("heuristiques");
    expect(screen.getByTestId("relational-catalog-availability-warning").textContent).toContain("pas de stock temps réel");
    expect(screen.getByTestId("relational-catalog-diagnostics").textContent).toContain("nextProductCursor");
    expect(screen.getByTestId("relational-catalog-diagnostics").textContent).toContain("GRAPH_BUNDLE");
    expect(screen.getByTestId("relational-catalog-diagnostics").textContent).toContain("scope relationnel requis");
  });

  it("shows Prisma fallback copy when partnerSource is PRISMA_FALLBACK", () => {
    render(
      <RelationalCatalogDiagnosticsSurface
        diagnostics={baseDiagnostics({ partnerSource: "PRISMA_FALLBACK", fallbackUsed: true, degradedMode: true })}
        viewerRole="RETAILER"
      />,
    );
    expect(screen.getByText(/repli Prisma/i)).toBeTruthy();
  });
});
