import { Injectable } from "@nestjs/common";
import type { CommercialCorridorState, RelationalOperationalAlertSeverity } from "@prisma/client";
import type { CorridorOperationalHealthDto } from "@venext/shared-contracts";

/** Instruction 20.12 — SLA thresholds (hours) from real corridor ops, not mock data. */
export const OPERATIONAL_SLA_THRESHOLDS = {
  fulfillmentStagnationHours: Number(process.env.VENEXT_OPS_FULFILLMENT_STAGNATION_HOURS ?? 72),
  blockingTaskAgeHours: Number(process.env.VENEXT_OPS_BLOCKING_TASK_AGE_HOURS ?? 48),
  proofValidationDelayHours: Number(process.env.VENEXT_OPS_PROOF_DELAY_HOURS ?? 48),
  executionLatencyHours: Number(process.env.VENEXT_OPS_EXECUTION_LATENCY_HOURS ?? 168),
  incidentPatternCount: Number(process.env.VENEXT_OPS_INCIDENT_PATTERN_COUNT ?? 3),
  incidentPatternDays: Number(process.env.VENEXT_OPS_INCIDENT_PATTERN_DAYS ?? 30),
  coordinationOverloadOpenTasks: Number(process.env.VENEXT_OPS_COORDINATION_OVERLOAD ?? 5),
  confirmationImbalanceRatio: Number(process.env.VENEXT_OPS_CONFIRMATION_IMBALANCE_RATIO ?? 3),
  slaDelayRiskHours: Number(process.env.VENEXT_OPS_SLA_DELAY_RISK_HOURS ?? 96),
} as const;

@Injectable()
export class RelationalOperationalIntelligencePolicyService {
  hoursBetween(from: Date, to: Date): number {
    return Math.max(0, (to.getTime() - from.getTime()) / (1000 * 60 * 60));
  }

  computeCorridorOperationalHealth(input: {
    corridorState: CommercialCorridorState;
    corridorHealthScore: number;
    openAlerts: number;
    criticalAlerts: number;
  }): CorridorOperationalHealthDto {
    if (input.criticalAlerts > 0 || input.corridorState === "BLOCKED") return "CRITICAL";
    if (
      input.corridorState === "DEGRADED" ||
      input.corridorState === "SUSPENDED" ||
      input.corridorHealthScore < 40 ||
      input.openAlerts >= 5
    ) {
      return "DEGRADED";
    }
    if (input.openAlerts > 0 || input.corridorState === "RESTRICTED" || input.corridorHealthScore < 55) {
      return "CAUTION";
    }
    return "STABLE";
  }

  severityForMetricHours(metricType: string, hours: number): RelationalOperationalAlertSeverity {
    const t = OPERATIONAL_SLA_THRESHOLDS;
    if (metricType === "EXECUTION_DURATION_HOURS" && hours >= t.executionLatencyHours) return "HIGH";
    if (metricType === "FULFILLMENT_DURATION_HOURS" && hours >= t.fulfillmentStagnationHours) return "WARNING";
    if (metricType === "RECEPTION_VALIDATION_DELAY_HOURS" && hours >= t.proofValidationDelayHours) return "WARNING";
    if (hours >= t.slaDelayRiskHours) return "HIGH";
    return "INFO";
  }

  allowsHistoricalCorridorObservation(corridorState: CommercialCorridorState): boolean {
    return (
      corridorState === "BLOCKED" ||
      corridorState === "DEGRADED" ||
      corridorState === "TERMINATED" ||
      corridorState === "SUSPENDED" ||
      corridorState === "RESTRICTED" ||
      corridorState === "ACTIVE" ||
      corridorState === "DORMANT"
    );
  }
}
