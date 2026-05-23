import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalEconomicStabilizationRealtimeEventType,
  RelationalEconomicStabilizationRealtimeSchema,
  type RelationalEconomicStabilizationRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalEconomicStabilizationRealtimeService {
  private readonly log = new Logger(RelationalEconomicStabilizationRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    stabilizationNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    stabilizationDepth: number;
    eventType: RelationalEconomicStabilizationRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    stabilizationNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    stabilizationDepth: number;
    eventType: RelationalEconomicStabilizationRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_economic_stabilization_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalEconomicStabilizationRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      stabilizationNodeId: input.stabilizationNodeId,
      nodeCode: input.nodeCode,
      intensity: input.intensity,
      stabilizationDepth: input.stabilizationDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalEconomicStabilizationRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`economic stabilization realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_ECONOMIC_STABILIZATION",
      body: parsed.data,
    });
  }
}
