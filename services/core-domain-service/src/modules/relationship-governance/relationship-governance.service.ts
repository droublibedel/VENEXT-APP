import { randomUUID } from "node:crypto";

import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import {
  CommercialCorridorSignalType,
  CommercialCorridorState,
  NegotiationStatus,
  OrderStatus,
  Prisma,
  RelationshipSource,
  RelationshipStatus,
  SponsoredRelationshipRequestState,
  TemporaryCommercialHandshakeState,
} from "@prisma/client";

import { COMMERCIAL_CORRIDOR_SIGNAL_TYPE_VALUES } from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { detectOptionalDependencyStatus } from "./relationship-governance-optional-deps";
import { RelationshipGovernancePolicyService } from "./relationship-governance-policy.service";
import { RelationshipGovernanceRealtimePublishService } from "./relationship-governance-realtime-publish.service";
import {
  PROTECTED_CORRIDOR_STATES,
  deriveCorridorRiskLevel,
  healthScoreToBand,
  type CorridorGovernanceDiagnostics,
} from "./relationship-governance.types";

export type ApplySponsoredCorridorOutcomeResult = {
  ok: boolean;
  skipped?: boolean;
  corridorStateAfterSync?: CommercialCorridorState;
  corridorSignalApplied?: string[];
  error?: string;
};

const ORDER_LOOKBACK_DAYS = 120;
const NEG_LOOKBACK_DAYS = 180;
const DORMANT_ORDER_DAYS = 90;
const MAX_SIGNAL_TYPES = 12;

const ALL_ENGINE_SIGNAL_TYPES = [...COMMERCIAL_CORRIDOR_SIGNAL_TYPE_VALUES] as CommercialCorridorSignalType[];

function clamp01(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

type Readiness = "EMITTED" | "NOT_CONNECTED_YET" | "REQUIRES_PAYMENT_MODULE" | "REQUIRES_LOGISTICS_MODULE" | "REQUIRES_MORE_HISTORY";

function defaultReadinessForSignal(t: CommercialCorridorSignalType): Readiness {
  switch (t) {
    case CommercialCorridorSignalType.STRONG_PAYMENT_DISCIPLINE:
      return "REQUIRES_PAYMENT_MODULE";
    case CommercialCorridorSignalType.DELIVERY_INSTABILITY:
      return "REQUIRES_LOGISTICS_MODULE";
    case CommercialCorridorSignalType.RAPID_CORRIDOR_GROWTH:
    case CommercialCorridorSignalType.LOW_ACTIVITY_WARNING:
      return "REQUIRES_MORE_HISTORY";
    default:
      return "NOT_CONNECTED_YET";
  }
}

@Injectable()
export class RelationshipGovernanceService {
  private readonly log = new Logger(RelationshipGovernanceService.name);
  private readonly pendingTouches = new Set<string>();
  private touchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationshipGovernancePolicyService,
    private readonly realtime: RelationshipGovernanceRealtimePublishService,
  ) {}

  touchRelationship(relationshipId: string): void {
    const rid = relationshipId.trim();
    if (!rid) return;
    this.pendingTouches.add(rid);
    this.log.log(JSON.stringify({ job: "corridor_touch", phase: "scheduled", relationshipId: rid, pending: this.pendingTouches.size }));
    if (this.touchTimer) return;
    this.touchTimer = setTimeout(() => {
      this.touchTimer = null;
      void this.flushTouches();
    }, 420);
  }

  private async flushTouches(): Promise<void> {
    const batch = [...this.pendingTouches];
    this.pendingTouches.clear();
    if (batch.length === 0) return;
    this.log.log(JSON.stringify({ job: "corridor_touch", phase: "flush_started", relationshipCount: batch.length }));
    for (const rid of batch) {
      try {
        await this.computeCorridorHealth(rid);
      } catch (e) {
        this.log.warn(
          JSON.stringify({
            job: "corridor_touch",
            phase: "flush_item_failed",
            relationshipId: rid,
            error: String((e as Error).message),
          }),
        );
      }
    }
    this.log.log(JSON.stringify({ job: "corridor_touch", phase: "flush_completed", relationshipCount: batch.length }));
  }

  /** Sync corridor enum from graph `Relationship.status` (lifecycle truth). */
  async syncCorridorLifecycleFromGraph(relationshipId: string): Promise<void> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId.trim() },
      select: { id: true, status: true, corridorState: true },
    });
    if (!rel) return;
    let next: CommercialCorridorState = CommercialCorridorState.INVITED;
    const now = new Date();
    if (rel.status === RelationshipStatus.PENDING) next = CommercialCorridorState.INVITED;
    else if (rel.status === RelationshipStatus.ACCEPTED) next = CommercialCorridorState.ACCEPTED;
    else if (rel.status === RelationshipStatus.REJECTED) next = CommercialCorridorState.TERMINATED;
    else if (rel.status === RelationshipStatus.BLOCKED) next = CommercialCorridorState.BLOCKED;
    else if (rel.status === RelationshipStatus.SUSPENDED) next = CommercialCorridorState.SUSPENDED;

    try {
      await this.policy.applyGraphLifecycleCorridorMirror(rel.id, next, {
        corridorActivatedAt: rel.status === RelationshipStatus.ACCEPTED ? now : undefined,
        corridorLastActivityAt: now,
      });
    } catch (e) {
      this.log.warn(
        JSON.stringify({
          job: "corridor_sync",
          phase: "transition_denied",
          relationshipId: rel.id,
          error: String((e as Error).message),
        }),
      );
      return;
    }
    this.touchRelationship(rel.id);
  }

  /** Sponsored outcomes — Instruction 20.4A/20.4B (state machine + window coherence + awaited sync). */
  async applySponsoredRelationshipOutcome(
    relationshipId: string,
    outcome: "accepted" | "rejected",
  ): Promise<ApplySponsoredCorridorOutcomeResult> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId.trim() },
      select: {
        id: true,
        corridorState: true,
        source: true,
        status: true,
      },
    });
    if (!rel || rel.source !== RelationshipSource.SPONSORED_DISCOVERY) {
      return { ok: false, skipped: true };
    }
    const now = new Date();
    const window = await this.prisma.sponsoredConversationWindow.findFirst({
      where: { relationshipId: rel.id },
      select: {
        id: true,
        state: true,
        expiresAt: true,
        convertedToRelationship: true,
      },
    });

    if (outcome === "accepted") {
      if (rel.status !== RelationshipStatus.ACCEPTED) {
        throw new BadRequestException({ code: "sponsored_corridor_requires_accepted_relationship" });
      }
      if (!window) {
        throw new BadRequestException({ code: "sponsored_corridor_missing_window" });
      }
      if (window.state === TemporaryCommercialHandshakeState.SPONSORED_WINDOW_EXPIRED || window.expiresAt < now) {
        throw new BadRequestException({ code: "sponsored_corridor_window_expired" });
      }
      if (rel.corridorState === CommercialCorridorState.BLOCKED || rel.corridorState === CommercialCorridorState.SUSPENDED) {
        throw new BadRequestException({ code: "sponsored_corridor_blocked_or_suspended" });
      }
      const syncedReq = await this.prisma.sponsoredRelationshipRequest.findFirst({
        where: {
          sponsoredConversationWindowId: window.id,
          requestState: SponsoredRelationshipRequestState.RELATIONSHIP_ACCEPTED_SYNCED,
        },
        select: { id: true },
      });
      if (!window.convertedToRelationship || !syncedReq) {
        throw new BadRequestException({ code: "sponsored_corridor_not_synced" });
      }
      await this.policy.applyCorridorStateTransition(rel.id, CommercialCorridorState.ACTIVE, {
        corridorActivatedAt: now,
        corridorLastActivityAt: now,
      });
      await this.upsertSignal(rel.id, CommercialCorridorSignalType.SPONSORED_CONVERSION_SUCCESS, 0.72, {
        explanation: "Corridor issu du sponsoring — relation acceptée après validation humaine (heuristique).",
        metadata: { sponsored: true, sponsoredOutcome: "accepted" },
        counters: { conversion: 1 },
      });
      await this.computeCorridorHealth(rel.id);
      const after = await this.prisma.relationship.findUnique({
        where: { id: rel.id },
        select: { corridorState: true },
      });
      return {
        ok: true,
        corridorStateAfterSync: after?.corridorState ?? CommercialCorridorState.ACTIVE,
        corridorSignalApplied: ["SPONSORED_CONVERSION_SUCCESS", "SPONSORED_OUTCOME_APPLIED"],
      };
    }

    let target: CommercialCorridorState;
    let sponsoredRejectionPolicy: string;
    let sponsoredRejectionReason: string;
    if (rel.status === RelationshipStatus.BLOCKED) {
      target = CommercialCorridorState.BLOCKED;
      sponsoredRejectionPolicy = "relationship_blocked_corridor_blocked";
      sponsoredRejectionReason = "relationship_status_blocked";
    } else if (rel.status === RelationshipStatus.SUSPENDED) {
      target = CommercialCorridorState.SUSPENDED;
      sponsoredRejectionPolicy = "relationship_suspended_corridor_suspended";
      sponsoredRejectionReason = "relationship_status_suspended";
    } else {
      target = CommercialCorridorState.TERMINATED;
      sponsoredRejectionPolicy = "commercial_rejected_corridor_terminated";
      sponsoredRejectionReason = "relationship_rejected_commercial";
    }
    if (window && (window.state === TemporaryCommercialHandshakeState.SPONSORED_WINDOW_EXPIRED || window.expiresAt < now)) {
      sponsoredRejectionReason = `${sponsoredRejectionReason};sponsor_window_expired`;
      sponsoredRejectionPolicy = `${sponsoredRejectionPolicy}_expired_window_note`;
    }

    await this.policy.applyCorridorStateTransition(rel.id, target, {
      corridorLastActivityAt: now,
    });
    await this.upsertSignal(rel.id, CommercialCorridorSignalType.RELATIONSHIP_CONFLICT_PATTERN, 0.55, {
      explanation: "Demande sponsorisée rejetée — pattern de friction corridor (heuristique).",
      metadata: {
        outcome: "rejected",
        sponsoredRejectionPolicy,
        sponsoredRejectionReason,
        sponsoredRejectionCorridorTarget: target,
      },
      counters: { reject: 1 },
    });
    await this.computeCorridorHealth(rel.id, {
      sponsoredRejectionReason,
      sponsoredRejectionPolicy,
      sponsoredRejectionCorridorTarget: target,
    });
    const after = await this.prisma.relationship.findUnique({
      where: { id: rel.id },
      select: { corridorState: true },
    });
    return {
      ok: true,
      corridorStateAfterSync: after?.corridorState ?? target,
      corridorSignalApplied: ["RELATIONSHIP_CONFLICT_PATTERN", "SPONSORED_OUTCOME_APPLIED"],
    };
  }

  private async upsertSignal(
    relationshipId: string,
    signalType: CommercialCorridorSignalType,
    strength: number,
    input: { explanation: string; metadata: Record<string, unknown>; counters: Record<string, number> },
  ): Promise<void> {
    const s = clamp01(strength);
    await this.prisma.commercialCorridorSignal.upsert({
      where: { relationshipId_signalType: { relationshipId, signalType } },
      create: {
        id: randomUUID(),
        relationshipId,
        signalType,
        signalStrength: s,
        explanation: input.explanation,
        metadata: input.metadata as Prisma.InputJsonValue,
        sourceCounters: input.counters,
        heuristicOnly: true,
      },
      update: {
        signalStrength: s,
        explanation: input.explanation,
        metadata: input.metadata as Prisma.InputJsonValue,
        sourceCounters: input.counters,
        computedAt: new Date(),
      },
    });
  }

  private async resolveSponsoredConversionSuccess(relationshipId: string, source: RelationshipSource): Promise<boolean | null> {
    if (source !== RelationshipSource.SPONSORED_DISCOVERY) return null;
    const window = await this.prisma.sponsoredConversationWindow.findFirst({
      where: { relationshipId },
      select: {
        id: true,
        convertedToRelationship: true,
        expiresAt: true,
        state: true,
      },
    });
    if (!window) return false;
    if (window.state === TemporaryCommercialHandshakeState.SPONSORED_WINDOW_EXPIRED || window.expiresAt < new Date()) {
      return false;
    }
    const req = await this.prisma.sponsoredRelationshipRequest.findFirst({
      where: {
        sponsoredConversationWindowId: window.id,
        requestState: SponsoredRelationshipRequestState.RELATIONSHIP_ACCEPTED_SYNCED,
      },
      select: { id: true },
    });
    return Boolean(window.convertedToRelationship && req);
  }

  async computeCorridorHealth(relationshipId: string, diagOverlay?: Record<string, unknown>): Promise<void> {
    const rid = relationshipId.trim();
    const rel = await this.prisma.relationship.findUnique({
      where: { id: rid },
      select: {
        id: true,
        status: true,
        source: true,
        corridorState: true,
        corridorHealthScore: true,
        requesterOrganizationId: true,
        receiverOrganizationId: true,
        upstreamOrganizationId: true,
        downstreamOrganizationId: true,
        corridorDiagnostics: true,
      },
    });
    if (!rel) return;

    const persisted = rel.corridorState;
    const prevHealthScore = rel.corridorHealthScore ?? 50;
    let suggestedOperational = rel.corridorState;
    if (rel.status === RelationshipStatus.REJECTED) suggestedOperational = CommercialCorridorState.TERMINATED;
    else if (rel.status === RelationshipStatus.BLOCKED) suggestedOperational = CommercialCorridorState.BLOCKED;
    else if (rel.status === RelationshipStatus.SUSPENDED) suggestedOperational = CommercialCorridorState.SUSPENDED;
    else if (rel.status === RelationshipStatus.PENDING) suggestedOperational = CommercialCorridorState.INVITED;
    else if (rel.status === RelationshipStatus.ACCEPTED) {
      const sinceOrders = new Date(Date.now() - ORDER_LOOKBACK_DAYS * 86400000);
      const orderRows = await this.prisma.order.findMany({
        where: { relationshipId: rid, createdAt: { gte: sinceOrders } },
        take: 200,
        select: { status: true, updatedAt: true },
      });
      const sinceNeg = new Date(Date.now() - NEG_LOOKBACK_DAYS * 86400000);
      const negEdge =
        rel.upstreamOrganizationId && rel.downstreamOrganizationId
          ? [
              { buyerOrganizationId: rel.upstreamOrganizationId, sellerOrganizationId: rel.downstreamOrganizationId },
              { buyerOrganizationId: rel.downstreamOrganizationId, sellerOrganizationId: rel.upstreamOrganizationId },
            ]
          : [
              { buyerOrganizationId: rel.requesterOrganizationId, sellerOrganizationId: rel.receiverOrganizationId },
              { buyerOrganizationId: rel.receiverOrganizationId, sellerOrganizationId: rel.requesterOrganizationId },
            ];
      const negRows = await this.prisma.negotiation.findMany({
        where: {
          OR: negEdge,
          createdAt: { gte: sinceNeg },
        },
        take: 200,
        select: { status: true },
      });

      const cancelled = orderRows.filter((o) => o.status === OrderStatus.CANCELLED).length;
      const completed = orderRows.filter((o) => o.status === OrderStatus.COMPLETED).length;
      const engaged = orderRows.filter((o) => o.status !== OrderStatus.DRAFT).length;
      const cancelRate = engaged === 0 ? 0 : cancelled / engaged;
      const fulfillRate = engaged === 0 ? 0.5 : completed / engaged;

      const openNeg = negRows.filter((n) => n.status === NegotiationStatus.OPEN || n.status === NegotiationStatus.PROPOSED).length;
      const negFriction = negRows.length === 0 ? 0 : openNeg / negRows.length;

      const lastOrder = orderRows.length
        ? orderRows.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b)).updatedAt
        : null;
      const dormantCut = new Date(Date.now() - DORMANT_ORDER_DAYS * 86400000);
      const dormant = rel.status === RelationshipStatus.ACCEPTED && engaged === 0 && negRows.length < 2;

      const orgProbe = rel.upstreamOrganizationId ?? rel.requesterOrganizationId;
      const trust = await this.prisma.commercialTrustProfile.findUnique({
        where: { organizationId: orgProbe },
        select: { trustScore: true, dataConfidenceLevel: true },
      });
      const trustSoft = trust ? clamp01(trust.trustScore / 100) : 0.45;

      let health = Math.round(
        38 +
          fulfillRate * 28 +
          (1 - cancelRate) * 18 +
          (1 - negFriction) * 10 +
          trustSoft * 6 -
          (dormant ? 22 : 0),
      );
      health = Math.max(5, Math.min(100, health));

      if (dormant || (lastOrder && lastOrder < dormantCut && engaged < 2)) {
        suggestedOperational = CommercialCorridorState.DORMANT;
      } else if (cancelRate > 0.45 || negFriction > 0.55) {
        suggestedOperational = CommercialCorridorState.DEGRADED;
      } else {
        suggestedOperational = CommercialCorridorState.ACTIVE;
      }

      const protectedState = PROTECTED_CORRIDOR_STATES.has(persisted);
      const governanceCheck = this.policy.validateRelationshipGovernance(persisted, suggestedOperational);
      const transitionAllowed = !protectedState && governanceCheck.ok;
      let finalCorridorState = persisted;
      let blockedReason: string | null = null;
      if (protectedState) {
        finalCorridorState = persisted;
        blockedReason = "protected_corridor_state_preserved";
      } else if (!governanceCheck.ok) {
        finalCorridorState = persisted;
        blockedReason = governanceCheck.reason;
      } else {
        finalCorridorState = suggestedOperational;
      }

      const sponsoredConversionSuccess = await this.resolveSponsoredConversionSuccess(rid, rel.source);

      const emitted = await this.rebuildSignals(rid, {
        fulfillRate,
        cancelRate,
        negFriction,
        dormant,
        trustSoft,
        sponsored: rel.source === RelationshipSource.SPONSORED_DISCOVERY,
      });
      const unavailable = ALL_ENGINE_SIGNAL_TYPES.filter((t) => !emitted.includes(t));
      const readiness: Record<string, Readiness> = {};
      for (const t of ALL_ENGINE_SIGNAL_TYPES) {
        readiness[t] = emitted.includes(t) ? "EMITTED" : defaultReadinessForSignal(t);
      }

      const riskLevel = deriveCorridorRiskLevel({
        healthScore: health,
        corridorState: finalCorridorState,
        degraded: finalCorridorState === CommercialCorridorState.DEGRADED,
      });

      const dep = detectOptionalDependencyStatus({
        trustProfileRowMissing: !trust,
        sponsoredSyncCorridorGovernanceMissing: false,
        negotiationCorridorPolicyMissing: false,
        cartConversionCorridorPolicyMissing: false,
        corridorRealtimePublisherUnconfigured: !this.realtime.isConfigured(),
        commercialTrustTouchMissing: false,
      });

      const prevDiag = (rel.corridorDiagnostics as Record<string, unknown> | null) ?? {};
      const diag: CorridorGovernanceDiagnostics & Record<string, unknown> = {
        ...prevDiag,
        governanceValidated: transitionAllowed,
        transitionAllowed,
        governanceReason: transitionAllowed ? "bounded_heuristic_v1" : (blockedReason ?? "transition_blocked"),
        governanceDecisionSource: "HEALTH_COMPUTE",
        humanModerationRequired: finalCorridorState === CommercialCorridorState.DEGRADED || cancelRate > 0.45,
        sponsoredOrigin: rel.source === RelationshipSource.SPONSORED_DISCOVERY,
        sponsoredConversionSuccess,
        sponsoredCommercialConsistency: rel.source === RelationshipSource.SPONSORED_DISCOVERY ? fulfillRate > 0.35 : null,
        computedSuggestedState: suggestedOperational,
        persistedCorridorState: persisted,
        protectedStatePreserved: protectedState || !governanceCheck.ok,
        stateOverwriteBlockedReason: blockedReason,
        emittedSignalTypes: emitted,
        unavailableSignalTypes: unavailable,
        signalReadiness: readiness,
        optionalDependencyMissing: dep.optionalDependencyMissing,
        optionalDependencyWarnings: dep.optionalDependencyWarnings,
        dependencyStatus: dep.dependencyStatus,
        orderCreationDirectCallSites: dep.orderCreationDirectCallSites,
        orderCreationPolicyWired: dep.orderCreationPolicyWired,
        cartConversionPolicyWired: dep.cartConversionPolicyWired,
        productionFailClosed: dep.productionFailClosed,
        reactivationRequired: finalCorridorState === CommercialCorridorState.DORMANT,
        ...(diagOverlay ?? {}),
      };

      await this.policy.persistCorridorStateRow(
        rid,
        {
          corridorState: finalCorridorState,
          corridorHealthScore: health,
          corridorLastActivityAt: new Date(),
          corridorDiagnostics: diag as Prisma.InputJsonValue,
        },
        {
          kind: "HEALTH_COMPUTE",
          previousState: persisted,
          suggestedState: suggestedOperational,
          transitionApplied: finalCorridorState !== persisted && transitionAllowed,
          transitionDeniedReason: transitionAllowed ? null : blockedReason,
          protectedStatePreserved: protectedState || !governanceCheck.ok,
        },
      );

      await this.prisma.commercialCorridorSnapshot.upsert({
        where: { relationshipId: rid },
        create: {
          id: randomUUID(),
          relationshipId: rid,
          healthScore: health,
          riskBand: riskLevel,
          corridorState: finalCorridorState,
          signalsDigest: { orderSample: orderRows.length, negotiationSample: negRows.length, emitted },
        },
        update: {
          healthScore: health,
          riskBand: riskLevel,
          corridorState: finalCorridorState,
          signalsDigest: { orderSample: orderRows.length, negotiationSample: negRows.length, emitted },
          computedAt: new Date(),
        },
      });

      const partyOrgIds = [
        rel.requesterOrganizationId,
        rel.receiverOrganizationId,
        rel.upstreamOrganizationId,
        rel.downstreamOrganizationId,
      ].filter(Boolean) as string[];
      const evt =
        finalCorridorState === CommercialCorridorState.DEGRADED
          ? ("commercial.corridor.degraded" as const)
          : finalCorridorState === CommercialCorridorState.DORMANT
            ? ("commercial.corridor.restricted" as const)
            : finalCorridorState === CommercialCorridorState.ACTIVE
              ? ("commercial.corridor.reactivated" as const)
              : ("commercial.corridor.updated" as const);
      await this.realtime.publishCorridorEvent({
        targetOrganizationIds: partyOrgIds,
        relationshipId: rid,
        corridorState: finalCorridorState,
        healthScore: health,
        changedSignals: this.buildCorridorRealtimeChangedItems({
          persisted,
          final: finalCorridorState,
          prevHealth: prevHealthScore,
          nextHealth: health,
          signalTypes: emitted,
        }),
        eventType: evt,
      });
    } else {
      try {
        await this.policy.applyCorridorStateTransition(rid, suggestedOperational, { corridorLastActivityAt: new Date() });
      } catch (e) {
        this.log.warn(
          JSON.stringify({
            job: "corridor_compute",
            phase: "non_accepted_transition_denied",
            relationshipId: rid,
            error: String((e as Error).message),
          }),
        );
      }
    }
  }

  private buildCorridorRealtimeChangedItems(args: {
    persisted: CommercialCorridorState;
    final: CommercialCorridorState;
    prevHealth: number;
    nextHealth: number;
    signalTypes: CommercialCorridorSignalType[];
  }): string[] {
    const items: string[] = [];
    if (args.final !== args.persisted) items.push("STATE_CHANGED");
    if (healthScoreToBand(args.nextHealth) !== healthScoreToBand(args.prevHealth)) items.push("HEALTH_BAND_CHANGED");
    items.push("SIGNALS_REBUILT");
    for (const s of args.signalTypes) items.push(String(s));
    return items.slice(0, 24);
  }

  private async rebuildSignals(
    relationshipId: string,
    ctx: {
      fulfillRate: number;
      cancelRate: number;
      negFriction: number;
      dormant: boolean;
      trustSoft: number;
      sponsored: boolean;
    },
  ): Promise<CommercialCorridorSignalType[]> {
    await this.prisma.commercialCorridorSignal.deleteMany({ where: { relationshipId } });
    const batch: {
      signalType: CommercialCorridorSignalType;
      signalStrength: number;
      explanation: string;
      metadata: Record<string, unknown>;
      sourceCounters: Record<string, number>;
    }[] = [];

    batch.push({
      signalType: CommercialCorridorSignalType.STABLE_ORDER_FLOW,
      signalStrength: clamp01(ctx.fulfillRate),
      explanation: "Continuité symbolique des commandes (statuts agrégés, pas de montants).",
      metadata: { heuristicOnly: true },
      sourceCounters: { fulfillmentRatioBps: Math.round(ctx.fulfillRate * 10000) },
    });
    if (ctx.negFriction > 0.35) {
      batch.push({
        signalType: CommercialCorridorSignalType.HIGH_NEGOTIATION_FRICTION,
        signalStrength: clamp01(ctx.negFriction),
        explanation: "Friction négociation — négociations encore ouvertes vs échantillon corridor.",
        metadata: { heuristicOnly: true },
        sourceCounters: { openNegotiationShareBps: Math.round(ctx.negFriction * 10000) },
      });
    }
    if (ctx.dormant) {
      batch.push({
        signalType: CommercialCorridorSignalType.DORMANT_CORRIDOR,
        signalStrength: 0.62,
        explanation: "Faible activité corridor sur fenêtre observée (lookback borné).",
        metadata: { heuristicOnly: true },
        sourceCounters: { dormantFlag: 1 },
      });
    }
    if (ctx.cancelRate > 0.35) {
      batch.push({
        signalType: CommercialCorridorSignalType.HIGH_ORDER_CANCELLATION,
        signalStrength: clamp01(ctx.cancelRate),
        explanation: "Part d’annulations / commandes engagées — agrégat, pas de ligne panier.",
        metadata: { heuristicOnly: true },
        sourceCounters: { cancellationShareBps: Math.round(ctx.cancelRate * 10000) },
      });
    }
    if (ctx.trustSoft < 0.42) {
      batch.push({
        signalType: CommercialCorridorSignalType.TRUST_DEGRADATION,
        signalStrength: clamp01(1 - ctx.trustSoft),
        explanation: "Lecture trust organisationnelle distante — influence plafonnée, non fusion des modèles.",
        metadata: { heuristicOnly: true, trustInfluence: true },
        sourceCounters: { trustSoftBps: Math.round(ctx.trustSoft * 10000) },
      });
    }
    if (ctx.sponsored) {
      batch.push({
        signalType: CommercialCorridorSignalType.COMMERCIAL_ALIGNMENT_STABLE,
        signalStrength: 0.5,
        explanation: "Corridor issu sponsoring — alignement commercial à surveiller (heuristique).",
        metadata: { sponsored: true },
        sourceCounters: { sponsoredLane: 1 },
      });
    }

    const slice = batch.slice(0, MAX_SIGNAL_TYPES);
    if (slice.length > 0) {
      await this.prisma.commercialCorridorSignal.createMany({
        data: slice.map((b) => ({
          id: randomUUID(),
          relationshipId,
          signalType: b.signalType,
          signalStrength: b.signalStrength,
          explanation: b.explanation,
          metadata: b.metadata as Prisma.InputJsonValue,
          sourceCounters: b.sourceCounters as Prisma.InputJsonValue,
          heuristicOnly: true,
        })),
      });
    }
    return slice.map((b) => b.signalType);
  }
}
