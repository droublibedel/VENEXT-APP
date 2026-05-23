import { Injectable, Logger } from "@nestjs/common";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";

@Injectable()
export class RelationalNegotiationDraftRealtimePublishService {
  private readonly log = new Logger(RelationalNegotiationDraftRealtimePublishService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publish(
    threadId: string,
    organizationId: string,
    eventType:
      | "negotiation.updated"
      | "negotiation.accepted"
      | "negotiation.rejected"
      | "draft.updated"
      | "draft.ready"
      | "draft.human_confirmed"
      | "reservation.created"
      | "reservation.expired",
    body: Record<string, unknown>,
  ): Promise<void> {
    const on = await this.flags.isEnabled("relational_negotiation_draft_realtime_enabled", { organizationId });
    if (!on || !this.fanout.isConfigured()) return;
    const ts = new Date().toISOString();
    void this.fanout
      .postDomainSignal("/internal/v1/realtime/commerce-negotiation-draft/domain-signal", {
        threadId,
        organizationId,
        eventType,
        source: "RELATIONAL_NEGOTIATION_20_1",
        body: { ...body, ts },
      })
      .catch((e) => this.log.warn(`negotiation draft fanout: ${String((e as Error).message)}`));
  }
}
