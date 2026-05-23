import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalExecutiveOperationsRealtimeEventType,
  RelationalExecutiveOperationsRealtimeSchema,
  type RelationalExecutiveOperationsRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalExecutiveOperationsRealtimeService {
  private readonly log = new Logger(RelationalExecutiveOperationsRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    operationsNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    operationsDepth: number;
    eventType: RelationalExecutiveOperationsRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    operationsNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    operationsDepth: number;
    eventType: RelationalExecutiveOperationsRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_executive_operations_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalExecutiveOperationsRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      operationsNodeId: input.operationsNodeId,
      nodeCode: input.nodeCode,
      intensity: input.intensity,
      operationsDepth: input.operationsDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalExecutiveOperationsRealtimeSchema.safeParse(body);
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
