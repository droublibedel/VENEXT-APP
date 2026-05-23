import { Injectable, Logger } from "@nestjs/common";
import type { RelationalPredictiveRiskLevel, RelationalPredictiveRiskType } from "@prisma/client";
import {
  isRelationalPredictiveRealtimeEventType,
  type RelationalPredictiveRealtimeDto,
  type RelationalPredictiveRealtimeEventType,
  RelationalPredictiveRealtimeSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalPredictiveRiskRealtimeService {
  private readonly log = new Logger(RelationalPredictiveRiskRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganization(input: {
    organizationId: string;
    riskSignalId: string;
    relationshipId: string;
    riskLevel: RelationalPredictiveRiskLevel;
    riskType: RelationalPredictiveRiskType;
    realtimeEventType: RelationalPredictiveRealtimeEventType;
  }): Promise<boolean> {
    if (!(await this.flags.isEnabled("relational_predictive_realtime_enabled", { organizationId: input.organizationId }))) {
      return false;
    }
    if (!isRelationalPredictiveRealtimeEventType(input.realtimeEventType)) {
      this.log.warn(`predictive realtime unknown envelope ${input.realtimeEventType}`);
      return false;
    }
    const body: RelationalPredictiveRealtimeDto = {
      riskSignalId: input.riskSignalId,
      relationshipId: input.relationshipId,
      riskLevel: input.riskLevel,
      riskType: input.riskType,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    const parsed = RelationalPredictiveRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`predictive realtime contract invalid: ${parsed.error.message}`);
      return false;
    }
    return this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.realtimeEventType,
      source: "RELATIONAL_PREDICTIVE_RISK",
      body: parsed.data,
    });
  }

  async publishBothSides(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    riskSignalId: string;
    relationshipId: string;
    riskLevel: RelationalPredictiveRiskLevel;
    riskType: RelationalPredictiveRiskType;
    realtimeEventType: RelationalPredictiveRealtimeEventType;
  }): Promise<boolean> {
    const base = {
      riskSignalId: input.riskSignalId,
      relationshipId: input.relationshipId,
      riskLevel: input.riskLevel,
      riskType: input.riskType,
      realtimeEventType: input.realtimeEventType,
    };
    const a = await this.publishToOrganization({ organizationId: input.buyerOrganizationId, ...base });
    const b = await this.publishToOrganization({ organizationId: input.sellerOrganizationId, ...base });
    return a && b;
  }
}
