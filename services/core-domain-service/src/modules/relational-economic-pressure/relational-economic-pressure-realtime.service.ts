import { Injectable, Logger } from "@nestjs/common";
import type { RelationalEconomicPressureRealtimeEventType } from "@venext/shared-contracts";
import {
  isRelationalEconomicPressureRealtimeEventType,
  PressureRealtimeSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalEconomicPressureRealtimeService {
  private readonly log = new Logger(RelationalEconomicPressureRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishBothSides(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    edgeId: string | null;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    systemicPressure: number;
    eventType: RelationalEconomicPressureRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    edgeId: string | null;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    systemicPressure: number;
    eventType: RelationalEconomicPressureRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_economic_pressure_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalEconomicPressureRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      edgeId: input.edgeId,
      severity: input.severity,
      systemicPressure: input.systemicPressure,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = PressureRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`pressure realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_ECONOMIC_PRESSURE",
      body: parsed.data,
    });
  }
}
