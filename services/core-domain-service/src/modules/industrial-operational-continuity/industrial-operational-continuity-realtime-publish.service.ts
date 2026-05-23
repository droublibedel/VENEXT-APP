import { Injectable, Logger } from "@nestjs/common";
import type { IndustrialOperationalContinuityBundle } from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class IndustrialOperationalContinuityRealtimePublishService {
  private readonly log = new Logger(IndustrialOperationalContinuityRealtimePublishService.name);

  constructor(private readonly fanout: DomainRealtimeFanoutClient) {}

  publishContinuityPulse(organizationId: string, bundle: IndustrialOperationalContinuityBundle): void {
    if (!this.fanout.isConfigured()) return;
    const posts: Promise<unknown>[] = [];
    const bodyBase = {
      generatedAt: bundle.generatedAt,
      stabilityStates: bundle.stabilityStates.length,
      pressures: bundle.continuityPressures.length,
      corridors: bundle.continuityCorridors.length,
    };
    posts.push(
      this.fanout.postDomainSignal("/internal/v1/realtime/industrial-operational-continuity/domain-signal", {
        organizationId,
        eventType: "live.industrial_operational_continuity.stability.updated",
        source: "INDUSTRIAL_OPERATIONAL_CONTINUITY",
        body: bodyBase,
      }),
    );
    posts.push(
      this.fanout.postDomainSignal("/internal/v1/realtime/industrial-operational-continuity/domain-signal", {
        organizationId,
        eventType: "live.industrial_operational_continuity.cadence.changed",
        source: "INDUSTRIAL_OPERATIONAL_CONTINUITY",
        body: { ...bodyBase, cadence: bundle.cadenceSignals.length },
      }),
    );
    if (process.env.NODE_ENV !== "production") {
      posts.push(
        this.fanout.postDomainSignal("/internal/v1/realtime/industrial-operational-continuity/domain-signal", {
          organizationId,
          eventType: "demo.industrial_operational_continuity.synthetic_tick.stability",
          source: "INDUSTRIAL_OPERATIONAL_CONTINUITY",
          body: { mirrorOf: "live.industrial_operational_continuity.stability.updated" },
        }),
      );
    }
    void Promise.allSettled(posts).then((results) => {
      for (const r of results) {
        if (r.status === "rejected") this.log.warn(`industrial_operational_continuity fanout: ${String(r.reason)}`);
      }
    });
  }
}
