import { Injectable } from "@nestjs/common";
import { NegotiationStatus } from "@prisma/client";
import type { CommercialNetworkContext } from "../commercial-network-intelligence/commercial-network-context.service";
import { CommercialNetworkContextService } from "../commercial-network-intelligence/commercial-network-context.service";
import type { FinanceCollectionsSnapshot } from "../finance-collections-intelligence/finance-collections-data.service";
import { FinanceCollectionsDataService } from "../finance-collections-intelligence/finance-collections-data.service";
import type { OrderAdvRawSnapshot } from "../order-adv-intelligence/order-adv-data.service";
import { OrderAdvDataService } from "../order-adv-intelligence/order-adv-data.service";
import type { SupplyLogisticsRawSnapshot } from "../supply-logistics-intelligence/supply-logistics-data.service";
import { SupplyLogisticsDataService } from "../supply-logistics-intelligence/supply-logistics-data.service";
import { RelationalCommerceNetworkTraverserService } from "../relational-commerce/relational-commerce-network-traverser.service";
import { PrismaService } from "../../prisma/prisma.service";
import { MarketingActivationSummaryAdapter } from "./adapters/marketing-activation-summary.adapter";
import { StrategicIntelligenceSummaryAdapter } from "./adapters/strategic-intelligence-summary.adapter";
import type { PoleIntelligenceSummary } from "./adapters/pole-intelligence-summary.types";

export type DataIntelligenceNegotiationMetrics = {
  openNegotiationsCount: number;
  stalledNegotiationsCount: number;
  totalNegotiationsCount: number;
};

export type DataIntelligenceGraphTraversalSlice = {
  visitedCount: number;
  exploredEdges: number;
  truncated: boolean;
};

export type DataIntelligenceCrossCutSnapshot = {
  organizationId: string;
  generatedAt: string;
  commercial: CommercialNetworkContext;
  finance: FinanceCollectionsSnapshot;
  orderAdv: OrderAdvRawSnapshot;
  supply: SupplyLogisticsRawSnapshot;
  economicSignals7d: number;
  strategicSummary: PoleIntelligenceSummary;
  marketingSummary: PoleIntelligenceSummary;
  negotiationMetrics: DataIntelligenceNegotiationMetrics;
  graphTraversal: DataIntelligenceGraphTraversalSlice;
};

/**
 * Instruction 17 — single cross-pole snapshot (reuses pole data services; no duplicate Prisma loaders).
 * Instruction 17A — strategic/marketing adapters + graph engine traverse slice + negotiation metrics.
 */
@Injectable()
export class DataIntelligenceDataService {
  private readonly cache = new Map<string, { builtAt: number; snap: DataIntelligenceCrossCutSnapshot }>();
  private readonly ttlMs = 2500;

  constructor(
    private readonly prisma: PrismaService,
    private readonly commercialCtx: CommercialNetworkContextService,
    private readonly financeData: FinanceCollectionsDataService,
    private readonly orderAdvData: OrderAdvDataService,
    private readonly supplyData: SupplyLogisticsDataService,
    private readonly networkTraverser: RelationalCommerceNetworkTraverserService,
    private readonly strategicAdapter: StrategicIntelligenceSummaryAdapter,
    private readonly marketingAdapter: MarketingActivationSummaryAdapter,
  ) {}

  private computeNegotiationMetrics(orderAdv: OrderAdvRawSnapshot): DataIntelligenceNegotiationMetrics {
    const openStatuses = new Set<NegotiationStatus>([NegotiationStatus.OPEN, NegotiationStatus.PROPOSED]);
    const now = Date.now();
    const stallMs = 72 * 3600_000;
    let openNegotiationsCount = 0;
    let stalledNegotiationsCount = 0;
    for (const n of orderAdv.negotiations) {
      if (openStatuses.has(n.status)) {
        openNegotiationsCount += 1;
        if (new Date(n.updatedAt).getTime() < now - stallMs) {
          stalledNegotiationsCount += 1;
        }
      }
    }
    return {
      openNegotiationsCount,
      stalledNegotiationsCount,
      totalNegotiationsCount: orderAdv.negotiations.length,
    };
  }

  async loadCrossCut(organizationId: string): Promise<DataIntelligenceCrossCutSnapshot> {
    const now = Date.now();
    const hit = this.cache.get(organizationId);
    if (hit && now - hit.builtAt < this.ttlMs) return hit.snap;

    const since = new Date(now - 7 * 86400000);
    const [commercial, finance, orderAdv, supply, sigCount, strategicSummary] = await Promise.all([
      this.commercialCtx.build(organizationId),
      this.financeData.loadSnapshot(organizationId),
      this.orderAdvData.loadSnapshot(organizationId),
      this.supplyData.loadSnapshot(organizationId),
      this.prisma.economicSignal.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.strategicAdapter.build(organizationId),
    ]);

    const [marketingSummary, graphTraversal] = await Promise.all([
      this.marketingAdapter.buildFromCommercialContext(commercial),
      this.networkTraverser.traverseNetwork(organizationId, 2, 280),
    ]);

    const negotiationMetrics = this.computeNegotiationMetrics(orderAdv);

    const snap: DataIntelligenceCrossCutSnapshot = {
      organizationId,
      generatedAt: finance.generatedAt,
      commercial,
      finance,
      orderAdv,
      supply,
      economicSignals7d: sigCount,
      strategicSummary,
      marketingSummary,
      negotiationMetrics,
      graphTraversal: {
        visitedCount: graphTraversal.visitedCount,
        exploredEdges: graphTraversal.exploredEdges,
        truncated: graphTraversal.truncated,
      },
    };
    this.cache.set(organizationId, { builtAt: now, snap });
    return snap;
  }
}
