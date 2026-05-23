import { Injectable } from "@nestjs/common";
import type {
  RelationalOperationalRecommendationSeverity,
  RelationalOperationalRecommendationSource,
  RelationalOperationalRecommendationType,
} from "@prisma/client";

export const RECOMMENDATION_ENGINE_THRESHOLDS = {
  cooldownHours: Number(process.env.VENEXT_RECOMMENDATION_COOLDOWN_HOURS ?? 24),
  maxActivePerRelationship: Number(process.env.VENEXT_RECOMMENDATION_MAX_ACTIVE ?? 25),
  expirationDays: Number(process.env.VENEXT_RECOMMENDATION_EXPIRATION_DAYS ?? 14),
  coordinationOverloadTasks: Number(process.env.VENEXT_RECOMMENDATION_COORDINATION_OVERLOAD ?? 5),
  blockingIncidentsCount: Number(process.env.VENEXT_RECOMMENDATION_BLOCKING_INCIDENTS ?? 2),
  collapseRiskThreshold: Number(process.env.VENEXT_RECOMMENDATION_COLLAPSE_THRESHOLD ?? 70),
  predictiveHighScore: Number(process.env.VENEXT_RECOMMENDATION_PREDICTIVE_HIGH ?? 60),
} as const;

export type RecommendationCandidate = {
  code: string;
  type: RelationalOperationalRecommendationType;
  source: RelationalOperationalRecommendationSource;
  severity: RelationalOperationalRecommendationSeverity;
  title: string;
  description: string;
  score: number;
  confidence: number;
  diagnostics?: Record<string, unknown>;
};

@Injectable()
export class RelationalOperationalRecommendationPolicyService {
  clampScore(score: number): number {
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  clampConfidence(confidence: number): number {
    return Math.min(100, Math.max(0, Math.round(confidence)));
  }

  severityFromScore(score: number): RelationalOperationalRecommendationSeverity {
    if (score >= 85) return "CRITICAL";
    if (score >= 65) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }

  buildCode(type: RelationalOperationalRecommendationType, relationshipId: string, suffix?: string): string {
    const base = `${type}:${relationshipId.slice(0, 8)}`;
    return suffix ? `${base}:${suffix}` : base;
  }

  isWithinCooldown(lastCreatedAt: Date | null, now: Date): boolean {
    if (!lastCreatedAt) return false;
    const ms = RECOMMENDATION_ENGINE_THRESHOLDS.cooldownHours * 60 * 60 * 1000;
    return now.getTime() - lastCreatedAt.getTime() < ms;
  }

  prioritize(candidates: RecommendationCandidate[]): RecommendationCandidate[] {
    return [...candidates].sort((a, b) => {
      const sev = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const ds = sev[b.severity] - sev[a.severity];
      if (ds !== 0) return ds;
      return b.score - a.score;
    });
  }
}
