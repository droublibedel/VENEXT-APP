/**
 * Instruction 20.20 — command center policy (bounded deterministic scores).
 */
import { Injectable } from "@nestjs/common";

@Injectable()
export class RelationalEconomicCommandPolicyService {
  clampInt(n: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  severityFromRiskScore(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    if (score >= 85) return "CRITICAL";
    if (score >= 65) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }

  controlPriorityFromRisk(score: number): "LOW" | "NORMAL" | "HIGH" | "CRITICAL" {
    if (score >= 85) return "CRITICAL";
    if (score >= 70) return "HIGH";
    if (score >= 45) return "NORMAL";
    return "LOW";
  }

  healthFromStress(stress: number): number {
    return this.clampInt(100 - stress);
  }

  canMutateCommandSnapshot(corridorState: string): boolean {
    return corridorState !== "TERMINATED";
  }
}
