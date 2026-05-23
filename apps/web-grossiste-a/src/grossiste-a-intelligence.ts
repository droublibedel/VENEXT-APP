import type {
  GrossisteADistributionDto,
  GrossisteAIntelligenceDto,
  GrossisteANetworkDto,
  GrossisteATerritoryDto,
} from "./hooks/grossiste-a-data.types";

const FORBIDDEN =
  /governance|orchestration|observatory|synthesis|systemic|executive|dto|prisma|macro supervision/i;

export function sanitizeGrossisteAText(text: string): string {
  if (FORBIDDEN.test(text)) return "Signal utile pour piloter votre réseau.";
  return text;
}

export type GrossisteAHint = { id: string; text: string };

export function buildNetworkSignals(network: GrossisteANetworkDto | null): GrossisteAHint[] {
  if (!network) return [];
  return network.suggestions.slice(0, 3).map((text, i) => ({
    id: `ns-${i}`,
    text: sanitizeGrossisteAText(text),
  }));
}

export function buildDistributionHints(dist: GrossisteADistributionDto | null): GrossisteAHint[] {
  if (!dist) return [];
  const hints: GrossisteAHint[] = dist.distributionTensions.map((t) => ({
    id: t.id,
    text: sanitizeGrossisteAText(t.text),
  }));
  if (dist.flowStability) {
    hints.push({ id: "flow", text: sanitizeGrossisteAText(`Flux : ${dist.flowStability}.`) });
  }
  return hints.slice(0, 4);
}

export function buildPartnerSignals(network: GrossisteANetworkDto | null): GrossisteAHint[] {
  if (!network) return [];
  return network.activePartners.slice(0, 2).map((p) => ({
    id: `ps-${p.id}`,
    text: sanitizeGrossisteAText(`${p.name} actif à ${p.city} (${p.orders7d} cmd/7j).`),
  }));
}

export function buildTerritorySignals(territory: GrossisteATerritoryDto | null): GrossisteAHint[] {
  if (!territory) return [];
  const hints = territory.growthZones.map((z, i) => ({
    id: `gz-${i}`,
    text: sanitizeGrossisteAText(`Zone en croissance : ${z}.`),
  }));
  territory.slowZones.forEach((z, i) => {
    hints.push({
      id: `sz-${i}`,
      text: sanitizeGrossisteAText(`Ralentissement observé à ${z}.`),
    });
  });
  return hints.slice(0, 4);
}

export function buildIntelligenceView(intel: GrossisteAIntelligenceDto | null) {
  if (!intel) return { hints: [] as GrossisteAHint[], suggestions: [] as string[] };
  const hints = [
    ...intel.activitySignals.map((s) => ({ id: s.id, text: sanitizeGrossisteAText(s.text) })),
    ...intel.anomalies.map((a) => ({ id: a.id, text: sanitizeGrossisteAText(a.text) })),
  ];
  const suggestions = intel.suggestions.map((s) => sanitizeGrossisteAText(s));
  return { hints: hints.slice(0, 5), suggestions };
}
