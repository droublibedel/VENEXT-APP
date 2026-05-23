import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationshipStatus,
  type RelationalOrderExecutionEventType,
  type RelationalOrderExecutionStatus,
} from "@prisma/client";
import {
  RelationalOrderExecutionEventSchema,
  RelationalOrderExecutionSchema,
  RelationalOrderExecutionTransitionDiagnosticsSchema,
  RelationalOrderExecutionTransitionRequestSchema,
  RelationalOrderExecutionTransitionResponseSchema,
  type RelationalOrderExecutionTransitionResponseDto,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalFulfillmentService } from "../relational-fulfillment/relational-fulfillment.service";
import { RelationalOperationalIntelligenceIngestionService } from "../relational-operational-intelligence/relational-operational-intelligence-ingestion.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalOrderExecutionPolicyService } from "./relational-order-execution-policy.service";
import { RelationalOrderExecutionRealtimeService } from "./relational-order-execution-realtime.service";

function hoursBetween(a: Date, b: Date): number {
  return Math.round(((b.getTime() - a.getTime()) / 3_600_000) * 100) / 100;
}

@Injectable()
export class RelationalOrderExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalOrderExecutionPolicyService,
    private readonly corridorPolicy: RelationshipGovernancePolicyService,
    private readonly realtime: RelationalOrderExecutionRealtimeService,
    private readonly fulfillment: RelationalFulfillmentService,
    private readonly operationalIngestion: RelationalOperationalIntelligenceIngestionService,
  ) {}

  private assertTransitionResponse(
    raw: unknown,
    code: string,
  ): RelationalOrderExecutionTransitionResponseDto {
    const p = RelationalOrderExecutionTransitionResponseSchema.safeParse(raw);
    if (!p.success) {
      throw new BadRequestException({ code, issues: p.error.flatten() });
    }
    return p.data;
  }

  async getExecutionView(orderId: string, actorOrganizationId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        relationshipId: true,
        buyerOrganizationId: true,
        sellerOrganizationId: true,
        relationalOrderExecutionStatus: true,
        relationalExecutionEvents: { orderBy: { createdAt: "desc" }, take: 80 },
      },
    });
    if (!order) throw new NotFoundException(orderId);
    if (order.buyerOrganizationId !== actorOrganizationId && order.sellerOrganizationId !== actorOrganizationId) {
      throw new ForbiddenException({ code: "relational_order_execution_participant_only" });
    }
    const last = order.relationalExecutionEvents[0];
    const execution = {
      orderId: order.id,
      relationshipId: order.relationshipId,
      executionStatus: order.relationalOrderExecutionStatus,
      buyerOrganizationId: order.buyerOrganizationId,
      sellerOrganizationId: order.sellerOrganizationId,
      lastEventType: last?.eventType ?? null,
      lastTransitionAt: last?.createdAt.toISOString() ?? null,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const exParsed = RelationalOrderExecutionSchema.safeParse(execution);
    if (!exParsed.success) {
      throw new BadRequestException({ code: "relational_order_execution_contract_invalid", issues: exParsed.error.flatten() });
    }
    const events = order.relationalExecutionEvents
      .slice()
      .reverse()
      .map((e) => ({
        id: e.id,
        orderId: e.orderId,
        relationshipId: e.relationshipId,
        eventType: e.eventType,
        actorOrganizationId: e.actorOrganizationId,
        actorUserId: e.actorUserId,
        previousStatus: e.previousStatus,
        nextStatus: e.nextStatus,
        diagnostics: e.diagnostics ?? undefined,
        metadata: e.metadata ?? undefined,
        createdAt: e.createdAt.toISOString(),
      }));
    for (const ev of events) {
      const p = RelationalOrderExecutionEventSchema.safeParse(ev);
      if (!p.success) {
        throw new BadRequestException({ code: "relational_order_execution_event_contract_invalid", issues: p.error.flatten() });
      }
    }
    return { execution: exParsed.data, events };
  }

  private buildTransitionDiagnostics(input: {
    corridorStateAtExecution: string;
    governanceWarnings: string[];
    governanceWarningCodes: string[];
    executionDelayHours: number;
    from: RelationalOrderExecutionStatus;
    to: RelationalOrderExecutionStatus;
    eventType: RelationalOrderExecutionEventType;
  }): Record<string, unknown> {
    const base: Record<string, unknown> = {
      corridorExecutionGovernanceValidated: true,
      corridorStateAtExecution: input.corridorStateAtExecution,
      relationshipIdSource: "ORDER_RELATIONSHIP",
      relationshipIdConsistencyValidated: true,
      orderExecutionAllowed: true,
      orderExecutionWarningCodes: input.governanceWarningCodes,
      governanceWarnings: input.governanceWarnings,
      executionDelayHours: input.executionDelayHours,
    } as Record<string, unknown>;

    if (input.to === "COMPLETED" && input.from === "PARTIALLY_FULFILLED") {
      base.completionKind = "PARTIAL_FULFILLMENT_COMPLETED";
      base.fulfilledAsPartial = true;
      base.requiresFulfillmentReview = true;
      base.partialFulfillmentResolved = true;
    } else if (input.to === "COMPLETED" && input.from === "RECEIVED") {
      base.completionKind = "STANDARD_EXECUTION_COMPLETED";
      base.fulfilledAsPartial = false;
    } else if (input.to === "COMPLETED" && input.from === "RETURN_REVIEW") {
      base.completionKind = "STANDARD_EXECUTION_COMPLETED";
      base.fulfilledAsPartial = false;
    }

    if (input.eventType === "EXECUTION_BLOCKED") {
      base.haltKind = "OPERATIONAL_BLOCK";
      base.corridorExecutionBlockedReason = "relational_order_execution_operational_block";
    }
    if (input.eventType === "EXECUTION_CANCELLED") {
      base.haltKind = "ORDER_EXECUTION_CANCELLED";
      base.executionStopReason = "ORDER_EXECUTION_CANCELLED";
      base.semanticEventType = "EXECUTION_CANCELLED";
    }
    if (input.eventType === "RECEPTION_REJECTED") {
      base.haltKind = "RECEPTION_REJECTION";
    }
    if (input.eventType === "RETURN_REVIEW_REQUESTED") {
      base.haltKind = "RETURN_REVIEW_PATH";
    }

    return base;
  }

  async applyTransition(input: {
    orderId: string;
    actorOrganizationId: string;
    actorUserId: string;
    body: unknown;
    allowRestrictedOrderExecutionForBackoffice: boolean;
    allowDormantOrderExecution: boolean;
  }) {
    const parsedBody = RelationalOrderExecutionTransitionRequestSchema.safeParse(input.body ?? {});
    if (!parsedBody.success) {
      throw new BadRequestException({ code: "relational_order_execution_body_invalid", issues: parsedBody.error.flatten() });
    }
    const targetStatus = parsedBody.data.targetStatus;

    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      select: {
        id: true,
        relationshipId: true,
        buyerOrganizationId: true,
        sellerOrganizationId: true,
        relationalOrderExecutionStatus: true,
        createdAt: true,
        relationalExecutionEvents: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!order) throw new NotFoundException(input.orderId);
    if (order.buyerOrganizationId !== input.actorOrganizationId && order.sellerOrganizationId !== input.actorOrganizationId) {
      throw new ForbiddenException({ code: "relational_order_execution_participant_only" });
    }
    if (!order.relationshipId?.trim()) {
      throw new BadRequestException({ code: "relational_order_execution_relationship_id_missing" });
    }

    const relationship = await this.prisma.relationship.findUnique({
      where: { id: order.relationshipId },
      select: { id: true, status: true, corridorState: true },
    });
    if (!relationship) {
      throw new BadRequestException({ code: "relational_order_execution_relationship_row_missing" });
    }
    if (relationship.status !== RelationshipStatus.ACCEPTED) {
      throw new BadRequestException({ code: "relational_order_execution_relationship_not_accepted" });
    }

    const from = order.relationalOrderExecutionStatus;
    if (from === targetStatus) {
      const raw = {
        ok: true as const,
        idempotent: true,
        orderId: order.id,
        relationshipId: order.relationshipId,
        previousStatus: from,
        nextStatus: from,
        eventCreated: false,
        eventType: null,
        diagnostics: undefined,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
        realtimePublishAttempted: false,
        realtimePublished: false,
      };
      return this.assertTransitionResponse(raw, "relational_order_execution_transition_response_invalid");
    }

    this.policy.assertTransitionAllowed(from, targetStatus);
    const eventType = this.policy.resolveEventType(from, targetStatus);

    const governanceTelemetry = { warnings: [] as string[], governanceWarningCodes: [] as string[] };
    await this.corridorPolicy.assertCorridorOperational(order.relationshipId, "order_execution", {
      governanceTelemetry,
      allowRestrictedOrderExecutionForBackoffice: input.allowRestrictedOrderExecutionForBackoffice,
      allowDormantOrderExecution: input.allowDormantOrderExecution,
    });

    const now = new Date();
    const executionDelayHours = hoursBetween(order.createdAt, now);
    const diagnostics = this.buildTransitionDiagnostics({
      corridorStateAtExecution: relationship.corridorState,
      governanceWarnings: governanceTelemetry.warnings,
      governanceWarningCodes: governanceTelemetry.governanceWarningCodes,
      executionDelayHours,
      from,
      to: targetStatus,
      eventType,
    });
    const diagParsed = RelationalOrderExecutionTransitionDiagnosticsSchema.safeParse(diagnostics);
    if (!diagParsed.success) {
      throw new BadRequestException({ code: "relational_order_execution_transition_diagnostics_invalid", issues: diagParsed.error.flatten() });
    }

    const metadata: Prisma.InputJsonValue = {
      idempotencyKey: parsedBody.data.idempotencyKey ?? null,
    };

    await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.order.findUnique({
        where: { id: input.orderId },
        select: { relationalOrderExecutionStatus: true, relationshipId: true },
      });
      if (!fresh) throw new NotFoundException(input.orderId);
      if (fresh.relationshipId !== order.relationshipId) {
        throw new BadRequestException({ code: "relational_order_execution_relationship_id_drift" });
      }
      if (fresh.relationalOrderExecutionStatus !== from) {
        throw new BadRequestException({ code: "relational_order_execution_concurrency_conflict" });
      }
      if (fresh.relationalOrderExecutionStatus === targetStatus) {
        return;
      }
      await tx.order.update({
        where: { id: input.orderId },
        data: { relationalOrderExecutionStatus: targetStatus },
      });
      await tx.relationalOrderExecutionEvent.create({
        data: {
          orderId: input.orderId,
          relationshipId: order.relationshipId,
          eventType,
          actorOrganizationId: input.actorOrganizationId,
          actorUserId: input.actorUserId,
          previousStatus: from,
          nextStatus: targetStatus,
          diagnostics: diagParsed.data as unknown as Prisma.InputJsonValue,
          metadata,
        },
      });
      await this.fulfillment.ensureFulfillmentRecordForExecution(tx, input.orderId, targetStatus);
    });

    const realtimeDiagnostics =
      targetStatus === "COMPLETED" && (from === "PARTIALLY_FULFILLED" || from === "RECEIVED" || from === "RETURN_REVIEW")
        ? from === "PARTIALLY_FULFILLED"
          ? {
              completionKind: "PARTIAL_FULFILLMENT_COMPLETED" as const,
              fulfilledAsPartial: true,
              requiresFulfillmentReview: true,
              partialFulfillmentResolved: true,
            }
          : {
              completionKind: "STANDARD_EXECUTION_COMPLETED" as const,
              fulfilledAsPartial: false,
              requiresFulfillmentReview: false,
              partialFulfillmentResolved: false,
            }
        : undefined;

    const realtimePublished = await this.realtime.publishBothSides({
      buyerOrganizationId: order.buyerOrganizationId,
      sellerOrganizationId: order.sellerOrganizationId,
      orderId: order.id,
      relationshipId: order.relationshipId,
      nextStatus: targetStatus,
      eventType,
      diagnostics: realtimeDiagnostics,
    });

    const criticalExecution: RelationalOrderExecutionStatus[] = ["DISPATCHED", "RECEIVED", "COMPLETED"];
    if (criticalExecution.includes(targetStatus)) {
      void this.operationalIngestion.onExecutionTransition({
        relationshipId: order.relationshipId,
        orderId: order.id,
      });
    }

    const raw = {
      ok: true as const,
      idempotent: false,
      orderId: order.id,
      relationshipId: order.relationshipId,
      previousStatus: from,
      nextStatus: targetStatus,
      eventCreated: true,
      eventType,
      diagnostics: diagParsed.data,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
      realtimePublishAttempted: true,
      realtimePublished,
    };
    return this.assertTransitionResponse(raw, "relational_order_execution_transition_response_invalid");
  }
}
