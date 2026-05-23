/**
 * Instruction 20.21 — deterministic thresholds for economic pressure mapping.
 */
import { Injectable } from "@nestjs/common";

@Injectable()
export class RelationalEconomicPressurePolicyService {
  clampInt(n: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  severityFromScore(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    if (score >= 85) return "CRITICAL";
    if (score >= 65) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }

  canMutateEconomicPressureGraph(corridorState: string): boolean {
    return corridorState !== "TERMINATED";
  }

  maxContagionDepth(): number {
    const raw = Number(process.env.VENEXT_ECONOMIC_PRESSURE_MAX_DEPTH ?? 6);
    if (!Number.isFinite(raw) || raw < 1) return 6;
    return Math.min(24, Math.max(1, Math.floor(raw)));
  }
}
