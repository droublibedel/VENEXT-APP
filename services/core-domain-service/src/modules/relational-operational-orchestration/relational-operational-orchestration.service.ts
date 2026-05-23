import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalOperationalOrchestrationActionResponseSchema,
  RelationalOperationalOrchestrationApproveRequestSchema,
  RelationalOperationalOrchestrationCancelRequestSchema,
  RelationalOperationalOrchestrationCompleteStepRequestSchema,
  RelationalOperationalOrchestrationListSchema,
  RelationalOperationalOrchestrationOverviewSchema,
  RelationalOperationalOrchestrationPauseRequestSchema,
  RelationalOperationalOrchestrationReopenStepRequestSchema,
  RelationalOperationalOrchestrationSchema,
  RelationalOperationalOrchestrationStartRequestSchema,
  type RelationalOperationalOrchestrationActionResponseDto,
  type RelationalOperationalOrchestrationDto,
  type RelationalOperationalOrchestrationRealtimeEventType,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import {
  type OrchestrationPlanCandidate,
  ORCHESTRATION_ENGINE_THRESHOLDS,
  RelationalOperationalOrchestrationPolicyService,
} from "./relational-operational-orchestration-policy.service";
import { RelationalOperationalOrchestrationRealtimeService } from "./relational-operational-orchestration-realtime.service";

const OPEN_ORCHESTRATION_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "WAITING_VALIDATION"] as const;
const TERMINAL_ORCHESTRATION = ["COMPLETED", "CANCELLED", "FAILED", "EXPIRED"] as const;

@Injectable()
export class RelationalOperationalOrchestrationService {
  private readonly log = new Logger(RelationalOperationalOrchestrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalOperationalOrchestrationPolicyService,
    private readonly corridorPolicy: RelationshipGovernancePolicyService,
    private readonly realtime: RelationalOperationalOrchestrationRealtimeService,
  ) {}

  private toStepDto(row: {
    id: string;
    orchestrationId: string;
    stepCode: string;
    stepTitle: string;
    stepDescription: string;
    stepOrder: number;
    stepStatus: import("@prisma/client").RelationalOperationalOrchestrationStepStatus;
    blockingStep: boolean;
    assignedOrganizationId: string | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      orchestrationId: row.orchestrationId,
      stepCode: row.stepCode,
      stepTitle: row.stepTitle,
      stepDescription: row.stepDescription,
      stepOrder: row.stepOrder,
      stepStatus: row.stepStatus,
      blockingStep: row.blockingStep,
      assignedOrganizationId: row.assignedOrganizationId,
      completedAt: row.completedAt?.toISOString() ?? null,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toOrchestrationDto(
    row: {
      id: string;
      relationshipId: string;
      orchestrationType: import("@prisma/client").RelationalOperationalOrchestrationType;
      status: import("@prisma/client").RelationalOperationalOrchestrationStatus;
      priority: import("@prisma/client").RelationalOperationalOrchestrationPriority;
      title: string;
      description: string;
      orchestrationCode: string;
      sourceRecommendationId: string | null;
      riskScore: number;
      confidenceLevel: number;
      requiresHumanValidation: boolean;
      approvedAt: Date | null;
      startedAt: Date | null;
      completedAt: Date | null;
      cancelledAt: Date | null;
      expiresAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    steps: Parameters<typeof this.toStepDto>[0][],
  ): RelationalOperationalOrchestrationDto {
    const dto = {
      ...row,
      sourceRecommendationId: row.sourceRecommendationId,
      approvedAt: row.approvedAt?.toISOString() ?? null,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      steps: steps.map((s) => this.toStepDto(s)),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalOperationalOrchestrationSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "operational_orchestration_contract_invalid" });
    return p.data;
  }

  async assertObservationAllowed(relationshipId: string): Promise<{
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    corridorState: string;
  }> {
    await this.corridorPolicy.assertCorridorOperational(relationshipId, "operational_observation");
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: {
        requesterOrganizationId: true,
        receiverOrganizationId: true,
        corridorState: true,
      },
    });
    if (!rel) throw new NotFoundException(relationshipId);
    const order = await this.prisma.order.findFirst({
      where: { relationshipId },
      select: { buyerOrganizationId: true, sellerOrganizationId: true },
      orderBy: { createdAt: "desc" },
    });
    if (order) {
      return {
        buyerOrganizationId: order.buyerOrganizationId,
        sellerOrganizationId: order.sellerOrganizationId,
        corridorState: rel.corridorState,
      };
    }
    return {
      buyerOrganizationId: rel.requesterOrganizationId,
      sellerOrganizationId: rel.receiverOrganizationId,
      corridorState: rel.corridorState,
    };
  }

  assertCanCreateActiveOrchestration(corridorState: string): void {
    if (corridorState === "TERMINATED" || corridorState === "SUSPENDED") {
      throw new ForbiddenException({ code: "orchestration_corridor_not_eligible_for_activation" });
    }
  }

  async syncOrchestrationsForRelationship(relationshipId: string): Promise<number> {
    const parties = await this.assertObservationAllowed(relationshipId);
    const recs = await this.prisma.relationalOperationalRecommendation.findMany({
      where: { relationshipId, status: { in: ["ACTIVE", "ACKNOWLEDGED"] } },
      take: 30,
    });
    let created = 0;
    for (const rec of recs) {
      const row = await this.generateOrchestrationFromRecommendation(rec.id);
      if (row) created += 1;
    }
    if (created === 0) {
      const collapse = await this.generateCollapseRecoveryPlan(relationshipId);
      if (collapse) created += 1;
    }
    return created;
  }

  private async persistPlan(
    relationshipId: string,
    plan: OrchestrationPlanCandidate,
    sourceRecommendationId?: string | null,
  ): Promise<RelationalOperationalOrchestrationDto | null> {
    const parties = await this.assertObservationAllowed(relationshipId);
    const now = new Date();
    const existing = await this.prisma.relationalOperationalOrchestration.findFirst({
      where: {
        relationshipId,
        orchestrationCode: plan.code,
        status: { in: [...OPEN_ORCHESTRATION_STATUSES] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing && this.policy.isWithinCooldown(existing.createdAt, now)) return null;

    const active = await this.prisma.relationalOperationalOrchestration.findMany({
      where: { relationshipId, status: { in: [...OPEN_ORCHESTRATION_STATUSES] } },
      select: { orchestrationType: true, priority: true },
    });
    if (active.length >= ORCHESTRATION_ENGINE_THRESHOLDS.maxActivePerRelationship) return null;
    if (
      plan.priority === "CRITICAL" &&
      active.filter((a) => a.priority === "CRITICAL").length >= ORCHESTRATION_ENGINE_THRESHOLDS.maxActiveCritical
    ) {
      return null;
    }
    if (this.policy.hasConflictingActive(plan.type, active.map((a) => a.orchestrationType))) return null;

    const initialStatus = plan.requiresHumanValidation ? "WAITING_VALIDATION" : "DRAFT";
    const expiresAt = new Date(now.getTime() + ORCHESTRATION_ENGINE_THRESHOLDS.expirationDays * 86400000);

    const orch = await this.prisma.relationalOperationalOrchestration.create({
      data: {
        relationshipId,
        orchestrationType: plan.type,
        status: initialStatus,
        priority: plan.priority,
        title: plan.title,
        description: plan.description,
        orchestrationCode: plan.code,
        sourceRecommendationId: sourceRecommendationId ?? null,
        orchestrationDiagnostics: (plan.diagnostics ?? {}) as Prisma.InputJsonValue,
        riskScore: plan.riskScore,
        confidenceLevel: plan.confidenceLevel,
        requiresHumanValidation: plan.requiresHumanValidation,
        expiresAt,
      },
    });

    const steps = await Promise.all(
      plan.steps.map((s) =>
        this.prisma.relationalOperationalOrchestrationStep.create({
          data: {
            orchestrationId: orch.id,
            stepCode: s.stepCode,
            stepTitle: s.stepTitle,
            stepDescription: s.stepDescription,
            stepOrder: s.stepOrder,
            blockingStep: s.blockingStep,
            stepStatus: s.stepOrder === 1 ? "IN_PROGRESS" : "PENDING",
          },
        }),
      ),
    );

    const dto = this.toOrchestrationDto(orch, steps);
    void this.realtime
      .publishBothSides({
        ...parties,
        orchestrationId: dto.id,
        relationshipId,
        orchestrationType: dto.orchestrationType,
        priority: dto.priority,
        status: dto.status,
        realtimeEventType: "relational.operational.orchestration_created",
      })
      .catch((e) => this.log.warn(String(e)));
    return dto;
  }

  async generateOrchestrationFromRecommendation(recommendationId: string): Promise<RelationalOperationalOrchestrationDto | null> {
    const rec = await this.prisma.relationalOperationalRecommendation.findUnique({ where: { id: recommendationId } });
    if (!rec || (rec.status !== "ACTIVE" && rec.status !== "ACKNOWLEDGED")) return null;
    const type = this.policy.mapRecommendationType(rec.recommendationType);
    const plan = this.policy.buildPlanFromType(
      type,
      rec.relationshipId,
      rec.recommendationScore,
      `Orchestration — ${rec.title}`,
      rec.description,
    );
    plan.diagnostics = { sourceRecommendationId: rec.id, recommendationCode: rec.recommendationCode };
    return this.persistPlan(rec.relationshipId, plan, rec.id);
  }

  async generateCollapseRecoveryPlan(relationshipId: string): Promise<RelationalOperationalOrchestrationDto | null> {
    const signals = await this.prisma.relationalPredictiveRiskSignal.count({
      where: { relationshipId, resolvedAt: null, riskLevel: { in: ["HIGH", "CRITICAL"] } },
    });
    if (signals === 0) return null;
    const plan = this.policy.buildPlanFromType(
      "COLLAPSE_PREVENTION",
      relationshipId,
      80,
      "Plan containment effondrement opérationnel",
      "Séquence déterministe de stabilisation corridor — validation humaine requise.",
    );
    return this.persistPlan(relationshipId, plan);
  }

  async generateSlaRecoveryPlan(relationshipId: string): Promise<RelationalOperationalOrchestrationDto | null> {
    const alerts = await this.prisma.relationalOperationalAlert.count({
      where: { relationshipId, resolvedAt: null, alertType: "SLA_DELAY_RISK" },
    });
    if (alerts === 0) return null;
    const plan = this.policy.buildPlanFromType(
      "SLA_STABILIZATION",
      relationshipId,
      65,
      "Plan récupération SLA",
      "Séquence SLA pour réduire dérive opérationnelle corridor.",
    );
    return this.persistPlan(relationshipId, plan);
  }

  async generateIncidentContainmentPlan(relationshipId: string): Promise<RelationalOperationalOrchestrationDto | null> {
    const orders = await this.prisma.order.findMany({ where: { relationshipId }, select: { id: true } });
    if (orders.length === 0) return null;
    const open = await this.prisma.relationalFulfillmentIncident.count({
      where: { fulfillmentRecord: { orderId: { in: orders.map((o) => o.id) } }, resolutionStatus: { not: "RESOLVED" } },
    });
    if (open < 2) return null;
    const plan = this.policy.buildPlanFromType(
      "INCIDENT_CONTAINMENT",
      relationshipId,
      72,
      "Plan containment incidents",
      "Orchestration incidents fulfillment ouverts — escalade contrôlée.",
    );
    return this.persistPlan(relationshipId, plan);
  }

  async generateCoordinationRecoveryPlan(relationshipId: string): Promise<RelationalOperationalOrchestrationDto | null> {
    const plan = this.policy.buildPlanFromType(
      "COORDINATION_REBALANCING",
      relationshipId,
      55,
      "Plan rééquilibrage coordination",
      "Réduction charge coordination — séquence déterministe.",
    );
    return this.persistPlan(relationshipId, plan);
  }

  async generateGovernanceReviewPlan(relationshipId: string): Promise<RelationalOperationalOrchestrationDto | null> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { corridorState: true },
    });
    if (!rel || !["BLOCKED", "DEGRADED", "SUSPENDED"].includes(rel.corridorState)) return null;
    const plan = this.policy.buildPlanFromType(
      "GOVERNANCE_REVIEW",
      relationshipId,
      70,
      "Revue gouvernance corridor",
      `État ${rel.corridorState} — revue gouvernance avant reprise opérations.`,
    );
    return this.persistPlan(relationshipId, plan);
  }

  private async loadOrchestration(id: string) {
    const row = await this.prisma.relationalOperationalOrchestration.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
    if (!row) throw new NotFoundException(id);
    return row;
  }

  async listOrchestrations(input: { organizationId: string; relationshipId?: string; openOnly?: boolean }) {
    if (input.relationshipId) await this.assertObservationAllowed(input.relationshipId);
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
    const rows = await this.prisma.relationalOperationalOrchestration.findMany({
      where: {
        ...relFilter,
        ...(input.openOnly !== false ? { status: { in: [...OPEN_ORCHESTRATION_STATUSES] } } : {}),
      },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 100,
    });
    const orchestrations = rows.map((r) => this.toOrchestrationDto(r, r.steps));
    const dto = { orchestrations, paymentExecutionDisabled: true as const, publicTrackingDisabled: true as const };
    return RelationalOperationalOrchestrationListSchema.parse(dto);
  }

  async buildOverview(relationshipId: string) {
    await this.assertObservationAllowed(relationshipId);
    const open = await this.prisma.relationalOperationalOrchestration.findMany({
      where: { relationshipId, status: { in: [...OPEN_ORCHESTRATION_STATUSES] } },
      include: { steps: true },
    });
    const allSteps = open.flatMap((o) => o.steps);
    const completed = allSteps.filter((s) => s.stepStatus === "COMPLETED").length;
    const ratio = allSteps.length > 0 ? completed / allSteps.length : 0;
    const top = open.sort((a, b) => b.riskScore - a.riskScore)[0];
    const dto = {
      relationshipId,
      activeCount: open.filter((o) => o.status === "ACTIVE").length,
      waitingValidationCount: open.filter((o) => o.status === "WAITING_VALIDATION").length,
      criticalCount: open.filter((o) => o.priority === "CRITICAL").length,
      completedStepsRatio: Math.round(ratio * 1000) / 1000,
      topOrchestrationCode: top?.orchestrationCode ?? null,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    return RelationalOperationalOrchestrationOverviewSchema.parse(dto);
  }

  private async publishLifecycle(
    row: Awaited<ReturnType<typeof this.loadOrchestration>>,
    event: RelationalOperationalOrchestrationRealtimeEventType,
    stepId?: string,
  ) {
    const parties = await this.assertObservationAllowed(row.relationshipId);
    void this.realtime
      .publishBothSides({
        ...parties,
        orchestrationId: row.id,
        relationshipId: row.relationshipId,
        orchestrationType: row.orchestrationType,
        priority: row.priority,
        status: row.status,
        stepId: stepId ?? null,
        realtimeEventType: event,
      })
      .catch((e) => this.log.warn(String(e)));
  }

  private actionResponse(row: Awaited<ReturnType<typeof this.loadOrchestration>>): RelationalOperationalOrchestrationActionResponseDto {
    return RelationalOperationalOrchestrationActionResponseSchema.parse({
      orchestration: this.toOrchestrationDto(row, row.steps),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
  }

  async approve(input: { orchestrationId: string; userId: string; body: unknown }) {
    const p = RelationalOperationalOrchestrationApproveRequestSchema.safeParse(input.body ?? {});
    if (!p.success) throw new BadRequestException({ code: "orchestration_approve_invalid" });
    const row = await this.loadOrchestration(input.orchestrationId);
    if (row.status !== "WAITING_VALIDATION") {
      throw new BadRequestException({ code: "orchestration_not_waiting_validation" });
    }
    const now = new Date();
    await this.prisma.relationalOperationalOrchestration.update({
      where: { id: row.id },
      data: {
        status: "DRAFT",
        approvedAt: now,
        approvedByUserId: input.userId,
        orchestrationMetadata: {
          ...((row.orchestrationMetadata ?? {}) as object),
          approvalNotes: p.data.approvalNotes ?? null,
        } as Prisma.InputJsonValue,
      },
    });
    const updated = await this.loadOrchestration(row.id);
    await this.publishLifecycle(updated, "relational.operational.orchestration_approved");
    return this.actionResponse(updated);
  }

  async start(input: { orchestrationId: string; body: unknown }) {
    const p = RelationalOperationalOrchestrationStartRequestSchema.safeParse(input.body ?? {});
    if (!p.success) throw new BadRequestException({ code: "orchestration_start_invalid" });
    const row = await this.loadOrchestration(input.orchestrationId);
    const parties = await this.assertObservationAllowed(row.relationshipId);
    this.assertCanCreateActiveOrchestration(parties.corridorState);
    if (row.status === "WAITING_VALIDATION") {
      throw new BadRequestException({ code: "orchestration_requires_approval" });
    }
    if (row.status !== "DRAFT" && row.status !== "PAUSED") {
      throw new BadRequestException({ code: "orchestration_not_startable" });
    }
    const now = new Date();
    await this.prisma.relationalOperationalOrchestration.update({
      where: { id: row.id },
      data: { status: "ACTIVE", startedAt: row.startedAt ?? now },
    });
    const updated = await this.loadOrchestration(row.id);
    await this.publishLifecycle(updated, "relational.operational.orchestration_started");
    return this.actionResponse(updated);
  }

  async pause(input: { orchestrationId: string; body: unknown }) {
    const p = RelationalOperationalOrchestrationPauseRequestSchema.safeParse(input.body ?? {});
    if (!p.success) throw new BadRequestException({ code: "orchestration_pause_invalid" });
    const row = await this.loadOrchestration(input.orchestrationId);
    if (row.status !== "ACTIVE") throw new BadRequestException({ code: "orchestration_not_active" });
    await this.prisma.relationalOperationalOrchestration.update({
      where: { id: row.id },
      data: {
        status: "PAUSED",
        orchestrationMetadata: {
          ...((row.orchestrationMetadata ?? {}) as object),
          pauseReason: p.data.reason,
        } as Prisma.InputJsonValue,
      },
    });
    const updated = await this.loadOrchestration(row.id);
    await this.publishLifecycle(updated, "relational.operational.orchestration_paused");
    return this.actionResponse(updated);
  }

  async cancel(input: { orchestrationId: string; body: unknown }) {
    const p = RelationalOperationalOrchestrationCancelRequestSchema.safeParse(input.body ?? {});
    if (!p.success) throw new BadRequestException({ code: "orchestration_cancel_invalid" });
    const row = await this.loadOrchestration(input.orchestrationId);
    if ((TERMINAL_ORCHESTRATION as readonly string[]).includes(row.status)) {
      throw new BadRequestException({ code: "orchestration_terminal" });
    }
    const now = new Date();
    await this.prisma.relationalOperationalOrchestration.update({
      where: { id: row.id },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        orchestrationMetadata: {
          ...((row.orchestrationMetadata ?? {}) as object),
          cancelReason: p.data.reason,
        } as Prisma.InputJsonValue,
      },
    });
    await this.prisma.relationalOperationalOrchestrationStep.updateMany({
      where: { orchestrationId: row.id, stepStatus: { in: ["PENDING", "IN_PROGRESS", "BLOCKED"] } },
      data: { stepStatus: "CANCELLED" },
    });
    const updated = await this.loadOrchestration(row.id);
    await this.publishLifecycle(updated, "relational.operational.orchestration_cancelled");
    return this.actionResponse(updated);
  }

  async completeStep(input: { stepId: string; userId: string; body: unknown }) {
    const p = RelationalOperationalOrchestrationCompleteStepRequestSchema.safeParse(input.body ?? {});
    if (!p.success) throw new BadRequestException({ code: "orchestration_complete_step_invalid" });
    const step = await this.prisma.relationalOperationalOrchestrationStep.findUnique({
      where: { id: input.stepId },
      include: { orchestration: { include: { steps: { orderBy: { stepOrder: "asc" } } } } },
    });
    if (!step) throw new NotFoundException(input.stepId);
    if (step.stepStatus === "COMPLETED") throw new BadRequestException({ code: "orchestration_step_already_completed" });
    const blockingPending = step.orchestration.steps.some(
      (s) => s.blockingStep && s.stepOrder < step.stepOrder && s.stepStatus !== "COMPLETED",
    );
    if (blockingPending) throw new BadRequestException({ code: "orchestration_blocking_step_incomplete" });

    const now = new Date();
    await this.prisma.relationalOperationalOrchestrationStep.update({
      where: { id: step.id },
      data: {
        stepStatus: "COMPLETED",
        completedAt: now,
        assignedUserId: input.userId,
        metadata: { completionNotes: p.data.completionNotes ?? null } as Prisma.InputJsonValue,
      },
    });

    const next = step.orchestration.steps.find((s) => s.stepOrder === step.stepOrder + 1);
    if (next && next.stepStatus === "PENDING") {
      await this.prisma.relationalOperationalOrchestrationStep.update({
        where: { id: next.id },
        data: { stepStatus: "IN_PROGRESS" },
      });
    }

    const all = await this.prisma.relationalOperationalOrchestrationStep.findMany({
      where: { orchestrationId: step.orchestrationId },
    });
    const allDone = all.every((s) => s.stepStatus === "COMPLETED" || s.stepStatus === "SKIPPED");
    if (allDone) {
      await this.prisma.relationalOperationalOrchestration.update({
        where: { id: step.orchestrationId },
        data: { status: "COMPLETED", completedAt: now },
      });
    }

    const updated = await this.loadOrchestration(step.orchestrationId);
    await this.publishLifecycle(updated, "relational.operational.orchestration_step_completed", step.id);
    if (allDone) await this.publishLifecycle(updated, "relational.operational.orchestration_completed");
    return this.actionResponse(updated);
  }

  async reopenStep(input: { stepId: string; body: unknown }) {
    const p = RelationalOperationalOrchestrationReopenStepRequestSchema.safeParse(input.body ?? {});
    if (!p.success) throw new BadRequestException({ code: "orchestration_reopen_step_invalid" });
    const step = await this.prisma.relationalOperationalOrchestrationStep.findUnique({
      where: { id: input.stepId },
      include: { orchestration: true },
    });
    if (!step) throw new NotFoundException(input.stepId);
    if (step.stepStatus !== "COMPLETED") throw new BadRequestException({ code: "orchestration_step_not_completed" });
    await this.prisma.relationalOperationalOrchestrationStep.update({
      where: { id: step.id },
      data: {
        stepStatus: "IN_PROGRESS",
        completedAt: null,
        metadata: { reopenReason: p.data.reason } as Prisma.InputJsonValue,
      },
    });
    if (step.orchestration.status === "COMPLETED") {
      await this.prisma.relationalOperationalOrchestration.update({
        where: { id: step.orchestrationId },
        data: { status: "ACTIVE", completedAt: null },
      });
    }
    const updated = await this.loadOrchestration(step.orchestrationId);
    return this.actionResponse(updated);
  }
}
