import { Injectable, Logger } from "@nestjs/common";
import type {
  RelationalOperationalSimulationOutcome,
  RelationalOperationalSimulationSeverity,
  RelationalOperationalSimulationType,
} from "@prisma/client";
import {
  isRelationalOperationalSimulationRealtimeEventType,
  type RelationalOperationalSimulationRealtimeDto,
  type RelationalOperationalSimulationRealtimeEventType,
  RelationalOperationalSimulationRealtimeSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalOperationalSimulationRealtimeService {
  private readonly log = new Logger(RelationalOperationalSimulationRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishBothSides(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    simulationId: string;
    relationshipId: string;
    simulationType: RelationalOperationalSimulationType;
    severity: RelationalOperationalSimulationSeverity;
    outcome: RelationalOperationalSimulationOutcome | null;
    realtimeEventType: RelationalOperationalSimulationRealtimeEventType;
  }): Promise<void> {
    const base = {
      simulationId: input.simulationId,
      relationshipId: input.relationshipId,
      simulationType: input.simulationType,
      severity: input.severity,
      outcome: input.outcome,
      realtimeEventType: input.realtimeEventType,
    };
    await this.publishToOrganization({ organizationId: input.buyerOrganizationId, ...base });
    await this.publishToOrganization({ organizationId: input.sellerOrganizationId, ...base });
  }

  private async publishToOrganization(
    input: {
      organizationId: string;
      simulationId: string;
      relationshipId: string;
      simulationType: RelationalOperationalSimulationType;
      severity: RelationalOperationalSimulationSeverity;
      outcome: RelationalOperationalSimulationOutcome | null;
      realtimeEventType: RelationalOperationalSimulationRealtimeEventType;
    },
  ): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_operational_simulation_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalOperationalSimulationRealtimeEventType(input.realtimeEventType)) return;
    const body: RelationalOperationalSimulationRealtimeDto = {
      simulationId: input.simulationId,
      relationshipId: input.relationshipId,
      simulationType: input.simulationType,
      severity: input.severity,
      outcome: input.outcome,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    const parsed = RelationalOperationalSimulationRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`simulation realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.realtimeEventType,
      source: "RELATIONAL_OPERATIONAL_SIMULATION",
      body: parsed.data,
    });
  }
}
