import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalMacroEconomicEventType,
  RelationalMacroEconomicSeverity,
  RelationalMacroEconomicSignalType,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalMacroEconomicCorridorContextService } from "./relational-macro-economic-corridor-context.service";
import { RelationalMacroEconomicDependencyService } from "./relational-macro-economic-dependency.service";
import { RelationalMacroEconomicNodeService } from "./relational-macro-economic-node.service";
import { RelationalMacroEconomicPolicyService } from "./relational-macro-economic-policy.service";
import { RelationalMacroEconomicPropagationService } from "./relational-macro-economic-propagation.service";
import { RelationalMacroEconomicRealtimeService } from "./relational-macro-economic-realtime.service";
import { RelationalMacroEconomicResilienceService } from "./relational-macro-economic-resilience.service";
import { RelationalEconomicContinuityIngestionService } from "../relational-economic-continuity/relational-economic-continuity-ingestion.service";

@Injectable()
export class RelationalMacroEconomicIngestionService {
  private readonly log = new Logger(RelationalMacroEconomicIngestionService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalMacroEconomicPolicyService,
    private readonly corridorContext: RelationalMacroEconomicCorridorContextService,
    private readonly resilience: RelationalMacroEconomicResilienceService,
    private readonly nodes: RelationalMacroEconomicNodeService,
    private readonly dependency: RelationalMacroEconomicDependencyService,
    private readonly propagation: RelationalMacroEconomicPropagationService,
    private readonly realtime: RelationalMacroEconomicRealtimeService,
    @Inject(forwardRef(() => RelationalEconomicContinuityIngestionService))
    private readonly continuityIngestion: RelationalEconomicContinuityIngestionService,
  ) {}

  private readonly ingestActive = new Set<string>();

  private async macroEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_macro_economic_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_macro_economic_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /**
   * Instruction 20.25 — chained after supply-flow intelligence (20.24A).
   */
  async syncMacroEconomicState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({
          phase: "macro_economic_ingestion_loop_guard",
          relationshipId,
          mutationSkipped: true,
        }),
      );
      return;
    }
    this.ingestActive.add(relationshipId);
    try {
      if (!(await this.macroEnabled(relationshipId))) return;

      const rel = await this.prisma.relationship.findUnique({
        where: { id: relationshipId },
        select: { corridorState: true },
      });
      if (!rel) return;

      await this.governance.assertCorridorOperational(relationshipId, "operational_observation");

      const mutationGate = this.policy.assertMacroEconomicMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "macro_economic_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
            governanceOperation: "macro_economic_ingestion",
          }),
        );
        return;
      }

      const scores = this.resilience.computeResilience(ctx);
      const { primaryId, secondaryId } = await this.nodes.upsertCorridorMacroPair(ctx, scores);

      const computed = RelationalMacroEconomicDependencyService.computeCorridorDependency({
        relationshipId,
        resilience: scores,
        ctx,
      });
      await this.dependency.persistAdaptiveDependency(primaryId, secondaryId, computed, relationshipId);

      const snapshotCode = `MACRO_SNAP:${relationshipId}:${Date.now()}`;
      await this.prisma.relationalMacroEconomicResilienceSnapshot.create({
        data: {
          relationshipId,
          macroNodeId: primaryId,
          snapshotCode,
          resilienceStatus: scores.resilienceStatus,
          resilienceScore: scores.resilienceScore,
          structuralFragility: scores.structuralFragility,
          propagationRisk: scores.propagationRisk,
          fragilityScore: scores.fragilityScore,
          diagnostics: scores.diagnostics as Prisma.InputJsonValue,
          metadata: { ingestion: "syncMacroEconomicState" } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalMacroEconomicPressureSignal.deleteMany({ where: { relationshipId } });

      if (scores.systemicPressure >= 52) {
        await this.prisma.relationalMacroEconomicPressureSignal.create({
          data: {
            relationshipId,
            macroNodeId: primaryId,
            signalType: RelationalMacroEconomicSignalType.SYSTEMIC_PRESSURE,
            severity:
              scores.systemicPressure >= 78
                ? RelationalMacroEconomicSeverity.CRITICAL
                : scores.systemicPressure >= 62
                  ? RelationalMacroEconomicSeverity.HIGH
                  : RelationalMacroEconomicSeverity.MEDIUM,
            riskLevel: scores.riskLevel,
            title: "Pression macro-économique systémique corridor",
            description:
              "Lecture infrastructurelle de résilience relationnelle — pas notation publique, pas tracking, pas exécution paiement.",
            signalScore: scores.systemicPressure,
            pressureContribution: scores.systemicPressure,
            propagationRisk: scores.propagationRisk,
            diagnostics: { snapshotCode } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
      }

      const createdBefore = await this.prisma.relationalMacroEconomicEvent.count({
        where: { relationshipId, eventType: RelationalMacroEconomicEventType.NODE_MATERIALIZED },
      });
      if (createdBefore === 0) {
        await this.prisma.relationalMacroEconomicEvent.create({
          data: {
            relationshipId,
            macroNodeId: primaryId,
            eventType: RelationalMacroEconomicEventType.NODE_MATERIALIZED,
            actorOrganizationId: ctx.buyerOrganizationId,
            diagnostics: { ingestion: "relational_macro_economic.syncMacroEconomicState" } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: ctx.buyerOrganizationId,
            sellerOrganizationId: ctx.sellerOrganizationId,
            relationshipId,
            macroNodeId: primaryId,
            macroNodeCode: `MACRO:${relationshipId}:PRIMARY_RESILIENCE`,
            intensity: scores.resilienceScore,
            propagationDepth: 0,
            eventType: "relational.macro.resilience_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }

      if (scores.fragilityScore >= 58) {
        await this.prisma.relationalMacroEconomicEvent.create({
          data: {
            relationshipId,
            macroNodeId: primaryId,
            eventType: RelationalMacroEconomicEventType.FRAGILITY_DETECTED,
            actorOrganizationId: ctx.buyerOrganizationId,
            diagnostics: { fragilityScore: scores.fragilityScore } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: ctx.buyerOrganizationId,
            sellerOrganizationId: ctx.sellerOrganizationId,
            relationshipId,
            macroNodeId: primaryId,
            macroNodeCode: `MACRO:${relationshipId}:PRIMARY_RESILIENCE`,
            intensity: scores.fragilityScore,
            propagationDepth: 0,
            eventType: "relational.macro.fragility_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }

      const { maxDepthObserved, traversalDiagnostics } = await this.propagation.buildPropagationMap(relationshipId);
      if (maxDepthObserved >= 1) {
        await this.prisma.relationalMacroEconomicEvent.create({
          data: {
            relationshipId,
            macroNodeId: primaryId,
            eventType: RelationalMacroEconomicEventType.PROPAGATION_DETECTED,
            actorOrganizationId: ctx.buyerOrganizationId,
            diagnostics: traversalDiagnostics as unknown as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: ctx.buyerOrganizationId,
            sellerOrganizationId: ctx.sellerOrganizationId,
            relationshipId,
            macroNodeId: primaryId,
            macroNodeCode: `MACRO:${relationshipId}:PRIMARY_RESILIENCE`,
            intensity: this.policy.clampInt(45 + maxDepthObserved * 10),
            propagationDepth: maxDepthObserved,
            eventType: "relational.macro.propagation_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }

      if (scores.macroEconomicRisk >= 72 || traversalDiagnostics.collapseExposure >= 65) {
        await this.prisma.relationalMacroEconomicEvent.create({
          data: {
            relationshipId,
            macroNodeId: primaryId,
            eventType: RelationalMacroEconomicEventType.COLLAPSE_RISK_DETECTED,
            actorOrganizationId: ctx.buyerOrganizationId,
            diagnostics: {
              macroEconomicRisk: scores.macroEconomicRisk,
              collapseExposure: traversalDiagnostics.collapseExposure,
            } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: ctx.buyerOrganizationId,
            sellerOrganizationId: ctx.sellerOrganizationId,
            relationshipId,
            macroNodeId: primaryId,
            macroNodeCode: `MACRO:${relationshipId}:PRIMARY_RESILIENCE`,
            intensity: scores.macroEconomicRisk,
            propagationDepth: maxDepthObserved,
            eventType: "relational.macro.collapse_risk_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }

      if (scores.systemicPressure >= 55) {
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: ctx.buyerOrganizationId,
            sellerOrganizationId: ctx.sellerOrganizationId,
            relationshipId,
            macroNodeId: primaryId,
            macroNodeCode: `MACRO:${relationshipId}:PRIMARY_RESILIENCE`,
            intensity: scores.systemicPressure,
            propagationDepth: maxDepthObserved,
            eventType: "relational.macro.systemic_pressure_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`macro economic ingestion failed: ${String(err)}`);
    } finally {
      await this.continuityIngestion.syncEconomicContinuityState(relationshipId).catch((e) =>
        this.log.warn(`economic continuity intelligence chain: ${String(e)}`),
      );
      this.ingestActive.delete(relationshipId);
    }
  }
}
