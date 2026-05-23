import { Injectable } from "@nestjs/common";
import type {
  RelationalOperationalSimulationOutcome,
  RelationalOperationalSimulationSeverity,
  RelationalOperationalSimulationType,
} from "@prisma/client";

export const SIMULATION_ENGINE_THRESHOLDS = {
  cooldownHours: Number(process.env.VENEXT_SIMULATION_COOLDOWN_HOURS ?? 24),
  maxRunningPerRelationship: Number(process.env.VENEXT_SIMULATION_MAX_RUNNING ?? 3),
  expirationDays: Number(process.env.VENEXT_SIMULATION_EXPIRATION_DAYS ?? 14),
} as const;

const HUMAN_REVIEW_TYPES: RelationalOperationalSimulationType[] = [
  "COLLAPSE_PROPAGATION",
  "MULTI_CORRIDOR_STRESS",
  "GOVERNANCE_BREAKDOWN",
];

export type SimulationCorridorInputs = {
  openAlerts: number;
  criticalAlerts: number;
  openIncidents: number;
  openTasks: number;
  openRecommendations: number;
  openOrchestrations: number;
  corridorHealthScore: number;
  corridorState: string;
  predictiveSignals: number;
  stressMultiplier: number;
};

export type CollapsePropagationProjection = {
  operationalFragility: number;
  collapsePropagationRisk: number;
  stabilizationProbability: number;
  recoveryComplexity: number;
};

export type SimulationScenarioTemplate = {
  scenarioCode: string;
  scenarioTitle: string;
  scenarioDescription: string;
  scenarioOrder: number;
  assumptions: Record<string, unknown>;
  expectedEffects: Record<string, unknown>;
};

@Injectable()
export class RelationalOperationalSimulationPolicyService {
  requiresHumanReview(type: RelationalOperationalSimulationType): boolean {
    return HUMAN_REVIEW_TYPES.includes(type);
  }

  buildCode(type: RelationalOperationalSimulationType, relationshipId: string): string {
    return `${type}:${relationshipId.slice(0, 8)}:${Date.now()}`;
  }

  severityFromScore(score: number): RelationalOperationalSimulationSeverity {
    if (score >= 85) return "CRITICAL";
    if (score >= 65) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }

  outcomeFromScore(score: number): RelationalOperationalSimulationOutcome {
    if (score >= 90) return "COLLAPSE_RISK";
    if (score >= 75) return "HIGH_RISK";
    if (score >= 55) return "RECOVERY_UNLIKELY";
    if (score >= 40) return "DEGRADED";
    if (score >= 25) return "RECOVERY_POSSIBLE";
    return "STABLE";
  }

  isWithinCooldown(lastCreatedAt: Date | null, now: Date): boolean {
    if (!lastCreatedAt) return false;
    const ms = SIMULATION_ENGINE_THRESHOLDS.cooldownHours * 60 * 60 * 1000;
    return now.getTime() - lastCreatedAt.getTime() < ms;
  }

  scenarioTemplatesFor(type: RelationalOperationalSimulationType): SimulationScenarioTemplate[] {
    const base: Record<RelationalOperationalSimulationType, SimulationScenarioTemplate[]> = {
      SLA_STRESS_TEST: [
        {
          scenarioCode: "sla_baseline",
          scenarioTitle: "Baseline SLA",
          scenarioDescription: "État SLA actuel du corridor (lecture seule).",
          scenarioOrder: 1,
          assumptions: { mode: "read_only" },
          expectedEffects: { slaDriftHours: 0 },
        },
        {
          scenarioCode: "sla_stress",
          scenarioTitle: "Stress SLA +25%",
          scenarioDescription: "Projection hausse délais fulfillment sans mutation réelle.",
          scenarioOrder: 2,
          assumptions: { stressPercent: 25 },
          expectedEffects: { slaDriftHours: 25 },
        },
      ],
      CORRIDOR_DEGRADATION: [
        {
          scenarioCode: "degrade_step",
          scenarioTitle: "Dégradation corridor",
          scenarioDescription: "Simulation passage santé opérationnelle vers DEGRADED.",
          scenarioOrder: 1,
          assumptions: { targetHealth: "DEGRADED" },
          expectedEffects: { healthDelta: -15 },
        },
      ],
      INCIDENT_ESCALATION: [
        {
          scenarioCode: "incident_wave",
          scenarioTitle: "Vague incidents",
          scenarioDescription: "Projection +2 incidents ouverts sans création réelle.",
          scenarioOrder: 1,
          assumptions: { additionalIncidents: 2 },
          expectedEffects: { incidentLoad: 2 },
        },
      ],
      EXECUTION_SATURATION: [
        {
          scenarioCode: "exec_saturation",
          scenarioTitle: "Saturation exécution",
          scenarioDescription: "Projection transitions exécution bloquées.",
          scenarioOrder: 1,
          assumptions: { blockedOrders: 1 },
          expectedEffects: { executionVolatility: 0.3 },
        },
      ],
      FULFILLMENT_DISRUPTION: [
        {
          scenarioCode: "fulfill_stagnation",
          scenarioTitle: "Stagnation fulfillment",
          scenarioDescription: "Projection stagnation preuves / réception.",
          scenarioOrder: 1,
          assumptions: { stagnationRecords: 1 },
          expectedEffects: { fulfillmentDelayHours: 48 },
        },
      ],
      COORDINATION_OVERLOAD: [
        {
          scenarioCode: "coord_overload",
          scenarioTitle: "Surcharge coordination",
          scenarioDescription: "Projection tâches ouvertes additionnelles.",
          scenarioOrder: 1,
          assumptions: { extraOpenTasks: 3 },
          expectedEffects: { coordinationSaturation: 0.4 },
        },
      ],
      COLLAPSE_PROPAGATION: [
        {
          scenarioCode: "collapse_seed",
          scenarioTitle: "Amorce collapse",
          scenarioDescription: "Signal collapse SLA existant propagé (simulation).",
          scenarioOrder: 1,
          assumptions: { propagationHops: 1 },
          expectedEffects: { collapseRiskDelta: 20 },
        },
        {
          scenarioCode: "collapse_domino",
          scenarioTitle: "Effet domino SLA",
          scenarioDescription: "Projection dérive multi-signaux sans mutation corridor.",
          scenarioOrder: 2,
          assumptions: { dominoFactor: 1.35 },
          expectedEffects: { slaDomino: true },
        },
      ],
      GOVERNANCE_BREAKDOWN: [
        {
          scenarioCode: "gov_breakdown",
          scenarioTitle: "Rupture gouvernance",
          scenarioDescription: "Simulation corridor BLOCKED sans changement réel d'état.",
          scenarioOrder: 1,
          assumptions: { projectedState: "BLOCKED" },
          expectedEffects: { governanceFriction: 0.8 },
        },
      ],
      PARTNER_FAILURE: [
        {
          scenarioCode: "partner_misalign",
          scenarioTitle: "Désalignement partenaire",
          scenarioDescription: "Projection validations partielles répétées.",
          scenarioOrder: 1,
          assumptions: { partialReceptions: 2 },
          expectedEffects: { partnerTrustDelta: -10 },
        },
      ],
      MULTI_CORRIDOR_STRESS: [
        {
          scenarioCode: "multi_corridor",
          scenarioTitle: "Stress multi-corridor",
          scenarioDescription: "Fragilité réseau agrégée (lecture corrélée).",
          scenarioOrder: 1,
          assumptions: { correlatedCorridors: 2 },
          expectedEffects: { networkFragility: 0.25 },
        },
      ],
    };
    return base[type] ?? [];
  }

  computeRiskScore(inputs: SimulationCorridorInputs): number {
    const m = inputs.stressMultiplier;
    let score =
      inputs.criticalAlerts * 18 +
      inputs.openAlerts * 8 +
      inputs.openIncidents * 14 +
      Math.min(30, inputs.openTasks * 3) +
      inputs.predictiveSignals * 10 +
      Math.max(0, 100 - inputs.corridorHealthScore) * 0.35;
    if (inputs.corridorState === "DEGRADED") score += 12;
    if (inputs.corridorState === "BLOCKED") score += 22;
    if (inputs.openOrchestrations > 2) score += 8;
    return Math.min(100, Math.round(score * m));
  }

  projectCollapsePropagation(inputs: SimulationCorridorInputs): CollapsePropagationProjection {
    const fragility = this.computeRiskScore({ ...inputs, stressMultiplier: 1.1 });
    const propagation =
      fragility * 0.45 +
      inputs.openIncidents * 6 +
      inputs.criticalAlerts * 8 +
      inputs.openTasks * 2;
    const collapsePropagationRisk = Math.min(100, Math.round(propagation));
    const stabilizationProbability = Math.max(0, Math.min(100, 100 - collapsePropagationRisk * 0.85));
    const recoveryComplexity = Math.min(
      100,
      Math.round(collapsePropagationRisk * 0.6 + inputs.openOrchestrations * 5 + inputs.openRecommendations * 2),
    );
    return {
      operationalFragility: fragility,
      collapsePropagationRisk,
      stabilizationProbability,
      recoveryComplexity,
    };
  }

  projectedCorridorState(current: string, riskScore: number): string {
    if (riskScore >= 85) return "BLOCKED";
    if (riskScore >= 65) return "DEGRADED";
    if (riskScore >= 45 && current === "ACTIVE") return "DEGRADED";
    return current;
  }
}
