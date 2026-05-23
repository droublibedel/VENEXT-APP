import { Injectable, Logger } from "@nestjs/common";
import type {
  RelationalOrderExecutionEventType,
  RelationalOrderExecutionStatus,
} from "@prisma/client";
import type { RelationalOrderExecutionRealtimeDiagnosticsDto } from "@venext/shared-contracts";
import {
  isRelationalOrderExecutionRealtimeEventType,
  type RelationalOrderExecutionRealtimeDto,
  type RelationalOrderExecutionRealtimeEventType,
  RelationalOrderExecutionRealtimeSchema,
} from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

function toRealtimeEnvelopeType(
  nextStatus: RelationalOrderExecutionStatus,
  eventType: RelationalOrderExecutionEventType,
): RelationalOrderExecutionRealtimeEventType {
  if (nextStatus === "CANCELLED" || eventType === "EXECUTION_CANCELLED") {
    return "relational.order.cancelled";
  }
  switch (nextStatus) {
    case "PREPARING":
    case "PARTIALLY_FULFILLED":
      return "relational.order.preparing";
    case "READY_FOR_DISPATCH":
      return "relational.order.ready_for_dispatch";
    case "DISPATCHED":
      return "relational.order.dispatched";
    case "IN_TRANSIT":
      return "relational.order.in_transit";
    case "ARRIVED":
      return "relational.order.arrived";
    case "RECEIVED":
      return "relational.order.received";
    case "COMPLETED":
      return "relational.order.completed";
    case "BLOCKED":
    case "REJECTED_AT_RECEPTION":
    case "RETURN_REVIEW":
      return "relational.order.blocked";
    default:
      return "relational.order.blocked";
  }
}

@Injectable()
export class RelationalOrderExecutionRealtimeService {
  private readonly log = new Logger(RelationalOrderExecutionRealtimeService.name);

  constructor(private readonly fanout: DomainRealtimeFanoutClient) {}

  async publishToOrganization(input: {
    organizationId: string;
    nextStatus: RelationalOrderExecutionStatus;
    orderId: string;
    relationshipId: string;
    eventType: RelationalOrderExecutionEventType;
    diagnostics?: RelationalOrderExecutionRealtimeDiagnosticsDto;
  }): Promise<boolean> {
    const computedAt = new Date().toISOString();
    const envelopeType = toRealtimeEnvelopeType(input.nextStatus, input.eventType);
    if (!isRelationalOrderExecutionRealtimeEventType(envelopeType)) {
      this.log.warn(`relational_order_execution realtime: unknown envelope ${envelopeType}`);
      return false;
    }
    const body: RelationalOrderExecutionRealtimeDto = {
      orderId: input.orderId,
      relationshipId: input.relationshipId,
      executionStatus: input.nextStatus,
      eventType: input.eventType,
      computedAt,
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      ...(input.diagnostics ? { diagnostics: input.diagnostics } : {}),
    };
    const parsed = RelationalOrderExecutionRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`relational_order_execution realtime contract invalid: ${parsed.error.message}`);
      return false;
    }
    return this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: envelopeType,
      source: "RELATIONAL_ORDER_EXECUTION",
      body: parsed.data,
    });
  }

  async publishBothSides(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    nextStatus: RelationalOrderExecutionStatus;
    orderId: string;
    relationshipId: string;
    eventType: RelationalOrderExecutionEventType;
    diagnostics?: RelationalOrderExecutionRealtimeDiagnosticsDto;
  }): Promise<boolean> {
    const a = await this.publishToOrganization({
      organizationId: input.buyerOrganizationId,
      nextStatus: input.nextStatus,
      orderId: input.orderId,
      relationshipId: input.relationshipId,
      eventType: input.eventType,
      diagnostics: input.diagnostics,
    });
    const b = await this.publishToOrganization({
      organizationId: input.sellerOrganizationId,
      nextStatus: input.nextStatus,
      orderId: input.orderId,
      relationshipId: input.relationshipId,
      eventType: input.eventType,
      diagnostics: input.diagnostics,
    });
    return a && b;
  }
}
