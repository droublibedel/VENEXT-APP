import { Injectable, Logger } from "@nestjs/common";
import type { CommercialRelationshipGraphBundle } from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";

@Injectable()
export class CommercialRelationshipGraphRealtimePublishService {
  private readonly log = new Logger(CommercialRelationshipGraphRealtimePublishService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  publishGraphPulse(organizationId: string, bundle: CommercialRelationshipGraphBundle): void {
    void this.flags.isEnabled("commercial_relationship_graph_realtime_enabled", { organizationId }).then((on) => {
      if (!on || !this.fanout.isConfigured()) return;
      const posts: Promise<unknown>[] = [];
      const body = {
        generatedAt: bundle.generatedAt,
        nodes: bundle.snapshot.nodes.length,
        edges: bundle.snapshot.edges.length,
        signals: bundle.snapshot.signals.length,
      };
      posts.push(
        this.fanout.postDomainSignal("/internal/v1/realtime/commercial-relationship-graph/domain-signal", {
          organizationId,
          eventType: "live.commercial_relationship_graph.relationship.updated",
          source: "COMMERCIAL_RELATIONSHIP_GRAPH",
          body,
        }),
      );
      posts.push(
        this.fanout.postDomainSignal("/internal/v1/realtime/commercial-relationship-graph/domain-signal", {
          organizationId,
          eventType: "live.commercial_relationship_graph.network.fragility",
          source: "COMMERCIAL_RELATIONSHIP_GRAPH",
          body: { ...body, fragilityIndex: bundle.snapshot.overview.fragilityIndex },
        }),
      );
      posts.push(
        this.fanout.postDomainSignal("/internal/v1/realtime/commercial-relationship-graph/domain-signal", {
          organizationId,
          eventType: "live.commercial_relationship_graph.coverage.changed",
          source: "COMMERCIAL_RELATIONSHIP_GRAPH",
          body: { ...body, coverageIndex: bundle.snapshot.overview.coverageIndex },
        }),
      );
      if (process.env.NODE_ENV !== "production") {
        posts.push(
          this.fanout.postDomainSignal("/internal/v1/realtime/commercial-relationship-graph/domain-signal", {
            organizationId,
            eventType: "demo.commercial_relationship_graph.synthetic_tick.network",
            source: "COMMERCIAL_RELATIONSHIP_GRAPH",
            body: { mirrorOf: "live.commercial_relationship_graph.relationship.updated", ...body },
          }),
        );
      }
      void Promise.allSettled(posts).then((results) => {
        for (const r of results) {
          if (r.status === "rejected") this.log.warn(`commercial_relationship_graph fanout: ${String(r.reason)}`);
        }
      });
    });
  }
}
