import { Injectable, Logger } from "@nestjs/common";
import type { EconomicScenariosBundle } from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class EconomicScenariosRealtimePublishService {
  private readonly log = new Logger(EconomicScenariosRealtimePublishService.name);

  constructor(private readonly fanout: DomainRealtimeFanoutClient) {}

  publishScenariosPulse(organizationId: string, bundle: EconomicScenariosBundle): void {
    if (!this.fanout.isConfigured()) return;
    const posts: Promise<unknown>[] = [];
    posts.push(
      this.fanout.postDomainSignal("/internal/v1/realtime/economic-scenarios/domain-signal", {
        organizationId,
        eventType: "live.economic_scenarios.bundle.refreshed",
        source: "ECONOMIC_SCENARIOS",
        body: {
          scenarioCount: bundle.scenarios.length,
          generatedAt: bundle.generatedAt,
          maxProjectedRisk: bundle.overview.maxProjectedRisk,
        },
      }),
    );
    if (process.env.NODE_ENV !== "production") {
      posts.push(
        this.fanout.postDomainSignal("/internal/v1/realtime/economic-scenarios/domain-signal", {
          organizationId,
          eventType: "demo.economic_scenarios.bundle.refreshed",
          source: "ECONOMIC_SCENARIOS",
          body: { mirrorOf: "live.economic_scenarios.bundle.refreshed" },
        }),
      );
    }
    void Promise.allSettled(posts).then((results) => {
      for (const r of results) {
        if (r.status === "rejected") this.log.warn(`economic_scenarios fanout: ${String(r.reason)}`);
      }
    });
  }
}
