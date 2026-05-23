/**
 * Instruction 20.0 / 20.0A — relational orders read surface: Prisma Order + Relationship + graph 19.1A corridor (no parallel engine).
 *
 * **Instruction 20.3A — commercial trust & orders**
 * This module is **read-only** for `Order` mutations in the current codebase: relational orders snapshots do not write
 * `Order` rows. Trust heuristics that read `Order` are refreshed via:
 * - `NegotiationToCartConverterService` (draft order creation) → `CommercialTrustTouchService.touchOrganizations`, and
 * - cron / ops: `POST /v1/internal/v1/commercial-trust/recompute-orders-impact/:organizationId` (same compute path as
 *   `recompute`, re-reads Order aggregates inside `CommercialTrustComputationService`).
 */
import { Injectable, Optional } from "@nestjs/common";
import { OrganizationActorType, OrganizationCategory, Prisma, RelationshipStatus } from "@prisma/client";
import type {
  CommercialRelationshipGraphBundle,
  RelationalCatalogViewerRole,
  RelationalOrderDiagnostics,
  RelationalOrderLine,
  RelationalOrderSignalType,
  RelationalOrderSnapshot,
  RelationalOrderStatus,
  RelationalOrderType,
  RelationalOrdersResponse,
  RelationalOrdersSnapshot,
} from "@venext/shared-contracts";
import {
  RELATIONAL_CATALOG_GRAPH_REUSE_TOKEN,
  RELATIONAL_ORDER_CATALOG_SCOPE_CONTRAST,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { CommercialRelationshipGraphEngineService } from "../commercial-relationship-graph/commercial-relationship-graph-engine.service";
import { RelationalCatalogAccessService } from "../relational-catalog/relational-catalog-access.service";
import { encodeRelationalOrderCursor, parseRelationalOrderCursor } from "./relational-orders-keyset";
import { RelationalOrdersRealtimePublishService } from "./relational-orders-realtime-publish.service";
import { RelationshipGovernanceService } from "../relationship-governance/relationship-governance.service";
import {
  buildRelationshipDirectionWhere,
  buildRelationshipEndpointMap,
  type CorridorEdge,
} from "./relational-orders-relationship-endpoints";
import { prismaWhereForRelationalOrderStatus, RelationalOrdersStateService } from "./relational-orders-state.service";

const ORDERS_LIMIT_SUMMARY = 16;
const ORDERS_LIMIT_FULL = 32;

const SCOPE_EXPLANATION_FR =
  "Un grossiste lit ses catalogues fournisseurs en amont, mais lit ses commandes fournisseurs ET clients car les commandes sont bidirectionnelles. Les autres profils suivent la géométrie corridor (producteur aval, détaillant amont, admin voisins).";

const ALL_ORDER_TYPES: RelationalOrderType[] = [
  "DIRECT_RELATIONAL_ORDER",
  "NEGOTIATED_ORDER",
  "GROUPED_PROCUREMENT_ORDER",
  "RESERVATION_CONVERSION_ORDER",
];

const ALL_SIGNAL_TYPES: RelationalOrderSignalType[] = [
  "ORDER_CONCENTRATION_RISK",
  "DELIVERY_DELAY_RISK",
  "DEPENDENCY_ORDER_RISK",
  "DORMANT_RELATION_ORDER_SIGNAL",
  "RELATIONAL_VOLUME_SHIFT",
  "SYMBOLIC_STOCK_WARNING",
];

const CONDITIONAL_SIGNALS: RelationalOrderSignalType[] = [
  "RELATIONAL_VOLUME_SHIFT",
  "DELIVERY_DELAY_RISK",
  "DORMANT_RELATION_ORDER_SIGNAL",
];

const DEEPER_ONLY_SIGNALS: RelationalOrderSignalType[] = [
  "ORDER_CONCENTRATION_RISK",
  "DEPENDENCY_ORDER_RISK",
  "SYMBOLIC_STOCK_WARNING",
];

const ALL_REL_STATUSES: RelationalOrderStatus[] = [
  "DRAFT",
  "NEGOTIATION",
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_DISPATCH",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "EXPIRED",
];

export function resolveOrderRelationshipIds(
  viewerRole: RelationalCatalogViewerRole,
  viewerId: string,
  edges: CorridorEdge[],
): string[] {
  if (viewerRole === "WHOLESALER" || viewerRole === "ADMIN_VIEWER") {
    const s = new Set<string>();
    for (const e of edges) {
      if (e.upstreamOrganizationId === viewerId || e.downstreamOrganizationId === viewerId) s.add(e.relationshipId);
    }
    return [...s];
  }
  return RelationalCatalogAccessService.scopeAccessForRole(viewerRole, viewerId, edges).corridorRelationshipIds;
}

@Injectable()
export class RelationalOrdersAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly graphEngine: CommercialRelationshipGraphEngineService,
    private readonly state: RelationalOrdersStateService,
    private readonly realtime: RelationalOrdersRealtimePublishService,
    @Optional() private readonly corridorGovernance?: RelationshipGovernanceService,
  ) {}

  private inferViewerRole(category: OrganizationCategory, actor: OrganizationActorType): RelationalCatalogViewerRole {
    if (actor === OrganizationActorType.INDUSTRIAL_PRODUCER) return "INDUSTRIAL_PRODUCER";
    if (category === OrganizationCategory.PRODUCER) return "PRODUCER";
    if (category === OrganizationCategory.WHOLESALER_A || category === OrganizationCategory.WHOLESALER_B) return "WHOLESALER";
    if (category === OrganizationCategory.RETAILER) return "RETAILER";
    if (category === OrganizationCategory.INTERNAL_ADMIN) return "ADMIN_VIEWER";
    return "UNKNOWN_COMMERCIAL_VIEWER";
  }

  private async resolveCorridorEdges(
    organizationId: string,
    graphBundle: CommercialRelationshipGraphBundle,
  ): Promise<{ edges: CorridorEdge[]; graphDegraded: boolean }> {
    const fromGraph = graphBundle.snapshot.edges
      .filter((e) => e.upstreamOrganizationId === organizationId || e.downstreamOrganizationId === organizationId)
      .map((e) => ({
        relationshipId: e.relationshipId,
        upstreamOrganizationId: e.upstreamOrganizationId,
        downstreamOrganizationId: e.downstreamOrganizationId,
      }));
    if (graphBundle.policy === "ACTIVE") {
      return { edges: fromGraph, graphDegraded: false };
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
    return { edges, graphDegraded: true };
  }

  private orderRelationshipIds(viewerRole: RelationalCatalogViewerRole, viewerId: string, edges: CorridorEdge[]): string[] {
    return resolveOrderRelationshipIds(viewerRole, viewerId, edges);
  }

  private baseStatusReadiness(): RelationalOrderDiagnostics["statusReadiness"] {
    const o = {} as RelationalOrderDiagnostics["statusReadiness"];
    for (const s of ALL_REL_STATUSES) {
      o[s] = s === "EXPIRED" ? "NOT_CONNECTED_YET_NO_EXPIRY_SOURCE" : "PRISMA_MAPPED_FILTERABLE";
    }
    return o;
  }

  private disabledDiagnostics(lim: number): RelationalOrderDiagnostics {
    const statusReadiness = this.baseStatusReadiness();
    const unavailableStatuses = ALL_REL_STATUSES.filter(
      (s) => statusReadiness[s] !== "PRISMA_MAPPED_FILTERABLE",
    );
    const orderTypeReadiness = {
      DIRECT_RELATIONAL_ORDER: "NOT_CONNECTED_YET",
      NEGOTIATED_ORDER: "NOT_CONNECTED_YET",
      GROUPED_PROCUREMENT_ORDER: "NOT_CONNECTED_YET",
      RESERVATION_CONVERSION_ORDER: "NOT_CONNECTED_YET",
    } as const;
    const signalReadiness = {
      ORDER_CONCENTRATION_RISK: "NOT_CONNECTED_YET",
      DELIVERY_DELAY_RISK: "NOT_CONNECTED_YET",
      DEPENDENCY_ORDER_RISK: "NOT_CONNECTED_YET",
      DORMANT_RELATION_ORDER_SIGNAL: "NOT_CONNECTED_YET",
      RELATIONAL_VOLUME_SHIFT: "NOT_CONNECTED_YET",
      SYMBOLIC_STOCK_WARNING: "NOT_CONNECTED_YET",
    } as const;
    return {
      relationshipScopedOnly: true,
      publicMarketplaceDisabled: true,
      publicDiscoveryDisabled: true,
      paymentNotIntegrated: true,
      logisticsRealtimeDisabled: true,
      symbolicFulfillmentOnly: true,
      roleScopedAccess: true,
      graphReuse: RELATIONAL_CATALOG_GRAPH_REUSE_TOKEN,
      fallbackUsed: true,
      viewerScopeMode: "UNKNOWN_SELF_ONLY",
      advisorySignalsOnly: true,
      sourceOfTruth: "PRISMA_ORDER_PRISMA_RELATIONSHIP_FALLBACK",
      snapshotSource: "RELATIONAL_ORDERS_DISABLED",
      partnerSource: "PRISMA_FALLBACK",
      nextOrderCursor: null,
      ordersTruncated: false,
      ordersLimit: lim,
      orderScopeMode: "INCIDENT_RELATION_ORDERS",
      catalogScopeContrast: RELATIONAL_ORDER_CATALOG_SCOPE_CONTRAST,
      scopeExplanation: SCOPE_EXPLANATION_FR,
      relationshipDirectionValidated: true,
      rejectedByRelationshipDirectionCount: 0,
      emittedOrderTypes: [],
      unavailableOrderTypes: [...ALL_ORDER_TYPES],
      orderTypeReadiness,
      emittedSignalTypes: [],
      unavailableSignalTypes: [...ALL_SIGNAL_TYPES],
      signalReadiness,
      emittedStatuses: [],
      unavailableStatuses,
      statusReadiness,
      requestedStatusUnsupported: false,
      catalogVisibilityRevalidated: false,
      orderLinesUseHistoricalOrderItems: true,
      catalogPolicySource: "ORDER_ITEM_PRODUCT_REFERENCE",
    };
  }

  private buildActiveDiagnostics(args: {
    lim: number;
    scopeMode: RelationalOrderDiagnostics["viewerScopeMode"];
    graphDegraded: boolean;
    partnerSource: RelationalOrderDiagnostics["partnerSource"];
    nextOrderCursor: string | null;
    truncated: boolean;
    orders: RelationalOrderSnapshot[];
    rejectedByRelationshipDirectionCount: number;
    requestedStatusUnsupported: boolean;
  }): RelationalOrderDiagnostics {
    const emittedOrderTypes = [...new Set(args.orders.map((o) => o.orderType))];
    const unavailableOrderTypes = ALL_ORDER_TYPES.filter(
      (t) => t !== "DIRECT_RELATIONAL_ORDER" && !emittedOrderTypes.includes(t),
    );
    const orderTypeReadiness = {
      DIRECT_RELATIONAL_ORDER: "ACTIVE",
      NEGOTIATED_ORDER: "NOT_CONNECTED_YET",
      GROUPED_PROCUREMENT_ORDER: "NOT_CONNECTED_YET",
      RESERVATION_CONVERSION_ORDER: "NOT_CONNECTED_YET",
    } as const;

    const emittedSignalTypes = [...new Set(args.orders.flatMap((o) => o.heuristicSignals.map((s) => s.signalType)))];
    const unavailableSignalTypes: RelationalOrderSignalType[] = [
      ...DEEPER_ONLY_SIGNALS,
      ...CONDITIONAL_SIGNALS.filter((t) => !emittedSignalTypes.includes(t)),
    ];

    const signalReadiness = {
      ORDER_CONCENTRATION_RISK: "REQUIRES_DEEPER_ORDER_ITEM_ANALYSIS",
      DEPENDENCY_ORDER_RISK: "REQUIRES_DEEPER_ORDER_ITEM_ANALYSIS",
      SYMBOLIC_STOCK_WARNING: "REQUIRES_DEEPER_ORDER_ITEM_ANALYSIS",
      DELIVERY_DELAY_RISK: emittedSignalTypes.includes("DELIVERY_DELAY_RISK")
        ? "EMITTED_HEURISTIC"
        : "AVAILABLE_CONDITIONAL_HEURISTIC",
      DORMANT_RELATION_ORDER_SIGNAL: emittedSignalTypes.includes("DORMANT_RELATION_ORDER_SIGNAL")
        ? "EMITTED_HEURISTIC"
        : "AVAILABLE_CONDITIONAL_HEURISTIC",
      RELATIONAL_VOLUME_SHIFT: emittedSignalTypes.includes("RELATIONAL_VOLUME_SHIFT")
        ? "EMITTED_HEURISTIC"
        : "AVAILABLE_CONDITIONAL_HEURISTIC",
    } as const;

    const emittedStatuses = [...new Set(args.orders.map((o) => o.orderStatus))];
    const statusReadiness = this.baseStatusReadiness();
    const unavailableStatuses = ALL_REL_STATUSES.filter((s) => statusReadiness[s] !== "PRISMA_MAPPED_FILTERABLE");

    return {
      relationshipScopedOnly: true,
      publicMarketplaceDisabled: true,
      publicDiscoveryDisabled: true,
      paymentNotIntegrated: true,
      logisticsRealtimeDisabled: true,
      symbolicFulfillmentOnly: true,
      roleScopedAccess: true,
      graphReuse: RELATIONAL_CATALOG_GRAPH_REUSE_TOKEN,
      fallbackUsed: args.graphDegraded,
      viewerScopeMode: args.scopeMode,
      advisorySignalsOnly: true,
      sourceOfTruth: args.graphDegraded ? "PRISMA_ORDER_PRISMA_RELATIONSHIP_FALLBACK" : "PRISMA_ORDER_RELATIONSHIP_GRAPH",
      snapshotSource: args.graphDegraded ? "PRISMA_RELATIONAL_ORDERS_FALLBACK" : "PRISMA_ORDER_CRG_CORRIDOR_V1",
      partnerSource: args.partnerSource,
      nextOrderCursor: args.nextOrderCursor,
      ordersTruncated: args.truncated,
      ordersLimit: args.lim,
      orderScopeMode: "INCIDENT_RELATION_ORDERS",
      catalogScopeContrast: RELATIONAL_ORDER_CATALOG_SCOPE_CONTRAST,
      scopeExplanation: SCOPE_EXPLANATION_FR,
      relationshipDirectionValidated: true,
      rejectedByRelationshipDirectionCount: args.rejectedByRelationshipDirectionCount,
      emittedOrderTypes,
      unavailableOrderTypes,
      orderTypeReadiness,
      emittedSignalTypes,
      unavailableSignalTypes,
      signalReadiness,
      emittedStatuses,
      unavailableStatuses,
      statusReadiness,
      requestedStatusUnsupported: args.requestedStatusUnsupported,
      catalogVisibilityRevalidated: false,
      orderLinesUseHistoricalOrderItems: true,
      catalogPolicySource: "ORDER_ITEM_PRODUCT_REFERENCE",
    };
  }

  async buildSnapshot(
    organizationId: string,
    projection: "summary" | "full",
    opts?: { orderCursor?: string; relationshipId?: string; status?: RelationalOrderStatus },
  ): Promise<RelationalOrdersResponse> {
    const lim = projection === "full" ? ORDERS_LIMIT_FULL : ORDERS_LIMIT_SUMMARY;
    const enabled = await this.flags.isEnabled("relational_orders_enabled", { organizationId });
    if (!enabled) {
      const ts = new Date().toISOString();
      return {
        policy: "DISABLED",
        snapshot: {
          version: "1",
          generatedAt: ts,
          organizationId,
          viewerRole: "UNKNOWN_COMMERCIAL_VIEWER",
          orders: [],
          diagnostics: this.disabledDiagnostics(lim),
        },
      };
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, category: true, actorType: true },
    });
    if (!org) {
      const ts = new Date().toISOString();
      return {
        policy: "DISABLED",
        snapshot: {
          version: "1",
          generatedAt: ts,
          organizationId,
          viewerRole: "UNKNOWN_COMMERCIAL_VIEWER",
          orders: [],
          diagnostics: this.disabledDiagnostics(lim),
        },
      };
    }

    const viewerRole = this.inferViewerRole(org.category, org.actorType);
    const { bundle: graphBundle } = await this.graphEngine.getBundleWithCacheMeta(organizationId, projection, {
      includePending: false,
    });
    const { edges: corridorEdges, graphDegraded } = await this.resolveCorridorEdges(organizationId, graphBundle);
    const relIds = this.orderRelationshipIds(viewerRole, organizationId, corridorEdges);
    const effectiveRelIds =
      opts?.relationshipId && relIds.includes(opts.relationshipId) ? [opts.relationshipId] : relIds;

    const endpointMap = buildRelationshipEndpointMap(corridorEdges);
    const directionWhere = buildRelationshipDirectionWhere(effectiveRelIds, endpointMap);

    const requestedStatusUnsupported = opts?.status === "EXPIRED";

    const after = parseRelationalOrderCursor(opts?.orderCursor);
    const where: Prisma.OrderWhereInput = {
      AND: [
        directionWhere,
        {
          OR: [{ buyerOrganizationId: organizationId }, { sellerOrganizationId: organizationId }],
        },
        ...(opts?.status ? [prismaWhereForRelationalOrderStatus(opts.status)] : []),
        ...(after
          ? [
              {
                OR: [{ createdAt: { lt: after.at } }, { createdAt: after.at, id: { lt: after.id } }],
              } as Prisma.OrderWhereInput,
            ]
          : []),
      ],
    };

    const mismatchBase: Prisma.OrderWhereInput = {
      AND: [
        effectiveRelIds.length === 1
          ? { relationshipId: effectiveRelIds[0]! }
          : { relationshipId: { in: effectiveRelIds.length ? effectiveRelIds : [] } },
        {
          OR: [{ buyerOrganizationId: organizationId }, { sellerOrganizationId: organizationId }],
        },
        ...(opts?.status ? [prismaWhereForRelationalOrderStatus(opts.status)] : []),
      ],
    };

    const rejectedByRelationshipDirectionCount =
      effectiveRelIds.length === 0
        ? 0
        : await this.prisma.order.count({
            where: {
              AND: [
                mismatchBase,
                { NOT: buildRelationshipDirectionWhere(effectiveRelIds, endpointMap) },
              ],
            },
          });

    const raw = await this.prisma.order.findMany({
      where,
      include: {
        relationship: { select: { id: true, upstreamOrganizationId: true, downstreamOrganizationId: true } },
        items: { include: { product: { select: { id: true, catalogId: true, stockStatus: true, active: true } } } },
        buyer: { select: { id: true, category: true, actorType: true } },
        seller: { select: { id: true, category: true, actorType: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: lim + 1,
    });

    const truncated = raw.length > lim;
    const page = raw.slice(0, lim);

    const scopeMode = RelationalCatalogAccessService.resolveRoleScopeMode(viewerRole);
    const partnerSource: RelationalOrderDiagnostics["partnerSource"] = graphDegraded ? "PRISMA_FALLBACK" : "GRAPH_BUNDLE";

    const orders: RelationalOrderSnapshot[] = page.map((o) => {
      const rel = o.relationship;
      const upstreamOrganizationId = rel?.upstreamOrganizationId ?? o.sellerOrganizationId;
      const downstreamOrganizationId = rel?.downstreamOrganizationId ?? o.buyerOrganizationId;
      const roStatus = this.state.mapRelationalOrderStatus(o.status, o.deliveryStatus);
      const sym = this.state.mapSymbolicFulfillment(o.deliveryStatus);
      const lines: RelationalOrderLine[] = o.items
        .filter((it) => it.product)
        .map((it) => {
          const p = it.product!;
          const negotiated = it.negotiatedPrice != null;
          return {
            productId: it.productId,
            catalogId: p.catalogId,
            quantity: Number(it.quantity),
            symbolicAvailability: p.active ? "ACTIVE_PRODUCT_ROW" : "INACTIVE_PRODUCT_ROW",
            negotiated,
            reserved: false,
            lineSignals: [`subtotalPresent=true`, `negotiated=${negotiated}`],
            advisoryOnly: true,
            symbolicStock: String(p.stockStatus ?? "UNKNOWN"),
            explanation:
              "Ligne commande corridor — quantités et statuts symboliques Prisma; pas de prix public exposé dans ce contrat 20.0.",
          };
        });
      const signals = this.state.buildHeuristicSignals({
        orderStatus: roStatus,
        itemCount: lines.length,
        symbolicFulfillment: sym,
      });
      return {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId,
        orderId: o.id,
        orderNumber: `ORD-${o.id.replace(/-/g, "").slice(0, 12)}`,
        orderType: "DIRECT_RELATIONAL_ORDER",
        orderStatus: roStatus,
        relationshipId: o.relationshipId,
        upstreamOrganizationId,
        downstreamOrganizationId,
        buyerRole: this.inferViewerRole(o.buyer.category, o.buyer.actorType),
        sellerRole: this.inferViewerRole(o.seller.category, o.seller.actorType),
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        expectedPreparationWindow: null,
        symbolicFulfillmentState: sym,
        negotiationAttached: false,
        reservationOrigin: null,
        groupedOrderOrigin: null,
        advisoryOnly: true,
        symbolicExecution: true,
        heuristicSignals: signals,
        orderLines: lines,
        visibilityBoundary:
          "RELATIONSHIP_SCOPED_ORDER_READ — buyer/seller + relationshipId must belong to viewer corridor (graph 19.1A or Prisma fallback).",
        relationshipScopeMode: scopeMode,
      };
    });

    const last = page[page.length - 1];
    const diagnostics = this.buildActiveDiagnostics({
      lim,
      scopeMode,
      graphDegraded,
      partnerSource,
      nextOrderCursor: truncated && last ? encodeRelationalOrderCursor(last.createdAt, last.id) : null,
      truncated,
      orders,
      rejectedByRelationshipDirectionCount,
      requestedStatusUnsupported,
    });

    const snap: RelationalOrdersSnapshot = {
      version: "1",
      generatedAt: new Date().toISOString(),
      organizationId,
      viewerRole,
      orders,
      diagnostics,
    };
    this.realtime.publishOrdersPulse(organizationId, snap);
    const touchRelationshipIds = [...new Set(snap.orders.map((o) => o.relationshipId).filter(Boolean))].slice(0, 12);
    for (const rid of touchRelationshipIds) {
      this.corridorGovernance?.touchRelationship(rid);
    }
    return { policy: "ACTIVE", snapshot: snap };
  }
}
