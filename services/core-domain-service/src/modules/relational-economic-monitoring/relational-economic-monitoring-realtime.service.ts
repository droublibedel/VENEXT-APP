import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalEconomicMonitoringRealtimeEventType,
  RelationalEconomicMonitoringRealtimeSchema,
  type RelationalEconomicMonitoringRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalEconomicMonitoringRealtimeService {
  private readonly log = new Logger(RelationalEconomicMonitoringRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    monitoringNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    monitoringDepth: number;
    eventType: RelationalEconomicMonitoringRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    monitoringNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    monitoringDepth: number;
    eventType: RelationalEconomicMonitoringRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_economic_monitoring_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalEconomicMonitoringRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      monitoringNodeId: input.monitoringNodeId,
      nodeCode: input.nodeCode,
      intensity: input.intensity,
      monitoringDepth: input.monitoringDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalEconomicMonitoringRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`economic monitoring realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_ECONOMIC_MONITORING",
      body: parsed.data,
    });
  }
}
