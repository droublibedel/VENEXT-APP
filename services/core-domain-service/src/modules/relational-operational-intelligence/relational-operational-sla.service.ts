import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalOperationalRiskOverviewSchema,
  RelationalOperationalSlaSnapshotSchema,
  type RelationalOperationalRiskOverviewDto,
  type RelationalOperationalSlaSnapshotDto,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalOperationalIntelligencePolicyService } from "./relational-operational-intelligence-policy.service";

const OPEN_TASK_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_EXTERNAL_CONFIRMATION", "WAITING_CORRIDOR_VALIDATION", "BLOCKED"] as const;

@Injectable()
export class RelationalOperationalSlaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalOperationalIntelligencePolicyService,
  ) {}

  async buildSlaSnapshot(relationshipId: string): Promise<RelationalOperationalSlaSnapshotDto> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: {
        id: true,
        corridorState: true,
        corridorHealthScore: true,
        requesterOrganizationId: true,
        receiverOrganizationId: true,
      },
    });
    if (!rel) throw new NotFoundException(relationshipId);

    const [openAlerts, criticalAlerts, metrics, orders] = await Promise.all([
      this.prisma.relationalOperationalAlert.count({
        where: { relationshipId, resolvedAt: null },
      }),
      this.prisma.relationalOperationalAlert.count({
        where: { relationshipId, resolvedAt: null, severity: "CRITICAL" },
      }),
      this.prisma.relationalOperationalMetric.findMany({
        where: { relationshipId },
        orderBy: { computedAt: "desc" },
        take: 200,
        select: { metricType: true, metricValue: true },
      }),
      this.prisma.order.findMany({
        where: { relationshipId },
        select: { id: true },
      }),
    ]);

    const orderIds = orders.map((o) => o.id);
    const fulfillmentRecords =
      orderIds.length > 0
        ? await this.prisma.relationalFulfillmentRecord.findMany({
            where: { orderId: { in: orderIds } },
            select: { id: true },
          })
        : [];
    const recordIds = fulfillmentRecords.map((r) => r.id);

    const [blockingTasks, openIncidents, openCoordinationTasks] = await Promise.all([
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
        ? this.prisma.relationalFulfillmentIncident.count({
            where: {
              fulfillmentRecordId: { in: recordIds },
              resolutionStatus: { not: "RESOLVED" },
            },
          })
        : 0,
      recordIds.length > 0
        ? this.prisma.relationalFulfillmentTask.count({
            where: {
              fulfillmentRecordId: { in: recordIds },
              taskStatus: { in: [...OPEN_TASK_STATUSES] },
            },
          })
        : 0,
    ]);

    const fulfillmentDurations = metrics
      .filter((m) => m.metricType === "FULFILLMENT_DURATION_HOURS")
      .map((m) => m.metricValue);
    const receptionDelays = metrics
      .filter((m) => m.metricType === "RECEPTION_VALIDATION_DELAY_HOURS")
      .map((m) => m.metricValue);

    const avg = (vals: number[]) => (vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null);

    const corridorOperationalHealth = this.policy.computeCorridorOperationalHealth({
      corridorState: rel.corridorState,
      corridorHealthScore: rel.corridorHealthScore,
      openAlerts,
      criticalAlerts,
    });

    const dto = {
      relationshipId: rel.id,
      corridorOperationalHealth,
      corridorState: rel.corridorState,
      activeBlockingTasks: blockingTasks,
      activeIncidentCount: openIncidents,
      averageFulfillmentDurationHours: avg(fulfillmentDurations),
      averageReceptionValidationDelayHours: avg(receptionDelays),
      openOperationalAlerts: openAlerts,
      criticalAlertsCount: criticalAlerts,
      coordinationOpenTasks: openCoordinationTasks,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalOperationalSlaSnapshotSchema.safeParse(dto);
    if (!parsed.success) {
      throw new Error("relational_operational_sla_snapshot_contract_invalid");
    }
    return parsed.data;
  }

  async buildRiskOverview(relationshipId: string): Promise<RelationalOperationalRiskOverviewDto> {
    const snapshot = await this.buildSlaSnapshot(relationshipId);
    const grouped = await this.prisma.relationalOperationalAlert.groupBy({
      by: ["alertType", "severity"],
      where: { relationshipId, resolvedAt: null },
      _count: { _all: true },
    });

    const riskSignals = grouped.map((g) => ({
      alertType: g.alertType,
      severity: g.severity,
      count: g._count._all,
    }));

    const dto = {
      relationshipId,
      corridorOperationalHealth: snapshot.corridorOperationalHealth,
      riskSignals,
      openAlerts: snapshot.openOperationalAlerts,
      criticalAlerts: snapshot.criticalAlertsCount,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalOperationalRiskOverviewSchema.safeParse(dto);
    if (!parsed.success) {
      throw new Error("relational_operational_risk_overview_contract_invalid");
    }
    return parsed.data;
  }

  async averageMetricHours(
    tx: Prisma.TransactionClient | PrismaService,
    relationshipId: string,
    metricType: import("@prisma/client").RelationalOperationalMetricType,
  ): Promise<number | null> {
    const rows = await tx.relationalOperationalMetric.findMany({
      where: { relationshipId, metricType },
      orderBy: { computedAt: "desc" },
      take: 50,
      select: { metricValue: true },
    });
    if (rows.length === 0) return null;
    return rows.reduce((s, r) => s + r.metricValue, 0) / rows.length;
  }
}
