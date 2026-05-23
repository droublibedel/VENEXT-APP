import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalStrategicObservatoryRealtimeEventType,
  RelationalStrategicObservatoryRealtimeSchema,
  type RelationalStrategicObservatoryRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalStrategicObservatoryRealtimeService {
  private readonly log = new Logger(RelationalStrategicObservatoryRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    strategicObservatoryNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    observatoryDepth: number;
    eventType: RelationalStrategicObservatoryRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    strategicObservatoryNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    observatoryDepth: number;
    eventType: RelationalStrategicObservatoryRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_strategic_observatory_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalStrategicObservatoryRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      strategicObservatoryNodeId: input.strategicObservatoryNodeId,
      nodeCode: input.nodeCode,
      intensity: input.intensity,
      observatoryDepth: input.observatoryDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalStrategicObservatoryRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`global executive supervision realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_STRATEGIC_OBSERVATORY",
      body: parsed.data,
    });
  }
}
