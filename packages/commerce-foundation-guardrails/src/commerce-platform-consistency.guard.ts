import type { CommerceActorRole } from "./commerce-foundation-philosophy.guard";
import { resolveCommerceActorKind } from "./commerce-foundation-philosophy.guard";
import { maxPanelsForPlatform } from "./commerce-foundation-ux.guard";

export type CommercePlatform = "web" | "mobile";

export type PlatformConsistencyInput = {
  platform: CommercePlatform;
  role: CommerceActorRole;
  panelCount: number;
  hasMobileSummary: boolean;
  quickActionCount: number;
};

export function resolveExpectedPlatform(role: CommerceActorRole): CommercePlatform {
  return resolveCommerceActorKind(role) === "terrain" ? "mobile" : "web";
}

export function evaluatePlatformConsistency(input: PlatformConsistencyInput): {
  ok: boolean;
  notes: string[];
} {
  const notes: string[] = [];
  const maxPanels = maxPanelsForPlatform(input.platform);

  if (input.panelCount > maxPanels) {
    notes.push(`Trop de panneaux pour ${input.platform} (max ${maxPanels}).`);
  }

  if (input.platform === "mobile" && resolveCommerceActorKind(input.role) === "terrain") {
    if (!input.hasMobileSummary) {
      notes.push("Résumé mobile terrain recommandé.");
    }
    if (input.quickActionCount > 6) {
      notes.push("Limiter les actions rapides sur mobile terrain.");
    }
  }

  if (input.platform === "web" && input.panelCount < 1) {
    notes.push("Surface web structurée attendue.");
  }

  return { ok: notes.length === 0, notes };
}

export function platformDensityLabel(platform: CommercePlatform): string {
  return platform === "mobile" ? "terrain-rapide" : "professionnel-structuré";
}
