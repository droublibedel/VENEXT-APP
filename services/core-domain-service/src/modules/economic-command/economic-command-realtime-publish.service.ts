import { Injectable, Logger } from "@nestjs/common";
import type { EconomicCommandBundle } from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class EconomicCommandRealtimePublishService {
  private readonly log = new Logger(EconomicCommandRealtimePublishService.name);

  constructor(private readonly fanout: DomainRealtimeFanoutClient) {}

  publishCommandPulse(organizationId: string, bundle: EconomicCommandBundle): void {
    if (!this.fanout.isConfigured()) return;
    const posts: Promise<unknown>[] = [];
    const bodyBase = {
      generatedAt: bundle.generatedAt,
      globalStress: bundle.systemStress.globalStress,
      pressureZones: bundle.pressureZones.length,
      arbitrations: bundle.arbitrations.length,
    };
    posts.push(
      this.fanout.postDomainSignal("/internal/v1/realtime/economic-command/domain-signal", {
        organizationId,
        eventType: "live.economic_command.pressure.updated",
        source: "ECONOMIC_COMMAND",
        body: bodyBase,
      }),
    );
    posts.push(
      this.fanout.postDomainSignal("/internal/v1/realtime/economic-command/domain-signal", {
        organizationId,
        eventType: "live.economic_command.arbitration.detected",
        source: "ECONOMIC_COMMAND",
        body: { ...bodyBase, arbitrationCount: bundle.arbitrations.length },
      }),
    );
    posts.push(
      this.fanout.postDomainSignal("/internal/v1/realtime/economic-command/domain-signal", {
        organizationId,
        eventType: "live.economic_command.system_stress.changed",
        source: "ECONOMIC_COMMAND",
        body: { ...bodyBase, stressMode: bundle.systemStress.stressMode },
      }),
    );
    if (process.env.NODE_ENV !== "production") {
      posts.push(
        this.fanout.postDomainSignal("/internal/v1/realtime/economic-command/domain-signal", {
          organizationId,
          eventType: "demo.economic_command.pressure.updated",
          source: "ECONOMIC_COMMAND",
          body: { mirrorOf: "live.economic_command.pressure.updated" },
        }),
      );
      posts.push(
        this.fanout.postDomainSignal("/internal/v1/realtime/economic-command/domain-signal", {
          organizationId,
          eventType: "demo.economic_command.arbitration.detected",
          source: "ECONOMIC_COMMAND",
          body: { mirrorOf: "live.economic_command.arbitration.detected" },
        }),
      );
      posts.push(
        this.fanout.postDomainSignal("/internal/v1/realtime/economic-command/domain-signal", {
          organizationId,
          eventType: "demo.economic_command.system_stress.changed",
          source: "ECONOMIC_COMMAND",
          body: { mirrorOf: "live.economic_command.system_stress.changed" },
        }),
      );
    }
    void Promise.allSettled(posts).then((results) => {
      for (const r of results) {
        if (r.status === "rejected") this.log.warn(`economic_command fanout: ${String(r.reason)}`);
      }
    });
  }
}
