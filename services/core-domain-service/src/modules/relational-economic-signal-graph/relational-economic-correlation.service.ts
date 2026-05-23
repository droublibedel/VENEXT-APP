import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  ECONOMIC_GRAPH_EXCLUDED_TASK_STATUSES,
  ECONOMIC_GRAPH_OPEN_TASKS_SOURCE,
  ECONOMIC_GRAPH_OPEN_TASK_STATUSES,
} from "./relational-economic-signal-graph.constants";
import {
  RelationalEconomicSignalPolicyService,
  type CorridorStressSnapshot,
} from "./relational-economic-signal-policy.service";

export type OperationalCorrelationResult = {
  sourceRelationshipId: string;
  targetRelationshipId: string;
  correlationScore: number;
  sharedIncidentCount: number;
  sharedOperationalStress: number;
  dependencyStrength: number;
  systemicExposure: number;
  propagationProbability: number;
};

@Injectable()
export class RelationalEconomicCorrelationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicSignalPolicyService,
  ) {}

  async gatherStressSnapshot(relationshipId: string): Promise<CorridorStressSnapshot> {
    const orders = await this.prisma.order.findMany({ where: { relationshipId }, select: { id: true } });
    const orderIds = orders.map((o) => o.id);
    const [
      openIncidents,
      slaAlerts,
      criticalSimulations,
      activeOrchestrations,
      activeRecommendations,
      activeMemories,
      openTasks,
    ] = await Promise.all([
      orderIds.length
        ? this.prisma.relationalFulfillmentIncident.count({
            where: {
              fulfillmentRecord: { orderId: { in: orderIds } },
              resolutionStatus: { not: "RESOLVED" },
            },
          })
        : Promise.resolve(0),
      this.prisma.relationalOperationalAlert.count({
        where: { relationshipId, resolvedAt: null, alertType: "SLA_DELAY_RISK" },
      }),
      this.prisma.relationalOperationalSimulation.count({
        where: { relationshipId, status: "COMPLETED", severity: "CRITICAL" },
      }),
      this.prisma.relationalOperationalOrchestration.count({
        where: { relationshipId, status: { in: ["DRAFT", "ACTIVE", "PAUSED", "WAITING_VALIDATION"] } },
      }),
      this.prisma.relationalOperationalRecommendation.count({
        where: { relationshipId, status: { in: ["ACTIVE", "ACKNOWLEDGED"] } },
      }),
      this.prisma.relationalStrategicMemory.count({
        where: { relationshipId, memoryStatus: "ACTIVE" },
      }),
      this.prisma.relationalFulfillmentTask.count({
        where: {
          relationshipId,
          taskStatus: { in: ECONOMIC_GRAPH_OPEN_TASK_STATUSES },
        },
      }),
    ]);
    return {
      openIncidents,
      slaAlerts,
      criticalSimulations,
      activeOrchestrations,
      activeRecommendations,
      activeMemories,
      openTasks,
      openTasksComputed: true,
      openTasksSource: ECONOMIC_GRAPH_OPEN_TASKS_SOURCE,
      openTasksIncludedStatuses: ECONOMIC_GRAPH_OPEN_TASK_STATUSES,
      openTasksExcludedStatuses: ECONOMIC_GRAPH_EXCLUDED_TASK_STATUSES,
    };
  }

  async detectOperationalCorrelation(
    sourceRelationshipId: string,
    targetRelationshipId: string,
  ): Promise<OperationalCorrelationResult | null> {
    if (sourceRelationshipId === targetRelationshipId) return null;

    const [srcSnap, tgtSnap] = await Promise.all([
      this.gatherStressSnapshot(sourceRelationshipId),
      this.gatherStressSnapshot(targetRelationshipId),
    ]);

    const srcOrch = await this.prisma.relationalOperationalOrchestration.findMany({
      where: { relationshipId: sourceRelationshipId, status: { in: ["ACTIVE", "WAITING_VALIDATION"] } },
      select: { orchestrationType: true },
      take: 10,
    });
    const tgtOrch = await this.prisma.relationalOperationalOrchestration.findMany({
      where: { relationshipId: targetRelationshipId, status: { in: ["ACTIVE", "WAITING_VALIDATION"] } },
      select: { orchestrationType: true },
      take: 10,
    });
    const sharedOrchTypes = srcOrch.filter((s) => tgtOrch.some((t) => t.orchestrationType === s.orchestrationType)).length;

    const sharedIncidentCount = Math.min(srcSnap.openIncidents, tgtSnap.openIncidents);
    const sharedOperationalStress =
      this.policy.computeStressScore(srcSnap) + this.policy.computeStressScore(tgtSnap);
    const correlationScore = Math.min(
      100,
      sharedIncidentCount * 12 +
        Math.min(srcSnap.slaAlerts, tgtSnap.slaAlerts) * 10 +
        sharedOrchTypes * 15 +
        (srcSnap.activeMemories > 0 && tgtSnap.activeMemories > 0 ? 8 : 0),
    );
    if (correlationScore < 20) return null;

    const strength = this.policy.correlationStrengthFromScore(correlationScore);
    return {
      sourceRelationshipId,
      targetRelationshipId,
      correlationScore,
      sharedIncidentCount,
      sharedOperationalStress,
      dependencyStrength: correlationScore,
      systemicExposure: Math.min(100, Math.round((correlationScore + sharedOperationalStress) / 3)),
      propagationProbability: this.policy.propagationProbabilityFromStrength(strength),
    };
  }
}
