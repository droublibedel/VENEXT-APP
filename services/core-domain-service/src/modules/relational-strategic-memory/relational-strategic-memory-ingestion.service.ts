import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationalEconomicSignalGraphIngestionService } from "../relational-economic-signal-graph/relational-economic-signal-graph-ingestion.service";
import { RelationalStrategicMemoryService } from "./relational-strategic-memory.service";

/** Capitalizes corridor history after scenario review pipeline (20.18). */
@Injectable()
export class RelationalStrategicMemoryIngestionService {
  private readonly log = new Logger(RelationalStrategicMemoryIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly memory: RelationalStrategicMemoryService,
    @Inject(forwardRef(() => RelationalEconomicSignalGraphIngestionService))
    private readonly graphIngestion: RelationalEconomicSignalGraphIngestionService,
  ) {}

  private async enabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true, corridorState: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_strategic_memory_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_strategic_memory_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  async syncForRelationship(relationshipId: string): Promise<void> {
    try {
      if (!(await this.enabled(relationshipId))) return;

      const approvedReviews = await this.prisma.relationalScenarioReviewBoard.findMany({
        where: { relationshipId, reviewStatus: "APPROVED" },
        orderBy: { approvedAt: "desc" },
        take: 10,
      });
      for (const review of approvedReviews) {
        await this.memory.createMemoryFromReview(review.id);
      }

      const orders = await this.prisma.order.findMany({ where: { relationshipId }, select: { id: true } });
      const resolvedIncidents = await this.prisma.relationalFulfillmentIncident.findMany({
        where: {
          fulfillmentRecord: { orderId: { in: orders.map((o) => o.id) } },
          resolutionStatus: "RESOLVED",
          resolvedAt: { gte: new Date(Date.now() - 30 * 86400000) },
        },
        take: 10,
      });
      for (const inc of resolvedIncidents) {
        await this.memory.createMemoryFromIncidentResolution(inc.id);
      }

      await this.memory.detectRecurringOperationalPatterns(relationshipId);
      await this.graphIngestion.syncForRelationship(relationshipId);
    } catch (err) {
      this.log.warn(`strategic memory ingestion failed: ${String(err)}`);
    }
  }
}
