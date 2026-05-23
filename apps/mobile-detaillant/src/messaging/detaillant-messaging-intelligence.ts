import type { CommerceHint } from "commerce-messaging";

import type {
  DetaillantHomeDto,
  DetaillantNetworkDto,
  DetaillantProductsDto,
} from "../hooks/detaillant-data.types";

const FORBIDDEN =
  /governance|orchestration|observatory|synthesis|systemic|executive|chatbot|llm|dto|prisma|websocket|polling|social/i;

export function sanitizeRetailMessagingText(text: string): string {
  if (FORBIDDEN.test(text)) return "Information utile pour votre achat.";
  return text;
}

export const DETAILLANT_QUICK_SUGGESTIONS = [
  "Produit disponible",
  "Livraison aujourd'hui",
  "Quantité confirmée",
  "Besoin disponibilité",
  "Confirmation commande",
] as const;

export function buildRetailSignals(home: DetaillantHomeDto | null): CommerceHint[] {
  if (!home) return [];
  const hints: CommerceHint[] = [];
  if (home.popularProducts[0]) {
    hints.push({
      id: "drs-popular",
      text: sanitizeRetailMessagingText(
        `Produit très demandé aujourd'hui : ${home.popularProducts[0].name}.`,
      ),
    });
  }
  if (home.salesTodayLabel) {
    hints.push({
      id: "drs-sales",
      text: sanitizeRetailMessagingText(`Ventes du jour : ${home.salesTodayLabel}.`),
    });
  }
  return hints.slice(0, 2);
}

export function buildRetailHints(
  home: DetaillantHomeDto | null,
  network: DetaillantNetworkDto | null,
): CommerceHint[] {
  const hints: CommerceHint[] = [];
  network?.activeSuppliers.slice(0, 1).forEach((s) => {
    hints.push({
      id: `drh-${s.id}`,
      text: sanitizeRetailMessagingText(`${s.name} actif dans votre zone.`),
    });
  });
  home?.discreetSuggestions.slice(0, 1).forEach((s, i) => {
    hints.push({ id: `drh-sug-${i}`, text: sanitizeRetailMessagingText(s) });
  });
  return hints.slice(0, 2);
}

export function buildRetailDemandSignals(
  products: DetaillantProductsDto | null,
  network: DetaillantNetworkDto | null,
): CommerceHint[] {
  const hints: CommerceHint[] = [];
  const hot = products?.products.find((p) => p.badge === "tres-demande");
  if (hot) {
    hints.push({
      id: `drd-${hot.id}`,
      text: sanitizeRetailMessagingText(`${hot.name} — très demandé près de chez vous.`),
    });
  }
  const limited = products?.products.find((p) => p.badge === "stock-limite");
  if (limited) {
    hints.push({
      id: `drd-lim-${limited.id}`,
      text: sanitizeRetailMessagingText("Stock limité — commandez vite si besoin."),
    });
  }
  const fastCity = network?.cityActivity.find((c) => c.level === "active");
  if (fastCity) {
    hints.push({
      id: `drd-city-${fastCity.city}`,
      text: sanitizeRetailMessagingText(`Livraison rapide disponible — ${fastCity.city}.`),
    });
  }
  return hints.slice(0, 2);
}
