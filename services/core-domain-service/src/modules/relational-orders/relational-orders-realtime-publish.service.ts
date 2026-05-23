import { Injectable, Logger } from "@nestjs/common";
import type { RelationalOrdersSnapshot } from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";

@Injectable()
export class RelationalOrdersRealtimePublishService {
  private readonly log = new Logger(RelationalOrdersRealtimePublishService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  publishOrdersPulse(organizationId: string, snapshot: RelationalOrdersSnapshot): void {
    void this.flags.isEnabled("relational_orders_realtime_enabled", { organizationId }).then((on) => {
      if (!on || !this.fanout.isConfigured()) return;
      const posts: Promise<unknown>[] = [];
      const body = {
        generatedAt: snapshot.generatedAt,
        orders: snapshot.orders.length,
        viewerRole: snapshot.viewerRole,
      };
      posts.push(
        this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
          organizationId,
          eventType: "live.relational_orders.snapshot.refreshed",
          source: "RELATIONAL_ORDERS",
          body,
        }),
      );
      if (process.env.NODE_ENV !== "production") {
        posts.push(
          this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
            organizationId,
            eventType: "demo.relational_orders.synthetic_tick.corridor_mirror",
            source: "RELATIONAL_ORDERS",
            body: { mirrorOf: "live.relational_orders.snapshot.refreshed", ...body },
          }),
        );
      }
      void Promise.allSettled(posts).then((results) => {
        for (const r of results) {
          if (r.status === "rejected") this.log.warn(`relational_orders fanout: ${String(r.reason)}`);
        }
      });
    });
  }
}
