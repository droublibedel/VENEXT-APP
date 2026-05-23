import { Injectable } from "@nestjs/common";
import type {
  RelationalStrategicMemorySeverity,
  RelationalStrategicMemoryStatus,
  RelationalStrategicMemoryType,
} from "@prisma/client";

export const STRATEGIC_MEMORY_ENGINE_THRESHOLDS = {
  minConfidenceForReuse: Number(process.env.VENEXT_STRATEGIC_MEMORY_MIN_CONFIDENCE ?? 40),
  maxRecentFailures: Number(process.env.VENEXT_STRATEGIC_MEMORY_MAX_FAILURES ?? 3),
  expirationDays: Number(process.env.VENEXT_STRATEGIC_MEMORY_EXPIRATION_DAYS ?? 365),
  patternRepeatThreshold: Number(process.env.VENEXT_STRATEGIC_MEMORY_PATTERN_REPEAT ?? 2),
} as const;

const BLOCKED_CREATION_CORRIDOR = ["TERMINATED"] as const;
const TERMINAL_MEMORY: RelationalStrategicMemoryStatus[] = ["INVALIDATED", "EXPIRED"];

export type StrategicMemoryPolicyContext = {
  memoryStatus: RelationalStrategicMemoryStatus;
  corridorState: string;
  confidenceLevel: number;
  failedReuseCount: number;
  reuseCount: number;
  hasCoherentSource: boolean;
  observedPattern: string;
};

export type DetectedOperationalPattern = {
  patternCode: string;
  memoryType: RelationalStrategicMemoryType;
  severity: RelationalStrategicMemorySeverity;
  title: string;
  observedPattern: string;
  strategicSummary: string;
  recoveryStrategy: string;
  confidenceLevel: number;
};

@Injectable()
export class RelationalStrategicMemoryPolicyService {
  isTerminalStatus(status: RelationalStrategicMemoryStatus): boolean {
    return TERMINAL_MEMORY.includes(status);
  }

  canActivateMemory(ctx: StrategicMemoryPolicyContext): boolean {
    if (BLOCKED_CREATION_CORRIDOR.includes(ctx.corridorState as (typeof BLOCKED_CREATION_CORRIDOR)[number])) {
      return false;
    }
    if (!ctx.hasCoherentSource) return false;
    if (!ctx.observedPattern.trim()) return false;
    return true;
  }

  assertCanReuse(ctx: StrategicMemoryPolicyContext): void {
    if (ctx.memoryStatus === "INVALIDATED") throw new Error("strategic_memory_invalidated");
    if (ctx.corridorState === "TERMINATED") throw new Error("strategic_memory_corridor_terminated");
    if (ctx.confidenceLevel < STRATEGIC_MEMORY_ENGINE_THRESHOLDS.minConfidenceForReuse) {
      throw new Error("strategic_memory_low_confidence");
    }
    if (ctx.failedReuseCount >= STRATEGIC_MEMORY_ENGINE_THRESHOLDS.maxRecentFailures) {
      throw new Error("strategic_memory_too_many_failures");
    }
  }

  buildMemoryCode(type: RelationalStrategicMemoryType, relationshipId: string, suffix: string): string {
    return `${type}:${relationshipId.slice(0, 8)}:${suffix}`;
  }

  initialConfidenceFromSeverity(severity: RelationalStrategicMemorySeverity): number {
    if (severity === "CRITICAL") return 85;
    if (severity === "HIGH") return 72;
    if (severity === "MEDIUM") return 58;
    return 45;
  }

  evolveConfidence(current: number, successful: boolean): number {
    const delta = successful ? 5 : -12;
    return Math.max(0, Math.min(100, current + delta));
  }

  mapReviewToMemoryType(decisionType: string): RelationalStrategicMemoryType {
    if (decisionType.includes("GOVERNANCE")) return "GOVERNANCE_ACTION";
    if (decisionType.includes("RECOVERY")) return "COLLAPSE_PREVENTION";
    return "HUMAN_DECISION_PATTERN";
  }

  detectRecurringPatterns(input: {
    openIncidents: number;
    slaAlerts: number;
    completedOrchestrations: number;
    approvedReviews: number;
    collapseRecoveries: number;
  }): DetectedOperationalPattern[] {
    const patterns: DetectedOperationalPattern[] = [];
    const t = STRATEGIC_MEMORY_ENGINE_THRESHOLDS.patternRepeatThreshold;

    if (input.openIncidents >= t) {
      patterns.push({
        patternCode: "RECURRING_INCIDENTS",
        memoryType: "INCIDENT_RESOLUTION",
        severity: "HIGH",
        title: "Incidents fulfillment récurrents",
        observedPattern: `${input.openIncidents} incidents ouverts — pattern opérationnel répété`,
        strategicSummary: "Capitaliser résolutions incidents efficaces pour stabiliser corridor.",
        recoveryStrategy: "Containment incidents + validation humaine avant reprise.",
        confidenceLevel: 70,
      });
    }
    if (input.slaAlerts >= t) {
      patterns.push({
        patternCode: "RECURRING_SLA_DRIFT",
        memoryType: "SLA_RECOVERY",
        severity: "MEDIUM",
        title: "Dérive SLA récurrente",
        observedPattern: `${input.slaAlerts} alertes SLA actives`,
        strategicSummary: "Mémoriser séquences SLA efficaces pour réutilisation orchestration.",
        recoveryStrategy: "Stabilisation SLA déterministe — pas exécution commerce auto.",
        confidenceLevel: 65,
      });
    }
    if (input.completedOrchestrations >= t) {
      patterns.push({
        patternCode: "EFFECTIVE_ORCHESTRATION",
        memoryType: "OPERATIONAL_PATTERN",
        severity: "MEDIUM",
        title: "Orchestrations efficaces répétées",
        observedPattern: `${input.completedOrchestrations} orchestrations complétées récemment`,
        strategicSummary: "Réutiliser plans séquencés ayant stabilisé le corridor.",
        recoveryStrategy: "Rejouer étapes bloquantes en mode brouillon contrôlé.",
        confidenceLevel: 68,
      });
    }
    if (input.collapseRecoveries >= 1) {
      patterns.push({
        patternCode: "COLLAPSE_RECOVERY_SUCCESS",
        memoryType: "COLLAPSE_PREVENTION",
        severity: "CRITICAL",
        title: "Récupération effondrement documentée",
        observedPattern: "Récupération collapse corridor validée humainement",
        strategicSummary: "Capitaliser séquence anti-effondrement pour futurs stress tests.",
        recoveryStrategy: "Revue gouvernance + orchestration WAITING_VALIDATION.",
        confidenceLevel: 80,
      });
    }
    if (input.approvedReviews >= t) {
      patterns.push({
        patternCode: "HUMAN_DECISION_CONSISTENCY",
        memoryType: "HUMAN_DECISION_PATTERN",
        severity: "HIGH",
        title: "Décisions humaines cohérentes",
        observedPattern: `${input.approvedReviews} revues approuvées — continuité décisionnelle`,
        strategicSummary: "Mémoriser critères d'approbation corridor pour cohérence future.",
        recoveryStrategy: "Aligner simulations et recommandations sur décisions passées.",
        confidenceLevel: 75,
      });
    }
    return patterns;
  }
}
