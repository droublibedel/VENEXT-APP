import { Injectable, Logger } from "@nestjs/common";
import type { RelationalEconomicPropagationRisk, RelationalEconomicSignalEventType } from "@prisma/client";
import {
  isRelationalEconomicSignalRealtimeType,
  type RelationalEconomicRealtimeDto,
  type RelationalEconomicSignalRealtimeEventType,
  RelationalEconomicRealtimeSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalEconomicSignalRealtimeService {
  private readonly log = new Logger(RelationalEconomicSignalRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishBothSides(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    nodeId: string | null;
    relationshipId: string | null;
    propagationRisk: RelationalEconomicPropagationRisk;
    systemicExposureScore: number;
    clusterSize?: number;
    journalEventType?: RelationalEconomicSignalEventType;
    realtimeEventType: RelationalEconomicSignalRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrganization({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrganization({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrganization(
    input: {
      organizationId: string;
      nodeId: string | null;
      relationshipId: string | null;
      propagationRisk: RelationalEconomicPropagationRisk;
      systemicExposureScore: number;
      clusterSize?: number;
      journalEventType?: RelationalEconomicSignalEventType;
      realtimeEventType: RelationalEconomicSignalRealtimeEventType;
    },
  ): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_economic_signal_graph_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalEconomicSignalRealtimeType(input.realtimeEventType)) return;
    const body: RelationalEconomicRealtimeDto = {
      nodeId: input.nodeId,
      relationshipId: input.relationshipId,
      eventType: input.journalEventType,
      propagationRisk: input.propagationRisk,
      systemicExposureScore: input.systemicExposureScore,
      clusterSize: input.clusterSize,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    const parsed = RelationalEconomicRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`economic signal realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.realtimeEventType,
      source: "RELATIONAL_ECONOMIC_SIGNAL_GRAPH",
      body: parsed.data,
    });
  }
}
