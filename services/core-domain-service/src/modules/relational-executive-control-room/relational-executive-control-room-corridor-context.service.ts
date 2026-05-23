import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  type ExecutiveOperationsCorridorContext,
  RelationalExecutiveOperationsCorridorContextService,
} from "../relational-executive-operations/relational-executive-operations-corridor-context.service";
import { RelationalExecutiveControlRoomPolicyService } from "./relational-executive-control-room-policy.service";

export type ExecutiveControlRoomCorridorContext = ExecutiveOperationsCorridorContext & {
  activeExecutiveOperationsNodeId: string | null;
  topOperationsScore: number;
  topOperationsExecutivePressure: number;
  priorExecutiveControlRoomNodeCount: number;
};

@Injectable()
export class RelationalExecutiveControlRoomCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalExecutiveControlRoomPolicyService,
    private readonly operationsContext: RelationalExecutiveOperationsCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<ExecutiveControlRoomCorridorContext> {
    const base = await this.operationsContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        ...base,
        activeExecutiveOperationsNodeId: null,
        topOperationsScore: 0,
        topOperationsExecutivePressure: 0,
        priorExecutiveControlRoomNodeCount: 0,
      };
    }

    const [opsNode, priorCount] = await Promise.all([
      this.prisma.relationalExecutiveOperationsNode.findFirst({
        where: { relationshipId, active: true },
        orderBy: { executiveOperationsScore: "desc" },
        select: { id: true, executiveOperationsScore: true, executivePressure: true },
      }),
      this.prisma.relationalExecutiveControlRoomNode.count({ where: { relationshipId } }),
    ]);

    return {
      ...base,
      activeExecutiveOperationsNodeId: opsNode?.id ?? null,
      topOperationsScore: this.policy.clampInt(opsNode?.executiveOperationsScore ?? 0),
      topOperationsExecutivePressure: this.policy.clampInt(opsNode?.executivePressure ?? 0),
      priorExecutiveControlRoomNodeCount: priorCount,
    };
  }
}
