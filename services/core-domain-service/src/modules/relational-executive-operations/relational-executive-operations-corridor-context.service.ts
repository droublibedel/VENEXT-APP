import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  type StrategicCommandCorridorContext,
  RelationalStrategicCommandCorridorContextService,
} from "../relational-strategic-command/relational-strategic-command-corridor-context.service";
import { RelationalExecutiveOperationsPolicyService } from "./relational-executive-operations-policy.service";

export type ExecutiveOperationsCorridorContext = StrategicCommandCorridorContext & {
  activeStrategicCommandNodeId: string | null;
  topCommandScore: number;
  topCommandExecutiveConcentration: number;
  priorExecutiveOperationsNodeCount: number;
};

@Injectable()
export class RelationalExecutiveOperationsCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalExecutiveOperationsPolicyService,
    private readonly commandContext: RelationalStrategicCommandCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<ExecutiveOperationsCorridorContext> {
    const base = await this.commandContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        ...base,
        activeStrategicCommandNodeId: null,
        topCommandScore: 0,
        topCommandExecutiveConcentration: 0,
        priorExecutiveOperationsNodeCount: 0,
      };
    }

    const [cmdNode, priorCount] = await Promise.all([
      this.prisma.relationalStrategicCommandNode.findFirst({
        where: { relationshipId, active: true },
        orderBy: { commandScore: "desc" },
        select: { id: true, commandScore: true, executiveConcentration: true },
      }),
      this.prisma.relationalExecutiveOperationsNode.count({ where: { relationshipId } }),
    ]);

    return {
      ...base,
      activeStrategicCommandNodeId: cmdNode?.id ?? null,
      topCommandScore: this.policy.clampInt(cmdNode?.commandScore ?? 0),
      topCommandExecutiveConcentration: this.policy.clampInt(cmdNode?.executiveConcentration ?? 0),
      priorExecutiveOperationsNodeCount: priorCount,
    };
  }
}
