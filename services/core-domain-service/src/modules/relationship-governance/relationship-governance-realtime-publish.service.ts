import { Injectable, Logger } from "@nestjs/common";
import type { CommercialCorridorState } from "@prisma/client";
import { CommercialCorridorRealtimeSchema, CorridorRealtimeChangedItemSchema } from "@venext/shared-contracts";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { healthScoreToBand } from "./relationship-governance.types";

/**
 * Instruction 20.4 / 20.4B — minimal WS fan-in (no orders, prices, catalogues, messages).
 * Delivery arrays evolve per org POST (cumulative honesty); corridor semantic fields stay identical per round.
 */
@Injectable()
export class RelationshipGovernanceRealtimePublishService {
  private readonly log = new Logger(RelationshipGovernanceRealtimePublishService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  /** Instruction 20.4B — diagnostics for optional realtime publisher wiring. */
  isConfigured(): boolean {
    return this.fanout.isConfigured();
  }

  async publishCorridorEvent(input: {
    targetOrganizationIds: string[];
    relationshipId: string;
    corridorState: CommercialCorridorState;
    healthScore: number;
    changedSignals: readonly string[];
    eventType:
      | "commercial.corridor.updated"
      | "commercial.corridor.degraded"
      | "commercial.corridor.reactivated"
      | "commercial.corridor.restricted";
  }): Promise<void> {
    const intended = [...new Set(input.targetOrganizationIds.map((o) => o.trim()).filter(Boolean))];
    if (intended.length === 0) {
      this.log.warn(JSON.stringify({ job: "corridor_realtime", phase: "skipped_no_org_targets", relationshipId: input.relationshipId }));
      return;
    }
    if (!this.fanout.isConfigured()) {
      this.log.warn(JSON.stringify({ job: "corridor_realtime", phase: "fanout_not_configured", relationshipId: input.relationshipId }));
      return;
    }

    const corridorHealthBand = healthScoreToBand(input.healthScore);
    const changedSignals = input.changedSignals
      .map((s) => s.trim())
      .filter((s) => CorridorRealtimeChangedItemSchema.safeParse(s).success)
      .slice(0, 24);

    const skippedForFlag: string[] = [];
    const toAttempt: string[] = [];
    for (const organizationId of intended) {
      const on = await this.flags.isEnabled("corridor_intelligence_realtime_enabled", {
        organizationId,
      });
      if (!on) skippedForFlag.push(organizationId);
      else toAttempt.push(organizationId);
    }

    const delivered: string[] = [];
    const httpFailed: string[] = [];

    for (let i = 0; i < toAttempt.length; i++) {
      const organizationId = toAttempt[i]!;
      /** Per-POST payloads stay conservative; final delivery truth is logged after the loop (Instruction 20.4B). */
      const emittedToAllCorridorParties = false;

      const partialDeliveryReason =
        intended.length < 2 || new Set(intended).size < 2
          ? "insufficient_distinct_corridor_parties"
          : skippedForFlag.length > 0
            ? "corridor_intelligence_realtime_flag_disabled_for_party"
            : httpFailed.length > 0
              ? "corridor_realtime_gateway_post_failed_for_party"
              : "per_organization_corridor_fanout_round";

      const skippedIds = [...skippedForFlag, ...httpFailed];
      const body = {
        relationshipId: input.relationshipId,
        corridorState: input.corridorState,
        corridorHealthBand,
        changedSignals,
        heuristicOnly: true as const,
        computedAt: new Date().toISOString(),
        privateEconomicCorridor: true as const,
        publicRankingDisabled: true as const,
        marketplaceExposureDisabled: true as const,
        intendedTargetOrganizationIds: intended,
        deliveredTargetOrganizationIds: [...delivered],
        ...(skippedIds.length > 0 ? { skippedTargetOrganizationIds: skippedIds } : {}),
        emittedToAllCorridorParties,
        partialDeliveryReason,
      };

      const parsed = CommercialCorridorRealtimeSchema.safeParse(body);
      if (!parsed.success) {
        this.log.warn(
          JSON.stringify({
            job: "corridor_realtime",
            phase: "contract_rejected",
            relationshipId: input.relationshipId,
            issues: parsed.error.flatten(),
          }),
        );
        httpFailed.push(organizationId);
        continue;
      }

      const ok = await this.fanout.postDomainSignal("/internal/v1/realtime/corridor-intelligence/domain-signal", {
        organizationId,
        eventType: input.eventType,
        source: "RELATIONSHIP_GOVERNANCE_20_4",
        body: parsed.data,
      });
      if (ok) delivered.push(organizationId);
      else httpFailed.push(organizationId);
    }

    this.log.log(
      JSON.stringify({
        job: "corridor_realtime",
        phase: "fanout_completed",
        relationshipId: input.relationshipId,
        intended,
        delivered,
        skippedForFlag,
        httpFailed,
        emittedToAllCorridorPartiesDerived:
          new Set(intended).size >= 2 &&
          skippedForFlag.length === 0 &&
          httpFailed.length === 0 &&
          delivered.length === toAttempt.length &&
          new Set(delivered).size >= 2,
      }),
    );
  }
}
