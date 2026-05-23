import { Injectable, Logger } from "@nestjs/common";
import type {
  RelationalScenarioDecisionSeverity,
  RelationalScenarioDecisionType,
  RelationalScenarioReviewStatus,
} from "@prisma/client";
import {
  isRelationalScenarioReviewRealtimeEventType,
  type RelationalScenarioReviewRealtimeDto,
  type RelationalScenarioReviewRealtimeEventType,
  RelationalScenarioReviewRealtimeSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalScenarioReviewRealtimeService {
  private readonly log = new Logger(RelationalScenarioReviewRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishBothSides(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    reviewBoardId: string;
    relationshipId: string;
    reviewStatus: RelationalScenarioReviewStatus;
    decisionType: RelationalScenarioDecisionType;
    decisionSeverity: RelationalScenarioDecisionSeverity;
    realtimeEventType: RelationalScenarioReviewRealtimeEventType;
  }): Promise<void> {
    const base = {
      reviewBoardId: input.reviewBoardId,
      relationshipId: input.relationshipId,
      reviewStatus: input.reviewStatus,
      decisionType: input.decisionType,
      decisionSeverity: input.decisionSeverity,
      realtimeEventType: input.realtimeEventType,
    };
    await this.publishToOrganization({ organizationId: input.buyerOrganizationId, ...base });
    await this.publishToOrganization({ organizationId: input.sellerOrganizationId, ...base });
  }

  private async publishToOrganization(
    input: {
      organizationId: string;
      reviewBoardId: string;
      relationshipId: string;
      reviewStatus: RelationalScenarioReviewStatus;
      decisionType: RelationalScenarioDecisionType;
      decisionSeverity: RelationalScenarioDecisionSeverity;
      realtimeEventType: RelationalScenarioReviewRealtimeEventType;
    },
  ): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_scenario_review_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalScenarioReviewRealtimeEventType(input.realtimeEventType)) return;
    const body: RelationalScenarioReviewRealtimeDto = {
      reviewBoardId: input.reviewBoardId,
      relationshipId: input.relationshipId,
      reviewStatus: input.reviewStatus,
      decisionType: input.decisionType,
      decisionSeverity: input.decisionSeverity,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    const parsed = RelationalScenarioReviewRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`scenario review realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.realtimeEventType,
      source: "RELATIONAL_SCENARIO_REVIEW",
      body: parsed.data,
    });
  }
}
