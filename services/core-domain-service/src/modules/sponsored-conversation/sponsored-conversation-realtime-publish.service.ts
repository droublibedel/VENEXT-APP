import { Injectable, Logger } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class SponsoredConversationRealtimePublishService {
  private readonly log = new Logger(SponsoredConversationRealtimePublishService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publish(threadId: string, sponsorOrganizationId: string, eventType: string, body: Record<string, unknown>): Promise<void> {
    const on = await this.flags.isEnabled("sponsored_discovery_realtime_enabled", { organizationId: sponsorOrganizationId });
    if (!on || !this.fanout.isConfigured()) return;
    void this.fanout
      .postDomainSignal("/internal/v1/realtime/commerce-sponsored-discovery/domain-signal", {
        threadId,
        organizationId: sponsorOrganizationId,
        eventType,
        source: "SPONSORED_DISCOVERY_20_2",
        body: { ...body, ts: new Date().toISOString() },
      })
      .catch((e) => this.log.warn(`sponsored discovery fanout: ${String((e as Error).message)}`));
  }
}
