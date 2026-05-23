import { Injectable } from "@nestjs/common";

import type { EconomicMonitoringCorridorContext } from "./relational-economic-monitoring-corridor-context.service";
import { RelationalEconomicMonitoringPolicyService } from "./relational-economic-monitoring-policy.service";

@Injectable()
export class RelationalEconomicMonitoringRiskService {
  constructor(private readonly policy: RelationalEconomicMonitoringPolicyService) {}

  computeSystemicRisk(ctx: EconomicMonitoringCorridorContext): number {
    return this.policy.clampInt(
      ctx.topInstabilityPressure * 0.3 +
        ctx.macroPropagationRisk * 0.2 +
        ctx.dependencyExposureScore * 0.2 +
        ctx.topArbitrationScore * 0.15 +
        (100 - ctx.activeGovernanceStability) * 0.15,
    );
  }

  detectSystemicEscalation(ctx: EconomicMonitoringCorridorContext, systemicRisk: number): boolean {
    return systemicRisk >= 70 || ctx.macroStructuralFragility >= 68 || ctx.openIncidentCount >= 2;
  }

  detectStrategicImbalance(ctx: EconomicMonitoringCorridorContext): boolean {
    return (
      Math.abs(ctx.activeGovernanceScore - ctx.topStabilizationScore) >= 35 ||
      ctx.governanceConflictCount >= 3 ||
      ctx.peerRelationshipCount >= 5
    );
  }
}
