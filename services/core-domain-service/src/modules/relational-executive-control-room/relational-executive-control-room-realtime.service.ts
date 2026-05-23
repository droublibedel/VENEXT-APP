import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalExecutiveControlRoomRealtimeEventType,
  RelationalExecutiveControlRoomRealtimeSchema,
  type RelationalExecutiveControlRoomRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalExecutiveControlRoomRealtimeService {
  private readonly log = new Logger(RelationalExecutiveControlRoomRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    controlRoomNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    controlRoomDepth: number;
    eventType: RelationalExecutiveControlRoomRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    controlRoomNodeId: string | null;
    nodeCode: string | null;
    intensity: number;
    controlRoomDepth: number;
    eventType: RelationalExecutiveControlRoomRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_executive_control_room_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalExecutiveControlRoomRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      controlRoomNodeId: input.controlRoomNodeId,
      nodeCode: input.nodeCode,
      intensity: input.intensity,
      controlRoomDepth: input.controlRoomDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalExecutiveControlRoomRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`executive control room realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_EXECUTIVE_CONTROL_ROOM",
      body: parsed.data,
    });
  }
}
