import type {
  DetaillantHomeDto,
  DetaillantNetworkDto,
  DetaillantProductsDto,
} from "./hooks/detaillant-data.types";

const FORBIDDEN =
  /governance|orchestration|observatory|synthesis|systemic|executive|dto|prisma|macro supervision|strategic coordination/i;

export function sanitizeDetaillantText(text: string): string {
  if (FORBIDDEN.test(text)) return "Conseil utile pour votre journée de vente.";
  return text;
}

export type DetaillantHint = { id: string; text: string };

export function buildSalesSignals(home: DetaillantHomeDto | null): DetaillantHint[] {
  if (!home) return [];
  const hints: DetaillantHint[] = [];
  if ((home.activityToday ?? 0) >= 15) {
    hints.push({
      id: "sales1",
      text: sanitizeDetaillantText("Votre activité est dynamique ce matin."),
    });
  }
  if (home.salesTodayLabel) {
    hints.push({
      id: "sales2",
      text: sanitizeDetaillantText(`Ventes du jour : ${home.salesTodayLabel}.`),
    });
  }
  return hints.slice(0, 2);
}

export function buildActivityHints(home: DetaillantHomeDto | null): DetaillantHint[] {
  if (!home) return [];
  const hints: DetaillantHint[] = [];
  if ((home.activePartners ?? 0) >= 5) {
    hints.push({
      id: "act1",
      text: sanitizeDetaillantText("Votre réseau est actif."),
    });
  }
  home.discreetSuggestions?.slice(0, 2).forEach((s, i) => {
    hints.push({ id: `act-s-${i}`, text: sanitizeDetaillantText(s) });
  });
  return hints.slice(0, 3);
}

export function buildDemandHints(products: DetaillantProductsDto | null): DetaillantHint[] {
  if (!products) return [];
  const hot = products.products.filter((p) => p.badge === "tres-demande");
  const hints = hot.slice(0, 2).map((p) => ({
    id: `dem-${p.id}`,
    text: sanitizeDetaillantText(`Produit très demandé aujourd'hui : ${p.name}.`),
  }));
  const low = products.products.filter(
    (p) => p.badge === "stock-limite" || p.availability === "limited",
  );
  low.slice(0, 1).forEach((p) => {
    hints.push({
      id: `stk-${p.id}`,
      text: sanitizeDetaillantText(`Stock à surveiller : ${p.name}.`),
    });
  });
  return hints;
}

export function buildPartnerHints(network: DetaillantNetworkDto | null): DetaillantHint[] {
  if (!network) return [];
  return network.networkSuggestions.slice(0, 3).map((text, i) => ({
    id: `ph-${i}`,
    text: sanitizeDetaillantText(text),
  }));
}
