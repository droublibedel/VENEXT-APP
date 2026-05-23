import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicArbitrationPriority,
  RelationalEconomicArbitrationScenarioType,
} from "@prisma/client";

import type { ArbitrationCandidate } from "./relational-economic-arbitration-conflict.service";
import { RelationalEconomicArbitrationPolicyService } from "./relational-economic-arbitration-policy.service";
import type { EconomicArbitrationCorridorContext } from "./relational-economic-arbitration-corridor-context.service";

export type GeneratedArbitrationScenario = {
  scenarioCode: string;
  scenarioType: RelationalEconomicArbitrationScenarioType;
  priority: RelationalEconomicArbitrationPriority;
  estimatedImpact: number;
  estimatedRisk: number;
  estimatedRecoveryGain: number;
  dependencyImpact: number;
  propagationImpact: number;
  continuityImpact: number;
  sovereigntyImpact: number;
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
};

const SCENARIO_SEQUENCE: RelationalEconomicArbitrationScenarioType[] = [
  RelationalEconomicArbitrationScenarioType.STABILIZATION_FIRST,
  RelationalEconomicArbitrationScenarioType.DEPENDENCY_REDUCTION_FIRST,
  RelationalEconomicArbitrationScenarioType.CONTINUITY_FIRST,
  RelationalEconomicArbitrationScenarioType.SOVEREIGNTY_FIRST,
  RelationalEconomicArbitrationScenarioType.PRESSURE_CONTAINMENT_FIRST,
  RelationalEconomicArbitrationScenarioType.BALANCED_RECOVERY,
  RelationalEconomicArbitrationScenarioType.SYSTEMIC_CONTAINMENT,
  RelationalEconomicArbitrationScenarioType.TERRITORIAL_REBALANCING,
  RelationalEconomicArbitrationScenarioType.SECTOR_REBALANCING,
  RelationalEconomicArbitrationScenarioType.MINIMAL_INTERVENTION,
];

@Injectable()
export class RelationalEconomicArbitrationScenarioService {
  constructor(private readonly policy: RelationalEconomicArbitrationPolicyService) {}

  generateScenarios(
    relationshipId: string,
    caseCode: string,
    candidate: ArbitrationCandidate,
    ctx: EconomicArbitrationCorridorContext,
  ): GeneratedArbitrationScenario[] {
    return SCENARIO_SEQUENCE.map((scenarioType, i) => {
      const weights = this.scenarioWeights(scenarioType, candidate, ctx);
      const estimatedImpact = this.policy.clampInt(weights.impact);
      const estimatedRisk = this.policy.clampInt(weights.risk);
      const estimatedRecoveryGain = this.policy.clampInt(weights.recoveryGain);
      const confidence =
        estimatedImpact >= 65 && estimatedRisk <= 45
          ? "HIGH"
          : estimatedRisk >= 60
            ? "LOW"
            : "MEDIUM";
      return {
        scenarioCode: `${caseCode}:SCENARIO:${scenarioType}`,
        scenarioType,
        priority: candidate.arbitrationPriority,
        estimatedImpact,
        estimatedRisk,
        estimatedRecoveryGain,
        dependencyImpact: this.policy.clampInt(weights.dependency),
        propagationImpact: this.policy.clampInt(weights.propagation),
        continuityImpact: this.policy.clampInt(weights.continuity),
        sovereigntyImpact: this.policy.clampInt(weights.sovereignty),
        confidenceLevel: confidence,
      };
    });
  }

  private scenarioWeights(
    scenarioType: RelationalEconomicArbitrationScenarioType,
    c: ArbitrationCandidate,
    ctx: EconomicArbitrationCorridorContext,
  ) {
    const base = {
      impact: c.arbitrationScore,
      risk: c.resolutionComplexity,
      recoveryGain: c.resolutionProbability * 100,
      dependency: c.dependencyPressure,
      propagation: c.propagationPressure,
      continuity: c.continuityPressure,
      sovereignty: c.sovereigntyPressure,
    };
    switch (scenarioType) {
      case RelationalEconomicArbitrationScenarioType.STABILIZATION_FIRST:
        return { ...base, impact: base.impact + 8, risk: base.risk - 5 };
      case RelationalEconomicArbitrationScenarioType.DEPENDENCY_REDUCTION_FIRST:
        return { ...base, dependency: base.dependency + 15, recoveryGain: base.recoveryGain + 5 };
      case RelationalEconomicArbitrationScenarioType.CONTINUITY_FIRST:
        return { ...base, continuity: base.continuity + 15, impact: base.impact + 5 };
      case RelationalEconomicArbitrationScenarioType.SOVEREIGNTY_FIRST:
        return { ...base, sovereignty: base.sovereignty + 15 };
      case RelationalEconomicArbitrationScenarioType.PRESSURE_CONTAINMENT_FIRST:
        return { ...base, propagation: base.propagation + 12, risk: base.risk - 3 };
      case RelationalEconomicArbitrationScenarioType.BALANCED_RECOVERY:
        return {
          impact: (base.impact + base.recoveryGain) / 2,
          risk: (base.risk + c.systemicImpact) / 2,
          recoveryGain: base.recoveryGain,
          dependency: base.dependency,
          propagation: base.propagation,
          continuity: base.continuity,
          sovereignty: base.sovereignty,
        };
      case RelationalEconomicArbitrationScenarioType.SYSTEMIC_CONTAINMENT:
        return { ...base, risk: base.risk + 10, impact: base.impact + 12, propagation: base.propagation + 10 };
      case RelationalEconomicArbitrationScenarioType.TERRITORIAL_REBALANCING:
        return { ...base, impact: base.impact + 8, risk: base.risk + 8 };
      case RelationalEconomicArbitrationScenarioType.SECTOR_REBALANCING:
        return { ...base, impact: base.impact + 6, dependency: base.dependency + 8 };
      case RelationalEconomicArbitrationScenarioType.MINIMAL_INTERVENTION:
        return {
          ...base,
          impact: Math.max(20, base.impact - 20),
          risk: Math.max(15, base.risk - 15),
          recoveryGain: Math.max(10, base.recoveryGain - 15),
        };
      default:
        return base;
    }
  }
}
