import { Injectable } from "@nestjs/common";
import type { FinanceCollectionsBundleResponse } from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class FinanceCollectionsRealtimePublishService {
  constructor(private readonly fanout: DomainRealtimeFanoutClient) {}

  async publishDomainAnalysis(organizationId: string, bundle: FinanceCollectionsBundleResponse): Promise<void> {
    if (!this.fanout.isConfigured() || bundle.overview.policy === "DISABLED") return;

    const events: { eventType: string; body: Record<string, unknown> }[] = [];

    if (bundle.overview.financialInstability > 0.52) {
      events.push({
        eventType: "live.finance_collections.payment.instability",
        body: { financialInstability: bundle.overview.financialInstability, receivablesPressure: bundle.overview.receivablesPressure },
      });
    }
    if (bundle.overview.overduePressure > 0.45) {
      events.push({
        eventType: "live.finance_collections.overdue.escalation",
        body: { overduePressure: bundle.overview.overduePressure, delayedCollections: bundle.overview.delayedCollections },
      });
    }
    if (bundle.walletLiquidity.policy === "ACTIVE" && bundle.walletLiquidity.liquidityStressIndex > 0.48) {
      events.push({
        eventType: "live.finance_collections.liquidity.degraded",
        body: { liquidityStressIndex: bundle.walletLiquidity.liquidityStressIndex, providerMode: bundle.walletLiquidity.providerMode },
      });
    }
    if (bundle.paymentAnomalies.anomalies.length > 2) {
      events.push({
        eventType: "live.finance_collections.settlement.anomaly",
        body: { count: bundle.paymentAnomalies.anomalies.length },
      });
    }
    if (bundle.collectionPriorities.items.length > 0 && bundle.collectionPriorities.items[0]!.urgency > 0.65) {
      events.push({
        eventType: "live.finance_collections.collection.acceleration",
        body: { headUrgency: bundle.collectionPriorities.items[0]!.urgency },
      });
    }
    if (bundle.creditRisk.policy === "ACTIVE" && bundle.creditRisk.collapseRiskField > 0.42) {
      events.push({
        eventType: "live.finance_collections.credit.warning",
        body: { collapseRiskField: bundle.creditRisk.collapseRiskField },
      });
    }

    for (const ev of events.slice(0, 5)) {
      const payload = {
        organizationId,
        eventType: ev.eventType,
        source: "DOMAIN_ANALYSIS",
        body: ev.body,
      };
      await this.fanout.postDomainSignal("/internal/v1/realtime/finance-collections/domain-signal", payload);
    }
  }
}
