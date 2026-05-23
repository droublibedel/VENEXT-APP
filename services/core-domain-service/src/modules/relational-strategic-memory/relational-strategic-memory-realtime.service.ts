import { Injectable, Logger } from "@nestjs/common";
import type {
  RelationalStrategicMemorySeverity,
  RelationalStrategicMemoryType,
} from "@prisma/client";
import {
  isRelationalStrategicMemoryRealtimeEventType,
  type RelationalStrategicMemoryRealtimeDto,
  type RelationalStrategicMemoryRealtimeEventType,
  RelationalStrategicMemoryRealtimeSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalStrategicMemoryRealtimeService {
  private readonly log = new Logger(RelationalStrategicMemoryRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishBothSides(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    memoryId: string;
    relationshipId: string;
    memoryType: RelationalStrategicMemoryType;
    memorySeverity: RelationalStrategicMemorySeverity;
    confidenceLevel: number;
    realtimeEventType: RelationalStrategicMemoryRealtimeEventType;
  }): Promise<void> {
    const base = { ...input };
    await this.publishToOrganization({ organizationId: input.buyerOrganizationId, ...base });
    await this.publishToOrganization({ organizationId: input.sellerOrganizationId, ...base });
  }

  private async publishToOrganization(
    input: {
      organizationId: string;
      memoryId: string;
      relationshipId: string;
      memoryType: RelationalStrategicMemoryType;
      memorySeverity: RelationalStrategicMemorySeverity;
      confidenceLevel: number;
      realtimeEventType: RelationalStrategicMemoryRealtimeEventType;
    },
  ): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_strategic_memory_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalStrategicMemoryRealtimeEventType(input.realtimeEventType)) return;
    const body: RelationalStrategicMemoryRealtimeDto = {
      memoryId: input.memoryId,
      relationshipId: input.relationshipId,
      memoryType: input.memoryType,
      memorySeverity: input.memorySeverity,
      confidenceLevel: input.confidenceLevel,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    const parsed = RelationalStrategicMemoryRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`strategic memory realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.realtimeEventType,
      source: "RELATIONAL_STRATEGIC_MEMORY",
      body: parsed.data,
    });
  }
}
