import { Injectable, Logger } from "@nestjs/common";
import type { EconomicCoordinationBundle } from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class EconomicCoordinationRealtimePublishService {
  private readonly log = new Logger(EconomicCoordinationRealtimePublishService.name);

  constructor(private readonly fanout: DomainRealtimeFanoutClient) {}

  publishCoordinationPulse(organizationId: string, bundle: EconomicCoordinationBundle): void {
    if (!this.fanout.isConfigured()) return;
    const posts: Promise<unknown>[] = [];
    posts.push(
      this.fanout.postDomainSignal("/internal/v1/realtime/economic-coordination/domain-signal", {
        organizationId,
        eventType: "live.economic_coordination.bundle.refreshed",
        source: "ECONOMIC_COORDINATION",
        body: {
          posture: bundle.posture.posture,
          generatedAt: bundle.generatedAt,
          conflictCount: bundle.conflicts.length,
          escalationLevel: bundle.escalation.escalationLevel,
        },
      }),
    );
    if (process.env.NODE_ENV !== "production") {
      posts.push(
        this.fanout.postDomainSignal("/internal/v1/realtime/economic-coordination/domain-signal", {
          organizationId,
          eventType: "demo.economic_coordination.bundle.refreshed",
          source: "ECONOMIC_COORDINATION",
          body: { mirrorOf: "live.economic_coordination.bundle.refreshed" },
        }),
      );
    }
    void Promise.allSettled(posts).then((results) => {
      for (const r of results) {
        if (r.status === "rejected") this.log.warn(`economic_coordination fanout: ${String(r.reason)}`);
      }
    });
  }
}
