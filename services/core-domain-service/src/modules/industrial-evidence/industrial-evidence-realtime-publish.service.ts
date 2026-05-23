import { Injectable, Logger } from "@nestjs/common";
import type { IndustrialEvidenceBundle } from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class IndustrialEvidenceRealtimePublishService {
  private readonly log = new Logger(IndustrialEvidenceRealtimePublishService.name);

  constructor(private readonly fanout: DomainRealtimeFanoutClient) {}

  publishEvidencePulse(organizationId: string, bundle: IndustrialEvidenceBundle): void {
    if (!this.fanout.isConfigured()) return;
    const posts: Promise<unknown>[] = [];
    const bodyBase = {
      generatedAt: bundle.generatedAt,
      records: bundle.snapshot.records.length,
      trustScopes: bundle.snapshot.trustMatrix.length,
      traces: bundle.snapshot.traces.length,
      limitations: bundle.snapshot.limitations.length,
    };
    posts.push(
      this.fanout.postDomainSignal("/internal/v1/realtime/industrial-evidence/domain-signal", {
        organizationId,
        eventType: "live.industrial_evidence.registry.refreshed",
        source: "INDUSTRIAL_EVIDENCE",
        body: bodyBase,
      }),
    );
    if (process.env.NODE_ENV !== "production") {
      posts.push(
        this.fanout.postDomainSignal("/internal/v1/realtime/industrial-evidence/domain-signal", {
          organizationId,
          eventType: "demo.industrial_evidence.synthetic_tick.registry",
          source: "INDUSTRIAL_EVIDENCE",
          body: { mirrorOf: "live.industrial_evidence.registry.refreshed", ...bodyBase },
        }),
      );
    }
    void Promise.allSettled(posts).then((results) => {
      for (const r of results) {
        if (r.status === "rejected") this.log.warn(`industrial_evidence fanout: ${String(r.reason)}`);
      }
    });
  }
}
