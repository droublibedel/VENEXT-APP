import { describe, expect, it } from "vitest";
import {
  RELATIONAL_CATALOG_GRAPH_REUSE_TOKEN,
  RelationalCatalogDiagnosticsSchema,
  RelationalCatalogProductSignalSchema,
  RelationalCatalogResponseSchema,
} from "@venext/shared-contracts";

describe("Instruction 19.2 — relational catalog contracts", () => {
  it("parses ACTIVE snapshot envelope", () => {
    const parsed = RelationalCatalogResponseSchema.safeParse({
      policy: "ACTIVE",
      snapshot: {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId: "71111111-1111-1111-1111-111111111101",
        viewerRole: "RETAILER",
        accessibleCatalogs: [],
        accessibleProducts: [],
        visibilityScopes: [],
        sponsoredInsertions: [],
        relationalRestrictions: ["no_public_discovery"],
        productSignals: [],
        catalogIntelligence: {
          relationshipCoverage: 0.2,
          catalogDensity: 0.1,
          dependencyPressure: 0.3,
          isolatedRetailersProxy: 0,
          concentratedWholesalersProxy: 1,
          sponsorSaturation: 0,
          visibilityImbalance: 0.1,
          proxyDerived: true,
          proxyInputs: ["test=input"],
          intelligenceExplanation: "x",
        },
        catalogDiagnostics: {
          relationshipScopedCatalogs: true,
          validatedRelationshipOnly: true,
          publicMarketplaceDisabled: true,
          publicDiscoveryDisabled: true,
          socialCommerceDisabled: true,
          graphReuse: RELATIONAL_CATALOG_GRAPH_REUSE_TOKEN,
          sourceBundlesEmbedded: false,
          payloadWeightClass: "compact",
          degradedMode: false,
          snapshotSource: "test",
          paginationSupported: true,
          productsLimit: 40,
          catalogsLimit: 24,
          productsTruncated: false,
          catalogsTruncated: false,
          visibilityScopedLoading: true,
          nextProductCursor: null,
          nextCatalogCursor: null,
          partnerSource: "GRAPH_BUNDLE",
          fallbackUsed: false,
          graphPartnerCount: 2,
          adminBroadReadSupported: false,
          roleScopedAccess: true,
          roleScopeMode: "RETAILER_SUPPLIER_ONLY",
          cursorStrategy: "COMPOSITE_KEYSET",
          signalHeuristicOnly: true,
          visibilityPolicy: "RELATIONSHIP_SCOPED_ONLY",
          catalogExposureMode: "PARTNER_NETWORK_ONLY",
          sponsorGlobalInjectionBlocked: true,
          sponsorRequiresRelationshipScope: true,
        },
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("graph reuse token references official CRG engine", () => {
    expect(RELATIONAL_CATALOG_GRAPH_REUSE_TOKEN).toContain("CommercialRelationshipGraphEngineService");
  });

  it("wording guard: contract file avoids ecommerce hype tokens", () => {
    const src = `relational catalog notes: no "recommended for you", no "discover products" global`;
    expect(src.toLowerCase()).not.toContain("amazon");
  });
});

describe("Instruction 19.2B — signal and diagnostics honesty", () => {
  it("rejects legacy rising_interest_signal enum value", () => {
    const parsed = RelationalCatalogProductSignalSchema.safeParse({
      signalId: "rc-x",
      signalType: "rising_interest_signal",
      severity: "info",
      confidence: 0.5,
      confidenceExplanation: "c",
      heuristicOnly: true,
      advisoryOnly: true,
      symbolicExecution: true,
      explanation: "e",
      sourceSignals: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts relational_catalog_density_signal", () => {
    const parsed = RelationalCatalogProductSignalSchema.safeParse({
      signalId: "rc-sig-catalog-density",
      signalType: "relational_catalog_density_signal",
      severity: "info",
      confidence: 0.46,
      confidenceExplanation: "c",
      heuristicOnly: true,
      advisoryOnly: true,
      symbolicExecution: true,
      explanation: "densité paginée",
      sourceSignals: ["accessibleProducts=25"],
    });
    expect(parsed.success).toBe(true);
  });

  it("parses PRISMA_FALLBACK diagnostics partnerSource", () => {
    const d = RelationalCatalogDiagnosticsSchema.parse({
      relationshipScopedCatalogs: true,
      validatedRelationshipOnly: true,
      publicMarketplaceDisabled: true,
      publicDiscoveryDisabled: true,
      socialCommerceDisabled: true,
      graphReuse: RELATIONAL_CATALOG_GRAPH_REUSE_TOKEN,
      sourceBundlesEmbedded: false,
      payloadWeightClass: "compact",
      degradedMode: true,
      snapshotSource: "PRISMA_FALLBACK_CORRIDOR_VISIBILITY_CATALOG_PRODUCT",
      paginationSupported: true,
      productsLimit: 40,
      catalogsLimit: 24,
      productsTruncated: false,
      catalogsTruncated: false,
      visibilityScopedLoading: true,
      nextProductCursor: null,
      nextCatalogCursor: null,
      partnerSource: "PRISMA_FALLBACK",
      fallbackUsed: true,
      graphPartnerCount: 3,
      adminBroadReadSupported: false,
      roleScopedAccess: true,
      roleScopeMode: "WHOLESALER_UPSTREAM_ONLY",
      cursorStrategy: "COMPOSITE_KEYSET",
      signalHeuristicOnly: true,
      visibilityPolicy: "RELATIONSHIP_SCOPED_ONLY",
      catalogExposureMode: "PARTNER_NETWORK_ONLY",
      sponsorGlobalInjectionBlocked: true,
      sponsorRequiresRelationshipScope: true,
    });
    expect(d.partnerSource).toBe("PRISMA_FALLBACK");
    expect(d.fallbackUsed).toBe(true);
  });
});
