import type { CommerceFoundationFlags } from "./commerce-foundation-philosophy.guard";

export type CommerceNavigationContext = {
  activePrimaryPanel: string;
  secondaryContext?: string | null;
  depth?: number;
  hasQuickReturn?: boolean;
  modalCount?: number;
  tunnelSteps?: number;
};

export type CommerceNavigationConsistency = {
  ok: boolean;
  violations: string[];
  recommendations: string[];
};

const MAX_DEPTH = 2;
const MAX_MODALS = 0;
const MAX_TUNNEL = 0;

export function isCommerceNavigationConsistencyEnabled(
  flags: CommerceFoundationFlags = {},
): boolean {
  return flags.commerce_navigation_consistency_enabled !== false;
}

export function buildCommerceNavigationConsistency(
  ctx: CommerceNavigationContext,
  flags: CommerceFoundationFlags = {},
): CommerceNavigationConsistency {
  const violations: string[] = [];
  const recommendations: string[] = [];

  if (!isCommerceNavigationConsistencyEnabled(flags)) {
    return { ok: true, violations, recommendations };
  }

  if (!ctx.activePrimaryPanel?.trim()) {
    violations.push("missing-primary-panel");
  }

  const depth = ctx.depth ?? (ctx.secondaryContext ? 2 : 1);
  if (depth > MAX_DEPTH) {
    violations.push("navigation-too-deep");
    recommendations.push("Limiter à un panneau principal et un contexte secondaire maximum.");
  }

  if ((ctx.modalCount ?? 0) > MAX_MODALS) {
    violations.push("heavy-modals");
    recommendations.push("Préférer panneaux inline — pas de modals lourds.");
  }

  if ((ctx.tunnelSteps ?? 0) > MAX_TUNNEL) {
    violations.push("workflow-tunnel");
    recommendations.push("Éviter les tunnels administratifs — actions rapides inline.");
  }

  if (ctx.hasQuickReturn === false && depth > 1) {
    violations.push("missing-quick-return");
    recommendations.push("Retour rapide obligatoire vers le fil commercial.");
  }

  return {
    ok: violations.length === 0,
    violations,
    recommendations,
  };
}

export function assertSingleActivePanel(panelIds: string[]): boolean {
  const active = panelIds.filter(Boolean);
  return active.length <= 1;
}

export function mergeCommerceNavigationContext(
  primary: string,
  secondary?: string | null,
): CommerceNavigationContext {
  return {
    activePrimaryPanel: primary,
    secondaryContext: secondary ?? null,
    depth: secondary ? 2 : 1,
    hasQuickReturn: true,
    modalCount: 0,
    tunnelSteps: 0,
  };
}
