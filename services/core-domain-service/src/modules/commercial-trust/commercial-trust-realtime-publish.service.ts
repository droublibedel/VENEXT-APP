import { Injectable, Logger } from "@nestjs/common";
import type { CommercialTrustLevel } from "@prisma/client";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";

/** Instruction 20.3 — minimal WS fan-in payloads (no catalogue, no message bodies). */
@Injectable()
export class CommercialTrustRealtimePublishService {
  private readonly log = new Logger(CommercialTrustRealtimePublishService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishTrustUpdated(input: {
    organizationId: string;
    trustLevel: CommercialTrustLevel;
    changedSignals: string[];
    computedAt: string;
  }): Promise<void> {
    const on = await this.flags.isEnabled("commercial_trust_realtime_enabled", {
      organizationId: input.organizationId,
    });
    if (!on || !this.fanout.isConfigured()) return;
    const body = {
      organizationId: input.organizationId,
      trustLevel: input.trustLevel,
      changedSignals: input.changedSignals.slice(0, 24),
      heuristicOnly: true,
      computedAt: input.computedAt,
    };
    void this.fanout
      .postDomainSignal("/internal/v1/realtime/commercial-trust/domain-signal", {
        organizationId: input.organizationId,
        eventType: "commercial.trust.updated",
        source: "COMMERCIAL_TRUST_20_3",
        body,
      })
      .catch((e) => this.log.warn(`commercial trust fanout: ${String((e as Error).message)}`));
  }

  async publishRelationshipSignalChanged(input: {
    organizationId: string;
    relationshipId: string;
    trustLevel: CommercialTrustLevel;
    changedSignals: string[];
    computedAt: string;
  }): Promise<void> {
    const on = await this.flags.isEnabled("commercial_trust_realtime_enabled", {
      organizationId: input.organizationId,
    });
    if (!on || !this.fanout.isConfigured()) return;
    const body = {
      organizationId: input.organizationId,
      relationshipId: input.relationshipId,
      trustLevel: input.trustLevel,
      changedSignals: input.changedSignals.slice(0, 16),
      heuristicOnly: true,
      computedAt: input.computedAt,
    };
    void this.fanout
      .postDomainSignal("/internal/v1/realtime/commercial-trust/domain-signal", {
        organizationId: input.organizationId,
        eventType: "commercial.relationship.signal.changed",
        source: "COMMERCIAL_TRUST_20_3",
        body,
      })
      .catch((e) => this.log.warn(`commercial trust relationship fanout: ${String((e as Error).message)}`));
  }
}
