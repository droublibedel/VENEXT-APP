import { Injectable, Logger } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationalEconomicCommandCenterService } from "./relational-economic-command-center.service";

const SYSTEM_ACTOR_USER_ID = "00000000-0000-4000-8000-000000000097";

@Injectable()
export class RelationalEconomicCommandCenterIngestionService {
  private readonly log = new Logger(RelationalEconomicCommandCenterIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly command: RelationalEconomicCommandCenterService,
  ) {}

  private async enabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_economic_command_center_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_economic_command_center_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  async refreshAfterSignalGraph(relationshipId: string): Promise<void> {
    try {
      if (!(await this.enabled(relationshipId))) return;

      const rel = await this.prisma.relationship.findUnique({
        where: { id: relationshipId },
        select: {
          corridorState: true,
          requesterOrganizationId: true,
          receiverOrganizationId: true,
        },
      });
      if (!rel || rel.corridorState === "TERMINATED") return;

      const order = await this.prisma.order.findFirst({
        where: { relationshipId },
        select: { buyerOrganizationId: true },
        orderBy: { createdAt: "desc" },
      });
      const actorOrganizationId = order?.buyerOrganizationId ?? rel.requesterOrganizationId;

      await this.command.generateCommandCenterSnapshot({
        relationshipId,
        actorOrganizationId,
        actorUserId: SYSTEM_ACTOR_USER_ID,
      });
    } catch (err) {
      this.log.warn(`economic command center ingestion failed: ${String(err)}`);
    }
  }
}
