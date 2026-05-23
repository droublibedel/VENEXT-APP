import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type {
  Prisma,
  RelationalOperationalAlertSeverity,
  RelationalOperationalAlertType,
  RelationalOperationalMetricType,
} from "@prisma/client";
import {
  RelationalOperationalAlertListResponseSchema,
  RelationalOperationalAlertResolveRequestSchema,
  RelationalOperationalAlertResolveResponseSchema,
  RelationalOperationalAlertSchema,
  RelationalOperationalMetricListResponseSchema,
  RelationalOperationalMetricSchema,
  type RelationalOperationalAlertDto,
  type RelationalOperationalMetricDto,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalOperationalIntelligencePolicyService, OPERATIONAL_SLA_THRESHOLDS } from "./relational-operational-intelligence-policy.service";
import { RelationalOperationalIntelligenceRealtimeService } from "./relational-operational-intelligence-realtime.service";

const OPEN_TASK_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_EXTERNAL_CONFIRMATION", "WAITING_CORRIDOR_VALIDATION", "BLOCKED"] as const;

@Injectable()
export class RelationalOperationalIntelligenceService {
  private readonly log = new Logger(RelationalOperationalIntelligenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalOperationalIntelligencePolicyService,
    private readonly realtime: RelationalOperationalIntelligenceRealtimeService,
  ) {}

  private toAlertDto(row: {
    id: string;
    relationshipId: string;
    orderId: string | null;
    fulfillmentRecordId: string | null;
    alertType: RelationalOperationalAlertType;
    severity: RelationalOperationalAlertSeverity;
    title: string;
    description: string;
    detectedAt: Date;
    resolvedAt: Date | null;
    resolutionNotes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): RelationalOperationalAlertDto {
    const dto = {
      id: row.id,
      relationshipId: row.relationshipId,
      orderId: row.orderId,
      fulfillmentRecordId: row.fulfillmentRecordId,
      alertType: row.alertType,
      severity: row.severity,
      title: row.title,
      description: row.description,
      detectedAt: row.detectedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      resolutionNotes: row.resolutionNotes,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
    const p = RelationalOperationalAlertSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "operational_alert_contract_invalid" });
    return p.data;
  }

  private toMetricDto(row: {
    id: string;
    relationshipId: string;
    orderId: string | null;
    metricType: RelationalOperationalMetricType;
    metricValue: number;
    computedAt: Date;
    createdAt: Date;
  }): RelationalOperationalMetricDto {
    const dto = {
      id: row.id,
      relationshipId: row.relationshipId,
      orderId: row.orderId,
      metricType: row.metricType,
      metricValue: row.metricValue,
      computedAt: row.computedAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
      createdAt: row.createdAt.toISOString(),
    };
    const p = RelationalOperationalMetricSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "operational_metric_contract_invalid" });
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
      throw new ForbiddenException({ code: "operational_intelligence_not_party" });
    }
    const order = await this.prisma.order.findFirst({
      where: { relationshipId },
      select: { buyerOrganizationId: true, sellerOrganizationId: true },
      orderBy: { createdAt: "desc" },
    });
    if (!order) {
      return {
        buyerOrganizationId: rel.requesterOrganizationId,
        sellerOrganizationId: rel.receiverOrganizationId,
      };
    }
    return { buyerOrganizationId: order.buyerOrganizationId, sellerOrganizationId: order.sellerOrganizationId };
  }

  async persistMetric(input: {
    relationshipId: string;
    orderId?: string | null;
    metricType: RelationalOperationalMetricType;
    metricValue: number;
    metadata?: Prisma.InputJsonValue;
  }): Promise<RelationalOperationalMetricDto> {
    const row = await this.prisma.relationalOperationalMetric.create({
      data: {
        relationshipId: input.relationshipId,
        orderId: input.orderId ?? null,
        metricType: input.metricType,
        metricValue: input.metricValue,
        metadata: input.metadata ?? undefined,
        computedAt: new Date(),
      },
    });
    return this.toMetricDto(row);
  }

  async listAlerts(input: {
    organizationId: string;
    relationshipId?: string;
    unresolvedOnly?: boolean;
  }) {
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

    const rows = await this.prisma.relationalOperationalAlert.findMany({
      where: {
        ...relFilter,
        ...(input.unresolvedOnly ? { resolvedAt: null } : {}),
      },
      orderBy: { detectedAt: "desc" },
      take: 200,
    });

    const dto = { alerts: rows.map((r) => this.toAlertDto(r)) };
    const p = RelationalOperationalAlertListResponseSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "operational_alert_list_invalid" });
    return p.data;
  }

  async listMetrics(input: { organizationId: string; relationshipId: string; limit?: number }) {
    await this.assertPartyOnRelationship(input.organizationId, input.relationshipId);
    const rows = await this.prisma.relationalOperationalMetric.findMany({
      where: { relationshipId: input.relationshipId },
      orderBy: { computedAt: "desc" },
      take: input.limit ?? 200,
    });
    const dto = { metrics: rows.map((r) => this.toMetricDto(r)) };
    const p = RelationalOperationalMetricListResponseSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "operational_metric_list_invalid" });
    return p.data;
  }

  async resolveAlert(input: {
    organizationId: string;
    alertId: string;
    body: unknown;
  }) {
    const parsed = RelationalOperationalAlertResolveRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({ code: "operational_alert_resolve_body_invalid" });
    }

    const existing = await this.prisma.relationalOperationalAlert.findUnique({ where: { id: input.alertId } });
    if (!existing) throw new NotFoundException(input.alertId);
    if (existing.resolvedAt) {
      throw new BadRequestException({ code: "operational_alert_already_resolved" });
    }

    const parties = await this.assertPartyOnRelationship(input.organizationId, existing.relationshipId);

    const updated = await this.prisma.relationalOperationalAlert.update({
      where: { id: input.alertId },
      data: {
        resolvedAt: new Date(),
        resolutionNotes: parsed.data.resolutionNotes,
      },
    });

    const alert = this.toAlertDto(updated);
    const response = RelationalOperationalAlertResolveResponseSchema.parse({
      alert,
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });

    void this.realtime
      .publishBothSides({
        buyerOrganizationId: parties.buyerOrganizationId,
        sellerOrganizationId: parties.sellerOrganizationId,
        alertId: alert.id,
        relationshipId: alert.relationshipId,
        severity: alert.severity,
        alertType: alert.alertType,
        realtimeEventType: "relational.operational.alert_resolved",
      })
      .catch((err) => this.log.warn(`operational alert_resolved realtime failed: ${String(err)}`));

    return response;
  }

  async createAlertIfAbsent(input: {
    relationshipId: string;
    orderId?: string | null;
    fulfillmentRecordId?: string | null;
    alertType: RelationalOperationalAlertType;
    severity: RelationalOperationalAlertSeverity;
    title: string;
    description: string;
    diagnostics?: Prisma.InputJsonValue;
    realtimeEventType?: "relational.operational.alert_created" | "relational.operational.sla_degradation_detected" | "relational.operational.corridor_risk_detected";
  }): Promise<RelationalOperationalAlertDto | null> {
    const open = await this.prisma.relationalOperationalAlert.findFirst({
      where: {
        relationshipId: input.relationshipId,
        alertType: input.alertType,
        resolvedAt: null,
        ...(input.orderId ? { orderId: input.orderId } : {}),
      },
    });
    if (open) return null;

    const row = await this.prisma.relationalOperationalAlert.create({
      data: {
        relationshipId: input.relationshipId,
        orderId: input.orderId ?? null,
        fulfillmentRecordId: input.fulfillmentRecordId ?? null,
        alertType: input.alertType,
        severity: input.severity,
        title: input.title,
        description: input.description,
        diagnostics: input.diagnostics ?? undefined,
      },
    });

    const alert = this.toAlertDto(row);
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
    const parties = orderForParties
      ? {
          buyerOrganizationId: orderForParties.buyerOrganizationId,
          sellerOrganizationId: orderForParties.sellerOrganizationId,
        }
      : null;

    if (parties && input.realtimeEventType) {
      void this.realtime
        .publishBothSides({
          buyerOrganizationId: parties.buyerOrganizationId,
          sellerOrganizationId: parties.sellerOrganizationId,
          alertId: alert.id,
          relationshipId: alert.relationshipId,
          severity: alert.severity,
          alertType: alert.alertType,
          realtimeEventType: input.realtimeEventType,
        })
        .catch((err) => this.log.warn(`operational alert realtime failed: ${String(err)}`));
    }

    return alert;
  }

  /** Instruction 20.12 — anomaly detection from persisted Prisma timestamps. */
  async analyzeCorridor(relationshipId: string): Promise<void> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: {
        id: true,
        corridorState: true,
        corridorHealthScore: true,
        status: true,
      },
    });
    if (!rel) return;
    if (!this.policy.allowsHistoricalCorridorObservation(rel.corridorState)) return;

    const t = OPERATIONAL_SLA_THRESHOLDS;
    const now = new Date();

    if (rel.corridorState === "DEGRADED" || rel.corridorHealthScore < 45) {
      await this.createAlertIfAbsent({
        relationshipId,
        alertType: "CORRIDOR_OPERATIONAL_DEGRADATION",
        severity: rel.corridorState === "DEGRADED" ? "HIGH" : "WARNING",
        title: "Dégradation opérationnelle corridor",
        description: "Signal de dérive corridor — gouvernance et exécution à surveiller (intelligence interne, pas notation publique).",
        diagnostics: { corridorState: rel.corridorState, corridorHealthScore: rel.corridorHealthScore },
        realtimeEventType: "relational.operational.corridor_risk_detected",
      });
    }

    const orders = await this.prisma.order.findMany({
      where: { relationshipId },
      select: { id: true },
    });
    const orderIds = orders.map((o) => o.id);

    const sinceIncidents = new Date(now.getTime() - t.incidentPatternDays * 24 * 60 * 60 * 1000);
    const incidentCount =
      orderIds.length > 0
        ? await this.prisma.relationalFulfillmentIncident.count({
            where: {
              fulfillmentRecord: { orderId: { in: orderIds } },
              createdAt: { gte: sinceIncidents },
            },
          })
        : 0;
    if (incidentCount >= t.incidentPatternCount) {
      await this.createAlertIfAbsent({
        relationshipId,
        alertType: "REPEATED_INCIDENT_PATTERN",
        severity: "HIGH",
        title: "Motif incidents répétés",
        description: `${incidentCount} incidents fulfillment sur la fenêtre corridor — risque opérationnel relationnel.`,
        diagnostics: { incidentCount, windowDays: t.incidentPatternDays },
        realtimeEventType: "relational.operational.corridor_risk_detected",
      });
    }

    const records =
      orderIds.length > 0
        ? await this.prisma.relationalFulfillmentRecord.findMany({
            where: { orderId: { in: orderIds } },
          })
        : [];

    for (const record of records) {
      if (record.fulfillmentStatus !== "FULFILLMENT_COMPLETED") {
        const stagnationHours = this.policy.hoursBetween(record.createdAt, now);
        if (stagnationHours >= t.fulfillmentStagnationHours) {
          await this.createAlertIfAbsent({
            relationshipId,
            orderId: record.orderId,
            fulfillmentRecordId: record.id,
            alertType: "FULFILLMENT_STAGNATION",
            severity: "WARNING",
            title: "Stagnation fulfillment corridor",
            description: `Fulfillment non clôturé depuis ${Math.round(stagnationHours)}h — alignement exécution requis.`,
            diagnostics: { stagnationHours, fulfillmentStatus: record.fulfillmentStatus },
            realtimeEventType: "relational.operational.sla_degradation_detected",
          });
        }
      }

      if (record.proofRequired && !record.proofValidated && !record.receptionValidatedAt) {
        const proofDelay = this.policy.hoursBetween(record.createdAt, now);
        if (proofDelay >= t.proofValidationDelayHours) {
          await this.createAlertIfAbsent({
            relationshipId,
            orderId: record.orderId,
            fulfillmentRecordId: record.id,
            alertType: "PROOF_VALIDATION_DELAY",
            severity: "WARNING",
            title: "Retard validation preuve réception",
            description: `Preuve requise non validée après ${Math.round(proofDelay)}h.`,
            diagnostics: { proofDelayHours: proofDelay },
            realtimeEventType: "relational.operational.sla_degradation_detected",
          });
        }
      }

      const blockingOld = await this.prisma.relationalFulfillmentTask.findMany({
        where: {
          fulfillmentRecordId: record.id,
          blockingFulfillment: true,
          taskStatus: { in: [...OPEN_TASK_STATUSES] },
        },
      });
      for (const task of blockingOld) {
        const age = this.policy.hoursBetween(task.createdAt, now);
        if (age >= t.blockingTaskAgeHours) {
          await this.createAlertIfAbsent({
            relationshipId,
            orderId: record.orderId,
            fulfillmentRecordId: record.id,
            alertType: "UNRESOLVED_BLOCKING_TASKS",
            severity: "HIGH",
            title: "Tâche bloquante non résolue",
            description: `Tâche corridor bloquante ouverte depuis ${Math.round(age)}h.`,
            diagnostics: { taskId: task.id, ageHours: age },
            realtimeEventType: "relational.operational.alert_created",
          });
        }
      }

      const openTasks = await this.prisma.relationalFulfillmentTask.count({
        where: {
          fulfillmentRecordId: record.id,
          taskStatus: { in: [...OPEN_TASK_STATUSES] },
        },
      });
      if (openTasks >= t.coordinationOverloadOpenTasks) {
        await this.createAlertIfAbsent({
          relationshipId,
          orderId: record.orderId,
          fulfillmentRecordId: record.id,
          alertType: "COORDINATION_OVERLOAD",
          severity: "WARNING",
          title: "Saturation coordination opérationnelle",
          description: `${openTasks} tâches ouvertes — charge coordination corridor élevée.`,
          diagnostics: { openTasks },
          realtimeEventType: "relational.operational.corridor_risk_detected",
        });
      }

      const rejections = await this.prisma.relationalFulfillmentIncident.count({
        where: {
          fulfillmentRecordId: record.id,
          incidentType: { in: ["PARTIAL_RECEPTION", "QUANTITY_MISMATCH", "DAMAGED_GOODS"] },
          createdAt: { gte: sinceIncidents },
        },
      });
      if (rejections >= 2) {
        await this.createAlertIfAbsent({
          relationshipId,
          orderId: record.orderId,
          fulfillmentRecordId: record.id,
          alertType: "REPEATED_RECEPTION_REJECTION",
          severity: "HIGH",
          title: "Rejets réception répétés",
          description: "Motif de rejets / litiges réception récurrent sur le corridor.",
          diagnostics: { rejections },
          realtimeEventType: "relational.operational.corridor_risk_detected",
        });
      }
    }

    const executionEvents = await this.prisma.relationalOrderExecutionEvent.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "asc" },
      take: 2,
    });
    if (executionEvents.length >= 2) {
      const latency = this.policy.hoursBetween(executionEvents[0]!.createdAt, now);
      if (latency >= t.executionLatencyHours) {
        await this.createAlertIfAbsent({
          relationshipId,
          alertType: "EXECUTION_LATENCY_ANOMALY",
          severity: "HIGH",
          title: "Latence exécution anormale",
          description: `Exécution corridor lente (${Math.round(latency)}h depuis premier événement).`,
          diagnostics: { latencyHours: latency },
          realtimeEventType: "relational.operational.sla_degradation_detected",
        });
      }
    }
  }
}
