import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationalOperationalSimulationIngestionService } from "../relational-operational-simulation/relational-operational-simulation-ingestion.service";
import { RelationalOperationalOrchestrationService } from "./relational-operational-orchestration.service";

@Injectable()
export class RelationalOperationalOrchestrationIngestionService {
  private readonly log = new Logger(RelationalOperationalOrchestrationIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly orchestration: RelationalOperationalOrchestrationService,
    @Inject(forwardRef(() => RelationalOperationalSimulationIngestionService))
    private readonly simulationIngestion: RelationalOperationalSimulationIngestionService,
  ) {}

  private async enabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_operational_orchestration_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_operational_orchestration_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  async syncForRelationship(relationshipId: string): Promise<void> {
    try {
      if (!(await this.enabled(relationshipId))) return;
      await this.orchestration.syncOrchestrationsForRelationship(relationshipId);
      await this.simulationIngestion.suggestStressProjection(relationshipId);
    } catch (err) {
      this.log.warn(`orchestration ingestion failed: ${String(err)}`);
    }
  }
}
