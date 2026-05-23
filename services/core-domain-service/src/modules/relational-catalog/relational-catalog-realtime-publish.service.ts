import { Injectable, Logger } from "@nestjs/common";
import type { RelationalCatalogSnapshot } from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";

@Injectable()
export class RelationalCatalogRealtimePublishService {
  private readonly log = new Logger(RelationalCatalogRealtimePublishService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  publishCatalogPulse(organizationId: string, snapshot: RelationalCatalogSnapshot): void {
    void this.flags.isEnabled("relational_catalog_realtime_enabled", { organizationId }).then((on) => {
      if (!on || !this.fanout.isConfigured()) return;
      const posts: Promise<unknown>[] = [];
      const body = {
        generatedAt: snapshot.generatedAt,
        catalogs: snapshot.accessibleCatalogs.length,
        products: snapshot.accessibleProducts.length,
        injections: snapshot.sponsoredInsertions.length,
      };
      posts.push(
        this.fanout.postDomainSignal("/internal/v1/realtime/relational-catalog/domain-signal", {
          organizationId,
          eventType: "live.relational_catalog.snapshot.refreshed",
          source: "RELATIONAL_CATALOG",
          body,
        }),
      );
      if (process.env.NODE_ENV !== "production") {
        posts.push(
          this.fanout.postDomainSignal("/internal/v1/realtime/relational-catalog/domain-signal", {
            organizationId,
            eventType: "demo.relational_catalog.synthetic_tick.visibility_mirror",
            source: "RELATIONAL_CATALOG",
            body: { mirrorOf: "live.relational_catalog.snapshot.refreshed", ...body },
          }),
        );
      }
      void Promise.allSettled(posts).then((results) => {
        for (const r of results) {
          if (r.status === "rejected") this.log.warn(`relational_catalog fanout: ${String(r.reason)}`);
        }
      });
    });
  }
}
