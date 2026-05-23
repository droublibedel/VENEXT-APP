import { Injectable, Logger } from "@nestjs/common";
import type { RelationalOperationalMetricType } from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import {
  OPERATIONAL_SLA_THRESHOLDS,
  RelationalOperationalIntelligencePolicyService,
} from "./relational-operational-intelligence-policy.service";
import { RelationalPredictiveRiskIngestionService } from "../relational-predictive-risk/relational-predictive-risk-ingestion.service";
import { RelationalOperationalIntelligenceService } from "./relational-operational-intelligence.service";

/** Instruction 20.12 — metric ingestion on fulfillment lifecycle events (no mock data). */
@Injectable()
export class RelationalOperationalIntelligenceIngestionService {
  private readonly log = new Logger(RelationalOperationalIntelligenceIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly policy: RelationalOperationalIntelligencePolicyService,
    private readonly intelligence: RelationalOperationalIntelligenceService,
    private readonly predictiveIngestion: RelationalPredictiveRiskIngestionService,
  ) {}

  private triggerPredictive(relationshipId: string): void {
    void this.predictiveIngestion.recalculateCorridor(relationshipId);
  }

  private async enabledForRelationship(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_operational_intelligence_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_operational_intelligence_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  private async safeIngest(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.log.warn(`operational intelligence ingestion failed: ${String(err)}`);
    }
  }

  async onFulfillmentCompleted(input: { relationshipId: string; orderId: string; fulfillmentRecordId: string }): Promise<void> {
    await this.safeIngest(async () => {
      if (!(await this.enabledForRelationship(input.relationshipId))) return;
      const record = await this.prisma.relationalFulfillmentRecord.findUnique({
        where: { id: input.fulfillmentRecordId },
        select: { createdAt: true, fulfillmentCompletedAt: true },
      });
      if (!record?.fulfillmentCompletedAt) return;
      const hours = this.policy.hoursBetween(record.createdAt, record.fulfillmentCompletedAt);
      await this.intelligence.persistMetric({
        relationshipId: input.relationshipId,
        orderId: input.orderId,
        metricType: "FULFILLMENT_DURATION_HOURS",
        metricValue: hours,
        metadata: { fulfillmentRecordId: input.fulfillmentRecordId },
      });
      const severity = this.policy.severityForMetricHours("FULFILLMENT_DURATION_HOURS", hours);
      if (severity !== "INFO") {
        await this.intelligence.createAlertIfAbsent({
          relationshipId: input.relationshipId,
          orderId: input.orderId,
          fulfillmentRecordId: input.fulfillmentRecordId,
          alertType: "SLA_DELAY_RISK",
          severity,
          title: "Risque délai fulfillment",
          description: `Durée fulfillment ${Math.round(hours)}h — signal SLA corridor.`,
          diagnostics: { hours, metricType: "FULFILLMENT_DURATION_HOURS" },
          realtimeEventType: "relational.operational.sla_degradation_detected",
        });
      }
      await this.intelligence.analyzeCorridor(input.relationshipId);
      this.triggerPredictive(input.relationshipId);
    });
  }

  async onReceptionValidated(input: { relationshipId: string; orderId: string; fulfillmentRecordId: string }): Promise<void> {
    await this.safeIngest(async () => {
      if (!(await this.enabledForRelationship(input.relationshipId))) return;
      const record = await this.prisma.relationalFulfillmentRecord.findUnique({
        where: { id: input.fulfillmentRecordId },
        select: { createdAt: true, receptionValidatedAt: true },
      });
      if (!record?.receptionValidatedAt) return;
      const hours = this.policy.hoursBetween(record.createdAt, record.receptionValidatedAt);
      await this.intelligence.persistMetric({
        relationshipId: input.relationshipId,
        orderId: input.orderId,
        metricType: "RECEPTION_VALIDATION_DELAY_HOURS",
        metricValue: hours,
        metadata: { fulfillmentRecordId: input.fulfillmentRecordId },
      });
      await this.intelligence.analyzeCorridor(input.relationshipId);
      this.triggerPredictive(input.relationshipId);
    });
  }

  async onIncidentResolved(input: {
    relationshipId: string;
    orderId: string;
    fulfillmentRecordId: string;
    incidentId: string;
  }): Promise<void> {
    await this.safeIngest(async () => {
      if (!(await this.enabledForRelationship(input.relationshipId))) return;
      const incident = await this.prisma.relationalFulfillmentIncident.findUnique({
        where: { id: input.incidentId },
        select: { createdAt: true, resolvedAt: true },
      });
      if (!incident?.resolvedAt) return;
      const hours = this.policy.hoursBetween(incident.createdAt, incident.resolvedAt);
      await this.intelligence.persistMetric({
        relationshipId: input.relationshipId,
        orderId: input.orderId,
        metricType: "INCIDENT_RESOLUTION_DURATION_HOURS",
        metricValue: hours,
        metadata: { incidentId: input.incidentId },
      });
      await this.intelligence.analyzeCorridor(input.relationshipId);
      this.triggerPredictive(input.relationshipId);
    });
  }

  async onTaskCompleted(input: {
    relationshipId: string;
    orderId: string;
    taskId: string;
  }): Promise<void> {
    await this.safeIngest(async () => {
      if (!(await this.enabledForRelationship(input.relationshipId))) return;
      const task = await this.prisma.relationalFulfillmentTask.findUnique({
        where: { id: input.taskId },
        select: {
          createdAt: true,
          completedAt: true,
          buyerConfirmedAt: true,
          sellerConfirmedAt: true,
          requiresBuyerConfirmation: true,
          requiresSellerConfirmation: true,
        },
      });
      if (!task?.completedAt) return;
      const hours = this.policy.hoursBetween(task.createdAt, task.completedAt);
      await this.intelligence.persistMetric({
        relationshipId: input.relationshipId,
        orderId: input.orderId,
        metricType: "TASK_COMPLETION_DURATION_HOURS",
        metricValue: hours,
        metadata: { taskId: input.taskId },
      });

      if (task.requiresBuyerConfirmation && task.buyerConfirmedAt) {
        const buyerDelay = this.policy.hoursBetween(task.createdAt, task.buyerConfirmedAt);
        await this.intelligence.persistMetric({
          relationshipId: input.relationshipId,
          orderId: input.orderId,
          metricType: "BUYER_CONFIRMATION_DELAY_HOURS",
          metricValue: buyerDelay,
        });
        if (task.requiresSellerConfirmation && task.sellerConfirmedAt) {
          const sellerDelay = this.policy.hoursBetween(task.createdAt, task.sellerConfirmedAt);
          await this.intelligence.persistMetric({
            relationshipId: input.relationshipId,
            orderId: input.orderId,
            metricType: "SELLER_CONFIRMATION_DELAY_HOURS",
            metricValue: sellerDelay,
          });
          const ratio =
            Math.max(buyerDelay, sellerDelay) / Math.max(0.01, Math.min(buyerDelay, sellerDelay));
          if (ratio >= OPERATIONAL_SLA_THRESHOLDS.confirmationImbalanceRatio) {
            await this.intelligence.createAlertIfAbsent({
              relationshipId: input.relationshipId,
              orderId: input.orderId,
              alertType: "UNBALANCED_CONFIRMATION_PATTERN",
              severity: "WARNING",
              title: "Déséquilibre confirmations partenaires",
              description: "Écart significatif entre délais confirmation acheteur / vendeur.",
              diagnostics: { buyerDelayHours: buyerDelay, sellerDelayHours: sellerDelay, ratio },
              realtimeEventType: "relational.operational.corridor_risk_detected",
            });
          }
        }
      }

      await this.intelligence.analyzeCorridor(input.relationshipId);
      this.triggerPredictive(input.relationshipId);
    });
  }

  async onExecutionTransition(input: { relationshipId: string; orderId: string }): Promise<void> {
    await this.safeIngest(async () => {
      if (!(await this.enabledForRelationship(input.relationshipId))) return;
      const order = await this.prisma.order.findUnique({
        where: { id: input.orderId },
        select: { createdAt: true },
      });
      if (!order) return;
      const firstEvent = await this.prisma.relationalOrderExecutionEvent.findFirst({
        where: { orderId: input.orderId },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      });
      const lastEvent = await this.prisma.relationalOrderExecutionEvent.findFirst({
        where: { orderId: input.orderId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      if (!firstEvent || !lastEvent) return;
      const hours = this.policy.hoursBetween(firstEvent.createdAt, lastEvent.createdAt);
      await this.intelligence.persistMetric({
        relationshipId: input.relationshipId,
        orderId: input.orderId,
        metricType: "EXECUTION_DURATION_HOURS",
        metricValue: hours,
      });
      await this.intelligence.analyzeCorridor(input.relationshipId);
      this.triggerPredictive(input.relationshipId);
    });
  }
}
