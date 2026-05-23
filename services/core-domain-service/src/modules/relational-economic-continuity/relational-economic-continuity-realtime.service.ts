import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalEconomicContinuityRealtimeEventType,
  RelationalEconomicContinuityRealtimeSchema,
  type RelationalEconomicContinuityRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalEconomicContinuityRealtimeService {
  private readonly log = new Logger(RelationalEconomicContinuityRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    continuityNodeId: string | null;
    continuityNodeCode: string | null;
    intensity: number;
    recoveryDepth: number;
    eventType: RelationalEconomicContinuityRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    continuityNodeId: string | null;
    continuityNodeCode: string | null;
    intensity: number;
    recoveryDepth: number;
    eventType: RelationalEconomicContinuityRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_economic_continuity_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalEconomicContinuityRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      continuityNodeId: input.continuityNodeId,
      continuityNodeCode: input.continuityNodeCode,
      intensity: input.intensity,
      recoveryDepth: input.recoveryDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalEconomicContinuityRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`economic continuity realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_ECONOMIC_CONTINUITY_INTELLIGENCE",
      body: parsed.data,
    });
  }
}
