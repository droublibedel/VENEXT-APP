import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicDependencyService } from "./relational-economic-dependency.service";
import { RelationalEconomicPressurePolicyService } from "./relational-economic-pressure-policy.service";
import { RelationalEconomicPressureRealtimeService } from "./relational-economic-pressure-realtime.service";
import { RelationalGeoEconomicIngestionService } from "../relational-geo-economic/relational-geo-economic-ingestion.service";

const SYSTEM_ACTOR_USER_ID = "00000000-0000-4000-8000-000000000097";

@Injectable()
export class RelationalEconomicPressureIngestionService {
  private readonly log = new Logger(RelationalEconomicPressureIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicPressurePolicyService,
    private readonly dependency: RelationalEconomicDependencyService,
    private readonly realtime: RelationalEconomicPressureRealtimeService,
    @Inject(forwardRef(() => RelationalGeoEconomicIngestionService))
    private readonly geoIngestion: RelationalGeoEconomicIngestionService,
  ) {}

  private async enabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_economic_pressure_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_economic_pressure_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /**
   * Instruction 20.21 — runs after command center in graph ingestion chain.
   */
  async syncPressureMapForRelationship(relationshipId: string): Promise<void> {
    try {
      if (!(await this.enabled(relationshipId))) return;

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

      const mutable = this.policy.canMutateEconomicPressureGraph(rel.corridorState);

      if (mutable) {
        const order = await this.prisma.order.findFirst({
          where: { relationshipId },
          select: { buyerOrganizationId: true },
          orderBy: { createdAt: "desc" },
        });
        const actorOrganizationId = order?.buyerOrganizationId ?? rel.requesterOrganizationId;

        const metricsFocal = await this.dependency.computeNodeMetrics(relationshipId);
        const peers = await this.dependency.detectDependencyRelationships(relationshipId);

        const diagnostics: Prisma.InputJsonValue = {
          peerCorridorCount: peers.length,
          ingestion: "relational_economic_pressure.syncPressureMapForRelationship",
        };

        const focalNode = await this.prisma.relationalEconomicDependencyNode.upsert({
        where: { relationshipId },
        create: {
          relationshipId,
          nodeCode: `PRESSURE_NODE:${relationshipId}`,
          dependencyScore: metricsFocal.dependencyScore,
          pressureScore: metricsFocal.pressureScore,
          fragilityScore: metricsFocal.fragilityScore,
          propagationExposureScore: metricsFocal.propagationExposureScore,
          dependencyDensity: metricsFocal.dependencyDensity,
          criticalityLevel: metricsFocal.criticalityLevel,
          systemicWeight: metricsFocal.systemicWeight,
          diagnostics,
          metadata: {} as Prisma.InputJsonValue,
        },
        update: {
          dependencyScore: metricsFocal.dependencyScore,
          pressureScore: metricsFocal.pressureScore,
          fragilityScore: metricsFocal.fragilityScore,
          propagationExposureScore: metricsFocal.propagationExposureScore,
          dependencyDensity: metricsFocal.dependencyDensity,
          criticalityLevel: metricsFocal.criticalityLevel,
          systemicWeight: metricsFocal.systemicWeight,
          diagnostics,
        },
      });

      const peerNodeIds = new Map<string, string>();
      for (const pid of peers) {
        const mPeer = await this.dependency.computeNodeMetrics(pid);
        const peerDiag: Prisma.InputJsonValue = {
          peerCorridorCount: (await this.dependency.detectDependencyRelationships(pid)).length,
          ingestion: "relational_economic_pressure.peer_node",
        };
        const n = await this.prisma.relationalEconomicDependencyNode.upsert({
          where: { relationshipId: pid },
          create: {
            relationshipId: pid,
            nodeCode: `PRESSURE_NODE:${pid}`,
            dependencyScore: mPeer.dependencyScore,
            pressureScore: mPeer.pressureScore,
            fragilityScore: mPeer.fragilityScore,
            propagationExposureScore: mPeer.propagationExposureScore,
            dependencyDensity: mPeer.dependencyDensity,
            criticalityLevel: mPeer.criticalityLevel,
            systemicWeight: mPeer.systemicWeight,
            diagnostics: peerDiag,
            metadata: {} as Prisma.InputJsonValue,
          },
          update: {
            dependencyScore: mPeer.dependencyScore,
            pressureScore: mPeer.pressureScore,
            fragilityScore: mPeer.fragilityScore,
            propagationExposureScore: mPeer.propagationExposureScore,
            dependencyDensity: mPeer.dependencyDensity,
            criticalityLevel: mPeer.criticalityLevel,
            systemicWeight: mPeer.systemicWeight,
            diagnostics: peerDiag,
          },
        });
        peerNodeIds.set(pid, n.id);
      }

      await this.prisma.relationalEconomicDependencyEdge.deleteMany({
        where: { sourceNodeId: focalNode.id, status: "ACTIVE" },
      });

      for (const pid of peers) {
        const targetId = peerNodeIds.get(pid);
        if (!targetId) continue;
        const mPeer = await this.dependency.computeNodeMetrics(pid);
        const asymmetric = this.dependency.detectAsymmetricDependency(metricsFocal.pressureScore, mPeer.pressureScore);
        const w = this.policy.clampInt(18 + Math.abs(metricsFocal.pressureScore - mPeer.pressureScore));
        const prob = Math.min(1, (w / 100) * 0.92);
        const edge = await this.prisma.relationalEconomicDependencyEdge.create({
          data: {
            sourceNodeId: focalNode.id,
            targetNodeId: targetId,
            dependencyType: "SHARED_OPERATIONAL_RISK",
            dependencyWeight: w,
            propagationProbability: prob,
            asymmetricDependency: asymmetric,
            pressureContribution: this.policy.clampInt(w + metricsFocal.propagationExposureScore / 6),
            diagnostics: { focalRelationshipId: relationshipId, peerRelationshipId: pid } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });

        await this.prisma.relationalEconomicPressureEvent.create({
          data: {
            relationshipId,
            edgeId: edge.id,
            eventType: "DEPENDENCY_CREATED",
            actorOrganizationId: actorOrganizationId,
            actorUserId: SYSTEM_ACTOR_USER_ID,
            diagnostics: { peerRelationshipId: pid } as Prisma.InputJsonValue,
          },
        });
      }

      await this.prisma.relationalEconomicPressureEvent.create({
        data: {
          relationshipId,
          eventType: "PRESSURE_DETECTED",
          actorOrganizationId: actorOrganizationId,
          actorUserId: SYSTEM_ACTOR_USER_ID,
          diagnostics: { systemicWeight: metricsFocal.systemicWeight } as Prisma.InputJsonValue,
        },
      });

      if (peers.length >= 6) {
        await this.prisma.relationalEconomicPressureEvent.create({
          data: {
            relationshipId,
            eventType: "SYSTEMIC_CONCENTRATION_DETECTED",
            actorOrganizationId: actorOrganizationId,
            actorUserId: SYSTEM_ACTOR_USER_ID,
            diagnostics: { peerCount: peers.length } as Prisma.InputJsonValue,
          },
        });
      }

      const parties = await this.prisma.order.findFirst({
        where: { relationshipId },
        select: { buyerOrganizationId: true, sellerOrganizationId: true },
        orderBy: { createdAt: "desc" },
      });
      if (parties) {
        const systemicPressure = this.policy.clampInt(
          (metricsFocal.pressureScore +
            metricsFocal.dependencyDensity +
            metricsFocal.propagationExposureScore) /
            3,
        );
        await this.realtime
          .publishBothSides({
            buyerOrganizationId: parties.buyerOrganizationId,
            sellerOrganizationId: parties.sellerOrganizationId,
            relationshipId,
            edgeId: null,
            severity: metricsFocal.criticalityLevel,
            systemicPressure,
            eventType: "relational.pressure.pressure_detected",
          })
          .catch((e) => this.log.warn(String(e)));
        if (metricsFocal.criticalityLevel === "CRITICAL" || metricsFocal.criticalityLevel === "HIGH") {
          await this.realtime
            .publishBothSides({
              buyerOrganizationId: parties.buyerOrganizationId,
              sellerOrganizationId: parties.sellerOrganizationId,
              relationshipId,
              edgeId: null,
              severity: metricsFocal.criticalityLevel,
              systemicPressure,
              eventType: "relational.pressure.critical_corridor_detected",
            })
            .catch((e) => this.log.warn(String(e)));
        }
        if (peers.length >= 6) {
          await this.realtime
            .publishBothSides({
              buyerOrganizationId: parties.buyerOrganizationId,
              sellerOrganizationId: parties.sellerOrganizationId,
              relationshipId,
              edgeId: null,
              severity: metricsFocal.criticalityLevel,
              systemicPressure,
              eventType: "relational.pressure.concentration_detected",
            })
            .catch((e) => this.log.warn(String(e)));
        }
      }
      }

      await this.geoIngestion.syncGeoEconomicState(relationshipId).catch((e) => this.log.warn(String(e)));
    } catch (err) {
      this.log.warn(`economic pressure ingestion failed: ${String(err)}`);
    }
  }
}
