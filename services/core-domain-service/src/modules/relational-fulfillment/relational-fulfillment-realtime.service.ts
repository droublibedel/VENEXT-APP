import { Injectable, Logger } from "@nestjs/common";
import type { RelationalFulfillmentEventType, RelationalFulfillmentStatus } from "@prisma/client";
import {
  isRelationalFulfillmentRealtimeEventType,
  type RelationalFulfillmentActionTypeDto,
  type RelationalFulfillmentRealtimeDto,
  type RelationalFulfillmentRealtimeEventType,
  RelationalFulfillmentRealtimeSchema,
} from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

function statusToEnvelope(status: RelationalFulfillmentStatus): RelationalFulfillmentRealtimeEventType {
  switch (status) {
    case "PREPARING_FULFILLMENT":
      return "relational.fulfillment.preparing";
    case "READY_FOR_LOADING":
      return "relational.fulfillment.loading_ready";
    case "LOADING_CONFIRMED":
      return "relational.fulfillment.loading_confirmed";
    case "IN_TRANSFER":
      return "relational.fulfillment.in_transfer";
    case "ARRIVED_AT_DESTINATION":
      return "relational.fulfillment.arrived";
    case "RECEPTION_PENDING_VALIDATION":
      return "relational.fulfillment.reception_pending";
    case "RECEPTION_VALIDATED":
      return "relational.fulfillment.validated";
    case "RECEPTION_PARTIALLY_VALIDATED":
      return "relational.fulfillment.partial_validation";
    case "RECEPTION_REJECTED":
      return "relational.fulfillment.rejected";
    case "FULFILLMENT_BLOCKED":
      return "relational.fulfillment.blocked";
    case "INCIDENT_REPORTED":
      return "relational.fulfillment.incident_reported";
    case "FULFILLMENT_COMPLETED":
      return "relational.fulfillment.completed";
    default:
      return "relational.fulfillment.preparing";
  }
}

@Injectable()
export class RelationalFulfillmentRealtimeService {
  private readonly log = new Logger(RelationalFulfillmentRealtimeService.name);

  constructor(private readonly fanout: DomainRealtimeFanoutClient) {}

  async publishToOrganization(input: {
    organizationId: string;
    fulfillmentRecordId: string;
    orderId: string;
    relationshipId: string;
    fulfillmentStatus: RelationalFulfillmentStatus;
    eventType: RelationalFulfillmentRealtimeEventType;
    actionType?: RelationalFulfillmentActionTypeDto;
    journalEventType?: RelationalFulfillmentEventType;
    incidentId?: string;
  }): Promise<boolean> {
    if (!isRelationalFulfillmentRealtimeEventType(input.eventType)) {
      this.log.warn(`relational_fulfillment realtime: unknown envelope ${input.eventType}`);
      return false;
    }
    const body: RelationalFulfillmentRealtimeDto = {
      fulfillmentRecordId: input.fulfillmentRecordId,
      orderId: input.orderId,
      relationshipId: input.relationshipId,
      fulfillmentStatus: input.fulfillmentStatus,
      incidentId: input.incidentId,
      actionType: input.actionType,
      eventType: input.journalEventType,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    const parsed = RelationalFulfillmentRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`relational_fulfillment realtime contract invalid: ${parsed.error.message}`);
      return false;
    }
    return this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_FULFILLMENT",
      body: parsed.data,
    });
  }

  async publishStatusBothSides(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    fulfillmentRecordId: string;
    orderId: string;
    relationshipId: string;
    fulfillmentStatus: RelationalFulfillmentStatus;
  }): Promise<boolean> {
    const envelopeType = statusToEnvelope(input.fulfillmentStatus);
    const base = {
      fulfillmentRecordId: input.fulfillmentRecordId,
      orderId: input.orderId,
      relationshipId: input.relationshipId,
      fulfillmentStatus: input.fulfillmentStatus,
    };
    const a = await this.publishToOrganization({
      organizationId: input.buyerOrganizationId,
      ...base,
      eventType: envelopeType,
    });
    const b = await this.publishToOrganization({
      organizationId: input.sellerOrganizationId,
      ...base,
      eventType: envelopeType,
    });
    return a && b;
  }

  /** Instruction 20.9A — action-specific realtime (no fileUrl, no incident description). */
  async publishActionBothSides(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    fulfillmentRecordId: string;
    orderId: string;
    relationshipId: string;
    fulfillmentStatus: RelationalFulfillmentStatus;
    actionType: RelationalFulfillmentActionTypeDto;
    journalEventType: RelationalFulfillmentEventType;
    realtimeEventType: RelationalFulfillmentRealtimeEventType;
    incidentId?: string;
  }): Promise<boolean> {
    const base = {
      fulfillmentRecordId: input.fulfillmentRecordId,
      orderId: input.orderId,
      relationshipId: input.relationshipId,
      fulfillmentStatus: input.fulfillmentStatus,
      actionType: input.actionType,
      journalEventType: input.journalEventType,
      incidentId: input.incidentId,
    };
    const a = await this.publishToOrganization({
      organizationId: input.buyerOrganizationId,
      ...base,
      eventType: input.realtimeEventType,
    });
    const b = await this.publishToOrganization({
      organizationId: input.sellerOrganizationId,
      ...base,
      eventType: input.realtimeEventType,
    });
    return a && b;
  }

  /** @deprecated use publishStatusBothSides — kept for any external callers */
  async publishBothSides(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    fulfillmentRecordId: string;
    orderId: string;
    relationshipId: string;
    fulfillmentStatus: RelationalFulfillmentStatus;
  }): Promise<boolean> {
    return this.publishStatusBothSides(input);
  }
}
