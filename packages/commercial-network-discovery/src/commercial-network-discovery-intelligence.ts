import type { CommercialContactSuggestion, CommercialDiscoveryView } from "./commercial-network-discovery.types";

export type CommercialDiscoveryHint = { id: string; text: string };

const FORBIDDEN =
  /chatbot|assistant ia|observatory|scoring|compatibilité|fintech|websocket|llm|erp|marketplace|followers|likes/i;

export function sanitizeCommercialDiscoveryText(text: string): string {
  if (FORBIDDEN.test(text)) return "Signal utile pour votre réseau commercial.";
  return text;
}

export function buildCommercialContactSignals(
  suggestions: CommercialContactSuggestion[],
): CommercialDiscoveryHint[] {
  const hints: CommercialDiscoveryHint[] = [];
  const mutual = suggestions.filter((s) => s.matchKind === "mutual");
  if (mutual.length) {
    hints.push({
      id: "ccs-mutual",
      text: sanitizeCommercialDiscoveryText(
        `${mutual.length} contact(s) commercial(aux) probable(s) — numéros enregistrés des deux côtés.`,
      ),
    });
  }
  const boosted = suggestions.filter((s) => s.matchKind === "activity_boosted");
  if (boosted.length) {
    hints.push({
      id: "ccs-activity",
      text: sanitizeCommercialDiscoveryText("Activité réseau détectée sur des contacts proches."),
    });
  }
  return hints.slice(0, 2);
}

export function buildCommercialDiscoveryHints(
  view: CommercialDiscoveryView | null,
): CommercialDiscoveryHint[] {
  if (!view) return [];
  const hints = buildCommercialContactSignals(view.suggestions);
  if (view.suggestions.some((s) => s.sameCorridor)) {
    hints.push({
      id: "cdh-corridor",
      text: sanitizeCommercialDiscoveryText("Grossiste actif dans votre zone."),
    });
  }
  return hints.slice(0, 3);
}

export function buildCommercialRelationshipHints(
  view: CommercialDiscoveryView | null,
): CommercialDiscoveryHint[] {
  if (!view) return [];
  return [
    {
      id: "crh-probable",
      text: sanitizeCommercialDiscoveryText("Relation commerciale probable — réseau terrain."),
    },
    {
      id: "crh-catalog",
      text: sanitizeCommercialDiscoveryText("Catalogue récemment mis à jour chez un partenaire proche."),
    },
  ].slice(0, 2);
}
