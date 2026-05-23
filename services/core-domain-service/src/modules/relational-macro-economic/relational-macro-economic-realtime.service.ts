import { Injectable, Logger } from "@nestjs/common";
import {
  isRelationalMacroEconomicRealtimeEventType,
  RelationalMacroEconomicRealtimeSchema,
  type RelationalMacroEconomicRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalMacroEconomicRealtimeService {
  private readonly log = new Logger(RelationalMacroEconomicRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    macroNodeId: string | null;
    macroNodeCode: string | null;
    intensity: number;
    propagationDepth: number;
    eventType: RelationalMacroEconomicRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    macroNodeId: string | null;
    macroNodeCode: string | null;
    intensity: number;
    propagationDepth: number;
    eventType: RelationalMacroEconomicRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_macro_economic_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalMacroEconomicRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      macroNodeId: input.macroNodeId,
      macroNodeCode: input.macroNodeCode,
      intensity: input.intensity,
      propagationDepth: input.propagationDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = RelationalMacroEconomicRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`macro economic realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_MACRO_ECONOMIC_INTELLIGENCE",
      body: parsed.data,
    });
  }
}
