import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  type RelationalFulfillmentEventType,
  type RelationalFulfillmentProofType,
  type RelationalFulfillmentStatus,
  type RelationalOrderExecutionStatus,
} from "@prisma/client";
import {
  RelationalFulfillmentActionResponseSchema,
  RelationalFulfillmentIncidentSchema,
  RelationalFulfillmentProofSchema,
  RelationalFulfillmentReportIncidentRequestSchema,
  RelationalFulfillmentSchema,
  RelationalFulfillmentSubmitProofRequestSchema,
  RelationalFulfillmentTransitionRequestSchema,
  RelationalFulfillmentValidateReceptionRequestSchema,
  RelationalFulfillmentViewResponseSchema,
  type RelationalFulfillmentActionResponseDto,
  type RelationalFulfillmentActionTypeDto,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { mapIncidentToDto, incidentBlocksCompletion } from "./relational-fulfillment-incident.mapper";
import {
  incidentSeverityClass,
  TERMINAL_FULFILLMENT_STATUSES,
  ALLOWED_PROOF_TYPES,
} from "./relational-fulfillment.types";
import { RelationalFulfillmentPolicyService } from "./relational-fulfillment-policy.service";
import { validateFulfillmentProofFileUrl } from "./relational-fulfillment-proof-url.validator";
import { RelationalOperationalIntelligenceIngestionService } from "../relational-operational-intelligence/relational-operational-intelligence-ingestion.service";
import { RelationalFulfillmentCoordinationService } from "./relational-fulfillment-coordination.service";
import { RelationalFulfillmentRealtimeService } from "./relational-fulfillment-realtime.service";

const EXECUTION_STATUSES_BLOCK_FULFILLMENT: RelationalOrderExecutionStatus[] = ["BLOCKED", "CANCELLED"];

const EXECUTION_STATUSES_ENSURE_FULFILLMENT: RelationalOrderExecutionStatus[] = ["READY_FOR_DISPATCH", "DISPATCHED"];

const EXECUTION_STATUSES_ALLOW_FULFILLMENT_COMPLETION: RelationalOrderExecutionStatus[] = ["RECEIVED", "COMPLETED"];

@Injectable()
export class RelationalFulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalFulfillmentPolicyService,
    private readonly corridorPolicy: RelationshipGovernancePolicyService,
    private readonly realtime: RelationalFulfillmentRealtimeService,
    private readonly coordination: RelationalFulfillmentCoordinationService,
    private readonly operationalIngestion: RelationalOperationalIntelligenceIngestionService,
  ) {}

  private assertActionResponse(raw: unknown, code: string): RelationalFulfillmentActionResponseDto {
    const p = RelationalFulfillmentActionResponseSchema.safeParse(raw);
    if (!p.success) {
      throw new BadRequestException({ code, issues: p.error.flatten() });
    }
    return p.data;
  }

  private toDto(row: {
    id: string;
    orderId: string;
    relationshipId: string;
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    fulfillmentStatus: RelationalFulfillmentStatus;
    proofRequired: boolean;
    proofValidated: boolean;
    receptionValidatedAt: Date | null;
    receptionValidationNotes: string | null;
    loadingConfirmedAt: Date | null;
    transferStartedAt: Date | null;
    arrivedAtDestinationAt: Date | null;
    fulfillmentCompletedAt: Date | null;
    blockedAt: Date | null;
    blockedReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      orderId: row.orderId,
      relationshipId: row.relationshipId,
      buyerOrganizationId: row.buyerOrganizationId,
      sellerOrganizationId: row.sellerOrganizationId,
      fulfillmentStatus: row.fulfillmentStatus,
      proofRequired: row.proofRequired,
      proofValidated: row.proofValidated,
      receptionValidatedAt: row.receptionValidatedAt?.toISOString() ?? null,
      receptionValidationNotes: row.receptionValidationNotes,
      loadingConfirmedAt: row.loadingConfirmedAt?.toISOString() ?? null,
      transferStartedAt: row.transferStartedAt?.toISOString() ?? null,
      arrivedAtDestinationAt: row.arrivedAtDestinationAt?.toISOString() ?? null,
      fulfillmentCompletedAt: row.fulfillmentCompletedAt?.toISOString() ?? null,
      blockedAt: row.blockedAt?.toISOString() ?? null,
      blockedReason: row.blockedReason,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /** Instruction 20.10 — shared with resolution service. */
  async appendEventPublic(
    tx: Prisma.TransactionClient,
    input: {
      fulfillmentRecordId: string;
      orderId: string;
      relationshipId: string;
      eventType: RelationalFulfillmentEventType;
      previousStatus: RelationalFulfillmentStatus | null;
      nextStatus: RelationalFulfillmentStatus | null;
      actorOrganizationId: string;
      actorUserId: string;
      diagnostics?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    return this.appendEvent(tx, input);
  }

  async assertOrderAllowsFulfillmentPublic(orderId: string) {
    return this.assertOrderAllowsFulfillment(orderId);
  }

  async assertFulfillmentOperationalPublic(
    relationshipId: string,
    opts: { allowRestrictedFulfillmentForBackoffice: boolean; allowDormantFulfillment: boolean },
  ): Promise<void> {
    return this.assertFulfillmentOperational(relationshipId, opts);
  }

  private async appendEvent(
    tx: Prisma.TransactionClient,
    input: {
      fulfillmentRecordId: string;
      orderId: string;
      relationshipId: string;
      eventType: RelationalFulfillmentEventType;
      previousStatus: RelationalFulfillmentStatus | null;
      nextStatus: RelationalFulfillmentStatus | null;
      actorOrganizationId: string;
      actorUserId: string;
      diagnostics?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await tx.relationalFulfillmentEvent.create({
      data: {
        fulfillmentRecordId: input.fulfillmentRecordId,
        orderId: input.orderId,
        relationshipId: input.relationshipId,
        eventType: input.eventType,
        previousStatus: input.previousStatus,
        nextStatus: input.nextStatus,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: (input.diagnostics ?? {}) as Prisma.InputJsonValue,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  /** Instruction 20.10 — unresolved blocking incidents prevent completion. */
  private async countUnresolvedBlockingIncidents(
    tx: Prisma.TransactionClient,
    fulfillmentRecordId: string,
  ): Promise<number> {
    const incidents = await tx.relationalFulfillmentIncident.findMany({
      where: { fulfillmentRecordId },
      select: { incidentType: true, metadata: true, resolutionStatus: true },
    });
    return incidents.filter((i) => incidentBlocksCompletion(i)).length;
  }

  /**
   * Instruction 20.9 — create fulfillment row when execution reaches dispatch readiness (transactional).
   */
  async ensureFulfillmentRecordForExecution(
    tx: Prisma.TransactionClient,
    orderId: string,
    executionStatus: RelationalOrderExecutionStatus,
  ): Promise<void> {
    if (!EXECUTION_STATUSES_ENSURE_FULFILLMENT.includes(executionStatus)) return;
    if (EXECUTION_STATUSES_BLOCK_FULFILLMENT.includes(executionStatus)) return;

    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        relationshipId: true,
        buyerOrganizationId: true,
        sellerOrganizationId: true,
        relationalOrderExecutionStatus: true,
      },
    });
    if (!order?.relationshipId?.trim()) return;
    if (EXECUTION_STATUSES_BLOCK_FULFILLMENT.includes(order.relationalOrderExecutionStatus)) return;

    const existing = await tx.relationalFulfillmentRecord.findUnique({ where: { orderId } });
    if (existing) return;

    await tx.relationalFulfillmentRecord.create({
      data: {
        orderId: order.id,
        relationshipId: order.relationshipId,
        buyerOrganizationId: order.buyerOrganizationId,
        sellerOrganizationId: order.sellerOrganizationId,
        fulfillmentStatus: "PREPARING_FULFILLMENT",
        proofRequired: true,
        proofValidated: false,
        diagnostics: {
          fulfillmentRecordSource: "ORDER_EXECUTION_DISPATCH_READINESS",
          relationshipIdSource: "ORDER_RELATIONSHIP",
          relationshipIdConsistencyValidated: true,
        } as Prisma.InputJsonValue,
      },
    });
  }

  async getViewByOrderId(orderId: string, actorOrganizationId: string) {
    const record = await this.prisma.relationalFulfillmentRecord.findUnique({
      where: { orderId },
      include: { proofs: { orderBy: { createdAt: "desc" }, take: 50 }, incidents: { orderBy: { createdAt: "desc" }, take: 50 } },
    });
    if (!record) throw new NotFoundException({ code: "relational_fulfillment_not_found", orderId });
    if (record.buyerOrganizationId !== actorOrganizationId && record.sellerOrganizationId !== actorOrganizationId) {
      throw new ForbiddenException({ code: "relational_fulfillment_participant_only" });
    }
    return this.buildView(record);
  }

  async getView(recordId: string, actorOrganizationId: string) {
    const record = await this.prisma.relationalFulfillmentRecord.findUnique({
      where: { id: recordId },
      include: { proofs: { orderBy: { createdAt: "desc" }, take: 50 }, incidents: { orderBy: { createdAt: "desc" }, take: 50 } },
    });
    if (!record) throw new NotFoundException(recordId);
    if (record.buyerOrganizationId !== actorOrganizationId && record.sellerOrganizationId !== actorOrganizationId) {
      throw new ForbiddenException({ code: "relational_fulfillment_participant_only" });
    }
    return this.buildView(record);
  }

  private buildView(record: {
    id: string;
    orderId: string;
    relationshipId: string;
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    fulfillmentStatus: RelationalFulfillmentStatus;
    proofRequired: boolean;
    proofValidated: boolean;
    receptionValidatedAt: Date | null;
    receptionValidationNotes: string | null;
    loadingConfirmedAt: Date | null;
    transferStartedAt: Date | null;
    arrivedAtDestinationAt: Date | null;
    fulfillmentCompletedAt: Date | null;
    blockedAt: Date | null;
    blockedReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    proofs: { id: string; fulfillmentRecordId: string; proofType: RelationalFulfillmentProofType; uploadedByOrganizationId: string; uploadedByUserId: string; fileUrl: string; createdAt: Date }[];
    incidents: import("@prisma/client").RelationalFulfillmentIncident[];
  }) {
    const fulfillment = this.toDto(record);
    const fParsed = RelationalFulfillmentSchema.safeParse(fulfillment);
    if (!fParsed.success) {
      throw new BadRequestException({ code: "relational_fulfillment_contract_invalid" });
    }
    const proofs = record.proofs.map((p) => ({
      id: p.id,
      fulfillmentRecordId: p.fulfillmentRecordId,
      proofType: p.proofType,
      uploadedByOrganizationId: p.uploadedByOrganizationId,
      uploadedByUserId: p.uploadedByUserId,
      fileUrl: p.fileUrl,
      createdAt: p.createdAt.toISOString(),
    }));
    const incidents = record.incidents.map((i) => mapIncidentToDto(i));
    for (const p of proofs) {
      if (!RelationalFulfillmentProofSchema.safeParse(p).success) {
        throw new BadRequestException({ code: "relational_fulfillment_proof_contract_invalid" });
      }
    }
    for (const i of incidents) {
      if (!RelationalFulfillmentIncidentSchema.safeParse(i).success) {
        throw new BadRequestException({ code: "relational_fulfillment_incident_contract_invalid" });
      }
    }
    const view = { fulfillment: fParsed.data, proofs, incidents };
    const parsed = RelationalFulfillmentViewResponseSchema.safeParse(view);
    if (!parsed.success) {
      throw new BadRequestException({ code: "relational_fulfillment_view_contract_invalid" });
    }
    return parsed.data;
  }

  private async assertFulfillmentOperational(
    relationshipId: string,
    opts: {
      allowRestrictedFulfillmentForBackoffice: boolean;
      allowDormantFulfillment: boolean;
    },
  ): Promise<void> {
    await this.corridorPolicy.assertCorridorOperational(relationshipId, "fulfillment_execution", {
      allowRestrictedOrderExecutionForBackoffice: opts.allowRestrictedFulfillmentForBackoffice,
      allowDormantOrderExecution: opts.allowDormantFulfillment,
    });
  }

  private async assertOrderAllowsFulfillment(orderId: string): Promise<{
    relationalOrderExecutionStatus: RelationalOrderExecutionStatus;
    relationshipId: string;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { relationalOrderExecutionStatus: true, relationshipId: true },
    });
    if (!order?.relationshipId) {
      throw new BadRequestException({ code: "relational_fulfillment_order_relationship_missing" });
    }
    if (EXECUTION_STATUSES_BLOCK_FULFILLMENT.includes(order.relationalOrderExecutionStatus)) {
      throw new BadRequestException({ code: "relational_fulfillment_order_execution_blocked" });
    }
    return { relationalOrderExecutionStatus: order.relationalOrderExecutionStatus, relationshipId: order.relationshipId };
  }

  private stampStatusTimestamps(
    from: RelationalFulfillmentStatus,
    to: RelationalFulfillmentStatus,
    now: Date,
  ): Prisma.RelationalFulfillmentRecordUpdateInput {
    const patch: Prisma.RelationalFulfillmentRecordUpdateInput = { fulfillmentStatus: to };
    if (to === "LOADING_CONFIRMED" && from !== "LOADING_CONFIRMED") patch.loadingConfirmedAt = now;
    if (to === "IN_TRANSFER" && from !== "IN_TRANSFER") patch.transferStartedAt = now;
    if (to === "ARRIVED_AT_DESTINATION" && from !== "ARRIVED_AT_DESTINATION") patch.arrivedAtDestinationAt = now;
    if (to === "FULFILLMENT_COMPLETED") patch.fulfillmentCompletedAt = now;
    if (to === "FULFILLMENT_BLOCKED") {
      patch.blockedAt = now;
    }
    return patch;
  }

  private buildActionResponse(input: {
    fulfillmentRecordId: string;
    orderId: string;
    relationshipId: string;
    previousStatus: RelationalFulfillmentStatus | null;
    nextStatus: RelationalFulfillmentStatus;
    actionType: RelationalFulfillmentActionTypeDto;
    eventCreated: boolean;
    eventType: RelationalFulfillmentEventType | null;
    diagnostics?: Record<string, unknown>;
  }): RelationalFulfillmentActionResponseDto {
    return this.assertActionResponse(
      {
        fulfillmentRecordId: input.fulfillmentRecordId,
        orderId: input.orderId,
        relationshipId: input.relationshipId,
        previousStatus: input.previousStatus,
        nextStatus: input.nextStatus,
        actionType: input.actionType,
        eventCreated: input.eventCreated,
        eventType: input.eventType,
        diagnostics: input.diagnostics,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      },
      "relational_fulfillment_action_response_invalid",
    );
  }

  async applyTransition(input: {
    recordId: string;
    actorOrganizationId: string;
    actorUserId: string;
    body: unknown;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    const parsedBody = RelationalFulfillmentTransitionRequestSchema.safeParse(input.body ?? {});
    if (!parsedBody.success) {
      throw new BadRequestException({ code: "relational_fulfillment_body_invalid", issues: parsedBody.error.flatten() });
    }
    const targetStatus = parsedBody.data.targetStatus;
    this.policy.assertGenericTransitionTargetAllowed(targetStatus);

    const record = await this.prisma.relationalFulfillmentRecord.findUnique({ where: { id: input.recordId } });
    if (!record) throw new NotFoundException(input.recordId);
    if (record.buyerOrganizationId !== input.actorOrganizationId && record.sellerOrganizationId !== input.actorOrganizationId) {
      throw new ForbiddenException({ code: "relational_fulfillment_participant_only" });
    }

    await this.assertOrderAllowsFulfillment(record.orderId);
    await this.assertFulfillmentOperational(record.relationshipId, {
      allowRestrictedFulfillmentForBackoffice: input.allowRestrictedFulfillmentForBackoffice,
      allowDormantFulfillment: input.allowDormantFulfillment,
    });

    const from = record.fulfillmentStatus;
    if (from === targetStatus) {
      return this.buildActionResponse({
        fulfillmentRecordId: record.id,
        orderId: record.orderId,
        relationshipId: record.relationshipId,
        previousStatus: from,
        nextStatus: from,
        actionType: "TRANSITION",
        eventCreated: false,
        eventType: null,
        diagnostics: { idempotent: true },
      });
    }

    this.policy.assertTransitionAllowed(from, targetStatus);
    const now = new Date();
    const patch = this.stampStatusTimestamps(from, targetStatus, now);

    let eventCreated = false;
    await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.relationalFulfillmentRecord.findUnique({ where: { id: record.id } });
      if (!fresh) throw new NotFoundException(input.recordId);
      if (fresh.fulfillmentStatus !== from) {
        throw new BadRequestException({ code: "fulfillment_concurrency_conflict" });
      }
      if (fresh.fulfillmentStatus === targetStatus) return;

      const updated = await tx.relationalFulfillmentRecord.updateMany({
        where: { id: record.id, fulfillmentStatus: from },
        data: patch,
      });
      if (updated.count === 0) {
        throw new BadRequestException({ code: "fulfillment_concurrency_conflict" });
      }

      await this.appendEvent(tx, {
        fulfillmentRecordId: record.id,
        orderId: record.orderId,
        relationshipId: record.relationshipId,
        eventType: targetStatus === "FULFILLMENT_BLOCKED" ? "FULFILLMENT_BLOCKED" : "FULFILLMENT_TRANSITIONED",
        previousStatus: from,
        nextStatus: targetStatus,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: { genericTransition: true },
      });
      eventCreated = true;
    });

    await this.realtime.publishStatusBothSides({
      buyerOrganizationId: record.buyerOrganizationId,
      sellerOrganizationId: record.sellerOrganizationId,
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      fulfillmentStatus: targetStatus,
    });

    return this.buildActionResponse({
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      previousStatus: from,
      nextStatus: targetStatus,
      actionType: "TRANSITION",
      eventCreated,
      eventType: eventCreated ? (targetStatus === "FULFILLMENT_BLOCKED" ? "FULFILLMENT_BLOCKED" : "FULFILLMENT_TRANSITIONED") : null,
    });
  }

  async submitReceptionProof(input: {
    recordId: string;
    actorOrganizationId: string;
    actorUserId: string;
    body: unknown;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    const parsed = RelationalFulfillmentSubmitProofRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({ code: "relational_fulfillment_proof_body_invalid" });
    }
    if (!ALLOWED_PROOF_TYPES.includes(parsed.data.proofType)) {
      throw new BadRequestException({ code: "relational_fulfillment_proof_type_rejected", proofTypeAccepted: false });
    }

    const urlCheck = validateFulfillmentProofFileUrl(parsed.data.fileUrl);
    if (!urlCheck.ok) {
      throw new BadRequestException({
        code: "fulfillment_proof_file_url_not_allowed",
        proofUrlValidated: false,
        proofUrlValidationMode: null,
        proofUrlRejectedReason: urlCheck.reason,
      });
    }

    const record = await this.prisma.relationalFulfillmentRecord.findUnique({ where: { id: input.recordId } });
    if (!record) throw new NotFoundException(input.recordId);
    if (record.buyerOrganizationId !== input.actorOrganizationId && record.sellerOrganizationId !== input.actorOrganizationId) {
      throw new ForbiddenException({ code: "relational_fulfillment_participant_only" });
    }
    if (TERMINAL_FULFILLMENT_STATUSES.includes(record.fulfillmentStatus)) {
      throw new BadRequestException({ code: "relational_fulfillment_terminal_no_proof" });
    }

    await this.assertOrderAllowsFulfillment(record.orderId);
    await this.assertFulfillmentOperational(record.relationshipId, {
      allowRestrictedFulfillmentForBackoffice: input.allowRestrictedFulfillmentForBackoffice,
      allowDormantFulfillment: input.allowDormantFulfillment,
    });

    const status = record.fulfillmentStatus;
    let proofId = "";
    await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.relationalFulfillmentRecord.findUnique({ where: { id: record.id } });
      if (!fresh) throw new NotFoundException(input.recordId);
      if (TERMINAL_FULFILLMENT_STATUSES.includes(fresh.fulfillmentStatus)) {
        throw new BadRequestException({ code: "relational_fulfillment_terminal_no_proof" });
      }

      const proof = await tx.relationalFulfillmentProof.create({
        data: {
          fulfillmentRecordId: record.id,
          proofType: parsed.data.proofType,
          uploadedByOrganizationId: input.actorOrganizationId,
          uploadedByUserId: input.actorUserId,
          fileUrl: parsed.data.fileUrl,
          metadata: {
            proofSubmissionValidated: true,
            proofTypeAccepted: parsed.data.proofType,
            proofAccepted: true,
            proofUrlValidated: true,
            proofUrlValidationMode: urlCheck.mode,
          } as Prisma.InputJsonValue,
        },
      });
      proofId = proof.id;

      await this.appendEvent(tx, {
        fulfillmentRecordId: record.id,
        orderId: record.orderId,
        relationshipId: record.relationshipId,
        eventType: "FULFILLMENT_PROOF_SUBMITTED",
        previousStatus: fresh.fulfillmentStatus,
        nextStatus: fresh.fulfillmentStatus,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: {
          proofUrlValidated: true,
          proofUrlValidationMode: urlCheck.mode,
          proofId: proof.id,
        },
      });
    });

    await this.realtime.publishActionBothSides({
      buyerOrganizationId: record.buyerOrganizationId,
      sellerOrganizationId: record.sellerOrganizationId,
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      fulfillmentStatus: status,
      actionType: "PROOF_SUBMITTED",
      journalEventType: "FULFILLMENT_PROOF_SUBMITTED",
      realtimeEventType: "relational.fulfillment.proof_submitted",
    });

    return this.buildActionResponse({
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      previousStatus: status,
      nextStatus: status,
      actionType: "PROOF_SUBMITTED",
      eventCreated: true,
      eventType: "FULFILLMENT_PROOF_SUBMITTED",
      diagnostics: {
        proofId,
        proofUrlValidated: true,
        proofUrlValidationMode: urlCheck.mode,
      },
    });
  }

  async validateReception(input: {
    recordId: string;
    actorOrganizationId: string;
    actorUserId: string;
    body: unknown;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    const parsed = RelationalFulfillmentValidateReceptionRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({ code: "relational_fulfillment_validate_body_invalid" });
    }

    const record = await this.prisma.relationalFulfillmentRecord.findUnique({
      where: { id: input.recordId },
      include: { proofs: true },
    });
    if (!record) throw new NotFoundException(input.recordId);
    if (record.buyerOrganizationId !== input.actorOrganizationId) {
      throw new ForbiddenException({ code: "relational_fulfillment_buyer_validation_only" });
    }
    if (TERMINAL_FULFILLMENT_STATUSES.includes(record.fulfillmentStatus)) {
      throw new BadRequestException({ code: "relational_fulfillment_terminal_no_validation" });
    }
    if (!this.policy.canValidateReception(record.fulfillmentStatus)) {
      throw new BadRequestException({
        code: "relational_fulfillment_reception_validation_requires_arrival",
        proofSubmissionRejectedReason: "status_not_arrived",
      });
    }

    const acceptedProofs = record.proofs.filter((p) => {
      const meta = p.metadata as { proofAccepted?: boolean } | null;
      return meta?.proofAccepted !== false;
    });
    if (record.proofRequired && acceptedProofs.length === 0) {
      throw new BadRequestException({
        code: "relational_fulfillment_proof_required_before_validation",
        proofSubmissionRejectedReason: "missing_proof",
        proofRequirementSatisfied: false,
      });
    }

    await this.assertOrderAllowsFulfillment(record.orderId);
    await this.assertFulfillmentOperational(record.relationshipId, {
      allowRestrictedFulfillmentForBackoffice: input.allowRestrictedFulfillmentForBackoffice,
      allowDormantFulfillment: input.allowDormantFulfillment,
    });

    const from = record.fulfillmentStatus;
    const now = new Date();
    const proofRequirementSatisfied = !record.proofRequired || acceptedProofs.length > 0;

    await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.relationalFulfillmentRecord.findUnique({ where: { id: record.id } });
      if (!fresh) throw new NotFoundException(input.recordId);
      if (TERMINAL_FULFILLMENT_STATUSES.includes(fresh.fulfillmentStatus)) {
        throw new BadRequestException({ code: "relational_fulfillment_terminal_no_validation" });
      }
      if (!this.policy.canValidateReception(fresh.fulfillmentStatus)) {
        throw new BadRequestException({ code: "relational_fulfillment_reception_validation_requires_arrival" });
      }

      const updated = await tx.relationalFulfillmentRecord.updateMany({
        where: {
          id: record.id,
          fulfillmentStatus: { in: ["ARRIVED_AT_DESTINATION", "RECEPTION_PENDING_VALIDATION"] },
        },
        data: {
          fulfillmentStatus: "RECEPTION_VALIDATED",
          proofValidated: true,
          receptionValidatedAt: now,
          receptionValidatedByUserId: input.actorUserId,
          receptionValidationNotes: parsed.data.notes ?? null,
        },
      });
      if (updated.count === 0) {
        throw new BadRequestException({ code: "fulfillment_concurrency_conflict" });
      }

      await this.appendEvent(tx, {
        fulfillmentRecordId: record.id,
        orderId: record.orderId,
        relationshipId: record.relationshipId,
        eventType: "RECEPTION_VALIDATED",
        previousStatus: from,
        nextStatus: "RECEPTION_VALIDATED",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: {
          receptionValidatedByBuyer: true,
          proofRequirementSatisfied,
          receptionValidationEndpointUsed: true,
        },
      });
    });

    const completion = await this.completeFulfillmentIfExecutionAligned({
      orderId: record.orderId,
      recordId: record.id,
      actorOrganizationId: input.actorOrganizationId,
      actorUserId: input.actorUserId,
      allowRestrictedFulfillmentForBackoffice: input.allowRestrictedFulfillmentForBackoffice,
      allowDormantFulfillment: input.allowDormantFulfillment,
    });

    await this.realtime.publishActionBothSides({
      buyerOrganizationId: record.buyerOrganizationId,
      sellerOrganizationId: record.sellerOrganizationId,
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      fulfillmentStatus: completion.completed ? "FULFILLMENT_COMPLETED" : "RECEPTION_VALIDATED",
      actionType: "RECEPTION_VALIDATED",
      journalEventType: "RECEPTION_VALIDATED",
      realtimeEventType: "relational.fulfillment.reception_validated",
    });

    void this.operationalIngestion.onReceptionValidated({
      relationshipId: record.relationshipId,
      orderId: record.orderId,
      fulfillmentRecordId: record.id,
    });
    if (completion.completed) {
      void this.operationalIngestion.onFulfillmentCompleted({
        relationshipId: record.relationshipId,
        orderId: record.orderId,
        fulfillmentRecordId: record.id,
      });
    }

    return this.buildActionResponse({
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      previousStatus: from,
      nextStatus: completion.completed ? "FULFILLMENT_COMPLETED" : "RECEPTION_VALIDATED",
      actionType: "RECEPTION_VALIDATED",
      eventCreated: true,
      eventType: "RECEPTION_VALIDATED",
      diagnostics: {
        receptionValidatedByBuyer: true,
        proofRequirementSatisfied,
        receptionValidationEndpointUsed: true,
        fulfillmentCompletedAfterValidation: completion.completed,
      },
    });
  }

  async completeFulfillmentIfExecutionAligned(input: {
    orderId: string;
    recordId: string;
    actorOrganizationId: string;
    actorUserId: string;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }): Promise<{
    completed: boolean;
    diagnostics: Record<string, unknown>;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      select: { relationalOrderExecutionStatus: true, relationshipId: true },
    });
    const executionStatus = order?.relationalOrderExecutionStatus ?? "CREATED";
    if (!EXECUTION_STATUSES_ALLOW_FULFILLMENT_COMPLETION.includes(executionStatus)) {
      return {
        completed: false,
        diagnostics: {
          fulfillmentCompletionSource: "EXECUTION_ALIGNMENT",
          executionStatusAtCompletion: executionStatus,
          alignmentRejectedReason: "execution_not_received_or_completed",
        },
      };
    }

    const record = await this.prisma.relationalFulfillmentRecord.findUnique({ where: { id: input.recordId } });
    const completableStatuses: RelationalFulfillmentStatus[] = ["RECEPTION_VALIDATED", "RECEPTION_PARTIALLY_VALIDATED"];
    if (!record || !completableStatuses.includes(record.fulfillmentStatus)) {
      return {
        completed: false,
        diagnostics: {
          fulfillmentCompletionSource: "EXECUTION_ALIGNMENT",
          executionStatusAtCompletion: executionStatus,
          alignmentRejectedReason: "fulfillment_not_reception_validated_or_partial",
        },
      };
    }

    if (record.proofRequired && !record.proofValidated) {
      return {
        completed: false,
        diagnostics: {
          fulfillmentCompletionSource: "EXECUTION_ALIGNMENT",
          executionStatusAtCompletion: executionStatus,
          proofValidatedAtCompletion: false,
          alignmentRejectedReason: "proof_not_validated",
        },
      };
    }

    const blockingIncidentsCount = await this.countUnresolvedBlockingIncidents(this.prisma, input.recordId);
    const blockingTasks = await this.coordination.countBlockingOpenTasks(this.prisma, input.recordId);
    if (blockingIncidentsCount > 0 || blockingTasks.count > 0) {
      return {
        completed: false,
        diagnostics: {
          fulfillmentCompletionSource: "EXECUTION_ALIGNMENT",
          executionStatusAtCompletion: executionStatus,
          proofValidatedAtCompletion: record.proofValidated,
          blockingIncidentsCount,
          blockingTasksCount: blockingTasks.count,
          blockingTaskIds: blockingTasks.taskIds,
          alignmentRejectedReason:
            blockingTasks.count > 0 ? "blocking_tasks" : "blocking_incidents",
        },
      };
    }

    if (!order?.relationshipId) {
      throw new BadRequestException({ code: "relational_fulfillment_order_relationship_missing" });
    }

    await this.assertFulfillmentOperational(order.relationshipId, {
      allowRestrictedFulfillmentForBackoffice: input.allowRestrictedFulfillmentForBackoffice,
      allowDormantFulfillment: input.allowDormantFulfillment,
    });

    const from = record.fulfillmentStatus;
    let completed = false;
    await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.relationalFulfillmentRecord.findUnique({ where: { id: input.recordId } });
      if (!fresh || !completableStatuses.includes(fresh.fulfillmentStatus)) return;

      const blocking = await this.countUnresolvedBlockingIncidents(tx, input.recordId);
      const blockingTasks = await this.coordination.countBlockingOpenTasks(tx, input.recordId);
      if (blocking > 0 || blockingTasks.count > 0) return;

      const updated = await tx.relationalFulfillmentRecord.updateMany({
        where: {
          id: input.recordId,
          fulfillmentStatus: { in: completableStatuses },
        },
        data: { fulfillmentStatus: "FULFILLMENT_COMPLETED", fulfillmentCompletedAt: new Date() },
      });
      if (updated.count === 0) return;

      await this.appendEvent(tx, {
        fulfillmentRecordId: input.recordId,
        orderId: input.orderId,
        relationshipId: record.relationshipId,
        eventType: "FULFILLMENT_COMPLETED",
        previousStatus: from,
        nextStatus: "FULFILLMENT_COMPLETED",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: {
          fulfillmentCompletionSource: "EXECUTION_ALIGNMENT",
          executionStatusAtCompletion: executionStatus,
          proofValidatedAtCompletion: fresh.proofValidated,
          blockingIncidentsCount: 0,
          blockingTasksCount: 0,
        },
      });
      completed = true;
    });

    if (completed) {
      await this.realtime.publishActionBothSides({
        buyerOrganizationId: record.buyerOrganizationId,
        sellerOrganizationId: record.sellerOrganizationId,
        fulfillmentRecordId: record.id,
        orderId: record.orderId,
        relationshipId: record.relationshipId,
        fulfillmentStatus: "FULFILLMENT_COMPLETED",
        actionType: "FULFILLMENT_COMPLETED",
        journalEventType: "FULFILLMENT_COMPLETED",
        realtimeEventType: "relational.fulfillment.completed",
      });
      void this.operationalIngestion.onFulfillmentCompleted({
        relationshipId: record.relationshipId,
        orderId: record.orderId,
        fulfillmentRecordId: record.id,
      });
    }

    return {
      completed,
      diagnostics: {
        fulfillmentCompletionSource: "EXECUTION_ALIGNMENT",
        executionStatusAtCompletion: executionStatus,
        proofValidatedAtCompletion: record.proofValidated,
        blockingIncidentsCount,
        blockingTasksCount: blockingTasks.count,
      },
    };
  }

  async reportIncident(input: {
    recordId: string;
    actorOrganizationId: string;
    actorUserId: string;
    body: unknown;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    const parsed = RelationalFulfillmentReportIncidentRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({ code: "relational_fulfillment_incident_body_invalid" });
    }

    const record = await this.prisma.relationalFulfillmentRecord.findUnique({ where: { id: input.recordId } });
    if (!record) throw new NotFoundException(input.recordId);
    if (record.buyerOrganizationId !== input.actorOrganizationId && record.sellerOrganizationId !== input.actorOrganizationId) {
      throw new ForbiddenException({ code: "relational_fulfillment_participant_only" });
    }
    if (TERMINAL_FULFILLMENT_STATUSES.includes(record.fulfillmentStatus)) {
      throw new BadRequestException({ code: "relational_fulfillment_terminal_no_incident" });
    }

    await this.assertOrderAllowsFulfillment(record.orderId);
    await this.assertFulfillmentOperational(record.relationshipId, {
      allowRestrictedFulfillmentForBackoffice: input.allowRestrictedFulfillmentForBackoffice,
      allowDormantFulfillment: input.allowDormantFulfillment,
    });

    const incidentType = parsed.data.incidentType;
    const severityClass = incidentSeverityClass(incidentType);
    const incidentBlocking = severityClass === "BLOCKING";
    const blocksFulfillmentCompletion =
      incidentBlocking || incidentType === "PARTIAL_RECEPTION";

    let nextStatus: RelationalFulfillmentStatus = record.fulfillmentStatus;
    if (incidentType === "PARTIAL_RECEPTION") {
      nextStatus = "RECEPTION_PARTIALLY_VALIDATED";
    } else if (incidentBlocking) {
      nextStatus = "INCIDENT_REPORTED";
    }

    const from = record.fulfillmentStatus;
    let incidentId = "";

    await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.relationalFulfillmentRecord.findUnique({ where: { id: record.id } });
      if (!fresh) throw new NotFoundException(input.recordId);
      if (TERMINAL_FULFILLMENT_STATUSES.includes(fresh.fulfillmentStatus)) {
        throw new BadRequestException({ code: "relational_fulfillment_terminal_no_incident" });
      }

      const incident = await tx.relationalFulfillmentIncident.create({
        data: {
          fulfillmentRecordId: record.id,
          incidentType,
          reportedByOrganizationId: input.actorOrganizationId,
          reportedByUserId: input.actorUserId,
          description: parsed.data.description,
          severity: parsed.data.severity ?? "MEDIUM",
          resolutionStatus: "OPEN",
          metadata: {
            incidentBlocking,
            blocksFulfillmentCompletion,
            incidentSeverityClass: severityClass,
          } as Prisma.InputJsonValue,
        },
      });
      incidentId = incident.id;

      if (nextStatus !== fresh.fulfillmentStatus) {
        const updated = await tx.relationalFulfillmentRecord.updateMany({
          where: { id: record.id, fulfillmentStatus: fresh.fulfillmentStatus },
          data: {
            fulfillmentStatus: nextStatus,
            diagnostics: {
              lastIncidentType: incidentType,
              incidentReportedAt: new Date().toISOString(),
              incidentBlocking,
              blocksFulfillmentCompletion,
            } as Prisma.InputJsonValue,
          },
        });
        if (updated.count === 0) {
          throw new BadRequestException({ code: "fulfillment_concurrency_conflict" });
        }
      }

      await this.appendEvent(tx, {
        fulfillmentRecordId: record.id,
        orderId: record.orderId,
        relationshipId: record.relationshipId,
        eventType: "INCIDENT_REPORTED",
        previousStatus: from,
        nextStatus,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: {
          incidentBlocking,
          blocksFulfillmentCompletion,
          incidentSeverityClass: severityClass,
          incidentId: incident.id,
        },
      });
    });

    await this.realtime.publishActionBothSides({
      buyerOrganizationId: record.buyerOrganizationId,
      sellerOrganizationId: record.sellerOrganizationId,
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      fulfillmentStatus: nextStatus,
      actionType: "INCIDENT_REPORTED",
      journalEventType: "INCIDENT_REPORTED",
      realtimeEventType: "relational.fulfillment.incident_reported",
    });

    return this.buildActionResponse({
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      previousStatus: from,
      nextStatus,
      actionType: "INCIDENT_REPORTED",
      eventCreated: true,
      eventType: "INCIDENT_REPORTED",
      diagnostics: {
        incidentId,
        incidentBlocking,
        blocksFulfillmentCompletion,
        incidentSeverityClass: severityClass,
      },
    });
  }
}
