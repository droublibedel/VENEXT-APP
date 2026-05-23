import { describe, expect, it } from "vitest";
import { commercialChainUnavailableTypes, commercialClusterUnavailableTypes } from "@venext/shared-contracts";

import {
  COMMERCIAL_RELATIONSHIP_GRAPH_SYMBOLIC,
  buildCommercialRelationshipGraphCanvasGeo,
} from "./commercial-relationship-graph-canvas-adapter";

describe("commercial-relationship-graph canvas adapter", () => {
  it("exposes symbolic projection and non-real geography", () => {
    const g = buildCommercialRelationshipGraphCanvasGeo(null);
    expect(g.projectionLabelFr).toBe(COMMERCIAL_RELATIONSHIP_GRAPH_SYMBOLIC.projectionLabelFr);
    expect(g.realGeography).toBe(false);
    expect(g.openMarketplace).toBe(false);
    expect(g.socialNetworkMode).toBe(false);
    expect(g.graphMode).toBe("RELATIONSHIP_GRAPH");
    expect(g.geometryMode).toBe("SYMBOLIC_PROJECTION");
  });

  it("is deterministic for identical bundle input", async () => {
    const { CommercialRelationshipGraphBundleSchema } = await import("@venext/shared-contracts");
    const bundle = CommercialRelationshipGraphBundleSchema.parse({
      version: "1",
      generatedAt: "2026-01-01T00:00:00.000Z",
      organizationId: "31111111-1111-1111-1111-111111111101",
      policy: "ACTIVE",
      disclaimer: "d",
      snapshot: {
        version: "1",
        generatedAt: "2026-01-01T00:00:00.000Z",
        organizationId: "31111111-1111-1111-1111-111111111101",
        overview: {
          headline: "h",
          acceptedRelationshipCount: 1,
          partnerOrganizationCount: 2,
          producerNeighborCount: 0,
          wholesalerNeighborCount: 0,
          retailerNeighborCount: 0,
          pendingRelationshipCount: 0,
          concentrationIndex: 0.2,
          coverageIndex: 0.3,
          fragilityIndex: 0.1,
          overviewExplanation: "e",
        },
        nodes: [
          {
            organizationId: "41111111-1111-1111-1111-111111111101",
            commercialId: "C1",
            displayName: "A",
            category: "WHOLESALER_A",
            actorType: "WHOLESALER",
            territory: "T1",
            verificationStatus: "VERIFIED",
            nodeRole: "WHOLESALER_A",
            activityState: "ACTIVE",
            relationshipCount: 2,
            upstreamCount: 1,
            downstreamCount: 1,
            commercialWeight: 0.5,
            sourceSignals: ["s"],
          },
        ],
        edges: [
          {
            relationshipId: "51111111-1111-1111-1111-111111111101",
            upstreamOrganizationId: "61111111-1111-1111-1111-111111111101",
            downstreamOrganizationId: "41111111-1111-1111-1111-111111111101",
            relationshipType: "DISTRIBUTION_RELATION",
            status: "ACCEPTED",
            source: "DIRECT",
            relationshipStrength: 0.6,
            relationshipStability: 0.5,
            dependencyLevel: 0.4,
            commercialIntensity: 0.55,
            activityState: "ACTIVE",
            visibilityScope: "RELATIONSHIP_ONLY",
            sourceSignals: ["x"],
            explanation: "ex",
          },
        ],
        signals: [],
        clusters: [],
        coverage: {
          version: "1",
          symbolicProjection: true,
          territories: ["T1"],
          relationshipDensity: 0.4,
          distributionCoverage: 0.5,
          upstreamCoverage: 0.3,
          downstreamCoverage: 0.3,
          isolatedAreas: [],
          coverageGaps: [],
          cells: [],
          coverageExplanation: "ce",
        },
        bridges: [],
        chains: [],
        diagnostics: {
          relationshipSource: "PRISMA_RELATIONSHIP_TABLE",
          graphMode: "RELATIONSHIP_GRAPH",
          openMarketplace: false,
          socialNetworkMode: false,
          symbolicProjection: true,
          advisoryOnly: true,
          payloadProjection: "summary",
          sourceBundlesEmbedded: false,
          payloadWeightClass: "compact",
          composeCacheHit: false,
          cacheStrategy: "SHORT_TTL_GRAPH_CACHE_WITH_SINGLE_FLIGHT",
          costDisclosure: "c",
          validatedEdgesOnly: true,
          pendingEdgePreviewIncluded: false,
          coverageModelEnabled: true,
          chainsModelEnabled: false,
          viewerScope: "INDUSTRIAL_PRODUCER_VIEW",
          nodesLimit: 256,
          edgesLimit: 400,
          nodesTruncated: false,
          edgesTruncated: false,
          paginationSupported: false,
          dataSourcesUsed: [],
          emittedClusterTypes: [],
          unavailableClusterTypes: commercialClusterUnavailableTypes([]),
          emittedChainTypes: [],
          unavailableChainTypes: commercialChainUnavailableTypes([]),
        },
      },
    });
    const a = buildCommercialRelationshipGraphCanvasGeo(bundle);
    const b = buildCommercialRelationshipGraphCanvasGeo(bundle);
    expect(JSON.stringify(a.zones)).toBe(JSON.stringify(b.zones));
    expect(JSON.stringify(a.routes)).toBe(JSON.stringify(b.routes));
  });
});
