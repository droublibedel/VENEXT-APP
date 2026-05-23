import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { RelationalSectorPressureLevel, RelationalSectorSignalType } from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalSectorDependencyService } from "./relational-sector-dependency.service";
import { RelationalSectorExpansionService } from "./relational-sector-expansion.service";
import { RelationalSectorMarketStructureService } from "./relational-sector-market-structure.service";
import { RelationalSectorPolicyService } from "./relational-sector-policy.service";
import { RelationalSectorPressureService } from "./relational-sector-pressure.service";
import { RelationalSectorPropagationService } from "./relational-sector-propagation.service";
import { RelationalSectorRealtimeService } from "./relational-sector-realtime.service";
import { RelationalSectorStreamingService } from "./relational-sector-streaming.service";
import { RelationalSupplyFlowIngestionService } from "../relational-supply-flow/relational-supply-flow-ingestion.service";

/**
 * Instruction 20.23 — chained after geo-economic intelligence (20.22).
 */
@Injectable()
export class RelationalSectorIngestionService {
  private readonly log = new Logger(RelationalSectorIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalSectorPolicyService,
    private readonly marketStructure: RelationalSectorMarketStructureService,
    private readonly pressure: RelationalSectorPressureService,
    private readonly dependency: RelationalSectorDependencyService,
    private readonly propagation: RelationalSectorPropagationService,
    private readonly expansion: RelationalSectorExpansionService,
    private readonly realtime: RelationalSectorRealtimeService,
    private readonly streaming: RelationalSectorStreamingService,
    @Inject(forwardRef(() => RelationalSupplyFlowIngestionService))
    private readonly supplyFlowIngestion: RelationalSupplyFlowIngestionService,
  ) {}

  private async sectorEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_sector_intelligence_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_sector_intelligence_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /**
   * Instruction 20.23 — materialize sector nodes & dependencies from corridor + geo + pressure signals.
   */
  async syncSectorIntelligenceState(relationshipId: string): Promise<void> {
    try {
      if (!(await this.sectorEnabled(relationshipId))) return;

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
      const pressureScore = pressureNode?.pressureScore ?? 40;
      const fragilityScore = pressureNode?.fragilityScore ?? 30;
      const dependencyDensity = pressureNode?.dependencyDensity ?? 28;
      const focalNode = await this.prisma.relationalEconomicDependencyNode.findUnique({
        where: { relationshipId },
        select: { id: true },
      });
      const peerCount = focalNode
        ? Math.min(
            48,
            await this.prisma.relationalEconomicDependencyEdge.count({
              where: { status: "ACTIVE", sourceNodeId: focalNode.id },
            }),
          )
        : 0;

      const zones = await this.prisma.relationalGeoEconomicZoneCorridor.findMany({
        where: { relationshipId },
        include: { zone: { select: { economicPressureScore: true } } },
        take: 12,
      });
      const geoAvg =
        zones.length === 0
          ? 0
          : Math.round(zones.reduce((s, z) => s + z.zone.economicPressureScore, 0) / zones.length);

      const fulfillmentCount = await this.prisma.relationalFulfillmentRecord.count({
        where: { relationshipId },
      });
      const fulfillmentStress = this.policy.clampInt(Math.min(100, fulfillmentCount * 6));

      const vector = this.marketStructure.computeMarketStructureVector({
        pressureScore,
        fragilityScore,
        dependencyDensity,
        peerCount,
        geoZoneAvgPressure: geoAvg,
        fulfillmentStress,
        sectorPairCount: 2,
      });
      const marketStructureType = this.marketStructure.classifyStructure(vector);
      const cumulative = vector.cumulativePressure;

      const [reqOrg, recOrg] = await Promise.all([
        this.prisma.organization.findUnique({
          where: { id: rel.requesterOrganizationId },
          select: { activityLabel: true, category: true, country: true, city: true },
        }),
        this.prisma.organization.findUnique({
          where: { id: rel.receiverOrganizationId },
          select: { activityLabel: true, category: true, country: true, city: true },
        }),
      ]);
      if (!reqOrg || !recOrg) return;

      const operationalRisk = this.pressure.blendOperationalRisk({
        pressureScore,
        fragilityScore,
        vectorCumulativePressure: cumulative,
      });
      const pressureLevel = this.pressure.riskScoreToPressureLevel(operationalRisk);
      const concentrationLevel = this.pressure.concentrationFromVector(vector.sectorConcentration);
      const expansionPotential = this.expansion.expansionPotentialFromSignals({
        expansionCapacity: vector.expansionCapacity,
        diversificationGap: vector.diversificationGap,
        oligopolyRisk: vector.oligopolyRisk,
        peerCount,
      });

      const nodePayloads = [
        {
          slug: `REQ_${this.policy.slugify(reqOrg.activityLabel)}`,
          name: reqOrg.activityLabel,
          type: this.policy.sectorTypeFromCategory(reqOrg.category),
          country: reqOrg.country,
          city: reqOrg.city,
        },
        {
          slug: `RCV_${this.policy.slugify(recOrg.activityLabel)}`,
          name: recOrg.activityLabel,
          type: this.policy.sectorTypeFromCategory(recOrg.category),
          country: recOrg.country,
          city: recOrg.city,
        },
      ];

      const nodes: { id: string; sectorSlug: string }[] = [];
      for (const np of nodePayloads) {
        const sectorCode = `SECTOR:${relationshipId}:${np.slug}`;
        const dependencyScore = this.policy.clampInt(dependencyDensity + peerCount * 2);
        const n = await this.prisma.relationalSectorNode.upsert({
          where: { sectorCode },
          create: {
            relationshipId,
            sectorCode,
            sectorType: np.type,
            sectorName: np.name.slice(0, 400),
            sectorSlug: np.slug.slice(0, 120),
            territoryCountry: np.country.slice(0, 120),
            territoryCity: np.city.slice(0, 200),
            marketStructureType,
            concentrationLevel,
            pressureLevel,
            operationalRiskScore: operationalRisk,
            expansionPotentialScore: expansionPotential,
            fragilityScore: this.policy.clampInt(fragilityScore + peerCount),
            dependencyScore,
            diagnostics: { vector, ingestion: "relational_sector.syncSectorIntelligenceState" } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
          update: {
            sectorType: np.type,
            sectorName: np.name.slice(0, 400),
            territoryCountry: np.country.slice(0, 120),
            territoryCity: np.city.slice(0, 200),
            marketStructureType,
            concentrationLevel,
            pressureLevel,
            operationalRiskScore: operationalRisk,
            expansionPotentialScore: expansionPotential,
            fragilityScore: this.policy.clampInt(fragilityScore + peerCount),
            dependencyScore,
            diagnostics: { vector, ingestion: "relational_sector.syncSectorIntelligenceState" } as Prisma.InputJsonValue,
          },
        });
        nodes.push({ id: n.id, sectorSlug: n.sectorSlug });
      }

      if (this.policy.canMutateSectorState(rel.corridorState)) {
        await this.dependency.rebuildDependenciesForRelationship(relationshipId, nodes, cumulative);
        await this.prisma.relationalSectorSignal.deleteMany({ where: { relationshipId } });

        if (operationalRisk >= 68) {
          const created = await this.prisma.relationalSectorSignal.create({
            data: {
              relationshipId,
              sectorNodeId: nodes[0]!.id,
              signalType: RelationalSectorSignalType.SECTOR_PRESSURE_ALERT,
              severity: pressureLevel,
              title: "Pression sectorielle corridor",
              description:
                "Lecture infrastructurelle: pression cumulative dépasse le seuil d’observation — corrélation interne, pas scoring marketplace.",
              signalScore: operationalRisk,
              propagationRisk: this.policy.clampInt(vector.marketFragility),
              pressureContribution: this.policy.clampInt(cumulative),
              diagnostics: { vectorKey: "cumulativePressure" } as Prisma.InputJsonValue,
              metadata: {} as Prisma.InputJsonValue,
            },
          });
          if (order) {
            await this.realtime
              .publishToOrganizations({
                buyerOrganizationId: order.buyerOrganizationId,
                sellerOrganizationId: order.sellerOrganizationId,
                relationshipId,
                sectorNodeId: created.sectorNodeId,
                sectorCode: `SECTOR:${relationshipId}:${nodePayloads[0]!.slug}`,
                intensity: this.policy.clampInt(operationalRisk),
                propagationDepth: 0,
                eventType: "relational.sector.signal_created",
              })
              .catch((e) => this.log.warn(String(e)));
          }
        }
        if (vector.marketFragility >= 62) {
          await this.prisma.relationalSectorSignal.create({
            data: {
              relationshipId,
              sectorNodeId: nodes[1]!.id,
              signalType: RelationalSectorSignalType.MARKET_FRAGILITY,
              severity: RelationalSectorPressureLevel.HIGH,
              title: "Fragilité de structure de marché",
              description:
                "Indicateur déterministe de fragilité agrégée (dépendances + saturation) — audit analytique, pas ERP.",
              signalScore: this.policy.clampInt(vector.marketFragility),
              propagationRisk: this.policy.clampInt(vector.criticalDependency),
              pressureContribution: this.policy.clampInt(vector.corridorSaturation),
              diagnostics: { explainers: vector.explainers } as Prisma.InputJsonValue,
              metadata: {} as Prisma.InputJsonValue,
            },
          });
        }

        await this.prisma.relationalSectorEvent.create({
          data: {
            eventType: "STRUCTURE_RECOMPUTED",
            relationshipId,
            sectorNodeId: nodes[0]?.id,
            actorOrganizationId,
            diagnostics: { marketStructureType } as Prisma.InputJsonValue,
          },
        });
      }

      const { cascadePaths, maxDepthObserved } = await this.propagation.projectInterSectorPropagation(relationshipId);
      const systemicExposureScore = this.propagation.systemicExposureScore(cascadePaths);
      const edgeRows = await this.dependency.listDependenciesForRelationship(relationshipId);
      const edgeCount = edgeRows.length;

      if (order) {
        let fingerprintChanged = false;
        try {
          const r = await this.streaming.publishAfterIngestion({
            relationshipId,
            buyerOrganizationId: order.buyerOrganizationId,
            sellerOrganizationId: order.sellerOrganizationId,
            nodes,
            vector,
            marketStructureType,
            operationalRisk,
            pressureLevel,
            cascadePaths,
            maxDepthObserved,
            edgeCount,
            systemicExposureScore,
          });
          fingerprintChanged = r.fingerprintChanged;
        } catch (e) {
          this.log.warn(`sector streaming publish failed: ${String(e)}`);
        }

        if (fingerprintChanged && vector.marketFragility >= 62) {
          await this.realtime
            .publishToOrganizations({
              buyerOrganizationId: order.buyerOrganizationId,
              sellerOrganizationId: order.sellerOrganizationId,
              relationshipId,
              sectorNodeId: nodes[1]?.id ?? null,
              sectorCode: null,
              intensity: this.policy.clampInt(vector.marketFragility),
              propagationDepth: maxDepthObserved,
              eventType: "relational.sector.market_fragility_detected",
            })
            .catch((e) => this.log.warn(String(e)));
        }
        if (fingerprintChanged && expansionPotential >= 58) {
          await this.realtime
            .publishToOrganizations({
              buyerOrganizationId: order.buyerOrganizationId,
              sellerOrganizationId: order.sellerOrganizationId,
              relationshipId,
              sectorNodeId: null,
              sectorCode: null,
              intensity: this.policy.clampInt(expansionPotential),
              propagationDepth: 0,
              eventType: "relational.sector.expansion_opportunity_detected",
            })
            .catch((e) => this.log.warn(String(e)));
        }
        if (fingerprintChanged && operationalRisk >= 82) {
          await this.realtime
            .publishToOrganizations({
              buyerOrganizationId: order.buyerOrganizationId,
              sellerOrganizationId: order.sellerOrganizationId,
              relationshipId,
              sectorNodeId: nodes[0]?.id ?? null,
              sectorCode: null,
              intensity: this.policy.clampInt(92),
              propagationDepth: maxDepthObserved,
              eventType: "relational.sector.systemic_sector_risk",
            })
            .catch((e) => this.log.warn(String(e)));
        }
      }
    } catch (err) {
      this.log.warn(`sector intelligence ingestion failed: ${String(err)}`);
    } finally {
      await this.supplyFlowIngestion.syncSupplyFlowState(relationshipId).catch((e) =>
        this.log.warn(`supply flow intelligence chain: ${String(e)}`),
      );
    }
  }
}
