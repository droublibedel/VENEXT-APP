import type {
  ProducerCommercialNetworkDto,
  ProducerDataIntelligenceDto,
  ProducerMapControlDto,
  ProducerMapRegionDto,
  ProducerNetworkActivityDto,
  ProducerOrderSummaryDto,
  ProducerPartnerDto,
  ProducerSupplyLogisticsDto,
} from "../data/producer-industrial-data.types";
import { PRODUCER_REGIONS, PRODUCER_TOP_WHOLESALERS } from "../mocks/industrial-mock-data";
import type {
  ProducerTerritoryWorkspaceView,
  TerritoryCityActivity,
  TerritoryCorridorRow,
  TerritoryDistributorRow,
  TerritoryInsight,
  TerritoryOpportunity,
  TerritoryOverviewMetric,
  TerritoryRegionBlock,
} from "./producer-territory.types";

const FORBIDDEN =
  /governance|orchestration|observatory|macro supervision|systemic collapse|systemicPressure|executiveExposure|strategicAlignment|governancePriority|dto|prisma/i;

export function sanitizeTerritoryText(text: string): string {
  if (FORBIDDEN.test(text)) return "Signal territorial à suivre sur le réseau.";
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

function regionsSource(commercial: ProducerCommercialNetworkDto | null): ProducerMapRegionDto[] {
  return commercial?.regions?.length ? commercial.regions : PRODUCER_REGIONS;
}

export function buildTerritoryOverview(
  regions: ProducerMapRegionDto[],
  commercial: ProducerCommercialNetworkDto | null,
  network: ProducerNetworkActivityDto | null,
  supply: ProducerSupplyLogisticsDto | null,
  map: ProducerMapControlDto | null,
): { metrics: TerritoryOverviewMetric[]; topZoneWeek: string } {
  const activeTerritories = regions.filter((r) => r.orderVolume7d > 2000).length;
  const performantCorridors = map?.corridors?.filter((c) => c.tension !== "high").length ?? 2;
  const underused = regions.filter((r) => r.growthPct < 8 || r.orderVolume7d < 3500).length;
  const top = [...regions].sort((a, b) => b.orderVolume7d - a.orderVolume7d)[0];
  const stability = Math.round(86 - (supply?.tensionZones ?? 0) * 6);

  const metrics: TerritoryOverviewMetric[] = [
    { id: "active", label: "Territoires actifs", value: String(activeTerritories), tone: "signal" },
    { id: "corridors", label: "Corridors performants", value: String(performantCorridors), tone: "signal" },
    { id: "under", label: "Zones sous-exploitées", value: String(underused), tone: "caution" },
    {
      id: "distributors",
      label: "Distributeurs actifs",
      value: String(commercial?.topWholesalers?.length ?? PRODUCER_TOP_WHOLESALERS.length),
    },
    {
      id: "network",
      label: "Activité réseau",
      value: `${(network?.orders7d ?? commercial?.totalOrders7d ?? 0).toLocaleString("fr-FR")} cmd/7j`,
    },
    {
      id: "growth",
      label: "Croissance territoriale",
      value: `+${(network?.growthPct ?? commercial?.averageGrowthPct ?? 0).toFixed(1)}%`,
      tone: "signal",
    },
    { id: "stability", label: "Stabilité distribution", value: `${stability}%` },
    { id: "top", label: "Top zone semaine", value: top?.name ?? "—", tone: "signal" },
  ];

  return { metrics, topZoneWeek: top?.name ?? "Abidjan" };
}

export function buildCorridors(map: ProducerMapControlDto | null, supply: ProducerSupplyLogisticsDto | null): TerritoryCorridorRow[] {
  const corridors = map?.corridors ?? [];
  if (!corridors.length) {
    return [
      {
        id: "default",
        label: "Réseau national",
        status: "stable",
        activityPct: 72,
        stability: 80,
        coverage: "CI pilote",
      },
    ];
  }
  return corridors.map((c, i) => {
    let status: TerritoryCorridorRow["status"] = "stable";
    if (c.tension === "high" || (supply?.slowedCorridors ?? 0) > 0) status = "tension";
    else if (supply?.slowedCorridors && i < supply.slowedCorridors) status = "ralenti";
    else status = "actif";
    return {
      id: c.id,
      label: c.label,
      status,
      activityPct: c.tension === "high" ? 58 : c.tension === "medium" ? 74 : 88,
      stability: c.tension === "high" ? 52 : 82,
      coverage: status === "actif" ? "Forte" : "À renforcer",
    };
  });
}

export function buildCityActivity(regions: ProducerMapRegionDto[]): TerritoryCityActivity[] {
  return regions.map((r) => ({
    id: r.id,
    city: r.name,
    commercialActivity: Math.min(99, Math.round((r.wholesalers + r.retailers) / 4)),
    ordersActivity: Math.min(99, Math.round(r.orderVolume7d / 200)),
    networkActivity: Math.min(99, Math.round(r.growthPct * 5)),
    growthPct: r.growthPct,
    trend: r.growthPct >= 10 ? "hausse" : r.growthPct < 7 ? "baisse" : "stable",
  }));
}

export function buildDistributors(commercial: ProducerCommercialNetworkDto | null): TerritoryDistributorRow[] {
  const partners: ProducerPartnerDto[] = [
    ...(commercial?.topWholesalers ?? PRODUCER_TOP_WHOLESALERS),
    ...(commercial?.recentPartners ?? []).slice(0, 4),
  ];
  const regions = regionsSource(commercial);

  return partners.map((p, i) => {
    const city = regions.find((r) => r.id === p.regionId)?.name ?? p.regionId;
    const activity = p.orders7d >= 500 ? "forte" : p.orders7d >= 200 ? "moyenne" : "faible";
    const stability = p.risk === "stable" ? 88 : p.risk === "watch" ? 62 : 45;
    let status: TerritoryDistributorRow["status"] = "actif";
    if (p.orders7d < 150) status = "sous-exploité";
    else if (p.risk === "watch") status = "ralentissement";
    return {
      id: p.id,
      distributor: p.name,
      city,
      activity,
      stability,
      orders: p.orders7d,
      coverage: 2 + (i % 4),
      growth: p.risk === "stable" ? "Hausse" : "Stable",
      status,
    };
  });
}

export function buildRegionalBlocks(regions: ProducerMapRegionDto[]): TerritoryRegionBlock[] {
  const groups: { id: string; region: string; ids: string[] }[] = [
    { id: "nord", region: "Nord", ids: ["korhogo", "man"] },
    { id: "sud", region: "Sud", ids: ["san-pedro", "abidjan"] },
    { id: "centre", region: "Centre", ids: ["yamoussoukro", "bouake"] },
    { id: "ouest", region: "Ouest", ids: ["san-pedro", "abidjan"] },
  ];

  return groups.map((g) => {
    const subset = regions.filter((r) => g.ids.includes(r.id));
    const avgGrowth = subset.length
      ? subset.reduce((s, r) => s + r.growthPct, 0) / subset.length
      : 0;
    const avgActivity = subset.length
      ? subset.reduce((s, r) => s + r.orderVolume7d, 0) / subset.length
      : 0;
    const highTension = subset.some((r) => r.tension === "high");
    return {
      id: g.id,
      region: g.region,
      growthPct: avgGrowth,
      activity: Math.round(avgActivity / 100),
      availability: highTension ? "Moyenne" : "Bonne",
      stability: highTension ? 68 : 84,
      tension: highTension ? "Tension distribution" : "Stable",
    };
  });
}

export function buildOpportunities(
  regions: ProducerMapRegionDto[],
  commercial: ProducerCommercialNetworkDto | null,
): TerritoryOpportunity[] {
  const out: TerritoryOpportunity[] = [];
  const korhogo = regions.find((r) => r.name === "Korhogo");
  if (korhogo && korhogo.growthPct >= 12) {
    out.push({ id: "o1", text: "Présence faible à Korhogo — potentiel de renforcement.", priority: "medium" });
  }
  const sanPedro = regions.find((r) => r.name === "San Pedro");
  if (sanPedro) {
    out.push({ id: "o2", text: "Couverture insuffisante à San Pedro.", priority: "high" });
  }
  out.push({ id: "o3", text: "Corridor Sud en forte activité.", priority: "high" });
  const bouake = regions.find((r) => r.name === "Bouaké");
  if (bouake) {
    out.push({ id: "o4", text: "Distribution stable à Bouaké.", priority: "low" });
  }
  out.push({ id: "o5", text: "Distributeurs actifs à renforcer sur le réseau grossistes.", priority: "medium" });
  if (!out.length) {
    out.push({ id: "o0", text: "Maintenir la couverture sur les territoires pilotes.", priority: "low" });
  }
  return out.slice(0, 6);
}

export function buildTerritoryInsights(
  regions: ProducerMapRegionDto[],
  commercial: ProducerCommercialNetworkDto | null,
  intelligence: ProducerDataIntelligenceDto | null,
  map: ProducerMapControlDto | null,
): TerritoryInsight[] {
  const out: TerritoryInsight[] = [];
  const dynamic = [...regions].sort((a, b) => b.growthPct - a.growthPct)[0];
  if (dynamic) {
    out.push({
      id: "city-up",
      line1: `${dynamic.name} — ville en progression cette semaine.`,
      line2: `+${dynamic.growthPct}% croissance locale`,
      priority: "medium",
    });
  }
  const activeCorridor = map?.corridors?.[0];
  if (activeCorridor) {
    out.push({
      id: "corridor",
      line1: `Corridor actif : ${activeCorridor.label}.`,
      line2: "Flux distribution soutenu",
      priority: "low",
    });
  }
  const topPartner = commercial?.topWholesalers?.[0];
  if (topPartner) {
    out.push({
      id: "dist",
      line1: `${topPartner.name} — distributeur performant.`,
      line2: `${topPartner.orders7d} commandes / 7j`,
      priority: "low",
    });
  }
  const slow = regions.find((r) => r.growthPct < 8);
  if (slow) {
    out.push({
      id: "slow",
      line1: `Ralentissement récent autour de ${slow.name}.`,
      line2: "Opportunité de relance commerciale",
      priority: "medium",
    });
  }
  for (const item of intelligence?.insights?.slice(0, 1) ?? []) {
    out.push({
      id: `intel-${item.id}`,
      line1: sanitizeTerritoryText(item.title),
      line2: sanitizeTerritoryText(item.detail).slice(0, 72),
      priority: item.severity,
    });
  }
  return out.slice(0, 8);
}

export function buildProducerTerritoryView(args: {
  commercial: ProducerCommercialNetworkDto | null;
  network: ProducerNetworkActivityDto | null;
  map: ProducerMapControlDto | null;
  orders: ProducerOrderSummaryDto | null;
  supply: ProducerSupplyLogisticsDto | null;
  intelligence: ProducerDataIntelligenceDto | null;
}): ProducerTerritoryWorkspaceView {
  const map = buildMapWithMan(args.map);
  const regions = enrichMapRegions(map);
  const overviewBlock = buildTerritoryOverview(regions, args.commercial, args.network, args.supply, map);

  return {
    overview: overviewBlock.metrics,
    corridors: buildCorridors(map, args.supply),
    cityActivity: buildCityActivity(regions),
    distributors: buildDistributors(args.commercial),
    regions: buildRegionalBlocks(regions),
    opportunities: buildOpportunities(regions, args.commercial),
    insights: buildTerritoryInsights(regions, args.commercial, args.intelligence, map),
    map,
    topZoneWeek: overviewBlock.topZoneWeek,
    cities: regions.map((r) => r.name),
  };
}
