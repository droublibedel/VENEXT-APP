import { Injectable } from "@nestjs/common";
import type {
  RelationalOperationalOrchestrationType,
  RelationalOperationalSimulationType,
  RelationalScenarioDecisionSeverity,
  RelationalScenarioReviewStatus,
} from "@prisma/client";

export const SCENARIO_REVIEW_ENGINE_THRESHOLDS = {
  criticalRiskScore: Number(process.env.VENEXT_SCENARIO_REVIEW_CRITICAL_RISK ?? 85),
  executiveCollapseScore: Number(process.env.VENEXT_SCENARIO_REVIEW_EXEC_COLLAPSE ?? 75),
  maxCriticalSimulationsForExecutive: Number(process.env.VENEXT_SCENARIO_REVIEW_MAX_CRITICAL_SIMS ?? 2),
  expirationDays: Number(process.env.VENEXT_SCENARIO_REVIEW_EXPIRATION_DAYS ?? 30),
} as const;

const TERMINAL_REVIEW: RelationalScenarioReviewStatus[] = [
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
  "EXPIRED",
];

const DUAL_VALIDATION_SIMULATION_TYPES: RelationalOperationalSimulationType[] = [
  "COLLAPSE_PROPAGATION",
  "GOVERNANCE_BREAKDOWN",
  "MULTI_CORRIDOR_STRESS",
];

const AUTO_REVIEW_SIMULATION_TYPES: RelationalOperationalSimulationType[] = [
  "COLLAPSE_PROPAGATION",
  "GOVERNANCE_BREAKDOWN",
  "MULTI_CORRIDOR_STRESS",
];

const CONFLICTING_ORCHESTRATION: RelationalOperationalOrchestrationType[][] = [
  ["COLLAPSE_PREVENTION", "CORRIDOR_RECOVERY"],
  ["GOVERNANCE_REVIEW", "CORRIDOR_RECOVERY"],
];

export type ScenarioReviewPolicyContext = {
  reviewStatus: RelationalScenarioReviewStatus;
  corridorState: string;
  decisionSeverity: RelationalScenarioDecisionSeverity;
  resultingRiskScore: number | null;
  simulationType: RelationalOperationalSimulationType | null;
  simulationSeverity: RelationalScenarioDecisionSeverity | null;
  requiresExecutiveValidation: boolean;
  requiresDualValidation: boolean;
  activeOrchestrationTypes: RelationalOperationalOrchestrationType[];
  criticalSimulationCount: number;
  collapseScore: number;
  metadata: Record<string, unknown>;
};

@Injectable()
export class RelationalScenarioReviewPolicyService {
  isTerminalStatus(status: RelationalScenarioReviewStatus): boolean {
    return TERMINAL_REVIEW.includes(status);
  }

  shouldAutoCreateReview(input: {
    simulationType: RelationalOperationalSimulationType;
    severity: RelationalScenarioDecisionSeverity;
    outcome: string | null;
    requiresHumanReview: boolean;
  }): boolean {
    if (input.requiresHumanReview) return true;
    if (input.severity === "CRITICAL") return true;
    if (AUTO_REVIEW_SIMULATION_TYPES.includes(input.simulationType)) return true;
    if (input.outcome === "COLLAPSE_RISK" || input.outcome === "HIGH_RISK") return true;
    return false;
  }

  requiresDualValidation(simulationType: RelationalOperationalSimulationType | null): boolean {
    if (!simulationType) return false;
    return DUAL_VALIDATION_SIMULATION_TYPES.includes(simulationType);
  }

  requiresExecutiveValidation(ctx: {
    decisionSeverity: RelationalScenarioDecisionSeverity;
    corridorState: string;
    resultingRiskScore: number | null;
    collapseScore: number;
    criticalSimulationCount: number;
  }): boolean {
    if (ctx.decisionSeverity === "CRITICAL") return true;
    if (["BLOCKED", "SUSPENDED"].includes(ctx.corridorState)) return true;
    if ((ctx.resultingRiskScore ?? 0) >= SCENARIO_REVIEW_ENGINE_THRESHOLDS.criticalRiskScore) return true;
    if (ctx.collapseScore >= SCENARIO_REVIEW_ENGINE_THRESHOLDS.executiveCollapseScore) return true;
    if (ctx.criticalSimulationCount >= SCENARIO_REVIEW_ENGINE_THRESHOLDS.maxCriticalSimulationsForExecutive) {
      return true;
    }
    return false;
  }

  severityFromSimulation(
    simSeverity: import("@prisma/client").RelationalOperationalSimulationSeverity,
    riskScore: number | null,
  ): RelationalScenarioDecisionSeverity {
    if (simSeverity === "CRITICAL" || (riskScore ?? 0) >= 85) return "CRITICAL";
    if (simSeverity === "HIGH" || (riskScore ?? 0) >= 65) return "HIGH";
    if (simSeverity === "MEDIUM" || (riskScore ?? 0) >= 40) return "MEDIUM";
    return "LOW";
  }

  hasConflictingOrchestration(
    activeTypes: RelationalOperationalOrchestrationType[],
  ): boolean {
    for (const pair of CONFLICTING_ORCHESTRATION) {
      if (pair.every((t) => activeTypes.includes(t))) return true;
    }
    return false;
  }

  assertCanApprove(ctx: ScenarioReviewPolicyContext): void {
    if (this.isTerminalStatus(ctx.reviewStatus)) {
      throw new Error("scenario_review_terminal");
    }
    if (ctx.corridorState === "TERMINATED") {
      throw new Error("scenario_review_corridor_terminated");
    }
    if (ctx.corridorState === "SUSPENDED" && ctx.decisionSeverity === "CRITICAL") {
      throw new Error("scenario_review_corridor_suspended_critical");
    }
    if (this.hasConflictingOrchestration(ctx.activeOrchestrationTypes)) {
      throw new Error("scenario_review_conflicting_orchestration");
    }
    const risk = ctx.resultingRiskScore ?? 0;
    if (
      risk >= SCENARIO_REVIEW_ENGINE_THRESHOLDS.criticalRiskScore &&
      ctx.requiresExecutiveValidation &&
      ctx.metadata.executiveValidated !== true
    ) {
      throw new Error("scenario_review_executive_required");
    }
  }

  mapSimulationToOrchestrationType(
    simulationType: RelationalOperationalSimulationType,
  ): RelationalOperationalOrchestrationType {
    switch (simulationType) {
      case "COLLAPSE_PROPAGATION":
        return "COLLAPSE_PREVENTION";
      case "GOVERNANCE_BREAKDOWN":
        return "GOVERNANCE_REVIEW";
      case "MULTI_CORRIDOR_STRESS":
        return "CORRIDOR_RECOVERY";
      case "INCIDENT_ESCALATION":
        return "INCIDENT_CONTAINMENT";
      case "FULFILLMENT_DISRUPTION":
        return "FULFILLMENT_STABILIZATION";
      case "COORDINATION_OVERLOAD":
        return "COORDINATION_REBALANCING";
      case "EXECUTION_SATURATION":
        return "EXECUTION_RECOVERY";
      default:
        return "SLA_STABILIZATION";
    }
  }
}
