import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalEconomicSovereigntyEventType,
  RelationalEconomicSovereigntySeverity,
  RelationalEconomicSovereigntySignalType,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicSovereigntyAutonomyService } from "./relational-economic-sovereignty-autonomy.service";
import { RelationalEconomicSovereigntyCorridorContextService } from "./relational-economic-sovereignty-corridor-context.service";
import { RelationalEconomicSovereigntyDependencyService } from "./relational-economic-sovereignty-dependency.service";
import { RelationalEconomicSovereigntyNodeService } from "./relational-economic-sovereignty-node.service";
import { RelationalEconomicSovereigntyPolicyService } from "./relational-economic-sovereignty-policy.service";
import { RelationalEconomicSovereigntyRealtimeService } from "./relational-economic-sovereignty-realtime.service";
import { RelationalEconomicSovereigntyEdgeEnrichmentService } from "./relational-economic-sovereignty-edge-enrichment.service";
import { RelationalEconomicRecoveryIngestionService } from "../relational-economic-recovery/relational-economic-recovery-ingestion.service";
import { RelationalEconomicSovereigntyRecoveryService } from "./relational-economic-sovereignty-recovery.service";
import { RelationalEconomicSovereigntyRetentionService } from "./relational-economic-sovereignty-retention.service";

@Injectable()
export class RelationalEconomicSovereigntyIngestionService {
  private readonly log = new Logger(RelationalEconomicSovereigntyIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicSovereigntyPolicyService,
    private readonly corridorContext: RelationalEconomicSovereigntyCorridorContextService,
    private readonly autonomy: RelationalEconomicSovereigntyAutonomyService,
    private readonly nodes: RelationalEconomicSovereigntyNodeService,
    private readonly dependency: RelationalEconomicSovereigntyDependencyService,
    private readonly recovery: RelationalEconomicSovereigntyRecoveryService,
    private readonly realtime: RelationalEconomicSovereigntyRealtimeService,
    private readonly retention: RelationalEconomicSovereigntyRetentionService,
    private readonly edgeEnrichment: RelationalEconomicSovereigntyEdgeEnrichmentService,
    @Inject(forwardRef(() => RelationalEconomicRecoveryIngestionService))
    private readonly recoveryIngestion: RelationalEconomicRecoveryIngestionService,
  ) {}

  private async sovereigntyEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_economic_sovereignty_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_economic_sovereignty_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.27 — chained after economic continuity (20.26). */
  async syncEconomicSovereigntyState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({
          phase: "economic_sovereignty_ingestion_loop_guard",
          relationshipId,
          mutationSkipped: true,
        }),
      );
      return;
    }
    this.ingestActive.add(relationshipId);
    try {
      if (!(await this.sovereigntyEnabled(relationshipId))) return;

      const rel = await this.prisma.relationship.findUnique({
        where: { id: relationshipId },
        select: { corridorState: true },
      });
      if (!rel) return;

      await this.governance.assertCorridorOperational(relationshipId, "operational_observation");

      const mutationGate = this.policy.assertEconomicSovereigntyMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "economic_sovereignty_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
            governanceOperation: "economic_sovereignty_ingestion",
          }),
        );
        return;
      }

      const scores = this.autonomy.computeAutonomy(ctx);
      await this.realtime
        .publishToOrganizations({
          buyerOrganizationId: ctx.buyerOrganizationId!,
          sellerOrganizationId: ctx.sellerOrganizationId!,
          relationshipId,
          sovereigntyNodeId: null,
          sovereigntyNodeCode: null,
          intensity: scores.sovereigntyScore,
          autonomyDepth: 0,
          eventType: "relational.sovereignty.calibration_updated",
        })
        .catch((e) => this.log.warn(String(e)));

      const { primaryId, secondaryId } = await this.nodes.upsertCorridorSovereigntyPair(ctx, scores);

      const computed = this.dependency.computeCorridorDependency({
        relationshipId,
        autonomy: scores,
        ctx,
      });
      await this.dependency.persistAdaptiveDependency(primaryId, secondaryId, computed, relationshipId);

      const edgeDiag = await this.edgeEnrichment.enrichSovereigntyEdgesForRelationship(
        relationshipId,
        ctx.buyerOrganizationId!,
        ctx.sellerOrganizationId!,
      );

      const snapshotCode = `SOVEREIGNTY_SNAP:${relationshipId}:${Date.now()}`;
      const snap = await this.prisma.relationalEconomicSovereigntySnapshot.create({
        data: {
          relationshipId,
          sovereigntyNodeId: primaryId,
          snapshotCode,
          autonomyStatus: scores.autonomyStatus,
          sovereigntyScore: scores.sovereigntyScore,
          autonomyScore: scores.autonomyScore,
          dependencyExposureScore: scores.dependencyExposureScore,
          resilienceAutonomy: scores.resilienceAutonomy,
          diagnostics: {
            ...scores.diagnostics,
            edgeEnrichment: edgeDiag,
          } as Prisma.InputJsonValue,
          metadata: { ingestion: "syncEconomicSovereigntyState" } as Prisma.InputJsonValue,
        },
      });

      const retentionDiag = await this.retention.applySnapshotRetention(relationshipId, snap.id);
      scores.diagnostics.retention = retentionDiag;

      await this.prisma.relationalEconomicSovereigntySignal.deleteMany({ where: { relationshipId } });

      if (scores.dependencyExposureScore >= 52) {
        await this.prisma.relationalEconomicSovereigntySignal.create({
          data: {
            relationshipId,
            sovereigntyNodeId: primaryId,
            signalType: RelationalEconomicSovereigntySignalType.SYSTEMIC_EXPOSURE,
            severity:
              scores.dependencyExposureScore >= 78
                ? RelationalEconomicSovereigntySeverity.CRITICAL
                : scores.dependencyExposureScore >= 62
                  ? RelationalEconomicSovereigntySeverity.HIGH
                  : RelationalEconomicSovereigntySeverity.MEDIUM,
            exposureLevel: scores.dependencyExposureLevel,
            title: "Exposition dépendance souveraineté corridor",
            description:
              "Lecture industrielle d'autonomie relationnelle — pas ERP, pas scoring public, pas exécution paiement.",
            signalScore: scores.dependencyExposureScore,
            sovereigntyContribution: scores.sovereigntyScore,
            captivityPressure: scores.strategicCaptivityRisk,
            diagnostics: { snapshotCode } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
      }

      const createdBefore = await this.prisma.relationalEconomicSovereigntyEvent.count({
        where: { relationshipId, eventType: RelationalEconomicSovereigntyEventType.NODE_MATERIALIZED },
      });
      if (createdBefore === 0) {
        await this.prisma.relationalEconomicSovereigntyEvent.create({
          data: {
            relationshipId,
            sovereigntyNodeId: primaryId,
            eventType: RelationalEconomicSovereigntyEventType.NODE_MATERIALIZED,
            actorOrganizationId: ctx.buyerOrganizationId,
            diagnostics: { ingestion: "relational_economic_sovereignty.syncEconomicSovereigntyState" } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: ctx.buyerOrganizationId,
            sellerOrganizationId: ctx.sellerOrganizationId,
            relationshipId,
            sovereigntyNodeId: primaryId,
            sovereigntyNodeCode: `SOVEREIGNTY:${relationshipId}:PRIMARY_AUTONOMY`,
            intensity: scores.autonomyScore,
            autonomyDepth: 0,
            eventType: "relational.sovereignty.autonomy_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }

      if (scores.dependencyConcentration >= 58) {
        await this.prisma.relationalEconomicSovereigntyEvent.create({
          data: {
            relationshipId,
            sovereigntyNodeId: primaryId,
            eventType: RelationalEconomicSovereigntyEventType.DEPENDENCY_DETECTED,
            actorOrganizationId: ctx.buyerOrganizationId,
            diagnostics: { dependencyConcentration: scores.dependencyConcentration } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: ctx.buyerOrganizationId,
            sellerOrganizationId: ctx.sellerOrganizationId,
            relationshipId,
            sovereigntyNodeId: primaryId,
            sovereigntyNodeCode: `SOVEREIGNTY:${relationshipId}:PRIMARY_AUTONOMY`,
            intensity: scores.dependencyConcentration,
            autonomyDepth: 0,
            eventType: "relational.sovereignty.dependency_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }

      if (scores.strategicCaptivityRisk >= 62) {
        await this.prisma.relationalEconomicSovereigntyEvent.create({
          data: {
            relationshipId,
            sovereigntyNodeId: primaryId,
            eventType: RelationalEconomicSovereigntyEventType.CAPTIVITY_DETECTED,
            actorOrganizationId: ctx.buyerOrganizationId,
            diagnostics: { strategicCaptivityRisk: scores.strategicCaptivityRisk } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: ctx.buyerOrganizationId,
            sellerOrganizationId: ctx.sellerOrganizationId,
            relationshipId,
            sovereigntyNodeId: primaryId,
            sovereigntyNodeCode: `SOVEREIGNTY:${relationshipId}:PRIMARY_AUTONOMY`,
            intensity: scores.strategicCaptivityRisk,
            autonomyDepth: 0,
            eventType: "relational.sovereignty.captivity_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }

      const { recoveryDiagnostics } = await this.recovery.buildRecoveryTraversal(relationshipId);
      const recoveryProj = this.recovery.computeRecoveryAutonomy(scores, recoveryDiagnostics);

      if (recoveryProj.corridorSelfRecoveryProbability >= 0.42) {
        await this.prisma.relationalEconomicSovereigntyEvent.create({
          data: {
            relationshipId,
            sovereigntyNodeId: primaryId,
            eventType: RelationalEconomicSovereigntyEventType.RECOVERY_DETECTED,
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
            sovereigntyNodeId: primaryId,
            sovereigntyNodeCode: `SOVEREIGNTY:${relationshipId}:PRIMARY_AUTONOMY`,
            intensity: this.policy.clampInt(recoveryProj.corridorSelfRecoveryProbability * 100),
            autonomyDepth: recoveryDiagnostics.traversalDepth,
            eventType: "relational.sovereignty.recovery_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }

      if (scores.systemicAutonomyRisk >= 68 || recoveryDiagnostics.autonomyExposure >= 60) {
        await this.realtime
          .publishToOrganizations({
            buyerOrganizationId: ctx.buyerOrganizationId,
            sellerOrganizationId: ctx.sellerOrganizationId,
            relationshipId,
            sovereigntyNodeId: primaryId,
            sovereigntyNodeCode: `SOVEREIGNTY:${relationshipId}:PRIMARY_AUTONOMY`,
            intensity: scores.systemicAutonomyRisk,
            autonomyDepth: recoveryDiagnostics.traversalDepth,
            eventType: "relational.sovereignty.systemic_exposure_detected",
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`economic sovereignty ingestion failed: ${String(err)}`);
    } finally {
      this.ingestActive.delete(relationshipId);
      try {
        await this.recoveryIngestion.syncEconomicRecoveryState(relationshipId);
      } catch (chainErr) {
        this.log.warn(
          JSON.stringify({
            phase: "economic_recovery_chain_from_sovereignty",
            relationshipId,
            error: String(chainErr),
          }),
        );
      }
    }
  }
}
