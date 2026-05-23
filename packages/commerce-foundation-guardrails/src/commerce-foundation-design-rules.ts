import type { CommercePlatform } from "./commerce-platform-consistency.guard";

export type CommerceDesignTokens = {
  spacingUnit: number;
  panelGap: number;
  cardPadding: number;
  titleSize: string;
  bodySize: string;
  hintSize: string;
  chipRadius: string;
  timelineDotSize: number;
};

const WEB_TOKENS: CommerceDesignTokens = {
  spacingUnit: 12,
  panelGap: 12,
  cardPadding: 12,
  titleSize: "16px",
  bodySize: "12px",
  hintSize: "11px",
  chipRadius: "10px",
  timelineDotSize: 8,
};

const MOBILE_TOKENS: CommerceDesignTokens = {
  spacingUnit: 8,
  panelGap: 8,
  cardPadding: 10,
  titleSize: "15px",
  bodySize: "13px",
  hintSize: "11px",
  chipRadius: "10px",
  timelineDotSize: 8,
};

export function resolveCommerceDesignTokens(platform: CommercePlatform): CommerceDesignTokens {
  return platform === "mobile" ? MOBILE_TOKENS : WEB_TOKENS;
}

export function panelDensityClass(platform: CommercePlatform): string {
  return platform === "mobile" ? "cdf-density-compact" : "cdf-density-comfortable";
}

export function commerceFoundationCssVariables(platform: CommercePlatform): Record<string, string> {
  const t = resolveCommerceDesignTokens(platform);
  return {
    "--commerce-spacing": `${t.spacingUnit}px`,
    "--commerce-panel-gap": `${t.panelGap}px`,
    "--commerce-card-padding": `${t.cardPadding}px`,
    "--commerce-title-size": t.titleSize,
    "--commerce-body-size": t.bodySize,
    "--commerce-hint-size": t.hintSize,
    "--commerce-chip-radius": t.chipRadius,
  };
}

export function designRulesSummary(): string[] {
  return [
    "Spacing cohérent entre modules commerce",
    "Hiérarchie carte partenaire > statut > actions",
    "Timelines légères — pas de Gantt logistique",
    "Actions inline — pas de modals lourds",
  ];
}
