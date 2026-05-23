import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  type RelationalFulfillmentTaskEventType,
  type RelationalFulfillmentTaskStatus,
} from "@prisma/client";
import {
  RelationalFulfillmentTaskActionResponseSchema,
  RelationalFulfillmentTaskCreateRequestSchema,
  RelationalFulfillmentTaskAssignRequestSchema,
  RelationalFulfillmentTaskCommentRequestSchema,
  RelationalFulfillmentTaskListResponseSchema,
  RelationalFulfillmentTaskReopenRequestSchema,
  RelationalFulfillmentTaskSchema,
  type RelationalFulfillmentTaskActionResponseDto,
  type RelationalFulfillmentTaskActionTypeDto,
  type RelationalFulfillmentTaskDto,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalOperationalIntelligenceIngestionService } from "../relational-operational-intelligence/relational-operational-intelligence-ingestion.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalFulfillmentCoordinationPolicyService } from "./relational-fulfillment-coordination-policy.service";
import { RelationalFulfillmentCoordinationRealtimeService } from "./relational-fulfillment-coordination-realtime.service";

const OPEN_TASK_STATUSES: RelationalFulfillmentTaskStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_EXTERNAL_CONFIRMATION",
  "WAITING_CORRIDOR_VALIDATION",
  "BLOCKED",
];

@Injectable()
export class RelationalFulfillmentCoordinationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalFulfillmentCoordinationPolicyService,
    private readonly corridorPolicy: RelationshipGovernancePolicyService,
    private readonly realtime: RelationalFulfillmentCoordinationRealtimeService,
    private readonly operationalIngestion: RelationalOperationalIntelligenceIngestionService,
  ) {}

  /** Instruction 20.11 — blocking open tasks prevent fulfillment completion. */
  async countBlockingOpenTasks(
    tx: Prisma.TransactionClient,
    fulfillmentRecordId: string,
  ): Promise<{ count: number; taskIds: string[] }> {
    const tasks = await tx.relationalFulfillmentTask.findMany({
      where: {
        fulfillmentRecordId,
        blockingFulfillment: true,
        taskStatus: { in: OPEN_TASK_STATUSES },
      },
      select: { id: true },
    });
    return { count: tasks.length, taskIds: tasks.map((t) => t.id) };
  }

  private toTaskDto(row: {
    id: string;
    fulfillmentRecordId: string;
    relationshipId: string;
    orderId: string;
    taskType: import("@prisma/client").RelationalFulfillmentTaskType;
    taskStatus: RelationalFulfillmentTaskStatus;
    priority: import("@prisma/client").RelationalFulfillmentTaskPriority;
    title: string;
    description: string;
    assignedOrganizationId: string | null;
    assignedUserId: string | null;
    createdByOrganizationId: string;
    createdByUserId: string;
    blockingFulfillment: boolean;
    requiresBuyerConfirmation: boolean;
    requiresSellerConfirmation: boolean;
    buyerConfirmedAt: Date | null;
    sellerConfirmedAt: Date | null;
    dueAt: Date | null;
    completedAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): RelationalFulfillmentTaskDto {
    const dto = {
      id: row.id,
      fulfillmentRecordId: row.fulfillmentRecordId,
      relationshipId: row.relationshipId,
      orderId: row.orderId,
      taskType: row.taskType,
      taskStatus: row.taskStatus,
      priority: row.priority,
      title: row.title,
      description: row.description,
      assignedOrganizationId: row.assignedOrganizationId,
      assignedUserId: row.assignedUserId,
      createdByOrganizationId: row.createdByOrganizationId,
      createdByUserId: row.createdByUserId,
      blockingFulfillment: row.blockingFulfillment,
      requiresBuyerConfirmation: row.requiresBuyerConfirmation,
      requiresSellerConfirmation: row.requiresSellerConfirmation,
      buyerConfirmedAt: row.buyerConfirmedAt?.toISOString() ?? null,
      sellerConfirmedAt: row.sellerConfirmedAt?.toISOString() ?? null,
      dueAt: row.dueAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
    const p = RelationalFulfillmentTaskSchema.safeParse(dto);
    if (!p.success) {
      throw new BadRequestException({ code: "fulfillment_task_contract_invalid" });
    }
    return p.data;
  }

  private assertActionResponse(raw: unknown): RelationalFulfillmentTaskActionResponseDto {
    const p = RelationalFulfillmentTaskActionResponseSchema.safeParse(raw);
    if (!p.success) {
      throw new BadRequestException({ code: "fulfillment_task_action_response_invalid", issues: p.error.flatten() });
    }
    return p.data;
  }

  private async appendTaskEvent(
    tx: Prisma.TransactionClient,
    input: {
      taskId: string;
      eventType: RelationalFulfillmentTaskEventType;
      previousStatus: RelationalFulfillmentTaskStatus | null;
      nextStatus: RelationalFulfillmentTaskStatus | null;
      actorOrganizationId: string;
      actorUserId: string;
      comment?: string | null;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await tx.relationalFulfillmentTaskEvent.create({
      data: {
        taskId: input.taskId,
        eventType: input.eventType,
        previousStatus: input.previousStatus,
        nextStatus: input.nextStatus,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        comment: input.comment ?? null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  private async assertParticipant(record: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
  }, actorOrganizationId: string): Promise<void> {
    if (actorOrganizationId !== record.buyerOrganizationId && actorOrganizationId !== record.sellerOrganizationId) {
      throw new ForbiddenException({ code: "relational_fulfillment_participant_only" });
    }
  }

  private async assertCorridor(
    relationshipId: string,
    opts: { allowRestrictedFulfillmentForBackoffice: boolean; allowDormantFulfillment: boolean },
  ): Promise<void> {
    await this.corridorPolicy.assertCorridorOperational(relationshipId, "fulfillment_execution", {
      allowRestrictedOrderExecutionForBackoffice: opts.allowRestrictedFulfillmentForBackoffice,
      allowDormantOrderExecution: opts.allowDormantFulfillment,
    });
  }

  private async loadRecord(recordId: string) {
    const record = await this.prisma.relationalFulfillmentRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException(recordId);
    return record;
  }

  private async loadTask(taskId: string) {
    const task = await this.prisma.relationalFulfillmentTask.findUnique({
      where: { id: taskId },
      include: { fulfillmentRecord: true },
    });
    if (!task) throw new NotFoundException(taskId);
    return task;
  }

  private async publishTask(
    task: {
      id: string;
      fulfillmentRecordId: string;
      orderId: string;
      relationshipId: string;
      taskStatus: RelationalFulfillmentTaskStatus;
      taskType: import("@prisma/client").RelationalFulfillmentTaskType;
      priority: import("@prisma/client").RelationalFulfillmentTaskPriority;
    },
    record: { buyerOrganizationId: string; sellerOrganizationId: string },
    realtimeEventType: import("@venext/shared-contracts").RelationalFulfillmentTaskRealtimeEventType,
    actionType: RelationalFulfillmentTaskActionTypeDto,
    journalEventType: RelationalFulfillmentTaskEventType,
  ): Promise<void> {
    await this.realtime.publishBothSides({
      buyerOrganizationId: record.buyerOrganizationId,
      sellerOrganizationId: record.sellerOrganizationId,
      taskId: task.id,
      fulfillmentRecordId: task.fulfillmentRecordId,
      orderId: task.orderId,
      relationshipId: task.relationshipId,
      taskStatus: task.taskStatus,
      taskType: task.taskType,
      priority: task.priority,
      realtimeEventType,
      actionType,
      journalEventType,
    });
  }

  async listTasks(recordId: string, actorOrganizationId: string) {
    const record = await this.loadRecord(recordId);
    await this.assertParticipant(record, actorOrganizationId);
    const rows = await this.prisma.relationalFulfillmentTask.findMany({
      where: { fulfillmentRecordId: recordId },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 200,
    });
    const tasks = rows.map((r) => this.toTaskDto(r));
    const parsed = RelationalFulfillmentTaskListResponseSchema.safeParse({ tasks });
    if (!parsed.success) {
      throw new BadRequestException({ code: "fulfillment_task_list_contract_invalid" });
    }
    return parsed.data;
  }

  async createTask(input: {
    recordId: string;
    actorOrganizationId: string;
    actorUserId: string;
    body: unknown;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    const parsed = RelationalFulfillmentTaskCreateRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({ code: "fulfillment_task_create_body_invalid" });
    }
    const record = await this.loadRecord(input.recordId);
    await this.assertParticipant(record, input.actorOrganizationId);
    await this.assertCorridor(record.relationshipId, input);

    let taskId = "";
    const task = await this.prisma.$transaction(async (tx) => {
      const created = await tx.relationalFulfillmentTask.create({
        data: {
          fulfillmentRecordId: record.id,
          relationshipId: record.relationshipId,
          orderId: record.orderId,
          taskType: parsed.data.taskType,
          taskStatus: "OPEN",
          priority: parsed.data.priority ?? "NORMAL",
          title: parsed.data.title,
          description: parsed.data.description,
          assignedOrganizationId: parsed.data.assignedOrganizationId ?? null,
          assignedUserId: parsed.data.assignedUserId ?? null,
          createdByOrganizationId: input.actorOrganizationId,
          createdByUserId: input.actorUserId,
          blockingFulfillment: parsed.data.blockingFulfillment ?? false,
          requiresBuyerConfirmation: parsed.data.requiresBuyerConfirmation ?? false,
          requiresSellerConfirmation: parsed.data.requiresSellerConfirmation ?? false,
          dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
          diagnostics: { coordinationTaskSource: "CORRIDOR_OPERATIONAL" } as Prisma.InputJsonValue,
        },
      });
      taskId = created.id;
      await this.appendTaskEvent(tx, {
        taskId: created.id,
        eventType: "TASK_CREATED",
        previousStatus: null,
        nextStatus: "OPEN",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
      });
      return created;
    });

    await this.publishTask(task, record, "relational.fulfillment.task_created", "TASK_CREATED", "TASK_CREATED");

    return this.assertActionResponse({
      taskId,
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      previousStatus: null,
      nextStatus: "OPEN",
      actionType: "TASK_CREATED",
      eventCreated: true,
      eventType: "TASK_CREATED",
      task: this.toTaskDto(task),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
  }

  async assignTask(input: {
    taskId: string;
    actorOrganizationId: string;
    actorUserId: string;
    body: unknown;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    const parsed = RelationalFulfillmentTaskAssignRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({ code: "fulfillment_task_assign_body_invalid" });
    }
    const task = await this.loadTask(input.taskId);
    const record = task.fulfillmentRecord;
    await this.assertParticipant(record, input.actorOrganizationId);
    if (this.policy.isTerminal(task.taskStatus)) {
      throw new BadRequestException({ code: "fulfillment_task_terminal_no_assign" });
    }
    await this.assertCorridor(record.relationshipId, input);

    const from = task.taskStatus;
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.relationalFulfillmentTask.updateMany({
        where: { id: task.id, taskStatus: from },
        data: {
          assignedOrganizationId: parsed.data.assignedOrganizationId,
          assignedUserId: parsed.data.assignedUserId ?? null,
        },
      });
      if (updated.count === 0) throw new BadRequestException({ code: "fulfillment_task_concurrency_conflict" });
      await this.appendTaskEvent(tx, {
        taskId: task.id,
        eventType: "TASK_ASSIGNED",
        previousStatus: from,
        nextStatus: from,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
      });
    });

    const fresh = await this.loadTask(task.id);
    await this.publishTask(fresh, record, "relational.fulfillment.task_assigned", "TASK_ASSIGNED", "TASK_ASSIGNED");

    return this.assertActionResponse({
      taskId: task.id,
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      previousStatus: from,
      nextStatus: from,
      actionType: "TASK_ASSIGNED",
      eventCreated: true,
      eventType: "TASK_ASSIGNED",
      task: this.toTaskDto(fresh),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
  }

  private async transitionTask(input: {
    taskId: string;
    actorOrganizationId: string;
    actorUserId: string;
    to: RelationalFulfillmentTaskStatus;
    actionType: RelationalFulfillmentTaskActionTypeDto;
    journalEventType: RelationalFulfillmentTaskEventType;
    realtimeEventType: import("@venext/shared-contracts").RelationalFulfillmentTaskRealtimeEventType;
    extraPatch?: Prisma.RelationalFulfillmentTaskUpdateInput;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
    reopen?: boolean;
  }) {
    const task = await this.loadTask(input.taskId);
    const record = task.fulfillmentRecord;
    await this.assertParticipant(record, input.actorOrganizationId);
    await this.assertCorridor(record.relationshipId, input);
    const from = task.taskStatus;
    this.policy.assertTaskStatusTransitionAllowed(from, input.to, { reopen: input.reopen });

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.relationalFulfillmentTask.updateMany({
        where: { id: task.id, taskStatus: from },
        data: { taskStatus: input.to, ...input.extraPatch },
      });
      if (updated.count === 0) throw new BadRequestException({ code: "fulfillment_task_concurrency_conflict" });
      await this.appendTaskEvent(tx, {
        taskId: task.id,
        eventType: input.journalEventType,
        previousStatus: from,
        nextStatus: input.to,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
      });
    });

    const fresh = await this.loadTask(task.id);
    await this.publishTask(fresh, record, input.realtimeEventType, input.actionType, input.journalEventType);

    return this.assertActionResponse({
      taskId: task.id,
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      previousStatus: from,
      nextStatus: input.to,
      actionType: input.actionType,
      eventCreated: true,
      eventType: input.journalEventType,
      task: this.toTaskDto(fresh),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
  }

  async startTask(input: {
    taskId: string;
    actorOrganizationId: string;
    actorUserId: string;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    return this.transitionTask({
      ...input,
      to: "IN_PROGRESS",
      actionType: "TASK_STARTED",
      journalEventType: "TASK_STATUS_CHANGED",
      realtimeEventType: "relational.fulfillment.task_started",
    });
  }

  async blockTask(input: {
    taskId: string;
    actorOrganizationId: string;
    actorUserId: string;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    return this.transitionTask({
      ...input,
      to: "BLOCKED",
      actionType: "TASK_BLOCKED",
      journalEventType: "TASK_BLOCKED",
      realtimeEventType: "relational.fulfillment.task_blocked",
    });
  }

  async cancelTask(input: {
    taskId: string;
    actorOrganizationId: string;
    actorUserId: string;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    return this.transitionTask({
      ...input,
      to: "CANCELLED",
      actionType: "TASK_CANCELLED",
      journalEventType: "TASK_CANCELLED",
      realtimeEventType: "relational.fulfillment.task_cancelled",
      extraPatch: { cancelledAt: new Date() },
    });
  }

  async reopenTask(input: {
    taskId: string;
    actorOrganizationId: string;
    actorUserId: string;
    body: unknown;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    RelationalFulfillmentTaskReopenRequestSchema.safeParse(input.body ?? {});
    return this.transitionTask({
      ...input,
      to: "OPEN",
      actionType: "TASK_REOPENED",
      journalEventType: "TASK_REOPENED",
      realtimeEventType: "relational.fulfillment.task_reopened",
      extraPatch: { completedAt: null, cancelledAt: null },
      reopen: true,
    });
  }

  async completeTask(input: {
    taskId: string;
    actorOrganizationId: string;
    actorUserId: string;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    const task = await this.loadTask(input.taskId);
    const record = task.fulfillmentRecord;
    await this.assertParticipant(record, input.actorOrganizationId);
    await this.assertCorridor(record.relationshipId, input);
    if (this.policy.isTerminal(task.taskStatus)) {
      throw new BadRequestException({ code: "fulfillment_task_already_terminal" });
    }

    const now = new Date();
    const isBuyer = input.actorOrganizationId === record.buyerOrganizationId;
    const isSeller = input.actorOrganizationId === record.sellerOrganizationId;
    const buyerConfirmedAt =
      task.buyerConfirmedAt ?? (isBuyer && task.requiresBuyerConfirmation ? now : task.buyerConfirmedAt);
    const sellerConfirmedAt =
      task.sellerConfirmedAt ?? (isSeller && task.requiresSellerConfirmation ? now : task.sellerConfirmedAt);

    const confirmationsOk =
      (!task.requiresBuyerConfirmation || buyerConfirmedAt != null) &&
      (!task.requiresSellerConfirmation || sellerConfirmedAt != null);

    const to: RelationalFulfillmentTaskStatus = confirmationsOk ? "COMPLETED" : "WAITING_EXTERNAL_CONFIRMATION";
    const from = task.taskStatus;
    this.policy.assertTaskStatusTransitionAllowed(from, to);

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.relationalFulfillmentTask.updateMany({
        where: { id: task.id, taskStatus: from },
        data: {
          taskStatus: to,
          buyerConfirmedAt,
          sellerConfirmedAt,
          completedAt: to === "COMPLETED" ? now : null,
        },
      });
      if (updated.count === 0) throw new BadRequestException({ code: "fulfillment_task_concurrency_conflict" });
      await this.appendTaskEvent(tx, {
        taskId: task.id,
        eventType: to === "COMPLETED" ? "TASK_COMPLETED" : "TASK_STATUS_CHANGED",
        previousStatus: from,
        nextStatus: to,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        metadata: {
          buyerConfirmationSatisfied: !task.requiresBuyerConfirmation || buyerConfirmedAt != null,
          sellerConfirmationSatisfied: !task.requiresSellerConfirmation || sellerConfirmedAt != null,
        },
      });
    });

    const fresh = await this.loadTask(task.id);
    const rt =
      to === "COMPLETED" ? "relational.fulfillment.task_completed" : ("relational.fulfillment.task_started" as const);
    await this.publishTask(
      fresh,
      record,
      rt,
      to === "COMPLETED" ? "TASK_COMPLETED" : "TASK_STARTED",
      to === "COMPLETED" ? "TASK_COMPLETED" : "TASK_STATUS_CHANGED",
    );

    if (to === "COMPLETED") {
      void this.operationalIngestion.onTaskCompleted({
        relationshipId: record.relationshipId,
        orderId: record.orderId,
        taskId: task.id,
      });
    }

    return this.assertActionResponse({
      taskId: task.id,
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      previousStatus: from,
      nextStatus: to,
      actionType: to === "COMPLETED" ? "TASK_COMPLETED" : "TASK_STARTED",
      eventCreated: true,
      eventType: to === "COMPLETED" ? "TASK_COMPLETED" : "TASK_STATUS_CHANGED",
      task: this.toTaskDto(fresh),
      diagnostics: {
        confirmationsPending: !confirmationsOk,
        buyerConfirmationSatisfied: !task.requiresBuyerConfirmation || buyerConfirmedAt != null,
        sellerConfirmationSatisfied: !task.requiresSellerConfirmation || sellerConfirmedAt != null,
      },
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
  }

  async addTaskComment(input: {
    taskId: string;
    actorOrganizationId: string;
    actorUserId: string;
    body: unknown;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    const parsed = RelationalFulfillmentTaskCommentRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({ code: "fulfillment_task_comment_body_invalid" });
    }
    const task = await this.loadTask(input.taskId);
    const record = task.fulfillmentRecord;
    await this.assertParticipant(record, input.actorOrganizationId);
    await this.assertCorridor(record.relationshipId, input);

    await this.prisma.$transaction(async (tx) => {
      await this.appendTaskEvent(tx, {
        taskId: task.id,
        eventType: "TASK_COMMENT_ADDED",
        previousStatus: task.taskStatus,
        nextStatus: task.taskStatus,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        comment: parsed.data.comment,
      });
    });

    await this.publishTask(
      task,
      record,
      "relational.fulfillment.task_comment_added",
      "TASK_COMMENT_ADDED",
      "TASK_COMMENT_ADDED",
    );

    return this.assertActionResponse({
      taskId: task.id,
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      previousStatus: task.taskStatus,
      nextStatus: task.taskStatus,
      actionType: "TASK_COMMENT_ADDED",
      eventCreated: true,
      eventType: "TASK_COMMENT_ADDED",
      task: this.toTaskDto(task),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
  }
}
