import { hasExploitableLocation, wasSoftLocationPromptDismissed } from "./commercial-location-storage.js";

export function shouldShowSoftLocationPrompt(
  actorId: string,
  opts: { onboardingDone: boolean; sessionCount: number; sessionKey: string; hasOnboardingCity?: boolean },
): boolean {
  if (!opts.onboardingDone) return false;
  if (opts.hasOnboardingCity) return false;
  if (hasExploitableLocation(actorId)) return false;
  if (wasSoftLocationPromptDismissed(actorId, opts.sessionKey)) return false;
  return opts.sessionCount >= 1;
}

export function shouldShowTransientLocationHint(
  actorId: string,
  opts: { onboardingDone: boolean; sessionCount: number; sessionKey: string; hasOnboardingCity?: boolean },
): boolean {
  if (!opts.onboardingDone) return false;
  if (opts.hasOnboardingCity || hasExploitableLocation(actorId)) return false;
  if (wasSoftLocationPromptDismissed(actorId, opts.sessionKey)) return false;
  return opts.sessionCount >= 1;
}
