import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalGlobalExecutiveSupervisionRealtimeEventType,
  RelationalGlobalExecutiveSupervisionRealtimeSchema,
  type RelationalGlobalExecutiveSupervisionRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalGlobalExecutiveSupervisionRealtimeService {
  private readonly log = new Logger(RelationalGlobalExecutiveSupervisionRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    globalExecutiveSupervisionNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    supervisionDepth: number;
    eventType: RelationalGlobalExecutiveSupervisionRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    globalExecutiveSupervisionNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    supervisionDepth: number;
    eventType: RelationalGlobalExecutiveSupervisionRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_global_executive_supervision_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalGlobalExecutiveSupervisionRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      globalExecutiveSupervisionNodeId: input.globalExecutiveSupervisionNodeId,
      nodeCode: input.nodeCode,
      intensity: input.intensity,
      supervisionDepth: input.supervisionDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalGlobalExecutiveSupervisionRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`global executive supervision realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_GLOBAL_EXECUTIVE_SUPERVISION",
      body: parsed.data,
    });
  }
}
