import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalEconomicGovernanceRealtimeEventType,
  RelationalEconomicGovernanceRealtimeSchema,
  type RelationalEconomicGovernanceRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalEconomicGovernanceRealtimeService {
  private readonly log = new Logger(RelationalEconomicGovernanceRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    governanceNodeId: string | null;
    governanceNodeCode: string | null;
    intensity: number;
    governanceDepth: number;
    eventType: RelationalEconomicGovernanceRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    governanceNodeId: string | null;
    governanceNodeCode: string | null;
    intensity: number;
    governanceDepth: number;
    eventType: RelationalEconomicGovernanceRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_economic_governance_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalEconomicGovernanceRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      governanceNodeId: input.governanceNodeId,
      governanceNodeCode: input.governanceNodeCode,
      intensity: input.intensity,
      governanceDepth: input.governanceDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalEconomicGovernanceRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`economic governance realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_ECONOMIC_GOVERNANCE_INTELLIGENCE",
      body: parsed.data,
    });
  }
}
