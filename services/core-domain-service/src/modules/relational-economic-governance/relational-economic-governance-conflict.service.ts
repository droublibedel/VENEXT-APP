import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicGovernancePriority,
  RelationalEconomicGovernanceSeverity,
} from "@prisma/client";

import type { EconomicGovernanceCorridorContext } from "./relational-economic-governance-corridor-context.service";
import type { GovernanceCoordinationDiagnostics } from "./relational-economic-governance-coordination.service";
import { RelationalEconomicGovernancePolicyService } from "./relational-economic-governance-policy.service";

export type DetectedGovernanceConflict = {
  conflictCode: string;
  conflictType: string;
  severity: RelationalEconomicGovernanceSeverity;
  priority: RelationalEconomicGovernancePriority;
  affectedCorridors: string[];
  conflictPressure: number;
  systemicExposure: number;
  recoveryImpact: number;
  estimatedResolutionComplexity: number;
};

@Injectable()
export class RelationalEconomicGovernanceConflictService {
  constructor(private readonly policy: RelationalEconomicGovernancePolicyService) {}

  detectConflicts(
    ctx: EconomicGovernanceCorridorContext,
    coordination: GovernanceCoordinationDiagnostics,
  ): DetectedGovernanceConflict[] {
    const out: DetectedGovernanceConflict[] = [];
    const rid = ctx.relationshipId;

    const push = (
      suffix: string,
      conflictType: string,
      pressure: number,
      systemic: number,
      recoveryImpact: number,
      complexity: number,
    ) => {
      const conflictPressure = this.policy.clampInt(pressure);
      const score = this.policy.clampInt(pressure * 0.5 + systemic * 0.3 + recoveryImpact * 0.2);
      out.push({
        conflictCode: `GOV_CONFLICT:${rid}:${suffix}`,
        conflictType,
        severity: this.toSeverity(score),
        priority: this.toPriority(score),
        affectedCorridors: coordination.strategicCorridorRefs.length
          ? coordination.strategicCorridorRefs
          : [rid],
        conflictPressure,
        systemicExposure: this.policy.clampInt(systemic),
        recoveryImpact: this.policy.clampInt(recoveryImpact),
        estimatedResolutionComplexity: this.policy.clampInt(complexity),
      });
    };

    if (ctx.activeRecoveryInstability >= 55 && ctx.activeRecoveryInterventionPriority >= 60) {
      push("recovery", "RECOVERY_CONFLICT", ctx.activeRecoveryInstability, ctx.systemicAutonomyRisk, 72, 68);
    }
    if (ctx.dependencyExposureScore >= 58 || ctx.macroDependencyCount >= 4) {
      push("dependency", "DEPENDENCY_CONFLICT", ctx.dependencyExposureScore, ctx.dependencyScore, 55, 62);
    }
    if (ctx.pressureGraphScore >= 52) {
      push("pressure", "PRESSURE_CONFLICT", ctx.pressureGraphScore, ctx.macroPropagationRisk, 48, 55);
    }
    if (ctx.macroPropagationRisk >= 50) {
      push("propagation", "PROPAGATION_CONFLICT", ctx.macroPropagationRisk, ctx.systemicAutonomyRisk, 60, 70);
    }
    if (ctx.peerRelationshipCount >= 8) {
      push("territorial", "TERRITORIAL_OVERLOAD", ctx.peerRelationshipCount * 4, 40, 35, 58);
    }
    if (ctx.sectorSlug && ctx.macroDependencyCount >= 3) {
      push("sector", "SECTOR_CONCENTRATION", 50 + ctx.macroDependencyCount * 5, 45, 42, 54);
    }
    if (ctx.strategicCaptivityRisk >= 55) {
      push("sovereignty", "SOVEREIGNTY_CONFLICT", ctx.strategicCaptivityRisk, ctx.systemicAutonomyRisk, 65, 72);
    }
    if (ctx.continuityInstability >= 52) {
      push("continuity", "CONTINUITY_CONFLICT", ctx.continuityInstability, ctx.continuityScore, 58, 60);
    }
    if (coordination.coordinationOverload >= 62) {
      push("coordination", "COORDINATION_OVERLOAD", coordination.coordinationOverload, 55, 50, 64);
    }

    return out.slice(0, 12);
  }

  private toPriority(score: number): RelationalEconomicGovernancePriority {
    if (score >= 78) return RelationalEconomicGovernancePriority.CRITICAL;
    if (score >= 62) return RelationalEconomicGovernancePriority.HIGH;
    if (score >= 42) return RelationalEconomicGovernancePriority.MEDIUM;
    return RelationalEconomicGovernancePriority.LOW;
  }

  private toSeverity(score: number): RelationalEconomicGovernanceSeverity {
    if (score >= 78) return RelationalEconomicGovernanceSeverity.CRITICAL;
    if (score >= 55) return RelationalEconomicGovernanceSeverity.HIGH;
    if (score >= 35) return RelationalEconomicGovernanceSeverity.MEDIUM;
    return RelationalEconomicGovernanceSeverity.LOW;
  }
}
