import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalExecutiveStrategicSynthesisRealtimeEventType,
  RelationalExecutiveStrategicSynthesisRealtimeSchema,
  type RelationalExecutiveStrategicSynthesisRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalExecutiveStrategicSynthesisRealtimeService {
  private readonly log = new Logger(RelationalExecutiveStrategicSynthesisRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    strategicSynthesisNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    synthesisDepth: number;
    eventType: RelationalExecutiveStrategicSynthesisRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    strategicSynthesisNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    synthesisDepth: number;
    eventType: RelationalExecutiveStrategicSynthesisRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_executive_strategic_synthesis_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalExecutiveStrategicSynthesisRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      strategicSynthesisNodeId: input.strategicSynthesisNodeId,
      nodeCode: input.nodeCode,
      intensity: input.intensity,
      synthesisDepth: input.synthesisDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalExecutiveStrategicSynthesisRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`executive strategic synthesis realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_EXECUTIVE_SYNTHESIS",
      body: parsed.data,
    });
  }
}
