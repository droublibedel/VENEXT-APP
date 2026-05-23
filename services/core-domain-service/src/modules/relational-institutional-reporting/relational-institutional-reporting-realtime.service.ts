import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalInstitutionalReportingRealtimeEventType,
  RelationalInstitutionalReportingRealtimeSchema,
  type RelationalInstitutionalReportingRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalInstitutionalReportingRealtimeService {
  private readonly log = new Logger(RelationalInstitutionalReportingRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    reportingNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    reportingDepth: number;
    eventType: RelationalInstitutionalReportingRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    reportingNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    reportingDepth: number;
    eventType: RelationalInstitutionalReportingRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_institutional_reporting_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalInstitutionalReportingRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      reportingNodeId: input.reportingNodeId,
      nodeCode: input.nodeCode,
      intensity: input.intensity,
      reportingDepth: input.reportingDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalInstitutionalReportingRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`institutional reporting realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_INSTITUTIONAL_REPORTING",
      body: parsed.data,
    });
  }
}
