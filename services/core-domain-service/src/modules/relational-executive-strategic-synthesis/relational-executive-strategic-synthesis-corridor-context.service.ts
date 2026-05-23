import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  type ExecutiveControlRoomCorridorContext,
  RelationalExecutiveControlRoomCorridorContextService,
} from "../relational-executive-control-room/relational-executive-control-room-corridor-context.service";
import { RelationalExecutiveStrategicSynthesisPolicyService } from "./relational-executive-strategic-synthesis-policy.service";

export type ExecutiveStrategicSynthesisCorridorContext = ExecutiveControlRoomCorridorContext & {
  activeExecutiveControlRoomNodeId: string | null;
  topControlRoomScore: number;
  topControlRoomExecutivePressure: number;
  priorExecutiveStrategicSynthesisNodeCount: number;
};

@Injectable()
export class RelationalExecutiveStrategicSynthesisCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalExecutiveStrategicSynthesisPolicyService,
    private readonly controlRoomContext: RelationalExecutiveControlRoomCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<ExecutiveStrategicSynthesisCorridorContext> {
    const base = await this.controlRoomContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        ...base,
        activeExecutiveControlRoomNodeId: null,
        topControlRoomScore: 0,
        topControlRoomExecutivePressure: 0,
        priorExecutiveStrategicSynthesisNodeCount: 0,
      };
    }

    const [controlRoomNode, priorCount] = await Promise.all([
      this.prisma.relationalExecutiveControlRoomNode.findFirst({
        where: { relationshipId, active: true },
        orderBy: { controlRoomScore: "desc" },
        select: { id: true, controlRoomScore: true, executivePressure: true },
      }),
      this.prisma.relationalExecutiveStrategicSynthesisNode.count({ where: { relationshipId } }),
    ]);

    return {
      ...base,
      activeExecutiveControlRoomNodeId: controlRoomNode?.id ?? null,
      topControlRoomScore: this.policy.clampInt(controlRoomNode?.controlRoomScore ?? 0),
      topControlRoomExecutivePressure: this.policy.clampInt(controlRoomNode?.executivePressure ?? 0),
      priorExecutiveStrategicSynthesisNodeCount: priorCount,
    };
  }
}
