import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  type StrategicIntelligenceCorridorContext,
  RelationalStrategicIntelligenceCorridorContextService,
} from "../relational-strategic-intelligence/relational-strategic-intelligence-corridor-context.service";
import { RelationalStrategicCommandPolicyService } from "./relational-strategic-command-policy.service";

export type StrategicCommandCorridorContext = StrategicIntelligenceCorridorContext & {
  activeStrategicIntelligenceNodeId: string | null;
  topStrategicIntelligenceScore: number;
  topStrategicExecutiveConcentration: number;
  priorStrategicCommandNodeCount: number;
};

@Injectable()
export class RelationalStrategicCommandCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalStrategicCommandPolicyService,
    private readonly strategicContext: RelationalStrategicIntelligenceCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<StrategicCommandCorridorContext> {
    const base = await this.strategicContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        ...base,
        activeStrategicIntelligenceNodeId: null,
        topStrategicIntelligenceScore: 0,
        topStrategicExecutiveConcentration: 0,
        priorStrategicCommandNodeCount: 0,
      };
    }

    const [intelNode, priorCount] = await Promise.all([
      this.prisma.relationalStrategicIntelligenceNode.findFirst({
        where: { relationshipId, active: true },
        orderBy: { strategicIntelligenceScore: "desc" },
        select: { id: true, strategicIntelligenceScore: true, executiveExposure: true },
      }),
      this.prisma.relationalStrategicCommandNode.count({ where: { relationshipId } }),
    ]);

    return {
      ...base,
      activeStrategicIntelligenceNodeId: intelNode?.id ?? null,
      topStrategicIntelligenceScore: this.policy.clampInt(intelNode?.strategicIntelligenceScore ?? 0),
      topStrategicExecutiveConcentration: this.policy.clampInt(intelNode?.executiveExposure ?? 0),
      priorStrategicCommandNodeCount: priorCount,
    };
  }
}
