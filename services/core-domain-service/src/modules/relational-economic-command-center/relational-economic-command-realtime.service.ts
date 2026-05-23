import { Injectable, Logger } from "@nestjs/common";
import type {
  RelationalEconomicCommandCenterRealtimeEventType,
  RelationalEconomicCommandCenterRealtimeDto,
  RelationalEconomicCommandCenterSeverityDto,
} from "@venext/shared-contracts";
import {
  isRelationalEconomicCommandCenterRealtimeType,
  RelationalEconomicCommandCenterRealtimeSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalEconomicCommandRealtimeService {
  private readonly log = new Logger(RelationalEconomicCommandRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishBothSides(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    snapshotId: string | null;
    relationshipId: string | null;
    severity: RelationalEconomicCommandCenterSeverityDto;
    globalRiskScore: number;
    realtimeEventType: RelationalEconomicCommandCenterRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    snapshotId: string | null;
    relationshipId: string | null;
    severity: RelationalEconomicCommandCenterSeverityDto;
    globalRiskScore: number;
    realtimeEventType: RelationalEconomicCommandCenterRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_economic_command_center_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalEconomicCommandCenterRealtimeType(input.realtimeEventType)) return;
    const body: RelationalEconomicCommandCenterRealtimeDto = {
      snapshotId: input.snapshotId,
      relationshipId: input.relationshipId,
      severity: input.severity,
      globalRiskScore: input.globalRiskScore,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    const parsed = RelationalEconomicCommandCenterRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`command center realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.realtimeEventType,
      source: "RELATIONAL_ECONOMIC_COMMAND_CENTER",
      body: parsed.data,
    });
  }
}
