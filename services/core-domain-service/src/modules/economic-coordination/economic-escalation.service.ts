import { Injectable } from "@nestjs/common";
import type { CoordinationConflict, EconomicCoordinationSnapshot, EconomicEscalation, EconomicPosture } from "@venext/shared-contracts";

@Injectable()
export class EconomicEscalationService {
  assess(
    snapshot: EconomicCoordinationSnapshot,
    posture: EconomicPosture,
    conflicts: CoordinationConflict[],
  ): EconomicEscalation {
    const shockN = snapshot.propagationBundle.shocks.length;
    const terr = snapshot.propagationBundle.territoryFragility.filter((t) => t.fragilityScore > 0.42).length;
    const maxSev = conflicts.reduce((m, c) => Math.max(m, c.severity), 0);
    const raw =
      snapshot.realtimePressure * 0.22 +
      snapshot.organizationSignals * 0.2 +
      snapshot.financialPressure * 0.18 +
      snapshot.logisticsPressure * 0.15 +
      snapshot.operationalPressure * 0.15 +
      Math.min(1, shockN / 14) * 0.05 +
      Math.min(1, terr / 8) * 0.05 +
      maxSev * 0.1;

    const escalationScore = Number(Math.min(1, raw).toFixed(4));
    let escalationLevel: EconomicEscalation["escalationLevel"] = "LOW";
    if (escalationScore >= 0.78) escalationLevel = "CRITICAL";
    else if (escalationScore >= 0.58) escalationLevel = "HIGH";
    else if (escalationScore >= 0.38) escalationLevel = "ELEVATED";

    const drivers: string[] = [];
    if (shockN >= 5) drivers.push(`simultaneous_shocks:${shockN}`);
    if (terr >= 3) drivers.push(`multi_territory_fragility:${terr}`);
    if (maxSev >= 0.55) drivers.push("coordination_conflict_severity");
    if (snapshot.financialPressure > 0.5 && snapshot.logisticsPressure > 0.45) {
      drivers.push("liquidity_plus_distribution_joint_pressure");
    }

    const coordinationRecommendation =
      escalationLevel === "CRITICAL" || escalationLevel === "HIGH"
        ? "Executive coordination session recommended — validate cross-pole arbitration directions before any operational commitment."
        : "Maintain watch posture — continue deterministic monitoring; escalate if shocks or conflicts increase.";

    return {
      escalationLevel,
      escalationScore,
      escalationDrivers: drivers.length ? drivers : ["no_critical_driver_cluster"],
      affectedPoles: posture.affectedPoles,
      coordinationRecommendation,
      executiveAttentionRequired: escalationLevel === "HIGH" || escalationLevel === "CRITICAL",
      diagnostics: ["rule:weighted_pressure_escalation", `posture:${posture.posture}`],
    };
  }
}
