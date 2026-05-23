import type {
  ProducerAlertDto,
  ProducerCommercialNetworkDto,
  ProducerDataIntelligenceDto,
  ProducerMapControlDto,
  ProducerMapRegionDto,
  ProducerMarketingActivationDto,
  ProducerNetworkActivityDto,
  ProducerOrderSummaryDto,
  ProducerProductTrendDto,
  ProducerSupplyLogisticsDto,
} from "../data/producer-industrial-data.types";
import {
  PRODUCER_INTELLIGENCE_INSIGHTS,
  PRODUCER_PRODUCT_SIGNALS,
  PRODUCER_REGIONS,
} from "../mocks/industrial-mock-data";
import type {
  ActivityAnomaly,
  IntelligenceOverviewMetric,
  MarketAttentionItem,
  NetworkSignalCard,
  PresenceMessage,
  PriorityInsight,
  ProducerIntelligenceWorkspaceView,
  StrategicSuggestion,
} from "./producer-intelligence.types";

const FORBIDDEN =
  /governance|orchestration|observatory|synthesis|systemic collapse|systemicPressure|systemicExposure|executiveExposure|executive escalation|executive instability|governancePriority|strategicAlignment|strategic coordination|macro supervision|dto|prisma/i;

export function sanitizeIntelligenceText(text: string): string {
  if (FORBIDDEN.test(text)) return "Signal utile à garder en tête sur le réseau.";
  return text;
}

const MAN_REGION: ProducerMapRegionDto = {
  id: "man",
  name: "Man",
  lat: 7.4,
  lng: -7.55,
  wholesalers: 6,
  retailers: 38,
  orderVolume7d: 1820,
  growthPct: 7.2,
  tension: "low",
};

export function enrichMapRegions(map: ProducerMapControlDto | null): ProducerMapRegionDto[] {
  const base = map?.regions?.length ? map.regions : [...PRODUCER_REGIONS];
  if (!base.some((r) => r.id === "man")) return [...base, MAN_REGION];
  return base;
}

export function buildMapWithMan(map: ProducerMapControlDto | null): ProducerMapControlDto {
  const regions = enrichMapRegions(map);
  const corridors = map?.corridors?.length
    ? map.corridors
    : [
        { id: "c1", label: "Corridor Abidjan hub", tension: "medium" as const },
        { id: "c2", label: "Corridor nord", tension: "medium" as const },
        { id: "c3", label: "Axe ouest", tension: "low" as const },
      ];
  return { regions, corridors };
}

function productsSource(
  products: ProducerProductTrendDto[] | null,
  marketing: ProducerMarketingActivationDto | null,
): ProducerProductTrendDto[] {
  if (products?.length) return products;
  if (marketing?.products?.length) return marketing.products;
  return PRODUCER_PRODUCT_SIGNALS.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    momentum: p.momentum,
    demandPressure: p.demandPressure,
  }));
}

function insightsSource(intelligence: ProducerDataIntelligenceDto | null) {
  return intelligence?.insights?.length
    ? intelligence.insights.map((i) => ({
        ...i,
        title: sanitizeIntelligenceText(i.title),
        detail: sanitizeIntelligenceText(i.detail),
      }))
    : PRODUCER_INTELLIGENCE_INSIGHTS.map((i) => ({
        ...i,
        title: sanitizeIntelligenceText(i.title),
        detail: sanitizeIntelligenceText(i.detail),
      }));
}

export function buildIntelligenceOverview(
  network: ProducerNetworkActivityDto | null,
  commercial: ProducerCommercialNetworkDto | null,
  products: ProducerProductTrendDto[],
  regions: ProducerMapRegionDto[],
  intelligence: ProducerDataIntelligenceDto | null,
  alerts: ProducerAlertDto[] | null,
): IntelligenceOverviewMetric[] {
  const dynamicZones = regions.filter((r) => r.growthPct >= 10).length;
  const activePartners = network?.activePartners ?? commercial?.topWholesalers?.length ?? 0;
  const watchedProducts = products.filter((p) => p.demandPressure >= 55).length;
  const attentionPoints = (alerts?.filter((a) => a.level !== "info").length ?? 0) + (intelligence?.insights?.length ?? 0);

  return [
    {
      id: "activity",
      label: "Activité réseau observée",
      value: `${(network?.orders7d ?? 0).toLocaleString("fr-FR")} cmd/7j`,
      tone: "signal",
    },
    { id: "zones", label: "Zones dynamiques", value: String(dynamicZones), tone: "signal" },
    { id: "partners", label: "Partenaires actifs", value: String(activePartners) },
    { id: "products", label: "Produits surveillés", value: String(watchedProducts) },
    {
      id: "stability",
      label: "Stabilité activité",
      value: `${Math.round(88 - (network?.growthPct ?? 0))}%`,
    },
    {
      id: "trends",
      label: "Tendances terrain",
      value: `+${(network?.growthPct ?? commercial?.averageGrowthPct ?? 0).toFixed(1)}%`,
      tone: "signal",
    },
    {
      id: "attention",
      label: "Points attention",
      value: String(Math.min(attentionPoints, 9)),
      tone: attentionPoints > 3 ? "caution" : "neutral",
    },
    {
      id: "priority",
      label: "Recommandations prioritaires",
      value: String(Math.min(5, intelligence?.insights?.length ?? 3)),
      tone: "signal",
    },
  ];
}

export function buildNetworkSignals(
  regions: ProducerMapRegionDto[],
  products: ProducerProductTrendDto[],
  network: ProducerNetworkActivityDto | null,
  map: ProducerMapControlDto | null,
  commercial: ProducerCommercialNetworkDto | null,
): NetworkSignalCard[] {
  const out: NetworkSignalCard[] = [];
  const topRegion = [...regions].sort((a, b) => b.growthPct - a.growthPct)[0];
  if (topRegion && topRegion.growthPct >= 10) {
    out.push({
      id: "growth",
      line1: `Reprise d'activité autour de ${topRegion.name}.`,
      line2: `+${topRegion.growthPct}% sur la période`,
      tone: "signal",
    });
  }
  const slow = regions.find((r) => r.growthPct < 8);
  if (slow) {
    out.push({
      id: "slow",
      line1: `Ralentissement réseau observé — ${slow.name}.`,
      line2: "Suivi discret recommandé",
      tone: "neutral",
    });
  }
  const rising = products.find((p) => p.momentum === "rising");
  if (rising) {
    out.push({
      id: "demand",
      line1: `Hausse de demande sur ${rising.name}.`,
      line2: "Progression distribution à noter",
      tone: "signal",
    });
  }
  const corridor = map?.corridors?.find((c) => c.tension !== "high");
  if (corridor) {
    out.push({
      id: "corridor",
      line1: `Corridor actif : ${corridor.label}.`,
      line2: "Flux soutenu cette semaine",
      tone: "neutral",
    });
  }
  const quiet = commercial?.topWholesalers?.find((p) => p.orders7d < 200);
  if (quiet) {
    out.push({
      id: "quiet",
      line1: `${quiet.name} — activité plus calme que d'habitude.`,
      line2: "Partenaire à relancer en douceur",
      tone: "neutral",
    });
  }
  if ((network?.growthPct ?? 0) >= 8) {
    out.push({
      id: "dist",
      line1: "Progression distribution sur le réseau pilote.",
      line2: `+${network?.growthPct?.toFixed(1) ?? "0"}% activité`,
      tone: "signal",
    });
  }
  return out.slice(0, 10);
}

export function buildMarketAttention(
  regions: ProducerMapRegionDto[],
  products: ProducerProductTrendDto[],
  supply: ProducerSupplyLogisticsDto | null,
): MarketAttentionItem[] {
  const out: MarketAttentionItem[] = [];
  for (const r of regions.filter((x) => x.tension === "high" || x.growthPct >= 12)) {
    out.push({
      id: `zone-${r.id}`,
      label: r.name,
      detail:
        r.tension === "high"
          ? "Zone à surveiller — pression activité locale"
          : "Ville dynamique cette semaine",
      tone: r.tension === "high" ? "caution" : "signal",
    });
  }
  for (const p of products.filter((x) => x.demandPressure >= 65 || x.momentum === "cooling")) {
    out.push({
      id: `prod-${p.id}`,
      label: p.name,
      detail:
        p.momentum === "cooling"
          ? "Produit sous attention — rythme plus lent"
          : "Demande en hausse à suivre",
      tone: p.momentum === "cooling" ? "caution" : "signal",
    });
  }
  if ((supply?.tensionZones ?? 0) > 0) {
    out.push({
      id: "pressure",
      label: "Pression activité logistique",
      detail: `${supply?.tensionZones} zone(s) avec tension modérée`,
      tone: "caution",
    });
  }
  const slow = regions.find((r) => r.growthPct < 7);
  if (slow) {
    out.push({
      id: "slow-zone",
      label: slow.name,
      detail: "Zone en ralentissement relatif",
      tone: "neutral",
    });
  }
  return out.slice(0, 8);
}

export function buildStrategicSuggestions(
  regions: ProducerMapRegionDto[],
  products: ProducerProductTrendDto[],
  commercial: ProducerCommercialNetworkDto | null,
  map: ProducerMapControlDto | null,
): StrategicSuggestion[] {
  const out: StrategicSuggestion[] = [];
  const bouake = regions.find((r) => r.name === "Bouaké");
  if (bouake) {
    out.push({ id: "s1", text: "Renforcer présence à Bouaké.", priority: "medium" });
  }
  const northCorridor = map?.corridors?.find((c) => /nord/i.test(c.label));
  if (northCorridor) {
    out.push({ id: "s2", text: "Demande en hausse sur le corridor Nord.", priority: "high" });
  }
  out.push({ id: "s3", text: "Activité inhabituelle à surveiller.", priority: "medium" });
  out.push({ id: "s4", text: "Distribution à renforcer sur les zones dynamiques.", priority: "medium" });
  const partner = commercial?.topWholesalers?.find((p) => p.orders7d < 250);
  if (partner) {
    out.push({ id: "s5", text: `Partenaire à relancer — ${partner.name}.`, priority: "low" });
  }
  const stock = products.find((p) => p.demandPressure >= 70);
  if (stock) {
    out.push({ id: "s6", text: `Stock à surveiller — ${stock.name}.`, priority: "high" });
  }
  return out.slice(0, 6);
}

export function buildActivityAnomalies(
  regions: ProducerMapRegionDto[],
  products: ProducerProductTrendDto[],
  network: ProducerNetworkActivityDto | null,
): ActivityAnomaly[] {
  const out: ActivityAnomaly[] = [];
  const unusual = regions.find((r) => r.growthPct >= 14);
  if (unusual) {
    out.push({
      id: "unusual",
      label: "Activité inhabituelle",
      detail: `${unusual.name} — progression plus marquée que d'habitude.`,
      tone: "signal",
    });
  }
  const sudden = regions.find((r) => r.growthPct < 7);
  if (sudden) {
    out.push({
      id: "sudden",
      label: "Ralentissement soudain",
      detail: `Activité plus faible qu'habituellement observée à ${sudden.name}.`,
      tone: "neutral",
    });
  }
  const spike = products.find((p) => p.demandPressure >= 75);
  if (spike) {
    out.push({
      id: "spike",
      label: "Hausse inhabituelle",
      detail: `${spike.name} — demande en progression rapide.`,
      tone: "signal",
    });
  }
  if ((network?.growthPct ?? 0) > 12 && (network?.orders7d ?? 0) > 5000) {
    out.push({
      id: "rupture",
      label: "Rupture probable",
      detail: "Certaines commandes montrent une progression inhabituelle.",
      tone: "caution",
    });
  }
  const silent = regions.find((r) => r.orderVolume7d < 3000);
  if (silent) {
    out.push({
      id: "silent",
      label: "Zone silencieuse",
      detail: `${silent.name} — activité plus calme cette semaine.`,
      tone: "neutral",
    });
  }
  return out.slice(0, 6);
}

export function buildPriorityInsights(
  intelligence: ProducerDataIntelligenceDto | null,
  regions: ProducerMapRegionDto[],
  products: ProducerProductTrendDto[],
  commercial: ProducerCommercialNetworkDto | null,
  map: ProducerMapControlDto | null,
): PriorityInsight[] {
  const out: PriorityInsight[] = [];
  const strong = regions.sort((a, b) => b.orderVolume7d - a.orderVolume7d)[0];
  if (strong) {
    out.push({
      id: "strong",
      line1: `Activité forte — ${strong.name}.`,
      line2: `${strong.orderVolume7d.toLocaleString("fr-FR")} commandes / 7j`,
      priority: "medium",
    });
  }
  const demand = products.find((p) => p.momentum === "rising");
  if (demand) {
    out.push({
      id: "demand",
      line1: `Demande monte sur ${demand.name}.`,
      line2: "Opportunité terrain à saisir",
      priority: "low",
    });
  }
  const progressing = commercial?.topWholesalers?.[0];
  if (progressing) {
    out.push({
      id: "partner",
      line1: `${progressing.name} progresse cette semaine.`,
      line2: `${progressing.orders7d} commandes observées`,
      priority: "low",
    });
  }
  const slowCorridor = map?.corridors?.find((c) => c.tension === "high");
  if (slowCorridor) {
    out.push({
      id: "corridor",
      line1: `${slowCorridor.label} — rythme à suivre.`,
      line2: "Corridor sous attention discrète",
      priority: "medium",
    });
  }
  out.push({
    id: "dist",
    line1: "Distribution évolue sur le réseau pilote.",
    line2: "Couverture en progression",
    priority: "low",
  });
  for (const item of insightsSource(intelligence).slice(0, 2)) {
    out.push({
      id: `intel-${item.id}`,
      line1: item.title,
      line2: item.detail.slice(0, 72),
      priority: item.severity,
    });
  }
  return out.slice(0, 8);
}

export function buildPresenceMessages(
  regions: ProducerMapRegionDto[],
  products: ProducerProductTrendDto[],
  commercial: ProducerCommercialNetworkDto | null,
  map: ProducerMapControlDto | null,
): PresenceMessage[] {
  const north = regions.find((r) => r.name === "Korhogo" || r.id === "korhogo");
  const messages: PresenceMessage[] = [];
  if (north && north.growthPct >= 10) {
    messages.push({
      id: "p1",
      text: "VENEXT observe une activité plus soutenue dans le Nord.",
    });
  }
  const rising = products.filter((p) => p.momentum === "rising").length;
  if (rising > 0) {
    messages.push({
      id: "p2",
      text: "Certaines commandes montrent une progression inhabituelle.",
    });
  }
  const activeDistributors = commercial?.topWholesalers?.filter((p) => p.orders7d >= 400).length ?? 0;
  if (activeDistributors > 0) {
    messages.push({
      id: "p3",
      text: "Des distributeurs deviennent plus actifs cette semaine.",
    });
  }
  const sensitive = map?.corridors?.filter((c) => c.tension !== "low").length ?? 0;
  if (sensitive > 0) {
    messages.push({
      id: "p4",
      text: "Une attention particulière est recommandée sur certains corridors.",
    });
  }
  if (!messages.length) {
    messages.push({
      id: "p0",
      text: "VENEXT suit votre réseau — activité globalement stable cette semaine.",
    });
  }
  return messages.slice(0, 4);
}

export function buildProducerIntelligenceView(args: {
  intelligence: ProducerDataIntelligenceDto | null;
  network: ProducerNetworkActivityDto | null;
  commercial: ProducerCommercialNetworkDto | null;
  products: ProducerProductTrendDto[] | null;
  orders: ProducerOrderSummaryDto | null;
  marketing: ProducerMarketingActivationDto | null;
  supply: ProducerSupplyLogisticsDto | null;
  map: ProducerMapControlDto | null;
  alerts: ProducerAlertDto[] | null;
}): ProducerIntelligenceWorkspaceView {
  const map = buildMapWithMan(args.map);
  const regions = enrichMapRegions(map);
  const products = productsSource(args.products, args.marketing);

  return {
    overview: buildIntelligenceOverview(
      args.network,
      args.commercial,
      products,
      regions,
      args.intelligence,
      args.alerts,
    ),
    networkSignals: buildNetworkSignals(
      regions,
      products,
      args.network,
      map,
      args.commercial,
    ),
    marketAttention: buildMarketAttention(regions, products, args.supply),
    suggestions: buildStrategicSuggestions(regions, products, args.commercial, map),
    anomalies: buildActivityAnomalies(regions, products, args.network),
    priorityInsights: buildPriorityInsights(
      args.intelligence,
      regions,
      products,
      args.commercial,
      map,
    ),
    presence: buildPresenceMessages(regions, products, args.commercial, map),
    map,
  };
}
