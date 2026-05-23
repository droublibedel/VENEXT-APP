import { Injectable } from "@nestjs/common";
import type { SupplyLogisticsBundleResponse } from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

/**
 * Instruction 15A / 16A — HTTP fan-in to api-gateway via {@link DomainRealtimeFanoutClient}.
 */
@Injectable()
export class SupplyLogisticsRealtimePublishService {
  constructor(private readonly fanout: DomainRealtimeFanoutClient) {}

  async publishDomainAnalysis(organizationId: string, bundle: SupplyLogisticsBundleResponse): Promise<void> {
    if (!this.fanout.isConfigured() || bundle.overview.policy !== "ACTIVE") return;

    const events: { eventType: string; body: Record<string, unknown> }[] = [];

    if (
      bundle.shipmentHealth.policy === "ACTIVE" &&
      (bundle.shipmentHealth.unstableCount > 1 || bundle.shipmentHealth.suspiciousCount > 0)
    ) {
      events.push({
        eventType: "live.supply_logistics.shipment.changed",
        body: {
          unstableCount: bundle.shipmentHealth.unstableCount,
          suspiciousCount: bundle.shipmentHealth.suspiciousCount,
        },
      });
    }
    if (bundle.routes.congestionClusters > 1 || bundle.overview.routeCongestionIndex > 0.48) {
      events.push({
        eventType: "live.supply_logistics.route.congestion",
        body: { congestionClusters: bundle.routes.congestionClusters, index: bundle.overview.routeCongestionIndex },
      });
    }
    if (bundle.warehousePressure.rows.some((r) => r.saturation > 0.48)) {
      events.push({
        eventType: "live.supply_logistics.warehouse.pressure",
        body: { rows: bundle.warehousePressure.rows.map((r) => ({ source: r.source, saturation: r.saturation })) },
      });
    }
    if (bundle.loadingSupervision.queueCongestionScore > 0.42) {
      events.push({
        eventType: "live.supply_logistics.loading.anomaly",
        body: { queueCongestionScore: bundle.loadingSupervision.queueCongestionScore },
      });
    }
    const fulfillBad =
      bundle.fulfillmentStability.policy === "ACTIVE" && bundle.fulfillmentStability.stabilityScore < 0.42;
    const confBad = bundle.overview.policy === "ACTIVE" && bundle.overview.fulfillmentConfidence < 0.42;
    if (fulfillBad || confBad) {
      events.push({
        eventType: "live.supply_logistics.fulfillment.degraded",
        body: {
          stabilityScore: bundle.fulfillmentStability.stabilityScore,
          fulfillmentConfidence: bundle.overview.fulfillmentConfidence,
        },
      });
    }

    for (const ev of events.slice(0, 5)) {
      const payload = {
        organizationId,
        eventType: ev.eventType,
        source: "DOMAIN_ANALYSIS",
        body: ev.body,
      };
      await this.fanout.postDomainSignal("/internal/v1/realtime/supply-logistics/domain-signal", payload);
    }
  }
}
