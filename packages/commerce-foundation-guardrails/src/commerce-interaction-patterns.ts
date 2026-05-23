import type { CommerceFoundationFlags } from "./commerce-foundation-philosophy.guard";

export type CommerceQuickActionPattern = {
  id: string;
  label: string;
  variant: "primary" | "secondary" | "link";
  inline: boolean;
};

export type CommerceInteractionSurface = {
  quickActions: CommerceQuickActionPattern[];
  timelineActions: boolean;
  partnerCard: boolean;
  activityStrip: boolean;
  confirmationInline: boolean;
};

const BASE_QUICK_ACTION: Omit<CommerceQuickActionPattern, "id" | "label"> = {
  variant: "secondary",
  inline: true,
};

export function normalizeQuickAction(
  id: string,
  label: string,
  variant: "primary" | "secondary" | "link" = "secondary",
): CommerceQuickActionPattern {
  return { ...BASE_QUICK_ACTION, id, label, variant, inline: true };
}

export function buildStandardCommerceInteractionSurface(
  actions: { id: string; label: string }[],
  flags: CommerceFoundationFlags = {},
): CommerceInteractionSurface {
  const enabled = flags.commerce_foundation_guardrails_enabled !== false;
  const capped = enabled ? actions.slice(0, 8) : actions;

  return {
    quickActions: capped.map((a, i) =>
      normalizeQuickAction(a.id, a.label, i === 0 ? "primary" : "secondary"),
    ),
    timelineActions: true,
    partnerCard: true,
    activityStrip: true,
    confirmationInline: true,
  };
}

export function interactionPatternTestIds(prefix: string): Record<string, string> {
  return {
    quickActions: `${prefix}-quick-actions`,
    timeline: `${prefix}-timeline`,
    partnerCard: `${prefix}-partner-card`,
    mobileSummary: `${prefix}-mobile-summary`,
    activityFeed: `${prefix}-activity-feed`,
  };
}

export function assertInlineConfirmationOnly(useModal: boolean): boolean {
  return !useModal;
}
