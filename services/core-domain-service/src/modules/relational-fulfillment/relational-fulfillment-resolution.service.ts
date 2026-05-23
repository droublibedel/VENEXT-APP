import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  type RelationalFulfillmentEventType,
  type RelationalFulfillmentIncidentResolutionStatus,
  type RelationalFulfillmentStatus,
} from "@prisma/client";
import {
  RelationalFulfillmentActionResponseSchema,
  RelationalFulfillmentIncidentResolutionProposalRequestSchema,
  RelationalFulfillmentPartialReceptionRequestSchema,
  RelationalFulfillmentRejectReceptionRequestSchema,
  type RelationalFulfillmentActionResponseDto,
  type RelationalFulfillmentActionTypeDto,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { incidentBlocksCompletion } from "./relational-fulfillment-incident.mapper";
import { RelationalFulfillmentRealtimeService } from "./relational-fulfillment-realtime.service";
import { TERMINAL_FULFILLMENT_STATUSES } from "./relational-fulfillment.types";
import { RelationalOperationalIntelligenceIngestionService } from "../relational-operational-intelligence/relational-operational-intelligence-ingestion.service";
import { RelationalFulfillmentService } from "./relational-fulfillment.service";

const ARRIVAL_PHASE: RelationalFulfillmentStatus[] = ["ARRIVED_AT_DESTINATION", "RECEPTION_PENDING_VALIDATION"];

@Injectable()
export class RelationalFulfillmentResolutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RelationalFulfillmentRealtimeService,
    private readonly fulfillment: RelationalFulfillmentService,
    private readonly operationalIngestion: RelationalOperationalIntelligenceIngestionService,
  ) {}

  private assertResponse(raw: unknown): RelationalFulfillmentActionResponseDto {
    const p = RelationalFulfillmentActionResponseSchema.safeParse(raw);
    if (!p.success) {
      throw new BadRequestException({ code: "relational_fulfillment_action_response_invalid", issues: p.error.flatten() });
    }
    return p.data;
  }

  private buildResponse(input: {
    fulfillmentRecordId: string;
    orderId: string;
    relationshipId: string;
    previousStatus: RelationalFulfillmentStatus | null;
    nextStatus: RelationalFulfillmentStatus;
    actionType: RelationalFulfillmentActionTypeDto;
    eventCreated: boolean;
    eventType: RelationalFulfillmentEventType | null;
    incidentId?: string;
    resolutionStatus?: RelationalFulfillmentIncidentResolutionStatus;
    diagnostics?: Record<string, unknown>;
  }): RelationalFulfillmentActionResponseDto {
    return this.assertResponse({
      fulfillmentRecordId: input.fulfillmentRecordId,
      orderId: input.orderId,
      relationshipId: input.relationshipId,
      previousStatus: input.previousStatus,
      nextStatus: input.nextStatus,
      actionType: input.actionType,
      eventCreated: input.eventCreated,
      eventType: input.eventType,
      incidentId: input.incidentId,
      resolutionStatus: input.resolutionStatus,
      diagnostics: input.diagnostics,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    });
  }

  private async assertBuyer(record: { buyerOrganizationId: string }, actorOrganizationId: string): Promise<void> {
    if (record.buyerOrganizationId !== actorOrganizationId) {
      throw new ForbiddenException({ code: "relational_fulfillment_buyer_validation_only" });
    }
  }

  async rejectReception(input: {
    recordId: string;
    actorOrganizationId: string;
    actorUserId: string;
    body: unknown;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    const parsed = RelationalFulfillmentRejectReceptionRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({ code: "relational_fulfillment_reject_body_invalid" });
    }

    const record = await this.prisma.relationalFulfillmentRecord.findUnique({ where: { id: input.recordId } });
    if (!record) throw new NotFoundException(input.recordId);
    await this.assertBuyer(record, input.actorOrganizationId);
    if (TERMINAL_FULFILLMENT_STATUSES.includes(record.fulfillmentStatus)) {
      throw new BadRequestException({ code: "relational_fulfillment_terminal_no_rejection" });
    }
    if (!ARRIVAL_PHASE.includes(record.fulfillmentStatus)) {
      throw new BadRequestException({ code: "relational_fulfillment_rejection_requires_arrival" });
    }

    await this.fulfillment.assertOrderAllowsFulfillmentPublic(record.orderId);
    await this.fulfillment.assertFulfillmentOperationalPublic(record.relationshipId, {
      allowRestrictedFulfillmentForBackoffice: input.allowRestrictedFulfillmentForBackoffice,
      allowDormantFulfillment: input.allowDormantFulfillment,
    });

    const incidentType = parsed.data.incidentType ?? "QUANTITY_MISMATCH";
    const from = record.fulfillmentStatus;
    let incidentId = "";

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.relationalFulfillmentRecord.updateMany({
        where: {
          id: record.id,
          fulfillmentStatus: { in: ARRIVAL_PHASE },
        },
        data: {
          fulfillmentStatus: "RECEPTION_REJECTED",
          proofValidated: false,
        },
      });
      if (updated.count === 0) {
        throw new BadRequestException({ code: "fulfillment_concurrency_conflict" });
      }

      const incident = await tx.relationalFulfillmentIncident.create({
        data: {
          fulfillmentRecordId: record.id,
          incidentType,
          reportedByOrganizationId: input.actorOrganizationId,
          reportedByUserId: input.actorUserId,
          description: parsed.data.reason,
          severity: "HIGH",
          resolutionStatus: "OPEN",
          metadata: {
            incidentBlocking: true,
            blocksFulfillmentCompletion: true,
            receptionRejectedByBuyer: true,
            rejectionRequiresResolution: true,
          } as Prisma.InputJsonValue,
        },
      });
      incidentId = incident.id;

      await this.fulfillment.appendEventPublic(tx, {
        fulfillmentRecordId: record.id,
        orderId: record.orderId,
        relationshipId: record.relationshipId,
        eventType: "RECEPTION_REJECTED",
        previousStatus: from,
        nextStatus: "RECEPTION_REJECTED",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: {
          receptionRejectedByBuyer: true,
          rejectionRequiresResolution: true,
          blocksFulfillmentCompletion: true,
          incidentId,
        },
      });
    });

    await this.realtime.publishActionBothSides({
      buyerOrganizationId: record.buyerOrganizationId,
      sellerOrganizationId: record.sellerOrganizationId,
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      fulfillmentStatus: "RECEPTION_REJECTED",
      actionType: "RECEPTION_REJECTED",
      journalEventType: "RECEPTION_REJECTED",
      realtimeEventType: "relational.fulfillment.reception_rejected",
      incidentId,
    });

    return this.buildResponse({
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      previousStatus: from,
      nextStatus: "RECEPTION_REJECTED",
      actionType: "RECEPTION_REJECTED",
      eventCreated: true,
      eventType: "RECEPTION_REJECTED",
      incidentId,
      resolutionStatus: "OPEN",
      diagnostics: {
        receptionRejectedByBuyer: true,
        rejectionRequiresResolution: true,
        blocksFulfillmentCompletion: true,
      },
    });
  }

  async validatePartialReception(input: {
    recordId: string;
    actorOrganizationId: string;
    actorUserId: string;
    body: unknown;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    const parsed = RelationalFulfillmentPartialReceptionRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({ code: "relational_fulfillment_partial_body_invalid" });
    }

    const record = await this.prisma.relationalFulfillmentRecord.findUnique({
      where: { id: input.recordId },
      include: { proofs: true },
    });
    if (!record) throw new NotFoundException(input.recordId);
    await this.assertBuyer(record, input.actorOrganizationId);
    if (TERMINAL_FULFILLMENT_STATUSES.includes(record.fulfillmentStatus)) {
      throw new BadRequestException({ code: "relational_fulfillment_terminal_no_partial" });
    }
    if (!ARRIVAL_PHASE.includes(record.fulfillmentStatus)) {
      throw new BadRequestException({ code: "relational_fulfillment_partial_requires_arrival" });
    }

    const acceptedProofs = record.proofs.filter((p) => {
      const meta = p.metadata as { proofAccepted?: boolean } | null;
      return meta?.proofAccepted !== false;
    });
    if (record.proofRequired && acceptedProofs.length === 0) {
      throw new BadRequestException({ code: "relational_fulfillment_proof_required_before_partial" });
    }

    await this.fulfillment.assertOrderAllowsFulfillmentPublic(record.orderId);
    await this.fulfillment.assertFulfillmentOperationalPublic(record.relationshipId, {
      allowRestrictedFulfillmentForBackoffice: input.allowRestrictedFulfillmentForBackoffice,
      allowDormantFulfillment: input.allowDormantFulfillment,
    });

    const from = record.fulfillmentStatus;
    let incidentId = "";

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.relationalFulfillmentRecord.updateMany({
        where: { id: record.id, fulfillmentStatus: { in: ARRIVAL_PHASE } },
        data: {
          fulfillmentStatus: "RECEPTION_PARTIALLY_VALIDATED",
          proofValidated: true,
          receptionValidationNotes: parsed.data.notes,
        },
      });
      if (updated.count === 0) {
        throw new BadRequestException({ code: "fulfillment_concurrency_conflict" });
      }

      const incident = await tx.relationalFulfillmentIncident.create({
        data: {
          fulfillmentRecordId: record.id,
          incidentType: parsed.data.incidentType,
          reportedByOrganizationId: input.actorOrganizationId,
          reportedByUserId: input.actorUserId,
          description: parsed.data.notes,
          severity: "MEDIUM",
          resolutionStatus: "OPEN",
          metadata: {
            incidentBlocking: true,
            blocksFulfillmentCompletion: true,
            partialReceptionValidatedByBuyer: true,
            requiresResolutionBeforeCompletion: true,
          } as Prisma.InputJsonValue,
        },
      });
      incidentId = incident.id;

      await this.fulfillment.appendEventPublic(tx, {
        fulfillmentRecordId: record.id,
        orderId: record.orderId,
        relationshipId: record.relationshipId,
        eventType: "PARTIAL_RECEPTION_VALIDATED",
        previousStatus: from,
        nextStatus: "RECEPTION_PARTIALLY_VALIDATED",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: {
          partialReceptionValidatedByBuyer: true,
          requiresResolutionBeforeCompletion: true,
          incidentId,
        },
      });
    });

    await this.realtime.publishActionBothSides({
      buyerOrganizationId: record.buyerOrganizationId,
      sellerOrganizationId: record.sellerOrganizationId,
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      fulfillmentStatus: "RECEPTION_PARTIALLY_VALIDATED",
      actionType: "PARTIAL_RECEPTION_VALIDATED",
      journalEventType: "PARTIAL_RECEPTION_VALIDATED",
      realtimeEventType: "relational.fulfillment.partial_validation",
      incidentId,
    });

    return this.buildResponse({
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      previousStatus: from,
      nextStatus: "RECEPTION_PARTIALLY_VALIDATED",
      actionType: "PARTIAL_RECEPTION_VALIDATED",
      eventCreated: true,
      eventType: "PARTIAL_RECEPTION_VALIDATED",
      incidentId,
      resolutionStatus: "OPEN",
      diagnostics: {
        partialReceptionValidatedByBuyer: true,
        requiresResolutionBeforeCompletion: true,
      },
    });
  }

  async proposeResolution(input: {
    incidentId: string;
    actorOrganizationId: string;
    actorUserId: string;
    body: unknown;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    const parsed = RelationalFulfillmentIncidentResolutionProposalRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({ code: "relational_fulfillment_resolution_proposal_invalid" });
    }

    const incident = await this.loadIncident(input.incidentId);
    this.assertParticipant(incident.fulfillmentRecord, input.actorOrganizationId);
    if (incident.resolutionStatus === "RESOLVED") {
      throw new BadRequestException({ code: "relational_fulfillment_incident_already_resolved" });
    }
    if (incident.fulfillmentRecord.fulfillmentStatus === "FULFILLMENT_COMPLETED") {
      throw new BadRequestException({ code: "relational_fulfillment_completed_no_resolution" });
    }

    await this.fulfillment.assertOrderAllowsFulfillmentPublic(incident.fulfillmentRecord.orderId);
    await this.fulfillment.assertFulfillmentOperationalPublic(incident.fulfillmentRecord.relationshipId, {
      allowRestrictedFulfillmentForBackoffice: input.allowRestrictedFulfillmentForBackoffice,
      allowDormantFulfillment: input.allowDormantFulfillment,
    });

    const now = new Date();
    const record = incident.fulfillmentRecord;
    const from = record.fulfillmentStatus;

    await this.prisma.$transaction(async (tx) => {
      await tx.relationalFulfillmentIncident.update({
        where: { id: incident.id },
        data: {
          resolutionStatus: "RESOLUTION_PROPOSED",
          resolutionRequestedAt: now,
          resolutionRequestedByOrganizationId: input.actorOrganizationId,
          resolutionRequestedByUserId: input.actorUserId,
          resolutionProposal: parsed.data.resolutionProposal,
          resolutionNotes: parsed.data.resolutionNotes ?? null,
          resolutionDiagnostics: {
            resolutionProposedAt: now.toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await this.fulfillment.appendEventPublic(tx, {
        fulfillmentRecordId: record.id,
        orderId: record.orderId,
        relationshipId: record.relationshipId,
        eventType: "INCIDENT_RESOLUTION_PROPOSED",
        previousStatus: from,
        nextStatus: from,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: { incidentId: incident.id, resolutionProposalLength: parsed.data.resolutionProposal.length },
      });
    });

    await this.realtime.publishActionBothSides({
      buyerOrganizationId: record.buyerOrganizationId,
      sellerOrganizationId: record.sellerOrganizationId,
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      fulfillmentStatus: from,
      actionType: "INCIDENT_RESOLUTION_PROPOSED",
      journalEventType: "INCIDENT_RESOLUTION_PROPOSED",
      realtimeEventType: "relational.fulfillment.incident_resolution_proposed",
      incidentId: incident.id,
    });

    return this.buildResponse({
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      previousStatus: from,
      nextStatus: from,
      actionType: "INCIDENT_RESOLUTION_PROPOSED",
      eventCreated: true,
      eventType: "INCIDENT_RESOLUTION_PROPOSED",
      incidentId: incident.id,
      resolutionStatus: "RESOLUTION_PROPOSED",
    });
  }

  async acceptResolutionBuyer(input: {
    incidentId: string;
    actorOrganizationId: string;
    actorUserId: string;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    const incident = await this.loadIncident(input.incidentId);
    await this.assertBuyer(incident.fulfillmentRecord, input.actorOrganizationId);
    return this.acceptResolutionSide({
      incident,
      side: "buyer",
      actorOrganizationId: input.actorOrganizationId,
      actorUserId: input.actorUserId,
      allowRestrictedFulfillmentForBackoffice: input.allowRestrictedFulfillmentForBackoffice,
      allowDormantFulfillment: input.allowDormantFulfillment,
    });
  }

  async acceptResolutionSeller(input: {
    incidentId: string;
    actorOrganizationId: string;
    actorUserId: string;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    const incident = await this.loadIncident(input.incidentId);
    if (incident.fulfillmentRecord.sellerOrganizationId !== input.actorOrganizationId) {
      throw new ForbiddenException({ code: "relational_fulfillment_seller_resolution_only" });
    }
    return this.acceptResolutionSide({
      incident,
      side: "seller",
      actorOrganizationId: input.actorOrganizationId,
      actorUserId: input.actorUserId,
      allowRestrictedFulfillmentForBackoffice: input.allowRestrictedFulfillmentForBackoffice,
      allowDormantFulfillment: input.allowDormantFulfillment,
    });
  }

  private async acceptResolutionSide(input: {
    incident: NonNullable<Awaited<ReturnType<RelationalFulfillmentResolutionService["loadIncident"]>>>;
    side: "buyer" | "seller";
    actorOrganizationId: string;
    actorUserId: string;
    allowRestrictedFulfillmentForBackoffice: boolean;
    allowDormantFulfillment: boolean;
  }) {
    const { incident, side } = input;
    if (incident.resolutionStatus === "RESOLVED") {
      return this.buildResponse({
        fulfillmentRecordId: incident.fulfillmentRecord.id,
        orderId: incident.fulfillmentRecord.orderId,
        relationshipId: incident.fulfillmentRecord.relationshipId,
        previousStatus: incident.fulfillmentRecord.fulfillmentStatus,
        nextStatus: incident.fulfillmentRecord.fulfillmentStatus,
        actionType: "INCIDENT_RESOLUTION_ACCEPTED",
        eventCreated: false,
        eventType: null,
        incidentId: incident.id,
        resolutionStatus: "RESOLVED",
        diagnostics: { idempotent: true, incidentResolved: true },
      });
    }

    await this.fulfillment.assertOrderAllowsFulfillmentPublic(incident.fulfillmentRecord.orderId);
    await this.fulfillment.assertFulfillmentOperationalPublic(incident.fulfillmentRecord.relationshipId, {
      allowRestrictedFulfillmentForBackoffice: input.allowRestrictedFulfillmentForBackoffice,
      allowDormantFulfillment: input.allowDormantFulfillment,
    });

    const now = new Date();
    const record = incident.fulfillmentRecord;
    const from = record.fulfillmentStatus;
    let finalStatus: RelationalFulfillmentIncidentResolutionStatus = incident.resolutionStatus;
    let journalEvent: RelationalFulfillmentEventType = "INCIDENT_RESOLUTION_ACCEPTED";
    let actionType: RelationalFulfillmentActionTypeDto = "INCIDENT_RESOLUTION_ACCEPTED";
    let realtimeType: import("@venext/shared-contracts").RelationalFulfillmentRealtimeEventType =
      "relational.fulfillment.incident_resolution_accepted";
    let resolved = false;

    await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.relationalFulfillmentIncident.findUnique({ where: { id: incident.id } });
      if (!fresh) throw new NotFoundException(incident.id);

      const buyerAccepted = fresh.buyerResolutionAcceptedAt != null || side === "buyer";
      const sellerAccepted = fresh.sellerResolutionAcceptedAt != null || side === "seller";

      const patch: Prisma.RelationalFulfillmentIncidentUpdateInput = {};
      if (side === "buyer" && !fresh.buyerResolutionAcceptedAt) {
        patch.buyerResolutionAcceptedAt = now;
        patch.buyerResolutionAcceptedByUserId = input.actorUserId;
      }
      if (side === "seller" && !fresh.sellerResolutionAcceptedAt) {
        patch.sellerResolutionAcceptedAt = now;
        patch.sellerResolutionAcceptedByUserId = input.actorUserId;
      }

      const bothAccepted =
        (side === "buyer" || fresh.buyerResolutionAcceptedAt != null) &&
        (side === "seller" || fresh.sellerResolutionAcceptedAt != null);

      if (bothAccepted) {
        patch.resolutionStatus = "RESOLVED";
        patch.resolvedAt = now;
        patch.resolvedByUserId = input.actorUserId;
        const meta = (fresh.metadata ?? {}) as Record<string, unknown>;
        patch.metadata = { ...meta, blocksFulfillmentCompletion: false } as Prisma.InputJsonValue;
        patch.resolutionDiagnostics = {
          buyerResolutionAccepted: true,
          sellerResolutionAccepted: true,
          bothPartiesAcceptedResolution: true,
          incidentResolved: true,
        } as Prisma.InputJsonValue;
        finalStatus = "RESOLVED";
        journalEvent = "INCIDENT_RESOLVED";
        actionType = "INCIDENT_RESOLVED";
        realtimeType = "relational.fulfillment.incident_resolved";
        resolved = true;
      } else if (side === "buyer") {
        patch.resolutionStatus = fresh.sellerResolutionAcceptedAt ? "ACCEPTED_BY_BOTH_PARTIES" : "ACCEPTED_BY_BUYER";
        finalStatus = patch.resolutionStatus as RelationalFulfillmentIncidentResolutionStatus;
      } else {
        patch.resolutionStatus = fresh.buyerResolutionAcceptedAt ? "ACCEPTED_BY_BOTH_PARTIES" : "ACCEPTED_BY_SELLER";
        finalStatus = patch.resolutionStatus as RelationalFulfillmentIncidentResolutionStatus;
      }

      if (Object.keys(patch).length > 0) {
        await tx.relationalFulfillmentIncident.update({ where: { id: incident.id }, data: patch });
      }

      await this.fulfillment.appendEventPublic(tx, {
        fulfillmentRecordId: record.id,
        orderId: record.orderId,
        relationshipId: record.relationshipId,
        eventType: journalEvent,
        previousStatus: from,
        nextStatus: from,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: {
          buyerResolutionAccepted: buyerAccepted,
          sellerResolutionAccepted: sellerAccepted,
          bothPartiesAcceptedResolution: bothAccepted,
          incidentResolved: resolved,
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
      fulfillmentStatus: from,
      actionType,
      journalEventType: journalEvent,
      realtimeEventType: realtimeType,
      incidentId: incident.id,
    });

    if (resolved) {
      void this.operationalIngestion.onIncidentResolved({
        relationshipId: record.relationshipId,
        orderId: record.orderId,
        fulfillmentRecordId: record.id,
        incidentId: incident.id,
      });
      await this.fulfillment.completeFulfillmentIfExecutionAligned({
        orderId: record.orderId,
        recordId: record.id,
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        allowRestrictedFulfillmentForBackoffice: input.allowRestrictedFulfillmentForBackoffice,
        allowDormantFulfillment: input.allowDormantFulfillment,
      });
    }

    return this.buildResponse({
      fulfillmentRecordId: record.id,
      orderId: record.orderId,
      relationshipId: record.relationshipId,
      previousStatus: from,
      nextStatus: from,
      actionType,
      eventCreated: true,
      eventType: journalEvent,
      incidentId: incident.id,
      resolutionStatus: finalStatus,
      diagnostics: {
        buyerResolutionAccepted: side === "buyer" || incident.buyerResolutionAcceptedAt != null,
        sellerResolutionAccepted: side === "seller" || incident.sellerResolutionAcceptedAt != null,
        incidentResolved: resolved,
      },
    });
  }

  private async loadIncident(incidentId: string) {
    const incident = await this.prisma.relationalFulfillmentIncident.findUnique({
      where: { id: incidentId },
      include: {
        fulfillmentRecord: true,
      },
    });
    if (!incident) throw new NotFoundException(incidentId);
    return incident;
  }

  private assertParticipant(
    record: { buyerOrganizationId: string; sellerOrganizationId: string },
    actorOrganizationId: string,
  ): void {
    if (record.buyerOrganizationId !== actorOrganizationId && record.sellerOrganizationId !== actorOrganizationId) {
      throw new ForbiddenException({ code: "relational_fulfillment_participant_only" });
    }
  }
}
