import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalSupplyFlowEventType,
  RelationalSupplyFlowSignalType,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalSupplyFlowBottleneckService } from "./relational-supply-flow-bottleneck.service";
import { RelationalSupplyFlowCorridorContextService } from "./relational-supply-flow-corridor-context.service";
import { RelationalSupplyFlowDependencyService } from "./relational-supply-flow-dependency.service";
import { RelationalSupplyFlowNodeService } from "./relational-supply-flow-node.service";
import { RelationalSupplyFlowPolicyService } from "./relational-supply-flow-policy.service";
import { RelationalSupplyFlowPropagationService } from "./relational-supply-flow-propagation.service";
import { RelationalSupplyFlowRealtimeService } from "./relational-supply-flow-realtime.service";
import { RelationalMacroEconomicIngestionService } from "../relational-macro-economic/relational-macro-economic-ingestion.service";

@Injectable()
export class RelationalSupplyFlowIngestionService {
  private readonly log = new Logger(RelationalSupplyFlowIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalSupplyFlowPolicyService,
    private readonly corridorContext: RelationalSupplyFlowCorridorContextService,
    private readonly nodes: RelationalSupplyFlowNodeService,
    private readonly bottleneck: RelationalSupplyFlowBottleneckService,
    private readonly dependency: RelationalSupplyFlowDependencyService,
    private readonly propagation: RelationalSupplyFlowPropagationService,
    private readonly realtime: RelationalSupplyFlowRealtimeService,
    @Inject(forwardRef(() => RelationalMacroEconomicIngestionService))
    private readonly macroIngestion: RelationalMacroEconomicIngestionService,
  ) {}

  private async supplyFlowEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_supply_flow_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_supply_flow_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /**
   * Instruction 20.24 — chained after sector intelligence (20.23); analytical projection only.
   * Instruction 20.24A — TERMINATED governance gate before any Prisma mutation.
   */
  async syncSupplyFlowState(relationshipId: string): Promise<void> {
    try {
      if (!(await this.supplyFlowEnabled(relationshipId))) return;

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

      const mutationGate = this.policy.assertSupplyFlowMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(
          JSON.stringify({
            phase: "supply_flow_ingestion_governance",
            relationshipId,
            ...mutationGate.diagnostics,
          }),
        );
        return;
      }

      const corridor = await this.corridorContext.load(relationshipId);
      if (!corridor.hasOrder || !corridor.buyerOrganizationId || !corridor.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "supply_flow_ingestion_blocked",
            relationshipId,
            reason: "no_order_for_corridor",
            mutationSkipped: true,
            governanceOperation: "supply_flow_ingestion",
          }),
        );
        return;
      }

      const fulfillmentCount = await this.prisma.relationalFulfillmentRecord.count({ where: { relationshipId } });

      const ctx = {
        relationshipId,
        buyerOrganizationId: corridor.buyerOrganizationId,
        sellerOrganizationId: corridor.sellerOrganizationId,
        sectorNodeId: corridor.sectorNodeId,
        geoZoneId: corridor.geoZoneId,
        territoryCountry: corridor.territoryCountry,
        territoryCity: corridor.territoryCity,
        productCategory: corridor.dominantProductCategory,
        productFlowCategories: corridor.productFlowCategories,
        dominantProductCategory: corridor.dominantProductCategory,
        volumeConfidenceLevel: corridor.volumeConfidenceLevel,
        predictiveSignalsUsed: corridor.predictiveUnresolvedCount,
        strategicMemoriesUsed: corridor.strategicMemoryActiveCount,
        operationalMetricsUsed: corridor.operationalMetricsUsed,
        heuristicFallbackUsed: corridor.heuristicFallbackUsed,
        fallbackReasons: corridor.fallbackReasons,
        pressureScore: corridor.pressureScore,
        fragilityScore: corridor.fragilityScore,
        fulfillmentCount,
        incidentCount: corridor.openIncidentCount,
      };

      const { primaryId, secondaryId } = await this.nodes.upsertCorridorFlowPair(ctx);

      const refreshed = await this.prisma.relationalSupplyFlowNode.findMany({
        where: { id: { in: [primaryId, secondaryId] } },
      });

      const bn = this.bottleneck.detectBottleneckFlows(refreshed, corridor.openIncidentCount, fulfillmentCount);
      for (const n of refreshed) {
        const hit = bn.get(n.id);
        const diagnostics = hit
          ? this.bottleneck.mergeIntoDiagnostics(n.diagnostics, hit)
          : (n.diagnostics as Prisma.InputJsonValue);
        await this.prisma.relationalSupplyFlowNode.update({
          where: { id: n.id },
          data: {
            bottleneckScore: hit?.bottleneckScore ?? this.policy.clampInt(12),
            diagnostics,
          },
        });
      }

      const depInput = {
        relationshipId,
        openIncidentCount: corridor.openIncidentCount,
        coordinationOpenCount: corridor.coordinationOpenCount,
        blockingFulfillmentTaskCount: corridor.blockingFulfillmentTaskCount,
        pressureScore: corridor.pressureScore,
        fragilityScore: corridor.fragilityScore,
        geoFragilityScore: corridor.geoFragilityScore,
        sectorMaxOperationalRisk: corridor.sectorMaxOperationalRisk,
        predictiveUnresolvedAvgScore: corridor.predictiveUnresolvedAvgScore,
        predictiveUnresolvedCount: corridor.predictiveUnresolvedCount,
        strategicMemoryActiveCount: corridor.strategicMemoryActiveCount,
        strategicMemoryAvgConfidence: corridor.strategicMemoryAvgConfidence,
        operationalMetricStress: corridor.operationalMetricStress,
        peerCorridorEdgeCount: corridor.peerCorridorEdgeCount,
      };
      const computed = RelationalSupplyFlowDependencyService.computeDependencyEdge(depInput);
      const mergedDiagnostics = {
        ...(computed.diagnostics as Record<string, unknown>),
        predictiveSignalsUsed: corridor.predictiveUnresolvedCount,
        strategicMemoriesUsed: corridor.strategicMemoryActiveCount,
        operationalMetricsUsed: corridor.operationalMetricsUsed,
        dependencyProbabilityScore: Math.round(computed.dependencyProbability * 100),
      } as Prisma.InputJsonValue;
      await this.dependency.persistCorridorDependencyEdge(relationshipId, primaryId, secondaryId, {
        ...computed,
        diagnostics: mergedDiagnostics,
      });

      const createdBefore = await this.prisma.relationalSupplyFlowEvent.count({
        where: { relationshipId, eventType: RelationalSupplyFlowEventType.FLOW_NODE_CREATED },
      });
      if (createdBefore === 0) {
        await this.prisma.relationalSupplyFlowEvent.create({
          data: {
            relationshipId,
            flowNodeId: primaryId,
            eventType: RelationalSupplyFlowEventType.FLOW_NODE_CREATED,
            actorOrganizationId: corridor.buyerOrganizationId,
            diagnostics: { ingestion: "relational_supply_flow.syncSupplyFlowState" } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: corridor.buyerOrganizationId,
            sellerOrganizationId: corridor.sellerOrganizationId,
            relationshipId,
            flowNodeId: primaryId,
            flowCode: `FLOW:${relationshipId}:PRIMARY_DIRECT`,
            intensity: this.policy.clampInt(corridor.pressureScore),
            propagationDepth: 0,
            eventType: "relational.supply.flow_created",
          })
          .catch((e) => this.log.warn(String(e)));
      }

      await this.prisma.relationalSupplyFlowSignal.deleteMany({ where: { relationshipId } });

      const postNodes = await this.prisma.relationalSupplyFlowNode.findMany({
        where: { relationshipId, active: true },
        take: 24,
      });
      const maxBn = postNodes.reduce((m, x) => Math.max(m, x.bottleneckScore), 0);
      if (maxBn >= 48) {
        const target = postNodes.find((x) => x.bottleneckScore === maxBn) ?? postNodes[0]!;
        const sig = await this.prisma.relationalSupplyFlowSignal.create({
          data: {
            relationshipId,
            flowNodeId: target.id,
            signalType: RelationalSupplyFlowSignalType.BOTTLENECK_CLUSTER,
            riskLevel: target.riskLevel,
            title: "Goulet d’écoulement corridor observé",
            description:
              "Lecture infrastructurelle de continuité — corrélation interne corridor, pas suivi logistique ni tracking.",
            signalScore: maxBn,
            pressureContribution: this.policy.clampInt(corridor.pressureScore),
            propagationRisk: this.policy.clampInt(corridor.fragilityScore),
            diagnostics: { flowCode: target.flowCode } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        await this.prisma.relationalSupplyFlowEvent.create({
          data: {
            relationshipId,
            flowNodeId: target.id,
            eventType: RelationalSupplyFlowEventType.FLOW_BOTTLENECK_DETECTED,
            actorOrganizationId: corridor.buyerOrganizationId,
            diagnostics: { signalId: sig.id } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: corridor.buyerOrganizationId,
            sellerOrganizationId: corridor.sellerOrganizationId,
            relationshipId,
            flowNodeId: target.id,
            flowCode: target.flowCode,
            intensity: this.policy.clampInt(maxBn),
            propagationDepth: 1,
            eventType: "relational.supply.bottleneck_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }

      const { maxDepthObserved } = await this.propagation.buildFlowPropagationMap(relationshipId);
      if (maxDepthObserved >= 1) {
        await this.prisma.relationalSupplyFlowEvent.create({
          data: {
            relationshipId,
            flowNodeId: primaryId,
            eventType: RelationalSupplyFlowEventType.FLOW_PROPAGATION_DETECTED,
            actorOrganizationId: corridor.buyerOrganizationId,
            diagnostics: { maxDepthObserved } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: corridor.buyerOrganizationId,
            sellerOrganizationId: corridor.sellerOrganizationId,
            relationshipId,
            flowNodeId: primaryId,
            flowCode: `FLOW:${relationshipId}:PRIMARY_DIRECT`,
            intensity: this.policy.clampInt(50 + maxDepthObserved * 8),
            propagationDepth: maxDepthObserved,
            eventType: "relational.supply.propagation_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`supply flow ingestion failed: ${String(err)}`);
    } finally {
      await this.macroIngestion.syncMacroEconomicState(relationshipId).catch((e) =>
        this.log.warn(`macro economic intelligence chain: ${String(e)}`),
      );
    }
  }
}
