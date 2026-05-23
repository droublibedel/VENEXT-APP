import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import {
  CommercialCorridorState,
  CommercialCorridorVisibility,
  Prisma,
  RelationshipSource,
  RelationshipStatus,
  TemporaryCommercialHandshakeState,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import type { VenextRequestActor } from "../../platform-authz/venext-authz.types";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import { OrganizationAccessService } from "../../platform-authz/organization-access.service";

/** Strict corridor lifecycle (Instruction 20.4). BLOCKED → never ACCEPTED automatically. */
const ALLOWED_CORRIDOR_TRANSITIONS: Record<CommercialCorridorState, readonly CommercialCorridorState[]> = {
  INVITED: ["PENDING_REVIEW", "ACCEPTED", "TERMINATED", "BLOCKED"],
  PENDING_REVIEW: ["ACCEPTED", "ACTIVE", "TERMINATED", "BLOCKED", "RESTRICTED"],
  ACCEPTED: ["ACTIVE", "TERMINATED", "BLOCKED", "SUSPENDED", "RESTRICTED", "DORMANT", "DEGRADED"],
  ACTIVE: ["DEGRADED", "DORMANT", "RESTRICTED", "SUSPENDED", "BLOCKED", "TERMINATED"],
  DEGRADED: ["ACTIVE", "RESTRICTED", "SUSPENDED", "BLOCKED", "TERMINATED", "DORMANT"],
  DORMANT: ["ACTIVE", "DEGRADED", "TERMINATED", "BLOCKED", "SUSPENDED"],
  RESTRICTED: ["ACTIVE", "DEGRADED", "SUSPENDED", "BLOCKED", "TERMINATED"],
  SUSPENDED: ["ACTIVE", "RESTRICTED", "BLOCKED", "TERMINATED"],
  BLOCKED: ["TERMINATED"],
  TERMINATED: [],
};

/** Instruction 20.4B — audit envelope for the single corridor row writer. */
export type CorridorStateWriteAudit =
  | { kind: "MATRIX_TRANSITION"; from: CommercialCorridorState; to: CommercialCorridorState }
  | { kind: "GRAPH_MIRROR_BYPASS"; governanceBypassReason: string }
  | {
      kind: "HEALTH_COMPUTE";
      previousState: CommercialCorridorState;
      suggestedState: CommercialCorridorState;
      transitionApplied: boolean;
      transitionDeniedReason: string | null;
      protectedStatePreserved: boolean;
    };

@Injectable()
export class RelationshipGovernancePolicyService {
  private readonly log = new Logger(RelationshipGovernancePolicyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgAccess: OrganizationAccessService,
  ) {}

  validateRelationshipTransition(from: CommercialCorridorState, to: CommercialCorridorState): boolean {
    if (from === to) return true;
    const allowed = ALLOWED_CORRIDOR_TRANSITIONS[from] ?? [];
    return (allowed as readonly string[]).includes(to);
  }

  validateRelationshipGovernance(
    from: CommercialCorridorState,
    to: CommercialCorridorState,
  ): { ok: boolean; reason: string } {
    if (!this.validateRelationshipTransition(from, to)) {
      return { ok: false, reason: `transition_denied:${from}->${to}` };
    }
    if (from === CommercialCorridorState.BLOCKED && to === CommercialCorridorState.ACCEPTED) {
      return { ok: false, reason: "blocked_never_auto_accepted" };
    }
    return { ok: true, reason: "ok" };
  }

  /**
   * Instruction 20.4B — **only** Prisma path that mutates `Relationship.corridorState` (plus optional co-persisted row fields).
   */
  async persistCorridorStateRow(
    relationshipId: string,
    patch: {
      corridorState: CommercialCorridorState;
      corridorHealthScore?: number;
      corridorLastActivityAt?: Date | null;
      corridorDiagnostics?: Prisma.InputJsonValue;
      corridorActivatedAt?: Date | null;
    },
    audit: CorridorStateWriteAudit,
  ): Promise<void> {
    const rid = relationshipId.trim();
    this.log.log(
      JSON.stringify({
        job: "corridor_state_writer",
        phase: "persist",
        relationshipId: rid,
        audit,
        corridorState: patch.corridorState,
      }),
    );
    await this.prisma.relationship.update({
      where: { id: rid },
      data: {
        corridorState: patch.corridorState,
        ...(patch.corridorHealthScore !== undefined ? { corridorHealthScore: patch.corridorHealthScore } : {}),
        ...(patch.corridorLastActivityAt !== undefined ? { corridorLastActivityAt: patch.corridorLastActivityAt } : {}),
        ...(patch.corridorDiagnostics !== undefined ? { corridorDiagnostics: patch.corridorDiagnostics } : {}),
        ...(patch.corridorActivatedAt !== undefined ? { corridorActivatedAt: patch.corridorActivatedAt } : {}),
      },
    });
  }

  /**
   * Instruction 20.4A — graph `Relationship.status` → `corridorState` mirror (internal lifecycle only).
   * Bypasses the commercial transition matrix; documented audit via `governanceBypassReason` in logs.
   */
  async applyGraphLifecycleCorridorMirror(
    relationshipId: string,
    target: CommercialCorridorState,
    extra?: { corridorActivatedAt?: Date | null; corridorLastActivityAt?: Date | null },
  ): Promise<void> {
    const rid = relationshipId.trim();
    this.log.log(
      JSON.stringify({
        job: "corridor_governance",
        phase: "graph_lifecycle_mirror",
        relationshipId: rid,
        targetCorridorState: target,
        governanceBypassReason: "graph_lifecycle_corridor_mirror_internal",
      }),
    );
    await this.persistCorridorStateRow(
      rid,
      {
        corridorState: target,
        ...(extra?.corridorActivatedAt !== undefined ? { corridorActivatedAt: extra.corridorActivatedAt } : {}),
        ...(extra?.corridorLastActivityAt !== undefined ? { corridorLastActivityAt: extra.corridorLastActivityAt } : {}),
      },
      { kind: "GRAPH_MIRROR_BYPASS", governanceBypassReason: "graph_lifecycle_corridor_mirror_internal" },
    );
  }

  /**
   * Instruction 20.4A — all `corridorState` writes must pass governance validation.
   */
  async applyCorridorStateTransition(
    relationshipId: string,
    target: CommercialCorridorState,
    extra?: { corridorActivatedAt?: Date | null; corridorLastActivityAt?: Date | null },
  ): Promise<void> {
    const rid = relationshipId.trim();
    const rel = await this.prisma.relationship.findUnique({
      where: { id: rid },
      select: { corridorState: true },
    });
    if (!rel) throw new NotFoundException(relationshipId);
    const g = this.validateRelationshipGovernance(rel.corridorState, target);
    if (!g.ok) {
      throw new BadRequestException({ code: "corridor_transition_denied", detail: g.reason });
    }
    await this.persistCorridorStateRow(
      rid,
      {
        corridorState: target,
        ...(extra?.corridorActivatedAt !== undefined ? { corridorActivatedAt: extra.corridorActivatedAt } : {}),
        ...(extra?.corridorLastActivityAt !== undefined ? { corridorLastActivityAt: extra.corridorLastActivityAt } : {}),
      },
      { kind: "MATRIX_TRANSITION", from: rel.corridorState, to: target },
    );
  }

  /** Instruction 20.4A — visibility on intelligence reads (not just display). */
  assertCorridorIntelligenceVisibility(
    actor: import("../../platform-authz/venext-authz.types").VenextRequestActor,
    visibility: CommercialCorridorVisibility,
  ): void {
    if (devAuthBypassEnabled()) return;
    if (actor.backofficeCommercialTrustFull) return;
    if (visibility === CommercialCorridorVisibility.BACKOFFICE_ONLY || visibility === CommercialCorridorVisibility.INTERNAL_ANALYTICS) {
      throw new ForbiddenException({
        code: "corridor_intelligence_visibility_denied",
        detail: "Lecture corridor réservée gouvernance / moteurs internes.",
      });
    }
  }

  async assertRelationshipReadable(actor: VenextRequestActor, relationshipId: string): Promise<void> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId.trim() },
      select: {
        id: true,
        status: true,
        source: true,
        corridorVisibilityLevel: true,
        requesterOrganizationId: true,
        receiverOrganizationId: true,
        upstreamOrganizationId: true,
        downstreamOrganizationId: true,
      },
    });
    if (!rel) throw new NotFoundException(relationshipId);

    await this.assertSponsoredTransitionAllowed(rel.id, rel.source, rel.status);

    if (devAuthBypassEnabled()) return;

    if (actor.backofficeCommercialTrustFull) return;

    const org = actor.organizationId?.trim();
    if (!org) {
      throw new ForbiddenException({
        code: "relationship_intelligence_actor_required",
        detail: "Intelligence corridor — actingOrganizationId obligatoire.",
      });
    }

    await this.orgAccess.assertMemberOrBypass(actor, org);

    const parties = [
      rel.requesterOrganizationId,
      rel.receiverOrganizationId,
      rel.upstreamOrganizationId,
      rel.downstreamOrganizationId,
    ].filter(Boolean) as string[];
    if (!parties.includes(org)) {
      throw new ForbiddenException({ code: "relationship_intelligence_not_party" });
    }

    this.assertCorridorIntelligenceVisibility(actor, rel.corridorVisibilityLevel);

    if (rel.status !== RelationshipStatus.ACCEPTED) {
      throw new ForbiddenException({
        code: "relationship_intelligence_requires_accepted_corridor",
        detail: "Lecture intelligence corridor réservée aux relations ACCEPTED (pas de surface publique).",
      });
    }
  }

  /**
   * Sponsored-origin pending rows must not retain corridor intelligence if handshake expired without acceptance.
   */
  async assertSponsoredTransitionAllowed(
    relationshipId: string,
    source: RelationshipSource,
    status: RelationshipStatus,
  ): Promise<void> {
    if (status === RelationshipStatus.ACCEPTED) return;
    if (source !== RelationshipSource.SPONSORED_DISCOVERY) return;

    const window = await this.prisma.sponsoredConversationWindow.findFirst({
      where: { relationshipId },
      select: { state: true },
    });
    if (window?.state === TemporaryCommercialHandshakeState.SPONSORED_WINDOW_EXPIRED) {
      throw new ForbiddenException({
        code: "relationship_intelligence_sponsor_expired",
        detail: "Fenêtre sponsoring expirée — pas d’intelligence corridor sur invitation non finalisée.",
      });
    }
  }

  async assertRelationshipWritable(actor: VenextRequestActor, relationshipId: string): Promise<void> {
    await this.assertRelationshipReadable(actor, relationshipId);
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId.trim() },
      select: { corridorState: true, status: true },
    });
    if (!rel) throw new NotFoundException(relationshipId);
    if (rel.corridorState === CommercialCorridorState.TERMINATED || rel.corridorState === CommercialCorridorState.BLOCKED) {
      throw new ForbiddenException({ code: "relationship_corridor_readonly" });
    }
  }

  async assertCorridorOperational(
    relationshipId: string,
    op:
      | "negotiation"
      | "order_creation"
      | "cart_conversion"
      | "reservation_strong"
      | "order_execution"
      | "fulfillment_execution"
      | "operational_observation",
    opts?: {
      allowSuspendedNegotiation?: boolean;
      allowDormantOrderReactivation?: boolean;
      /** Instruction 20.5 — documented backoffice-only escape hatch for RESTRICTED + cart_conversion. */
      allowRestrictedCommerceForBackoffice?: boolean;
      /** Instruction 20.8 — RESTRICTED corridor order execution (backoffice header + actor, never body-only). */
      allowRestrictedOrderExecutionForBackoffice?: boolean;
      /** Instruction 20.8 — allow execution transitions on DORMANT corridor (env + explicit opt from caller). */
      allowDormantOrderExecution?: boolean;
      /** Instruction 20.4B — collect governance warnings without changing throw semantics */
      governanceTelemetry?: { warnings: string[]; governanceWarningCodes: string[] };
    },
  ): Promise<void> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId.trim() },
      select: { corridorState: true, status: true, id: true },
    });
    if (!rel) throw new NotFoundException(relationshipId);
    if (rel.status !== RelationshipStatus.ACCEPTED) {
      throw new BadRequestException({ code: "relationship_not_accepted_for_corridor_ops" });
    }

    /** Instruction 20.14 — analytics/recommendations: historical read on any corridor state. */
    if (op === "operational_observation") {
      if (rel.corridorState === CommercialCorridorState.DEGRADED) {
        const code = "CORRIDOR_DEGRADED_OPERATIONAL_CAUTION";
        opts?.governanceTelemetry?.warnings.push(`corridor_degraded_caution:${op}`);
        opts?.governanceTelemetry?.governanceWarningCodes.push(code);
      }
      return;
    }

    if (rel.corridorState === CommercialCorridorState.DEGRADED) {
      const code = "CORRIDOR_DEGRADED_OPERATIONAL_CAUTION";
      const msg = `corridor_degraded_caution:${op}`;
      this.log.log(
        JSON.stringify({
          job: "corridor_operational",
          phase: "degraded_caution",
          relationshipId: rel.id,
          op,
          governanceWarningCode: code,
        }),
      );
      opts?.governanceTelemetry?.warnings.push(msg);
      opts?.governanceTelemetry?.governanceWarningCodes.push(code);
    }

    /** Instruction 20.8A / 20.9 — exhaustive corridor gate (fail-closed). */
    if (op === "order_execution" || op === "fulfillment_execution") {
      assertExhaustiveCorridorStateForOperation(rel, op, { ...opts, restrictedOverrideLogger: this.log });
      return;
    }

    const blocksCommerce = op === "order_creation" || op === "cart_conversion";

    if (rel.corridorState === CommercialCorridorState.BLOCKED) {
      if (blocksCommerce || op === "reservation_strong") {
        throw new ForbiddenException({ code: "corridor_blocked_no_orders" });
      }
      throw new ForbiddenException({ code: "corridor_blocked_no_negotiation", detail: op });
    }

    if (rel.corridorState === CommercialCorridorState.SUSPENDED) {
      if (blocksCommerce) {
        throw new ForbiddenException({ code: "corridor_suspended_no_orders" });
      }
      if (op === "negotiation" && !opts?.allowSuspendedNegotiation) {
        throw new ForbiddenException({ code: "corridor_suspended_no_negotiation" });
      }
      if (op === "reservation_strong") {
        throw new ForbiddenException({ code: "corridor_suspended_no_reservation" });
      }
    }

    if (blocksCommerce && rel.corridorState === CommercialCorridorState.RESTRICTED) {
      if (op === "cart_conversion" && opts?.allowRestrictedCommerceForBackoffice) {
        this.log.log(
          JSON.stringify({
            job: "corridor_operational",
            phase: "restricted_backoffice_cart_conversion_allowed",
            relationshipId: rel.id,
            op,
          }),
        );
      } else {
        throw new ForbiddenException({ code: "corridor_restricted_no_orders" });
      }
    }

    if (blocksCommerce && rel.corridorState === CommercialCorridorState.PENDING_REVIEW) {
      throw new ForbiddenException({ code: "corridor_pending_review_no_orders" });
    }

    if (blocksCommerce && rel.corridorState === CommercialCorridorState.DORMANT && !opts?.allowDormantOrderReactivation) {
      throw new ForbiddenException({ code: "corridor_dormant_order_requires_reactivation" });
    }
  }

  async assertCommercialCorridorIntegrity(relationshipId: string): Promise<void> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId.trim() },
      select: {
        id: true,
        status: true,
        corridorState: true,
        upstreamOrganizationId: true,
        downstreamOrganizationId: true,
      },
    });
    if (!rel) throw new NotFoundException(relationshipId);
    if (rel.status === RelationshipStatus.ACCEPTED && !rel.upstreamOrganizationId && !rel.downstreamOrganizationId) {
      throw new BadRequestException({ code: "corridor_accepted_missing_directed_edge" });
    }
  }
}

const corridorOrderExecutionGovernanceLogger = new Logger("RelationshipGovernancePolicyService");

/**
 * Instruction 20.8A — exported fail-closed matrix for `order_execution` (tests and cross-module callers).
 * Delegates to the same logic as `RelationshipGovernancePolicyService.assertCorridorOperational(..., "order_execution")`.
 */
export function assertExhaustiveCorridorStateForOperation(
  rel: { id: string; corridorState: CommercialCorridorState; status: RelationshipStatus },
  operation: "order_execution" | "fulfillment_execution",
  opts?: {
    allowRestrictedOrderExecutionForBackoffice?: boolean;
    allowDormantOrderExecution?: boolean;
    governanceTelemetry?: { warnings: string[]; governanceWarningCodes: string[] };
    /** When omitted, RESTRICTED + backoffice override is logged via a module-scoped logger. */
    restrictedOverrideLogger?: Pick<Logger, "log">;
  },
): void {
  if (operation !== "order_execution" && operation !== "fulfillment_execution") {
    throw new BadRequestException({ code: "corridor_exhaustive_assert_unsupported_operation", detail: operation });
  }
  const tel = opts?.governanceTelemetry;
  const logRestricted = (relationshipId: string) => {
    const logger = opts?.restrictedOverrideLogger ?? corridorOrderExecutionGovernanceLogger;
    logger.log(
      JSON.stringify({
        job: "corridor_operational",
        phase: "restricted_backoffice_corridor_ops_allowed",
        relationshipId,
        op: operation,
      }),
    );
  };
  const dormantCode =
    operation === "fulfillment_execution"
      ? "CORRIDOR_DORMANT_FULFILLMENT_EXECUTION_ENV_ALLOWED"
      : "CORRIDOR_DORMANT_ORDER_EXECUTION_ENV_ALLOWED";
  const dormantMsg =
    operation === "fulfillment_execution"
      ? "corridor_dormant_fulfillment_execution_env_gate"
      : "corridor_dormant_order_execution_env_gate";
  const dormantDenied =
    operation === "fulfillment_execution"
      ? "corridor_dormant_fulfillment_execution_requires_reactivation"
      : "corridor_dormant_order_execution_requires_reactivation";
  const restrictedDenied =
    operation === "fulfillment_execution"
      ? "corridor_restricted_no_fulfillment_execution"
      : "corridor_restricted_no_order_execution";
  const blockedDenied =
    operation === "fulfillment_execution"
      ? "corridor_blocked_no_fulfillment_execution"
      : "corridor_blocked_no_order_execution";
  const suspendedDenied =
    operation === "fulfillment_execution"
      ? "corridor_suspended_no_fulfillment_execution"
      : "corridor_suspended_no_order_execution";
  const terminatedDenied =
    operation === "fulfillment_execution"
      ? "corridor_terminated_no_fulfillment_execution"
      : "corridor_terminated_no_order_execution";
  const pendingDenied =
    operation === "fulfillment_execution"
      ? "corridor_pending_review_no_fulfillment_execution"
      : "corridor_pending_review_no_order_execution";
  const invitedDenied =
    operation === "fulfillment_execution"
      ? "corridor_invited_no_fulfillment_execution"
      : "corridor_invited_no_order_execution";
  switch (rel.corridorState) {
    case CommercialCorridorState.ACTIVE:
      return;
    case CommercialCorridorState.ACCEPTED: {
      const code = "CORRIDOR_ACCEPTED_EXECUTION_LEGACY_HINT";
      tel?.warnings.push(`corridor_accepted_operational_mirror:${rel.id}`);
      tel?.governanceWarningCodes.push(code);
      return;
    }
    case CommercialCorridorState.DEGRADED:
      return;
    case CommercialCorridorState.DORMANT:
      if (!opts?.allowDormantOrderExecution) {
        throw new ForbiddenException({ code: dormantDenied });
      }
      tel?.warnings.push(dormantMsg);
      tel?.governanceWarningCodes.push(dormantCode);
      return;
    case CommercialCorridorState.RESTRICTED:
      if (!opts?.allowRestrictedOrderExecutionForBackoffice) {
        throw new ForbiddenException({ code: restrictedDenied });
      }
      logRestricted(rel.id);
      return;
    case CommercialCorridorState.BLOCKED:
      throw new ForbiddenException({ code: blockedDenied });
    case CommercialCorridorState.SUSPENDED:
      throw new ForbiddenException({ code: suspendedDenied });
    case CommercialCorridorState.TERMINATED:
      throw new ForbiddenException({ code: terminatedDenied });
    case CommercialCorridorState.PENDING_REVIEW:
      throw new ForbiddenException({ code: pendingDenied });
    case CommercialCorridorState.INVITED:
      throw new ForbiddenException({ code: invitedDenied });
  }
}
