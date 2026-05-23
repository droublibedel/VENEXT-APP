import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalEconomicSovereigntyRealtimeEventType,
  RelationalEconomicSovereigntyRealtimeSchema,
  type RelationalEconomicSovereigntyRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalEconomicSovereigntyRealtimeService {
  private readonly log = new Logger(RelationalEconomicSovereigntyRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    sovereigntyNodeId: string | null;
    sovereigntyNodeCode: string | null;
    intensity: number;
    autonomyDepth: number;
    eventType: RelationalEconomicSovereigntyRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    sovereigntyNodeId: string | null;
    sovereigntyNodeCode: string | null;
    intensity: number;
    autonomyDepth: number;
    eventType: RelationalEconomicSovereigntyRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_economic_sovereignty_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalEconomicSovereigntyRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      sovereigntyNodeId: input.sovereigntyNodeId,
      sovereigntyNodeCode: input.sovereigntyNodeCode,
      intensity: input.intensity,
      autonomyDepth: input.autonomyDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalEconomicSovereigntyRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`economic sovereignty realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_ECONOMIC_SOVEREIGNTY_INTELLIGENCE",
      body: parsed.data,
    });
  }
}
