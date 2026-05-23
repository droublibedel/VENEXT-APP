import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationalEconomicCommandCenterIngestionService } from "../relational-economic-command-center/relational-economic-command-center-ingestion.service";
import { RelationalEconomicPressureIngestionService } from "../relational-economic-pressure/relational-economic-pressure-ingestion.service";
import { RelationalEconomicSignalGraphService } from "./relational-economic-signal-graph.service";

@Injectable()
export class RelationalEconomicSignalGraphIngestionService {
  private readonly log = new Logger(RelationalEconomicSignalGraphIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly graph: RelationalEconomicSignalGraphService,
    @Inject(forwardRef(() => RelationalEconomicCommandCenterIngestionService))
    private readonly commandIngestion: RelationalEconomicCommandCenterIngestionService,
    @Inject(forwardRef(() => RelationalEconomicPressureIngestionService))
    private readonly pressureIngestion: RelationalEconomicPressureIngestionService,
  ) {}

  private async enabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_economic_signal_graph_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_economic_signal_graph_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  async syncForRelationship(relationshipId: string): Promise<void> {
    try {
      if (!(await this.enabled(relationshipId))) return;
      await this.graph.syncGraphForRelationship(relationshipId);
      await this.commandIngestion.refreshAfterSignalGraph(relationshipId);
      await this.pressureIngestion.syncPressureMapForRelationship(relationshipId);
    } catch (err) {
      this.log.warn(`economic signal graph ingestion failed: ${String(err)}`);
    }
  }
}
