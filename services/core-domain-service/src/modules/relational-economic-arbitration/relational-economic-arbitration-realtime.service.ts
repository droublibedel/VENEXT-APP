import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalEconomicArbitrationRealtimeEventType,
  RelationalEconomicArbitrationRealtimeSchema,
  type RelationalEconomicArbitrationRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalEconomicArbitrationRealtimeService {
  private readonly log = new Logger(RelationalEconomicArbitrationRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    arbitrationCaseId: string | null;
    caseCode: string | null;
    intensity: number;
    arbitrationDepth: number;
    eventType: RelationalEconomicArbitrationRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    arbitrationCaseId: string | null;
    caseCode: string | null;
    intensity: number;
    arbitrationDepth: number;
    eventType: RelationalEconomicArbitrationRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_economic_arbitration_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalEconomicArbitrationRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      arbitrationCaseId: input.arbitrationCaseId,
      caseCode: input.caseCode,
      intensity: input.intensity,
      arbitrationDepth: input.arbitrationDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalEconomicArbitrationRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`economic arbitration realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_ECONOMIC_ARBITRATION",
      body: parsed.data,
    });
  }
}
