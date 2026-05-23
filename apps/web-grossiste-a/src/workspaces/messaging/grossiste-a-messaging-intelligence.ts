import type { CommerceHint } from "commerce-messaging";

import type {
  GrossisteAIntelligenceDto,
  GrossisteANetworkDto,
  GrossisteAOrdersDto,
  GrossisteAOverviewDto,
} from "../../hooks/grossiste-a-data.types";

const FORBIDDEN =
  /governance|orchestration|observatory|synthesis|systemic|executive|chatbot|llm|dto|prisma/i;

export function sanitizeGrossisteMessagingText(text: string): string {
  if (FORBIDDEN.test(text)) return "Signal utile pour avancer cette conversation commerciale.";
  return text;
}

export const GROSSISTE_A_QUICK_SUGGESTIONS = [
  "Produit disponible",
  "Stock limité",
  "Livraison en cours",
  "Commande prête",
  "Besoin confirmation",
  "Activité forte aujourd'hui",
] as const;

export function buildGrossisteConversationSignals(
  overview: GrossisteAOverviewDto | null,
  intelligence: GrossisteAIntelligenceDto | null,
): CommerceHint[] {
  const hints: CommerceHint[] = [];
  if (overview?.dynamicCities?.includes("Bouaké")) {
    hints.push({
      id: "gcs-bouake",
      text: sanitizeGrossisteMessagingText("Bouaké très actif aujourd'hui."),
    });
  }
  intelligence?.activitySignals.slice(0, 1).forEach((s) => {
    hints.push({ id: s.id, text: sanitizeGrossisteMessagingText(s.text) });
  });
  return hints.slice(0, 2);
}

export function buildGrossistePartnerHints(network: GrossisteANetworkDto | null): CommerceHint[] {
  if (!network) return [];
  return network.activePartners.slice(0, 2).map((p) => ({
    id: `gp-${p.id}`,
    text: sanitizeGrossisteMessagingText(
      p.orders7d >= 5
        ? "Partenaire très actif cette semaine."
        : `${p.name} actif à ${p.city}.`,
    ),
  }));
}

export function buildGrossisteOrderHints(orders: GrossisteAOrdersDto | null): CommerceHint[] {
  if (!orders) return [];
  const hints: CommerceHint[] = [];
  const prep = orders.enCours.find((o) => o.status === "preparation");
  if (prep) {
    hints.push({
      id: `go-${prep.id}`,
      text: sanitizeGrossisteMessagingText("Commande en préparation."),
    });
  }
  const hot = orders.enCours.find((o) => o.status === "validation");
  if (hot) {
    hints.push({
      id: `gv-${hot.id}`,
      text: sanitizeGrossisteMessagingText(`Validation en attente — ${hot.partner}.`),
    });
  }
  return hints;
}

export function buildGrossisteProductDemandHint(productName?: string): CommerceHint | null {
  if (!productName) return null;
  return {
    id: "gpd",
    text: sanitizeGrossisteMessagingText(`Produit fortement demandé : ${productName}.`),
  };
}

export function buildGrossisteCorridorHint(corridor?: string): CommerceHint | null {
  if (!corridor) return null;
  return {
    id: "gcc",
    text: sanitizeGrossisteMessagingText(`Corridor dynamique aujourd'hui : ${corridor}.`),
  };
}
