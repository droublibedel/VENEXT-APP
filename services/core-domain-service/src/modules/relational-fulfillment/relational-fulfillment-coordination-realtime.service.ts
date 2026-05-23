import { Injectable, Logger } from "@nestjs/common";
import type { RelationalFulfillmentTaskEventType, RelationalFulfillmentTaskStatus } from "@prisma/client";
import {
  isRelationalFulfillmentTaskRealtimeEventType,
  type RelationalFulfillmentTaskActionTypeDto,
  type RelationalFulfillmentTaskPriorityDto,
  type RelationalFulfillmentTaskRealtimeDto,
  type RelationalFulfillmentTaskRealtimeEventType,
  type RelationalFulfillmentTaskTypeDto,
  RelationalFulfillmentTaskRealtimeSchema,
} from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalFulfillmentCoordinationRealtimeService {
  private readonly log = new Logger(RelationalFulfillmentCoordinationRealtimeService.name);

  constructor(private readonly fanout: DomainRealtimeFanoutClient) {}

  async publishToOrganization(input: {
    organizationId: string;
    taskId: string;
    fulfillmentRecordId: string;
    orderId: string;
    relationshipId: string;
    taskStatus: RelationalFulfillmentTaskStatus;
    taskType: RelationalFulfillmentTaskTypeDto;
    priority: RelationalFulfillmentTaskPriorityDto;
    realtimeEventType: RelationalFulfillmentTaskRealtimeEventType;
    actionType?: RelationalFulfillmentTaskActionTypeDto;
    journalEventType?: RelationalFulfillmentTaskEventType;
  }): Promise<boolean> {
    if (!isRelationalFulfillmentTaskRealtimeEventType(input.realtimeEventType)) {
      this.log.warn(`task realtime unknown envelope ${input.realtimeEventType}`);
      return false;
    }
    const body: RelationalFulfillmentTaskRealtimeDto = {
      taskId: input.taskId,
      fulfillmentRecordId: input.fulfillmentRecordId,
      relationshipId: input.relationshipId,
      orderId: input.orderId,
      taskStatus: input.taskStatus,
      taskType: input.taskType,
      priority: input.priority,
      actionType: input.actionType,
      eventType: input.journalEventType,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    const parsed = RelationalFulfillmentTaskRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`task realtime contract invalid: ${parsed.error.message}`);
      return false;
    }
    return this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.realtimeEventType,
      source: "RELATIONAL_FULFILLMENT_COORDINATION",
      body: parsed.data,
    });
  }

  async publishBothSides(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    taskId: string;
    fulfillmentRecordId: string;
    orderId: string;
    relationshipId: string;
    taskStatus: RelationalFulfillmentTaskStatus;
    taskType: RelationalFulfillmentTaskTypeDto;
    priority: RelationalFulfillmentTaskPriorityDto;
    realtimeEventType: RelationalFulfillmentTaskRealtimeEventType;
    actionType?: RelationalFulfillmentTaskActionTypeDto;
    journalEventType?: RelationalFulfillmentTaskEventType;
  }): Promise<boolean> {
    const base = {
      taskId: input.taskId,
      fulfillmentRecordId: input.fulfillmentRecordId,
      orderId: input.orderId,
      relationshipId: input.relationshipId,
      taskStatus: input.taskStatus,
      taskType: input.taskType,
      priority: input.priority,
      realtimeEventType: input.realtimeEventType,
      actionType: input.actionType,
      journalEventType: input.journalEventType,
    };
    const a = await this.publishToOrganization({ organizationId: input.buyerOrganizationId, ...base });
    const b = await this.publishToOrganization({ organizationId: input.sellerOrganizationId, ...base });
    return a && b;
  }
}
