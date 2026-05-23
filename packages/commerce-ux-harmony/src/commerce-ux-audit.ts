import { commerceFoundationCssVariables } from "commerce-foundation-guardrails";

import { getEmptyStateMessage } from "./commerce-ux-empty-messages";
import { getErrorStateMessage } from "./commerce-ux-error-messages";
import type {
  CommerceEmptyStateKey,
  CommerceErrorStateKey,
  CommerceUxActorKind,
  CommerceUxHarmonyFlags,
  CommerceUxPlatform,
} from "./commerce-ux-harmony.types";
import { evaluateMobileSurfaceHarmony } from "./commerce-ux-mobile-rules";
import { evaluateNavigationHarmony } from "./commerce-ux-navigation-rules";
import { auditVisibleCopy } from "./commerce-ux-wording-audit";

export function isCommerceUxHarmonyEnabled(flags: CommerceUxHarmonyFlags): boolean {
  return flags.commerce_ux_harmony_enabled !== false;
}

export function runCommerceUxHarmonyAudit(input: {
  platform: CommerceUxPlatform;
  actorKind: CommerceUxActorKind;
  locale?: string;
  depth: number;
  quickActionCount: number;
  panelCount: number;
  visibleLabels: string[];
  flags?: CommerceUxHarmonyFlags;
}): {
  ok: boolean;
  cssVariables: Record<string, string>;
  navigation: ReturnType<typeof evaluateNavigationHarmony>;
  mobile: ReturnType<typeof evaluateMobileSurfaceHarmony>;
  wording: { ok: boolean; issues: string[] }[];
} {
  const navigation = evaluateNavigationHarmony({
    platform: input.platform,
    depth: input.depth,
    hasQuickReturn: true,
  });
  const mobile = evaluateMobileSurfaceHarmony({
    platform: input.platform,
    quickActionCount: input.quickActionCount,
    panelCount: input.panelCount,
  });
  const wording = input.visibleLabels.map((label) => ({
    ...auditVisibleCopy(label),
    label,
  }));
  const wordingOk = wording.every((w) => w.ok);
  return {
    ok: navigation.ok && mobile.ok && wordingOk,
    cssVariables: commerceFoundationCssVariables(input.platform === "mobile" ? "mobile" : "web"),
    navigation,
    mobile,
    wording,
  };
}

export function resolveEmptyState(
  key: CommerceEmptyStateKey,
  locale?: string,
  actorKind?: CommerceUxActorKind,
): { title: string; hint?: string } {
  return {
    title: getEmptyStateMessage(key, locale, actorKind),
    hint:
      key === "offline"
        ? getEmptyStateMessage("generic", locale, actorKind)
        : undefined,
  };
}

export function resolveErrorState(
  key: CommerceErrorStateKey,
  locale?: string,
): { title: string } {
  return { title: getErrorStateMessage(key, locale) };
}
