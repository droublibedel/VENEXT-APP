import { Injectable, Logger } from "@nestjs/common";
import type { RelationalSectorRealtimeEventType } from "@venext/shared-contracts";
import {
  SectorRealtimeSchema,
  isRelationalSectorRealtimeEventType,
  safeParseRelationalSectorRealtimeBody,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";

@Injectable()
export class RelationalSectorRealtimeService {
  private readonly log = new Logger(RelationalSectorRealtimeService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publishToOrganizations(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    relationshipId: string | null;
    sectorNodeId: string | null;
    sectorCode: string | null;
    intensity: number;
    propagationDepth: number;
    eventType: RelationalSectorRealtimeEventType;
  }): Promise<void> {
    await this.publishToOrg({ organizationId: input.buyerOrganizationId, ...input });
    await this.publishToOrg({ organizationId: input.sellerOrganizationId, ...input });
  }

  private async publishToOrg(input: {
    organizationId: string;
    relationshipId: string | null;
    sectorNodeId: string | null;
    sectorCode: string | null;
    intensity: number;
    propagationDepth: number;
    eventType: RelationalSectorRealtimeEventType;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_sector_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalSectorRealtimeEventType(input.eventType)) return;
    const body = {
      relationshipId: input.relationshipId,
      sectorNodeId: input.sectorNodeId,
      sectorCode: input.sectorCode,
      intensity: input.intensity,
      propagationDepth: input.propagationDepth,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = SectorRealtimeSchema.safeParse(body);
    if (!parsed.success) {
      this.log.warn(`sector realtime invalid: ${parsed.error.message}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_SECTOR_INTELLIGENCE",
      body: parsed.data,
    });
  }

  /**
   * Instruction 20.24 — structured sector payloads (snapshot / delta) validated against shared contracts.
   */
  async publishStructuredCorridor(input: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    eventType: RelationalSectorRealtimeEventType;
    body: unknown;
  }): Promise<void> {
    await this.publishStructuredToOrg({
      organizationId: input.buyerOrganizationId,
      eventType: input.eventType,
      body: input.body,
    });
    await this.publishStructuredToOrg({
      organizationId: input.sellerOrganizationId,
      eventType: input.eventType,
      body: input.body,
    });
  }

  private async publishStructuredToOrg(input: {
    organizationId: string;
    eventType: RelationalSectorRealtimeEventType;
    body: unknown;
  }): Promise<void> {
    if (
      !(await this.flags.isEnabled("relational_sector_realtime_enabled", {
        organizationId: input.organizationId,
      }))
    ) {
      return;
    }
    if (!isRelationalSectorRealtimeEventType(input.eventType)) return;
    const parsed = safeParseRelationalSectorRealtimeBody(input.eventType, input.body);
    if (!parsed.ok) {
      this.log.warn(`sector structured realtime invalid for ${input.eventType}`);
      return;
    }
    await this.fanout.postDomainSignal("/internal/v1/realtime/relational-orders/domain-signal", {
      organizationId: input.organizationId,
      eventType: input.eventType,
      source: "RELATIONAL_SECTOR_INTELLIGENCE",
      body: parsed.data as Record<string, unknown>,
    });
  }
}
