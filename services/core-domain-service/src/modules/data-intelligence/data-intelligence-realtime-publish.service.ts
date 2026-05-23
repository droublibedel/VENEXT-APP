import { Injectable } from "@nestjs/common";
import type { DataIntelligenceBundleResponse } from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class DataIntelligenceRealtimePublishService {
  constructor(private readonly fanout: DomainRealtimeFanoutClient) {}

  async publishDomainAnalysis(organizationId: string, bundle: DataIntelligenceBundleResponse): Promise<void> {
    if (!this.fanout.isConfigured() || bundle.overview.policy === "DISABLED") return;

    const events: { eventType: string; body: Record<string, unknown> }[] = [];

    if (bundle.ontology.economicPropagationScore > 0.48) {
      events.push({
        eventType: "live.data_intelligence.propagation.elevated",
        body: { economicPropagationScore: bundle.ontology.economicPropagationScore },
      });
    }
    if (bundle.correlations.rows.length > 2) {
      events.push({
        eventType: "live.data_intelligence.correlation.burst",
        body: { count: bundle.correlations.rows.length },
      });
    }
    if (bundle.anomalies.anomalies.length > 0) {
      events.push({
        eventType: "live.data_intelligence.anomaly.cluster",
        body: { count: bundle.anomalies.anomalies.length },
      });
    }
    if (bundle.predictiveSignals.signals.some((s) => s.riskLevel > 0.5)) {
      events.push({
        eventType: "live.data_intelligence.predictive.high_risk",
        body: { head: bundle.predictiveSignals.signals[0]?.kind },
      });
    }
    if (bundle.dataQuality.guardianReadiness < 0.55) {
      events.push({
        eventType: "live.data_intelligence.data_quality.degraded",
        body: { guardianReadiness: bundle.dataQuality.guardianReadiness },
      });
    }

    for (const ev of events.slice(0, 5)) {
      await this.fanout.postDomainSignal("/internal/v1/realtime/data-intelligence/domain-signal", {
        organizationId,
        eventType: ev.eventType,
        source: "DOMAIN_ANALYSIS",
        body: ev.body,
      });
    }
  }
}
