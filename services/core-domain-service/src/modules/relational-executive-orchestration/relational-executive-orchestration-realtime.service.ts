import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalExecutiveOrchestrationRealtimeEventType,
  RelationalExecutiveOrchestrationRealtimeSchema,
  type RelationalExecutiveOrchestrationRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalExecutiveOrchestrationRealtimeService {
  private readonly log = new Logger(RelationalExecutiveOrchestrationRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    orchestrationNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    orchestrationDepth: number;
    eventType: RelationalExecutiveOrchestrationRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    orchestrationNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    orchestrationDepth: number;
    eventType: RelationalExecutiveOrchestrationRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_executive_orchestration_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalExecutiveOrchestrationRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      orchestrationNodeId: input.orchestrationNodeId,
      nodeCode: input.nodeCode,
      intensity: input.intensity,
      orchestrationDepth: input.orchestrationDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalExecutiveOrchestrationRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`executive orchestration realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_EXECUTIVE_ORCHESTRATION",
      body: parsed.data,
    });
  }
}
