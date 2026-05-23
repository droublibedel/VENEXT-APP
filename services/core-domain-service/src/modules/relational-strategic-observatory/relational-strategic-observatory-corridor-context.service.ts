import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  type GlobalExecutiveSupervisionCorridorContext,
  RelationalGlobalExecutiveSupervisionCorridorContextService,
} from "../relational-global-executive-supervision/relational-global-executive-supervision-corridor-context.service";
import { RelationalStrategicObservatoryPolicyService } from "./relational-strategic-observatory-policy.service";

export type StrategicObservatoryCorridorContext = GlobalExecutiveSupervisionCorridorContext & {
  activeGlobalExecutiveSupervisionNodeId: string | null;
  topGlobalExecutiveSupervisionScore: number;
  topGlobalExecutiveSupervisionExecutivePressure: number;
  topGlobalExecutiveSupervisionSystemicExposure: number;
  priorStrategicObservatoryNodeCount: number;
};

@Injectable()
export class RelationalStrategicObservatoryCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalStrategicObservatoryPolicyService,
    private readonly globalSupervisionContext: RelationalGlobalExecutiveSupervisionCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<StrategicObservatoryCorridorContext> {
    const base = await this.globalSupervisionContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        ...base,
        activeGlobalExecutiveSupervisionNodeId: null,
        topGlobalExecutiveSupervisionScore: 0,
        topGlobalExecutiveSupervisionExecutivePressure: 0,
        topGlobalExecutiveSupervisionSystemicExposure: 0,
        priorStrategicObservatoryNodeCount: 0,
      };
    }

    const [supervisionNode, priorCount] = await Promise.all([
      this.prisma.relationalGlobalExecutiveSupervisionNode.findFirst({
        where: { relationshipId, active: true },
        orderBy: { supervisionScore: "desc" },
        select: { id: true, supervisionScore: true, executivePressure: true, systemicExposure: true },
      }),
      this.prisma.relationalStrategicObservatoryNode.count({ where: { relationshipId } }),
    ]);

    return {
      ...base,
      activeGlobalExecutiveSupervisionNodeId: supervisionNode?.id ?? null,
      topGlobalExecutiveSupervisionScore: this.policy.clampInt(supervisionNode?.supervisionScore ?? 0),
      topGlobalExecutiveSupervisionExecutivePressure: this.policy.clampInt(supervisionNode?.executivePressure ?? 0),
      topGlobalExecutiveSupervisionSystemicExposure: this.policy.clampInt(supervisionNode?.systemicExposure ?? 0),
      priorStrategicObservatoryNodeCount: priorCount,
    };
  }
}
