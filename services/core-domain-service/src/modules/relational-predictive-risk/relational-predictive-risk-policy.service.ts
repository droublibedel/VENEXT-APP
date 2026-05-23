import { Injectable } from "@nestjs/common";
import type { RelationalPredictiveRiskLevel } from "@prisma/client";

/** Instruction 20.13 — deterministic, documented thresholds (env-overridable). */
export const PREDICTIVE_RISK_THRESHOLDS = {
  driftDeviationPercent: Number(process.env.VENEXT_PREDICTIVE_DRIFT_DEVIATION_PCT ?? 25),
  coordinationSaturationOpenTasks: Number(process.env.VENEXT_PREDICTIVE_COORDINATION_SATURATION ?? 5),
  blockingTaskAccumulation: Number(process.env.VENEXT_PREDICTIVE_BLOCKING_TASKS ?? 3),
  incidentEscalationWindowDays: Number(process.env.VENEXT_PREDICTIVE_INCIDENT_WINDOW_DAYS ?? 30),
  incidentEscalationCount: Number(process.env.VENEXT_PREDICTIVE_INCIDENT_COUNT ?? 3),
  fulfillmentDelayHours: Number(process.env.VENEXT_PREDICTIVE_FULFILLMENT_DELAY_H ?? 72),
  collapseCriticalAlerts: Number(process.env.VENEXT_PREDICTIVE_COLLAPSE_CRITICAL ?? 2),
  collapseHighAlerts: Number(process.env.VENEXT_PREDICTIVE_COLLAPSE_HIGH ?? 4),
  repeatedDegradationSignals: Number(process.env.VENEXT_PREDICTIVE_DEGRADATION_PATTERN ?? 3),
  scoreCap: 100,
} as const;

@Injectable()
export class RelationalPredictiveRiskPolicyService {
  clampScore(raw: number): number {
    return Math.min(PREDICTIVE_RISK_THRESHOLDS.scoreCap, Math.max(0, Math.round(raw * 100) / 100));
  }

  deviationPercent(baseline: number, current: number): number {
    if (baseline <= 0) return current > 0 ? 100 : 0;
    return Math.round(((current - baseline) / baseline) * 10000) / 100;
  }

  levelFromScore(score: number): RelationalPredictiveRiskLevel {
    if (score >= 80) return "CRITICAL";
    if (score >= 60) return "HIGH";
    if (score >= 35) return "MEDIUM";
    return "LOW";
  }

  confidenceFromSampleSize(sampleSize: number): number {
    if (sampleSize >= 20) return 0.92;
    if (sampleSize >= 10) return 0.78;
    if (sampleSize >= 5) return 0.62;
    if (sampleSize >= 2) return 0.48;
    return 0.35;
  }

  allowsHistoricalCorridorObservation(corridorState: string): boolean {
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

  computeDeterministicScore(factors: {
    openIncidents: number;
    blockingTasks: number;
    criticalAlerts: number;
    highAlerts: number;
    avgFulfillmentHours: number | null;
    corridorHealthScore: number;
    driftCount: number;
  }): { score: number; diagnostics: Record<string, number> } {
    const incidentWeight = Math.min(30, factors.openIncidents * 8);
    const blockingWeight = Math.min(25, factors.blockingTasks * 7);
    const alertWeight = Math.min(25, factors.criticalAlerts * 12 + factors.highAlerts * 5);
    const fulfillmentWeight =
      factors.avgFulfillmentHours != null && factors.avgFulfillmentHours >= PREDICTIVE_RISK_THRESHOLDS.fulfillmentDelayHours
        ? 15
        : 0;
    const healthWeight = Math.min(15, Math.max(0, 55 - factors.corridorHealthScore) / 3);
    const driftWeight = Math.min(10, factors.driftCount * 3);
    const raw = incidentWeight + blockingWeight + alertWeight + fulfillmentWeight + healthWeight + driftWeight;
    return {
      score: this.clampScore(raw),
      diagnostics: {
        incidentWeight,
        blockingWeight,
        alertWeight,
        fulfillmentWeight,
        healthWeight,
        driftWeight,
      },
    };
  }
}
