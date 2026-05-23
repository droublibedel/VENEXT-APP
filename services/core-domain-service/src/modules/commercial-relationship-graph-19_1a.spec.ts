import { OrganizationActorType, OrganizationCategory } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  COMMERCIAL_NETWORK_RELATIONSHIPS_GRAPH_REUSE_TOKEN,
  CommercialRelationshipGraphBundleSchema,
  commercialChainUnavailableTypes,
  commercialClusterUnavailableTypes,
} from "@venext/shared-contracts";
import { CommercialNetworkRelationshipsService } from "./commercial-network-intelligence/commercial-network-relationships.service";
import { CommercialRelationshipNodeService } from "./commercial-relationship-graph/commercial-relationship-node.service";

describe("Instruction 19.1A — commercial relationship graph hardening", () => {
  it("exposes a single documented graphReuse token (traverser + official bundle engine)", () => {
    expect(COMMERCIAL_NETWORK_RELATIONSHIPS_GRAPH_REUSE_TOKEN).toContain("RelationalCommerceNetworkTraverserService");
    expect(COMMERCIAL_NETWORK_RELATIONSHIPS_GRAPH_REUSE_TOKEN).toContain("CommercialRelationshipGraphEngineService");
  });

  it("commercial-network relationships slice emits the graphReuse token", () => {
    const svc = new CommercialNetworkRelationshipsService();
    const out = svc.fromContext({
      organizationId: "41111111-1111-1111-1111-111111111101",
      generatedAt: new Date().toISOString(),
      partnersPack: { organizationId: "41111111-1111-1111-1111-111111111101", edges: [], counterparties: [] },
      relationships: [],
      orders30d: [],
      ordersPrev30d: [],
      negotiations30d: 0,
      messageThreads30d: 0,
    });
    expect(out.graphReuse).toBe(COMMERCIAL_NETWORK_RELATIONSHIPS_GRAPH_REUSE_TOKEN);
  });

  it("falls back to UNKNOWN_COMMERCIAL_ROLE for non-retail / non-wholesale / non-producer categories with edges", () => {
    const nodesSvc = new CommercialRelationshipNodeService();
    const orgId = "51111111-1111-1111-1111-111111111101";
    const orgs = new Map([
      [
        orgId,
        {
          id: orgId,
          commercialId: "C-X",
          displayName: "X",
          category: OrganizationCategory.INTERNAL_ADMIN,
          actorType: OrganizationActorType.BACKOFFICE,
          city: "Dakar",
          country: "SN",
          commune: null,
          verificationStatus: "VERIFIED",
        },
      ],
    ]);
    const adjacency = new Map([
      [orgId, { relationshipCount: 3, upstreamCount: 1, downstreamCount: 2 }],
    ]);
    const nodes = nodesSvc.buildNodes(orgId, orgs, adjacency);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]!.nodeRole).toBe("UNKNOWN_COMMERCIAL_ROLE");
  });

  it("parses bundle diagnostics with summary projection flags and emitted / unavailable chain semantics", () => {
    const parsed = CommercialRelationshipGraphBundleSchema.safeParse({
      version: "1",
      generatedAt: new Date().toISOString(),
      organizationId: "61111111-1111-1111-1111-111111111101",
      policy: "ACTIVE",
      disclaimer: "x",
      snapshot: {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId: "61111111-1111-1111-1111-111111111101",
        overview: {
          headline: "h",
          acceptedRelationshipCount: 0,
          partnerOrganizationCount: 0,
          producerNeighborCount: 0,
          wholesalerNeighborCount: 0,
          retailerNeighborCount: 0,
          pendingRelationshipCount: 0,
          concentrationIndex: 0,
          coverageIndex: 0,
          fragilityIndex: 0,
          overviewExplanation: "e",
        },
        nodes: [],
        edges: [],
        signals: [],
        clusters: [],
        coverage: {
          version: "1",
          symbolicProjection: true,
          territories: [],
          relationshipDensity: 0,
          distributionCoverage: 0,
          upstreamCoverage: 0,
          downstreamCoverage: 0,
          isolatedAreas: [],
          coverageGaps: [],
          cells: [],
          coverageExplanation: "c",
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
          costDisclosure: "d",
          validatedEdgesOnly: true,
          pendingEdgePreviewIncluded: false,
          coverageModelEnabled: true,
          chainsModelEnabled: true,
          viewerScope: "INDUSTRIAL_PRODUCER_VIEW",
          nodesLimit: 256,
          edgesLimit: 400,
          nodesTruncated: false,
          edgesTruncated: false,
          paginationSupported: false,
          dataSourcesUsed: ["prisma:relationship"],
          emittedClusterTypes: [],
          unavailableClusterTypes: commercialClusterUnavailableTypes([]),
          emittedChainTypes: [],
          unavailableChainTypes: commercialChainUnavailableTypes([]),
          summaryProjectionOmitsChains: true,
          summaryProjectionClustersCapped: false,
        },
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("graphReuse token is not the legacy ambiguous single-class label", () => {
    expect(COMMERCIAL_NETWORK_RELATIONSHIPS_GRAPH_REUSE_TOKEN).not.toBe("CommercialRelationshipGraphEngineService");
  });
});
