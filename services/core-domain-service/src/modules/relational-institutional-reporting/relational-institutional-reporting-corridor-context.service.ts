import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  type ExecutiveOrchestrationCorridorContext,
  RelationalExecutiveOrchestrationCorridorContextService,
} from "../relational-executive-orchestration/relational-executive-orchestration-corridor-context.service";
import { RelationalInstitutionalReportingPolicyService } from "./relational-institutional-reporting-policy.service";

export type InstitutionalReportingCorridorContext = ExecutiveOrchestrationCorridorContext & {
  activeExecutiveOrchestrationNodeId: string | null;
  topOrchestrationScore: number;
  topExecutiveCoordinationPressure: number;
  priorInstitutionalReportingNodeCount: number;
};

@Injectable()
export class RelationalInstitutionalReportingCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalInstitutionalReportingPolicyService,
    private readonly executiveContext: RelationalExecutiveOrchestrationCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<InstitutionalReportingCorridorContext> {
    const base = await this.executiveContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        ...base,
        activeExecutiveOrchestrationNodeId: null,
        topOrchestrationScore: 0,
        topExecutiveCoordinationPressure: 0,
        priorInstitutionalReportingNodeCount: 0,
      };
    }

    const [orchNode, priorCount] = await Promise.all([
      this.prisma.relationalExecutiveOrchestrationNode.findFirst({
        where: { relationshipId, active: true },
        orderBy: { orchestrationScore: "desc" },
        select: { id: true, orchestrationScore: true, executiveCoordinationPressure: true },
      }),
      this.prisma.relationalInstitutionalReportingNode.count({ where: { relationshipId } }),
    ]);

    return {
      ...base,
      activeExecutiveOrchestrationNodeId: orchNode?.id ?? null,
      topOrchestrationScore: this.policy.clampInt(orchNode?.orchestrationScore ?? 0),
      topExecutiveCoordinationPressure: this.policy.clampInt(orchNode?.executiveCoordinationPressure ?? 0),
      priorInstitutionalReportingNodeCount: priorCount,
    };
  }
}
