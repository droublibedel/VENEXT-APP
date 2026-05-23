/**
 * Instruction 16A — shared signal ranking weights for industrial intervention surfaces.
 * Callers supply pre-computed 0–1 (or urgency 1–4) components; pole-specific business rules stay upstream.
 */

export type InterventionSignalRankingComponents = {
  urgencyScore: number;
  impactScore: number;
  confidenceScore: number;
  signalStrengthScore: number;
  territoryFactor: number;
};

const W = { u: 0.28, i: 0.22, c: 0.2, s: 0.18, t: 0.12 };

export function urgencyScoreFromLevels(level: "low" | "medium" | "high" | "critical"): number {
  switch (level) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

export function impactScoreFromTextLength(length: number, denom: number): number {
  return Math.min(1, length / denom);
}

export function signalStrengthScoreFromCount(count: number, denom: number): number {
  return Math.min(1, count / denom);
}

export function territoryFactorFromCount(count: number, denom: number): number {
  return Math.min(1, count / denom);
}

/** Maps finance-style urgency in [0,1] onto ~1–4 scale for the shared weighting. */
export function urgencyScoreFrom01(urgency01: number): number {
  const u = Math.min(1, Math.max(0, urgency01));
  return Number((1 + u * 3).toFixed(4));
}

export function rankInterventionBySignalScore(
  p: InterventionSignalRankingComponents,
): InterventionSignalRankingComponents & { finalScore: number } {
  const finalScore = Number(
    (p.urgencyScore * W.u + p.impactScore * W.i + p.confidenceScore * W.c + p.signalStrengthScore * W.s + p.territoryFactor * W.t).toFixed(4),
  );
  return {
    urgencyScore: p.urgencyScore,
    impactScore: Number(p.impactScore.toFixed(3)),
    confidenceScore: Number(p.confidenceScore.toFixed(3)),
    signalStrengthScore: Number(p.signalStrengthScore.toFixed(3)),
    territoryFactor: Number(p.territoryFactor.toFixed(3)),
    finalScore,
  };
}
