import { Injectable, Logger } from "@nestjs/common";
import type { EconomicPropagationBundle } from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class EconomicPropagationRealtimePublishService {
  private readonly log = new Logger(EconomicPropagationRealtimePublishService.name);

  constructor(private readonly fanout: DomainRealtimeFanoutClient) {}

  async publishDomainAnalysis(organizationId: string, bundle: EconomicPropagationBundle): Promise<void> {
    if (!this.fanout.isConfigured()) return;

    const payloads: { eventType: string; body: Record<string, unknown> }[] = [];

    for (const sh of bundle.shocks.filter((s) => s.systemicRisk >= 0.32).slice(0, 2)) {
      payloads.push({
        eventType: "live.economic_propagation.shock.detected",
        body: { shockType: sh.type, systemicRisk: sh.systemicRisk, severity: sh.severity, sourcePole: sh.sourcePole },
      });
    }

    for (const ch of bundle.chains.slice(0, 2)) {
      if (ch.impacts.length < 2) continue;
      payloads.push({
        eventType: "live.economic_propagation.chain.updated",
        body: { chainId: ch.chainId, propagationDepth: ch.propagationDepth, systemicRiskScore: ch.systemicRiskScore },
      });
    }

    const fragile = bundle.territoryFragility.find((t) => t.fragilityScore >= 0.42);
    if (fragile) {
      payloads.push({
        eventType: "live.economic_propagation.territory.fragile",
        body: { territory: fragile.territory, fragilityScore: fragile.fragilityScore },
      });
    }

    const isDev = process.env.NODE_ENV !== "production";
    const posts: Promise<unknown>[] = [];
    for (const p of payloads.slice(0, 5)) {
      posts.push(
        this.fanout.postDomainSignal("/internal/v1/realtime/economic-propagation/domain-signal", {
          organizationId,
          eventType: p.eventType,
          source: "DOMAIN_ANALYSIS",
          body: p.body,
        }),
      );
      if (isDev) {
        const demoType =
          p.eventType === "live.economic_propagation.shock.detected"
            ? "demo.economic_propagation.shock.detected"
            : p.eventType === "live.economic_propagation.chain.updated"
              ? "demo.economic_propagation.chain.updated"
              : "demo.economic_propagation.territory.fragile";
        posts.push(
          this.fanout.postDomainSignal("/internal/v1/realtime/economic-propagation/domain-signal", {
            organizationId,
            eventType: demoType,
            source: "DOMAIN_ANALYSIS",
            body: { ...p.body, mirrorOf: p.eventType },
          }),
        );
      }
    }

    void Promise.allSettled(posts).then((results) => {
      for (const r of results) {
        if (r.status === "rejected") {
          this.log.warn(`economic_propagation fanout rejected: ${String(r.reason)}`);
        }
      }
    });
  }
}
