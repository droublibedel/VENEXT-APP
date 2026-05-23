import { Injectable, Logger, NotFoundException, Optional } from "@nestjs/common";
import {
  CommercialTrustDataConfidence,
  CommercialTrustDirection,
  CommercialTrustLevel,
  CommercialTrustSignalType,
  NegotiationStatus,
  OrderStatus,
  Prisma,
  RelationshipSource,
  RelationshipStatus,
  ReservationIntentSource,
  ReservationIntentStatus,
  ShipmentHealthStatus,
  ShipmentStatus,
  TemporaryCommercialHandshakeState,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { CommercialTrustRealtimePublishService } from "./commercial-trust-realtime-publish.service";
import type { CorridorTrustInfluenceService } from "../relationship-governance/corridor-trust-influence.service";
import {
  acceptedRelationshipWhereForOrg,
  countDistinctAcceptedRelationships,
} from "./accepted-commercial-relationship.helper";

const NEG_SAMPLE_CAP = 400;
const EDGE_SNAPSHOT_CAP = 80;
const DORMANT_EDGE_CAP = 40;
const SHIPMENT_LOOKBACK_DAYS = 120;

function clamp01(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function minutesBetween(a: Date, b: Date): number {
  return Math.max(0, (b.getTime() - a.getTime()) / 60000);
}

export type CommercialTrustDiagnostics = {
  trustProfileCompleteness: number;
  heuristicCoverage: number;
  lowConfidenceAreas: string[];
  unresolvedSignals: string[];
  economicInterpretationReady: boolean;
  heuristicOnly: true;
  publicMarketplaceExposure: false;
  publicRankingDisabled: true;
  socialScoringDisabled: true;
  privateEconomicTrustLayer: true;
  visibilityScope: import("./commercial-trust-visibility.service").CommercialTrustVisibilityScope;
  confidenceLevel: CommercialTrustDataConfidence;
  dataConfidenceLevel: CommercialTrustDataConfidence;
  dataCompleteness: number;
  computationSource: "COMMERCIAL_TRUST_V1_HEURISTIC";
  computationMode: "PER_ORGANIZATION";
  incrementalReady: boolean;
  lastComputedAt: string | null;
  actorRequired: true;
  anonymousAccessAllowed: false;
  visibilityEnforcedAt: "GUARD_AND_SERVICE";
};

function deriveTrustLevel(input: {
  trustScore: number;
  acceptedRelationshipCount: number;
  negotiationCount: number;
  governanceSuspended: boolean;
  degradedSignals: boolean;
}): CommercialTrustLevel {
  if (input.governanceSuspended) return CommercialTrustLevel.RESTRICTED;
  if (input.degradedSignals) return CommercialTrustLevel.DEGRADED;
  /** Instruction 20.3 — negotiation alone never yields HIGH_CONFIDENCE. */
  const relBacked = input.acceptedRelationshipCount >= 2;
  const hasAnyRel = input.acceptedRelationshipCount >= 1;
  const negotiationOnly = input.negotiationCount > 0 && input.acceptedRelationshipCount === 0;
  let cap: CommercialTrustLevel = CommercialTrustLevel.STRATEGIC;
  if (negotiationOnly) cap = CommercialTrustLevel.STABLE;
  else if (!relBacked) cap = CommercialTrustLevel.STRATEGIC;

  let level: CommercialTrustLevel;
  const s = input.trustScore;
  if (s >= 82 && relBacked) level = CommercialTrustLevel.HIGH_CONFIDENCE;
  else if (s >= 68 && hasAnyRel) level = CommercialTrustLevel.STRATEGIC;
  else if (s >= 48) level = CommercialTrustLevel.STABLE;
  else if (s >= 26) level = CommercialTrustLevel.EMERGING;
  else if (s > 0) level = CommercialTrustLevel.EMERGING;
  else level = CommercialTrustLevel.UNKNOWN;

  const order = [
    CommercialTrustLevel.UNKNOWN,
    CommercialTrustLevel.EMERGING,
    CommercialTrustLevel.STABLE,
    CommercialTrustLevel.STRATEGIC,
    CommercialTrustLevel.HIGH_CONFIDENCE,
  ];
  const capIdx = order.indexOf(cap);
  const lvlIdx = order.indexOf(level);
  if (lvlIdx > capIdx) level = cap;
  return level;
}

@Injectable()
export class CommercialTrustComputationService {
  private readonly log = new Logger(CommercialTrustComputationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: CommercialTrustRealtimePublishService,
    @Optional() private readonly corridorInfluence?: CorridorTrustInfluenceService,
  ) {}

  async computeAndPersist(organizationId: string): Promise<void> {
    const orgId = organizationId.trim();
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        governanceSuspended: true,
      },
    });
    if (!org) throw new NotFoundException(orgId);

    const relationshipCount = await this.prisma.relationship.count({
      where: {
        OR: [
          { requesterOrganizationId: orgId },
          { receiverOrganizationId: orgId },
          { upstreamOrganizationId: orgId },
          { downstreamOrganizationId: orgId },
        ],
      },
    });

    const acceptedRelationshipCount = await countDistinctAcceptedRelationships(this.prisma, orgId);

    const negWhere = { OR: [{ buyerOrganizationId: orgId }, { sellerOrganizationId: orgId }] };
    const negotiationCount = await this.prisma.negotiation.count({ where: negWhere });
    const unresolved = await this.prisma.negotiation.count({
      where: { ...negWhere, status: { in: [NegotiationStatus.OPEN, NegotiationStatus.PROPOSED] } },
    });
    const terminal = await this.prisma.negotiation.count({
      where: {
        ...negWhere,
        status: {
          in: [
            NegotiationStatus.ACCEPTED,
            NegotiationStatus.REJECTED,
            NegotiationStatus.EXPIRED,
            NegotiationStatus.CONVERTED_TO_CART,
          ],
        },
      },
    });

    const negotiationCompletionRate =
      negotiationCount === 0 ? 0 : clamp01(terminal / Math.max(1, negotiationCount));
    const unresolvedNegotiationRatio = negotiationCount === 0 ? 0 : clamp01(unresolved / Math.max(1, negotiationCount));

    const negs = await this.prisma.negotiation.findMany({
      where: negWhere,
      orderBy: { updatedAt: "desc" },
      take: NEG_SAMPLE_CAP,
      select: { createdAt: true, updatedAt: true, status: true },
    });
    let sumMin = 0;
    let nClosed = 0;
    for (const n of negs) {
      if (
        n.status === NegotiationStatus.ACCEPTED ||
        n.status === NegotiationStatus.REJECTED ||
        n.status === NegotiationStatus.EXPIRED ||
        n.status === NegotiationStatus.CONVERTED_TO_CART
      ) {
        sumMin += minutesBetween(n.createdAt, n.updatedAt);
        nClosed += 1;
      }
    }
    const averageNegotiationResponseMinutes = nClosed === 0 ? null : sumMin / nClosed;

    const swTotal = await this.prisma.sponsoredConversationWindow.count({
      where: { OR: [{ sponsorOrganizationId: orgId }, { targetOrganizationId: orgId }] },
    });
    const swConverted = await this.prisma.sponsoredConversationWindow.count({
      where: {
        OR: [{ sponsorOrganizationId: orgId }, { targetOrganizationId: orgId }],
        state: TemporaryCommercialHandshakeState.RELATIONSHIP_ACCEPTED,
      },
    });
    const sponsoredConversationConversionRate =
      swTotal === 0 ? 0 : clamp01(swConverted / Math.max(1, swTotal));

    const since = new Date(Date.now() - SHIPMENT_LOOKBACK_DAYS * 86400000);
    const shipRows = await this.prisma.shipment.findMany({
      where: { organizationId: orgId, createdAt: { gte: since } },
      take: 200,
      select: { shipmentStatus: true, healthStatus: true },
    });
    let shipScore = 0.5;
    if (shipRows.length > 0) {
      const ok = shipRows.filter(
        (s) => s.shipmentStatus === ShipmentStatus.DELIVERED && s.healthStatus === ShipmentHealthStatus.HEALTHY,
      ).length;
      const bad = shipRows.filter(
        (s) => s.shipmentStatus === ShipmentStatus.BLOCKED || s.healthStatus === ShipmentHealthStatus.CRITICAL,
      ).length;
      shipScore = clamp01(0.35 + (ok - bad * 2) / Math.max(1, shipRows.length));
    }
    const deliveryConsistencySignal = shipScore;

    const res = await this.prisma.reservationIntent.groupBy({
      by: ["status"],
      where: {
        source: ReservationIntentSource.CONVERSATIONAL_SYMBOLIC_DRAFT,
        organizationId: orgId,
      },
      _count: { _all: true },
    });
    const resMap = Object.fromEntries(res.map((r) => [r.status, r._count._all])) as Partial<
      Record<ReservationIntentStatus, number>
    >;
    const resConv = resMap[ReservationIntentStatus.CONVERTED_TO_ORDER] ?? 0;
    const resExp = resMap[ReservationIntentStatus.EXPIRED] ?? 0;
    const resTot = resConv + resExp + (resMap[ReservationIntentStatus.CANCELLED] ?? 0) + (resMap[ReservationIntentStatus.RESERVED] ?? 0);
    const symbolicReservationReliability =
      resTot === 0 ? 0.5 : clamp01(resConv / Math.max(1, resConv + resExp * 1.2));

    const acceptedEdges = await this.prisma.relationship.findMany({
      where: acceptedRelationshipWhereForOrg(orgId),
      take: DORMANT_EDGE_CAP,
      select: { id: true },
    });
    let dormant = 0;
    const cutoff = new Date(Date.now() - 120 * 86400000);
    for (const e of acceptedEdges) {
      const recentOrder = await this.prisma.order.findFirst({
        where: { relationshipId: e.id, updatedAt: { gte: cutoff } },
        select: { id: true },
      });
      if (!recentOrder) dormant += 1;
    }
    const dormantRelationshipRatio =
      acceptedEdges.length === 0 ? 0 : clamp01(dormant / Math.max(1, acceptedEdges.length));

    const ordersEngaged = await this.prisma.order.count({
      where: {
        OR: [{ buyerOrganizationId: orgId }, { sellerOrganizationId: orgId }],
        status: { not: OrderStatus.DRAFT },
      },
    });
    const ordersCompleted = await this.prisma.order.count({
      where: {
        OR: [{ buyerOrganizationId: orgId }, { sellerOrganizationId: orgId }],
        status: OrderStatus.COMPLETED,
      },
    });
    const orderFulfillmentConsistency =
      ordersEngaged === 0 ? 0.5 : clamp01(ordersCompleted / Math.max(1, ordersEngaged));

    const rejectionOrBlocked = await this.prisma.relationship.count({
      where: {
        OR: [
          { requesterOrganizationId: orgId },
          { receiverOrganizationId: orgId },
          { upstreamOrganizationId: orgId },
          { downstreamOrganizationId: orgId },
        ],
        status: { in: [RelationshipStatus.REJECTED, RelationshipStatus.BLOCKED] },
      },
    });
    const rejectionPatternRatio =
      relationshipCount === 0 ? 0 : clamp01(rejectionOrBlocked / Math.max(1, relationshipCount));

    const dropHeavy =
      terminal > 0 &&
      (await this.prisma.negotiation.count({
        where: {
          ...negWhere,
          status: { in: [NegotiationStatus.REJECTED, NegotiationStatus.EXPIRED] },
        },
      })) /
        Math.max(1, terminal) >
        0.55;

    const trustScoreRaw =
      acceptedRelationshipCount * 9 +
      negotiationCompletionRate * 22 +
      (1 - unresolvedNegotiationRatio) * 14 +
      sponsoredConversationConversionRate * 12 +
      symbolicReservationReliability * 10 +
      deliveryConsistencySignal * 12 +
      (1 - dormantRelationshipRatio) * 11 +
      orderFulfillmentConsistency * 8 -
      rejectionPatternRatio * 10 -
      (dropHeavy ? 18 : 0) -
      (averageNegotiationResponseMinutes != null && averageNegotiationResponseMinutes > 2880 ? 8 : 0);

    const corridorDelta = (await this.corridorInfluence?.getTrustScoreModifierForOrganization(orgId)) ?? 0;
    const trustScore = clamp01((trustScoreRaw + corridorDelta) / 100) * 100;

    const degradedSignals = dropHeavy || unresolvedNegotiationRatio > 0.45 || dormantRelationshipRatio > 0.55;
    const trustLevel = deriveTrustLevel({
      trustScore,
      acceptedRelationshipCount,
      negotiationCount,
      governanceSuspended: org.governanceSuspended,
      degradedSignals,
    });

    let dataConfidenceLevel: CommercialTrustDataConfidence = CommercialTrustDataConfidence.LOW;
    if (negotiationCount + acceptedRelationshipCount >= 14) dataConfidenceLevel = CommercialTrustDataConfidence.HIGH;
    else if (negotiationCount + acceptedRelationshipCount >= 5) dataConfidenceLevel = CommercialTrustDataConfidence.MEDIUM;

    const commercialStabilitySignal = clamp01(
      negotiationCompletionRate * 0.45 +
        (1 - unresolvedNegotiationRatio) * 0.35 +
        (1 - dormantRelationshipRatio) * 0.2,
    );

    const now = new Date();
    const profile = await this.prisma.commercialTrustProfile.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        trustLevel,
        trustScore,
        relationshipCount,
        acceptedRelationshipCount,
        negotiationCompletionRate,
        averageNegotiationResponseMinutes: averageNegotiationResponseMinutes ?? undefined,
        sponsoredConversationConversionRate,
        dormantRelationshipRatio,
        unresolvedNegotiationRatio,
        symbolicReservationReliability,
        deliveryConsistencySignal,
        commercialStabilitySignal,
        dataConfidenceLevel,
        lastComputedAt: now,
      },
      update: {
        trustLevel,
        trustScore,
        relationshipCount,
        acceptedRelationshipCount,
        negotiationCompletionRate,
        averageNegotiationResponseMinutes: averageNegotiationResponseMinutes ?? null,
        sponsoredConversationConversionRate,
        dormantRelationshipRatio,
        unresolvedNegotiationRatio,
        symbolicReservationReliability,
        deliveryConsistencySignal,
        commercialStabilitySignal,
        dataConfidenceLevel,
        lastComputedAt: now,
      },
    });

    const signals: {
      signalType: CommercialTrustSignalType;
      signalStrength: number;
      confidenceLevel: CommercialTrustDataConfidence;
      explanation: string;
      metadata: Record<string, unknown>;
    }[] = [
      {
        signalType: CommercialTrustSignalType.NEGOTIATION_STABILITY,
        signalStrength: clamp01(negotiationCompletionRate * (1 - unresolvedNegotiationRatio)),
        confidenceLevel: dataConfidenceLevel,
        explanation:
          "Heuristique V1 : stabilité dérivée des négociations closes vs négociations encore ouvertes — pas une promesse contractuelle.",
        metadata: { negotiationSampleCap: NEG_SAMPLE_CAP, negotiationCount },
      },
      {
        signalType: CommercialTrustSignalType.RELATIONSHIP_RELIABILITY,
        signalStrength: clamp01(acceptedRelationshipCount / Math.max(1, relationshipCount || 1)),
        confidenceLevel: dataConfidenceLevel,
        explanation:
          "Part des relations acceptées vs relations vues sur le graphe — ne mesure pas la popularité ni un classement marketplace.",
        metadata: { acceptedRelationshipCount, relationshipCount },
      },
      {
        signalType: CommercialTrustSignalType.SPONSORED_DISCOVERY_CONVERSION,
        signalStrength: sponsoredConversationConversionRate,
        confidenceLevel: CommercialTrustDataConfidence.MEDIUM,
        explanation:
          "Taux de fenêtres sponsorisées ayant atteint l’état corridor « relation acceptée » — signal corridor, pas viralité.",
        metadata: { swTotal, swConverted },
      },
      {
        signalType: CommercialTrustSignalType.COMMERCIAL_RESPONSIVENESS,
        signalStrength:
          averageNegotiationResponseMinutes == null
            ? 0.4
            : clamp01(1 - Math.min(1, averageNegotiationResponseMinutes / 10080)),
        confidenceLevel: CommercialTrustDataConfidence.LOW,
        explanation:
          "Latence proxy basée sur createdAt→updatedAt des négociations closes (échantillon borné) — pas le volume de messages sociaux.",
        metadata: { averageNegotiationResponseMinutes },
      },
      {
        signalType: CommercialTrustSignalType.HIGH_NEGOTIATION_DROP_RATE,
        signalStrength: dropHeavy ? 0.85 : 0.15,
        confidenceLevel: CommercialTrustDataConfidence.MEDIUM,
        explanation:
          "Part élevée de négociations closes en rejet / expiration vs autres closes — indicateur de friction, pas une sanction publique.",
        metadata: { dropHeavy },
      },
      {
        signalType: CommercialTrustSignalType.DORMANT_CORRIDOR,
        signalStrength: dormantRelationshipRatio,
        confidenceLevel: CommercialTrustDataConfidence.LOW,
        explanation:
          "Relations acceptées sans commande récente (fenêtre 120 j, échantillon borné) — corridor dormante possible.",
        metadata: { dormantEdgeCap: DORMANT_EDGE_CAP },
      },
      {
        signalType: CommercialTrustSignalType.SYMBOLIC_RESERVATION_MISMATCH,
        signalStrength: clamp01(1 - symbolicReservationReliability),
        confidenceLevel: CommercialTrustDataConfidence.LOW,
        explanation:
          "Réservations symboliques draft vs expirations — heuristique d’alignement humain, pas stock WMS.",
        metadata: { resConv, resExp },
      },
      {
        signalType: CommercialTrustSignalType.COMMERCIAL_ALIGNMENT_SIGNAL,
        signalStrength: commercialStabilitySignal,
        confidenceLevel: dataConfidenceLevel,
        explanation:
          "Synthèse interne de complétion négociation, silence relatif et corridor dormant — interprétation économique indicative.",
        metadata: {},
      },
      {
        signalType: CommercialTrustSignalType.ORDER_FULFILLMENT_CONSISTENCY,
        signalStrength: orderFulfillmentConsistency,
        confidenceLevel: ordersEngaged === 0 ? CommercialTrustDataConfidence.LOW : dataConfidenceLevel,
        explanation:
          "Agrégat corridor des commandes non-brouillon : part des statuts COMPLETED vs autres statuts — aucun montant ni prix.",
        metadata: {
          sourceCounters: { ordersEngaged, ordersCompleted },
        },
      },
      {
        signalType: CommercialTrustSignalType.RELATIONSHIP_REJECTION_PATTERN,
        signalStrength: rejectionPatternRatio,
        confidenceLevel: relationshipCount === 0 ? CommercialTrustDataConfidence.LOW : CommercialTrustDataConfidence.MEDIUM,
        explanation:
          "Part des relations rejetées ou bloquées vs relations vues — friction relationnelle, pas sanction publique ni classement.",
        metadata: {
          sourceCounters: { rejectionOrBlocked, relationshipCount },
        },
      },
    ];

    await this.prisma.commercialTrustSignal.deleteMany({ where: { profileId: profile.id } });
    await this.prisma.commercialTrustSignal.createMany({
      data: signals.map((s) => ({
        profileId: profile.id,
        signalType: s.signalType,
        signalStrength: s.signalStrength,
        heuristicOnly: true,
        confidenceLevel: s.confidenceLevel,
        explanation: s.explanation,
        metadata: s.metadata as Prisma.InputJsonValue,
        computedAt: now,
      })),
    });

    const edgesForSnap = await this.prisma.relationship.findMany({
      where: acceptedRelationshipWhereForOrg(orgId),
      take: EDGE_SNAPSHOT_CAP,
      select: {
        id: true,
        status: true,
        source: true,
        upstreamOrganizationId: true,
        downstreamOrganizationId: true,
        requesterOrganizationId: true,
        receiverOrganizationId: true,
        acceptedAt: true,
        createdAt: true,
      },
    });

    for (const e of edgesForSnap) {
      let peer: string | null = null;
      if (e.upstreamOrganizationId && e.downstreamOrganizationId) {
        peer = e.upstreamOrganizationId === orgId ? e.downstreamOrganizationId : e.upstreamOrganizationId;
      } else if (e.requesterOrganizationId && e.receiverOrganizationId) {
        peer = e.requesterOrganizationId === orgId ? e.receiverOrganizationId : e.requesterOrganizationId;
      }
      if (!peer) continue;
      const negC = await this.prisma.negotiation.count({
        where: {
          OR: [
            { buyerOrganizationId: orgId, sellerOrganizationId: peer },
            { buyerOrganizationId: peer, sellerOrganizationId: orgId },
          ],
        },
      });
      const succN = await this.prisma.negotiation.count({
        where: {
          OR: [
            { buyerOrganizationId: orgId, sellerOrganizationId: peer },
            { buyerOrganizationId: peer, sellerOrganizationId: orgId },
          ],
          status: { in: [NegotiationStatus.ACCEPTED, NegotiationStatus.CONVERTED_TO_CART] },
        },
      });
      await this.prisma.commercialTrustRelationshipSnapshot.upsert({
        where: {
          profileId_relatedOrganizationId: { profileId: profile.id, relatedOrganizationId: peer },
        },
        create: {
          profileId: profile.id,
          organizationId: orgId,
          relatedOrganizationId: peer,
          relationshipId: e.id,
          relationshipState: e.status,
          trustDirection: CommercialTrustDirection.BILATERAL,
          interactionVolume: negC,
          negotiationCount: negC,
          successfulNegotiationCount: succN,
          sponsoredDiscoveryOrigin: e.source === RelationshipSource.SPONSORED_DISCOVERY,
          lastInteractionAt: e.acceptedAt ?? e.createdAt,
        },
        update: {
          relationshipId: e.id,
          relationshipState: e.status,
          interactionVolume: negC,
          negotiationCount: negC,
          successfulNegotiationCount: succN,
          sponsoredDiscoveryOrigin: e.source === RelationshipSource.SPONSORED_DISCOVERY,
          lastInteractionAt: e.acceptedAt ?? e.createdAt,
        },
      });
    }

    const changedSignals = signals
      .filter((s) => s.signalStrength >= 0.62 || s.signalStrength <= 0.22)
      .map((s) => s.signalType);

    await this.realtime.publishTrustUpdated({
      organizationId: orgId,
      trustLevel,
      changedSignals,
      computedAt: now.toISOString(),
    });

    for (const e of edgesForSnap.slice(0, 3)) {
      let peer: string | null = null;
      if (e.upstreamOrganizationId && e.downstreamOrganizationId) {
        peer = e.upstreamOrganizationId === orgId ? e.downstreamOrganizationId : e.upstreamOrganizationId;
      } else if (e.requesterOrganizationId && e.receiverOrganizationId) {
        peer = e.requesterOrganizationId === orgId ? e.receiverOrganizationId : e.requesterOrganizationId;
      }
      if (!peer) continue;
      await this.realtime.publishRelationshipSignalChanged({
        organizationId: orgId,
        relationshipId: e.id,
        trustLevel,
        changedSignals: ["SNAPSHOT_REFRESH"],
        computedAt: now.toISOString(),
      });
    }

    this.log.log(
      JSON.stringify({
        job: "commercial_trust_compute",
        phase: "completed",
        organizationId: orgId,
        trustLevel,
        trustScore,
        signalCount: signals.length,
      }),
    );
  }

  buildDiagnostics(input: {
    negotiationCount: number;
    acceptedRelationshipCount: number;
    dataConfidenceLevel: CommercialTrustDataConfidence;
    signals: { signalType: CommercialTrustSignalType; confidenceLevel: CommercialTrustDataConfidence }[];
    lastComputedAt: Date | null;
    visibilityScope: import("./commercial-trust-visibility.service").CommercialTrustVisibilityScope;
  }): CommercialTrustDiagnostics {
    const lowConfidenceAreas = input.signals
      .filter((s) => s.confidenceLevel === CommercialTrustDataConfidence.LOW)
      .map((s) => String(s.signalType));
    const unresolvedSignals = input.signals
      .filter((s) => s.confidenceLevel === CommercialTrustDataConfidence.LOW && String(s.signalType).includes("MISMATCH"))
      .map((s) => String(s.signalType));
    const heuristicCoverage = clamp01(
      (input.negotiationCount > 0 ? 0.35 : 0) + (input.acceptedRelationshipCount > 0 ? 0.45 : 0) + 0.2,
    );
    const trustProfileCompleteness = clamp01(
      (input.negotiationCount >= 8 ? 0.25 : input.negotiationCount * 0.03) +
        (input.acceptedRelationshipCount >= 3 ? 0.45 : input.acceptedRelationshipCount * 0.12) +
        0.3,
    );
    const lastIso = input.lastComputedAt ? input.lastComputedAt.toISOString() : null;
    return {
      trustProfileCompleteness,
      heuristicCoverage,
      lowConfidenceAreas,
      unresolvedSignals,
      economicInterpretationReady:
        input.dataConfidenceLevel !== CommercialTrustDataConfidence.LOW && input.acceptedRelationshipCount >= 1,
      heuristicOnly: true,
      publicMarketplaceExposure: false,
      publicRankingDisabled: true,
      socialScoringDisabled: true,
      privateEconomicTrustLayer: true,
      visibilityScope: input.visibilityScope,
      confidenceLevel: input.dataConfidenceLevel,
      dataConfidenceLevel: input.dataConfidenceLevel,
      dataCompleteness: trustProfileCompleteness,
      computationSource: "COMMERCIAL_TRUST_V1_HEURISTIC",
      computationMode: "PER_ORGANIZATION",
      incrementalReady: true,
      lastComputedAt: lastIso,
      actorRequired: true,
      anonymousAccessAllowed: false,
      visibilityEnforcedAt: "GUARD_AND_SERVICE",
    };
  }
}
