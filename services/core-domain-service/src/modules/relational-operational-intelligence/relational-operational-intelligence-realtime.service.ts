import { Injectable, Logger } from "@nestjs/common";
import type { RelationalOperationalAlertSeverity, RelationalOperationalAlertType } from "@prisma/client";
import {
  isRelationalOperationalRealtimeEventType,
  type RelationalOperationalRealtimeDto,
  type RelationalOperationalRealtimeEventType,
  RelationalOperationalRealtimeSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalOperationalIntelligenceRealtimeService {
  private readonly log = new Logger(RelationalOperationalIntelligenceRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganization(input: {
    organizationId: string;
    alertId: string;
    relationshipId: string;
    severity: RelationalOperationalAlertSeverity;
    alertType: RelationalOperationalAlertType;
    realtimeEventType: RelationalOperationalRealtimeEventType;
  }): Promise<boolean> {
    if (!(await this.flags.isEnabled("relational_operational_realtime_enabled", { organizationId: input.organizationId }))) {
      return false;
    }
    if (!isRelationalOperationalRealtimeEventType(input.realtimeEventType)) {
      this.log.warn(`operational realtime unknown envelope ${input.realtimeEventType}`);
      return false;
    }
    const body: RelationalOperationalRealtimeDto = {
      alertId: input.alertId,
      relationshipId: input.relationshipId,
      severity: input.severity,
      alertType: input.alertType,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    const parsed = RelationalOperationalRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`operational realtime contract invalid: ${parsed.error.message}`);
      return false;
    }
    return this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.realtimeEventType,
      source: "RELATIONAL_OPERATIONAL_INTELLIGENCE",
      body: parsed.data,
    });
  }

  async publishBothSides(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    alertId: string;
    relationshipId: string;
    severity: RelationalOperationalAlertSeverity;
    alertType: RelationalOperationalAlertType;
    realtimeEventType: RelationalOperationalRealtimeEventType;
  }): Promise<boolean> {
    const base = {
      alertId: input.alertId,
      relationshipId: input.relationshipId,
      severity: input.severity,
      alertType: input.alertType,
      realtimeEventType: input.realtimeEventType,
    };
    const a = await this.publishToOrganization({ organizationId: input.buyerOrganizationId, ...base });
    const b = await this.publishToOrganization({ organizationId: input.sellerOrganizationId, ...base });
    return a && b;
  }
}
