import type {
  GrossisteActivityDto,
  GrossisteCatalogDto,
  GrossisteNetworkDto,
} from "../hooks/grossiste-b-data.types";

const FORBIDDEN =
  /governance|orchestration|observatory|synthesis|systemic|executive|dto|prisma|macro supervision|strategic coordination/i;

export function sanitizeGrossisteText(text: string): string {
  if (FORBIDDEN.test(text)) return "Signal utile pour votre activité du jour.";
  return text;
}

export type GrossisteHint = { id: string; text: string };

export function buildActivityHints(activity: GrossisteActivityDto | null): GrossisteHint[] {
  if (!activity) return [];
  const hints: GrossisteHint[] = [];
  if (activity.newOrdersCount >= 5) {
    hints.push({
      id: "h1",
      text: sanitizeGrossisteText("Votre réseau est actif ce matin."),
    });
  }
  if (activity.activeCities.includes("Bouaké")) {
    hints.push({
      id: "h2",
      text: sanitizeGrossisteText("Activité inhabituelle à Bouaké — à garder en tête."),
    });
  }
  if (activity.networkActivityToday >= 20) {
    hints.push({
      id: "h3",
      text: sanitizeGrossisteText("Bonne dynamique sur vos corridors habituels."),
    });
  }
  return hints.slice(0, 3);
}

export function buildDemandSignals(catalog: GrossisteCatalogDto | null): GrossisteHint[] {
  if (!catalog) return [];
  const high = catalog.products.filter((p) => p.badge === "forte-demande");
  const signals: GrossisteHint[] = high.slice(0, 2).map((p) => ({
    id: `d-${p.id}`,
    text: sanitizeGrossisteText(`Produit très demandé aujourd'hui : ${p.name}.`),
  }));
  if (signals.length === 0 && catalog.popularIds.length > 0) {
    const p = catalog.products.find((x) => x.id === catalog.popularIds[0]);
    if (p) {
      signals.push({
        id: "d-pop",
        text: sanitizeGrossisteText(`${p.name} reste populaire dans votre réseau.`),
      });
    }
  }
  return signals;
}

export function buildPartnerSuggestions(network: GrossisteNetworkDto | null): GrossisteHint[] {
  if (!network) return [];
  return network.simpleSuggestions.slice(0, 3).map((text, i) => ({
    id: `ps-${i}`,
    text: sanitizeGrossisteText(text),
  }));
}

export function buildStockSignals(catalog: GrossisteCatalogDto | null): GrossisteHint[] {
  if (!catalog) return [];
  const limited = catalog.products.filter(
    (p) => p.badge === "stock-limite" || p.availability === "limited",
  );
  return limited.slice(0, 2).map((p) => ({
    id: `s-${p.id}`,
    text: sanitizeGrossisteText(`Stock à surveiller : ${p.name}.`),
  }));
}
