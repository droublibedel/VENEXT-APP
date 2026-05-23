import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  type InstitutionalReportingCorridorContext,
  RelationalInstitutionalReportingCorridorContextService,
} from "../relational-institutional-reporting/relational-institutional-reporting-corridor-context.service";
import { RelationalStrategicIntelligencePolicyService } from "./relational-strategic-intelligence-policy.service";

export type StrategicIntelligenceCorridorContext = InstitutionalReportingCorridorContext & {
  activeInstitutionalReportingNodeId: string | null;
  topInstitutionalScore: number;
  topInstitutionalExecutiveRisk: number;
  priorStrategicIntelligenceNodeCount: number;
};

@Injectable()
export class RelationalStrategicIntelligenceCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalStrategicIntelligencePolicyService,
    private readonly institutionalContext: RelationalInstitutionalReportingCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<StrategicIntelligenceCorridorContext> {
    const base = await this.institutionalContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        ...base,
        activeInstitutionalReportingNodeId: null,
        topInstitutionalScore: 0,
        topInstitutionalExecutiveRisk: 0,
        priorStrategicIntelligenceNodeCount: 0,
      };
    }

    const [instNode, priorCount] = await Promise.all([
      this.prisma.relationalInstitutionalReportingNode.findFirst({
        where: { relationshipId, active: true },
        orderBy: { institutionalScore: "desc" },
        select: { id: true, institutionalScore: true, executiveRisk: true },
      }),
      this.prisma.relationalStrategicIntelligenceNode.count({ where: { relationshipId } }),
    ]);

    return {
      ...base,
      activeInstitutionalReportingNodeId: instNode?.id ?? null,
      topInstitutionalScore: this.policy.clampInt(instNode?.institutionalScore ?? 0),
      topInstitutionalExecutiveRisk: this.policy.clampInt(instNode?.executiveRisk ?? 0),
      priorStrategicIntelligenceNodeCount: priorCount,
    };
  }
}
