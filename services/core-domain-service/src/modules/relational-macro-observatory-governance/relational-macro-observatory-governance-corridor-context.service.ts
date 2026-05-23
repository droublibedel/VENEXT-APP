import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  type StrategicObservatoryCorridorContext,
  RelationalStrategicObservatoryCorridorContextService,
} from "../relational-strategic-observatory/relational-strategic-observatory-corridor-context.service";
import { RelationalMacroObservatoryGovernancePolicyService } from "./relational-macro-observatory-governance-policy.service";

export type MacroObservatoryGovernanceCorridorContext = StrategicObservatoryCorridorContext & {
  activeStrategicObservatoryNodeId: string | null;
  topStrategicObservatoryScore: number;
  topStrategicObservatoryExecutiveExposure: number;
  topStrategicObservatorySystemicPressure: number;
  priorMacroObservatoryGovernanceNodeCount: number;
};

@Injectable()
export class RelationalMacroObservatoryGovernanceCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalMacroObservatoryGovernancePolicyService,
    private readonly strategicObservatoryContext: RelationalStrategicObservatoryCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<MacroObservatoryGovernanceCorridorContext> {
    const base = await this.strategicObservatoryContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        ...base,
        activeStrategicObservatoryNodeId: null,
        topStrategicObservatoryScore: 0,
        topStrategicObservatoryExecutiveExposure: 0,
        topStrategicObservatorySystemicPressure: 0,
        priorMacroObservatoryGovernanceNodeCount: 0,
      };
    }

    const [observatoryNode, priorCount] = await Promise.all([
      this.prisma.relationalStrategicObservatoryNode.findFirst({
        where: { relationshipId, active: true },
        orderBy: { observatoryScore: "desc" },
        select: {
          id: true,
          observatoryScore: true,
          executiveExposure: true,
          systemicPressure: true,
        },
      }),
      this.prisma.relationalMacroObservatoryGovernanceNode.count({ where: { relationshipId } }),
    ]);

    return {
      ...base,
      activeStrategicObservatoryNodeId: observatoryNode?.id ?? null,
      topStrategicObservatoryScore: this.policy.clampInt(observatoryNode?.observatoryScore ?? 0),
      topStrategicObservatoryExecutiveExposure: this.policy.clampInt(observatoryNode?.executiveExposure ?? 0),
      topStrategicObservatorySystemicPressure: this.policy.clampInt(observatoryNode?.systemicPressure ?? 0),
      priorMacroObservatoryGovernanceNodeCount: priorCount,
    };
  }
}
