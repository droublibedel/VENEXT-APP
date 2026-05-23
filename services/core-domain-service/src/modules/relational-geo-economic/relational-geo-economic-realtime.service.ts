import { Injectable, Logger } from "@nestjs/common";
import type { RelationalGeoEconomicRealtimeEventType } from "@venext/shared-contracts";
import {
  GeoEconomicRealtimeSchema,
  isRelationalGeoEconomicRealtimeEventType,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalGeoEconomicRealtimeService {
  private readonly log = new Logger(RelationalGeoEconomicRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    zoneCode: string | null;
    territorialIntensity: number;
    propagationDepth: number;
    eventType: RelationalGeoEconomicRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    zoneCode: string | null;
    territorialIntensity: number;
    propagationDepth: number;
    eventType: RelationalGeoEconomicRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_geo_economic_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalGeoEconomicRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      zoneCode: input.zoneCode,
      territorialIntensity: input.territorialIntensity,
      propagationDepth: input.propagationDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = GeoEconomicRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`geo-economic realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_GEO_ECONOMIC",
      body: parsed.data,
    });
  }
}
