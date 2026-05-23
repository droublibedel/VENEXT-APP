import { Injectable } from "@nestjs/common";
import type { RelationalPredictiveRiskLevel } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { PREDICTIVE_RISK_THRESHOLDS, RelationalPredictiveRiskPolicyService } from "./relational-predictive-risk-policy.service";

const OPEN_TASK_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_EXTERNAL_CONFIRMATION", "WAITING_CORRIDOR_VALIDATION", "BLOCKED"] as const;

export type CorridorCollapseAssessment = {
  corridorCollapseRisk: number;
  operationalFragility: number;
  sustainedOperationalDegradation: boolean;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalOperationalCollapseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalPredictiveRiskPolicyService,
  ) {}

  async assessCorridor(relationshipId: string): Promise<CorridorCollapseAssessment> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { corridorState: true, corridorHealthScore: true },
    });
    const orders = await this.prisma.order.findMany({
      where: { relationshipId },
      select: { id: true },
    });
    const orderIds = orders.map((o) => o.id);

    const [criticalAlerts, highAlerts, openAlerts, stagnationAlerts] = await Promise.all([
      this.prisma.relationalOperationalAlert.count({
        where: { relationshipId, resolvedAt: null, severity: "CRITICAL" },
      }),
      this.prisma.relationalOperationalAlert.count({
        where: { relationshipId, resolvedAt: null, severity: "HIGH" },
      }),
      this.prisma.relationalOperationalAlert.count({ where: { relationshipId, resolvedAt: null } }),
      this.prisma.relationalOperationalAlert.count({
        where: { relationshipId, resolvedAt: null, alertType: "FULFILLMENT_STAGNATION" },
      }),
    ]);

    const recordIds =
      orderIds.length > 0
        ? (
            await this.prisma.relationalFulfillmentRecord.findMany({
              where: { orderId: { in: orderIds } },
              select: { id: true },
            })
          ).map((r) => r.id)
        : [];

    const [openIncidents, blockingTasks, openCoordinationTasks] = await Promise.all([
      recordIds.length > 0
        ? this.prisma.relationalFulfillmentIncident.count({
            where: { fulfillmentRecordId: { in: recordIds }, resolutionStatus: { not: "RESOLVED" } },
          })
        : 0,
      recordIds.length > 0
        ? this.prisma.relationalFulfillmentTask.count({
            where: {
              fulfillmentRecordId: { in: recordIds },
              blockingFulfillment: true,
              taskStatus: { in: [...OPEN_TASK_STATUSES] },
            },
          })
        : 0,
      recordIds.length > 0
        ? this.prisma.relationalFulfillmentTask.count({
            where: { fulfillmentRecordId: { in: recordIds }, taskStatus: { in: [...OPEN_TASK_STATUSES] } },
          })
        : 0,
    ]);

    const metrics = await this.prisma.relationalOperationalMetric.findMany({
      where: { relationshipId, metricType: "FULFILLMENT_DURATION_HOURS" },
      orderBy: { computedAt: "desc" },
      take: 10,
      select: { metricValue: true },
    });
    const avgFulfillment =
      metrics.length > 0 ? metrics.reduce((s, m) => s + m.metricValue, 0) / metrics.length : null;

    const driftCount = await this.prisma.relationalOperationalDriftSnapshot.count({
      where: {
        relationshipId,
        computedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        deviationPercentage: { gte: PREDICTIVE_RISK_THRESHOLDS.driftDeviationPercent },
      },
    });

    const { score, diagnostics: scoreDiag } = this.policy.computeDeterministicScore({
      openIncidents,
      blockingTasks,
      criticalAlerts,
      highAlerts,
      avgFulfillmentHours: avgFulfillment,
      corridorHealthScore: rel?.corridorHealthScore ?? 50,
      driftCount,
    });

    let collapseBoost = 0;
    if (criticalAlerts >= PREDICTIVE_RISK_THRESHOLDS.collapseCriticalAlerts) collapseBoost += 25;
    if (highAlerts >= PREDICTIVE_RISK_THRESHOLDS.collapseHighAlerts) collapseBoost += 15;
    if (stagnationAlerts > 0) collapseBoost += 10;
    if (openIncidents >= 2) collapseBoost += 10;
    if (blockingTasks >= PREDICTIVE_RISK_THRESHOLDS.blockingTaskAccumulation) collapseBoost += 12;
    if (openCoordinationTasks >= PREDICTIVE_RISK_THRESHOLDS.coordinationSaturationOpenTasks) collapseBoost += 8;

    const corridorCollapseRisk = this.policy.clampScore(score + collapseBoost);
    const operationalFragility = this.policy.clampScore(
      (100 - (rel?.corridorHealthScore ?? 50)) * 0.6 + openAlerts * 4 + driftCount * 5,
    );

    const sustainedOperationalDegradation =
      rel?.corridorState === "DEGRADED" ||
      rel?.corridorState === "BLOCKED" ||
      (criticalAlerts > 0 && stagnationAlerts > 0) ||
      driftCount >= 2;

    return {
      corridorCollapseRisk,
      operationalFragility,
      sustainedOperationalDegradation,
      diagnostics: {
        ...scoreDiag,
        criticalAlerts,
        highAlerts,
        openAlerts,
        stagnationAlerts,
        openIncidents,
        blockingTasks,
        openCoordinationTasks,
        driftCount,
        corridorState: rel?.corridorState,
      },
    };
  }

  highestOpenRiskLevel(
    levels: RelationalPredictiveRiskLevel[],
  ): RelationalPredictiveRiskLevel | null {
    if (levels.includes("CRITICAL")) return "CRITICAL";
    if (levels.includes("HIGH")) return "HIGH";
    if (levels.includes("MEDIUM")) return "MEDIUM";
    if (levels.includes("LOW")) return "LOW";
    return null;
  }
}
