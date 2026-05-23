import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { RelationalEconomicRecoveryEventType } from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicRecoveryCorridorContextService } from "./relational-economic-recovery-corridor-context.service";
import { RelationalEconomicRecoveryPlanningService } from "./relational-economic-recovery-planning.service";
import { RelationalEconomicRecoveryPolicyService } from "./relational-economic-recovery-policy.service";
import { RelationalEconomicRecoveryRealtimeService } from "./relational-economic-recovery-realtime.service";
import { RelationalEconomicRecoveryStepService } from "./relational-economic-recovery-step.service";
import { RelationalEconomicGovernanceIngestionService } from "../relational-economic-governance/relational-economic-governance-ingestion.service";

@Injectable()
export class RelationalEconomicRecoveryIngestionService {
  private readonly log = new Logger(RelationalEconomicRecoveryIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicRecoveryPolicyService,
    private readonly corridorContext: RelationalEconomicRecoveryCorridorContextService,
    private readonly planning: RelationalEconomicRecoveryPlanningService,
    private readonly steps: RelationalEconomicRecoveryStepService,
    private readonly realtime: RelationalEconomicRecoveryRealtimeService,
    @Inject(forwardRef(() => RelationalEconomicGovernanceIngestionService))
    private readonly governanceIngestion: RelationalEconomicGovernanceIngestionService,
  ) {}

  private async recoveryEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_economic_recovery_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_economic_recovery_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.29 — chained after economic sovereignty (20.27). */
  async syncEconomicRecoveryState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({ phase: "economic_recovery_ingestion_loop_guard", relationshipId, mutationSkipped: true }),
      );
      return;
    }
    this.ingestActive.add(relationshipId);
    try {
      if (!(await this.recoveryEnabled(relationshipId))) return;

      const rel = await this.prisma.relationship.findUnique({
        where: { id: relationshipId },
        select: { corridorState: true },
      });
      if (!rel) return;

      await this.governance.assertCorridorOperational(relationshipId, "operational_observation");

      const mutationGate = this.policy.assertEconomicRecoveryMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "economic_recovery_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
          }),
        );
        return;
      }

      const generated = await this.planning.generateRecoveryPlan(ctx);
      const planCode = `RECOVERY_PLAN:${relationshipId}:${Date.now()}`;

      await this.prisma.relationalEconomicRecoveryPlan.updateMany({
        where: { relationshipId, active: true },
        data: { active: false },
      });

      const plan = await this.prisma.relationalEconomicRecoveryPlan.create({
        data: {
          relationshipId,
          sovereigntyNodeId: ctx.primarySovereigntyNodeId,
          continuityNodeId: ctx.primaryContinuityNodeId,
          macroEconomicNodeId: ctx.primaryMacroNodeId,
          supplyFlowNodeId: ctx.primarySupplyFlowNodeId,
          geoZoneId: ctx.geoZoneId,
          sectorNodeId: null,
          planCode,
          recoveryType: generated.recoveryType,
          recoveryPriority: generated.recoveryPriority,
          recoveryStatus: generated.recoveryStatus,
          severity: generated.severity,
          recoveryScore: generated.recoveryScore,
          instabilityScore: generated.instabilityScore,
          dependencyExposure: generated.dependencyExposure,
          continuityPressure: generated.continuityPressure,
          sovereigntyPressure: generated.sovereigntyPressure,
          corridorRecoveryProbability: generated.corridorRecoveryProbability,
          estimatedRecoveryDuration: generated.estimatedRecoveryDuration,
          recoveryComplexity: generated.recoveryComplexity,
          interventionPriority: generated.interventionPriority,
          systemicImpactRisk: generated.systemicImpactRisk,
          territoryCountry: ctx.territoryCountry,
          territoryCity: ctx.territoryCity,
          sectorSlug: ctx.sectorSlug,
          diagnostics: generated.diagnostics as Prisma.InputJsonValue,
          metadata: { ingestion: "syncEconomicRecoveryState", planningOnly: true } as Prisma.InputJsonValue,
        },
      });

      await this.steps.replacePlanSteps(plan.id, generated.steps);

      await this.prisma.relationalEconomicRecoverySnapshot.create({
        data: {
          relationshipId,
          recoveryPlanId: plan.id,
          snapshotCode: `RECOVERY_SNAP:${relationshipId}:${Date.now()}`,
          recoveryStatus: generated.recoveryStatus,
          recoveryScore: generated.recoveryScore,
          instabilityScore: generated.instabilityScore,
          corridorRecoveryProbability: generated.corridorRecoveryProbability,
          diagnostics: generated.diagnostics as Prisma.InputJsonValue,
          metadata: { ingestion: "syncEconomicRecoveryState" } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalEconomicRecoverySignal.deleteMany({ where: { relationshipId } });
      if (generated.instabilityScore >= 52) {
        await this.prisma.relationalEconomicRecoverySignal.create({
          data: {
            relationshipId,
            recoveryPlanId: plan.id,
            signalType: "INSTABILITY_PRESSURE",
            severity: generated.severity,
            title: "Instabilité corridor — plan de reprise analytique",
            description:
              "Planification recovery relationnelle — pas exécution automatique, pas mutation commande/paiement.",
            signalScore: generated.instabilityScore,
            recoveryContribution: generated.recoveryScore,
            instabilityPressure: generated.instabilityScore,
            diagnostics: { planCode } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
      }

      const createdBefore = await this.prisma.relationalEconomicRecoveryEvent.count({
        where: { relationshipId, eventType: RelationalEconomicRecoveryEventType.PLAN_GENERATED },
      });

      if (createdBefore === 0) {
        await this.prisma.relationalEconomicRecoveryEvent.create({
          data: {
            relationshipId,
            recoveryPlanId: plan.id,
            eventType: RelationalEconomicRecoveryEventType.PLAN_GENERATED,
            actorOrganizationId: ctx.buyerOrganizationId,
            diagnostics: { planCode, ingestion: "relational_economic_recovery.syncEconomicRecoveryState" } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
      } else {
        await this.prisma.relationalEconomicRecoveryEvent.create({
          data: {
            relationshipId,
            recoveryPlanId: plan.id,
            eventType: RelationalEconomicRecoveryEventType.RECOVERY_UPDATED,
            actorOrganizationId: ctx.buyerOrganizationId,
            diagnostics: { planCode } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
      }

      const publishBase = {
        buyerOrganizationId: ctx.buyerOrganizationId,
        sellerOrganizationId: ctx.sellerOrganizationId,
        relationshipId,
        recoveryPlanId: plan.id,
        planCode,
        intensity: generated.recoveryScore,
        recoveryDepth: generated.steps.length,
      };

      await this.realtime
        .publishToOrganizations({ ...publishBase, eventType: "relational.recovery.plan_generated" })
        .catch((e) => this.log.warn(String(e)));

      if (generated.interventionPriority >= 62) {
        await this.realtime
          .publishToOrganizations({ ...publishBase, eventType: "relational.recovery.priority_detected", intensity: generated.interventionPriority })
          .catch((e) => this.log.warn(String(e)));
      }
      if (generated.instabilityScore >= 58) {
        await this.realtime
          .publishToOrganizations({ ...publishBase, eventType: "relational.recovery.instability_detected", intensity: generated.instabilityScore })
          .catch((e) => this.log.warn(String(e)));
      }
      if (generated.systemicImpactRisk >= 68) {
        await this.realtime
          .publishToOrganizations({ ...publishBase, eventType: "relational.recovery.systemic_risk_detected", intensity: generated.systemicImpactRisk })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`economic recovery ingestion failed: ${String(err)}`);
    } finally {
      this.ingestActive.delete(relationshipId);
      try {
        await this.governanceIngestion.syncEconomicGovernanceState(relationshipId);
      } catch (chainErr) {
        this.log.warn(
          JSON.stringify({
            phase: "economic_governance_chain_from_recovery",
            relationshipId,
            error: String(chainErr),
          }),
        );
      }
    }
  }

  async archiveRecoveryPlan(planId: string, actorOrganizationId: string): Promise<void> {
    const plan = await this.prisma.relationalEconomicRecoveryPlan.findUnique({
      where: { id: planId },
      include: { relationship: { select: { corridorState: true, id: true } } },
    });
    if (!plan) return;
    const gate = this.policy.assertEconomicRecoveryMutationAllowed(plan.relationship.corridorState);
    if (!gate.allowed) return;
    await this.prisma.relationalEconomicRecoveryPlan.update({
      where: { id: planId },
      data: { active: false, archivedAt: new Date(), recoveryStatus: "ARCHIVED" },
    });
    await this.prisma.relationalEconomicRecoveryEvent.create({
      data: {
        relationshipId: plan.relationshipId,
        recoveryPlanId: planId,
        eventType: RelationalEconomicRecoveryEventType.PLAN_ARCHIVED,
        actorOrganizationId,
        diagnostics: { planId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }
}
