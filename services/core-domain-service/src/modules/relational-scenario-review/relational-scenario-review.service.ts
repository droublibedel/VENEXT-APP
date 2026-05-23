import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { RelationalScenarioReviewRealtimeEventType } from "@venext/shared-contracts";
import {
  RelationalScenarioReviewActionResponseSchema,
  RelationalScenarioReviewApproveRequestSchema,
  RelationalScenarioReviewArchiveRequestSchema,
  RelationalScenarioReviewExecutiveValidationRequestSchema,
  RelationalScenarioReviewListSchema,
  RelationalScenarioReviewOverviewSchema,
  RelationalScenarioReviewReevaluateRequestSchema,
  RelationalScenarioReviewRejectRequestSchema,
  RelationalScenarioReviewSchema,
  type RelationalScenarioReviewActionResponseDto,
  type RelationalScenarioReviewDto,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalOperationalOrchestrationService } from "../relational-operational-orchestration/relational-operational-orchestration.service";
import { RelationalStrategicMemoryIngestionService } from "../relational-strategic-memory/relational-strategic-memory-ingestion.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import {
  SCENARIO_REVIEW_ENGINE_THRESHOLDS,
  RelationalScenarioReviewPolicyService,
  type ScenarioReviewPolicyContext,
} from "./relational-scenario-review-policy.service";
import { RelationalScenarioReviewRealtimeService } from "./relational-scenario-review-realtime.service";

const OPEN_REVIEW = ["PENDING_REVIEW", "UNDER_ANALYSIS", "PARTIALLY_APPROVED"] as const;
const OPEN_ORCHESTRATION = ["DRAFT", "ACTIVE", "PAUSED", "WAITING_VALIDATION"] as const;

type ReviewRow = {
  id: string;
  relationshipId: string;
  simulationId: string | null;
  orchestrationId: string | null;
  recommendationId: string | null;
  reviewStatus: import("@prisma/client").RelationalScenarioReviewStatus;
  decisionType: import("@prisma/client").RelationalScenarioDecisionType;
  decisionSeverity: import("@prisma/client").RelationalScenarioDecisionSeverity;
  title: string;
  description: string;
  decisionSummary: string | null;
  requiresExecutiveValidation: boolean;
  requiresDualValidation: boolean;
  reviewedByOrganizationId: string | null;
  reviewedByUserId: string | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  archivedAt: Date | null;
  expiresAt: Date | null;
  diagnostics: unknown;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

const SYSTEM_REVIEW_ACTOR_USER_ID = "00000000-0000-4000-8000-000000000099";

type EventRow = {
  id: string;
  reviewBoardId: string;
  eventType: import("@prisma/client").RelationalScenarioReviewEventType;
  previousStatus: import("@prisma/client").RelationalScenarioReviewStatus | null;
  nextStatus: import("@prisma/client").RelationalScenarioReviewStatus | null;
  actorOrganizationId: string;
  actorUserId: string;
  createdAt: Date;
};

@Injectable()
export class RelationalScenarioReviewService {
  private readonly log = new Logger(RelationalScenarioReviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalScenarioReviewPolicyService,
    private readonly corridorPolicy: RelationshipGovernancePolicyService,
    private readonly realtime: RelationalScenarioReviewRealtimeService,
    private readonly orchestration: RelationalOperationalOrchestrationService,
    @Inject(forwardRef(() => RelationalStrategicMemoryIngestionService))
    private readonly memoryIngestion: RelationalStrategicMemoryIngestionService,
  ) {}

  private toEventDto(row: EventRow) {
    return {
      id: row.id,
      reviewBoardId: row.reviewBoardId,
      eventType: row.eventType,
      previousStatus: row.previousStatus,
      nextStatus: row.nextStatus,
      actorOrganizationId: row.actorOrganizationId,
      actorUserId: row.actorUserId,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toReviewDto(row: ReviewRow, events: EventRow[]): RelationalScenarioReviewDto {
    const dto = {
      ...row,
      decisionSummary: row.decisionSummary,
      reviewedByOrganizationId: row.reviewedByOrganizationId,
      reviewedByUserId: row.reviewedByUserId,
      approvedAt: row.approvedAt?.toISOString() ?? null,
      rejectedAt: row.rejectedAt?.toISOString() ?? null,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      events: events.map((e) => this.toEventDto(e)),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalScenarioReviewSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "scenario_review_contract_invalid" });
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
      select: { requesterOrganizationId: true, receiverOrganizationId: true, corridorState: true },
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

  private async loadReview(id: string): Promise<{ review: ReviewRow; events: EventRow[] }> {
    const review = await this.prisma.relationalScenarioReviewBoard.findUnique({ where: { id } });
    if (!review) throw new NotFoundException({ code: "scenario_review_not_found" });
    const events = await this.prisma.relationalScenarioReviewEvent.findMany({
      where: { reviewBoardId: id },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    return { review, events };
  }

  private async appendEvent(
    tx: Prisma.TransactionClient,
    input: {
      reviewBoardId: string;
      eventType: import("@prisma/client").RelationalScenarioReviewEventType;
      previousStatus: import("@prisma/client").RelationalScenarioReviewStatus | null;
      nextStatus: import("@prisma/client").RelationalScenarioReviewStatus | null;
      actorOrganizationId: string;
      actorUserId: string;
      diagnostics?: Record<string, unknown>;
    },
  ): Promise<void> {
    await tx.relationalScenarioReviewEvent.create({
      data: {
        reviewBoardId: input.reviewBoardId,
        eventType: input.eventType,
        previousStatus: input.previousStatus,
        nextStatus: input.nextStatus,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: (input.diagnostics ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  private async policyContext(review: ReviewRow): Promise<ScenarioReviewPolicyContext> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: review.relationshipId },
      select: { corridorState: true },
    });
    const sim = review.simulationId
      ? await this.prisma.relationalOperationalSimulation.findUnique({
          where: { id: review.simulationId },
          select: { simulationType: true, resultingRiskScore: true, severity: true },
        })
      : null;
    const active = await this.prisma.relationalOperationalOrchestration.findMany({
      where: { relationshipId: review.relationshipId, status: { in: [...OPEN_ORCHESTRATION] } },
      select: { orchestrationType: true },
    });
    const criticalSims = await this.prisma.relationalOperationalSimulation.count({
      where: {
        relationshipId: review.relationshipId,
        status: "COMPLETED",
        severity: "CRITICAL",
        completedAt: { gte: new Date(Date.now() - 7 * 86400000) },
      },
    });
    const meta = (review.metadata && typeof review.metadata === "object" ? review.metadata : {}) as Record<
      string,
      unknown
    >;
    const diagnostics = review.diagnostics;
    const collapseScore =
      typeof diagnostics === "object" && diagnostics && "collapseScore" in diagnostics
        ? Number((diagnostics as { collapseScore: unknown }).collapseScore)
        : sim?.resultingRiskScore ?? 0;

    return {
      reviewStatus: review.reviewStatus,
      corridorState: rel?.corridorState ?? "ACTIVE",
      decisionSeverity: review.decisionSeverity,
      resultingRiskScore: sim?.resultingRiskScore ?? null,
      simulationType: sim?.simulationType ?? null,
      simulationSeverity: sim ? this.policy.severityFromSimulation(sim.severity, sim.resultingRiskScore) : null,
      requiresExecutiveValidation: review.requiresExecutiveValidation,
      requiresDualValidation: review.requiresDualValidation,
      activeOrchestrationTypes: active.map((a) => a.orchestrationType),
      criticalSimulationCount: criticalSims,
      collapseScore,
      metadata: meta,
    };
  }

  private policyError(code: string): never {
    const map: Record<string, number> = {
      scenario_review_terminal: 409,
      scenario_review_corridor_terminated: 403,
      scenario_review_corridor_suspended_critical: 403,
      scenario_review_conflicting_orchestration: 409,
      scenario_review_executive_required: 403,
    };
    if (map[code] === 403) throw new ForbiddenException({ code });
    if (map[code] === 409) throw new ConflictException({ code });
    throw new BadRequestException({ code });
  }

  async listReviews(input: { organizationId: string; relationshipId?: string }) {
    const where: Prisma.RelationalScenarioReviewBoardWhereInput = {};
    if (input.relationshipId) where.relationshipId = input.relationshipId;
    const rows = await this.prisma.relationalScenarioReviewBoard.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const reviews: RelationalScenarioReviewDto[] = [];
    for (const row of rows) {
      const events = await this.prisma.relationalScenarioReviewEvent.findMany({
        where: { reviewBoardId: row.id },
        orderBy: { createdAt: "asc" },
        take: 100,
      });
      reviews.push(this.toReviewDto(row, events));
    }
    const payload = { reviews, paymentExecutionDisabled: true as const, publicTrackingDisabled: true as const };
    const p = RelationalScenarioReviewListSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "scenario_review_list_invalid" });
    return p.data;
  }

  async buildOverview(relationshipId: string) {
    await this.assertObservationAllowed(relationshipId);
    const rows = await this.prisma.relationalScenarioReviewBoard.findMany({
      where: { relationshipId },
      select: { reviewStatus: true, decisionSeverity: true, requiresExecutiveValidation: true },
    });
    const payload = {
      relationshipId,
      pendingCount: rows.filter((r) => r.reviewStatus === "PENDING_REVIEW").length,
      underAnalysisCount: rows.filter((r) => r.reviewStatus === "UNDER_ANALYSIS").length,
      approvedCount: rows.filter((r) => r.reviewStatus === "APPROVED").length,
      rejectedCount: rows.filter((r) => r.reviewStatus === "REJECTED").length,
      executiveValidationCount: rows.filter(
        (r) => r.requiresExecutiveValidation && OPEN_REVIEW.includes(r.reviewStatus as (typeof OPEN_REVIEW)[number]),
      ).length,
      criticalOpenCount: rows.filter(
        (r) =>
          r.decisionSeverity === "CRITICAL" &&
          OPEN_REVIEW.includes(r.reviewStatus as (typeof OPEN_REVIEW)[number]),
      ).length,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalScenarioReviewOverviewSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "scenario_review_overview_invalid" });
    return p.data;
  }

  async createReviewFromSimulation(simulationId: string): Promise<RelationalScenarioReviewDto | null> {
    const sim = await this.prisma.relationalOperationalSimulation.findUnique({
      where: { id: simulationId },
      include: { results: { take: 1, orderBy: { createdAt: "desc" } } },
    });
    if (!sim || sim.status !== "COMPLETED") return null;

    const existing = await this.prisma.relationalScenarioReviewBoard.findFirst({
      where: {
        simulationId,
        reviewStatus: { in: [...OPEN_REVIEW] },
      },
    });
    if (existing) return null;

    const severity = this.policy.severityFromSimulation(sim.severity, sim.resultingRiskScore);
    if (
      !this.policy.shouldAutoCreateReview({
        simulationType: sim.simulationType,
        severity,
        outcome: sim.outcome,
        requiresHumanReview: sim.requiresHumanReview,
      })
    ) {
      return null;
    }

    const parties = await this.assertObservationAllowed(sim.relationshipId);
    const criticalSims = await this.prisma.relationalOperationalSimulation.count({
      where: { relationshipId: sim.relationshipId, status: "COMPLETED", severity: "CRITICAL" },
    });
    const collapseScore = sim.results[0]?.calculatedRiskScore ?? sim.resultingRiskScore ?? 0;
    const requiresDual = this.policy.requiresDualValidation(sim.simulationType);
    const requiresExec = this.policy.requiresExecutiveValidation({
      decisionSeverity: severity,
      corridorState: parties.corridorState,
      resultingRiskScore: sim.resultingRiskScore,
      collapseScore,
      criticalSimulationCount: criticalSims,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + SCENARIO_REVIEW_ENGINE_THRESHOLDS.expirationDays * 86400000);

    const created = await this.prisma.$transaction(async (tx) => {
      const board = await tx.relationalScenarioReviewBoard.create({
        data: {
          relationshipId: sim.relationshipId,
          simulationId: sim.id,
          reviewStatus: "PENDING_REVIEW",
          decisionType: "APPROVE_SIMULATION",
          decisionSeverity: severity,
          title: `Revue scénario — ${sim.simulationType}`,
          description: sim.description,
          requiresExecutiveValidation: requiresExec,
          requiresDualValidation: requiresDual,
          expiresAt,
          diagnostics: {
            simulationCode: sim.simulationCode,
            outcome: sim.outcome,
            collapseScore,
          } as Prisma.InputJsonValue,
          metadata: { source: "simulation_ingestion" } as Prisma.InputJsonValue,
        },
      });
      await this.appendEvent(tx, {
        reviewBoardId: board.id,
        eventType: "REVIEW_CREATED",
        previousStatus: null,
        nextStatus: "PENDING_REVIEW",
        actorOrganizationId: parties.buyerOrganizationId,
        actorUserId: SYSTEM_REVIEW_ACTOR_USER_ID,
        diagnostics: { simulationId: sim.id },
      });
      if (requiresExec) {
        await this.appendEvent(tx, {
          reviewBoardId: board.id,
          eventType: "EXECUTIVE_VALIDATION_REQUIRED",
          previousStatus: "PENDING_REVIEW",
          nextStatus: "PENDING_REVIEW",
          actorOrganizationId: parties.buyerOrganizationId,
          actorUserId: SYSTEM_REVIEW_ACTOR_USER_ID,
        });
      }
      return board;
    });

    const loaded = await this.loadReview(created.id);
    const dto = this.toReviewDto(loaded.review, loaded.events);
    await this.publishRealtime(dto, parties, "relational.scenario.review_created");
    if (requiresExec) {
      await this.publishRealtime(dto, parties, "relational.scenario.executive_validation_required");
    }
    return dto;
  }

  async approveReview(input: {
    reviewId: string;
    body: unknown;
    actorOrganizationId: string;
    actorUserId: string;
  }): Promise<RelationalScenarioReviewActionResponseDto> {
    const parsed = RelationalScenarioReviewApproveRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) throw new BadRequestException({ code: "scenario_review_approve_invalid" });

    const { review: initial } = await this.loadReview(input.reviewId);
    const parties = await this.assertObservationAllowed(initial.relationshipId);
    const ctx = await this.policyContext(initial);
    try {
      this.policy.assertCanApprove(ctx);
    } catch (e) {
      this.policyError(e instanceof Error ? e.message : "scenario_review_approve_denied");
    }

    if (ctx.requiresExecutiveValidation && ctx.metadata.executiveValidated !== true) {
      throw new ForbiddenException({ code: "scenario_review_executive_validation_pending" });
    }

    let nextStatus: import("@prisma/client").RelationalScenarioReviewStatus = "APPROVED";
    const meta = { ...ctx.metadata } as Record<string, unknown>;

    if (ctx.requiresDualValidation && initial.reviewStatus === "PENDING_REVIEW") {
      nextStatus = "PARTIALLY_APPROVED";
      meta.firstApprovedByOrganizationId = input.actorOrganizationId;
      meta.firstApprovedAt = new Date().toISOString();
    } else if (ctx.requiresDualValidation && initial.reviewStatus === "PARTIALLY_APPROVED") {
      const firstOrg = meta.firstApprovedByOrganizationId;
      if (firstOrg === input.actorOrganizationId) {
        throw new ConflictException({ code: "scenario_review_dual_validation_same_org" });
      }
      nextStatus = "APPROVED";
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const count = await tx.relationalScenarioReviewBoard.updateMany({
        where: { id: input.reviewId, reviewStatus: initial.reviewStatus },
        data: {
          reviewStatus: nextStatus,
          decisionSummary: parsed.data.decisionSummary,
          reviewedByOrganizationId: input.actorOrganizationId,
          reviewedByUserId: input.actorUserId,
          approvedAt: nextStatus === "APPROVED" ? new Date() : null,
          metadata: meta as Prisma.InputJsonValue,
        },
      });
      if (count.count === 0) throw new ConflictException({ code: "scenario_review_concurrency" });
      await this.appendEvent(tx, {
        reviewBoardId: input.reviewId,
        eventType: "REVIEW_APPROVED",
        previousStatus: initial.reviewStatus,
        nextStatus,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: { approvalNotes: parsed.data.approvalNotes ?? null },
      });
      return tx.relationalScenarioReviewBoard.findUniqueOrThrow({ where: { id: input.reviewId } });
    });

    let orchId: string | null = updated.orchestrationId;
    if (nextStatus === "APPROVED" && !orchId && updated.simulationId) {
      const sim = await this.prisma.relationalOperationalSimulation.findUnique({
        where: { id: updated.simulationId },
      });
      if (sim) {
        const orch = await this.attachOrchestrationFromSimulation(sim.relationshipId, sim.simulationType);
        if (orch) {
          orchId = orch.id;
          await this.prisma.relationalScenarioReviewBoard.update({
            where: { id: updated.id },
            data: { orchestrationId: orch.id },
          });
        }
      }
    }

    const loaded = await this.loadReview(updated.id);
    const dto = this.toReviewDto(loaded.review, loaded.events);
    await this.publishRealtime(dto, parties, "relational.scenario.review_approved");
    if (nextStatus === "APPROVED") {
      void this.memoryIngestion.syncForRelationship(initial.relationshipId).catch((e) => this.log.warn(String(e)));
    }
    return this.actionResponse(dto);
  }

  private async attachOrchestrationFromSimulation(
    relationshipId: string,
    simulationType: import("@prisma/client").RelationalOperationalSimulationType,
  ) {
    const type = this.policy.mapSimulationToOrchestrationType(simulationType);
    if (type === "COLLAPSE_PREVENTION") return this.orchestration.generateCollapseRecoveryPlan(relationshipId);
    if (type === "GOVERNANCE_REVIEW") return this.orchestration.generateGovernanceReviewPlan(relationshipId);
    if (type === "SLA_STABILIZATION") return this.orchestration.generateSlaRecoveryPlan(relationshipId);
    if (type === "INCIDENT_CONTAINMENT") return this.orchestration.generateIncidentContainmentPlan(relationshipId);
    return this.orchestration.generateCoordinationRecoveryPlan(relationshipId);
  }

  async attachOrchestrationDecision(reviewId: string, orchestrationId: string): Promise<RelationalScenarioReviewDto> {
    await this.loadReview(reviewId);
    await this.prisma.relationalScenarioReviewBoard.update({
      where: { id: reviewId },
      data: { orchestrationId, decisionType: "APPROVE_ORCHESTRATION" },
    });
    const loaded = await this.loadReview(reviewId);
    return this.toReviewDto(loaded.review, loaded.events);
  }

  async rejectReview(input: {
    reviewId: string;
    body: unknown;
    actorOrganizationId: string;
    actorUserId: string;
  }): Promise<RelationalScenarioReviewActionResponseDto> {
    const parsed = RelationalScenarioReviewRejectRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) throw new BadRequestException({ code: "scenario_review_reject_invalid" });

    const { review: initial } = await this.loadReview(input.reviewId);
    const parties = await this.assertObservationAllowed(initial.relationshipId);
    if (this.policy.isTerminalStatus(initial.reviewStatus)) {
      throw new ConflictException({ code: "scenario_review_terminal" });
    }

    await this.prisma.$transaction(async (tx) => {
      const count = await tx.relationalScenarioReviewBoard.updateMany({
        where: { id: input.reviewId, reviewStatus: initial.reviewStatus },
        data: {
          reviewStatus: "REJECTED",
          decisionSummary: parsed.data.decisionSummary,
          reviewedByOrganizationId: input.actorOrganizationId,
          reviewedByUserId: input.actorUserId,
          rejectedAt: new Date(),
          diagnostics: { rejectionReason: parsed.data.rejectionReason } as Prisma.InputJsonValue,
        },
      });
      if (count.count === 0) throw new ConflictException({ code: "scenario_review_concurrency" });
      await this.appendEvent(tx, {
        reviewBoardId: input.reviewId,
        eventType: "REVIEW_REJECTED",
        previousStatus: initial.reviewStatus,
        nextStatus: "REJECTED",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
      });
    });

    const loaded = await this.loadReview(input.reviewId);
    const dto = this.toReviewDto(loaded.review, loaded.events);
    await this.publishRealtime(dto, parties, "relational.scenario.review_rejected");
    return this.actionResponse(dto);
  }

  async requestReevaluation(input: {
    reviewId: string;
    body: unknown;
    actorOrganizationId: string;
    actorUserId: string;
  }): Promise<RelationalScenarioReviewActionResponseDto> {
    const parsed = RelationalScenarioReviewReevaluateRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) throw new BadRequestException({ code: "scenario_review_reevaluate_invalid" });

    const { review: initial } = await this.loadReview(input.reviewId);
    const parties = await this.assertObservationAllowed(initial.relationshipId);

    await this.prisma.$transaction(async (tx) => {
      const count = await tx.relationalScenarioReviewBoard.updateMany({
        where: { id: input.reviewId, reviewStatus: initial.reviewStatus },
        data: {
          reviewStatus: "UNDER_ANALYSIS",
          decisionType: "REQUEST_REEVALUATION",
          decisionSummary: parsed.data.reevaluationNotes,
        },
      });
      if (count.count === 0) throw new ConflictException({ code: "scenario_review_concurrency" });
      await this.appendEvent(tx, {
        reviewBoardId: input.reviewId,
        eventType: "REVIEW_ESCALATED",
        previousStatus: initial.reviewStatus,
        nextStatus: "UNDER_ANALYSIS",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
      });
    });

    const loaded = await this.loadReview(input.reviewId);
    const dto = this.toReviewDto(loaded.review, loaded.events);
    await this.publishRealtime(dto, parties, "relational.scenario.review_escalated");
    return this.actionResponse(dto);
  }

  async archiveReview(input: {
    reviewId: string;
    body: unknown;
    actorOrganizationId: string;
    actorUserId: string;
  }): Promise<RelationalScenarioReviewActionResponseDto> {
    const parsed = RelationalScenarioReviewArchiveRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) throw new BadRequestException({ code: "scenario_review_archive_invalid" });

    const { review: initial } = await this.loadReview(input.reviewId);
    const parties = await this.assertObservationAllowed(initial.relationshipId);

    await this.prisma.$transaction(async (tx) => {
      const count = await tx.relationalScenarioReviewBoard.updateMany({
        where: { id: input.reviewId, reviewStatus: initial.reviewStatus },
        data: {
          reviewStatus: "ARCHIVED",
          archivedAt: new Date(),
          decisionSummary: parsed.data.archiveReason,
        },
      });
      if (count.count === 0) throw new ConflictException({ code: "scenario_review_concurrency" });
      await this.appendEvent(tx, {
        reviewBoardId: input.reviewId,
        eventType: "REVIEW_ARCHIVED",
        previousStatus: initial.reviewStatus,
        nextStatus: "ARCHIVED",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
      });
    });

    const loaded = await this.loadReview(input.reviewId);
    const dto = this.toReviewDto(loaded.review, loaded.events);
    await this.publishRealtime(dto, parties, "relational.scenario.review_archived");
    return this.actionResponse(dto);
  }

  async requestExecutiveValidation(input: {
    reviewId: string;
    body: unknown;
    actorOrganizationId: string;
    actorUserId: string;
  }): Promise<RelationalScenarioReviewActionResponseDto> {
    const parsed = RelationalScenarioReviewExecutiveValidationRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) throw new BadRequestException({ code: "scenario_review_executive_invalid" });

    const { review: initial } = await this.loadReview(input.reviewId);
    const parties = await this.assertObservationAllowed(initial.relationshipId);
    const meta = (initial.metadata && typeof initial.metadata === "object" ? initial.metadata : {}) as Record<
      string,
      unknown
    >;
    meta.executiveValidated = true;
    meta.executiveNotes = parsed.data.executiveNotes;
    meta.executiveValidatedAt = new Date().toISOString();
    meta.executiveValidatedByOrganizationId = input.actorOrganizationId;

    await this.prisma.$transaction(async (tx) => {
      await tx.relationalScenarioReviewBoard.update({
        where: { id: input.reviewId },
        data: { metadata: meta as Prisma.InputJsonValue },
      });
      await this.appendEvent(tx, {
        reviewBoardId: input.reviewId,
        eventType: "EXECUTIVE_VALIDATION_REQUIRED",
        previousStatus: initial.reviewStatus,
        nextStatus: initial.reviewStatus,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: { executiveNotes: parsed.data.executiveNotes, validated: true },
      });
    });

    const loaded = await this.loadReview(input.reviewId);
    const dto = this.toReviewDto(loaded.review, loaded.events);
    await this.publishRealtime(dto, parties, "relational.scenario.executive_validation_required");
    return this.actionResponse(dto);
  }

  private async publishRealtime(
    dto: RelationalScenarioReviewDto,
    parties: { buyerOrganizationId: string; sellerOrganizationId: string },
    eventType: RelationalScenarioReviewRealtimeEventType,
  ): Promise<void> {
    void this.realtime
      .publishBothSides({
        ...parties,
        reviewBoardId: dto.id,
        relationshipId: dto.relationshipId,
        reviewStatus: dto.reviewStatus,
        decisionType: dto.decisionType,
        decisionSeverity: dto.decisionSeverity,
        realtimeEventType: eventType,
      })
      .catch((e) => this.log.warn(String(e)));
  }

  private actionResponse(dto: RelationalScenarioReviewDto): RelationalScenarioReviewActionResponseDto {
    const payload = {
      review: dto,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalScenarioReviewActionResponseSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "scenario_review_action_invalid" });
    return p.data;
  }
}
