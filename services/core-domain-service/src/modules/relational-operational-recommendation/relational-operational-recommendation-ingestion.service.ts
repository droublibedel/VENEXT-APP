import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationalOperationalOrchestrationIngestionService } from "../relational-operational-orchestration/relational-operational-orchestration-ingestion.service";
import { RelationalOperationalRecommendationService } from "./relational-operational-recommendation.service";

@Injectable()
export class RelationalOperationalRecommendationIngestionService {
  private readonly log = new Logger(RelationalOperationalRecommendationIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly recommendations: RelationalOperationalRecommendationService,
    @Inject(forwardRef(() => RelationalOperationalOrchestrationIngestionService))
    private readonly orchestrationIngestion: RelationalOperationalOrchestrationIngestionService,
  ) {}

  private async enabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_operational_recommendation_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_operational_recommendation_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  async regenerateForRelationship(relationshipId: string): Promise<void> {
    try {
      if (!(await this.enabled(relationshipId))) return;
      await this.recommendations.generateRecommendationsForRelationship(relationshipId);
      await this.orchestrationIngestion.syncForRelationship(relationshipId);
    } catch (err) {
      this.log.warn(`recommendation ingestion failed: ${String(err)}`);
    }
  }
}
