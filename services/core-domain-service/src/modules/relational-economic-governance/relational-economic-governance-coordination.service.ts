import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicGovernancePriority,
  RelationalEconomicGovernanceSeverity,
  RelationalEconomicGovernanceStatus,
  RelationalEconomicGovernanceType,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import type { EconomicGovernanceCorridorContext } from "./relational-economic-governance-corridor-context.service";
import { RelationalEconomicGovernanceBalanceService } from "./relational-economic-governance-balance.service";
import { RelationalEconomicGovernancePolicyService } from "./relational-economic-governance-policy.service";
import { RelationalEconomicGovernancePriorityService } from "./relational-economic-governance-priority.service";
import { RelationalEconomicGovernanceRiskService } from "./relational-economic-governance-risk.service";

export type GovernanceCoordinationDiagnostics = {
  strategicCorridorRefs: string[];
  strategicCorridorCount: number;
  coordinationOverload: number;
  traversalDepth: number;
  visitedCorridors: number;
  boundedTraversalApplied: boolean;
  propagationEdgeCount: number;
};

export type ComputedGovernanceState = {
  governanceType: RelationalEconomicGovernanceType;
  governancePriority: RelationalEconomicGovernancePriority;
  governanceStatus: RelationalEconomicGovernanceStatus;
  severity: RelationalEconomicGovernanceSeverity;
  governanceScore: number;
  coordinationScore: number;
  systemicRisk: number;
  corridorCriticality: number;
  recoveryPressure: number;
  dependencyPressure: number;
  propagationPressure: number;
  sovereigntyPressure: number;
  continuityPressure: number;
  governanceStability: number;
  interventionUrgency: number;
  coordination: GovernanceCoordinationDiagnostics;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalEconomicGovernanceCoordinationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicGovernancePolicyService,
    private readonly prioritySvc: RelationalEconomicGovernancePriorityService,
    private readonly riskSvc: RelationalEconomicGovernanceRiskService,
    private readonly balanceSvc: RelationalEconomicGovernanceBalanceService,
  ) {}

  async computeGovernanceState(ctx: EconomicGovernanceCorridorContext): Promise<ComputedGovernanceState> {
    const priority = this.prioritySvc.computePriority(ctx);
    const risk = this.riskSvc.computeRisk(ctx);
    const balance = this.balanceSvc.computeBalance(ctx);
    const coordination = await this.buildCoordinationDiagnostics(ctx);

    const governanceScore = this.policy.clampInt(
      balance.balanceScore * 0.35 +
        (100 - risk.systemicRisk) * 0.25 +
        ctx.continuityScore * 0.2 +
        ctx.activeRecoveryScore * 0.2,
    );
    const coordinationScore = this.computeCoordinationScore(coordination, balance);
    const recoveryPressure = this.policy.clampInt(
      ctx.activeRecoveryInstability * 0.5 + ctx.activeRecoveryInterventionPriority * 0.5,
    );
    const dependencyPressure = this.policy.clampInt(
      ctx.dependencyExposureScore * 0.6 + ctx.dependencyScore * 0.4,
    );
    const sovereigntyPressure = this.policy.clampInt(
      (100 - ctx.autonomyScore) * 0.5 + ctx.strategicCaptivityRisk * 0.5,
    );
    const continuityPressure = this.policy.clampInt(
      (100 - ctx.continuityScore) * 0.55 + ctx.continuityInstability * 0.45,
    );

    const systemicTensions = this.detectSystemicTensions(ctx, risk);
    const governanceType = this.resolveGovernanceType(ctx, coordination, systemicTensions);

    return {
      governanceType,
      governancePriority: priority.governancePriority,
      governanceStatus: RelationalEconomicGovernanceStatus.ACTIVE,
      severity: priority.severity,
      governanceScore,
      coordinationScore,
      systemicRisk: risk.systemicRisk,
      corridorCriticality: priority.corridorCriticality,
      recoveryPressure,
      dependencyPressure,
      propagationPressure: risk.propagationPressure,
      sovereigntyPressure,
      continuityPressure,
      governanceStability: risk.governanceStability,
      interventionUrgency: priority.interventionUrgency,
      coordination,
      diagnostics: {
        computedFrom: [
          "recovery",
          "sovereignty",
          "continuity",
          "macro_economic",
          "supply_flow",
          "pressure_graph",
          "strategic_memory",
          "orchestration",
        ],
        planningOnly: true,
        nonAutopilot: true,
        strategicCorridors: coordination.strategicCorridorRefs,
        systemicTensions,
        balanceScore: balance.balanceScore,
        governancePriorityScore: priority.governancePriorityScore,
      },
    };
  }

  computeCoordinationScore(
    coordination: GovernanceCoordinationDiagnostics,
    balance: { balanceScore: number; coordinationPressure: number },
  ): number {
    return this.policy.clampInt(
      balance.balanceScore * 0.4 +
        (100 - coordination.coordinationOverload) * 0.35 +
        coordination.strategicCorridorCount * 2 -
        balance.coordinationPressure * 0.25,
    );
  }

  detectStrategicCorridors(ctx: EconomicGovernanceCorridorContext): string[] {
    return ctx.relationshipId ? [ctx.relationshipId] : [];
  }

  detectCriticalDependencies(ctx: EconomicGovernanceCorridorContext): number {
    return ctx.macroDependencyCount + ctx.sovereigntyDependencyCount + ctx.continuityDependencyCount;
  }

  detectSystemicTensions(
    ctx: EconomicGovernanceCorridorContext,
    risk: { systemicRisk: number },
  ): string[] {
    const tensions: string[] = [];
    if (risk.systemicRisk >= 60) tensions.push("systemic_risk_elevated");
    if (ctx.activeRecoveryInstability >= 55) tensions.push("recovery_pressure");
    if (ctx.pressureGraphScore >= 50) tensions.push("pressure_density");
    if (ctx.strategicCaptivityRisk >= 55) tensions.push("sovereignty_weakness");
    return tensions;
  }

  detectCoordinationOverload(coordination: GovernanceCoordinationDiagnostics): number {
    return coordination.coordinationOverload;
  }

  detectRecoveryConflicts(ctx: EconomicGovernanceCorridorContext): boolean {
    return ctx.activeRecoveryInstability >= 55 && ctx.activeRecoveryInterventionPriority >= 58;
  }

  computeGovernancePriority(ctx: EconomicGovernanceCorridorContext): number {
    return this.prioritySvc.computePriority(ctx).governancePriorityScore;
  }

  computeGovernanceStability(ctx: EconomicGovernanceCorridorContext): number {
    return this.riskSvc.computeRisk(ctx).governanceStability;
  }

  private resolveGovernanceType(
    ctx: EconomicGovernanceCorridorContext,
    coordination: GovernanceCoordinationDiagnostics,
    tensions: string[],
  ): RelationalEconomicGovernanceType {
    if (coordination.coordinationOverload >= 65) {
      return RelationalEconomicGovernanceType.MULTI_CORRIDOR_COORDINATION;
    }
    if (tensions.includes("recovery_pressure")) {
      return RelationalEconomicGovernanceType.CONFLICT_ARBITRATION;
    }
    if (ctx.peerRelationshipCount >= 6) {
      return RelationalEconomicGovernanceType.NETWORK_STABILITY;
    }
    if (tensions.length >= 2) {
      return RelationalEconomicGovernanceType.SYSTEMIC_BALANCE;
    }
    return RelationalEconomicGovernanceType.STRATEGIC_PRIORITY;
  }

  private async buildCoordinationDiagnostics(
    ctx: EconomicGovernanceCorridorContext,
  ): Promise<GovernanceCoordinationDiagnostics> {
    const maxDepth = this.policy.maxGovernanceDepth();
    const strategicCorridorRefs = await this.discoverStrategicCorridors(ctx, maxDepth);
    const propagationEdgeCount = await this.prisma.relationalEconomicDependencyEdge.count({
      where: {
        OR: [
          { sourceNode: { relationshipId: ctx.relationshipId } },
          { targetNode: { relationshipId: ctx.relationshipId } },
        ],
      },
    });
    const coordinationOverload = this.policy.clampInt(
      strategicCorridorRefs.length * 8 +
        ctx.orchestrationOpenCount * 10 +
        ctx.activeRecoveryInterventionPriority * 0.3,
    );
    return {
      strategicCorridorRefs,
      strategicCorridorCount: strategicCorridorRefs.length,
      coordinationOverload,
      traversalDepth: Math.min(maxDepth, strategicCorridorRefs.length),
      visitedCorridors: strategicCorridorRefs.length,
      boundedTraversalApplied: strategicCorridorRefs.length >= maxDepth,
      propagationEdgeCount,
    };
  }

  private async discoverStrategicCorridors(
    ctx: EconomicGovernanceCorridorContext,
    maxDepth: number,
  ): Promise<string[]> {
    if (!ctx.buyerOrganizationId) return [ctx.relationshipId];
    const peers = await this.prisma.relationship.findMany({
      where: {
        OR: [
          { requesterOrganizationId: ctx.buyerOrganizationId },
          { receiverOrganizationId: ctx.buyerOrganizationId },
        ],
        corridorState: { not: "TERMINATED" },
      },
      select: { id: true, corridorHealthScore: true },
      orderBy: { corridorHealthScore: "asc" },
      take: maxDepth,
    });
    const ids = peers.map((p) => p.id);
    if (!ids.includes(ctx.relationshipId)) ids.unshift(ctx.relationshipId);
    return ids.slice(0, maxDepth);
  }
}
