import { Injectable, Logger } from "@nestjs/common";
import type {
  RelationalOperationalOrchestrationPriority,
  RelationalOperationalOrchestrationStatus,
  RelationalOperationalOrchestrationType,
} from "@prisma/client";
import {
  isRelationalOperationalOrchestrationRealtimeEventType,
  type RelationalOperationalOrchestrationRealtimeDto,
  type RelationalOperationalOrchestrationRealtimeEventType,
  RelationalOperationalOrchestrationRealtimeSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalOperationalOrchestrationRealtimeService {
  private readonly log = new Logger(RelationalOperationalOrchestrationRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganization(input: {
    organizationId: string;
    orchestrationId: string;
    relationshipId: string;
    orchestrationType: RelationalOperationalOrchestrationType;
    priority: RelationalOperationalOrchestrationPriority;
    status: RelationalOperationalOrchestrationStatus;
    stepId?: string | null;
    realtimeEventType: RelationalOperationalOrchestrationRealtimeEventType;
  }): Promise<boolean> {
    if (
      !(await this.flags.isEnabled("relational_operational_orchestration_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return false;
    }
    if (!isRelationalOperationalOrchestrationRealtimeEventType(input.realtimeEventType)) {
      this.log.warn(`orchestration realtime unknown ${input.realtimeEventType}`);
      return false;
    }
    const body: RelationalOperationalOrchestrationRealtimeDto = {
      orchestrationId: input.orchestrationId,
      relationshipId: input.relationshipId,
      orchestrationType: input.orchestrationType,
      priority: input.priority,
      status: input.status,
      stepId: input.stepId ?? null,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    const parsed = RelationalOperationalOrchestrationRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`orchestration realtime invalid: ${parsed.error.message}`);
      return false;
    }
    return this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.realtimeEventType,
      source: "RELATIONAL_OPERATIONAL_ORCHESTRATION",
      body: parsed.data,
    });
  }

  async publishBothSides(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    orchestrationId: string;
    relationshipId: string;
    orchestrationType: RelationalOperationalOrchestrationType;
    priority: RelationalOperationalOrchestrationPriority;
    status: RelationalOperationalOrchestrationStatus;
    stepId?: string | null;
    realtimeEventType: RelationalOperationalOrchestrationRealtimeEventType;
  }): Promise<void> {
    const base = {
      orchestrationId: input.orchestrationId,
      relationshipId: input.relationshipId,
      orchestrationType: input.orchestrationType,
      priority: input.priority,
      status: input.status,
      stepId: input.stepId,
      realtimeEventType: input.realtimeEventType,
    };
    await this.publishToOrganization({ organizationId: input.buyerOrganizationId, ...base });
    await this.publishToOrganization({ organizationId: input.sellerOrganizationId, ...base });
  }
}
