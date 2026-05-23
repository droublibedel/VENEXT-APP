import { Injectable } from "@nestjs/common";

export const SOVEREIGNTY_CALIBRATION_V1 = "SOVEREIGNTY_CALIBRATION_V1" as const;

export type SovereigntyCalibrationProfile = "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";

export type SovereigntyAutonomyWeights = {
  incidentPerPoint: number;
  memoryPerPoint: number;
  macroDepMultiplier: number;
  supplyEdgeMultiplier: number;
  peerMultiplier: number;
  orchestrationPerPoint: number;
  dependencyConcentration: { macroDep: number; supplyEdge: number; peer: number; pressure: number };
  externalDependency: { supply: number; macroFragility: number; continuityInstability: number; orchestration: number };
  dependencyCriticality: { concentration: number; external: number; incident: number };
  autonomyScore: { continuity: number; macroResilience: number; memory: number; lowDepConc: number; lowExtDep: number };
  resilienceAutonomy: { autonomy: number; continuityStability: number; macroStability: number; memory: number };
  recoveryAutonomy: { resilience: number; continuityRecovery: number; lowCriticality: number };
  strategicCaptivity: { concentration: number; external: number; lowAutonomy: number };
  systemicRisk: { captivity: number; macroPropagation: number; orchestration: number };
  sovereigntyScore: { autonomy: number; resilience: number; lowSystemicRisk: number };
  selfRecovery: { sovereignty: number; recovery: number; continuityRecovery: number; systemicPenalty: number };
  exposureBlend: { concentration: number; external: number };
};

export type SovereigntyDependencyWeights = {
  concentrationBlend: number;
  macroDepBoost: number;
  memoryMitigation: number;
  captivityFromConcentration: number;
  captivityFromStrategic: number;
  recoveryPenaltyDivisor: number;
};

export type SovereigntyRecoveryWeights = {
  selfRecoveryFromAutonomy: number;
  exposureMitigation: number;
  depthPenalty: number;
  complexityFromTraversal: number;
  complexityFromCriticality: number;
  complexityFromCount: number;
  pressureFromCaptivity: number;
  pressureFromExposure: number;
};

export type SovereigntyCaptivityWeights = {
  criticalThreshold: number;
};

export type SovereigntyResilienceWeights = {
  projectionFromResilience: number;
  exposureMitigation: number;
  depthPenalty: number;
  pressureFromCaptivity: number;
  pressureFromExposure: number;
  pressureFromLowAutonomy: number;
  complexityFromTraversal: number;
  complexityFromCriticality: number;
};

export type SovereigntyCalibrationBundle = {
  calibrationVersion: typeof SOVEREIGNTY_CALIBRATION_V1;
  profile: SovereigntyCalibrationProfile;
  autonomyWeights: SovereigntyAutonomyWeights;
  dependencyWeights: SovereigntyDependencyWeights;
  recoveryWeights: SovereigntyRecoveryWeights;
  captivityWeights: SovereigntyCaptivityWeights;
  resilienceWeights: SovereigntyResilienceWeights;
};

const BALANCED: SovereigntyCalibrationBundle = {
  calibrationVersion: SOVEREIGNTY_CALIBRATION_V1,
  profile: "BALANCED",
  autonomyWeights: {
    incidentPerPoint: 10,
    memoryPerPoint: 7,
    macroDepMultiplier: 8,
    supplyEdgeMultiplier: 5,
    peerMultiplier: 3,
    orchestrationPerPoint: 9,
    dependencyConcentration: { macroDep: 0.35, supplyEdge: 0.3, peer: 0.2, pressure: 0.15 },
    externalDependency: { supply: 0.35, macroFragility: 0.25, continuityInstability: 0.25, orchestration: 0.15 },
    dependencyCriticality: { concentration: 0.5, external: 0.35, incident: 0.15 },
    autonomyScore: { continuity: 0.3, macroResilience: 0.25, memory: 0.2, lowDepConc: 0.15, lowExtDep: 0.1 },
    resilienceAutonomy: { autonomy: 0.4, continuityStability: 0.25, macroStability: 0.2, memory: 0.15 },
    recoveryAutonomy: { resilience: 0.45, continuityRecovery: 0.35, lowCriticality: 0.2 },
    strategicCaptivity: { concentration: 0.4, external: 0.35, lowAutonomy: 0.25 },
    systemicRisk: { captivity: 0.45, macroPropagation: 0.3, orchestration: 0.25 },
    sovereigntyScore: { autonomy: 0.4, resilience: 0.35, lowSystemicRisk: 0.25 },
    selfRecovery: { sovereignty: 1 / 120, recovery: 1 / 200, continuityRecovery: 0.25, systemicPenalty: 1 / 220 },
    exposureBlend: { concentration: 0.5, external: 0.5 },
  },
  dependencyWeights: {
    concentrationBlend: 0.85,
    macroDepBoost: 2,
    memoryMitigation: 0.3,
    captivityFromConcentration: 0.65,
    captivityFromStrategic: 0.35,
    recoveryPenaltyDivisor: 250,
  },
  recoveryWeights: {
    selfRecoveryFromAutonomy: 0.75,
    exposureMitigation: 0.15,
    depthPenalty: 1 / 90,
    complexityFromTraversal: 0.5,
    complexityFromCriticality: 0.35,
    complexityFromCount: 0.5,
    pressureFromCaptivity: 0.45,
    pressureFromExposure: 0.35,
  },
  captivityWeights: { criticalThreshold: 55 },
  resilienceWeights: {
    projectionFromResilience: 0.6,
    exposureMitigation: 0.25,
    depthPenalty: 3,
    pressureFromCaptivity: 0.4,
    pressureFromExposure: 0.35,
    pressureFromLowAutonomy: 0.25,
    complexityFromTraversal: 0.55,
    complexityFromCriticality: 0.45,
  },
};

const CONSERVATIVE: SovereigntyCalibrationBundle = {
  ...BALANCED,
  profile: "CONSERVATIVE",
  autonomyWeights: {
    ...BALANCED.autonomyWeights,
    dependencyConcentration: { macroDep: 0.4, supplyEdge: 0.32, peer: 0.18, pressure: 0.1 },
    externalDependency: { supply: 0.38, macroFragility: 0.28, continuityInstability: 0.24, orchestration: 0.1 },
    strategicCaptivity: { concentration: 0.45, external: 0.38, lowAutonomy: 0.28 },
    systemicRisk: { captivity: 0.5, macroPropagation: 0.32, orchestration: 0.18 },
  },
  dependencyWeights: {
    ...BALANCED.dependencyWeights,
    captivityFromConcentration: 0.7,
    captivityFromStrategic: 0.4,
    recoveryPenaltyDivisor: 220,
  },
};

const AGGRESSIVE: SovereigntyCalibrationBundle = {
  ...BALANCED,
  profile: "AGGRESSIVE",
  autonomyWeights: {
    ...BALANCED.autonomyWeights,
    dependencyConcentration: { macroDep: 0.3, supplyEdge: 0.28, peer: 0.22, pressure: 0.2 },
    externalDependency: { supply: 0.32, macroFragility: 0.22, continuityInstability: 0.26, orchestration: 0.2 },
    autonomyScore: { continuity: 0.34, macroResilience: 0.28, memory: 0.18, lowDepConc: 0.12, lowExtDep: 0.08 },
    strategicCaptivity: { concentration: 0.35, external: 0.32, lowAutonomy: 0.22 },
    systemicRisk: { captivity: 0.4, macroPropagation: 0.28, orchestration: 0.32 },
  },
  dependencyWeights: {
    ...BALANCED.dependencyWeights,
    captivityFromConcentration: 0.58,
    captivityFromStrategic: 0.3,
    recoveryPenaltyDivisor: 280,
  },
};

@Injectable()
export class RelationalEconomicSovereigntyCalibrationService {
  resolveProfile(): SovereigntyCalibrationProfile {
    const raw = (process.env.VENEXT_SOVEREIGNTY_CALIBRATION_PROFILE ?? "BALANCED").toUpperCase();
    if (raw === "CONSERVATIVE" || raw === "AGGRESSIVE") return raw;
    return "BALANCED";
  }

  getCalibration(): SovereigntyCalibrationBundle {
    const profile = this.resolveProfile();
    if (profile === "CONSERVATIVE") return CONSERVATIVE;
    if (profile === "AGGRESSIVE") return AGGRESSIVE;
    return BALANCED;
  }

  confidenceLevel(input: {
    heuristicFallbackUsed: boolean;
    sourceCounts: number;
    calibrationProfile: SovereigntyCalibrationProfile;
  }): "LOW" | "MEDIUM" | "HIGH" {
    if (input.heuristicFallbackUsed) return "LOW";
    if (input.sourceCounts < 3) return "MEDIUM";
    if (input.calibrationProfile === "CONSERVATIVE") return "MEDIUM";
    return "HIGH";
  }

  buildScoreContributors(weights: SovereigntyAutonomyWeights): Record<string, number> {
    return {
      dependencyConcentration_macroDep: weights.dependencyConcentration.macroDep,
      dependencyConcentration_supplyEdge: weights.dependencyConcentration.supplyEdge,
      externalDependency_supply: weights.externalDependency.supply,
      autonomyScore_continuity: weights.autonomyScore.continuity,
      strategicCaptivity_concentration: weights.strategicCaptivity.concentration,
    };
  }
}
