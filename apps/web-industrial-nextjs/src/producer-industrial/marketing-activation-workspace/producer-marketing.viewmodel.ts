import type {
  ProducerCommercialNetworkDto,
  ProducerDataIntelligenceDto,
  ProducerMapControlDto,
  ProducerMapRegionDto,
  ProducerMarketingActivationDto,
  ProducerNetworkActivityDto,
  ProducerOrderSummaryDto,
  ProducerPartnerDto,
  ProducerProductTrendDto,
  ProducerSupplyLogisticsDto,
} from "../data/producer-industrial-data.types";
import { PRODUCER_PRODUCT_SIGNALS, PRODUCER_REGIONS, PRODUCER_TOP_WHOLESALERS } from "../mocks/industrial-mock-data";
import type {
  MarketingCampaignRow,
  MarketingDistributorActivationRow,
  MarketingInsight,
  MarketingOpportunity,
  MarketingOverviewMetric,
  MarketingPressureBlock,
  MarketingProductMomentumRow,
  ProducerMarketingWorkspaceView,
} from "./producer-marketing.types";

const FORBIDDEN =
  /governance|orchestration|observatory|synthesis|systemic collapse|systemicExposure|pressureScore|strategicAlignment|governancePriority|macro supervision|dto|prisma/i;

export function sanitizeMarketingText(text: string): string {
  if (FORBIDDEN.test(text)) return "Signal activation à suivre sur le réseau.";
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

export function buildMarketingOverview(
  marketing: ProducerMarketingActivationDto | null,
  products: ProducerProductTrendDto[],
  network: ProducerNetworkActivityDto | null,
  commercial: ProducerCommercialNetworkDto | null,
  regions: ProducerMapRegionDto[],
): { metrics: MarketingOverviewMetric[]; topActivationWeek: string } {
  const rising = products.filter((p) => p.momentum === "rising").length;
  const reactive = [...regions].sort((a, b) => b.growthPct - a.growthPct)[0];
  const topProduct = [...products].sort((a, b) => b.demandPressure - a.demandPressure)[0];
  const stability = marketing?.campaignRotationPct ?? 88;

  const metrics: MarketingOverviewMetric[] = [
    {
      id: "active",
      label: "Activations en cours",
      value: String(marketing?.activationCorridors ?? regions.length),
      tone: "signal",
    },
    { id: "rising", label: "Produits en hausse", value: String(rising), tone: "signal" },
    {
      id: "pressure",
      label: "Pression demande",
      value: `${marketing?.demandPressurePct ?? 0}%`,
      tone: (marketing?.demandPressurePct ?? 0) > 65 ? "caution" : "neutral",
    },
    {
      id: "distributors",
      label: "Activité distributeurs",
      value: String(commercial?.topWholesalers?.length ?? PRODUCER_TOP_WHOLESALERS.length),
    },
    {
      id: "zones",
      label: "Zones les plus réactives",
      value: reactive?.name ?? "—",
      tone: "signal",
    },
    {
      id: "growth",
      label: "Croissance réseau",
      value: `+${(network?.growthPct ?? commercial?.averageGrowthPct ?? 0).toFixed(1)}%`,
      tone: "signal",
    },
    { id: "stability", label: "Stabilité activité", value: `${stability}%` },
    {
      id: "top",
      label: "Top activation semaine",
      value: topProduct?.name ?? "—",
      tone: "signal",
    },
  ];

  return { metrics, topActivationWeek: topProduct?.name ?? "Huile palme 1L" };
}

export function buildCampaigns(
  marketing: ProducerMarketingActivationDto | null,
  map: ProducerMapControlDto | null,
  commercial: ProducerCommercialNetworkDto | null,
): MarketingCampaignRow[] {
  const corridors = map?.corridors ?? [];
  const regions = commercial?.regions?.length ? commercial.regions : PRODUCER_REGIONS;
  const topRegion = [...regions].sort((a, b) => b.growthPct - a.growthPct)[0];

  if (!corridors.length) {
    return [
      {
        id: "national",
        label: "Activation réseau national",
        status: "performante",
        zone: topRegion?.name ?? "Abidjan",
        activityPct: marketing?.demandPressurePct ?? 72,
        stability: marketing?.campaignRotationPct ?? 85,
        distributorActivity: "Soutenue",
      },
    ];
  }

  return corridors.map((c, i) => {
    const zone = regions[i % regions.length]?.name ?? "CI";
    const weak = c.tension === "high" || (marketing?.demandPressurePct ?? 0) < 50;
    return {
      id: c.id,
      label: c.label.replace(/corridor/gi, "Activation"),
      status: weak ? "faible" : c.tension === "low" ? "performante" : "stable",
      zone,
      activityPct: weak ? 48 : c.tension === "low" ? 86 : 72,
      stability: weak ? 58 : 82,
      distributorActivity: weak ? "À relancer" : "Active",
    };
  });
}

export function buildProductMomentum(products: ProducerProductTrendDto[]): MarketingProductMomentumRow[] {
  return products.map((p) => {
    let momentum: MarketingProductMomentumRow["momentum"] = "stable";
    if (p.momentum === "rising") momentum = "accélère";
    else if (p.momentum === "cooling") momentum = "ralentit";
    let status: MarketingProductMomentumRow["status"] = "stable";
    if (p.demandPressure >= 70) status = "pic";
    else if (p.demandPressure < 45 || p.momentum === "cooling") status = "surveiller";
    return {
      id: p.id,
      product: p.name,
      category: p.category,
      momentum,
      demandPressure: p.demandPressure,
      status,
    };
  });
}

export function buildDistributorActivation(
  commercial: ProducerCommercialNetworkDto | null,
  products: ProducerProductTrendDto[],
): MarketingDistributorActivationRow[] {
  const partners: ProducerPartnerDto[] = [
    ...(commercial?.topWholesalers ?? PRODUCER_TOP_WHOLESALERS),
    ...(commercial?.recentPartners ?? []).slice(0, 3),
  ];
  const regions = commercial?.regions?.length ? commercial.regions : PRODUCER_REGIONS;
  const pushed = Math.max(1, Math.min(products.length, 4));

  return partners.map((p, i) => {
    const city = regions.find((r) => r.id === p.regionId)?.name ?? p.regionId;
    const activationActivity: MarketingDistributorActivationRow["activationActivity"] =
      p.orders7d >= 400 ? "forte" : p.orders7d >= 180 ? "moyenne" : "faible";
    const stability = p.risk === "stable" ? 88 : p.risk === "watch" ? 64 : 48;
    let status: MarketingDistributorActivationRow["status"] = "actif";
    if (p.orders7d < 150) status = "à relancer";
    else if (p.risk === "watch") status = "ralentissement";
    else if (p.risk === "stable") status = "stable";
    return {
      id: p.id,
      distributor: p.name,
      city,
      activationActivity,
      growth: p.orders7d >= 300 ? "Hausse" : "Stable",
      orders: p.orders7d,
      productsPushed: pushed + (i % 2),
      stability,
      status,
    };
  });
}

export function buildMarketPressure(
  products: ProducerProductTrendDto[],
  supply: ProducerSupplyLogisticsDto | null,
  map: ProducerMapControlDto | null,
): MarketingPressureBlock[] {
  const strong = products.filter((p) => p.demandPressure >= 65).length;
  const weak = products.filter((p) => p.demandPressure < 45).length;
  const reactiveCorridors = map?.corridors?.filter((c) => c.tension !== "high").length ?? 2;
  const saturated = supply?.tensionZones ?? 0;

  return [
    { id: "strong", label: "Demande forte", value: `${strong} produit(s)`, tone: "signal" },
    { id: "weak", label: "Demande faible", value: `${weak} produit(s)`, tone: weak > 0 ? "caution" : "neutral" },
    {
      id: "tension",
      label: "Tension produits",
      value: `${supply?.supplyPressure ?? 0}%`,
      tone: (supply?.supplyPressure ?? 0) > 60 ? "caution" : "neutral",
    },
    { id: "corridors", label: "Corridors réactifs", value: String(reactiveCorridors), tone: "signal" },
    {
      id: "saturation",
      label: "Zones saturation",
      value: String(saturated),
      tone: saturated > 0 ? "caution" : "neutral",
    },
    {
      id: "opportunity",
      label: "Zones opportunité",
      value: String(Math.max(0, products.length - strong)),
      tone: "signal",
    },
  ];
}

export function buildActivationOpportunities(
  products: ProducerProductTrendDto[],
  regions: ProducerMapRegionDto[],
): MarketingOpportunity[] {
  const out: MarketingOpportunity[] = [];
  const rising = products.find((p) => p.momentum === "rising");
  if (rising) {
    out.push({
      id: "o1",
      text: `Renforcer l'activation sur ${rising.name} — demande en hausse.`,
      priority: "high",
    });
  }
  const korhogo = regions.find((r) => r.name === "Korhogo");
  if (korhogo && korhogo.growthPct >= 10) {
    out.push({ id: "o2", text: "Zone Korhogo réactive — opportunité d'activation locale.", priority: "medium" });
  }
  out.push({ id: "o3", text: "Distributeurs actifs à mobiliser sur les produits en hausse.", priority: "medium" });
  const cooling = products.find((p) => p.momentum === "cooling");
  if (cooling) {
    out.push({ id: "o4", text: `${cooling.name} — ralentissement à surveiller.`, priority: "low" });
  }
  const sanPedro = regions.find((r) => r.name === "San Pedro");
  if (sanPedro) {
    out.push({ id: "o5", text: "Couverture activation insuffisante à San Pedro.", priority: "high" });
  }
  return out.slice(0, 6);
}

export function buildMarketingInsights(
  products: ProducerProductTrendDto[],
  commercial: ProducerCommercialNetworkDto | null,
  regions: ProducerMapRegionDto[],
  intelligence: ProducerDataIntelligenceDto | null,
): MarketingInsight[] {
  const out: MarketingInsight[] = [];
  const top = [...products].sort((a, b) => b.demandPressure - a.demandPressure)[0];
  if (top) {
    out.push({
      id: "product-up",
      line1: `${top.name} — produit qui monte cette semaine.`,
      line2: `Pression demande ${top.demandPressure}%`,
      priority: "medium",
    });
  }
  const activePartner = commercial?.topWholesalers?.[0];
  if (activePartner) {
    out.push({
      id: "dist",
      line1: `${activePartner.name} — distributeur très actif.`,
      line2: `${activePartner.orders7d} commandes / 7j`,
      priority: "low",
    });
  }
  const reactive = [...regions].sort((a, b) => b.growthPct - a.growthPct)[0];
  if (reactive) {
    out.push({
      id: "zone",
      line1: `${reactive.name} — zone réactive sur le terrain.`,
      line2: `+${reactive.growthPct}% croissance locale`,
      priority: "low",
    });
  }
  const slow = products.find((p) => p.momentum === "cooling");
  if (slow) {
    out.push({
      id: "slow",
      line1: `Ralentissement sur ${slow.name}.`,
      line2: "Opportunité de relance activation",
      priority: "medium",
    });
  }
  for (const item of intelligence?.insights?.slice(0, 1) ?? []) {
    out.push({
      id: `intel-${item.id}`,
      line1: sanitizeMarketingText(item.title),
      line2: sanitizeMarketingText(item.detail).slice(0, 72),
      priority: item.severity,
    });
  }
  return out.slice(0, 8);
}

export function buildProducerMarketingView(args: {
  marketing: ProducerMarketingActivationDto | null;
  commercial: ProducerCommercialNetworkDto | null;
  network: ProducerNetworkActivityDto | null;
  products: ProducerProductTrendDto[] | null;
  orders: ProducerOrderSummaryDto | null;
  map: ProducerMapControlDto | null;
  supply: ProducerSupplyLogisticsDto | null;
  intelligence: ProducerDataIntelligenceDto | null;
}): ProducerMarketingWorkspaceView {
  const map = buildMapWithMan(args.map);
  const regions = enrichMapRegions(map);
  const products = productsSource(args.products, args.marketing);
  const overviewBlock = buildMarketingOverview(
    args.marketing,
    products,
    args.network,
    args.commercial,
    regions,
  );
  const categories = [...new Set(products.map((p) => p.category))];

  return {
    overview: overviewBlock.metrics,
    campaigns: buildCampaigns(args.marketing, map, args.commercial),
    productMomentum: buildProductMomentum(products),
    distributors: buildDistributorActivation(args.commercial, products),
    pressure: buildMarketPressure(products, args.supply, map),
    opportunities: buildActivationOpportunities(products, regions),
    insights: buildMarketingInsights(products, args.commercial, regions, args.intelligence),
    map,
    topActivationWeek: overviewBlock.topActivationWeek,
    cities: regions.map((r) => r.name),
    categories,
  };
}
