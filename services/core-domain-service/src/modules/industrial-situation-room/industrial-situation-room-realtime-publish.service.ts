import { Injectable, Logger } from "@nestjs/common";
import type { IndustrialSituationRoomBundle } from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class IndustrialSituationRoomRealtimePublishService {
  private readonly log = new Logger(IndustrialSituationRoomRealtimePublishService.name);

  constructor(private readonly fanout: DomainRealtimeFanoutClient) {}

  publishSituationPulse(organizationId: string, bundle: IndustrialSituationRoomBundle): void {
    if (!this.fanout.isConfigured()) return;
    const posts: Promise<unknown>[] = [];
    const bodyBase = {
      generatedAt: bundle.generatedAt,
      cells: bundle.situationCells.length,
      missions: bundle.operationalMissions.length,
      dependencies: bundle.criticalDependencies.length,
    };
    posts.push(
      this.fanout.postDomainSignal("/internal/v1/realtime/industrial-situation-room/domain-signal", {
        organizationId,
        eventType: "live.industrial_situation_room.situation.updated",
        source: "INDUSTRIAL_SITUATION_ROOM",
        body: bodyBase,
      }),
    );
    posts.push(
      this.fanout.postDomainSignal("/internal/v1/realtime/industrial-situation-room/domain-signal", {
        organizationId,
        eventType: "live.industrial_situation_room.missions.changed",
        source: "INDUSTRIAL_SITUATION_ROOM",
        body: { ...bodyBase, attention: bundle.executiveAttention.length },
      }),
    );
    if (process.env.NODE_ENV !== "production") {
      posts.push(
        this.fanout.postDomainSignal("/internal/v1/realtime/industrial-situation-room/domain-signal", {
          organizationId,
          eventType: "demo.industrial_situation_room.situation.updated",
          source: "INDUSTRIAL_SITUATION_ROOM",
          body: { mirrorOf: "live.industrial_situation_room.situation.updated" },
        }),
      );
    }
    void Promise.allSettled(posts).then((results) => {
      for (const r of results) {
        if (r.status === "rejected") this.log.warn(`industrial_situation_room fanout: ${String(r.reason)}`);
      }
    });
  }
}
