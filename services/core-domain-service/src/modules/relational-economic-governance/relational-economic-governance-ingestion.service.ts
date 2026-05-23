import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { RelationalEconomicGovernanceEventType } from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicGovernanceConflictService } from "./relational-economic-governance-conflict.service";
import { RelationalEconomicGovernanceCoordinationService } from "./relational-economic-governance-coordination.service";
import { RelationalEconomicGovernanceCorridorContextService } from "./relational-economic-governance-corridor-context.service";
import { RelationalEconomicGovernancePolicyService } from "./relational-economic-governance-policy.service";
import { RelationalEconomicGovernanceRealtimeService } from "./relational-economic-governance-realtime.service";
import { RelationalEconomicArbitrationIngestionService } from "../relational-economic-arbitration/relational-economic-arbitration-ingestion.service";

@Injectable()
export class RelationalEconomicGovernanceIngestionService {
  private readonly log = new Logger(RelationalEconomicGovernanceIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicGovernancePolicyService,
    private readonly corridorContext: RelationalEconomicGovernanceCorridorContextService,
    private readonly coordination: RelationalEconomicGovernanceCoordinationService,
    private readonly conflicts: RelationalEconomicGovernanceConflictService,
    private readonly realtime: RelationalEconomicGovernanceRealtimeService,
    @Inject(forwardRef(() => RelationalEconomicArbitrationIngestionService))
    private readonly arbitrationIngestion: RelationalEconomicArbitrationIngestionService,
  ) {}

  private async governanceEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_economic_governance_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_economic_governance_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.30 — chained after economic recovery (20.29). */
  async syncEconomicGovernanceState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({ phase: "economic_governance_ingestion_loop_guard", relationshipId, mutationSkipped: true }),
      );
      return;
    }
    this.ingestActive.add(relationshipId);
    try {
      if (!(await this.governanceEnabled(relationshipId))) return;

      const rel = await this.prisma.relationship.findUnique({
        where: { id: relationshipId },
        select: { corridorState: true },
      });
      if (!rel) return;

      await this.governance.assertCorridorOperational(relationshipId, "operational_observation");

      const mutationGate = this.policy.assertEconomicGovernanceMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "economic_governance_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
          }),
        );
        return;
      }

      const state = await this.coordination.computeGovernanceState(ctx);
      const nodeCode = `GOVERNANCE_NODE:${relationshipId}:${Date.now()}`;

      await this.prisma.relationalEconomicGovernanceNode.updateMany({
        where: { relationshipId, active: true },
        data: { active: false },
      });

      const node = await this.prisma.relationalEconomicGovernanceNode.create({
        data: {
          relationshipId,
          recoveryPlanId: ctx.activeRecoveryPlanId,
          sovereigntyNodeId: ctx.primarySovereigntyNodeId,
          continuityNodeId: ctx.primaryContinuityNodeId,
          macroEconomicNodeId: ctx.primaryMacroNodeId,
          supplyFlowNodeId: ctx.primarySupplyFlowNodeId,
          geoZoneId: ctx.geoZoneId,
          sectorNodeId: null,
          economicDependencyNodeId: ctx.dependencyNodeId,
          governanceNodeCode: nodeCode,
          governanceType: state.governanceType,
          governancePriority: state.governancePriority,
          governanceStatus: state.governanceStatus,
          severity: state.severity,
          governanceScore: state.governanceScore,
          coordinationScore: state.coordinationScore,
          systemicRisk: state.systemicRisk,
          corridorCriticality: state.corridorCriticality,
          recoveryPressure: state.recoveryPressure,
          dependencyPressure: state.dependencyPressure,
          propagationPressure: state.propagationPressure,
          sovereigntyPressure: state.sovereigntyPressure,
          continuityPressure: state.continuityPressure,
          governanceStability: state.governanceStability,
          interventionUrgency: state.interventionUrgency,
          territoryCountry: ctx.territoryCountry,
          territoryCity: ctx.territoryCity,
          sectorSlug: ctx.sectorSlug,
          diagnostics: state.diagnostics as Prisma.InputJsonValue,
          metadata: { ingestion: "syncEconomicGovernanceState", planningOnly: true } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalEconomicGovernanceCoordination.deleteMany({
        where: { governanceNodeId: node.id },
      });
      const coordCode = `GOV_COORD:${relationshipId}:${Date.now()}`;
      const balance = this.coordination.computeCoordinationScore(state.coordination, {
        balanceScore: state.governanceStability,
        coordinationPressure: state.coordination.coordinationOverload,
      });
      await this.prisma.relationalEconomicGovernanceCoordination.create({
        data: {
          governanceNodeId: node.id,
          relationshipId,
          coordinationCode: coordCode,
          coordinationScore: balance,
          strategicCorridorCount: state.coordination.strategicCorridorCount,
          coordinationOverload: state.coordination.coordinationOverload,
          balanceScore: state.governanceStability,
          governancePriorityScore: state.interventionUrgency,
          strategicCorridorRefs: state.coordination.strategicCorridorRefs as Prisma.InputJsonValue,
          diagnostics: state.coordination as unknown as Prisma.InputJsonValue,
          metadata: {} as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalEconomicGovernanceConflict.deleteMany({
        where: { governanceNodeId: node.id },
      });
      const detected = this.conflicts.detectConflicts(ctx, state.coordination);
      for (const c of detected) {
        await this.prisma.relationalEconomicGovernanceConflict.create({
          data: {
            governanceNodeId: node.id,
            relationshipId,
            conflictCode: c.conflictCode,
            conflictType: c.conflictType,
            severity: c.severity,
            priority: c.priority,
            affectedCorridors: c.affectedCorridors as Prisma.InputJsonValue,
            conflictPressure: c.conflictPressure,
            systemicExposure: c.systemicExposure,
            recoveryImpact: c.recoveryImpact,
            estimatedResolutionComplexity: c.estimatedResolutionComplexity,
            diagnostics: { detectedBy: "relational_economic_governance.conflict" } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
      }

      await this.prisma.relationalEconomicGovernanceSnapshot.create({
        data: {
          relationshipId,
          governanceNodeId: node.id,
          snapshotCode: `GOV_SNAP:${relationshipId}:${Date.now()}`,
          governanceStatus: state.governanceStatus,
          governanceScore: state.governanceScore,
          coordinationScore: state.coordinationScore,
          systemicRisk: state.systemicRisk,
          diagnostics: state.diagnostics as Prisma.InputJsonValue,
          metadata: { ingestion: "syncEconomicGovernanceState" } as Prisma.InputJsonValue,
        },
      });

      const createdBefore = await this.prisma.relationalEconomicGovernanceEvent.count({
        where: { relationshipId, eventType: RelationalEconomicGovernanceEventType.COORDINATION_DETECTED },
      });

      await this.prisma.relationalEconomicGovernanceEvent.create({
        data: {
          relationshipId,
          governanceNodeId: node.id,
          eventType:
            createdBefore === 0
              ? RelationalEconomicGovernanceEventType.COORDINATION_DETECTED
              : RelationalEconomicGovernanceEventType.BALANCE_UPDATED,
          actorOrganizationId: ctx.buyerOrganizationId,
          diagnostics: { nodeCode, ingestion: "relational_economic_governance.syncEconomicGovernanceState" } as Prisma.InputJsonValue,
          metadata: {} as Prisma.InputJsonValue,
        },
      });

      const publishBase = {
        buyerOrganizationId: ctx.buyerOrganizationId,
        sellerOrganizationId: ctx.sellerOrganizationId,
        relationshipId,
        governanceNodeId: node.id,
        governanceNodeCode: nodeCode,
        intensity: state.governanceScore,
        governanceDepth: state.coordination.strategicCorridorCount,
      };

      await this.realtime
        .publishToOrganizations({ ...publishBase, eventType: "relational.governance.coordination_detected" })
        .catch((e) => this.log.warn(String(e)));

      if (detected.length > 0) {
        await this.realtime
          .publishToOrganizations({ ...publishBase, eventType: "relational.governance.conflict_detected", intensity: detected[0]!.conflictPressure })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.interventionUrgency >= 62) {
        await this.realtime
          .publishToOrganizations({ ...publishBase, eventType: "relational.governance.priority_detected", intensity: state.interventionUrgency })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.systemicRisk >= 68) {
        await this.realtime
          .publishToOrganizations({ ...publishBase, eventType: "relational.governance.systemic_risk_detected", intensity: state.systemicRisk })
          .catch((e) => this.log.warn(String(e)));
      }
      await this.realtime
        .publishToOrganizations({ ...publishBase, eventType: "relational.governance.balance_updated", intensity: state.governanceStability })
        .catch((e) => this.log.warn(String(e)));
    } catch (err) {
      this.log.warn(`economic governance ingestion failed: ${String(err)}`);
    } finally {
      this.ingestActive.delete(relationshipId);
      try {
        await this.arbitrationIngestion.syncEconomicArbitrationState(relationshipId);
      } catch (chainErr) {
        this.log.warn(
          JSON.stringify({
            phase: "economic_arbitration_chain_from_governance",
            relationshipId,
            error: String(chainErr),
          }),
        );
      }
    }
  }

  async archiveGovernanceSnapshot(snapshotId: string, actorOrganizationId: string): Promise<void> {
    const snap = await this.prisma.relationalEconomicGovernanceSnapshot.findUnique({
      where: { id: snapshotId },
      include: { relationship: { select: { corridorState: true, id: true } } },
    });
    if (!snap) return;
    const gate = this.policy.assertEconomicGovernanceMutationAllowed(snap.relationship.corridorState);
    if (!gate.allowed) return;
    await this.prisma.relationalEconomicGovernanceSnapshot.update({
      where: { id: snapshotId },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalEconomicGovernanceEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        governanceNodeId: snap.governanceNodeId,
        eventType: RelationalEconomicGovernanceEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId,
        diagnostics: { snapshotId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }
}
