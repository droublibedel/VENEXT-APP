import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalOperationalRecommendationActionResponseSchema,
  RelationalOperationalRecommendationAcknowledgeRequestSchema,
  RelationalOperationalRecommendationDismissRequestSchema,
  RelationalOperationalRecommendationListSchema,
  RelationalOperationalRecommendationOverviewSchema,
  RelationalOperationalRecommendationResolveRequestSchema,
  RelationalOperationalRecommendationSchema,
  type RelationalOperationalRecommendationActionResponseDto,
  type RelationalOperationalRecommendationDto,
  type RelationalOperationalRecommendationRealtimeEventType,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalOperationalCollapseService } from "../relational-predictive-risk/relational-operational-collapse.service";
import { RelationalOperationalSlaService } from "../relational-operational-intelligence/relational-operational-sla.service";
import {
  type RecommendationCandidate,
  RECOMMENDATION_ENGINE_THRESHOLDS,
  RelationalOperationalRecommendationPolicyService,
} from "./relational-operational-recommendation-policy.service";
import { RelationalOperationalRecommendationRealtimeService } from "./relational-operational-recommendation-realtime.service";

const OPEN_TASK_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_EXTERNAL_CONFIRMATION", "WAITING_CORRIDOR_VALIDATION", "BLOCKED"] as const;
const ACTIVE_STATUSES = ["ACTIVE", "ACKNOWLEDGED"] as const;

@Injectable()
export class RelationalOperationalRecommendationService {
  private readonly log = new Logger(RelationalOperationalRecommendationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalOperationalRecommendationPolicyService,
    private readonly corridorPolicy: RelationshipGovernancePolicyService,
    private readonly collapse: RelationalOperationalCollapseService,
    private readonly sla: RelationalOperationalSlaService,
    private readonly realtime: RelationalOperationalRecommendationRealtimeService,
  ) {}

  private toDto(row: {
    id: string;
    relationshipId: string;
    recommendationType: import("@prisma/client").RelationalOperationalRecommendationType;
    severity: import("@prisma/client").RelationalOperationalRecommendationSeverity;
    source: import("@prisma/client").RelationalOperationalRecommendationSource;
    status: import("@prisma/client").RelationalOperationalRecommendationStatus;
    title: string;
    description: string;
    recommendationCode: string;
    recommendationScore: number;
    confidenceLevel: number;
    actionable: boolean;
    acknowledgedAt: Date | null;
    resolvedAt: Date | null;
    dismissedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): RelationalOperationalRecommendationDto {
    const dto = {
      id: row.id,
      relationshipId: row.relationshipId,
      recommendationType: row.recommendationType,
      severity: row.severity,
      source: row.source,
      status: row.status,
      title: row.title,
      description: row.description,
      recommendationCode: row.recommendationCode,
      recommendationScore: row.recommendationScore,
      confidenceLevel: row.confidenceLevel,
      actionable: row.actionable,
      acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null,
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      dismissedAt: row.dismissedAt?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
    const p = RelationalOperationalRecommendationSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "operational_recommendation_contract_invalid" });
    return p.data;
  }

  async assertObservationAllowed(relationshipId: string): Promise<{
    buyerOrganizationId: string;
    sellerOrganizationId: string;
  }> {
    await this.corridorPolicy.assertCorridorOperational(relationshipId, "operational_observation");
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
    const order = await this.prisma.order.findFirst({
      where: { relationshipId },
      select: { buyerOrganizationId: true, sellerOrganizationId: true },
      orderBy: { createdAt: "desc" },
    });
    if (order) return { buyerOrganizationId: order.buyerOrganizationId, sellerOrganizationId: order.sellerOrganizationId };
    return { buyerOrganizationId: rel.requesterOrganizationId, sellerOrganizationId: rel.receiverOrganizationId };
  }

  async expireStaleRecommendations(relationshipId: string): Promise<void> {
    const now = new Date();
    await this.prisma.relationalOperationalRecommendation.updateMany({
      where: {
        relationshipId,
        status: { in: [...ACTIVE_STATUSES] },
        OR: [
          { expiresAt: { lte: now } },
          {
            expiresAt: null,
            createdAt: {
              lte: new Date(now.getTime() - RECOMMENDATION_ENGINE_THRESHOLDS.expirationDays * 86400000),
            },
          },
        ],
      },
      data: { status: "EXPIRED" },
    });
  }

  async upsertCandidate(relationshipId: string, candidate: RecommendationCandidate): Promise<RelationalOperationalRecommendationDto | null> {
    const now = new Date();
    const code = candidate.code;
    const existing = await this.prisma.relationalOperationalRecommendation.findFirst({
      where: { relationshipId, recommendationCode: code, status: { in: [...ACTIVE_STATUSES] } },
      orderBy: { createdAt: "desc" },
    });
    if (existing && this.policy.isWithinCooldown(existing.createdAt, now)) {
      return null;
    }
    if (existing) {
      const updated = await this.prisma.relationalOperationalRecommendation.update({
        where: { id: existing.id },
        data: {
          severity: candidate.severity,
          recommendationScore: this.policy.clampScore(candidate.score),
          confidenceLevel: this.policy.clampConfidence(candidate.confidence),
          description: candidate.description,
          recommendationDiagnostics: (candidate.diagnostics ?? {}) as Prisma.InputJsonValue,
          updatedAt: now,
        },
      });
      return this.toDto(updated);
    }
    const activeCount = await this.prisma.relationalOperationalRecommendation.count({
      where: { relationshipId, status: { in: [...ACTIVE_STATUSES] } },
    });
    if (activeCount >= RECOMMENDATION_ENGINE_THRESHOLDS.maxActivePerRelationship) {
      return null;
    }
    const expiresAt = new Date(now.getTime() + RECOMMENDATION_ENGINE_THRESHOLDS.expirationDays * 86400000);
    const row = await this.prisma.relationalOperationalRecommendation.create({
      data: {
        relationshipId,
        recommendationType: candidate.type,
        severity: candidate.severity,
        source: candidate.source,
        status: "ACTIVE",
        title: candidate.title,
        description: candidate.description,
        recommendationCode: code,
        recommendationScore: this.policy.clampScore(candidate.score),
        confidenceLevel: this.policy.clampConfidence(candidate.confidence),
        recommendationDiagnostics: (candidate.diagnostics ?? {}) as Prisma.InputJsonValue,
        expiresAt,
        actionable: true,
      },
    });
    const dto = this.toDto(row);
    const parties = await this.assertObservationAllowed(relationshipId);
    void this.realtime
      .publishBothSides({
        ...parties,
        recommendationId: dto.id,
        relationshipId,
        severity: dto.severity,
        recommendationType: dto.recommendationType,
        recommendationScore: dto.recommendationScore,
        source: dto.source,
        realtimeEventType: "relational.operational.recommendation_created",
      })
      .catch((e) => this.log.warn(String(e)));
    return dto;
  }

  async generateSlaRecommendations(relationshipId: string): Promise<RecommendationCandidate[]> {
    const snapshot = await this.sla.buildSlaSnapshot(relationshipId);
    const out: RecommendationCandidate[] = [];
    if (snapshot.corridorOperationalHealth === "DEGRADED" || snapshot.corridorOperationalHealth === "CRITICAL") {
      const score = snapshot.corridorOperationalHealth === "CRITICAL" ? 88 : 62;
      out.push({
        code: this.policy.buildCode("SLA_DEGRADATION_RECOMMENDATION", relationshipId),
        type: "SLA_DEGRADATION_RECOMMENDATION",
        source: "SLA_ANALYSIS",
        severity: this.policy.severityFromScore(score),
        title: "Dégradation SLA corridor",
        description: `Santé opérationnelle ${snapshot.corridorOperationalHealth} — revue SLA et alignement exécution recommandés.`,
        score,
        confidence: 85,
        diagnostics: { snapshot },
      });
    }
    if (snapshot.activeBlockingTasks > 0) {
      out.push({
        code: this.policy.buildCode("FULFILLMENT_RISK_RECOMMENDATION", relationshipId, "blocking"),
        type: "FULFILLMENT_RISK_RECOMMENDATION",
        source: "SLA_ANALYSIS",
        severity: "HIGH",
        title: "Risque fulfillment — tâches bloquantes",
        description: `${snapshot.activeBlockingTasks} tâche(s) bloquante(s) — prioriser clôture avant nouvelles étapes.`,
        score: 70,
        confidence: 90,
      });
    }
    return out;
  }

  async generatePredictiveRecommendations(relationshipId: string): Promise<RecommendationCandidate[]> {
    const signals = await this.prisma.relationalPredictiveRiskSignal.findMany({
      where: { relationshipId, resolvedAt: null },
      take: 20,
    });
    const out: RecommendationCandidate[] = [];
    for (const s of signals) {
      if (s.signalScore < RECOMMENDATION_ENGINE_THRESHOLDS.predictiveHighScore) continue;
      const type =
        s.riskType === "SLA_COLLAPSE_RISK"
          ? "COLLAPSE_PREVENTION_RECOMMENDATION"
          : s.riskType === "COORDINATION_SATURATION_RISK"
            ? "COORDINATION_OVERLOAD_RECOMMENDATION"
            : "OPERATIONAL_REVIEW_RECOMMENDATION";
      out.push({
        code: this.policy.buildCode(type, relationshipId, s.riskType),
        type,
        source: "PREDICTIVE_RISK",
        severity: s.riskLevel === "CRITICAL" ? "CRITICAL" : s.riskLevel === "HIGH" ? "HIGH" : "MEDIUM",
        title: `Action corridor — ${s.title}`,
        description: s.description,
        score: this.policy.clampScore(s.signalScore),
        confidence: this.policy.clampConfidence(s.confidenceLevel * 100),
        diagnostics: { predictiveSignalId: s.id, riskType: s.riskType },
      });
    }
    const drifts = await this.prisma.relationalOperationalDriftSnapshot.count({
      where: { relationshipId, computedAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    });
    if (drifts > 0) {
      out.push({
        code: this.policy.buildCode("OPERATIONAL_REVIEW_RECOMMENDATION", relationshipId, "drift"),
        type: "OPERATIONAL_REVIEW_RECOMMENDATION",
        source: "PREDICTIVE_RISK",
        severity: "MEDIUM",
        title: "Revue drift opérationnel",
        description: `${drifts} snapshot(s) de dérive — analyse déterministe des écarts baseline.`,
        score: 45,
        confidence: 75,
      });
    }
    return out;
  }

  async generateIncidentRecommendations(relationshipId: string): Promise<RecommendationCandidate[]> {
    const orders = await this.prisma.order.findMany({ where: { relationshipId }, select: { id: true } });
    const orderIds = orders.map((o) => o.id);
    if (orderIds.length === 0) return [];
    const openIncidents = await this.prisma.relationalFulfillmentIncident.count({
      where: {
        fulfillmentRecord: { orderId: { in: orderIds } },
        resolutionStatus: { not: "RESOLVED" },
      },
    });
    if (openIncidents < RECOMMENDATION_ENGINE_THRESHOLDS.blockingIncidentsCount) return [];
    return [
      {
        code: this.policy.buildCode("INCIDENT_ESCALATION_RECOMMENDATION", relationshipId),
        type: "INCIDENT_ESCALATION_RECOMMENDATION",
        source: "INCIDENT_ANALYSIS",
        severity: openIncidents >= 3 ? "CRITICAL" : "HIGH",
        title: "Escalade incidents fulfillment",
        description: `${openIncidents} incident(s) ouvert(s) — activer workflow résolution partenaire (20.10).`,
        score: this.policy.clampScore(openIncidents * 22),
        confidence: 88,
        diagnostics: { openIncidents },
      },
    ];
  }

  async generateCoordinationRecommendations(relationshipId: string): Promise<RecommendationCandidate[]> {
    const orders = await this.prisma.order.findMany({ where: { relationshipId }, select: { id: true } });
    const recordIds =
      orders.length > 0
        ? (
            await this.prisma.relationalFulfillmentRecord.findMany({
              where: { orderId: { in: orders.map((o) => o.id) } },
              select: { id: true },
            })
          ).map((r) => r.id)
        : [];
    if (recordIds.length === 0) return [];
    const openTasks = await this.prisma.relationalFulfillmentTask.count({
      where: { fulfillmentRecordId: { in: recordIds }, taskStatus: { in: [...OPEN_TASK_STATUSES] } },
    });
    if (openTasks < RECOMMENDATION_ENGINE_THRESHOLDS.coordinationOverloadTasks) return [];
    return [
      {
        code: this.policy.buildCode("COORDINATION_OVERLOAD_RECOMMENDATION", relationshipId),
        type: "COORDINATION_OVERLOAD_RECOMMENDATION",
        source: "COORDINATION_ANALYSIS",
        severity: "HIGH",
        title: "Réduire charge coordination",
        description: `${openTasks} tâches ouvertes — réassigner ou clôturer tâches non bloquantes.`,
        score: this.policy.clampScore(openTasks * 12),
        confidence: 82,
      },
    ];
  }

  async generateGovernanceRecommendations(relationshipId: string): Promise<RecommendationCandidate[]> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { corridorState: true, corridorHealthScore: true },
    });
    if (!rel) return [];
    const out: RecommendationCandidate[] = [];
    if (rel.corridorState === "DEGRADED" || rel.corridorState === "BLOCKED" || rel.corridorState === "SUSPENDED") {
      out.push({
        code: this.policy.buildCode("CORRIDOR_GOVERNANCE_RECOMMENDATION", relationshipId, rel.corridorState),
        type: "CORRIDOR_GOVERNANCE_RECOMMENDATION",
        source: "GOVERNANCE_ANALYSIS",
        severity: rel.corridorState === "BLOCKED" ? "CRITICAL" : "HIGH",
        title: "Stabilisation gouvernance corridor",
        description: `État corridor ${rel.corridorState} — revue gouvernance relationnelle avant nouvelles opérations commerce.`,
        score: rel.corridorState === "BLOCKED" ? 90 : 68,
        confidence: 92,
        diagnostics: { corridorState: rel.corridorState, health: rel.corridorHealthScore },
      });
    }
    return out;
  }

  async generateCollapsePreventionRecommendations(relationshipId: string): Promise<RecommendationCandidate[]> {
    const assessment = await this.collapse.assessCorridor(relationshipId);
    if (assessment.corridorCollapseRisk < RECOMMENDATION_ENGINE_THRESHOLDS.collapseRiskThreshold) return [];
    return [
      {
        code: this.policy.buildCode("COLLAPSE_PREVENTION_RECOMMENDATION", relationshipId),
        type: "COLLAPSE_PREVENTION_RECOMMENDATION",
        source: "CORRIDOR_COLLAPSE_ANALYSIS",
        severity: assessment.corridorCollapseRisk >= 85 ? "CRITICAL" : "HIGH",
        title: "Prévention effondrement opérationnel",
        description: `Indice collapse ${assessment.corridorCollapseRisk}/100 — plan de stabilisation corridor urgent.`,
        score: assessment.corridorCollapseRisk,
        confidence: 91,
        diagnostics: assessment.diagnostics as Record<string, unknown>,
      },
    ];
  }

  async generateRecommendationsForRelationship(relationshipId: string): Promise<number> {
    await this.assertObservationAllowed(relationshipId);
    await this.expireStaleRecommendations(relationshipId);

    const batches = await Promise.all([
      this.generateSlaRecommendations(relationshipId),
      this.generatePredictiveRecommendations(relationshipId),
      this.generateIncidentRecommendations(relationshipId),
      this.generateCoordinationRecommendations(relationshipId),
      this.generateGovernanceRecommendations(relationshipId),
      this.generateCollapsePreventionRecommendations(relationshipId),
      this.generateExecutionStabilization(relationshipId),
      this.generateFulfillmentRisk(relationshipId),
      this.generateDocumentValidation(relationshipId),
      this.generatePartnerValidation(relationshipId),
    ]);

    const prioritized = this.policy.prioritize(batches.flat());
    let created = 0;
    for (const c of prioritized) {
      const row = await this.upsertCandidate(relationshipId, c);
      if (row) created += 1;
    }
    return created;
  }

  private async generateExecutionStabilization(relationshipId: string): Promise<RecommendationCandidate[]> {
    const events = await this.prisma.relationalOrderExecutionEvent.count({ where: { relationshipId } });
    const blocked = await this.prisma.order.count({
      where: { relationshipId, relationalOrderExecutionStatus: "BLOCKED" },
    });
    if (blocked === 0 && events < 5) return [];
    return [
      {
        code: this.policy.buildCode("EXECUTION_STABILIZATION_RECOMMENDATION", relationshipId),
        type: "EXECUTION_STABILIZATION_RECOMMENDATION",
        source: "EXECUTION_ANALYSIS",
        severity: blocked > 0 ? "HIGH" : "MEDIUM",
        title: "Stabiliser exécution corridor",
        description: blocked > 0 ? "Exécution bloquée — diagnostic transitions 20.8." : "Volatilité exécution — revue séquencement.",
        score: blocked > 0 ? 75 : 42,
        confidence: 70,
        diagnostics: { blockedOrders: blocked, executionEvents: events },
      },
    ];
  }

  private async generateFulfillmentRisk(relationshipId: string): Promise<RecommendationCandidate[]> {
    const stagnation = await this.prisma.relationalOperationalAlert.count({
      where: { relationshipId, resolvedAt: null, alertType: "FULFILLMENT_STAGNATION" },
    });
    if (stagnation === 0) return [];
    return [
      {
        code: this.policy.buildCode("FULFILLMENT_RISK_RECOMMENDATION", relationshipId, "stagnation"),
        type: "FULFILLMENT_RISK_RECOMMENDATION",
        source: "FULFILLMENT_ANALYSIS",
        severity: "HIGH",
        title: "Risque stagnation fulfillment",
        description: "Fulfillment non clôturé — aligner preuves et validation réception.",
        score: 72,
        confidence: 86,
      },
    ];
  }

  private async generateDocumentValidation(relationshipId: string): Promise<RecommendationCandidate[]> {
    const orders = await this.prisma.order.findMany({ where: { relationshipId }, select: { id: true } });
    const records =
      orders.length > 0
        ? await this.prisma.relationalFulfillmentRecord.findMany({
            where: { orderId: { in: orders.map((o) => o.id) } },
            select: { proofRequired: true, proofValidated: true },
          })
        : [];
    const pending = records.filter((r) => r.proofRequired && !r.proofValidated).length;
    if (pending === 0) return [];
    return [
      {
        code: this.policy.buildCode("DOCUMENT_VALIDATION_RECOMMENDATION", relationshipId),
        type: "DOCUMENT_VALIDATION_RECOMMENDATION",
        source: "FULFILLMENT_ANALYSIS",
        severity: "MEDIUM",
        title: "Valider preuves documentaires",
        description: `${pending} fulfillment(s) avec preuve requise non validée.`,
        score: 50,
        confidence: 80,
      },
    ];
  }

  private async generatePartnerValidation(relationshipId: string): Promise<RecommendationCandidate[]> {
    const orders = await this.prisma.order.findMany({ where: { relationshipId }, select: { id: true } });
    const recordIds =
      orders.length > 0
        ? (
            await this.prisma.relationalFulfillmentRecord.findMany({
              where: { orderId: { in: orders.map((o) => o.id) } },
              select: { id: true },
            })
          ).map((r) => r.id)
        : [];
    const partial =
      recordIds.length > 0
        ? await this.prisma.relationalFulfillmentIncident.count({
            where: {
              fulfillmentRecordId: { in: recordIds },
              incidentType: "PARTIAL_RECEPTION",
              createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
            },
          })
        : 0;
    if (partial < 2) return [];
    return [
      {
        code: this.policy.buildCode("PARTNER_VALIDATION_RECOMMENDATION", relationshipId),
        type: "PARTNER_VALIDATION_RECOMMENDATION",
        source: "INCIDENT_ANALYSIS",
        severity: "MEDIUM",
        title: "Renforcer validation partenaire",
        description: "Réceptions partielles répétées — double validation buyer/seller recommandée.",
        score: 55,
        confidence: 74,
      },
    ];
  }

  async listRecommendations(input: {
    organizationId: string;
    relationshipId?: string;
    activeOnly?: boolean;
  }) {
    if (input.relationshipId) {
      await this.assertObservationAllowed(input.relationshipId);
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
    const rows = await this.prisma.relationalOperationalRecommendation.findMany({
      where: {
        ...relFilter,
        ...(input.activeOnly ? { status: { in: [...ACTIVE_STATUSES] } } : {}),
      },
      orderBy: [{ recommendationScore: "desc" }, { createdAt: "desc" }],
      take: 200,
    });
    const dto = { recommendations: rows.map((r) => this.toDto(r)) };
    const p = RelationalOperationalRecommendationListSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "operational_recommendation_list_invalid" });
    return p.data;
  }

  async buildOverview(relationshipId: string, organizationId: string) {
    await this.assertObservationAllowed(relationshipId);
    const active = await this.prisma.relationalOperationalRecommendation.findMany({
      where: { relationshipId, status: { in: [...ACTIVE_STATUSES] } },
    });
    const critical = active.filter((r) => r.severity === "CRITICAL").length;
    const high = active.filter((r) => r.severity === "HIGH").length;
    const top = active.sort((a, b) => b.recommendationScore - a.recommendationScore)[0];
    const avg = active.length > 0 ? active.reduce((s, r) => s + r.recommendationScore, 0) / active.length : 0;
    const dto = {
      relationshipId,
      activeCount: active.length,
      criticalCount: critical,
      highPriorityCount: high,
      topRecommendationCode: top?.recommendationCode ?? null,
      averageScore: Math.round(avg * 100) / 100,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalOperationalRecommendationOverviewSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "operational_recommendation_overview_invalid" });
    return p.data;
  }

  private async lifecycleAction(
    input: {
      organizationId: string;
      userId: string;
      recommendationId: string;
      body: unknown;
      status: "ACKNOWLEDGED" | "DISMISSED" | "RESOLVED";
      realtimeEventType: RelationalOperationalRecommendationRealtimeEventType;
    },
    parseBody: (body: unknown) => Record<string, unknown>,
  ): Promise<RelationalOperationalRecommendationActionResponseDto> {
    const existing = await this.prisma.relationalOperationalRecommendation.findUnique({
      where: { id: input.recommendationId },
    });
    if (!existing) throw new NotFoundException(input.recommendationId);
    const parties = await this.assertObservationAllowed(existing.relationshipId);
    if (existing.status === "RESOLVED" || existing.status === "DISMISSED" || existing.status === "EXPIRED") {
      throw new BadRequestException({ code: "operational_recommendation_terminal" });
    }
    const meta = parseBody(input.body);
    const now = new Date();
    const patch: Prisma.RelationalOperationalRecommendationUpdateInput = {
      status: input.status,
      recommendationMetadata: { ...((existing.recommendationMetadata ?? {}) as object), ...meta } as Prisma.InputJsonValue,
    };
    if (input.status === "ACKNOWLEDGED") {
      patch.acknowledgedAt = now;
      patch.acknowledgedByUserId = input.userId;
    }
    if (input.status === "DISMISSED") {
      patch.dismissedAt = now;
      patch.dismissedByUserId = input.userId;
    }
    if (input.status === "RESOLVED") {
      patch.resolvedAt = now;
      patch.resolvedByUserId = input.userId;
    }
    const updated = await this.prisma.relationalOperationalRecommendation.update({
      where: { id: input.recommendationId },
      data: patch,
    });
    const recommendation = this.toDto(updated);
    const response = RelationalOperationalRecommendationActionResponseSchema.parse({
      recommendation,
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    void this.realtime
      .publishBothSides({
        ...parties,
        recommendationId: recommendation.id,
        relationshipId: recommendation.relationshipId,
        severity: recommendation.severity,
        recommendationType: recommendation.recommendationType,
        recommendationScore: recommendation.recommendationScore,
        source: recommendation.source,
        realtimeEventType: input.realtimeEventType,
      })
      .catch((e) => this.log.warn(String(e)));
    return response;
  }

  acknowledge(input: { organizationId: string; userId: string; recommendationId: string; body: unknown }) {
    return this.lifecycleAction(
      { ...input, status: "ACKNOWLEDGED", realtimeEventType: "relational.operational.recommendation_acknowledged" },
      (body) => {
        const p = RelationalOperationalRecommendationAcknowledgeRequestSchema.safeParse(body ?? {});
        if (!p.success) throw new BadRequestException({ code: "operational_recommendation_ack_invalid" });
        return { notes: p.data.notes ?? null };
      },
    );
  }

  dismiss(input: { organizationId: string; userId: string; recommendationId: string; body: unknown }) {
    return this.lifecycleAction(
      { ...input, status: "DISMISSED", realtimeEventType: "relational.operational.recommendation_dismissed" },
      (body) => {
        const p = RelationalOperationalRecommendationDismissRequestSchema.safeParse(body ?? {});
        if (!p.success) throw new BadRequestException({ code: "operational_recommendation_dismiss_invalid" });
        return { reason: p.data.reason };
      },
    );
  }

  resolve(input: { organizationId: string; userId: string; recommendationId: string; body: unknown }) {
    return this.lifecycleAction(
      { ...input, status: "RESOLVED", realtimeEventType: "relational.operational.recommendation_resolved" },
      (body) => {
        const p = RelationalOperationalRecommendationResolveRequestSchema.safeParse(body ?? {});
        if (!p.success) throw new BadRequestException({ code: "operational_recommendation_resolve_invalid" });
        return { resolutionNotes: p.data.resolutionNotes };
      },
    );
  }
}
