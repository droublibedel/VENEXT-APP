import { Injectable, Logger } from "@nestjs/common";
import type {
  RelationalOperationalRecommendationSeverity,
  RelationalOperationalRecommendationSource,
  RelationalOperationalRecommendationType,
} from "@prisma/client";
import {
  isRelationalOperationalRecommendationRealtimeEventType,
  type RelationalOperationalRecommendationRealtimeDto,
  type RelationalOperationalRecommendationRealtimeEventType,
  RelationalOperationalRecommendationRealtimeSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalOperationalRecommendationRealtimeService {
  private readonly log = new Logger(RelationalOperationalRecommendationRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganization(input: {
    organizationId: string;
    recommendationId: string;
    relationshipId: string;
    severity: RelationalOperationalRecommendationSeverity;
    recommendationType: RelationalOperationalRecommendationType;
    recommendationScore: number;
    source: RelationalOperationalRecommendationSource;
    realtimeEventType: RelationalOperationalRecommendationRealtimeEventType;
  }): Promise<boolean> {
    if (
      !(await this.flags.isEnabled("relational_operational_recommendation_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return false;
    }
    if (!isRelationalOperationalRecommendationRealtimeEventType(input.realtimeEventType)) {
      this.log.warn(`recommendation realtime unknown ${input.realtimeEventType}`);
      return false;
    }
    const body: RelationalOperationalRecommendationRealtimeDto = {
      recommendationId: input.recommendationId,
      relationshipId: input.relationshipId,
      severity: input.severity,
      recommendationType: input.recommendationType,
      recommendationScore: input.recommendationScore,
      source: input.source,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    const parsed = RelationalOperationalRecommendationRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`recommendation realtime invalid: ${parsed.error.message}`);
      return false;
    }
    return this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.realtimeEventType,
      source: "RELATIONAL_OPERATIONAL_RECOMMENDATION",
      body: parsed.data,
    });
  }

  async publishBothSides(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    recommendationId: string;
    relationshipId: string;
    severity: RelationalOperationalRecommendationSeverity;
    recommendationType: RelationalOperationalRecommendationType;
    recommendationScore: number;
    source: RelationalOperationalRecommendationSource;
    realtimeEventType: RelationalOperationalRecommendationRealtimeEventType;
  }): Promise<boolean> {
    const base = {
      recommendationId: input.recommendationId,
      relationshipId: input.relationshipId,
      severity: input.severity,
      recommendationType: input.recommendationType,
      recommendationScore: input.recommendationScore,
      source: input.source,
      realtimeEventType: input.realtimeEventType,
    };
    const a = await this.publishToOrganization({ organizationId: input.buyerOrganizationId, ...base });
    const b = await this.publishToOrganization({ organizationId: input.sellerOrganizationId, ...base });
    return a && b;
  }
}
