import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type {
  Prisma,
  RelationalOperationalDriftType,
  RelationalOperationalMetricType,
  RelationalPredictiveRiskLevel,
  RelationalPredictiveRiskType,
} from "@prisma/client";
import {
  RelationalOperationalDriftListResponseSchema,
  RelationalOperationalDriftSnapshotSchema,
  RelationalPredictiveOverviewSchema,
  RelationalPredictiveRiskResolveRequestSchema,
  RelationalPredictiveRiskResolveResponseSchema,
  RelationalPredictiveRiskSignalListResponseSchema,
  RelationalPredictiveRiskSignalSchema,
  type RelationalOperationalDriftSnapshotDto,
  type RelationalPredictiveRealtimeEventType,
  type RelationalPredictiveRiskSignalDto,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalOperationalCollapseService } from "./relational-operational-collapse.service";
import {
  PREDICTIVE_RISK_THRESHOLDS,
  RelationalPredictiveRiskPolicyService,
} from "./relational-predictive-risk-policy.service";
import { RelationalPredictiveRiskRealtimeService } from "./relational-predictive-risk-realtime.service";

const OPEN_TASK_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_EXTERNAL_CONFIRMATION", "WAITING_CORRIDOR_VALIDATION", "BLOCKED"] as const;

const METRIC_TO_DRIFT: Partial<Record<RelationalOperationalMetricType, RelationalOperationalDriftType>> = {
  EXECUTION_DURATION_HOURS: "EXECUTION_SLOWDOWN",
  FULFILLMENT_DURATION_HOURS: "FULFILLMENT_SLOWDOWN",
  INCIDENT_RESOLUTION_DURATION_HOURS: "INCIDENT_ACCELERATION",
  BUYER_CONFIRMATION_DELAY_HOURS: "CONFIRMATION_LATENCY_INCREASE",
  SELLER_CONFIRMATION_DELAY_HOURS: "CONFIRMATION_LATENCY_INCREASE",
};

@Injectable()
export class RelationalPredictiveRiskService {
  private readonly log = new Logger(RelationalPredictiveRiskService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalPredictiveRiskPolicyService,
    private readonly collapse: RelationalOperationalCollapseService,
    private readonly realtime: RelationalPredictiveRiskRealtimeService,
  ) {}

  private toSignalDto(row: {
    id: string;
    relationshipId: string;
    orderId: string | null;
    riskType: RelationalPredictiveRiskType;
    riskLevel: RelationalPredictiveRiskLevel;
    driftType: RelationalOperationalDriftType | null;
    title: string;
    description: string;
    signalScore: number;
    confidenceLevel: number;
    detectedAt: Date;
    resolvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): RelationalPredictiveRiskSignalDto {
    const dto = {
      id: row.id,
      relationshipId: row.relationshipId,
      orderId: row.orderId,
      riskType: row.riskType,
      riskLevel: row.riskLevel,
      driftType: row.driftType,
      title: row.title,
      description: row.description,
      signalScore: row.signalScore,
      confidenceLevel: row.confidenceLevel,
      detectedAt: row.detectedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
    const p = RelationalPredictiveRiskSignalSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "predictive_risk_signal_contract_invalid" });
    return p.data;
  }

  private toDriftDto(row: {
    id: string;
    relationshipId: string;
    driftType: RelationalOperationalDriftType;
    baselineMetric: number;
    currentMetric: number;
    deviationPercentage: number;
    computedAt: Date;
    createdAt: Date;
  }): RelationalOperationalDriftSnapshotDto {
    const dto = {
      id: row.id,
      relationshipId: row.relationshipId,
      driftType: row.driftType,
      baselineMetric: row.baselineMetric,
      currentMetric: row.currentMetric,
      deviationPercentage: row.deviationPercentage,
      computedAt: row.computedAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
      createdAt: row.createdAt.toISOString(),
    };
    const p = RelationalOperationalDriftSnapshotSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "predictive_drift_snapshot_contract_invalid" });
    return p.data;
  }

  async assertPartyOnRelationship(organizationId: string, relationshipId: string): Promise<{
    buyerOrganizationId: string;
    sellerOrganizationId: string;
  }> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: {
        requesterOrganizationId: true,
        receiverOrganizationId: true,
        upstreamOrganizationId: true,
        downstreamOrganizationId: true,
      },
    });
    if (!rel) throw new NotFoundException(relationshipId);
    const parties = new Set(
      [rel.requesterOrganizationId, rel.receiverOrganizationId, rel.upstreamOrganizationId, rel.downstreamOrganizationId].filter(
        Boolean,
      ) as string[],
    );
    if (!parties.has(organizationId)) {
      throw new ForbiddenException({ code: "predictive_risk_not_party" });
    }
    const order = await this.prisma.order.findFirst({
      where: { relationshipId },
      select: { buyerOrganizationId: true, sellerOrganizationId: true },
      orderBy: { createdAt: "desc" },
    });
    if (!order) {
      return { buyerOrganizationId: rel.requesterOrganizationId, sellerOrganizationId: rel.receiverOrganizationId };
    }
    return { buyerOrganizationId: order.buyerOrganizationId, sellerOrganizationId: order.sellerOrganizationId };
  }

  async persistDriftSnapshot(input: {
    relationshipId: string;
    driftType: RelationalOperationalDriftType;
    baselineMetric: number;
    currentMetric: number;
    metadata?: Prisma.InputJsonValue;
  }): Promise<RelationalOperationalDriftSnapshotDto> {
    const deviationPercentage = this.policy.deviationPercent(input.baselineMetric, input.currentMetric);
    const row = await this.prisma.relationalOperationalDriftSnapshot.create({
      data: {
        relationshipId: input.relationshipId,
        driftType: input.driftType,
        baselineMetric: input.baselineMetric,
        currentMetric: input.currentMetric,
        deviationPercentage,
        metadata: input.metadata ?? undefined,
      },
    });
    return this.toDriftDto(row);
  }

  async createRiskSignalIfAbsent(input: {
    relationshipId: string;
    orderId?: string | null;
    riskType: RelationalPredictiveRiskType;
    riskLevel: RelationalPredictiveRiskLevel;
    driftType?: RelationalOperationalDriftType | null;
    title: string;
    description: string;
    signalScore: number;
    confidenceLevel: number;
    diagnostics?: Prisma.InputJsonValue;
    realtimeEventType?: RelationalPredictiveRealtimeEventType;
  }): Promise<RelationalPredictiveRiskSignalDto | null> {
    const open = await this.prisma.relationalPredictiveRiskSignal.findFirst({
      where: {
        relationshipId: input.relationshipId,
        riskType: input.riskType,
        resolvedAt: null,
        ...(input.orderId ? { orderId: input.orderId } : {}),
      },
    });
    if (open) return null;

    const row = await this.prisma.relationalPredictiveRiskSignal.create({
      data: {
        relationshipId: input.relationshipId,
        orderId: input.orderId ?? null,
        riskType: input.riskType,
        riskLevel: input.riskLevel,
        driftType: input.driftType ?? null,
        title: input.title,
        description: input.description,
        signalScore: this.policy.clampScore(input.signalScore),
        confidenceLevel: Math.min(1, Math.max(0, input.confidenceLevel)),
        diagnostics: input.diagnostics ?? undefined,
      },
    });

    const signal = this.toSignalDto(row);
    const orderForParties = input.orderId
      ? await this.prisma.order.findUnique({
          where: { id: input.orderId },
          select: { buyerOrganizationId: true, sellerOrganizationId: true },
        })
      : await this.prisma.order.findFirst({
          where: { relationshipId: input.relationshipId },
          select: { buyerOrganizationId: true, sellerOrganizationId: true },
          orderBy: { createdAt: "desc" },
        });

    if (orderForParties && input.realtimeEventType) {
      void this.realtime
        .publishBothSides({
          buyerOrganizationId: orderForParties.buyerOrganizationId,
          sellerOrganizationId: orderForParties.sellerOrganizationId,
          riskSignalId: signal.id,
          relationshipId: signal.relationshipId,
          riskLevel: signal.riskLevel,
          riskType: signal.riskType,
          realtimeEventType: input.realtimeEventType,
        })
        .catch((err) => this.log.warn(`predictive realtime failed: ${String(err)}`));
    }

    return signal;
  }

  private async avgMetric(relationshipId: string, metricType: RelationalOperationalMetricType, take: number, skip: number) {
    const rows = await this.prisma.relationalOperationalMetric.findMany({
      where: { relationshipId, metricType },
      orderBy: { computedAt: "desc" },
      take,
      skip,
      select: { metricValue: true },
    });
    if (rows.length === 0) return null;
    return rows.reduce((s, r) => s + r.metricValue, 0) / rows.length;
  }

  /** Instruction 20.13 — deterministic drift + risk from operational sources only. */
  async analyzeCorridor(relationshipId: string): Promise<void> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { corridorState: true, corridorHealthScore: true },
    });
    if (!rel || !this.policy.allowsHistoricalCorridorObservation(rel.corridorState)) return;

    const metricTypes: RelationalOperationalMetricType[] = [
      "EXECUTION_DURATION_HOURS",
      "FULFILLMENT_DURATION_HOURS",
      "INCIDENT_RESOLUTION_DURATION_HOURS",
      "BUYER_CONFIRMATION_DELAY_HOURS",
      "SELLER_CONFIRMATION_DELAY_HOURS",
    ];

    for (const metricType of metricTypes) {
      const recent = await this.avgMetric(relationshipId, metricType, 5, 0);
      const baseline = await this.avgMetric(relationshipId, metricType, 10, 5);
      if (recent == null || baseline == null) continue;
      const deviation = this.policy.deviationPercent(baseline, recent);
      const driftType = METRIC_TO_DRIFT[metricType];
      if (!driftType) continue;
      if (deviation >= PREDICTIVE_RISK_THRESHOLDS.driftDeviationPercent) {
        await this.persistDriftSnapshot({
          relationshipId,
          driftType,
          baselineMetric: baseline,
          currentMetric: recent,
          metadata: { metricType, deviation },
        });
        await this.createRiskSignalIfAbsent({
          relationshipId,
          riskType: "OPERATIONAL_DRIFT_DETECTED",
          riskLevel: this.policy.levelFromScore(Math.min(100, deviation)),
          driftType,
          title: `Dérive opérationnelle — ${driftType}`,
          description: `Écart ${deviation}% vs baseline corridor (${metricType}). Signal déterministe interne.`,
          signalScore: this.policy.clampScore(deviation),
          confidenceLevel: this.policy.confidenceFromSampleSize(10),
          diagnostics: { metricType, baseline, recent, deviation },
          realtimeEventType: "relational.predictive.operational_drift_detected",
        });
      }
    }

    const orders = await this.prisma.order.findMany({ where: { relationshipId }, select: { id: true } });
    const orderIds = orders.map((o) => o.id);
    const since = new Date(Date.now() - PREDICTIVE_RISK_THRESHOLDS.incidentEscalationWindowDays * 24 * 60 * 60 * 1000);

    const incidentCount =
      orderIds.length > 0
        ? await this.prisma.relationalFulfillmentIncident.count({
            where: { fulfillmentRecord: { orderId: { in: orderIds } }, createdAt: { gte: since } },
          })
        : 0;

    if (incidentCount >= PREDICTIVE_RISK_THRESHOLDS.incidentEscalationCount) {
      await this.createRiskSignalIfAbsent({
        relationshipId,
        riskType: "INCIDENT_ESCALATION_RISK",
        riskLevel: "HIGH",
        title: "Risque escalade incidents",
        description: `${incidentCount} incidents sur fenêtre corridor — probabilité dégradation opérationnelle.`,
        signalScore: this.policy.clampScore(incidentCount * 12),
        confidenceLevel: this.policy.confidenceFromSampleSize(incidentCount),
        diagnostics: { incidentCount },
        realtimeEventType: "relational.predictive.risk_detected",
      });
    }

    const recordIds =
      orderIds.length > 0
        ? (await this.prisma.relationalFulfillmentRecord.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } })).map(
            (r) => r.id,
          )
        : [];

    const blockingTasks =
      recordIds.length > 0
        ? await this.prisma.relationalFulfillmentTask.count({
            where: {
              fulfillmentRecordId: { in: recordIds },
              blockingFulfillment: true,
              taskStatus: { in: [...OPEN_TASK_STATUSES] },
            },
          })
        : 0;

    if (blockingTasks >= PREDICTIVE_RISK_THRESHOLDS.blockingTaskAccumulation) {
      await this.createRiskSignalIfAbsent({
        relationshipId,
        riskType: "BLOCKING_TASK_ACCUMULATION",
        riskLevel: "HIGH",
        title: "Accumulation tâches bloquantes",
        description: `${blockingTasks} tâches bloquantes ouvertes — risque blocage fulfillment.`,
        signalScore: this.policy.clampScore(blockingTasks * 18),
        confidenceLevel: 0.85,
        realtimeEventType: "relational.predictive.risk_detected",
      });
    }

    const openTasks =
      recordIds.length > 0
        ? await this.prisma.relationalFulfillmentTask.count({
            where: { fulfillmentRecordId: { in: recordIds }, taskStatus: { in: [...OPEN_TASK_STATUSES] } },
          })
        : 0;

    if (openTasks >= PREDICTIVE_RISK_THRESHOLDS.coordinationSaturationOpenTasks) {
      await this.createRiskSignalIfAbsent({
        relationshipId,
        riskType: "COORDINATION_SATURATION_RISK",
        riskLevel: "MEDIUM",
        title: "Saturation coordination prévisible",
        description: `${openTasks} tâches ouvertes — charge coordination corridor élevée.`,
        signalScore: this.policy.clampScore(openTasks * 10),
        confidenceLevel: 0.8,
        realtimeEventType: "relational.predictive.risk_detected",
      });
    }

    if (rel.corridorState === "DEGRADED" || rel.corridorHealthScore < 45) {
      await this.createRiskSignalIfAbsent({
        relationshipId,
        riskType: "CORRIDOR_INSTABILITY_RISK",
        riskLevel: rel.corridorState === "DEGRADED" ? "HIGH" : "MEDIUM",
        title: "Instabilité corridor",
        description: "Corridor fragile — dégradation gouvernance ou santé opérationnelle.",
        signalScore: this.policy.clampScore(100 - rel.corridorHealthScore),
        confidenceLevel: 0.88,
        driftType: "CORRIDOR_STABILITY_DECREASE",
        realtimeEventType: "relational.predictive.risk_detected",
      });
    }

    const degradationSignals = await this.prisma.relationalPredictiveRiskSignal.count({
      where: {
        relationshipId,
        riskType: { in: ["CORRIDOR_INSTABILITY_RISK", "OPERATIONAL_DRIFT_DETECTED", "REPEATED_DEGRADATION_PATTERN"] },
        detectedAt: { gte: since },
      },
    });
    if (degradationSignals >= PREDICTIVE_RISK_THRESHOLDS.repeatedDegradationSignals) {
      await this.createRiskSignalIfAbsent({
        relationshipId,
        riskType: "REPEATED_DEGRADATION_PATTERN",
        riskLevel: "CRITICAL",
        title: "Motif dégradation répétée",
        description: "Signaux de dérive récurrents sur le corridor — vigilance opérationnelle renforcée.",
        signalScore: 85,
        confidenceLevel: 0.9,
        realtimeEventType: "relational.predictive.risk_detected",
      });
    }

    const collapse = await this.collapse.assessCorridor(relationshipId);
    if (collapse.corridorCollapseRisk >= 70) {
      await this.createRiskSignalIfAbsent({
        relationshipId,
        riskType: "SLA_COLLAPSE_RISK",
        riskLevel: collapse.corridorCollapseRisk >= 85 ? "CRITICAL" : "HIGH",
        title: "Risque effondrement SLA",
        description: `Indice collapse ${collapse.corridorCollapseRisk}/100 — alertes critiques et blocages cumulés.`,
        signalScore: collapse.corridorCollapseRisk,
        confidenceLevel: 0.91,
        diagnostics: collapse.diagnostics as Prisma.InputJsonValue,
        realtimeEventType: "relational.predictive.sla_collapse_warning",
      });
    }

    const executionAvg = await this.avgMetric(relationshipId, "EXECUTION_DURATION_HOURS", 5, 0);
    if (executionAvg != null && executionAvg >= PREDICTIVE_RISK_THRESHOLDS.fulfillmentDelayHours * 2) {
      await this.createRiskSignalIfAbsent({
        relationshipId,
        riskType: "EXECUTION_BREAKDOWN_RISK",
        riskLevel: "HIGH",
        title: "Risque rupture exécution",
        description: `Latence exécution corridor ${Math.round(executionAvg)}h — signal déterministe de fragilité.`,
        signalScore: this.policy.clampScore(executionAvg / 2),
        confidenceLevel: this.policy.confidenceFromSampleSize(5),
        driftType: "EXECUTION_SLOWDOWN",
        realtimeEventType: "relational.predictive.risk_detected",
      });
    }

    const fulfillmentAvg = await this.avgMetric(relationshipId, "FULFILLMENT_DURATION_HOURS", 5, 0);
    if (fulfillmentAvg != null && fulfillmentAvg >= PREDICTIVE_RISK_THRESHOLDS.fulfillmentDelayHours) {
      await this.createRiskSignalIfAbsent({
        relationshipId,
        riskType: "FULFILLMENT_DELAY_PROBABILITY",
        riskLevel: "MEDIUM",
        title: "Probabilité retard fulfillment",
        description: `Durée fulfillment moyenne ${Math.round(fulfillmentAvg)}h — dépassement seuil corridor.`,
        signalScore: this.policy.clampScore((fulfillmentAvg / PREDICTIVE_RISK_THRESHOLDS.fulfillmentDelayHours) * 50),
        confidenceLevel: this.policy.confidenceFromSampleSize(5),
        driftType: "FULFILLMENT_SLOWDOWN",
        realtimeEventType: "relational.predictive.risk_detected",
      });
    }

    const rejections =
      recordIds.length > 0
        ? await this.prisma.relationalFulfillmentIncident.count({
            where: {
              fulfillmentRecordId: { in: recordIds },
              incidentType: { in: ["PARTIAL_RECEPTION", "QUANTITY_MISMATCH", "DAMAGED_GOODS"] },
              createdAt: { gte: since },
            },
          })
        : 0;
    if (rejections >= 2) {
      await this.createRiskSignalIfAbsent({
        relationshipId,
        riskType: "RECEPTION_REJECTION_RISK",
        riskLevel: "HIGH",
        title: "Risque rejet réception",
        description: "Motif litiges réception récurrent — probabilité nouvelle impasse.",
        signalScore: this.policy.clampScore(rejections * 22),
        confidenceLevel: 0.75,
        realtimeEventType: "relational.predictive.risk_detected",
      });
    }
  }

  async listSignals(input: { organizationId: string; relationshipId?: string; unresolvedOnly?: boolean }) {
    if (input.relationshipId) {
      await this.assertPartyOnRelationship(input.organizationId, input.relationshipId);
    }
    const relFilter = input.relationshipId
      ? { relationshipId: input.relationshipId }
      : {
          relationship: {
            OR: [
              { requesterOrganizationId: input.organizationId },
              { receiverOrganizationId: input.organizationId },
              { upstreamOrganizationId: input.organizationId },
              { downstreamOrganizationId: input.organizationId },
            ],
          },
        };
    const rows = await this.prisma.relationalPredictiveRiskSignal.findMany({
      where: { ...relFilter, ...(input.unresolvedOnly ? { resolvedAt: null } : {}) },
      orderBy: { detectedAt: "desc" },
      take: 200,
    });
    const dto = { signals: rows.map((r) => this.toSignalDto(r)) };
    const p = RelationalPredictiveRiskSignalListResponseSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "predictive_risk_list_invalid" });
    return p.data;
  }

  async listDrift(relationshipId: string, organizationId: string) {
    await this.assertPartyOnRelationship(organizationId, relationshipId);
    const rows = await this.prisma.relationalOperationalDriftSnapshot.findMany({
      where: { relationshipId },
      orderBy: { computedAt: "desc" },
      take: 100,
    });
    const dto = { snapshots: rows.map((r) => this.toDriftDto(r)) };
    const p = RelationalOperationalDriftListResponseSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "predictive_drift_list_invalid" });
    return p.data;
  }

  async buildOverview(relationshipId: string, organizationId: string) {
    await this.assertPartyOnRelationship(organizationId, relationshipId);
    const collapse = await this.collapse.assessCorridor(relationshipId);
    const openSignals = await this.prisma.relationalPredictiveRiskSignal.findMany({
      where: { relationshipId, resolvedAt: null },
      select: { riskLevel: true },
    });
    const driftCount = await this.prisma.relationalOperationalDriftSnapshot.count({
      where: {
        relationshipId,
        computedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });
    const criticalRiskSignals = openSignals.filter((s) => s.riskLevel === "CRITICAL").length;
    const dto = {
      relationshipId,
      corridorCollapseRisk: collapse.corridorCollapseRisk,
      operationalFragility: collapse.operationalFragility,
      sustainedOperationalDegradation: collapse.sustainedOperationalDegradation,
      openRiskSignals: openSignals.length,
      criticalRiskSignals,
      activeDriftSnapshots: driftCount,
      highestRiskLevel: this.collapse.highestOpenRiskLevel(openSignals.map((s) => s.riskLevel)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalPredictiveOverviewSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "predictive_overview_invalid" });
    return p.data;
  }

  async resolveSignal(input: { organizationId: string; signalId: string; body: unknown }) {
    const parsed = RelationalPredictiveRiskResolveRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({ code: "predictive_risk_resolve_body_invalid" });
    }
    const existing = await this.prisma.relationalPredictiveRiskSignal.findUnique({ where: { id: input.signalId } });
    if (!existing) throw new NotFoundException(input.signalId);
    if (existing.resolvedAt) {
      throw new BadRequestException({ code: "predictive_risk_already_resolved" });
    }
    const parties = await this.assertPartyOnRelationship(input.organizationId, existing.relationshipId);
    const updated = await this.prisma.relationalPredictiveRiskSignal.update({
      where: { id: input.signalId },
      data: {
        resolvedAt: new Date(),
        metadata: {
          ...((existing.metadata ?? {}) as Record<string, unknown>),
          resolutionNotes: parsed.data.resolutionNotes,
        } as Prisma.InputJsonValue,
      },
    });
    const signal = this.toSignalDto(updated);
    const response = RelationalPredictiveRiskResolveResponseSchema.parse({
      signal,
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    void this.realtime
      .publishBothSides({
        buyerOrganizationId: parties.buyerOrganizationId,
        sellerOrganizationId: parties.sellerOrganizationId,
        riskSignalId: signal.id,
        relationshipId: signal.relationshipId,
        riskLevel: signal.riskLevel,
        riskType: signal.riskType,
        realtimeEventType: "relational.predictive.risk_resolved",
      })
      .catch((err) => this.log.warn(`predictive risk_resolved realtime failed: ${String(err)}`));
    return response;
  }
}
