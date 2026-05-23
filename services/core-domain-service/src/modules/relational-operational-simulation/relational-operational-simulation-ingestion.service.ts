import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationalScenarioReviewIngestionService } from "../relational-scenario-review/relational-scenario-review-ingestion.service";
import { RelationalOperationalSimulationService } from "./relational-operational-simulation.service";

/** Optional background sync — runs SLA stress projection when orchestration pipeline completes. */
@Injectable()
export class RelationalOperationalSimulationIngestionService {
  private readonly log = new Logger(RelationalOperationalSimulationIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly simulation: RelationalOperationalSimulationService,
    @Inject(forwardRef(() => RelationalScenarioReviewIngestionService))
    private readonly reviewIngestion: RelationalScenarioReviewIngestionService,
  ) {}

  private async enabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true, corridorState: true },
    });
    if (!rel) return false;
    if (rel.corridorState === "TERMINATED" || rel.corridorState === "SUSPENDED") return false;
    const a = await this.flags.isEnabled("relational_operational_simulation_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_operational_simulation_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  async suggestStressProjection(relationshipId: string): Promise<void> {
    try {
      if (!(await this.enabled(relationshipId))) return;
      const running = await this.prisma.relationalOperationalSimulation.count({
        where: { relationshipId, status: "RUNNING" },
      });
      if (running > 0) return;
      await this.simulation.runSimulation({
        relationshipId,
        body: { simulationType: "SLA_STRESS_TEST", stressMultiplier: 1 },
      });
      await this.reviewIngestion.syncForRelationship(relationshipId);
    } catch (err) {
      this.log.warn(`simulation ingestion suggest failed: ${String(err)}`);
    }
  }
}
