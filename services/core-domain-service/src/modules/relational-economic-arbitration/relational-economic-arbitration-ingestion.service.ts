import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { RelationalEconomicArbitrationEventType } from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicArbitrationConflictService } from "./relational-economic-arbitration-conflict.service";
import { RelationalEconomicArbitrationCorridorContextService } from "./relational-economic-arbitration-corridor-context.service";
import { RelationalEconomicArbitrationDecisionService } from "./relational-economic-arbitration-decision.service";
import { RelationalEconomicArbitrationPolicyService } from "./relational-economic-arbitration-policy.service";
import { RelationalEconomicArbitrationRealtimeService } from "./relational-economic-arbitration-realtime.service";
import { RelationalEconomicArbitrationScenarioService } from "./relational-economic-arbitration-scenario.service";
import { RelationalEconomicStabilizationIngestionService } from "../relational-economic-stabilization/relational-economic-stabilization-ingestion.service";

@Injectable()
export class RelationalEconomicArbitrationIngestionService {
  private readonly log = new Logger(RelationalEconomicArbitrationIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicArbitrationPolicyService,
    private readonly corridorContext: RelationalEconomicArbitrationCorridorContextService,
    private readonly conflictSvc: RelationalEconomicArbitrationConflictService,
    private readonly scenarioSvc: RelationalEconomicArbitrationScenarioService,
    private readonly decisionSvc: RelationalEconomicArbitrationDecisionService,
    private readonly realtime: RelationalEconomicArbitrationRealtimeService,
    @Inject(forwardRef(() => RelationalEconomicStabilizationIngestionService))
    private readonly stabilizationIngestion: RelationalEconomicStabilizationIngestionService,
  ) {}

  private async arbitrationEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_economic_arbitration_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_economic_arbitration_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.31 — chained after economic governance (20.30). */
  async syncEconomicArbitrationState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({ phase: "economic_arbitration_ingestion_loop_guard", relationshipId, mutationSkipped: true }),
      );
      return;
    }
    this.ingestActive.add(relationshipId);
    try {
      if (!(await this.arbitrationEnabled(relationshipId))) return;

      const rel = await this.prisma.relationship.findUnique({
        where: { id: relationshipId },
        select: { corridorState: true },
      });
      if (!rel) return;

      await this.governance.assertCorridorOperational(relationshipId, "operational_observation");

      const mutationGate = this.policy.assertEconomicArbitrationMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "economic_arbitration_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
          }),
        );
        return;
      }

      const candidates = this.conflictSvc.detectArbitrationCandidates(ctx).slice(0, 3);

      await this.prisma.relationalEconomicArbitrationCase.updateMany({
        where: { relationshipId, active: true },
        data: { active: false },
      });

      let primaryCaseId: string | null = null;
      let primaryCaseCode: string | null = null;
      let maxUrgency = 0;

      for (const candidate of candidates) {
        const caseCode = `ARB_CASE:${relationshipId}:${candidate.governanceConflictId ?? "SYN"}:${Date.now()}`;
        const arbitrationCase = await this.prisma.relationalEconomicArbitrationCase.create({
          data: {
            relationshipId,
            governanceConflictId: candidate.governanceConflictId,
            recoveryPlanId: ctx.activeRecoveryPlanId,
            sovereigntyNodeId: ctx.primarySovereigntyNodeId,
            continuityNodeId: ctx.primaryContinuityNodeId,
            macroEconomicNodeId: ctx.primaryMacroNodeId,
            supplyFlowNodeId: ctx.primarySupplyFlowNodeId,
            geoZoneId: ctx.geoZoneId,
            caseCode,
            arbitrationType: candidate.arbitrationType,
            arbitrationPriority: candidate.arbitrationPriority,
            arbitrationStatus: candidate.arbitrationStatus,
            severity: candidate.severity,
            arbitrationScore: candidate.arbitrationScore,
            conflictSeverity: candidate.conflictSeverity,
            systemicImpact: candidate.systemicImpact,
            dependencyPressure: candidate.dependencyPressure,
            continuityPressure: candidate.continuityPressure,
            sovereigntyPressure: candidate.sovereigntyPressure,
            propagationPressure: candidate.propagationPressure,
            coordinationPressure: candidate.coordinationPressure,
            resolutionComplexity: candidate.resolutionComplexity,
            resolutionProbability: candidate.resolutionProbability,
            interventionUrgency: candidate.interventionUrgency,
            territoryCountry: ctx.territoryCountry,
            territoryCity: ctx.territoryCity,
            sectorSlug: ctx.sectorSlug,
            diagnostics: { planningOnly: true, nonAutopilot: true } as Prisma.InputJsonValue,
            metadata: { ingestion: "syncEconomicArbitrationState" } as Prisma.InputJsonValue,
          },
        });

        const scenarios = this.scenarioSvc.generateScenarios(
          relationshipId,
          caseCode,
          candidate,
          ctx,
        );
        for (const s of scenarios) {
          await this.prisma.relationalEconomicArbitrationScenario.create({
            data: {
              arbitrationCaseId: arbitrationCase.id,
              relationshipId,
              scenarioCode: s.scenarioCode,
              scenarioType: s.scenarioType,
              priority: s.priority,
              estimatedImpact: s.estimatedImpact,
              estimatedRisk: s.estimatedRisk,
              estimatedRecoveryGain: s.estimatedRecoveryGain,
              dependencyImpact: s.dependencyImpact,
              propagationImpact: s.propagationImpact,
              continuityImpact: s.continuityImpact,
              sovereigntyImpact: s.sovereigntyImpact,
              confidenceLevel: s.confidenceLevel,
              diagnostics: {} as Prisma.InputJsonValue,
              metadata: {} as Prisma.InputJsonValue,
            },
          });
        }

        const recommended = this.decisionSvc.compareScenarios(scenarios);
        if (recommended) {
          await this.decisionSvc.createDecision({
            arbitrationCaseId: arbitrationCase.id,
            relationshipId,
            actorOrganizationId: ctx.buyerOrganizationId,
            selectedScenario: recommended,
            allScenarios: scenarios,
            arbitrationReason:
              "Recommandation analytique corridor — validation humaine requise, pas exécution automatique.",
          });
        }

        if (candidate.interventionUrgency >= maxUrgency) {
          maxUrgency = candidate.interventionUrgency;
          primaryCaseId = arbitrationCase.id;
          primaryCaseCode = caseCode;
        }

        await this.prisma.relationalEconomicArbitrationSnapshot.create({
          data: {
            relationshipId,
            arbitrationCaseId: arbitrationCase.id,
            snapshotCode: `ARB_SNAP:${caseCode}`,
            arbitrationStatus: candidate.arbitrationStatus,
            arbitrationScore: candidate.arbitrationScore,
            systemicImpact: candidate.systemicImpact,
            diagnostics: { caseCode } as Prisma.InputJsonValue,
            metadata: { ingestion: "syncEconomicArbitrationState" } as Prisma.InputJsonValue,
          },
        });
      }

      if (!primaryCaseId) return;

      await this.prisma.relationalEconomicArbitrationEvent.create({
        data: {
          relationshipId,
          arbitrationCaseId: primaryCaseId,
          eventType: RelationalEconomicArbitrationEventType.CONFLICT_DETECTED,
          actorOrganizationId: ctx.buyerOrganizationId,
          diagnostics: { ingestion: "relational_economic_arbitration.syncEconomicArbitrationState" } as Prisma.InputJsonValue,
          metadata: {} as Prisma.InputJsonValue,
        },
      });

      const publishBase = {
        buyerOrganizationId: ctx.buyerOrganizationId,
        sellerOrganizationId: ctx.sellerOrganizationId,
        relationshipId,
        arbitrationCaseId: primaryCaseId,
        caseCode: primaryCaseCode,
        intensity: maxUrgency,
        arbitrationDepth: candidates.length,
      };

      await this.realtime
        .publishToOrganizations({ ...publishBase, eventType: "relational.arbitration.conflict_detected" })
        .catch((e) => this.log.warn(String(e)));
      await this.realtime
        .publishToOrganizations({ ...publishBase, eventType: "relational.arbitration.scenario_generated" })
        .catch((e) => this.log.warn(String(e)));
      await this.realtime
        .publishToOrganizations({ ...publishBase, eventType: "relational.arbitration.decision_created" })
        .catch((e) => this.log.warn(String(e)));
      if (maxUrgency >= 62) {
        await this.realtime
          .publishToOrganizations({ ...publishBase, eventType: "relational.arbitration.priority_detected", intensity: maxUrgency })
          .catch((e) => this.log.warn(String(e)));
      }
      const topSystemic = Math.max(...candidates.map((c) => c.systemicImpact));
      if (topSystemic >= 68) {
        await this.realtime
          .publishToOrganizations({ ...publishBase, eventType: "relational.arbitration.systemic_risk_detected", intensity: topSystemic })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`economic arbitration ingestion failed: ${String(err)}`);
    } finally {
      this.ingestActive.delete(relationshipId);
      try {
        await this.stabilizationIngestion.syncEconomicStabilizationState(relationshipId);
      } catch (chainErr) {
        this.log.warn(
          JSON.stringify({
            phase: "economic_stabilization_chain_from_arbitration",
            relationshipId,
            error: String(chainErr),
          }),
        );
      }
    }
  }

  async archiveArbitrationSnapshot(snapshotId: string, actorOrganizationId: string): Promise<void> {
    const snap = await this.prisma.relationalEconomicArbitrationSnapshot.findUnique({
      where: { id: snapshotId },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) return;
    const gate = this.policy.assertEconomicArbitrationMutationAllowed(snap.relationship.corridorState);
    if (!gate.allowed) return;
    await this.prisma.relationalEconomicArbitrationSnapshot.update({
      where: { id: snapshotId },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalEconomicArbitrationEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        arbitrationCaseId: snap.arbitrationCaseId,
        eventType: RelationalEconomicArbitrationEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId,
        diagnostics: { snapshotId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }
}
