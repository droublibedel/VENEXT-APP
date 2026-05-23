import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalStrategicIntelligenceRealtimeEventType,
  RelationalStrategicIntelligenceRealtimeSchema,
  type RelationalStrategicIntelligenceRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalStrategicIntelligenceRealtimeService {
  private readonly log = new Logger(RelationalStrategicIntelligenceRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    intelligenceNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    intelligenceDepth: number;
    eventType: RelationalStrategicIntelligenceRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    intelligenceNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    intelligenceDepth: number;
    eventType: RelationalStrategicIntelligenceRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_strategic_intelligence_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalStrategicIntelligenceRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      intelligenceNodeId: input.intelligenceNodeId,
      nodeCode: input.nodeCode,
      intensity: input.intensity,
      intelligenceDepth: input.intelligenceDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalStrategicIntelligenceRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`strategic intelligence realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_STRATEGIC_INTELLIGENCE",
      body: parsed.data,
    });
  }
}
