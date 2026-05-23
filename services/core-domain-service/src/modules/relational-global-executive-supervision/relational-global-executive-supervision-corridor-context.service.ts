import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  type ExecutiveStrategicSynthesisCorridorContext,
  RelationalExecutiveStrategicSynthesisCorridorContextService,
} from "../relational-executive-strategic-synthesis/relational-executive-strategic-synthesis-corridor-context.service";
import { RelationalGlobalExecutiveSupervisionPolicyService } from "./relational-global-executive-supervision-policy.service";

export type GlobalExecutiveSupervisionCorridorContext = ExecutiveStrategicSynthesisCorridorContext & {
  activeExecutiveStrategicSynthesisNodeId: string | null;
  topStrategicSynthesisScore: number;
  topStrategicSynthesisExecutiveExposure: number;
  topStrategicSynthesisSystemicPressure: number;
  priorGlobalExecutiveSupervisionNodeCount: number;
};

@Injectable()
export class RelationalGlobalExecutiveSupervisionCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalGlobalExecutiveSupervisionPolicyService,
    private readonly strategicSynthesisContext: RelationalExecutiveStrategicSynthesisCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<GlobalExecutiveSupervisionCorridorContext> {
    const base = await this.strategicSynthesisContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        ...base,
        activeExecutiveStrategicSynthesisNodeId: null,
        topStrategicSynthesisScore: 0,
        topStrategicSynthesisExecutiveExposure: 0,
        topStrategicSynthesisSystemicPressure: 0,
        priorGlobalExecutiveSupervisionNodeCount: 0,
      };
    }

    const [synthesisNode, priorCount] = await Promise.all([
      this.prisma.relationalExecutiveStrategicSynthesisNode.findFirst({
        where: { relationshipId, active: true },
        orderBy: { synthesisScore: "desc" },
        select: { id: true, synthesisScore: true, executiveExposure: true, systemicPressure: true },
      }),
      this.prisma.relationalGlobalExecutiveSupervisionNode.count({ where: { relationshipId } }),
    ]);

    return {
      ...base,
      activeExecutiveStrategicSynthesisNodeId: synthesisNode?.id ?? null,
      topStrategicSynthesisScore: this.policy.clampInt(synthesisNode?.synthesisScore ?? 0),
      topStrategicSynthesisExecutiveExposure: this.policy.clampInt(synthesisNode?.executiveExposure ?? 0),
      topStrategicSynthesisSystemicPressure: this.policy.clampInt(synthesisNode?.systemicPressure ?? 0),
      priorGlobalExecutiveSupervisionNodeCount: priorCount,
    };
  }
}
