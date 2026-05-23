import type {
  ProducerCommercialNetworkDto,
  ProducerDataIntelligenceDto,
  ProducerMarketingActivationDto,
  ProducerNetworkActivityDto,
  ProducerOrderSummaryDto,
  ProducerProductTrendDto,
  ProducerSupplyLogisticsDto,
} from "../data/producer-industrial-data.types";
import { PRODUCER_PRODUCT_SIGNALS, PRODUCER_REGIONS } from "../mocks/industrial-mock-data";
import type {
  CatalogDemandZone,
  CatalogOverviewMetric,
  CatalogProductInsight,
  CatalogProductRow,
  CatalogRecommendation,
  CatalogRotationBucket,
  ProducerCatalogWorkspaceView,
} from "./producer-catalog.types";

const FORBIDDEN =
  /governance|observatory|orchestration|strategic synthesis|systemic|pressureScore|systemicExposure|strategicAlignment|governancePriority|dto|prisma|ingestion/i;

export function sanitizeCatalogText(text: string): string {
  if (FORBIDDEN.test(text)) return "Signal catalogue à suivre sur le réseau.";
  return text;
}

function productsSource(
  products: ProducerProductTrendDto[] | null,
  marketing: ProducerMarketingActivationDto | null,
): ProducerProductTrendDto[] {
  if (products?.length) return products;
  if (marketing?.products?.length) return marketing.products;
  return PRODUCER_PRODUCT_SIGNALS;
}

function availabilityFromPressure(demand: number, supply: ProducerSupplyLogisticsDto | null): CatalogProductRow["availability"] {
  const stress = supply?.supplyPressure ?? 50;
  if (demand >= 70 && stress > 65) return "faible";
  if (demand >= 55) return "moyenne";
  return "bonne";
}

function rotationLabel(momentum: ProducerProductTrendDto["momentum"], demand: number): CatalogProductRow["rotation"] {
  if (momentum === "rising" || demand >= 70) return "rapide";
  if (momentum === "cooling" || demand < 40) return "lente";
  return "normale";
}

function statusForProduct(p: ProducerProductTrendDto): CatalogProductRow["status"] {
  if (p.momentum === "cooling" && p.demandPressure < 40) return "dormant";
  if (p.momentum === "cooling") return "ralentissement";
  if (p.demandPressure >= 72) return "tension";
  return "actif";
}

export function buildCatalogProducts(
  products: ProducerProductTrendDto[] | null,
  marketing: ProducerMarketingActivationDto | null,
  commercial: ProducerCommercialNetworkDto | null,
  supply: ProducerSupplyLogisticsDto | null,
): CatalogProductRow[] {
  const list = productsSource(products, marketing);
  const cityCount = commercial?.regions?.length ?? PRODUCER_REGIONS.length;

  return list.map((p, i) => ({
    id: p.id,
    product: p.name,
    category: p.category,
    rotation: rotationLabel(p.momentum, p.demandPressure),
    demand: p.demandPressure,
    availability: availabilityFromPressure(p.demandPressure, supply),
    growth: p.momentum === "rising" ? "Hausse" : p.momentum === "cooling" ? "Baisse" : "Stable",
    cityCoverage: Math.min(cityCount, 2 + (i % 4)),
    status: statusForProduct(p),
  }));
}

export function buildCatalogOverview(
  products: CatalogProductRow[],
  commercial: ProducerCommercialNetworkDto | null,
  marketing: ProducerMarketingActivationDto | null,
  supply: ProducerSupplyLogisticsDto | null,
  network: ProducerNetworkActivityDto | null,
): { metrics: CatalogOverviewMetric[]; topProductWeek: string; catalogStability: number; networkAvailability: number } {
  const active = products.filter((p) => p.status === "actif" || p.status === "tension").length;
  const fast = products.filter((p) => p.rotation === "rapide").length;
  const slow = products.filter((p) => p.rotation === "lente" || p.status === "ralentissement").length;
  const tension = products.filter((p) => p.status === "tension").length;
  const top = products.sort((a, b) => b.demand - a.demand)[0];
  const stability = Math.round(88 - (supply?.supplyPressure ?? 50) / 8);
  const availability = Math.max(62, 100 - (supply?.tensionZones ?? 0) * 8);

  const metrics: CatalogOverviewMetric[] = [
    { id: "active", label: "Produits actifs", value: String(active), tone: "signal" },
    { id: "fast", label: "Forte rotation", value: String(fast), tone: "signal" },
    { id: "slow", label: "En ralentissement", value: String(slow), tone: "caution" },
    { id: "tension", label: "En tension", value: String(tension), tone: "caution" },
    {
      id: "availability",
      label: "Disponibilité réseau",
      value: `${availability}%`,
      hint: "Couverture distribution",
    },
    {
      id: "territory",
      label: "Couverture territoriale",
      value: `${commercial?.activeZones ?? PRODUCER_REGIONS.length} zones`,
    },
    {
      id: "top",
      label: "Top produit semaine",
      value: top?.product ?? "—",
      tone: "signal",
    },
    {
      id: "stability",
      label: "Stabilité catalogue",
      value: `${stability}%`,
      hint: network ? `Croissance réseau +${network.growthPct.toFixed(1)}%` : undefined,
    },
  ];

  return {
    metrics,
    topProductWeek: top?.product ?? marketing?.products[0]?.name ?? "Huile palme 1L",
    catalogStability: stability,
    networkAvailability: availability,
  };
}

export function buildDemandZones(
  commercial: ProducerCommercialNetworkDto | null,
  supply: ProducerSupplyLogisticsDto | null,
): CatalogDemandZone[] {
  const regions = commercial?.regions?.length ? commercial.regions : PRODUCER_REGIONS;
  return regions.map((r) => {
    const pressurePct = Math.min(99, Math.round(r.growthPct * 4 + (r.tension === "high" ? 25 : 0)));
    return {
      id: r.id,
      label: r.name,
      pressurePct,
      trend: r.growthPct >= 10 ? "hausse" : r.growthPct < 7 ? "baisse" : "stable",
      risk: pressurePct >= 75 ? "rupture" : pressurePct >= 50 ? "tension" : "stable",
    };
  });
}

export function buildRotationBuckets(products: CatalogProductRow[]): CatalogRotationBucket[] {
  const pick = (pred: (p: CatalogProductRow) => boolean) =>
    products.filter(pred).map((p) => p.product).slice(0, 3);

  return [
    { id: "fast", label: "Rotation rapide", count: products.filter((p) => p.rotation === "rapide").length, examples: pick((p) => p.rotation === "rapide") },
    { id: "slow", label: "Rotation lente", count: products.filter((p) => p.rotation === "lente").length, examples: pick((p) => p.rotation === "lente") },
    { id: "stable", label: "Stock stable", count: products.filter((p) => p.rotation === "normale").length, examples: pick((p) => p.rotation === "normale") },
    { id: "critical", label: "Stock critique", count: products.filter((p) => p.status === "tension").length, examples: pick((p) => p.status === "tension") },
    { id: "dormant", label: "Produits dormants", count: products.filter((p) => p.status === "dormant").length, examples: pick((p) => p.status === "dormant") },
  ];
}

export function buildRecommendations(
  products: CatalogProductRow[],
  commercial: ProducerCommercialNetworkDto | null,
  supply: ProducerSupplyLogisticsDto | null,
): CatalogRecommendation[] {
  const out: CatalogRecommendation[] = [];
  const weak = commercial?.regions?.find((r) => r.growthPct < 8);
  if (weak) {
    out.push({ id: "r1", text: `Renforcer présence à ${weak.name}.`, priority: "medium" });
  }
  const korhogo = commercial?.regions?.find((r) => r.name === "Korhogo");
  if (korhogo && korhogo.growthPct >= 12) {
    out.push({ id: "r2", text: "Demande forte sur corridor Nord.", priority: "high" });
  }
  const watch = products.find((p) => p.status === "tension");
  if (watch) {
    out.push({ id: "r3", text: `Produit à surveiller : ${watch.product}.`, priority: "high" });
  }
  const fast = products.find((p) => p.rotation === "rapide");
  if (fast) {
    out.push({ id: "r4", text: `Rotation exceptionnelle — ${fast.product}.`, priority: "medium" });
  }
  if (supply && supply.tensionZones > 0) {
    out.push({ id: "r5", text: "Disponibilité insuffisante sur zones tendues.", priority: "high" });
  }
  if (!out.length) {
    out.push({ id: "r0", text: "Maintenir la couverture catalogue sur les zones pilotes.", priority: "low" });
  }
  return out.slice(0, 6);
}

export function buildCatalogInsights(
  products: CatalogProductRow[],
  commercial: ProducerCommercialNetworkDto | null,
  intelligence: ProducerDataIntelligenceDto | null,
): CatalogProductInsight[] {
  const out: CatalogProductInsight[] = [];
  const rising = products.filter((p) => p.growth === "Hausse").slice(0, 2);
  for (const p of rising) {
    out.push({
      id: `up-${p.id}`,
      line1: `${p.product} monte sur le réseau.`,
      line2: `Demande ${p.demand}% · ${p.category}`,
      priority: "medium",
    });
  }
  const dynamicCity = commercial?.regions?.sort((a, b) => b.growthPct - a.growthPct)[0];
  if (dynamicCity) {
    out.push({
      id: "city",
      line1: `${dynamicCity.name} — ville dynamique cette semaine.`,
      line2: `+${dynamicCity.growthPct}% activité terrain`,
      priority: "low",
    });
  }
  out.push({
    id: "partners",
    line1: "Grossistes actifs sur huile et riz.",
    line2: "Rotation conforme aux objectifs réseau",
    priority: "low",
  });
  const slow = products.find((p) => p.status === "ralentissement");
  if (slow) {
    out.push({
      id: "slow",
      line1: `Ralentissement sur ${slow.product}.`,
      line2: "Ajuster volumes corridor si besoin",
      priority: "medium",
    });
  }
  for (const item of intelligence?.insights?.slice(0, 1) ?? []) {
    out.push({
      id: `intel-${item.id}`,
      line1: sanitizeCatalogText(item.title),
      line2: sanitizeCatalogText(item.detail).slice(0, 80),
      priority: item.severity,
    });
  }
  return out.slice(0, 8);
}

export function buildProducerCatalogView(args: {
  products: ProducerProductTrendDto[] | null;
  commercial: ProducerCommercialNetworkDto | null;
  marketing: ProducerMarketingActivationDto | null;
  orders: ProducerOrderSummaryDto | null;
  supply: ProducerSupplyLogisticsDto | null;
  intelligence: ProducerDataIntelligenceDto | null;
  network: ProducerNetworkActivityDto | null;
}): ProducerCatalogWorkspaceView {
  const productRows = buildCatalogProducts(args.products, args.marketing, args.commercial, args.supply);
  const overviewBlock = buildCatalogOverview(
    productRows,
    args.commercial,
    args.marketing,
    args.supply,
    args.network,
  );
  const categories = [...new Set(productRows.map((p) => p.category))];
  const cities = (args.commercial?.regions ?? PRODUCER_REGIONS).map((r) => r.name);

  return {
    overview: overviewBlock.metrics,
    products: productRows,
    categories,
    cities,
    demandZones: buildDemandZones(args.commercial, args.supply),
    rotationBuckets: buildRotationBuckets(productRows),
    recommendations: buildRecommendations(productRows, args.commercial, args.supply),
    insights: buildCatalogInsights(productRows, args.commercial, args.intelligence),
    topProductWeek: overviewBlock.topProductWeek,
    catalogStability: overviewBlock.catalogStability,
    networkAvailability: overviewBlock.networkAvailability,
  };
}
