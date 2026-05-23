import type { BackofficeErrorEvent } from "../types/error.types.js";
import type { BackofficeJourneyInstance } from "../types/journey.types.js";
import { detectBrokenJourneyPatterns } from "../journeys/broken-journey-detector.js";

export type ProductHealthReport = {
  errorRatePer100: number;
  brokenJourneyCount: number;
  abandonedCount: number;
  unstableModules: { module: string; count: number }[];
  problematicScreens: { screen: string; count: number }[];
  repeatedErrors: { errorType: string; count: number }[];
  degradedServices: string[];
  excessiveFallback: boolean;
  journeySuccessRate: number;
  actionableHints: string[];
};

export class BackofficeProductHealthEngine {
  compute(errors: BackofficeErrorEvent[], journeys: BackofficeJourneyInstance[]): ProductHealthReport {
    const broken = detectBrokenJourneyPatterns(journeys);
    const abandonedCount = journeys.filter((j) => j.status === "ABANDONED").length;
    const completed = journeys.filter((j) => j.status === "COMPLETED").length;
    const totalJ = journeys.length || 1;

    const byModule = new Map<string, number>();
    const byScreen = new Map<string, number>();
    const byType = new Map<string, number>();

    for (const e of errors) {
      if (e.module) byModule.set(e.module, (byModule.get(e.module) ?? 0) + 1);
      if (e.screen) byScreen.set(e.screen, (byScreen.get(e.screen) ?? 0) + 1);
      byType.set(e.errorType, (byType.get(e.errorType) ?? 0) + 1);
    }

    const sorted = (m: Map<string, number>) =>
      [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, count]) => ({ module: k, screen: k, count }));

    const repeatedErrors = [...byType.entries()]
      .filter(([, c]) => c >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([errorType, count]) => ({ errorType, count }));

    const degradedServices: string[] = [];
    if (byType.get("api_unavailable") && (byType.get("api_unavailable") ?? 0) > 5) {
      degradedServices.push("bff");
    }
    if (byType.get("offline_sync_error") && (byType.get("offline_sync_error") ?? 0) > 3) {
      degradedServices.push("offline_sync");
    }

    const hints: string[] = [];
    if (broken.some((b) => b.pattern === "stuck_journey")) {
      hints.push("Réduire friction aux étapes de connexion / OTP");
    }
    if (repeatedErrors.some((r) => r.errorType === "otp_invalid")) {
      hints.push("Revoir flux OTP et messages d'aide");
    }
    if (abandonedCount > completed) {
      hints.push("Parcours abandonnés > complétés — prioriser onboarding");
    }

    return {
      errorRatePer100: Math.round((errors.length / Math.max(totalJ, 1)) * 100),
      brokenJourneyCount: broken.length,
      abandonedCount,
      unstableModules: sorted(byModule).map(({ module, count }) => ({ module, count })),
      problematicScreens: sorted(byScreen).map(({ screen, count }) => ({ screen, count })),
      repeatedErrors,
      degradedServices,
      excessiveFallback: errors.filter((e) => e.errorType === "bff_error").length > 10,
      journeySuccessRate: Math.round((completed / totalJ) * 100),
      actionableHints: hints,
    };
  }
}

let engine: BackofficeProductHealthEngine | null = null;
export function getBackofficeProductHealthEngine(): BackofficeProductHealthEngine {
  if (!engine) engine = new BackofficeProductHealthEngine();
  return engine;
}
