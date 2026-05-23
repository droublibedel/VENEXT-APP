import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicDependencyService } from "../relational-economic-pressure/relational-economic-dependency.service";
import { RelationalGeoEconomicDensityService } from "./relational-geo-economic-density.service";
import { RelationalGeoEconomicExpansionService } from "./relational-geo-economic-expansion.service";
import { RelationalGeoEconomicPolicyService } from "./relational-geo-economic-policy.service";
import { RelationalGeoEconomicPressureService } from "./relational-geo-economic-pressure.service";
import { RelationalGeoEconomicPropagationService } from "./relational-geo-economic-propagation.service";
import { RelationalGeoEconomicRealtimeService } from "./relational-geo-economic-realtime.service";
import { RelationalSectorIngestionService } from "../relational-sector-intelligence/relational-sector-ingestion.service";

const SYSTEM_ACTOR_USER_ID = "00000000-0000-4000-8000-000000000097";

/**
 * Instruction 20.22 — chained after economic pressure mapping (20.21).
 */
@Injectable()
export class RelationalGeoEconomicIngestionService {
  private readonly log = new Logger(RelationalGeoEconomicIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalGeoEconomicPolicyService,
    @Inject(forwardRef(() => RelationalEconomicDependencyService))
    private readonly dependency: RelationalEconomicDependencyService,
    private readonly density: RelationalGeoEconomicDensityService,
    private readonly pressureEngine: RelationalGeoEconomicPressureService,
    private readonly propagation: RelationalGeoEconomicPropagationService,
    private readonly expansion: RelationalGeoEconomicExpansionService,
    private readonly realtime: RelationalGeoEconomicRealtimeService,
    @Inject(forwardRef(() => RelationalSectorIngestionService))
    private readonly sectorIngestion: RelationalSectorIngestionService,
  ) {}

  private async geoEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_geo_economic_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_geo_economic_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /**
   * Instruction 20.22 — territorial projection from corridor + pressure topology (no GPS).
   */
  async syncGeoEconomicState(relationshipId: string): Promise<void> {
    if (!(await this.geoEnabled(relationshipId))) return;
    try {
      const rel = await this.prisma.relationship.findUnique({
        where: { id: relationshipId },
        select: {
          corridorState: true,
          requesterOrganizationId: true,
          receiverOrganizationId: true,
        },
      });
      if (!rel) return;

      await this.governance.assertCorridorOperational(relationshipId, "operational_observation");

      const order = await this.prisma.order.findFirst({
        where: { relationshipId },
        select: { buyerOrganizationId: true, sellerOrganizationId: true },
        orderBy: { createdAt: "desc" },
      });
      const actorOrganizationId = order?.buyerOrganizationId ?? rel.requesterOrganizationId;

      const pressureNode = await this.prisma.relationalEconomicDependencyNode.findUnique({
        where: { relationshipId },
      });
      const peers = await this.dependency.detectDependencyRelationships(relationshipId);

      if (!this.policy.canMutateGeoEconomicState(rel.corridorState)) {
        return;
      }

      const [reqOrg, recOrg] = await Promise.all([
        this.prisma.organization.findUnique({
          where: { id: rel.requesterOrganizationId },
          select: { country: true, city: true },
        }),
        this.prisma.organization.findUnique({
          where: { id: rel.receiverOrganizationId },
          select: { country: true, city: true },
        }),
      ]);
      if (!reqOrg || !recOrg) return;

      const crossBorder =
        this.policy.normalizeTerritoryCodes(reqOrg.country, reqOrg.city).countryCode !==
        this.policy.normalizeTerritoryCodes(recOrg.country, recOrg.city).countryCode;

      const pressureScore = pressureNode?.pressureScore ?? 42;
      const dependencyDensity = pressureNode?.dependencyDensity ?? 30;
      const fragilityScore = pressureNode?.fragilityScore ?? 28;
      const propagationExposureScore = pressureNode?.propagationExposureScore ?? 22;

      const territories = [
        this.policy.normalizeTerritoryCodes(reqOrg.country, reqOrg.city),
        this.policy.normalizeTerritoryCodes(recOrg.country, recOrg.city),
      ];

      const zoneType = this.policy.zoneTypeFromSignals(crossBorder, pressureScore);

      const zoneIds: string[] = [];
      for (const t of territories) {
        const z = await this.prisma.relationalGeoEconomicZone.upsert({
          where: { zoneCode: t.zoneCode },
          create: {
            zoneCode: t.zoneCode,
            zoneName: t.zoneName,
            zoneType,
            countryCode: t.countryCode,
            regionCode: t.regionCode,
            diagnostics: { ingestion: "relational_geo_economic.syncGeoEconomicState" } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
          update: {
            zoneName: t.zoneName,
            zoneType,
            countryCode: t.countryCode,
            regionCode: t.regionCode,
          },
        });
        zoneIds.push(z.id);
      }

      const uniqueZoneIds = Array.from(new Set(zoneIds));

      const cw = this.policy.clampInt(pressureScore) / 100;
      const od = this.policy.clampInt(dependencyDensity) / 100;
      const pe = this.policy.clampInt(propagationExposureScore) / 100;
      const si = this.policy.clampInt((pressureScore + fragilityScore) / 2) / 100;

      for (const zid of uniqueZoneIds) {
        await this.prisma.relationalGeoEconomicZoneCorridor.upsert({
          where: {
            relationshipId_zoneId: { relationshipId, zoneId: zid },
          },
          create: {
            relationshipId,
            zoneId: zid,
            corridorWeight: cw,
            operationalDependency: od,
            propagationExposure: pe,
            strategicImportance: si,
            diagnostics: { peerCount: peers.length } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
          update: {
            corridorWeight: cw,
            operationalDependency: od,
            propagationExposure: pe,
            strategicImportance: si,
            diagnostics: { peerCount: peers.length } as Prisma.InputJsonValue,
          },
        });
      }

      for (const zid of uniqueZoneIds) {
        await this.refreshZoneScores(zid, peers.length, {
          pressureScore,
          dependencyDensity,
          fragilityScore,
          propagationExposureScore,
        });
      }

      await this.appendEventsAndRealtime({
        relationshipId,
        actorOrganizationId,
        uniqueZoneIds,
        peers,
        pressureScore,
        parties: order,
      });
    } catch (err) {
      this.log.warn(`geo-economic ingestion failed: ${String(err)}`);
    } finally {
      await this.sectorIngestion.syncSectorIntelligenceState(relationshipId).catch((e) =>
        this.log.warn(`sector intelligence chain: ${String(e)}`),
      );
    }
  }

  private async refreshZoneScores(
    zoneId: string,
    peerCount: number,
    node: {
      pressureScore: number;
      dependencyDensity: number;
      fragilityScore: number;
      propagationExposureScore: number;
    },
  ): Promise<void> {
    const corridorCount = await this.prisma.relationalGeoEconomicZoneCorridor.count({ where: { zoneId } });
    const clusterCount = Math.min(48, peerCount);
    const density = this.density.computeZoneDensity({
      corridorCount,
      clusterCount,
      pressureScore: node.pressureScore,
      dependencyDensity: node.dependencyDensity,
      fragilityScore: node.fragilityScore,
      propagationExposureScore: node.propagationExposureScore,
    });
    const exposure = this.propagation.computeZoneExposure({
      corridorCount,
      systemicExposureScore: this.policy.clampInt(node.propagationExposureScore + corridorCount * 2),
      fragilityScore: node.fragilityScore,
    });
    const zoneCodeRow = await this.prisma.relationalGeoEconomicZone.findUnique({
      where: { id: zoneId },
      select: { zoneCode: true },
    });
    const slice = {
      zoneCode: zoneCodeRow?.zoneCode ?? "",
      economicPressureScore: node.pressureScore,
      corridorCount,
      systemicExposureScore: exposure,
      operationalDensityScore: density.operationalDensityScore,
    };
    const det = this.pressureEngine.detectPressureZones([slice]);
    const economicPressure = this.pressureEngine.economicPressureScoreFromVector(det, corridorCount);
    const weights = await this.prisma.relationalGeoEconomicZoneCorridor.aggregate({
      where: { zoneId },
      _avg: { corridorWeight: true },
    });
    const cwAvg = weights._avg.corridorWeight ?? 0;
    const exp = this.expansion.computeExpansionPotential({
      corridorCount,
      corridorWeightAvg: cwAvg,
      operationalDensityScore: density.operationalDensityScore,
      economicPressureScore: economicPressure,
      peerCorridorCount: peerCount,
    });

    await this.prisma.relationalGeoEconomicZone.update({
      where: { id: zoneId },
      data: {
        corridorCount,
        activeClusterCount: clusterCount,
        operationalDensityScore: density.operationalDensityScore,
        economicPressureScore: economicPressure,
        systemicExposureScore: exposure,
        expansionPotentialScore: exp.expansionPotentialScore,
        fragilityScore: this.policy.clampInt(node.fragilityScore + corridorCount),
        diagnostics: {
          densityVector: density,
          expansion: exp,
          pressureDetection: det,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private async appendEventsAndRealtime(input: {
    relationshipId: string;
    actorOrganizationId: string;
    uniqueZoneIds: string[];
    peers: string[];
    pressureScore: number;
    parties: { buyerOrganizationId: string; sellerOrganizationId: string } | null;
  }): Promise<void> {
    const { relationshipId, actorOrganizationId, uniqueZoneIds, peers, pressureScore, parties } = input;

    for (const zid of uniqueZoneIds) {
      await this.prisma.relationalGeoEconomicEvent.create({
        data: {
          relationshipId,
          zoneId: zid,
          eventType: "ZONE_PRESSURE_DETECTED",
          actorOrganizationId,
          actorUserId: SYSTEM_ACTOR_USER_ID,
          diagnostics: { pressureScore } as Prisma.InputJsonValue,
        },
      });
    }

    if (peers.length >= 6) {
      await this.prisma.relationalGeoEconomicEvent.create({
        data: {
          relationshipId,
          eventType: "REGIONAL_CLUSTER_CREATED",
          actorOrganizationId,
          actorUserId: SYSTEM_ACTOR_USER_ID,
          diagnostics: { peerCount: peers.length } as Prisma.InputJsonValue,
        },
      });
    }

    if (pressureScore >= 78) {
      await this.prisma.relationalGeoEconomicEvent.create({
        data: {
          relationshipId,
          eventType: "SYSTEMIC_ZONE_RISK_DETECTED",
          actorOrganizationId,
          actorUserId: SYSTEM_ACTOR_USER_ID,
          diagnostics: { pressureScore } as Prisma.InputJsonValue,
        },
      });
    }

    const { cascadePaths } = await this.propagation.projectRegionalPropagation(relationshipId);
    if (cascadePaths.some((p) => p.path.length >= 3)) {
      await this.prisma.relationalGeoEconomicEvent.create({
        data: {
          relationshipId,
          eventType: "GEO_ECONOMIC_PROPAGATION_DETECTED",
          actorOrganizationId,
          actorUserId: SYSTEM_ACTOR_USER_ID,
          diagnostics: { paths: cascadePaths.length } as Prisma.InputJsonValue,
        },
      });
    }

    if (!parties) return;

    const z = await this.prisma.relationalGeoEconomicZone.findFirst({ where: { id: { in: uniqueZoneIds } } });
    const zoneCode = z?.zoneCode ?? null;
    const depth = Math.min(this.policy.maxPropagationDepth(), cascadePaths.reduce((m, p) => Math.max(m, p.path.length - 1), 0));

    await this.realtime
      .publishToOrganizations({
        buyerOrganizationId: parties.buyerOrganizationId,
        sellerOrganizationId: parties.sellerOrganizationId,
        relationshipId,
        zoneCode,
        territorialIntensity: this.policy.clampInt(pressureScore),
        propagationDepth: depth,
        eventType: "relational.geo.zone_pressure_detected",
      })
      .catch((e) => this.log.warn(String(e)));

    if (peers.length >= 6) {
      await this.realtime
        .publishToOrganizations({
          buyerOrganizationId: parties.buyerOrganizationId,
          sellerOrganizationId: parties.sellerOrganizationId,
          relationshipId,
          zoneCode,
          territorialIntensity: this.policy.clampInt(pressureScore + peers.length),
          propagationDepth: depth,
          eventType: "relational.geo.cluster_detected",
        })
        .catch((e) => this.log.warn(String(e)));
    }

    if (cascadePaths.some((p) => p.path.length >= 3)) {
      await this.realtime
        .publishToOrganizations({
          buyerOrganizationId: parties.buyerOrganizationId,
          sellerOrganizationId: parties.sellerOrganizationId,
          relationshipId,
          zoneCode,
          territorialIntensity: this.policy.clampInt(pressureScore + 8),
          propagationDepth: depth,
          eventType: "relational.geo.propagation_detected",
        })
        .catch((e) => this.log.warn(String(e)));
    }

    if (pressureScore >= 55 && peers.length <= 4) {
      await this.realtime
        .publishToOrganizations({
          buyerOrganizationId: parties.buyerOrganizationId,
          sellerOrganizationId: parties.sellerOrganizationId,
          relationshipId,
          zoneCode,
          territorialIntensity: this.policy.clampInt(60),
          propagationDepth: depth,
          eventType: "relational.geo.expansion_detected",
        })
        .catch((e) => this.log.warn(String(e)));
    }

    if (pressureScore >= 85) {
      await this.realtime
        .publishToOrganizations({
          buyerOrganizationId: parties.buyerOrganizationId,
          sellerOrganizationId: parties.sellerOrganizationId,
          relationshipId,
          zoneCode,
          territorialIntensity: this.policy.clampInt(92),
          propagationDepth: depth,
          eventType: "relational.geo.critical_zone_detected",
        })
        .catch((e) => this.log.warn(String(e)));

      await this.prisma.relationalGeoEconomicEvent.create({
        data: {
          relationshipId,
          eventType: "CRITICAL_ZONE_IDENTIFIED",
          actorOrganizationId,
          actorUserId: SYSTEM_ACTOR_USER_ID,
          diagnostics: { pressureScore } as Prisma.InputJsonValue,
        },
      });
    }
  }
}
