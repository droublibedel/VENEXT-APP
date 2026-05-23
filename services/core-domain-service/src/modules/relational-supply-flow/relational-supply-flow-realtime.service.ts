import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalSupplyFlowRealtimeEventType,
  RelationalSupplyFlowRealtimeSchema,
  type RelationalSupplyFlowRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalSupplyFlowRealtimeService {
  private readonly log = new Logger(RelationalSupplyFlowRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    flowNodeId: string | null;
    flowCode: string | null;
    intensity: number;
    propagationDepth: number;
    eventType: RelationalSupplyFlowRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    flowNodeId: string | null;
    flowCode: string | null;
    intensity: number;
    propagationDepth: number;
    eventType: RelationalSupplyFlowRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_supply_flow_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalSupplyFlowRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      flowNodeId: input.flowNodeId,
      flowCode: input.flowCode,
      intensity: input.intensity,
      propagationDepth: input.propagationDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalSupplyFlowRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`supply flow realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_SUPPLY_FLOW_INTELLIGENCE",
      body: parsed.data,
    });
  }
}
