import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalEconomicRecoveryRealtimeEventType,
  RelationalEconomicRecoveryRealtimeSchema,
  type RelationalEconomicRecoveryRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalEconomicRecoveryRealtimeService {
  private readonly log = new Logger(RelationalEconomicRecoveryRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    recoveryPlanId: string | null;
    planCode: string | null;
    intensity: number;
    recoveryDepth: number;
    eventType: RelationalEconomicRecoveryRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    recoveryPlanId: string | null;
    planCode: string | null;
    intensity: number;
    recoveryDepth: number;
    eventType: RelationalEconomicRecoveryRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_economic_recovery_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalEconomicRecoveryRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      recoveryPlanId: input.recoveryPlanId,
      planCode: input.planCode,
      intensity: input.intensity,
      recoveryDepth: input.recoveryDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalEconomicRecoveryRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`economic recovery realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_ECONOMIC_RECOVERY_PLANNING",
      body: parsed.data,
    });
  }
}
