import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CommercialCorridorVisibility } from "@prisma/client";

import {
  COMMERCIAL_CORRIDOR_SIGNAL_TYPE_VALUES,
  CommercialCorridorProfileSchema,
  CommercialCorridorSignalTypeSchema,
  CommercialCorridorStateSchema,
} from "@venext/shared-contracts";

import type { VenextRequestActor } from "../../platform-authz/venext-authz.types";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "./relationship-governance-policy.service";
import { detectOptionalDependencyStatus } from "./relationship-governance-optional-deps";
import { deriveCorridorRiskLevel, healthScoreToBand, type RelationshipIntelligenceScope } from "./relationship-governance.types";

type SignalReadiness = "EMITTED" | "NOT_CONNECTED_YET" | "REQUIRES_PAYMENT_MODULE" | "REQUIRES_LOGISTICS_MODULE" | "REQUIRES_MORE_HISTORY";

const ALL_SIGNAL_TYPES = [...COMMERCIAL_CORRIDOR_SIGNAL_TYPE_VALUES] as const;

function defaultReadinessForSignal(signalType: string): SignalReadiness {
  switch (signalType) {
    case "STRONG_PAYMENT_DISCIPLINE":
      return "REQUIRES_PAYMENT_MODULE";
    case "DELIVERY_INSTABILITY":
      return "REQUIRES_LOGISTICS_MODULE";
    case "RAPID_CORRIDOR_GROWTH":
    case "LOW_ACTIVITY_WARNING":
      return "REQUIRES_MORE_HISTORY";
    default:
      return "NOT_CONNECTED_YET";
  }
}

@Injectable()
export class RelationshipGovernanceQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationshipGovernancePolicyService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  private async assertLayerEnabled(viewerOrgId: string) {
    const on = await this.flags.isEnabled("corridor_intelligence_layer_enabled", { organizationId: viewerOrgId });
    if (!on && !devAuthBypassEnabled()) {
      throw new ForbiddenException({ code: "corridor_intelligence_layer_disabled" });
    }
  }

  private resolveScope(actor: VenextRequestActor, visibility: CommercialCorridorVisibility): RelationshipIntelligenceScope {
    if (devAuthBypassEnabled() || actor.backofficeCommercialTrustFull) return "RELATIONSHIP_BACKOFFICE_FULL";
    if (visibility === CommercialCorridorVisibility.PARTNER_ONLY) return "RELATIONSHIP_PARTNER_LIMITED";
    return "RELATIONSHIP_SELF_PRIVATE";
  }

  async getProfile(actor: VenextRequestActor, relationshipId: string) {
    await this.policy.assertRelationshipReadable(actor, relationshipId);
    const org = actor.organizationId?.trim() ?? "";
    if (!org && !devAuthBypassEnabled() && !actor.backofficeCommercialTrustFull) {
      throw new ForbiddenException({ code: "corridor_intelligence_actor_required" });
    }
    const scopeOrg = org || (await this.partyOrgForRelationship(relationshipId));
    await this.assertLayerEnabled(scopeOrg);

    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId.trim() },
      include: { commercialCorridorSignals: { orderBy: { signalType: "asc" }, take: 24 } },
    });
    if (!rel) throw new NotFoundException(relationshipId);

    const scope = this.resolveScope(actor, rel.corridorVisibilityLevel);
    if (scope === "RELATIONSHIP_NONE") {
      throw new ForbiddenException({ code: "relationship_intelligence_none" });
    }

    const healthScore = rel.corridorHealthScore ?? 50;
    const band = healthScoreToBand(healthScore);
    const signals = rel.commercialCorridorSignals.map((s) => {
      const st = String(s.signalType);
      const isFull = scope === "RELATIONSHIP_BACKOFFICE_FULL";
      const isPartnerLimited = scope === "RELATIONSHIP_PARTNER_LIMITED";
      return {
        signalType: st,
        signalStrength: isFull ? s.signalStrength : Math.round(s.signalStrength * 4) / 4,
        explanation: isFull
          ? s.explanation
          : isPartnerLimited
            ? "Signal corridor — détail restreint (partenaire, pas de métadonnées sensibles)."
            : "Signal corridor restreint — détail limité hors diagnostics internes.",
        metadata: isFull ? (s.metadata as Record<string, unknown>) : {},
        heuristicOnly: true as const,
        sourceCounters: isFull ? (s.sourceCounters as Record<string, number | string>) : undefined,
        computedAt: s.computedAt.toISOString(),
      };
    });

    const diagBase = (rel.corridorDiagnostics as Record<string, unknown> | null) ?? {};
    const risk = deriveCorridorRiskLevel({
      healthScore: healthScore,
      corridorState: rel.corridorState,
      degraded: rel.corridorState === "DEGRADED",
    });

    const emittedFromDiag = Array.isArray(diagBase.emittedSignalTypes) ? diagBase.emittedSignalTypes : undefined;
    const emittedParsed = (emittedFromDiag ?? rel.commercialCorridorSignals.map((s) => String(s.signalType))).filter(
      (x): x is string => typeof x === "string" && CommercialCorridorSignalTypeSchema.safeParse(x).success,
    ) as (typeof ALL_SIGNAL_TYPES)[number][];
    const emitted = [...new Set(emittedParsed)] as (typeof ALL_SIGNAL_TYPES)[number][];
    const unavailable = ALL_SIGNAL_TYPES.filter((t) => !emitted.includes(t));

    const storedReadiness = diagBase.signalReadiness && typeof diagBase.signalReadiness === "object" ? (diagBase.signalReadiness as Record<string, unknown>) : {};
    const signalReadiness: Record<string, SignalReadiness> = {};
    for (const t of ALL_SIGNAL_TYPES) {
      const raw = storedReadiness[t];
      const parsed =
        raw === "EMITTED" ||
        raw === "NOT_CONNECTED_YET" ||
        raw === "REQUIRES_PAYMENT_MODULE" ||
        raw === "REQUIRES_LOGISTICS_MODULE" ||
        raw === "REQUIRES_MORE_HISTORY"
          ? raw
          : null;
      signalReadiness[t] = emitted.includes(t) ? "EMITTED" : parsed ?? defaultReadinessForSignal(t);
    }

    const depBaseline = detectOptionalDependencyStatus({
      trustProfileRowMissing: false,
      sponsoredSyncCorridorGovernanceMissing: false,
      negotiationCorridorPolicyMissing: false,
      cartConversionCorridorPolicyMissing: false,
      corridorRealtimePublisherUnconfigured: false,
      commercialTrustTouchMissing: false,
    });

    const governanceDecisionSourceRaw = diagBase.governanceDecisionSource;
    const governanceDecisionSource =
      governanceDecisionSourceRaw === "HEURISTIC_ENGINE" ||
      governanceDecisionSourceRaw === "GRAPH_STATUS_SYNC" ||
      governanceDecisionSourceRaw === "SPONSORED_SYNC" ||
      governanceDecisionSourceRaw === "BACKOFFICE_OVERRIDE" ||
      governanceDecisionSourceRaw === "HEALTH_COMPUTE"
        ? governanceDecisionSourceRaw
        : "HEURISTIC_ENGINE";

    const wire = {
      relationshipId: rel.id,
      corridorState: String(rel.corridorState),
      corridorHealthNumeric: scope === "RELATIONSHIP_BACKOFFICE_FULL" ? healthScore : null,
      corridorHealthBand: band,
      corridorRiskLevel: risk,
      corridorVisibilityLevel: String(rel.corridorVisibilityLevel),
      corridorEconomicImportance: rel.corridorEconomicImportance,
      corridorActivatedAt: rel.corridorActivatedAt ? rel.corridorActivatedAt.toISOString() : null,
      corridorLastActivityAt: rel.corridorLastActivityAt ? rel.corridorLastActivityAt.toISOString() : null,
      relationshipStatus: String(rel.status),
      relationshipSource: String(rel.source),
      signals,
      diagnostics: {
        heuristicOnly: true as const,
        privateEconomicCorridor: true as const,
        publicRankingDisabled: true as const,
        marketplaceExposureDisabled: true as const,
        governanceValidated: Boolean(diagBase.governanceValidated ?? true),
        transitionAllowed: Boolean(diagBase.transitionAllowed ?? true),
        governanceReason: typeof diagBase.governanceReason === "string" ? diagBase.governanceReason : "ok",
        governanceDecisionSource,
        humanModerationRequired: Boolean(diagBase.humanModerationRequired ?? false),
        sponsoredOrigin: Boolean(diagBase.sponsoredOrigin ?? rel.source === "SPONSORED_DISCOVERY"),
        sponsoredConversionSuccess:
          typeof diagBase.sponsoredConversionSuccess === "boolean" ? diagBase.sponsoredConversionSuccess : null,
        sponsoredCommercialConsistency:
          typeof diagBase.sponsoredCommercialConsistency === "boolean" ? diagBase.sponsoredCommercialConsistency : null,
        corridorRiskLevel: risk,
        relationshipIntelligenceScope: scope,
        computedSuggestedState:
          typeof diagBase.computedSuggestedState === "string" &&
          CommercialCorridorStateSchema.safeParse(diagBase.computedSuggestedState).success
            ? (diagBase.computedSuggestedState as string)
            : null,
        persistedCorridorState: CommercialCorridorStateSchema.safeParse(
          typeof diagBase.persistedCorridorState === "string" ? diagBase.persistedCorridorState : rel.corridorState,
        ).success
          ? String(typeof diagBase.persistedCorridorState === "string" ? diagBase.persistedCorridorState : rel.corridorState)
          : String(rel.corridorState),
        protectedStatePreserved: typeof diagBase.protectedStatePreserved === "boolean" ? diagBase.protectedStatePreserved : undefined,
        stateOverwriteBlockedReason:
          typeof diagBase.stateOverwriteBlockedReason === "string" || diagBase.stateOverwriteBlockedReason === null
            ? (diagBase.stateOverwriteBlockedReason as string | null)
            : null,
        emittedSignalTypes: emitted,
        unavailableSignalTypes: unavailable,
        signalReadiness,
        optionalDependencyMissing: Array.isArray(diagBase.optionalDependencyMissing)
          ? (diagBase.optionalDependencyMissing as string[])
          : depBaseline.optionalDependencyMissing,
        optionalDependencyWarnings: Array.isArray(diagBase.optionalDependencyWarnings)
          ? (diagBase.optionalDependencyWarnings as string[])
          : depBaseline.optionalDependencyWarnings,
        dependencyStatus:
          diagBase.dependencyStatus && typeof diagBase.dependencyStatus === "object"
            ? (diagBase.dependencyStatus as Record<string, "OK" | "MISSING" | "WARN">)
            : depBaseline.dependencyStatus,
        orderCreationDirectCallSites: diagBase.orderCreationDirectCallSites ?? depBaseline.orderCreationDirectCallSites,
        orderCreationPolicyWired: typeof diagBase.orderCreationPolicyWired === "boolean" ? diagBase.orderCreationPolicyWired : depBaseline.orderCreationPolicyWired,
        cartConversionPolicyWired:
          typeof diagBase.cartConversionPolicyWired === "boolean" ? diagBase.cartConversionPolicyWired : depBaseline.cartConversionPolicyWired,
        productionFailClosed:
          typeof diagBase.productionFailClosed === "boolean"
            ? diagBase.productionFailClosed
            : depBaseline.productionFailClosed,
        reactivationRequired: Boolean(diagBase.reactivationRequired ?? rel.corridorState === "DORMANT"),
        sponsoredRejectionReason:
          typeof diagBase.sponsoredRejectionReason === "string" || diagBase.sponsoredRejectionReason === null
            ? (diagBase.sponsoredRejectionReason as string | null)
            : null,
        sponsoredRejectionPolicy:
          typeof diagBase.sponsoredRejectionPolicy === "string" || diagBase.sponsoredRejectionPolicy === null
            ? (diagBase.sponsoredRejectionPolicy as string | null)
            : null,
        sponsoredRejectionCorridorTarget:
          typeof diagBase.sponsoredRejectionCorridorTarget === "string" &&
          CommercialCorridorStateSchema.safeParse(diagBase.sponsoredRejectionCorridorTarget).success
            ? (diagBase.sponsoredRejectionCorridorTarget as string)
            : null,
        governanceOperationalWarnings: Array.isArray(diagBase.governanceOperationalWarnings)
          ? (diagBase.governanceOperationalWarnings as string[])
          : undefined,
        governanceWarningCodes: Array.isArray(diagBase.governanceWarningCodes) ? (diagBase.governanceWarningCodes as string[]) : undefined,
      },
    };

    const parsed = CommercialCorridorProfileSchema.safeParse(wire);
    if (!parsed.success) {
      throw new InternalServerErrorException({
        code: "corridor_intelligence_response_contract_violation",
        issues: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }

  async getHealth(actor: VenextRequestActor, relationshipId: string) {
    const profile = await this.getProfile(actor, relationshipId);
    return {
      relationshipId: profile.relationshipId,
      corridorHealthNumeric: profile.corridorHealthNumeric,
      corridorHealthBand: profile.corridorHealthBand,
      corridorRiskLevel: profile.corridorRiskLevel,
      corridorState: profile.corridorState,
      diagnostics: profile.diagnostics,
    };
  }

  private async partyOrgForRelationship(relationshipId: string): Promise<string> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId.trim() },
      select: { requesterOrganizationId: true },
    });
    if (!rel) throw new NotFoundException(relationshipId);
    return rel.requesterOrganizationId;
  }
}
