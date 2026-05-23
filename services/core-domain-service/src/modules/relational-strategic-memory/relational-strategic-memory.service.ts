import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { RelationalStrategicMemoryRealtimeEventType } from "@venext/shared-contracts";
import {
  RelationalStrategicMemoryActionResponseSchema,
  RelationalStrategicMemoryArchiveRequestSchema,
  RelationalStrategicMemoryAssessOutcomeRequestSchema,
  RelationalStrategicMemoryInvalidateRequestSchema,
  RelationalStrategicMemoryListSchema,
  RelationalStrategicMemoryOverviewSchema,
  RelationalStrategicMemoryReuseRequestSchema,
  RelationalStrategicMemorySchema,
  type RelationalStrategicMemoryActionResponseDto,
  type RelationalStrategicMemoryDto,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import {
  STRATEGIC_MEMORY_ENGINE_THRESHOLDS,
  RelationalStrategicMemoryPolicyService,
  type StrategicMemoryPolicyContext,
} from "./relational-strategic-memory-policy.service";
import { RelationalStrategicMemoryRealtimeService } from "./relational-strategic-memory-realtime.service";

const SYSTEM_MEMORY_ACTOR_USER_ID = "00000000-0000-4000-8000-000000000098";

type MemoryRow = {
  id: string;
  relationshipId: string;
  memoryStatus: import("@prisma/client").RelationalStrategicMemoryStatus;
  memoryType: import("@prisma/client").RelationalStrategicMemoryType;
  memorySeverity: import("@prisma/client").RelationalStrategicMemorySeverity;
  title: string;
  description: string;
  memoryCode: string;
  sourceSimulationId: string | null;
  sourceRecommendationId: string | null;
  sourceOrchestrationId: string | null;
  sourceReviewBoardId: string | null;
  sourceIncidentId: string | null;
  sourceFulfillmentId: string | null;
  strategicSummary: string;
  observedPattern: string;
  recoveryStrategy: string | null;
  outcomeAssessment: string | null;
  reuseRecommendation: string | null;
  confidenceLevel: number;
  reuseCount: number;
  successfulReuseCount: number;
  failedReuseCount: number;
  lastReusedAt: Date | null;
  archivedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type EventRow = {
  id: string;
  memoryId: string;
  eventType: import("@prisma/client").RelationalStrategicMemoryEventType;
  actorOrganizationId: string;
  actorUserId: string;
  createdAt: Date;
};

@Injectable()
export class RelationalStrategicMemoryService {
  private readonly log = new Logger(RelationalStrategicMemoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalStrategicMemoryPolicyService,
    private readonly corridorPolicy: RelationshipGovernancePolicyService,
    private readonly realtime: RelationalStrategicMemoryRealtimeService,
  ) {}

  private toEventDto(row: EventRow) {
    return {
      id: row.id,
      memoryId: row.memoryId,
      eventType: row.eventType,
      actorOrganizationId: row.actorOrganizationId,
      actorUserId: row.actorUserId,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toMemoryDto(row: MemoryRow, events: EventRow[]): RelationalStrategicMemoryDto {
    const dto = {
      ...row,
      recoveryStrategy: row.recoveryStrategy,
      outcomeAssessment: row.outcomeAssessment,
      reuseRecommendation: row.reuseRecommendation,
      lastReusedAt: row.lastReusedAt?.toISOString() ?? null,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      events: events.map((e) => this.toEventDto(e)),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalStrategicMemorySchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "strategic_memory_contract_invalid" });
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

  private async loadMemory(id: string): Promise<{ memory: MemoryRow; events: EventRow[] }> {
    const memory = await this.prisma.relationalStrategicMemory.findUnique({ where: { id } });
    if (!memory) throw new NotFoundException({ code: "strategic_memory_not_found" });
    const events = await this.prisma.relationalStrategicMemoryEvent.findMany({
      where: { memoryId: id },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    return { memory, events };
  }

  private async appendEvent(
    tx: Prisma.TransactionClient,
    input: {
      memoryId: string;
      eventType: import("@prisma/client").RelationalStrategicMemoryEventType;
      actorOrganizationId: string;
      actorUserId: string;
      diagnostics?: Record<string, unknown>;
    },
  ): Promise<void> {
    await tx.relationalStrategicMemoryEvent.create({
      data: {
        memoryId: input.memoryId,
        eventType: input.eventType,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: (input.diagnostics ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  private async policyContext(memory: MemoryRow): Promise<StrategicMemoryPolicyContext> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: memory.relationshipId },
      select: { corridorState: true },
    });
    const hasCoherentSource = Boolean(
      memory.sourceReviewBoardId ||
        memory.sourceIncidentId ||
        memory.sourceOrchestrationId ||
        memory.sourceSimulationId,
    );
    return {
      memoryStatus: memory.memoryStatus,
      corridorState: rel?.corridorState ?? "ACTIVE",
      confidenceLevel: memory.confidenceLevel,
      failedReuseCount: memory.failedReuseCount,
      reuseCount: memory.reuseCount,
      hasCoherentSource,
      observedPattern: memory.observedPattern,
    };
  }

  private policyError(code: string): never {
    const map: Record<string, number> = {
      strategic_memory_invalidated: 409,
      strategic_memory_corridor_terminated: 403,
      strategic_memory_low_confidence: 403,
      strategic_memory_too_many_failures: 409,
    };
    if (map[code] === 403) throw new ForbiddenException({ code });
    if (map[code] === 409) throw new ConflictException({ code });
    throw new BadRequestException({ code });
  }

  private async persistMemory(input: {
    relationshipId: string;
    memoryType: import("@prisma/client").RelationalStrategicMemoryType;
    memorySeverity: import("@prisma/client").RelationalStrategicMemorySeverity;
    title: string;
    description: string;
    memoryCode: string;
    strategicSummary: string;
    observedPattern: string;
    recoveryStrategy?: string | null;
    reuseRecommendation?: string | null;
    confidenceLevel: number;
    sourceSimulationId?: string | null;
    sourceRecommendationId?: string | null;
    sourceOrchestrationId?: string | null;
    sourceReviewBoardId?: string | null;
    sourceIncidentId?: string | null;
    sourceFulfillmentId?: string | null;
    actorOrganizationId: string;
    realtimeType: RelationalStrategicMemoryRealtimeEventType;
  }): Promise<RelationalStrategicMemoryDto> {
    const parties = await this.assertObservationAllowed(input.relationshipId);
    const ctx: StrategicMemoryPolicyContext = {
      memoryStatus: "ACTIVE",
      corridorState: parties.corridorState,
      confidenceLevel: input.confidenceLevel,
      failedReuseCount: 0,
      reuseCount: 0,
      hasCoherentSource: Boolean(
        input.sourceReviewBoardId ||
          input.sourceIncidentId ||
          input.sourceOrchestrationId ||
          input.sourceSimulationId,
      ),
      observedPattern: input.observedPattern,
    };
    if (!this.policy.canActivateMemory(ctx)) {
      throw new ForbiddenException({ code: "strategic_memory_creation_blocked" });
    }

    const existing = await this.prisma.relationalStrategicMemory.findFirst({
      where: { relationshipId: input.relationshipId, memoryCode: input.memoryCode, memoryStatus: "ACTIVE" },
    });
    if (existing) {
      const loaded = await this.loadMemory(existing.id);
      return this.toMemoryDto(loaded.memory, loaded.events);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + STRATEGIC_MEMORY_ENGINE_THRESHOLDS.expirationDays * 86400000);

    const created = await this.prisma.$transaction(async (tx) => {
      const mem = await tx.relationalStrategicMemory.create({
        data: {
          relationshipId: input.relationshipId,
          memoryStatus: "ACTIVE",
          memoryType: input.memoryType,
          memorySeverity: input.memorySeverity,
          title: input.title,
          description: input.description,
          memoryCode: input.memoryCode,
          sourceSimulationId: input.sourceSimulationId ?? null,
          sourceRecommendationId: input.sourceRecommendationId ?? null,
          sourceOrchestrationId: input.sourceOrchestrationId ?? null,
          sourceReviewBoardId: input.sourceReviewBoardId ?? null,
          sourceIncidentId: input.sourceIncidentId ?? null,
          sourceFulfillmentId: input.sourceFulfillmentId ?? null,
          strategicSummary: input.strategicSummary,
          observedPattern: input.observedPattern,
          recoveryStrategy: input.recoveryStrategy ?? null,
          reuseRecommendation: input.reuseRecommendation ?? null,
          confidenceLevel: input.confidenceLevel,
          expiresAt,
          metadata: { source: "strategic_memory_registry" } as Prisma.InputJsonValue,
        },
      });
      await this.appendEvent(tx, {
        memoryId: mem.id,
        eventType: "MEMORY_CREATED",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: SYSTEM_MEMORY_ACTOR_USER_ID,
        diagnostics: { memoryCode: input.memoryCode },
      });
      return mem;
    });

    const loaded = await this.loadMemory(created.id);
    const dto = this.toMemoryDto(loaded.memory, loaded.events);
    await this.publishRealtime(dto, parties, input.realtimeType);
    return dto;
  }

  async createMemoryFromReview(reviewBoardId: string): Promise<RelationalStrategicMemoryDto | null> {
    const review = await this.prisma.relationalScenarioReviewBoard.findUnique({
      where: { id: reviewBoardId },
    });
    if (!review || review.reviewStatus !== "APPROVED") return null;

    const memoryType = this.policy.mapReviewToMemoryType(review.decisionType);
    const code = this.policy.buildMemoryCode(memoryType, review.relationshipId, review.id.slice(0, 8));

    return this.persistMemory({
      relationshipId: review.relationshipId,
      memoryType,
      memorySeverity:
        review.decisionSeverity === "CRITICAL"
          ? "CRITICAL"
          : review.decisionSeverity === "HIGH"
            ? "HIGH"
            : review.decisionSeverity === "MEDIUM"
              ? "MEDIUM"
              : "LOW",
      title: `Mémoire décision — ${review.title}`,
      description: review.description,
      memoryCode: code,
      strategicSummary: review.decisionSummary ?? "Décision humaine corridor approuvée et capitalisée.",
      observedPattern: `Revue ${review.decisionType} approuvée — continuité décisionnelle corridor.`,
      recoveryStrategy: "Réutiliser critères d'approbation pour orchestrations et simulations futures.",
      reuseRecommendation: "Aligner recommandations sur cette décision documentée.",
      confidenceLevel: this.policy.initialConfidenceFromSeverity(
        review.decisionSeverity === "CRITICAL"
          ? "CRITICAL"
          : review.decisionSeverity === "HIGH"
            ? "HIGH"
            : "MEDIUM",
      ),
      sourceReviewBoardId: review.id,
      sourceSimulationId: review.simulationId,
      sourceOrchestrationId: review.orchestrationId,
      sourceRecommendationId: review.recommendationId,
      actorOrganizationId:
        review.reviewedByOrganizationId ??
        (await this.assertObservationAllowed(review.relationshipId)).buyerOrganizationId,
      realtimeType: "relational.memory.created",
    });
  }

  async createMemoryFromIncidentResolution(incidentId: string): Promise<RelationalStrategicMemoryDto | null> {
    const incident = await this.prisma.relationalFulfillmentIncident.findUnique({
      where: { id: incidentId },
      include: { fulfillmentRecord: { select: { relationshipId: true, id: true } } },
    });
    if (!incident || incident.resolutionStatus !== "RESOLVED") return null;

    const relationshipId = incident.fulfillmentRecord.relationshipId;
    const code = this.policy.buildMemoryCode("INCIDENT_RESOLUTION", relationshipId, incident.id.slice(0, 8));
    const severity =
      incident.severity === "CRITICAL" ? "CRITICAL" : incident.severity === "HIGH" ? "HIGH" : "MEDIUM";

    return this.persistMemory({
      relationshipId,
      memoryType: "INCIDENT_RESOLUTION",
      memorySeverity: severity as import("@prisma/client").RelationalStrategicMemorySeverity,
      title: `Résolution incident — ${incident.incidentType}`,
      description: incident.description,
      memoryCode: code,
      strategicSummary: incident.resolutionNotes ?? "Incident résolu — capitalisation stratégique corridor.",
      observedPattern: `Incident ${incident.incidentType} résolu avec succès.`,
      recoveryStrategy: "Rejouer séquence containment si récurrence détectée.",
      reuseRecommendation: "Prioriser orchestration INCIDENT_CONTAINMENT sur pattern similaire.",
      confidenceLevel: this.policy.initialConfidenceFromSeverity(severity as import("@prisma/client").RelationalStrategicMemorySeverity),
      sourceIncidentId: incident.id,
      sourceFulfillmentId: incident.fulfillmentRecord.id,
      actorOrganizationId: incident.reportedByOrganizationId,
      realtimeType: "relational.memory.created",
    });
  }

  async detectRecurringOperationalPatterns(relationshipId: string): Promise<number> {
    const parties = await this.assertObservationAllowed(relationshipId);
    const orders = await this.prisma.order.findMany({ where: { relationshipId }, select: { id: true } });
    const orderIds = orders.map((o) => o.id);

    const openIncidents = await this.prisma.relationalFulfillmentIncident.count({
      where: {
        fulfillmentRecord: { orderId: { in: orderIds } },
        resolutionStatus: { not: "RESOLVED" },
      },
    });
    const slaAlerts = await this.prisma.relationalOperationalAlert.count({
      where: { relationshipId, resolvedAt: null, alertType: "SLA_DELAY_RISK" },
    });
    const completedOrchestrations = await this.prisma.relationalOperationalOrchestration.count({
      where: { relationshipId, status: "COMPLETED", completedAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    });
    const approvedReviews = await this.prisma.relationalScenarioReviewBoard.count({
      where: { relationshipId, reviewStatus: "APPROVED", approvedAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    });
    const collapseRecoveries = await this.prisma.relationalOperationalOrchestration.count({
      where: {
        relationshipId,
        orchestrationType: "COLLAPSE_PREVENTION",
        status: "COMPLETED",
      },
    });

    const patterns = this.policy.detectRecurringPatterns({
      openIncidents,
      slaAlerts,
      completedOrchestrations,
      approvedReviews,
      collapseRecoveries,
    });

    let created = 0;
    for (const p of patterns) {
      const code = this.policy.buildMemoryCode(p.memoryType, relationshipId, p.patternCode);
      await this.persistMemory({
        relationshipId,
        memoryType: p.memoryType,
        memorySeverity: p.severity,
        title: p.title,
        description: p.strategicSummary,
        memoryCode: code,
        strategicSummary: p.strategicSummary,
        observedPattern: p.observedPattern,
        recoveryStrategy: p.recoveryStrategy,
        reuseRecommendation: "Réutiliser lors de stress test ou orchestration corridor.",
        confidenceLevel: p.confidenceLevel,
        actorOrganizationId: parties.buyerOrganizationId,
        realtimeType: "relational.memory.memory_pattern_detected",
      });
      created += 1;
    }
    return created;
  }

  async listMemories(input: { organizationId: string; relationshipId?: string }) {
    const where: Prisma.RelationalStrategicMemoryWhereInput = {};
    if (input.relationshipId) where.relationshipId = input.relationshipId;
    const rows = await this.prisma.relationalStrategicMemory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const memories: RelationalStrategicMemoryDto[] = [];
    for (const row of rows) {
      const events = await this.prisma.relationalStrategicMemoryEvent.findMany({
        where: { memoryId: row.id },
        orderBy: { createdAt: "asc" },
        take: 100,
      });
      memories.push(this.toMemoryDto(row, events));
    }
    const payload = { memories, paymentExecutionDisabled: true as const, publicTrackingDisabled: true as const };
    const p = RelationalStrategicMemoryListSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "strategic_memory_list_invalid" });
    return p.data;
  }

  async buildOverview(relationshipId: string) {
    await this.assertObservationAllowed(relationshipId);
    const rows = await this.prisma.relationalStrategicMemory.findMany({
      where: { relationshipId },
      select: { memoryStatus: true, memorySeverity: true, memoryType: true, confidenceLevel: true },
    });
    const active = rows.filter((r) => r.memoryStatus === "ACTIVE");
    const avg =
      active.length > 0 ? active.reduce((s, r) => s + r.confidenceLevel, 0) / active.length : 0;
    const typeCounts = new Map<string, number>();
    for (const r of active) typeCounts.set(r.memoryType, (typeCounts.get(r.memoryType) ?? 0) + 1);
    let topPatternType: import("@prisma/client").RelationalStrategicMemoryType | null = null;
    let max = 0;
    for (const [t, c] of typeCounts) {
      if (c > max) {
        max = c;
        topPatternType = t as import("@prisma/client").RelationalStrategicMemoryType;
      }
    }
    const payload = {
      relationshipId,
      activeCount: active.length,
      archivedCount: rows.filter((r) => r.memoryStatus === "ARCHIVED").length,
      invalidatedCount: rows.filter((r) => r.memoryStatus === "INVALIDATED").length,
      criticalActiveCount: active.filter((r) => r.memorySeverity === "CRITICAL").length,
      averageConfidence: avg,
      topPatternType,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalStrategicMemoryOverviewSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "strategic_memory_overview_invalid" });
    return p.data;
  }

  async reuseMemory(input: {
    memoryId: string;
    body: unknown;
    actorOrganizationId: string;
    actorUserId: string;
  }): Promise<RelationalStrategicMemoryActionResponseDto> {
    const parsed = RelationalStrategicMemoryReuseRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) throw new BadRequestException({ code: "strategic_memory_reuse_invalid" });

    const { memory: initial } = await this.loadMemory(input.memoryId);
    const parties = await this.assertObservationAllowed(initial.relationshipId);
    const ctx = await this.policyContext(initial);
    try {
      this.policy.assertCanReuse(ctx);
    } catch (e) {
      this.policyError(e instanceof Error ? e.message : "strategic_memory_reuse_denied");
    }

    await this.prisma.$transaction(async (tx) => {
      const count = await tx.relationalStrategicMemory.updateMany({
        where: { id: input.memoryId, memoryStatus: initial.memoryStatus },
        data: {
          reuseCount: initial.reuseCount + 1,
          lastReusedAt: new Date(),
          metadata: {
            lastReuseContext: parsed.data.reuseContext,
            targetOrchestrationId: parsed.data.targetOrchestrationId ?? null,
            targetSimulationId: parsed.data.targetSimulationId ?? null,
          } as Prisma.InputJsonValue,
        },
      });
      if (count.count === 0) throw new ConflictException({ code: "strategic_memory_concurrency" });
      await this.appendEvent(tx, {
        memoryId: input.memoryId,
        eventType: "MEMORY_REUSED",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: parsed.data,
      });
    });

    const loaded = await this.loadMemory(input.memoryId);
    const dto = this.toMemoryDto(loaded.memory, loaded.events);
    await this.publishRealtime(dto, parties, "relational.memory.memory_reused");
    return this.actionResponse(dto);
  }

  async invalidateMemory(input: {
    memoryId: string;
    body: unknown;
    actorOrganizationId: string;
    actorUserId: string;
  }): Promise<RelationalStrategicMemoryActionResponseDto> {
    const parsed = RelationalStrategicMemoryInvalidateRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) throw new BadRequestException({ code: "strategic_memory_invalidate_invalid" });

    const { memory: initial } = await this.loadMemory(input.memoryId);
    const parties = await this.assertObservationAllowed(initial.relationshipId);

    await this.prisma.$transaction(async (tx) => {
      const count = await tx.relationalStrategicMemory.updateMany({
        where: { id: input.memoryId, memoryStatus: initial.memoryStatus },
        data: {
          memoryStatus: "INVALIDATED",
          outcomeAssessment: parsed.data.invalidationReason,
        },
      });
      if (count.count === 0) throw new ConflictException({ code: "strategic_memory_concurrency" });
      await this.appendEvent(tx, {
        memoryId: input.memoryId,
        eventType: "MEMORY_INVALIDATED",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
      });
    });

    const loaded = await this.loadMemory(input.memoryId);
    const dto = this.toMemoryDto(loaded.memory, loaded.events);
    await this.publishRealtime(dto, parties, "relational.memory.memory_invalidated");
    return this.actionResponse(dto);
  }

  async archiveMemory(input: {
    memoryId: string;
    body: unknown;
    actorOrganizationId: string;
    actorUserId: string;
  }): Promise<RelationalStrategicMemoryActionResponseDto> {
    const parsed = RelationalStrategicMemoryArchiveRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) throw new BadRequestException({ code: "strategic_memory_archive_invalid" });

    const { memory: initial } = await this.loadMemory(input.memoryId);
    const parties = await this.assertObservationAllowed(initial.relationshipId);

    await this.prisma.$transaction(async (tx) => {
      const count = await tx.relationalStrategicMemory.updateMany({
        where: { id: input.memoryId, memoryStatus: initial.memoryStatus },
        data: {
          memoryStatus: "ARCHIVED",
          archivedAt: new Date(),
          outcomeAssessment: parsed.data.archiveReason,
        },
      });
      if (count.count === 0) throw new ConflictException({ code: "strategic_memory_concurrency" });
      await this.appendEvent(tx, {
        memoryId: input.memoryId,
        eventType: "MEMORY_ARCHIVED",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
      });
    });

    const loaded = await this.loadMemory(input.memoryId);
    const dto = this.toMemoryDto(loaded.memory, loaded.events);
    await this.publishRealtime(dto, parties, "relational.memory.memory_archived");
    return this.actionResponse(dto);
  }

  async assessMemoryOutcome(input: {
    memoryId: string;
    body: unknown;
    actorOrganizationId: string;
    actorUserId: string;
  }): Promise<RelationalStrategicMemoryActionResponseDto> {
    const parsed = RelationalStrategicMemoryAssessOutcomeRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) throw new BadRequestException({ code: "strategic_memory_assess_invalid" });

    const { memory: initial } = await this.loadMemory(input.memoryId);
    const parties = await this.assertObservationAllowed(initial.relationshipId);
    const newConfidence = this.policy.evolveConfidence(initial.confidenceLevel, parsed.data.outcomeSuccessful);

    await this.prisma.$transaction(async (tx) => {
      const count = await tx.relationalStrategicMemory.updateMany({
        where: { id: input.memoryId, memoryStatus: initial.memoryStatus },
        data: {
          confidenceLevel: newConfidence,
          successfulReuseCount: parsed.data.outcomeSuccessful
            ? initial.successfulReuseCount + 1
            : initial.successfulReuseCount,
          failedReuseCount: parsed.data.outcomeSuccessful
            ? initial.failedReuseCount
            : initial.failedReuseCount + 1,
          outcomeAssessment: parsed.data.outcomeNotes ?? (parsed.data.outcomeSuccessful ? "Réutilisation efficace" : "Réutilisation inefficace"),
        },
      });
      if (count.count === 0) throw new ConflictException({ code: "strategic_memory_concurrency" });
      await this.appendEvent(tx, {
        memoryId: input.memoryId,
        eventType: "MEMORY_OUTCOME_ASSESSED",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: { outcomeSuccessful: parsed.data.outcomeSuccessful },
      });
    });

    const loaded = await this.loadMemory(input.memoryId);
    const dto = this.toMemoryDto(loaded.memory, loaded.events);
    await this.publishRealtime(dto, parties, "relational.memory.memory_reused");
    return this.actionResponse(dto);
  }

  private async publishRealtime(
    dto: RelationalStrategicMemoryDto,
    parties: { buyerOrganizationId: string; sellerOrganizationId: string },
    eventType: RelationalStrategicMemoryRealtimeEventType,
  ): Promise<void> {
    void this.realtime
      .publishBothSides({
        ...parties,
        memoryId: dto.id,
        relationshipId: dto.relationshipId,
        memoryType: dto.memoryType,
        memorySeverity: dto.memorySeverity,
        confidenceLevel: dto.confidenceLevel,
        realtimeEventType: eventType,
      })
      .catch((e) => this.log.warn(String(e)));
  }

  private actionResponse(dto: RelationalStrategicMemoryDto): RelationalStrategicMemoryActionResponseDto {
    const payload = {
      memory: dto,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalStrategicMemoryActionResponseSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "strategic_memory_action_invalid" });
    return p.data;
  }
}
