import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import {
  CommercialTrustDataConfidence,
  CommercialTrustSignalType,
  RelationshipStatus,
} from "@prisma/client";
import {
  CommercialTrustProfileResponseSchema,
  CommercialTrustRelationshipResponseSchema,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import type { VenextRequestActor } from "../../platform-authz/venext-authz.types";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { CommercialTrustComputationService } from "./commercial-trust-computation.service";
import {
  CommercialTrustVisibilityService,
  type CommercialTrustVisibilityDiagnostics,
  type CommercialTrustVisibilityScope,
} from "./commercial-trust-visibility.service";
import { bandNumericForPartnerView, trustScoreToCorridorBand } from "./commercial-trust-response.serializer";

const PARTNER_SIGNAL_GENERIC =
  "Lecture corridor partenaire acceptée — détail signal restreint (pas de métadonnées opérationnelles).";
const SPONSORED_DISCLAIMER =
  "Fenêtre sponsoring active — confiance économique en lecture minimale ; pas de corridor formel accepté.";

@Injectable()
export class CommercialTrustQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly visibility: CommercialTrustVisibilityService,
    private readonly computation: CommercialTrustComputationService,
  ) {}

  private async assertLayerEnabled(actor: VenextRequestActor, scopeOrg: string) {
    const on = await this.flags.isEnabled("commercial_trust_layer_enabled", { organizationId: scopeOrg });
    if (!on && !devAuthBypassEnabled()) {
      throw new ForbiddenException({ code: "commercial_trust_layer_disabled" });
    }
  }

  private assertNoForbiddenScope(scope: CommercialTrustVisibilityScope): void {
    /** Defensive — NONE must never reach redaction (Instruction 20.3A). */
    if ((scope as string) === "NONE") {
      throw new ForbiddenException({ code: "commercial_trust_visibility_denied" });
    }
  }

  private redactSignalsForScope(
    scope: CommercialTrustVisibilityScope,
    signals: {
      signalType: CommercialTrustSignalType;
      signalStrength: number;
      heuristicOnly: boolean;
      confidenceLevel: CommercialTrustDataConfidence;
      explanation: string;
      metadata: unknown;
      computedAt: Date;
    }[],
  ): {
    signalType: CommercialTrustSignalType;
    signalStrength: number;
    heuristicOnly: true;
    confidenceLevel: CommercialTrustDataConfidence;
    explanation: string;
    metadata: Record<string, unknown>;
    computedAt: Date;
  }[] {
    if (scope === "SPONSORED_TEMPORARY_MINIMAL") {
      return [];
    }
    if (scope === "ACCEPTED_PARTNER_LIMITED") {
      const allow = new Set<CommercialTrustSignalType>([
        CommercialTrustSignalType.RELATIONSHIP_RELIABILITY,
        CommercialTrustSignalType.SPONSORED_DISCOVERY_CONVERSION,
      ]);
      return signals
        .filter((s) => allow.has(s.signalType))
        .map((s) => ({
          signalType: s.signalType,
          signalStrength: Math.round(s.signalStrength * 2) / 2,
          heuristicOnly: true as const,
          confidenceLevel: CommercialTrustDataConfidence.LOW,
          explanation: PARTNER_SIGNAL_GENERIC,
          metadata: {},
          computedAt: s.computedAt,
        }));
    }
    return signals.map((s) => ({
      signalType: s.signalType,
      signalStrength: s.signalStrength,
      heuristicOnly: true as const,
      confidenceLevel: s.confidenceLevel,
      explanation: s.explanation,
      metadata: (s.metadata && typeof s.metadata === "object" && !Array.isArray(s.metadata)
        ? (s.metadata as Record<string, unknown>)
        : {}) as Record<string, unknown>,
      computedAt: s.computedAt,
    }));
  }

  private redactProfileForScope(
    scope: CommercialTrustVisibilityScope,
    profile: {
      organizationId: string;
      trustLevel: string;
      trustScore: number;
      relationshipCount: number;
      acceptedRelationshipCount: number;
      negotiationCompletionRate: number;
      averageNegotiationResponseMinutes: number | null;
      sponsoredConversationConversionRate: number;
      dormantRelationshipRatio: number;
      unresolvedNegotiationRatio: number;
      symbolicReservationReliability: number;
      deliveryConsistencySignal: number;
      commercialStabilitySignal: number;
      dataConfidenceLevel: CommercialTrustDataConfidence;
      lastComputedAt: Date | null;
      heuristicOnly: true;
    },
  ) {
    this.assertNoForbiddenScope(scope);
    if (scope === "SPONSORED_TEMPORARY_MINIMAL") {
      /** Instruction 20.3A — sponsored minimal: no numeric score precision; placeholder only for contract shape. */
      const sponsoredTrustScorePlaceholder = 50;
      return {
        ...profile,
        trustScore: sponsoredTrustScorePlaceholder,
        relationshipCount: 0,
        acceptedRelationshipCount: 0,
        negotiationCompletionRate: 0,
        averageNegotiationResponseMinutes: null,
        sponsoredConversationConversionRate: 0,
        dormantRelationshipRatio: 0,
        unresolvedNegotiationRatio: 0,
        symbolicReservationReliability: 0,
        deliveryConsistencySignal: 0,
        commercialStabilitySignal: 0,
        dataConfidenceLevel: CommercialTrustDataConfidence.LOW,
      };
    }
    if (scope === "ACCEPTED_PARTNER_LIMITED") {
      const band = trustScoreToCorridorBand(profile.trustScore);
      return {
        ...profile,
        trustScore: bandNumericForPartnerView(band),
        relationshipCount: 0,
        acceptedRelationshipCount: 0,
        negotiationCompletionRate: 0,
        averageNegotiationResponseMinutes: null,
        sponsoredConversationConversionRate: 0,
        dormantRelationshipRatio: 0,
        unresolvedNegotiationRatio: 0,
        symbolicReservationReliability: 0,
        deliveryConsistencySignal: 0,
        commercialStabilitySignal: 0,
        dataConfidenceLevel: CommercialTrustDataConfidence.LOW,
      };
    }
    return profile;
  }

  private parseProfileResponse(body: unknown) {
    const parsed = CommercialTrustProfileResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new InternalServerErrorException({
        code: "commercial_trust_response_contract_violation",
        issues: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }

  private parseRelationshipResponse(body: unknown) {
    const parsed = CommercialTrustRelationshipResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new InternalServerErrorException({
        code: "commercial_trust_relationship_response_contract_violation",
        issues: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }

  async getProfile(actor: VenextRequestActor, subjectOrganizationId: string, refresh?: boolean) {
    const vis = await this.visibility.assertProfileReadable(actor, subjectOrganizationId);
    await this.assertLayerEnabled(actor, subjectOrganizationId);

    let profile = await this.prisma.commercialTrustProfile.findUnique({
      where: { organizationId: subjectOrganizationId },
      include: { signals: { orderBy: { signalType: "asc" } } },
    });
    if (!profile || refresh) {
      await this.computation.computeAndPersist(subjectOrganizationId);
      profile = await this.prisma.commercialTrustProfile.findUnique({
        where: { organizationId: subjectOrganizationId },
        include: { signals: { orderBy: { signalType: "asc" } } },
      });
    }
    if (!profile) throw new NotFoundException(subjectOrganizationId);

    const negotiationCount = await this.prisma.negotiation.count({
      where: {
        OR: [{ buyerOrganizationId: subjectOrganizationId }, { sellerOrganizationId: subjectOrganizationId }],
      },
    });

    const diagnostics = this.computation.buildDiagnostics({
      negotiationCount,
      acceptedRelationshipCount: profile.acceptedRelationshipCount,
      dataConfidenceLevel: profile.dataConfidenceLevel,
      signals: profile.signals.map((s) => ({
        signalType: s.signalType,
        confidenceLevel: s.confidenceLevel,
      })),
      lastComputedAt: profile.lastComputedAt,
      visibilityScope: vis.visibilityScope,
    });

    const baseProfile = {
      organizationId: profile.organizationId,
      trustLevel: profile.trustLevel,
      trustScore: profile.trustScore,
      relationshipCount: profile.relationshipCount,
      acceptedRelationshipCount: profile.acceptedRelationshipCount,
      negotiationCompletionRate: profile.negotiationCompletionRate,
      averageNegotiationResponseMinutes: profile.averageNegotiationResponseMinutes,
      sponsoredConversationConversionRate: profile.sponsoredConversationConversionRate,
      dormantRelationshipRatio: profile.dormantRelationshipRatio,
      unresolvedNegotiationRatio: profile.unresolvedNegotiationRatio,
      symbolicReservationReliability: profile.symbolicReservationReliability,
      deliveryConsistencySignal: profile.deliveryConsistencySignal,
      commercialStabilitySignal: profile.commercialStabilitySignal,
      dataConfidenceLevel: profile.dataConfidenceLevel,
      lastComputedAt: profile.lastComputedAt,
      heuristicOnly: true as const,
    };

    const rawSignals = profile.signals.map((s) => ({
      signalType: s.signalType,
      signalStrength: s.signalStrength,
      heuristicOnly: s.heuristicOnly,
      confidenceLevel: s.confidenceLevel,
      explanation: s.explanation,
      metadata: s.metadata,
      computedAt: s.computedAt,
    }));

    const redactedProfile = this.redactProfileForScope(vis.visibilityScope, baseProfile);
    const redactedSignals = this.redactSignalsForScope(vis.visibilityScope, rawSignals);

    const trustCorridorBand =
      vis.visibilityScope === "ACCEPTED_PARTNER_LIMITED"
        ? trustScoreToCorridorBand(profile.trustScore)
        : undefined;

    const commercialTrustRedaction:
      | "NONE"
      | "PARTNER_LIMITED"
      | "SPONSORED_TEMPORARY_MINIMAL" =
      vis.visibilityScope === "ACCEPTED_PARTNER_LIMITED"
        ? "PARTNER_LIMITED"
        : vis.visibilityScope === "SPONSORED_TEMPORARY_MINIMAL"
          ? "SPONSORED_TEMPORARY_MINIMAL"
          : "NONE";

    const wire = {
      profile: {
        ...redactedProfile,
        lastComputedAt: redactedProfile.lastComputedAt ? redactedProfile.lastComputedAt.toISOString() : null,
      },
      signals: redactedSignals.map((s) => ({
        ...s,
        computedAt: s.computedAt.toISOString(),
      })),
      visibility: vis satisfies CommercialTrustVisibilityDiagnostics,
      diagnostics,
      ...(trustCorridorBand ? { trustCorridorBand } : {}),
      commercialTrustRedaction,
      ...(vis.visibilityScope === "SPONSORED_TEMPORARY_MINIMAL"
        ? { sponsoredMinimalDisclaimer: SPONSORED_DISCLAIMER }
        : {}),
    };

    return this.parseProfileResponse(wire);
  }

  async getRelationship(actor: VenextRequestActor, relationshipId: string, refresh?: boolean) {
    await this.visibility.assertRelationshipReadable(actor, relationshipId);
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: {
        id: true,
        status: true,
        source: true,
        requesterOrganizationId: true,
        receiverOrganizationId: true,
        upstreamOrganizationId: true,
        downstreamOrganizationId: true,
      },
    });
    if (!rel) throw new NotFoundException(relationshipId);
    const viewer = actor.organizationId?.trim();
    if (!viewer) {
      throw new ForbiddenException({
        code: "commercial_trust_visibility_denied",
        detail: "Lecture relation confiance — actingOrganizationId obligatoire.",
      });
    }
    await this.assertLayerEnabled(actor, viewer);

    const parties = [
      rel.requesterOrganizationId,
      rel.receiverOrganizationId,
      rel.upstreamOrganizationId,
      rel.downstreamOrganizationId,
    ].filter(Boolean) as string[];
    let peer: string | null = null;
    if (viewer === rel.requesterOrganizationId) peer = rel.receiverOrganizationId;
    else if (viewer === rel.receiverOrganizationId) peer = rel.requesterOrganizationId;
    else if (rel.upstreamOrganizationId && viewer === rel.upstreamOrganizationId)
      peer = rel.downstreamOrganizationId ?? null;
    else if (rel.downstreamOrganizationId && viewer === rel.downstreamOrganizationId)
      peer = rel.upstreamOrganizationId ?? null;
    if (!peer) {
      throw new ForbiddenException({ code: "commercial_trust_peer_unresolved", parties });
    }

    if (refresh) {
      await this.computation.computeAndPersist(viewer);
      await this.computation.computeAndPersist(peer);
    }

    const snap = await this.prisma.commercialTrustRelationshipSnapshot.findFirst({
      where: {
        organizationId: viewer,
        relatedOrganizationId: peer,
      },
    });

    const profile = await this.prisma.commercialTrustProfile.findUnique({
      where: { organizationId: viewer },
      include: { signals: true },
    });

    const relScope: CommercialTrustVisibilityScope =
      rel.status === RelationshipStatus.ACCEPTED ? "ACCEPTED_PARTNER_LIMITED" : "SELF_PRIVATE";

    const diagnostics = this.computation.buildDiagnostics({
      negotiationCount: snap?.negotiationCount ?? 0,
      acceptedRelationshipCount: profile?.acceptedRelationshipCount ?? 0,
      dataConfidenceLevel: profile?.dataConfidenceLevel ?? CommercialTrustDataConfidence.LOW,
      signals:
        profile?.signals.map((s) => ({
          signalType: s.signalType,
          confidenceLevel: s.confidenceLevel,
        })) ?? [],
      lastComputedAt: profile?.lastComputedAt ?? null,
      visibilityScope: relScope,
    });

    const raw = {
      relationshipId: rel.id,
      relationshipStatus: rel.status,
      relationshipSource: String(rel.source),
      viewerOrganizationId: viewer,
      peerOrganizationId: peer,
      snapshot: snap
        ? {
            negotiationCount: snap.negotiationCount,
            successfulNegotiationCount: snap.successfulNegotiationCount,
            sponsoredDiscoveryOrigin: snap.sponsoredDiscoveryOrigin,
            trustDirection: snap.trustDirection,
            lastInteractionAt: snap.lastInteractionAt ? snap.lastInteractionAt.toISOString() : null,
            heuristicOnly: true as const,
          }
        : null,
      visibility: {
        visibilityScope: relScope,
        exposedToPartnerCorridor: rel.status === RelationshipStatus.ACCEPTED,
        sponsorTemporaryVisibility: false,
        publicMarketplaceExposure: false as const,
      } satisfies CommercialTrustVisibilityDiagnostics,
      diagnostics,
    };

    return this.parseRelationshipResponse(raw);
  }
}
