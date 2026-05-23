/**
 * Instruction 19.2 / 19.2A — relational catalog access: relationship-scoped, validated edges,
 * role-scoped partner corridors, graph bundle (19.1A) as primary relational truth with
 * bounded Prisma fallback when the graph layer is disabled.
 */
import { Injectable } from "@nestjs/common";
import { OrganizationActorType, OrganizationCategory, Prisma, RelationshipStatus } from "@prisma/client";
import type {
  RelationalAccessibleCatalog,
  RelationalAccessibleProduct,
  RelationalCatalogDiagnostics,
  RelationalCatalogIntelligence,
  RelationalCatalogProductSignal,
  RelationalCatalogResponse,
  RelationalCatalogRoleScopeMode,
  RelationalCatalogSnapshot,
  RelationalCatalogViewerRole,
  RelationalSponsoredInsertionRow,
  RelationalVisibilityScopeRow,
} from "@venext/shared-contracts";
import type { CommercialRelationshipGraphBundle } from "@venext/shared-contracts";
import { RELATIONAL_CATALOG_GRAPH_REUSE_TOKEN } from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { CommercialRelationshipGraphEngineService } from "../commercial-relationship-graph/commercial-relationship-graph-engine.service";
import { RelationalCatalogRealtimePublishService } from "./relational-catalog-realtime-publish.service";

const CATALOG_LIMIT_FULL = 48;
const CATALOG_LIMIT_SUMMARY = 24;
const PRODUCT_LIMIT_FULL = 96;
const PRODUCT_LIMIT_SUMMARY = 40;
const VISIBILITY_SCAN_CAP = 4000;
const OWN_PRODUCT_CAP = 200;
const CURSOR_SEP = ":";

type CorridorEdge = {
  relationshipId: string;
  upstreamOrganizationId: string;
  downstreamOrganizationId: string;
};

@Injectable()
export class RelationalCatalogAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly graphEngine: CommercialRelationshipGraphEngineService,
    private readonly realtime: RelationalCatalogRealtimePublishService,
  ) {}

  private inferViewerRole(category: OrganizationCategory, actor: OrganizationActorType): RelationalCatalogViewerRole {
    if (actor === OrganizationActorType.INDUSTRIAL_PRODUCER) return "INDUSTRIAL_PRODUCER";
    if (category === OrganizationCategory.PRODUCER) return "PRODUCER";
    if (category === OrganizationCategory.WHOLESALER_A || category === OrganizationCategory.WHOLESALER_B) return "WHOLESALER";
    if (category === OrganizationCategory.RETAILER) return "RETAILER";
    if (category === OrganizationCategory.INTERNAL_ADMIN) return "ADMIN_VIEWER";
    return "UNKNOWN_COMMERCIAL_VIEWER";
  }

  /** Instruction 19.2B — sponsor rows must reference a product present in the viewer-visible page slice. */
  static filterSponsoredToVisibleProducts<T extends { productId: string }>(rows: T[], visibleProductIds: Set<string>): T[] {
    return rows.filter((r) => visibleProductIds.has(r.productId));
  }

  static resolveRoleScopeMode(viewerRole: RelationalCatalogViewerRole): RelationalCatalogRoleScopeMode {
    switch (viewerRole) {
      case "INDUSTRIAL_PRODUCER":
      case "PRODUCER":
        return "PRODUCER_DOWNSTREAM_ONLY";
      case "WHOLESALER":
        return "WHOLESALER_UPSTREAM_ONLY";
      case "RETAILER":
        return "RETAILER_SUPPLIER_ONLY";
      case "ADMIN_VIEWER":
        return "ADMIN_NEIGHBOR_ONLY";
      default:
        return "UNKNOWN_SELF_ONLY";
    }
  }

  /** Exported for Instruction 19.2A access-matrix tests (pure role geometry on corridor edges). */
  static scopeAccessForRole(viewerRole: RelationalCatalogViewerRole, viewerId: string, corridorEdges: CorridorEdge[]) {
    const partners = new Set<string>();
    const relIds = new Set<string>();

    const recordUpstreamPartners = () => {
      for (const e of corridorEdges) {
        if (e.downstreamOrganizationId === viewerId) {
          partners.add(e.upstreamOrganizationId);
          relIds.add(e.relationshipId);
        }
      }
    };
    const recordDownstreamPartners = () => {
      for (const e of corridorEdges) {
        if (e.upstreamOrganizationId === viewerId) {
          partners.add(e.downstreamOrganizationId);
          relIds.add(e.relationshipId);
        }
      }
    };

    switch (viewerRole) {
      case "INDUSTRIAL_PRODUCER":
      case "PRODUCER":
        recordDownstreamPartners();
        break;
      case "RETAILER":
        recordUpstreamPartners();
        break;
      case "WHOLESALER":
        /** Amont validé uniquement — pas de lecture des catalogues aval (19.2A). */
        recordUpstreamPartners();
        break;
      case "ADMIN_VIEWER":
        for (const e of corridorEdges) {
          if (e.upstreamOrganizationId === viewerId) {
            partners.add(e.downstreamOrganizationId);
            relIds.add(e.relationshipId);
          } else if (e.downstreamOrganizationId === viewerId) {
            partners.add(e.upstreamOrganizationId);
            relIds.add(e.relationshipId);
          }
        }
        break;
      default:
        break;
    }

    const allowedOrgIds = new Set<string>([viewerId, ...partners]);
    return {
      allowedOrgIds,
      corridorRelationshipIds: [...relIds],
      allowedPartnerOrgIds: partners,
    };
  }

  /** Instruction 20.6 — resolve ACCEPTED corridor edge id between viewer org and product owner (org-scoped visibility). */
  private static resolveRelationshipIdBetweenOrganizations(
    edges: CorridorEdge[],
    orgA: string,
    orgB: string,
  ): string | undefined {
    if (!orgA || !orgB || orgA === orgB) return undefined;
    for (const e of edges) {
      const { upstreamOrganizationId: up, downstreamOrganizationId: down, relationshipId } = e;
      if ((up === orgA && down === orgB) || (up === orgB && down === orgA)) return relationshipId;
    }
    return undefined;
  }

  private encodeCatalogCursor(ownerOrganizationId: string, catalogId: string): string {
    return `${ownerOrganizationId}${CURSOR_SEP}${catalogId}`;
  }

  private parseCatalogCursor(raw?: string): { ownerOrganizationId: string; catalogId: string } | null {
    if (!raw?.includes(CURSOR_SEP)) return null;
    const i = raw.indexOf(CURSOR_SEP);
    const ownerOrganizationId = raw.slice(0, i);
    const catalogId = raw.slice(i + 1);
    if (ownerOrganizationId.length < 32 || catalogId.length < 32) return null;
    return { ownerOrganizationId, catalogId };
  }

  private encodeProductCursor(catalogId: string, productId: string): string {
    return `${catalogId}${CURSOR_SEP}${productId}`;
  }

  private parseProductCursor(raw?: string): { catalogId: string; productId: string } | null {
    if (!raw?.includes(CURSOR_SEP)) return null;
    const i = raw.indexOf(CURSOR_SEP);
    const catalogId = raw.slice(0, i);
    const productId = raw.slice(i + 1);
    if (catalogId.length < 32 || productId.length < 32) return null;
    return { catalogId, productId };
  }

  private countIncidentNeighborOrganizations(viewerId: string, edges: CorridorEdge[]): number {
    const n = new Set<string>();
    for (const e of edges) {
      if (e.upstreamOrganizationId === viewerId) n.add(e.downstreamOrganizationId);
      if (e.downstreamOrganizationId === viewerId) n.add(e.upstreamOrganizationId);
    }
    return n.size;
  }

  private async resolveCorridorEdges(
    organizationId: string,
    graphBundle: CommercialRelationshipGraphBundle,
  ): Promise<{ edges: CorridorEdge[]; graphDegraded: boolean; incidentNeighborOrgCount: number }> {
    const fromGraph = graphBundle.snapshot.edges
      .filter((e) => e.upstreamOrganizationId === organizationId || e.downstreamOrganizationId === organizationId)
      .map((e) => ({
        relationshipId: e.relationshipId,
        upstreamOrganizationId: e.upstreamOrganizationId,
        downstreamOrganizationId: e.downstreamOrganizationId,
      }));

    /** Graphe ACTIF = vérité relationnelle même si incident vide (pas de second chemin Prisma élargi). */
    if (graphBundle.policy === "ACTIVE") {
      return {
        edges: fromGraph,
        graphDegraded: false,
        incidentNeighborOrgCount: this.countIncidentNeighborOrganizations(organizationId, fromGraph),
      };
    }

    const rels = await this.prisma.relationship.findMany({
      where: {
        status: RelationshipStatus.ACCEPTED,
        upstreamOrganizationId: { not: null },
        downstreamOrganizationId: { not: null },
        OR: [{ upstreamOrganizationId: organizationId }, { downstreamOrganizationId: organizationId }],
      },
      select: { id: true, upstreamOrganizationId: true, downstreamOrganizationId: true },
      take: 400,
    });
    const edges: CorridorEdge[] = [];
    for (const r of rels) {
      if (!r.upstreamOrganizationId || !r.downstreamOrganizationId) continue;
      edges.push({
        relationshipId: r.id,
        upstreamOrganizationId: r.upstreamOrganizationId,
        downstreamOrganizationId: r.downstreamOrganizationId,
      });
    }
    return {
      edges,
      graphDegraded: true,
      incidentNeighborOrgCount: this.countIncidentNeighborOrganizations(organizationId, edges),
    };
  }

  async buildSnapshot(
    organizationId: string,
    projection: "summary" | "full",
    opts?: { productCursor?: string; catalogCursor?: string },
  ): Promise<RelationalCatalogResponse> {
    const enabled = await this.flags.isEnabled("relational_catalog_enabled", { organizationId });
    if (!enabled) {
      return { policy: "DISABLED", snapshot: this.disabledSnapshot(organizationId, projection) };
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, displayName: true, category: true, actorType: true, city: true, country: true },
    });
    if (!org) {
      return { policy: "DISABLED", snapshot: this.disabledSnapshot(organizationId, projection, "organization_missing") };
    }

    const viewerRole = this.inferViewerRole(org.category, org.actorType);
    const territoryLabel = [org.country, org.city].filter(Boolean).join(" / ").slice(0, 160) || null;

    const { bundle: graphBundle } = await this.graphEngine.getBundleWithCacheMeta(organizationId, projection, {
      includePending: false,
    });

    const { edges: corridorEdges, graphDegraded, incidentNeighborOrgCount } = await this.resolveCorridorEdges(
      organizationId,
      graphBundle,
    );
    const { allowedOrgIds, corridorRelationshipIds, allowedPartnerOrgIds } = RelationalCatalogAccessService.scopeAccessForRole(
      viewerRole,
      organizationId,
      corridorEdges,
    );
    const relIds = corridorRelationshipIds;

    const catalogLimit = projection === "full" ? CATALOG_LIMIT_FULL : CATALOG_LIMIT_SUMMARY;
    const productLimit = projection === "full" ? PRODUCT_LIMIT_FULL : PRODUCT_LIMIT_SUMMARY;

    const catalogAfter = this.parseCatalogCursor(opts?.catalogCursor);
    const catalogsRaw = await this.prisma.catalog.findMany({
      where: {
        organizationId: { in: [...allowedOrgIds] },
        active: true,
        ...(catalogAfter
          ? {
              OR: [
                { organizationId: { gt: catalogAfter.ownerOrganizationId } },
                {
                  organizationId: catalogAfter.ownerOrganizationId,
                  id: { gt: catalogAfter.catalogId },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ organizationId: "asc" }, { id: "asc" }],
      take: catalogLimit + 1,
      select: {
        id: true,
        name: true,
        catalogType: true,
        visibilityMode: true,
        organizationId: true,
        organization: { select: { displayName: true } },
      },
    });
    const catalogsTruncated = catalogsRaw.length > catalogLimit;
    const catalogs = catalogsRaw.slice(0, catalogLimit);

    const visibilityWhere =
      relIds.length > 0
        ? {
            active: true,
            OR: [
              { visibleToOrganizationId: organizationId },
              { visibleToRelationshipId: { in: relIds } },
            ],
          }
        : { active: true, visibleToOrganizationId: organizationId };

    const visRows = await this.prisma.productVisibility.findMany({
      where: {
        ...visibilityWhere,
        product: { active: true },
      },
      select: {
        id: true,
        productId: true,
        visibilityType: true,
        visibleToRelationshipId: true,
        visibleToOrganizationId: true,
        expiresAt: true,
        product: {
          select: {
            id: true,
            organizationId: true,
            catalogId: true,
            name: true,
            category: true,
            stockStatus: true,
            unitLabel: true,
            organization: { select: { displayName: true } },
            catalog: { select: { id: true, name: true, organizationId: true } },
          },
        },
      },
      take: VISIBILITY_SCAN_CAP,
    });

    const productMap = new Map<string, RelationalAccessibleProduct>();
    const visibilityScopes: RelationalVisibilityScopeRow[] = [];

    const pushScope = (row: {
      scopeId: string;
      visibilitySource: RelationalVisibilityScopeRow["visibilitySource"];
      visibilityReason: string;
      injectedVisibility: boolean;
      sponsorOrigin: string | null;
      relationshipId: string | null;
      relationshipDistance: number;
    }) => {
      visibilityScopes.push({
        ...row,
        territoryLabel,
        actorCategory: null,
      });
    };

    for (const v of visRows) {
      const p = v.product;
      if (!p || !allowedOrgIds.has(p.organizationId)) continue;
      const relDist = v.visibleToRelationshipId ? 1 : v.visibleToOrganizationId ? 1 : 2;
      const sponsored = v.visibilityType === "SPONSORED_INJECTION";
      const visibilitySource: RelationalVisibilityScopeRow["visibilitySource"] = sponsored
        ? "SPONSORED_INJECTION"
        : "RELATIONSHIP";
      const relationshipOrigin = v.visibleToRelationshipId
        ? `relationshipId=${v.visibleToRelationshipId}`
        : v.visibleToOrganizationId
          ? `visibleToOrganizationId=${v.visibleToOrganizationId}`
          : "visibility_scope";
      pushScope({
        scopeId: `vis-${v.id}`,
        visibilitySource,
        visibilityReason: `ProductVisibility(${v.visibilityType}) active for viewer org`,
        injectedVisibility: sponsored,
        sponsorOrigin: null,
        relationshipId: v.visibleToRelationshipId,
        relationshipDistance: relDist,
      });
      const cartEligibleRelationshipId =
        v.visibleToRelationshipId ??
        (v.visibleToOrganizationId === organizationId
          ? RelationalCatalogAccessService.resolveRelationshipIdBetweenOrganizations(
              corridorEdges,
              organizationId,
              p.organizationId,
            )
          : undefined);
      productMap.set(p.id, {
        productId: p.id,
        catalogId: p.catalogId,
        unitLabel: p.unitLabel,
        sourceOrganizationId: p.organizationId,
        sourceOrganizationName: p.organization.displayName,
        visibilityScope: v.visibilityType,
        relationshipOrigin,
        relationshipDistance: relDist,
        commercialAvailability: "SYMBOLIC_STOCK_STATUS",
        commercialSignals: [
          `stockStatus=${p.stockStatus}`,
          `category=${p.category}`,
          `visibilityType=${v.visibilityType}`,
          v.expiresAt ? `expiresAt=${v.expiresAt.toISOString()}` : "no_expiry",
        ],
        sponsored,
        confidence: 0.72,
        explanation:
          "Disponibilité = statut symbolique Prisma (stockStatus) — pas d’inventaire temps réel, pas de promesse logistique.",
        cartEligibleRelationshipId,
      });
    }

    const ownProducts = await this.prisma.product.findMany({
      where: { organizationId, active: true, catalog: { active: true } },
      orderBy: { id: "asc" },
      take: OWN_PRODUCT_CAP,
      select: {
        id: true,
        catalogId: true,
        organizationId: true,
        name: true,
        category: true,
        stockStatus: true,
        unitLabel: true,
        organization: { select: { displayName: true } },
      },
    });
    for (const p of ownProducts) {
      if (productMap.has(p.id)) continue;
      pushScope({
        scopeId: `own-${p.id}`,
        visibilitySource: "ORGANIZATION",
        visibilityReason: "Produit du catalogue interne de l’organisation (portée propriétaire)",
        injectedVisibility: false,
        sponsorOrigin: null,
        relationshipId: null,
        relationshipDistance: 0,
      });
      productMap.set(p.id, {
        productId: p.id,
        catalogId: p.catalogId,
        unitLabel: p.unitLabel,
        sourceOrganizationId: p.organizationId,
        sourceOrganizationName: p.organization.displayName,
        visibilityScope: "ORGANIZATION_OWN_CATALOG",
        relationshipOrigin: "owner_organization",
        relationshipDistance: 0,
        commercialAvailability: "SYMBOLIC_STOCK_STATUS",
        commercialSignals: [`stockStatus=${p.stockStatus}`, `category=${p.category}`, "rule=own_active_catalog"],
        sponsored: false,
        confidence: 0.78,
        explanation:
          "Article du catalogue interne — lisible par l’organisation propriétaire; statut stock symbolique issu de Prisma.",
      });
    }

    const productAfter = this.parseProductCursor(opts?.productCursor);
    const productsSorted = [...productMap.values()].sort((a, b) => {
      const c = a.catalogId.localeCompare(b.catalogId);
      if (c !== 0) return c;
      return a.productId.localeCompare(b.productId);
    });
    const productsFiltered = productAfter
      ? productsSorted.filter(
          (p) =>
            p.catalogId > productAfter.catalogId ||
            (p.catalogId === productAfter.catalogId && p.productId > productAfter.productId),
        )
      : productsSorted;
    const productsTruncated = productsFiltered.length > productLimit;
    const accessibleProducts = productsFiltered.slice(0, productLimit);
    const visibleProductIds = new Set(accessibleProducts.map((p) => p.productId));

    const perCatalogVisibleCount = new Map<string, number>();
    for (const p of accessibleProducts) {
      perCatalogVisibleCount.set(p.catalogId, (perCatalogVisibleCount.get(p.catalogId) ?? 0) + 1);
    }

    const accessibleCatalogs: RelationalAccessibleCatalog[] = catalogs.map((c) => ({
      catalogId: c.id,
      ownerOrganizationId: c.organizationId,
      ownerOrganizationName: c.organization.displayName,
      name: c.name,
      catalogType: String(c.catalogType),
      visibilityMode: String(c.visibilityMode),
      relationshipScoped: true,
      accessibleProductCount: perCatalogVisibleCount.get(c.id) ?? 0,
      explanation:
        c.organizationId === organizationId
          ? "Catalogue interne — portée organisation."
          : "Catalogue partenaire — exposé uniquement via relations validées, graphe 19.1A (ou repli Prisma borné) et règles de visibilité.",
    }));

    const injWhere: Prisma.SponsoredProductInjectionWhereInput = { active: true };
    const injOr: Prisma.SponsoredProductInjectionWhereInput[] = [];
    if (relIds.length > 0) injOr.push({ relationshipId: { in: relIds } });
    if (allowedPartnerOrgIds.size > 0)
      injOr.push({ relationshipId: null, sponsorOrganizationId: { in: [...allowedPartnerOrgIds] } });
    if (injOr.length > 0) injWhere.OR = injOr;

    const injRows =
      injOr.length > 0
        ? await this.prisma.sponsoredProductInjection.findMany({
            where: injWhere,
            take: 80,
            select: {
              id: true,
              productId: true,
              sponsorOrganizationId: true,
              relationshipId: true,
              relevanceFloor: true,
              maxRelationshipDepth: true,
              active: true,
            },
          })
        : [];

    const relIdSet = new Set(relIds);
    const sponsoredInsertionsRaw: RelationalSponsoredInsertionRow[] = injRows
      .filter((i) => {
        if (i.relationshipId && relIdSet.has(i.relationshipId)) return true;
        if (!i.relationshipId && allowedPartnerOrgIds.has(i.sponsorOrganizationId)) return true;
        return false;
      })
      .map((i) => ({
        injectionId: i.id,
        productId: i.productId,
        sponsorOrganizationId: i.sponsorOrganizationId,
        relationshipId: i.relationshipId,
        relevanceFloor: i.relevanceFloor,
        maxRelationshipDepth: i.maxRelationshipDepth,
        active: i.active,
        explanation:
          "Injection sponsorisée — extension de visibilité contrôlée, alignée sur les produits réellement accessibles au viewer (19.2A).",
      }));

    const sponsoredInsertions = RelationalCatalogAccessService.filterSponsoredToVisibleProducts(
      sponsoredInsertionsRaw,
      visibleProductIds,
    );

    const relationalRestrictions = [
      "no_public_discovery",
      "no_open_marketplace",
      "no_cross_org_unrestricted_load",
      "validated_relationship_edges_only",
      "relationship_scoped_product_visibility",
      "role_scoped_partner_corridor",
      "sponsored_injection_requires_visible_product",
    ];

    const productSignals = this.buildProductSignals(accessibleProducts, accessibleCatalogs, sponsoredInsertions, graphBundle.snapshot.overview.fragilityIndex);

    const catalogOwners = new Set(accessibleCatalogs.map((c) => c.ownerOrganizationId));
    let partnersWithCatalogInPage = 0;
    for (const pid of allowedPartnerOrgIds) {
      if (catalogOwners.has(pid)) partnersWithCatalogInPage += 1;
    }
    const catalogIntelligence = this.buildIntelligence(
      corridorEdges.length,
      allowedPartnerOrgIds.size,
      accessibleCatalogs.length,
      accessibleProducts.length,
      sponsoredInsertions.length,
      graphBundle.snapshot.overview,
      Math.max(0, allowedPartnerOrgIds.size - partnersWithCatalogInPage),
      incidentNeighborOrgCount,
    );

    const lastCatalog = accessibleCatalogs[accessibleCatalogs.length - 1];
    const lastProduct = accessibleProducts[accessibleProducts.length - 1];

    const partnerSource = graphDegraded ? "PRISMA_FALLBACK" : "GRAPH_BUNDLE";
    const roleScopeMode = RelationalCatalogAccessService.resolveRoleScopeMode(viewerRole);

    const diagnostics: RelationalCatalogDiagnostics = {
      relationshipScopedCatalogs: true,
      validatedRelationshipOnly: true,
      publicMarketplaceDisabled: true,
      publicDiscoveryDisabled: true,
      socialCommerceDisabled: true,
      graphReuse: RELATIONAL_CATALOG_GRAPH_REUSE_TOKEN,
      sourceBundlesEmbedded: false,
      payloadWeightClass: projection === "full" ? "large" : "compact",
      degradedMode: graphDegraded,
      snapshotSource: graphDegraded
        ? "PRISMA_FALLBACK_CORRIDOR_VISIBILITY_CATALOG_PRODUCT"
        : "CRG_19.1A_CORRIDOR_PRISMA_VISIBILITY_CATALOG_PRODUCT",
      paginationSupported: true,
      productsLimit: productLimit,
      catalogsLimit: catalogLimit,
      productsTruncated,
      catalogsTruncated,
      visibilityScopedLoading: true,
      nextProductCursor: productsTruncated && lastProduct ? this.encodeProductCursor(lastProduct.catalogId, lastProduct.productId) : null,
      nextCatalogCursor:
        catalogsTruncated && lastCatalog
          ? this.encodeCatalogCursor(lastCatalog.ownerOrganizationId, lastCatalog.catalogId)
          : null,
      partnerSource,
      fallbackUsed: graphDegraded,
      graphPartnerCount: incidentNeighborOrgCount,
      adminBroadReadSupported: false,
      roleScopedAccess: true,
      roleScopeMode,
      cursorStrategy: "COMPOSITE_KEYSET",
      signalHeuristicOnly: true,
      visibilityPolicy: "RELATIONSHIP_SCOPED_ONLY",
      catalogExposureMode: "PARTNER_NETWORK_ONLY",
      sponsorGlobalInjectionBlocked: true,
      sponsorRequiresRelationshipScope: true,
    };

    const snapshot: RelationalCatalogSnapshot = {
      version: "1",
      generatedAt: new Date().toISOString(),
      organizationId,
      viewerRole,
      accessibleCatalogs,
      accessibleProducts,
      visibilityScopes: visibilityScopes.slice(0, projection === "full" ? 48 : 24),
      sponsoredInsertions,
      relationalRestrictions,
      productSignals,
      catalogIntelligence,
      catalogDiagnostics: diagnostics,
    };

    this.realtime.publishCatalogPulse(organizationId, snapshot);
    return { policy: "ACTIVE", snapshot };
  }

  private buildIntelligence(
    corridorEdgeCount: number,
    roleScopedPartnerCount: number,
    catalogCount: number,
    productCount: number,
    sponsorCount: number,
    overview: { concentrationIndex: number; coverageIndex: number; fragilityIndex: number; partnerOrganizationCount: number; wholesalerNeighborCount: number },
    partnerCatalogGapOnPage: number,
    incidentNeighborOrgCount: number,
  ): RelationalCatalogIntelligence {
    const relationshipCoverage =
      corridorEdgeCount === 0 ? 0 : Number(Math.min(1, catalogCount / Math.max(1, roleScopedPartnerCount + 1)).toFixed(3));
    const catalogDensity = catalogCount === 0 ? 0 : Number(Math.min(1, productCount / (catalogCount * 12)).toFixed(3));
    const dependencyPressure = overview.concentrationIndex;
    const isolatedRetailersProxy = Math.min(48, partnerCatalogGapOnPage);
    const concentratedWholesalersProxy = Math.min(12, Math.max(0, overview.wholesalerNeighborCount));
    const sponsorSaturation = productCount === 0 ? 0 : Number(Math.min(1, sponsorCount / Math.max(1, productCount)).toFixed(3));
    const visibilityImbalance = Number(Math.min(1, Math.abs(productCount - catalogCount * 6) / Math.max(1, productCount + 1)).toFixed(3));
    const proxyInputs = [
      `incidentNeighborOrgCount=${incidentNeighborOrgCount}`,
      `corridorAcceptedEdgeCount=${corridorEdgeCount}`,
      `roleScopedPartnerCount=${roleScopedPartnerCount}`,
      `catalogPageCount=${catalogCount}`,
      `productPageCount=${productCount}`,
      `sponsorVisibleAlignedCount=${sponsorCount}`,
      `graph.partnerOrganizationCount=${overview.partnerOrganizationCount}`,
      `graph.wholesalerNeighborCount=${overview.wholesalerNeighborCount}`,
      "isolatedRetailersProxy=page_partner_catalog_gap_bounded",
      "concentratedWholesalersProxy=bounded_graph_wholesaler_neighbor_hint",
    ];
    return {
      relationshipCoverage,
      catalogDensity,
      dependencyPressure,
      isolatedRetailersProxy,
      concentratedWholesalersProxy,
      sponsorSaturation,
      visibilityImbalance,
      proxyDerived: true,
      proxyInputs,
      intelligenceExplanation:
        "Les champs *Proxy (isolatedRetailersProxy, concentratedWholesalersProxy) ne sont pas des comptages terrain vérifiés ni des indicateurs commerce certifiés. " +
        "Ce sont des bornes heuristiques dérivées du snapshot paginé et/ou d’agrégats du bundle graphe 19.1A. " +
        "isolatedRetailersProxy borne : partenaires en corridor sans catalogue dans cette page. " +
        `partnerOrganizationCount(graphe)=${overview.partnerOrganizationCount} (réseau global, distinct du corridor par rôle).`,
    };
  }

  private buildProductSignals(
    products: RelationalAccessibleProduct[],
    catalogs: RelationalAccessibleCatalog[],
    injections: RelationalSponsoredInsertionRow[],
    fragility: number,
  ): RelationalCatalogProductSignal[] {
    const out: RelationalCatalogProductSignal[] = [];
    const push = (s: RelationalCatalogProductSignal) => out.push(s);

    if (products.some((p) => p.commercialSignals.some((x) => x.includes("OUT_OF_STOCK")))) {
      push({
        signalId: "rc-sig-dormant",
        signalType: "dormant_product_signal",
        severity: "low",
        confidence: 0.5,
        confidenceExplanation: "confidence=0.5 lorsqu’au moins un produit porte stockStatus OUT_OF_STOCK (Prisma).",
        heuristicOnly: true,
        advisoryOnly: true,
        symbolicExecution: true,
        explanation: "Articles symboliquement indisponibles — rappel cadence relationnelle, pas alerte logistique temps réel.",
        sourceSignals: ["rule=out_of_stock_present"],
      });
    }
    if (products.length > 24) {
      push({
        signalId: "rc-sig-catalog-density",
        signalType: "relational_catalog_density_signal",
        productId: products[0]?.productId,
        severity: "info",
        confidence: 0.46,
        confidenceExplanation:
          "confidence=0.46 lorsque le volume de produits accessibles dépasse 24 (proxy de densité de références paginées, sans mesure d’intérêt).",
        heuristicOnly: true,
        advisoryOnly: true,
        symbolicExecution: true,
        explanation:
          "Densité élevée de références accessibles dans le périmètre relationnel paginé — lecture de volume symbolique, pas d’appétit marché ni tendance comportementale.",
        sourceSignals: [`accessibleProducts=${products.length}`, "rule=relational_catalog_density_threshold"],
      });
    }
    if (fragility > 0.55) {
      push({
        signalId: "rc-sig-expansion",
        signalType: "relationship_expansion_signal",
        severity: "medium",
        confidence: 0.52,
        confidenceExplanation: "confidence=0.52 lorsque fragilityIndex du bundle graphe > 0.55.",
        heuristicOnly: true,
        advisoryOnly: true,
        symbolicExecution: true,
        explanation: "Réseau relationnel signalé fragile côté graphe 19.1 — opportunité d’ancrage de visibilité contrôlée (consultatif).",
        sourceSignals: [`graph.fragilityIndex=${fragility}`],
      });
    }
    if (injections.length >= 6) {
      push({
        signalId: "rc-sig-supply-pressure",
        signalType: "supply_pressure_signal",
        severity: "low",
        confidence: 0.48,
        confidenceExplanation: "confidence=0.48 lorsque injections actives alignées sur produits visibles >= 6 (saturation sponsor proxy).",
        heuristicOnly: true,
        advisoryOnly: true,
        symbolicExecution: true,
        explanation: "Pression de visibilité sponsorisée dans le sous-réseau — extension contrôlée, toujours relationship-bounded.",
        sourceSignals: [`visibleAlignedInjections=${injections.length}`],
      });
    }
    if (injections.length > 0) {
      push({
        signalId: "rc-sig-visibility-injection",
        signalType: "visibility_injection_signal",
        severity: "info",
        confidence: 0.55,
        confidenceExplanation: "confidence=0.55 fixe documentée lorsque des injections sponsorisées actives alignées sont présentes.",
        heuristicOnly: true,
        advisoryOnly: true,
        symbolicExecution: true,
        explanation: "Visibilité étendue via injections — cloisonnées, alignées sur produits accessibles (19.2A).",
        sourceSignals: injections.slice(0, 6).map((i) => `injection=${i.injectionId}`),
      });
    }
    if (catalogs.length === 1 && catalogs[0]?.ownerOrganizationId) {
      push({
        signalId: "rc-sig-isolated-catalog",
        signalType: "isolated_catalog_signal",
        severity: "low",
        confidence: 0.44,
        confidenceExplanation: "confidence=0.44 lorsqu’un seul catalogue accessible est listé.",
        heuristicOnly: true,
        advisoryOnly: true,
        symbolicExecution: true,
        explanation: "Catalogue unique visible dans le périmètre — dépendance de couverture relationnelle possible.",
        sourceSignals: [`catalogs=${catalogs.length}`],
      });
    }
    if (catalogs.length > 0 && products.length / catalogs.length < 1.5) {
      push({
        signalId: "rc-sig-distribution-gap",
        signalType: "distribution_gap_signal",
        severity: "medium",
        confidence: 0.51,
        confidenceExplanation: "confidence=0.51 lorsque produits/catalogues < 1.5 (proxy trou de couverture).",
        heuristicOnly: true,
        advisoryOnly: true,
        symbolicExecution: true,
        explanation: "Faible densité d’articles par catalogue accessible — lecture réseau, pas recommandation produit.",
        sourceSignals: [`ratio=${(products.length / catalogs.length).toFixed(2)}`],
      });
    }

    return out.sort((a, b) => a.signalId.localeCompare(b.signalId)).slice(0, 24);
  }

  private disabledSnapshot(
    organizationId: string,
    projection: "summary" | "full",
    reason = "relational_catalog_disabled",
  ): RelationalCatalogSnapshot {
    const ts = new Date().toISOString();
    const limC = projection === "full" ? CATALOG_LIMIT_FULL : CATALOG_LIMIT_SUMMARY;
    const limP = projection === "full" ? PRODUCT_LIMIT_FULL : PRODUCT_LIMIT_SUMMARY;
    const emptyIntel: RelationalCatalogIntelligence = {
      relationshipCoverage: 0,
      catalogDensity: 0,
      dependencyPressure: 0,
      isolatedRetailersProxy: 0,
      concentratedWholesalersProxy: 0,
      sponsorSaturation: 0,
      visibilityImbalance: 0,
      proxyDerived: true,
      proxyInputs: ["layer=relational_catalog_disabled"],
      intelligenceExplanation:
        "Couche désactivée — pas de métriques terrain ; pas d’intelligence catalogue relationnelle matérialisée. Les champs *Proxy ci-dessus sont neutres (0) et non interprétables comme vérité opérationnelle.",
    };
    return {
      version: "1",
      generatedAt: ts,
      organizationId,
      viewerRole: "UNKNOWN_COMMERCIAL_VIEWER",
      accessibleCatalogs: [],
      accessibleProducts: [],
      visibilityScopes: [],
      sponsoredInsertions: [],
      relationalRestrictions: [reason, "no_public_discovery", "validated_relationship_edges_only"],
      productSignals: [],
      catalogIntelligence: emptyIntel,
      catalogDiagnostics: {
        relationshipScopedCatalogs: true,
        validatedRelationshipOnly: true,
        publicMarketplaceDisabled: true,
        publicDiscoveryDisabled: true,
        socialCommerceDisabled: true,
        graphReuse: RELATIONAL_CATALOG_GRAPH_REUSE_TOKEN,
        sourceBundlesEmbedded: false,
        payloadWeightClass: "compact",
        degradedMode: true,
        snapshotSource: "DISABLED",
        paginationSupported: true,
        productsLimit: limP,
        catalogsLimit: limC,
        productsTruncated: false,
        catalogsTruncated: false,
        visibilityScopedLoading: true,
        nextProductCursor: null,
        nextCatalogCursor: null,
        partnerSource: "PRISMA_FALLBACK",
        fallbackUsed: true,
        graphPartnerCount: 0,
        adminBroadReadSupported: false,
        roleScopedAccess: true,
        roleScopeMode: "UNKNOWN_SELF_ONLY",
        cursorStrategy: "COMPOSITE_KEYSET",
        signalHeuristicOnly: true,
        visibilityPolicy: "RELATIONSHIP_SCOPED_ONLY",
        catalogExposureMode: "PARTNER_NETWORK_ONLY",
        sponsorGlobalInjectionBlocked: true,
        sponsorRequiresRelationshipScope: true,
      },
    };
  }
}
