import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalMacroObservatoryGovernanceRealtimeEventType,
  RelationalMacroObservatoryGovernanceRealtimeSchema,
  type RelationalMacroObservatoryGovernanceRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalMacroObservatoryGovernanceRealtimeService {
  private readonly log = new Logger(RelationalMacroObservatoryGovernanceRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    macroObservatoryGovernanceNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    governanceDepth: number;
    eventType: RelationalMacroObservatoryGovernanceRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    macroObservatoryGovernanceNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    governanceDepth: number;
    eventType: RelationalMacroObservatoryGovernanceRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_macro_observatory_governance_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalMacroObservatoryGovernanceRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      macroObservatoryGovernanceNodeId: input.macroObservatoryGovernanceNodeId,
      nodeCode: input.nodeCode,
      intensity: input.intensity,
      governanceDepth: input.governanceDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalMacroObservatoryGovernanceRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`macro observatory governance realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_MACRO_OBSERVATORY_GOVERNANCE",
      body: parsed.data,
    });
  }
}
