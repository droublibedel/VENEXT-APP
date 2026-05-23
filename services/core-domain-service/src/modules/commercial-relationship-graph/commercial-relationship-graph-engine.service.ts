import { Injectable } from "@nestjs/common";
import { OrganizationCategory, RelationshipStatus } from "@prisma/client";
import type {
  CommercialDependencyClusterType,
  CommercialRelationshipChainType,
  CommercialRelationshipEdge,
  CommercialRelationshipGraphBundle,
  CommercialRelationshipGraphProjectionMode,
  CommercialRelationshipNode,
  CommercialRelationshipSignal,
  CommercialRelationshipSignalType,
} from "@venext/shared-contracts";
import {
  commercialChainUnavailableTypes,
  commercialClusterUnavailableTypes,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { CommercialBridgeService } from "./commercial-bridge.service";
import { CommercialCoverageService } from "./commercial-coverage.service";
import { CommercialDependencyClusterService } from "./commercial-dependency-cluster.service";
import { CommercialRelationshipChainService } from "./commercial-relationship-chain.service";
import { CommercialRelationshipEdgeService } from "./commercial-relationship-edge.service";
import type { NodeAdjacency } from "./commercial-relationship-node.service";
import { CommercialRelationshipNodeService } from "./commercial-relationship-node.service";
import { CommercialRelationshipGraphRealtimePublishService } from "./commercial-relationship-realtime-publish.service";

const EGO_REL_TAKE = 200;
const INTERNAL_REL_TAKE = 260;
const ORG_LOAD_TAKE = 512;
const MAX_SNAPSHOT_NODES = 256;
const MAX_SNAPSHOT_EDGES = 400;

/**
 * Instruction 19.1A — **Official** materialized commercial relationship graph (bundle, diagnostics, slices).
 * Legacy traversal helpers (`partners`, `traverseNetwork`, QR invites) live in
 * `RelationalCommerceNetworkTraverserService` — see `relational-commerce-network-traverser.service.ts`.
 */
const DISCLAIMER =
  "Graphe relationnel commercial VENEXT (19.1) — projection symbolique sur relations validées. Pas de marketplace ouvert, pas de réseau social, pas de graphe inventé. Heuristiques bornées 0–1 dérivées de comptages Prisma déterministes.";

type Cached = { at: number; bundle: CommercialRelationshipGraphBundle };

@Injectable()
export class CommercialRelationshipGraphEngineService {
  private readonly cache = new Map<string, Cached>();
  private readonly ttlMs = 4200;

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly nodesSvc: CommercialRelationshipNodeService,
    private readonly edgesSvc: CommercialRelationshipEdgeService,
    private readonly clustersSvc: CommercialDependencyClusterService,
    private readonly coverageSvc: CommercialCoverageService,
    private readonly bridgesSvc: CommercialBridgeService,
    private readonly chainsSvc: CommercialRelationshipChainService,
    private readonly realtime: CommercialRelationshipGraphRealtimePublishService,
  ) {}

  async getBundleWithCacheMeta(
    organizationId: string,
    projection: CommercialRelationshipGraphProjectionMode,
    options: { includePending?: boolean },
  ): Promise<{ bundle: CommercialRelationshipGraphBundle; composeCacheHit: boolean }> {
    const enabled = await this.flags.isEnabled("commercial_relationship_graph_enabled", { organizationId });
    if (!enabled) {
      return { bundle: this.disabledBundle(organizationId, projection), composeCacheHit: false };
    }
    const now = Date.now();
    const hit = this.cache.get(organizationId);
    if (hit && now - hit.at < this.ttlMs) {
      const bundle = this.applyProjection(hit.bundle, projection, options.includePending);
      return { bundle, composeCacheHit: true };
    }
    const fullBundle = await this.materializeFull(organizationId, options.includePending);
    this.cache.set(organizationId, { at: now, bundle: fullBundle });
    this.realtime.publishGraphPulse(organizationId, fullBundle);
    return { bundle: this.applyProjection(fullBundle, projection, options.includePending), composeCacheHit: false };
  }

  private applyProjection(
    bundle: CommercialRelationshipGraphBundle,
    projection: CommercialRelationshipGraphProjectionMode,
    includePending?: boolean,
  ): CommercialRelationshipGraphBundle {
    if (projection === "full") {
      return {
        ...bundle,
        snapshot: {
          ...bundle.snapshot,
          diagnostics: {
            ...bundle.snapshot.diagnostics,
            payloadProjection: "full",
            sourceBundlesEmbedded: true,
            payloadWeightClass: "large",
            pendingEdgePreviewIncluded: Boolean(includePending),
            summaryProjectionOmitsChains: false,
            summaryProjectionClustersCapped: false,
          },
        },
      };
    }
    const clustersShown = bundle.snapshot.clusters.slice(0, 12);
    const emittedClusterTypes = [...new Set(clustersShown.map((c) => c.clusterType))] as CommercialDependencyClusterType[];
    const unavailableClusterTypes = commercialClusterUnavailableTypes(emittedClusterTypes);
    return {
      ...bundle,
      snapshot: {
        ...bundle.snapshot,
        chains: [],
        signals: bundle.snapshot.signals.slice(0, 12),
        clusters: clustersShown,
        diagnostics: {
          ...bundle.snapshot.diagnostics,
          payloadProjection: "summary",
          sourceBundlesEmbedded: false,
          payloadWeightClass: "compact",
          chainsModelEnabled: bundle.snapshot.diagnostics.chainsModelEnabled,
          pendingEdgePreviewIncluded: Boolean(includePending),
          summaryProjectionOmitsChains: true,
          summaryProjectionClustersCapped: bundle.snapshot.clusters.length > 12,
          emittedClusterTypes,
          unavailableClusterTypes,
          emittedChainTypes: [],
          unavailableChainTypes: commercialChainUnavailableTypes([]),
          costDisclosure: `${bundle.snapshot.diagnostics.costDisclosure} Résumé HTTP : chaînes omises du corps ; types cluster/chaîne listés = payload visible uniquement (max 12 clusters).`,
        },
      },
    };
  }

  private disabledBundle(organizationId: string, projection: CommercialRelationshipGraphProjectionMode): CommercialRelationshipGraphBundle {
    const ts = new Date().toISOString();
    return {
      version: "1",
      generatedAt: ts,
      organizationId,
      policy: "DISABLED",
      disclaimer: DISCLAIMER,
      snapshot: {
        version: "1",
        generatedAt: ts,
        organizationId,
        overview: {
          headline: "Couche graphe relationnel — désactivée par feature flag.",
          acceptedRelationshipCount: 0,
          partnerOrganizationCount: 0,
          producerNeighborCount: 0,
          wholesalerNeighborCount: 0,
          retailerNeighborCount: 0,
          pendingRelationshipCount: 0,
          concentrationIndex: 0,
          coverageIndex: 0,
          fragilityIndex: 0,
          overviewExplanation: "commercial_relationship_graph_enabled=false — aucun matérialisation Prisma.",
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
          coverageExplanation: "Bundle désactivé — pas de projection symbolique.",
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
          payloadProjection: projection,
          sourceBundlesEmbedded: false,
          payloadWeightClass: "compact",
          composeCacheHit: false,
          cacheStrategy: "SHORT_TTL_GRAPH_CACHE_WITH_SINGLE_FLIGHT",
          costDisclosure: "Graph layer disabled — no Prisma graph read.",
          validatedEdgesOnly: true,
          pendingEdgePreviewIncluded: false,
          coverageModelEnabled: false,
          chainsModelEnabled: false,
          viewerScope: "INDUSTRIAL_PRODUCER_VIEW",
          nodesLimit: MAX_SNAPSHOT_NODES,
          edgesLimit: MAX_SNAPSHOT_EDGES,
          nodesTruncated: false,
          edgesTruncated: false,
          paginationSupported: false,
          dataSourcesUsed: [],
          emittedClusterTypes: [],
          unavailableClusterTypes: commercialClusterUnavailableTypes([]),
          emittedChainTypes: [],
          unavailableChainTypes: commercialChainUnavailableTypes([]),
          summaryProjectionOmitsChains: false,
          summaryProjectionClustersCapped: false,
        },
      },
    };
  }

  private async materializeFull(organizationId: string, includePending?: boolean): Promise<CommercialRelationshipGraphBundle> {
    const ts = new Date().toISOString();
    const coverageOn = await this.flags.isEnabled("commercial_relationship_graph_coverage_enabled", { organizationId });
    const chainsOn = await this.flags.isEnabled("commercial_relationship_graph_chains_enabled", { organizationId });

    const acceptedWhere = {
      status: RelationshipStatus.ACCEPTED,
      upstreamOrganizationId: { not: null },
      downstreamOrganizationId: { not: null },
      OR: [
        { upstreamOrganizationId: organizationId },
        { downstreamOrganizationId: organizationId },
        { requesterOrganizationId: organizationId },
        { receiverOrganizationId: organizationId },
      ],
    };

    const rels = await this.prisma.relationship.findMany({
      where: acceptedWhere,
      orderBy: { id: "asc" },
      take: EGO_REL_TAKE,
      select: {
        id: true,
        upstreamOrganizationId: true,
        downstreamOrganizationId: true,
        status: true,
        source: true,
        trustLevel: true,
        acceptedAt: true,
        createdAt: true,
      },
    });

    const orgIds = new Set<string>([organizationId]);
    for (const r of rels) {
      if (r.upstreamOrganizationId) orgIds.add(r.upstreamOrganizationId);
      if (r.downstreamOrganizationId) orgIds.add(r.downstreamOrganizationId);
    }

    const internalRels = await this.prisma.relationship.findMany({
      where: {
        status: RelationshipStatus.ACCEPTED,
        upstreamOrganizationId: { in: [...orgIds] },
        downstreamOrganizationId: { in: [...orgIds] },
      },
      orderBy: { id: "asc" },
      take: INTERNAL_REL_TAKE,
      select: {
        id: true,
        upstreamOrganizationId: true,
        downstreamOrganizationId: true,
        status: true,
        source: true,
        trustLevel: true,
        acceptedAt: true,
        createdAt: true,
      },
    });

    const egoTruncated = rels.length >= EGO_REL_TAKE;
    const internalEdgesTruncated = internalRels.length >= INTERNAL_REL_TAKE;

    const relIds = [...new Set(internalRels.map((r) => r.id))].sort();
    const orgIdList = [...orgIds].sort();
    const since30d = new Date(Date.now() - 30 * 86400000);

    const [
      orderGroups,
      reservationGroups,
      shipmentGroups,
      gbsGroups,
      visGroups,
      economicSignalCount,
      negRows,
    ] = await Promise.all([
      relIds.length > 0
        ? this.prisma.order.groupBy({
            by: ["relationshipId"],
            where: { relationshipId: { in: relIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      relIds.length > 0
        ? this.prisma.reservationIntent.groupBy({
            by: ["relationshipId"],
            where: { relationshipId: { in: relIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      relIds.length > 0
        ? this.prisma.shipment.groupBy({
            by: ["relationshipId"],
            where: { relationshipId: { in: relIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      relIds.length > 0
        ? this.prisma.groupBuyingSession.groupBy({
            by: ["relationshipId"],
            where: { relationshipId: { in: relIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      relIds.length > 0
        ? this.prisma.productVisibility.groupBy({
            by: ["visibleToRelationshipId"],
            where: { visibleToRelationshipId: { in: relIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      this.prisma.economicSignal.count({
        where: { organizationId, createdAt: { gte: since30d } },
      }),
      this.prisma.negotiation.findMany({
        where: {
          buyerOrganizationId: { in: orgIdList },
          sellerOrganizationId: { in: orgIdList },
        },
        select: { buyerOrganizationId: true, sellerOrganizationId: true },
        take: 2000,
      }),
    ]);

    const orderCountByRelationshipId = new Map<string, number>();
    for (const g of orderGroups) {
      if (g.relationshipId != null) orderCountByRelationshipId.set(g.relationshipId, g._count._all);
    }
    const reservationIntentCount = new Map<string, number>();
    for (const g of reservationGroups) {
      if (g.relationshipId != null) reservationIntentCount.set(g.relationshipId, g._count._all);
    }
    const shipmentCount = new Map<string, number>();
    for (const g of shipmentGroups) {
      if (g.relationshipId != null) shipmentCount.set(g.relationshipId, g._count._all);
    }
    const groupBuyingSessionCount = new Map<string, number>();
    for (const g of gbsGroups) {
      if (g.relationshipId != null) groupBuyingSessionCount.set(g.relationshipId, g._count._all);
    }
    const productVisibilityCount = new Map<string, number>();
    for (const g of visGroups) {
      if (g.visibleToRelationshipId != null) productVisibilityCount.set(g.visibleToRelationshipId, g._count._all);
    }

    const negotiationPairCount = new Map<string, number>();
    for (const n of negRows) {
      const a = n.buyerOrganizationId;
      const b = n.sellerOrganizationId;
      const k = a < b ? `${a}::${b}` : `${b}::${a}`;
      negotiationPairCount.set(k, (negotiationPairCount.get(k) ?? 0) + 1);
    }

    const downToUps = new Map<string, Set<string>>();
    for (const r of internalRels) {
      const d = r.downstreamOrganizationId!;
      const u = r.upstreamOrganizationId!;
      if (!downToUps.has(d)) downToUps.set(d, new Set());
      downToUps.get(d)!.add(u);
    }
    const downstreamExclusive = new Set<string>();
    for (const r of internalRels) {
      const ups = downToUps.get(r.downstreamOrganizationId!);
      if (ups && ups.size === 1 && ups.has(r.upstreamOrganizationId!)) {
        downstreamExclusive.add(r.id);
      }
    }

    const orgRows = await this.prisma.organization.findMany({
      where: { id: { in: [...orgIds] } },
      orderBy: { id: "asc" },
      take: ORG_LOAD_TAKE,
      select: {
        id: true,
        commercialId: true,
        displayName: true,
        category: true,
        actorType: true,
        city: true,
        country: true,
        commune: true,
        verificationStatus: true,
      },
    });
    const orgLoadTruncated = orgIds.size > ORG_LOAD_TAKE || orgRows.length >= ORG_LOAD_TAKE;
    const orgById = new Map(orgRows.map((o) => [o.id, o]));

    const adjacency = new Map<string, NodeAdjacency>();
    for (const id of orgIds) adjacency.set(id, { relationshipCount: 0, upstreamCount: 0, downstreamCount: 0 });
    for (const r of internalRels) {
      const up = r.upstreamOrganizationId!;
      const down = r.downstreamOrganizationId!;
      for (const oid of [up, down]) {
        const a = adjacency.get(oid)!;
        a.relationshipCount += 1;
        adjacency.set(oid, a);
      }
      const au = adjacency.get(up)!;
      au.downstreamCount += 1;
      adjacency.set(up, au);
      const ad = adjacency.get(down)!;
      ad.upstreamCount += 1;
      adjacency.set(down, ad);
    }

    const nodesRaw = this.nodesSvc.buildNodes(organizationId, orgById, adjacency);
    const edgesRaw = this.edgesSvc.buildEdges(internalRels, orgById, orderCountByRelationshipId, downstreamExclusive, {
      negotiationPairCount,
      reservationIntentCount,
      shipmentCount,
      groupBuyingSessionCount,
      productVisibilityCount,
    });
    const bridges = this.bridgesSvc.build(nodesRaw, edgesRaw);
    const clusters = this.clustersSvc.build(nodesRaw, edgesRaw, bridges);
    const coverage = coverageOn ? this.coverageSvc.build(nodesRaw, edgesRaw) : this.emptyCoverage(ts);
    const chainsRaw = chainsOn ? this.chainsSvc.build(nodesRaw, edgesRaw, true) : [];

    const nodesFinal = nodesRaw.slice(0, MAX_SNAPSHOT_NODES);
    const edgesFinal = edgesRaw.slice(0, MAX_SNAPSHOT_EDGES);
    const nodesTruncated =
      nodesRaw.length > MAX_SNAPSHOT_NODES || orgLoadTruncated || egoTruncated || internalEdgesTruncated;
    const edgesTruncated =
      edgesRaw.length > MAX_SNAPSHOT_EDGES || internalEdgesTruncated || egoTruncated;

    let pendingCount = 0;
    if (includePending) {
      pendingCount = await this.prisma.relationship.count({
        where: {
          status: RelationshipStatus.PENDING,
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      });
    }

    const signals = this.buildSignals(organizationId, nodesRaw, edgesRaw, clusters, bridges, coverage, pendingCount);

    const overview = this.buildOverview(nodesRaw, edgesRaw, pendingCount, clusters, coverage);

    const emittedClusterTypes = [...new Set(clusters.map((c) => c.clusterType))] as CommercialDependencyClusterType[];
    const unavailableClusterTypes = commercialClusterUnavailableTypes(emittedClusterTypes);
    const emittedChainTypes = [...new Set(chainsRaw.map((c) => c.chainType))] as CommercialRelationshipChainType[];
    const unavailableChainTypes = commercialChainUnavailableTypes(
      chainsOn ? emittedChainTypes : ([] as CommercialRelationshipChainType[]),
    );

    const dataSourcesUsed = [
      "prisma:relationship(accepted_ego)",
      "prisma:relationship(accepted_internal)",
      "prisma:organization",
      "prisma:order.groupBy.relationshipId",
      "prisma:negotiation.findMany(buyer_seller_in_subgraph)",
      "prisma:reservationIntent.groupBy.relationshipId",
      "prisma:shipment.groupBy.relationshipId",
      "prisma:groupBuyingSession.groupBy.relationshipId",
      "prisma:productVisibility.groupBy.visibleToRelationshipId",
      `prisma:economicSignal.count(ego_org_30d=${economicSignalCount})`,
    ];

    const bundle: CommercialRelationshipGraphBundle = {
      version: "1",
      generatedAt: ts,
      organizationId,
      policy: "ACTIVE",
      disclaimer: DISCLAIMER,
      snapshot: {
        version: "1",
        generatedAt: ts,
        organizationId,
        overview,
        nodes: nodesFinal,
        edges: edgesFinal,
        signals,
        clusters,
        coverage,
        bridges,
        chains: chainsRaw,
        diagnostics: {
          relationshipSource: "PRISMA_RELATIONSHIP_TABLE",
          graphMode: "RELATIONSHIP_GRAPH",
          openMarketplace: false,
          socialNetworkMode: false,
          symbolicProjection: true,
          advisoryOnly: true,
          payloadProjection: "full",
          sourceBundlesEmbedded: true,
          payloadWeightClass: "large",
          composeCacheHit: false,
          cacheStrategy: "SHORT_TTL_GRAPH_CACHE_WITH_SINGLE_FLIGHT",
          costDisclosure:
            "Single-flight TTL cache — each HTTP slice reuses the same materialized graph snapshot (no independent random graph).",
          validatedEdgesOnly: true,
          pendingEdgePreviewIncluded: Boolean(includePending),
          coverageModelEnabled: coverageOn,
          chainsModelEnabled: chainsOn,
          viewerScope: "INDUSTRIAL_PRODUCER_VIEW",
          nodesLimit: MAX_SNAPSHOT_NODES,
          edgesLimit: MAX_SNAPSHOT_EDGES,
          nodesTruncated,
          edgesTruncated,
          paginationSupported: false,
          dataSourcesUsed,
          emittedClusterTypes,
          unavailableClusterTypes,
          emittedChainTypes: chainsOn ? emittedChainTypes : [],
          unavailableChainTypes: chainsOn ? unavailableChainTypes : commercialChainUnavailableTypes([]),
          summaryProjectionOmitsChains: false,
          summaryProjectionClustersCapped: false,
        },
      },
    };
    return bundle;
  }

  private emptyCoverage(ts: string): CommercialRelationshipGraphBundle["snapshot"]["coverage"] {
    return {
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
      coverageExplanation: "Coverage model disabled by commercial_relationship_graph_coverage_enabled flag.",
    };
  }

  private buildOverview(
    nodes: CommercialRelationshipNode[],
    edges: CommercialRelationshipEdge[],
    pendingCount: number,
    clusters: { dependencyScore: number; fragilityScore: number }[],
    coverage: { relationshipDensity: number; distributionCoverage: number },
  ): CommercialRelationshipGraphBundle["snapshot"]["overview"] {
    const partners = nodes.filter((n) => n.relationshipCount > 0).length;
    const prodN = nodes.filter((n) => n.category === OrganizationCategory.PRODUCER).length;
    const whN = nodes.filter((n) => n.category === OrganizationCategory.WHOLESALER_A || n.category === OrganizationCategory.WHOLESALER_B).length;
    const retN = nodes.filter((n) => n.category === OrganizationCategory.RETAILER).length;
    const conc =
      clusters.length > 0
        ? Number(
            Math.min(1, clusters.reduce((s, c) => s + c.dependencyScore, 0) / clusters.length).toFixed(3),
          )
        : 0.2;
    const frag =
      clusters.length > 0
        ? Number(Math.min(1, clusters.reduce((s, c) => s + c.fragilityScore, 0) / clusters.length).toFixed(3))
        : 0.25;
    const cov = Number(((coverage.relationshipDensity + coverage.distributionCoverage) / 2).toFixed(3));
    return {
      headline: `Réseau commercial validé — ${edges.length} arêtes, ${nodes.length} nœuds matérialisés (projection symbolique).`,
      acceptedRelationshipCount: edges.length,
      partnerOrganizationCount: partners,
      producerNeighborCount: prodN,
      wholesalerNeighborCount: whN,
      retailerNeighborCount: retN,
      pendingRelationshipCount: pendingCount,
      concentrationIndex: conc,
      coverageIndex: cov,
      fragilityIndex: frag,
      overviewExplanation:
        "Indices 0–1 dérivés de comptages agrégés et clusters heuristiques locaux — pas de scoring social ni recommandations ouvertes.",
    };
  }

  private buildSignals(
    centerOrganizationId: string,
    nodes: CommercialRelationshipNode[],
    edges: CommercialRelationshipEdge[],
    clusters: { clusterId: string; clusterType: string; involvedOrganizations: string[] }[],
    bridges: { bridgeId: string; organizationId: string; overloadRisk: number }[],
    coverage: { coverageGaps: string[]; isolatedAreas: string[] },
    pendingCount: number,
  ): CommercialRelationshipSignal[] {
    const sigs: CommercialRelationshipSignal[] = [];
    const push = (
      signalType: CommercialRelationshipSignalType,
      partial: Omit<CommercialRelationshipSignal, "signalType" | "heuristicOnly" | "advisoryOnly">,
    ) => {
      sigs.push({
        signalType,
        heuristicOnly: true,
        advisoryOnly: true,
        ...partial,
      });
    };

    if (edges.length > 0) {
      const active = edges.filter((e) => e.activityState === "ACTIVE").length;
      const conf = Number(Math.min(1, 0.4 + active / Math.max(8, edges.length)).toFixed(3));
      push("relationship_activity_signal", {
        signalId: "sig-rel-activity",
        affectedNodes: nodes.map((n) => n.organizationId).slice(0, 32),
        affectedEdges: edges.map((e) => e.relationshipId).slice(0, 48),
        affectedTerritories: [...new Set(nodes.map((n) => n.territory))].slice(0, 16),
        severity: active < edges.length * 0.35 ? "medium" : "low",
        confidence: conf,
        confidenceExplanation: `confidence=min(1, 0.4 + activeEdges(${active})/max(8,totalEdges(${edges.length}))) — comptage déterministe.`,
        explanation: "Activité relative des arêtes validées dans ce bundle — heuristique locale.",
        sourceSignals: [`activeEdges=${active}`, `totalEdges=${edges.length}`],
      });
    }

    if (clusters.some((c) => c.clusterType === "RETAILER_SINGLE_SOURCE")) {
      push("dependency_pressure_signal", {
        signalId: "sig-dep-pressure",
        affectedNodes: clusters.flatMap((c) => c.involvedOrganizations).slice(0, 24),
        affectedEdges: [],
        affectedTerritories: [],
        severity: "medium",
        confidence: 0.58,
        confidenceExplanation: "confidence=0.58 fixe documentée quand au moins un cluster RETAILER_SINGLE_SOURCE est présent (règle déterministe).",
        explanation: "Pression de dépendance détectée via cluster détaillant — pas un jugement sur un partenaire.",
        sourceSignals: ["rule=retailer_single_source_cluster_exists"],
      });
    }

    if (clusters.some((c) => c.clusterType === "WHOLESALER_CONCENTRATION")) {
      push("concentration_warning_signal", {
        signalId: "sig-concentration",
        affectedNodes: [],
        affectedEdges: [],
        affectedTerritories: [],
        severity: "high",
        confidence: 0.62,
        confidenceExplanation: "confidence=0.62 lorsque cluster WHOLESALER_CONCENTRATION présent (seuil arêtes aval).",
        explanation: "Concentration de flux sur grossiste dans ce sous-graphe — lecture corridor distribution.",
        sourceSignals: ["rule=wholesaler_concentration_cluster"],
      });
    }

    if (coverage.coverageGaps.length > 0) {
      push("coverage_gap_signal", {
        signalId: "sig-coverage-gap",
        affectedNodes: [],
        affectedEdges: [],
        affectedTerritories: coverage.coverageGaps,
        severity: "low",
        confidence: 0.52,
        confidenceExplanation: "confidence=0.52 lorsque cellules symboliques signalent coverageGap=true.",
        explanation: "Trous de couverture symboliques sur libellés territoire — non carte GPS.",
        sourceSignals: coverage.coverageGaps.map((t) => `gap:${t}`).slice(0, 12),
      });
    }

    if (bridges.some((b) => b.overloadRisk >= 0.55)) {
      push("bridge_overload_signal", {
        signalId: "sig-bridge",
        affectedNodes: bridges.filter((b) => b.overloadRisk >= 0.55).map((b) => b.organizationId),
        affectedEdges: [],
        affectedTerritories: [],
        severity: "medium",
        confidence: 0.57,
        confidenceExplanation: "confidence=0.57 lorsque overloadRisk>=0.55 sur un pont heuristique.",
        explanation: "Pont commercial surchargé dans ce bundle — proxy de charge, pas capacité transport.",
        sourceSignals: bridges.filter((b) => b.overloadRisk >= 0.55).map((b) => `bridge:${b.bridgeId}`),
      });
    }

    if (edges.some((e) => e.activityState === "DORMANT")) {
      push("dormant_network_signal", {
        signalId: "sig-dormant",
        affectedNodes: [],
        affectedEdges: edges.filter((e) => e.activityState === "DORMANT").map((e) => e.relationshipId),
        affectedTerritories: [],
        severity: "low",
        confidence: 0.54,
        confidenceExplanation: "confidence=0.54 si au moins une arête classée DORMANT (âge acceptation > 365j).",
        explanation: "Segments relationnels dormants — rappel cadence commerciale.",
        sourceSignals: ["rule=dormant_edge_present"],
      });
    }

    if (edges.some((e) => e.relationshipType === "EXPANSION_RELATION")) {
      push("expansion_opportunity_signal", {
        signalId: "sig-expansion",
        affectedNodes: [],
        affectedEdges: edges.filter((e) => e.relationshipType === "EXPANSION_RELATION").map((e) => e.relationshipId),
        affectedTerritories: [],
        severity: "info",
        confidence: 0.5,
        confidenceExplanation: "confidence=0.5 lorsque arêtes récentes (<90j) marquées EXPANSION_RELATION.",
        explanation: "Segments récemment acceptés — opportunité d’ancrage réseau (heuristique).",
        sourceSignals: ["rule=expansion_edge_present"],
      });
    }

    const fragile = edges.filter((e) => e.relationshipType === "FRAGILE_RELATION" || e.relationshipStability < 0.45);
    if (fragile.length > 0) {
      push("network_fragility_signal", {
        signalId: "sig-fragility",
        affectedNodes: [],
        affectedEdges: fragile.map((e) => e.relationshipId),
        affectedTerritories: [],
        severity: "medium",
        confidence: Number(Math.min(1, 0.42 + fragile.length / 12).toFixed(3)),
        confidenceExplanation: "confidence=min(1,0.42+fragileEdgeCount/max(12)) avec fragile = trust bas ou type FRAGILE.",
        explanation: "Fragilité relationnelle locale — combinaison stabilité / type d’arête.",
        sourceSignals: [`fragileEdges=${fragile.length}`],
      });
    }

    if (pendingCount > 0) {
      push("pending_relationship_signal", {
        signalId: "sig-pending-preview",
        affectedNodes: nodes.some((n) => n.organizationId === centerOrganizationId)
          ? [centerOrganizationId]
          : nodes[0]
            ? [nodes[0]!.organizationId]
            : [],
        affectedEdges: [],
        affectedTerritories: [],
        severity: "info",
        confidence: 0.48,
        confidenceExplanation: "confidence=0.48 lorsque includePending actif et pendingCount>0 (aperçu non validé).",
        explanation: `Aperçu demandes en attente: ${pendingCount} — exclues du graphe validé; lecture séparée.`,
        sourceSignals: [`pendingCount=${pendingCount}`, `centerOrg=${centerOrganizationId}`],
      });
    }

    return sigs.sort((a, b) => a.signalId.localeCompare(b.signalId)).slice(0, 32);
  }
}
