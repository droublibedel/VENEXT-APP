import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationalStrategicMemoryIngestionService } from "../relational-strategic-memory/relational-strategic-memory-ingestion.service";
import { RelationalScenarioReviewService } from "./relational-scenario-review.service";

/** Auto-creates human review boards after critical simulations (20.17). */
@Injectable()
export class RelationalScenarioReviewIngestionService {
  private readonly log = new Logger(RelationalScenarioReviewIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly reviews: RelationalScenarioReviewService,
    @Inject(forwardRef(() => RelationalStrategicMemoryIngestionService))
    private readonly memoryIngestion: RelationalStrategicMemoryIngestionService,
  ) {}

  private async enabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_scenario_review_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_scenario_review_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  async syncForRelationship(relationshipId: string): Promise<void> {
    try {
      if (!(await this.enabled(relationshipId))) return;
      const simulations = await this.prisma.relationalOperationalSimulation.findMany({
        where: {
          relationshipId,
          status: "COMPLETED",
          OR: [
            { severity: "CRITICAL" },
            { requiresHumanReview: true },
            {
              simulationType: {
                in: ["COLLAPSE_PROPAGATION", "GOVERNANCE_BREAKDOWN", "MULTI_CORRIDOR_STRESS"],
              },
            },
            { outcome: { in: ["HIGH_RISK", "COLLAPSE_RISK"] } },
          ],
        },
        orderBy: { completedAt: "desc" },
        take: 10,
      });
      for (const sim of simulations) {
        await this.reviews.createReviewFromSimulation(sim.id);
      }
      await this.memoryIngestion.syncForRelationship(relationshipId);
    } catch (err) {
      this.log.warn(`scenario review ingestion failed: ${String(err)}`);
    }
  }
}
