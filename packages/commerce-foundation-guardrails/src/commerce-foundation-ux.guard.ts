import { buildCommerceNavigationConsistency } from "./commerce-foundation-navigation.guard";
import type { CommerceFoundationFlags } from "./commerce-foundation-philosophy.guard";
import { buildCommerceComplexityScore } from "./commerce-foundation-complexity.guard";

export type CommerceUxSurfaceInput = {
  panelCount: number;
  quickActionCount: number;
  timelineStepCount: number;
  formFieldCount: number;
  modalCount?: number;
  navigationDepth?: number;
};

export type CommerceUxGuardResult = {
  acceptable: boolean;
  complexityScore: number;
  navigationOk: boolean;
  hints: string[];
};

export function evaluateCommerceUxSurface(
  input: CommerceUxSurfaceInput,
  flags: CommerceFoundationFlags = {},
): CommerceUxGuardResult {
  const complexity = buildCommerceComplexityScore(input);
  const nav = buildCommerceNavigationConsistency(
    {
      activePrimaryPanel: "primary",
      depth: input.navigationDepth ?? 1,
      hasQuickReturn: true,
      modalCount: input.modalCount ?? 0,
      tunnelSteps: 0,
    },
    flags,
  );

  const hints: string[] = [];
  if (complexity.level === "high") {
    hints.push("Réduire panneaux ou actions — garder la surface légère.");
  }
  if (!nav.ok) {
    hints.push(...nav.recommendations);
  }

  return {
    acceptable: complexity.level !== "high" && nav.ok,
    complexityScore: complexity.score,
    navigationOk: nav.ok,
    hints,
  };
}

export function maxPanelsForPlatform(platform: "web" | "mobile"): number {
  return platform === "mobile" ? 2 : 4;
}

export function assertUxNotAdministrative(testId: string | undefined): boolean {
  if (!testId) return true;
  return !["admin-form", "erp-workflow", "multi-step-wizard"].some((f) => testId.includes(f));
}
