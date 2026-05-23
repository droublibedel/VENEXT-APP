import {
  buildCommerceNavigationConsistency,
  maxPanelsForPlatform,
} from "commerce-foundation-guardrails";
import type { CommerceUxPlatform } from "./commerce-ux-harmony.types";

export function evaluateNavigationHarmony(input: {
  platform: CommerceUxPlatform;
  depth: number;
  modalCount?: number;
  hasQuickReturn?: boolean;
}): { ok: boolean; maxDepth: number; hints: string[] } {
  const maxDepth = 2;
  const nav = buildCommerceNavigationConsistency({
    activePrimaryPanel: "primary",
    depth: input.depth,
    hasQuickReturn: input.hasQuickReturn ?? true,
    modalCount: input.modalCount ?? 0,
    tunnelSteps: 0,
  });
  const maxPanels = maxPanelsForPlatform(input.platform === "mobile" ? "mobile" : "web");
  const hints = [...nav.recommendations];
  if (input.depth > maxDepth) hints.push("Réduire la profondeur de navigation (max 2).");
  if (input.modalCount && input.modalCount > 1) hints.push("Éviter les modals empilées.");
  return {
    ok: nav.ok && input.depth <= maxDepth,
    maxDepth,
    hints,
  };
}

export function maxQuickActionsForPlatform(platform: CommerceUxPlatform): number {
  return platform === "mobile" ? 5 : 8;
}
