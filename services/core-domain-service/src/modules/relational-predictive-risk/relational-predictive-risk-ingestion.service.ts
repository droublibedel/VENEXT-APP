import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationalOperationalRecommendationIngestionService } from "../relational-operational-recommendation/relational-operational-recommendation-ingestion.service";
import { RelationalPredictiveRiskService } from "./relational-predictive-risk.service";

/** Instruction 20.13 — recalculate predictive signals after operational events. */
@Injectable()
export class RelationalPredictiveRiskIngestionService {
  private readonly log = new Logger(RelationalPredictiveRiskIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly predictive: RelationalPredictiveRiskService,
    @Inject(forwardRef(() => RelationalOperationalRecommendationIngestionService))
    private readonly recommendationIngestion: RelationalOperationalRecommendationIngestionService,
  ) {}

  private async enabledForRelationship(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_predictive_risk_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_predictive_risk_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  private async safeRecalculate(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.log.warn(`predictive risk ingestion failed: ${String(err)}`);
    }
  }

  async recalculateCorridor(relationshipId: string): Promise<void> {
    await this.safeRecalculate(async () => {
      if (!(await this.enabledForRelationship(relationshipId))) return;
      await this.predictive.analyzeCorridor(relationshipId);
      await this.recommendationIngestion.regenerateForRelationship(relationshipId);
    });
  }

  async onOperationalEvent(input: { relationshipId: string }): Promise<void> {
    await this.recalculateCorridor(input.relationshipId);
  }
}
