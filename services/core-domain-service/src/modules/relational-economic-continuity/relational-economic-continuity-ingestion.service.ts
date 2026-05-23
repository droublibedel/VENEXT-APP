import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalEconomicContinuityEventType,
  RelationalEconomicContinuitySignalType,
  RelationalEconomicInstabilityType,
  RelationalEconomicStabilitySeverity,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicContinuityCorridorContextService } from "./relational-economic-continuity-corridor-context.service";
import { RelationalEconomicContinuityDependencyService } from "./relational-economic-continuity-dependency.service";
import { RelationalEconomicContinuityNodeService } from "./relational-economic-continuity-node.service";
import { RelationalEconomicContinuityPolicyService } from "./relational-economic-continuity-policy.service";
import { RelationalEconomicContinuityRealtimeService } from "./relational-economic-continuity-realtime.service";
import { RelationalEconomicContinuityRecoveryService } from "./relational-economic-continuity-recovery.service";
import { RelationalEconomicContinuityStabilityService } from "./relational-economic-continuity-stability.service";
import { RelationalEconomicSovereigntyIngestionService } from "../relational-economic-sovereignty/relational-economic-sovereignty-ingestion.service";

@Injectable()
export class RelationalEconomicContinuityIngestionService {
  private readonly log = new Logger(RelationalEconomicContinuityIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicContinuityPolicyService,
    private readonly corridorContext: RelationalEconomicContinuityCorridorContextService,
    private readonly stability: RelationalEconomicContinuityStabilityService,
    private readonly nodes: RelationalEconomicContinuityNodeService,
    private readonly dependency: RelationalEconomicContinuityDependencyService,
    private readonly recovery: RelationalEconomicContinuityRecoveryService,
    private readonly realtime: RelationalEconomicContinuityRealtimeService,
    @Inject(forwardRef(() => RelationalEconomicSovereigntyIngestionService))
    private readonly sovereigntyIngestion: RelationalEconomicSovereigntyIngestionService,
  ) {}

  private async continuityEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_economic_continuity_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_economic_continuity_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.26 — chained after macro-economic intelligence (20.25). */
  async syncEconomicContinuityState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({
          phase: "economic_continuity_ingestion_loop_guard",
          relationshipId,
          mutationSkipped: true,
        }),
      );
      return;
    }
    this.ingestActive.add(relationshipId);
    try {
      if (!(await this.continuityEnabled(relationshipId))) return;

      const rel = await this.prisma.relationship.findUnique({
        where: { id: relationshipId },
        select: { corridorState: true },
      });
      if (!rel) return;

      await this.governance.assertCorridorOperational(relationshipId, "operational_observation");

      const mutationGate = this.policy.assertEconomicContinuityMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "economic_continuity_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
            governanceOperation: "economic_continuity_ingestion",
          }),
        );
        return;
      }

      const scores = this.stability.computeStability(ctx);
      const { primaryId, secondaryId } = await this.nodes.upsertCorridorContinuityPair(ctx, scores);

      const computed = RelationalEconomicContinuityDependencyService.computeCorridorDependency({
        relationshipId,
        stability: scores,
        ctx,
      });
      await this.dependency.persistAdaptiveDependency(primaryId, secondaryId, computed, relationshipId);

      const snapshotCode = `CONTINUITY_SNAP:${relationshipId}:${Date.now()}`;
      await this.prisma.relationalEconomicContinuitySnapshot.create({
        data: {
          relationshipId,
          continuityNodeId: primaryId,
          snapshotCode,
          continuityStatus: scores.continuityStatus,
          continuityScore: scores.continuityScore,
          instabilityScore: scores.instabilityRisk,
          recoveryProbability: scores.recoveryProbability,
          systemicContinuityRisk: scores.systemicContinuityRisk,
          diagnostics: scores.diagnostics as Prisma.InputJsonValue,
          metadata: { ingestion: "syncEconomicContinuityState" } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalEconomicContinuitySignal.deleteMany({ where: { relationshipId } });

      if (scores.continuityPressure >= 52) {
        await this.prisma.relationalEconomicContinuitySignal.create({
          data: {
            relationshipId,
            continuityNodeId: primaryId,
            signalType: RelationalEconomicContinuitySignalType.CONTINUITY_PRESSURE,
            severity:
              scores.continuityPressure >= 78
                ? RelationalEconomicStabilitySeverity.CRITICAL
                : scores.continuityPressure >= 62
                  ? RelationalEconomicStabilitySeverity.HIGH
                  : RelationalEconomicStabilitySeverity.MEDIUM,
            instabilityType: RelationalEconomicInstabilityType.CORRIDOR_INSTABILITY,
            title: "Pression de continuité économique corridor",
            description:
              "Lecture industrielle de stabilité relationnelle — pas ERP, pas tracking, pas exécution paiement.",
            signalScore: scores.continuityPressure,
            continuityContribution: scores.continuityPressure,
            recoveryPressure: this.policy.clampInt(100 - scores.recoveryProbability * 100),
            diagnostics: { snapshotCode } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
      }

      const createdBefore = await this.prisma.relationalEconomicContinuityEvent.count({
        where: { relationshipId, eventType: RelationalEconomicContinuityEventType.NODE_MATERIALIZED },
      });
      if (createdBefore === 0) {
        await this.prisma.relationalEconomicContinuityEvent.create({
          data: {
            relationshipId,
            continuityNodeId: primaryId,
            eventType: RelationalEconomicContinuityEventType.NODE_MATERIALIZED,
            actorOrganizationId: ctx.buyerOrganizationId,
            diagnostics: { ingestion: "relational_economic_continuity.syncEconomicContinuityState" } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: ctx.buyerOrganizationId,
            sellerOrganizationId: ctx.sellerOrganizationId,
            relationshipId,
            continuityNodeId: primaryId,
            continuityNodeCode: `CONTINUITY:${relationshipId}:PRIMARY_STABILITY`,
            intensity: scores.continuityScore,
            recoveryDepth: 0,
            eventType: "relational.continuity.stability_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }

      if (scores.instabilityRisk >= 58) {
        await this.prisma.relationalEconomicContinuityEvent.create({
          data: {
            relationshipId,
            continuityNodeId: primaryId,
            eventType: RelationalEconomicContinuityEventType.INSTABILITY_DETECTED,
            actorOrganizationId: ctx.buyerOrganizationId,
            diagnostics: { instabilityRisk: scores.instabilityRisk } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: ctx.buyerOrganizationId,
            sellerOrganizationId: ctx.sellerOrganizationId,
            relationshipId,
            continuityNodeId: primaryId,
            continuityNodeCode: `CONTINUITY:${relationshipId}:PRIMARY_STABILITY`,
            intensity: scores.instabilityRisk,
            recoveryDepth: 0,
            eventType: "relational.continuity.instability_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }

      const { recoveryDiagnostics } = await this.recovery.buildRecoveryMap(relationshipId);
      const recoveryProj = this.recovery.computeRecoveryProjection(scores, recoveryDiagnostics);

      if (recoveryProj.corridorRecoveryProbability >= 0.45 && scores.instabilityRisk >= 40) {
        await this.prisma.relationalEconomicContinuityEvent.create({
          data: {
            relationshipId,
            continuityNodeId: primaryId,
            eventType: RelationalEconomicContinuityEventType.RECOVERY_DETECTED,
            actorOrganizationId: ctx.buyerOrganizationId,
            diagnostics: { ...recoveryProj, recoveryDiagnostics } as unknown as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: ctx.buyerOrganizationId,
            sellerOrganizationId: ctx.sellerOrganizationId,
            relationshipId,
            continuityNodeId: primaryId,
            continuityNodeCode: `CONTINUITY:${relationshipId}:PRIMARY_STABILITY`,
            intensity: this.policy.clampInt(recoveryProj.corridorRecoveryProbability * 100),
            recoveryDepth: recoveryDiagnostics.traversalDepth,
            eventType: "relational.continuity.recovery_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }

      if (scores.systemicContinuityRisk >= 72 || recoveryDiagnostics.continuityExposure >= 65) {
        await this.prisma.relationalEconomicContinuityEvent.create({
          data: {
            relationshipId,
            continuityNodeId: primaryId,
            eventType: RelationalEconomicContinuityEventType.COLLAPSE_RISK_DETECTED,
            actorOrganizationId: ctx.buyerOrganizationId,
            diagnostics: {
              systemicContinuityRisk: scores.systemicContinuityRisk,
              continuityExposure: recoveryDiagnostics.continuityExposure,
            } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: ctx.buyerOrganizationId,
            sellerOrganizationId: ctx.sellerOrganizationId,
            relationshipId,
            continuityNodeId: primaryId,
            continuityNodeCode: `CONTINUITY:${relationshipId}:PRIMARY_STABILITY`,
            intensity: scores.systemicContinuityRisk,
            recoveryDepth: recoveryDiagnostics.traversalDepth,
            eventType: "relational.continuity.collapse_risk_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }

      if (scores.continuityPressure >= 55) {
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: ctx.buyerOrganizationId,
            sellerOrganizationId: ctx.sellerOrganizationId,
            relationshipId,
            continuityNodeId: primaryId,
            continuityNodeCode: `CONTINUITY:${relationshipId}:PRIMARY_STABILITY`,
            intensity: scores.continuityPressure,
            recoveryDepth: recoveryDiagnostics.traversalDepth,
            eventType: "relational.continuity.systemic_pressure_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`economic continuity ingestion failed: ${String(err)}`);
    } finally {
      await this.sovereigntyIngestion.syncEconomicSovereigntyState(relationshipId).catch((e) =>
        this.log.warn(`economic sovereignty intelligence chain: ${String(e)}`),
      );
      this.ingestActive.delete(relationshipId);
    }
  }
}
