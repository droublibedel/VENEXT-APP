import { evaluateCommerceUxSurface } from "commerce-foundation-guardrails";

import type { CommerceUxPlatform } from "./commerce-ux-harmony.types";
import { maxQuickActionsForPlatform } from "./commerce-ux-navigation-rules";

export const MOBILE_MIN_TOUCH_PX = 44;

export function evaluateMobileSurfaceHarmony(input: {
  quickActionCount: number;
  panelCount: number;
  platform?: CommerceUxPlatform;
}): { ok: boolean; hints: string[] } {
  const platform = input.platform ?? "mobile";
  const ux = evaluateCommerceUxSurface({
    panelCount: input.panelCount,
    quickActionCount: input.quickActionCount,
    timelineStepCount: 4,
    formFieldCount: 6,
    navigationDepth: 1,
    modalCount: 0,
  });
  const hints = [...ux.hints];
  if (input.quickActionCount > maxQuickActionsForPlatform(platform)) {
    hints.push(`Limiter à ${maxQuickActionsForPlatform(platform)} actions visibles.`);
  }
  return { ok: ux.acceptable && input.quickActionCount <= maxQuickActionsForPlatform(platform), hints };
}

export function mobileButtonStyle(): Record<string, string | number> {
  return {
    minHeight: MOBILE_MIN_TOUCH_PX,
    minWidth: MOBILE_MIN_TOUCH_PX,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
  };
}
