import { Injectable, Logger } from "@nestjs/common";
import type { EconomicPropagationBundle } from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class EconomicMemoryRealtimePublishService {
  private readonly log = new Logger(EconomicMemoryRealtimePublishService.name);

  constructor(private readonly fanout: DomainRealtimeFanoutClient) {}

  publishMemoryPulse(organizationId: string, bundle: EconomicPropagationBundle): void {
    if (!this.fanout.isConfigured()) return;
    const posts: Promise<unknown>[] = [];
    posts.push(
      this.fanout.postDomainSignal("/internal/v1/realtime/economic-memory/domain-signal", {
        organizationId,
        eventType: "live.economic_memory.snapshot.persisted",
        source: "ECONOMIC_MEMORY",
        body: {
          shockCount: bundle.shocks.length,
          chainCount: bundle.chains.length,
          territoryRows: bundle.territoryFragility.length,
          generatedAt: bundle.generatedAt,
        },
      }),
    );
    if (process.env.NODE_ENV !== "production") {
      posts.push(
        this.fanout.postDomainSignal("/internal/v1/realtime/economic-memory/domain-signal", {
          organizationId,
          eventType: "demo.economic_memory.snapshot.persisted",
          source: "ECONOMIC_MEMORY",
          body: { mirrorOf: "live.economic_memory.snapshot.persisted" },
        }),
      );
    }
    void Promise.allSettled(posts).then((results) => {
      for (const r of results) {
        if (r.status === "rejected") this.log.warn(`economic_memory fanout: ${String(r.reason)}`);
      }
    });
  }
}
