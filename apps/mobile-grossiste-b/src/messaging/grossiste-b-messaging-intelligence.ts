import type { CommerceHint } from "commerce-messaging";

import type {
  GrossisteActivityDto,
  GrossisteCatalogDto,
  GrossisteNetworkDto,
  GrossisteOrdersDto,
} from "../hooks/grossiste-b-data.types";

const FORBIDDEN =
  /governance|orchestration|observatory|synthesis|systemic|executive|chatbot|llm|dto|prisma|websocket|polling/i;

export function sanitizeGrossisteBMessagingText(text: string): string {
  if (FORBIDDEN.test(text)) return "Signal utile pour avancer cette conversation commerciale.";
  return text;
}

export const GROSSISTE_B_QUICK_SUGGESTIONS = [
  "Produit disponible",
  "Livraison aujourd'hui",
  "Stock faible",
  "Commande prête",
  "Besoin confirmation",
] as const;

export function buildGrossisteBConversationHints(
  activity: GrossisteActivityDto | null,
): CommerceHint[] {
  const hints: CommerceHint[] = [];
  if (activity?.activeCities.includes("Bouaké")) {
    hints.push({
      id: "gbb-bouake",
      text: sanitizeGrossisteBMessagingText("Bouaké très actif aujourd'hui."),
    });
  }
  const moving = activity?.movingProducts[0];
  if (moving) {
    hints.push({
      id: "gbb-product-demand",
      text: sanitizeGrossisteBMessagingText(`Produit très demandé aujourd'hui : ${moving.name}.`),
    });
  }
  return hints.slice(0, 2);
}

export function buildGrossisteBPartnerSignals(
  network: GrossisteNetworkDto | null,
): CommerceHint[] {
  if (!network) return [];
  return network.activePartners.slice(0, 2).map((p) => ({
    id: `gbp-${p.id}`,
    text: sanitizeGrossisteBMessagingText(
      p.orders7d >= 4 ? "Partenaire réactif cette semaine." : `${p.name} actif à ${p.city}.`,
    ),
  }));
}

export function buildGrossisteBDemandSignals(
  catalog: GrossisteCatalogDto | null,
  activity: GrossisteActivityDto | null,
): CommerceHint[] {
  const hints: CommerceHint[] = [];
  const corridor = networkCorridorLabel(activity, catalog);
  if (corridor) {
    hints.push({
      id: "gbd-corridor",
      text: sanitizeGrossisteBMessagingText(`Demande forte sur ce corridor : ${corridor}.`),
    });
  }
  const popular = catalog?.products.find((p) => catalog.popularIds.includes(p.id));
  if (popular) {
    hints.push({
      id: `gbd-${popular.id}`,
      text: sanitizeGrossisteBMessagingText(`${popular.name} — forte demande terrain.`),
    });
  }
  return hints.slice(0, 2);
}

function networkCorridorLabel(
  activity: GrossisteActivityDto | null,
  _catalog: GrossisteCatalogDto | null,
): string | undefined {
  const trend = activity?.discreetTrends.find((t) => t.label.toLowerCase().includes("corridor"));
  return trend?.label;
}

export function buildGrossisteBOrderHints(orders: GrossisteOrdersDto | null): CommerceHint[] {
  if (!orders) return [];
  const hints: CommerceHint[] = [];
  const delivery = orders.received.find((o) => o.status === "delivery");
  if (delivery) {
    hints.push({
      id: `gbo-del-${delivery.id}`,
      text: sanitizeGrossisteBMessagingText(`Livraison en cours — ${delivery.partner}.`),
    });
  }
  const validation = orders.received.find((o) => o.status === "validation");
  if (validation) {
    hints.push({
      id: `gbo-val-${validation.id}`,
      text: sanitizeGrossisteBMessagingText(`À valider — ${validation.partner}.`),
    });
  }
  return hints;
}
