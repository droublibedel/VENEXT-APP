import type {
  ProducerCommercialNetworkDto,
  ProducerDataIntelligenceDto,
  ProducerMapControlDto,
  ProducerMarketingActivationDto,
  ProducerNetworkActivityDto,
  ProducerOrderSummaryDto,
  ProducerPartnerDto,
  ProducerProductTrendDto,
  ProducerSupplyLogisticsDto,
} from "../data/producer-industrial-data.types";
import { PRODUCER_REGIONS } from "../mocks/industrial-mock-data";
import type {
  RelationalCommercialInsight,
  RelationalCommercialWorkspaceView,
  RelationalCorridorRow,
  RelationalOrderFlowCard,
  RelationalPartnerRow,
  RelationalTerritoryZone,
} from "./relational-commercial-workspace.types";

const FORBIDDEN_TERMS =
  /systemic|dependency exposure|governance pressure|observatory|relational layer|dto|prisma|ingestion|macro-observatory|synthesis node/i;

function cityLabel(regionId: string, regions: { id: string; name: string }[]): string {
  return regions.find((r) => r.id === regionId)?.name ?? regionId;
}

function corridorForRegion(regionName: string): string {
  if (regionName === "Abidjan") return "Abidjan hub";
  if (regionName === "Yamoussoukro") return "Abidjan → Yamoussoukro";
  if (regionName === "Korhogo") return "Corridor nord";
  if (regionName === "Bouaké") return "Centre-est";
  if (regionName === "San Pedro") return "Axe portuaire";
  return `Réseau ${regionName}`;
}

function partnerActivity(orders7d: number): RelationalPartnerRow["activity"] {
  if (orders7d >= 400) return "forte";
  if (orders7d >= 150) return "moyenne";
  return "faible";
}

function stabilityScore(risk: ProducerPartnerDto["risk"]): number {
  if (risk === "stable") return 88;
  if (risk === "watch") return 62;
  return 41;
}

function partnerTrend(
  risk: ProducerPartnerDto["risk"],
  orders7d: number,
): RelationalPartnerRow["trend"] {
  if (risk === "elevated") return "baisse";
  if (orders7d >= 400 && risk === "stable") return "hausse";
  if (risk === "watch") return "baisse";
  return "stable";
}

function segmentForPartner(
  p: ProducerPartnerDto,
  isRecent: boolean,
): RelationalPartnerRow["segment"] {
  if (isRecent) return "nouveau";
  if (p.risk === "elevated") return "critique";
  if (p.revenueXof >= 25_000_000) return "dependance";
  if (p.orders7d < 120) return "silencieux";
  if (p.orders7d >= 400) return "croissance";
  return "actif";
}

export function mapPartnersToRows(
  commercial: ProducerCommercialNetworkDto | null,
  partners: ProducerPartnerDto[] | null,
): RelationalPartnerRow[] {
  const regions = commercial?.regions?.length ? commercial.regions : PRODUCER_REGIONS;
  const recentIds = new Set(commercial?.recentPartners?.map((p) => p.id) ?? []);
  const source =
    partners?.length
      ? partners
      : [...(commercial?.topWholesalers ?? []), ...(commercial?.recentPartners ?? [])];

  return source.map((p) => {
    const city = cityLabel(p.regionId, regions);
    return {
      id: p.id,
      partner: p.name,
      city,
      activity: partnerActivity(p.orders7d),
      stability: stabilityScore(p.risk),
      orders: p.orders7d,
      trend: partnerTrend(p.risk, p.orders7d),
      corridor: corridorForRegion(city),
      segment: segmentForPartner(p, recentIds.has(p.id)),
    };
  });
}

export function buildCorridors(
  map: ProducerMapControlDto | null,
  supply: ProducerSupplyLogisticsDto | null,
): RelationalCorridorRow[] {
  const fromMap = map?.corridors ?? [];
  return fromMap.map((c) => {
    let status: RelationalCorridorRow["status"] = "stable";
    if (c.tension === "high") status = supply && supply.slowedCorridors > 0 ? "critique" : "tension";
    else if (c.tension === "medium") status = "dependant";
    else status = "croissance";
    return {
      id: c.id,
      label: c.label,
      status,
      pressurePct: c.tension === "high" ? 78 : c.tension === "medium" ? 52 : 28,
    };
  });
}

export function buildOrderFlows(
  orders: ProducerOrderSummaryDto | null,
  commercial: ProducerCommercialNetworkDto | null,
  supply: ProducerSupplyLogisticsDto | null,
): RelationalOrderFlowCard[] {
  const total = orders?.totalOrders7d ?? commercial?.totalOrders7d ?? 0;
  const pending = orders?.pendingCount ?? Math.round(total * 0.08);
  const fulfilled = orders?.fulfilledCount ?? Math.round(total * 0.92);
  const cards: RelationalOrderFlowCard[] = [
    {
      id: "active",
      title: "Commandes actives",
      detail: `${pending.toLocaleString("fr-FR")} flux en cours sur le réseau`,
      tone: "signal",
      volume: pending,
    },
    {
      id: "fulfilled",
      title: "Flux honorés",
      detail: `${fulfilled.toLocaleString("fr-FR")} commandes traitées sur 7 jours`,
      tone: "neutral",
      volume: fulfilled,
    },
    {
      id: "demand",
      title: "Zones à forte demande",
      detail: `${commercial?.regions?.filter((r) => r.growthPct >= 12).length ?? 0} territoires en accélération`,
      tone: "signal",
    },
    {
      id: "slow",
      title: "Flux ralentis",
      detail:
        supply && supply.slowedCorridors > 0
          ? `${supply.slowedCorridors} corridor(s) avec rythme réduit`
          : "Rythme global stable cette semaine",
      tone: supply && supply.slowedCorridors > 0 ? "caution" : "neutral",
    },
    {
      id: "congestion",
      title: "Corridors congestionnés",
      detail:
        supply && supply.tensionZones > 0
          ? `${supply.tensionZones} zone(s) sous pression logistique`
          : "Pas de congestion majeure signalée",
      tone: supply && supply.tensionZones > 0 ? "caution" : "neutral",
    },
    {
      id: "processing",
      title: "Temps moyen de traitement",
      detail: supply ? `Indice charge réseau : ${supply.supplyPressure}%` : "Traitement dans les délais habituels",
      tone: "neutral",
    },
  ];
  return cards;
}

function sanitizeInsight(text: string): string {
  if (FORBIDDEN_TERMS.test(text)) {
    return "Le réseau montre une dynamique à surveiller sur ce territoire.";
  }
  return text;
}

export function buildHumanInsights(
  intelligence: ProducerDataIntelligenceDto | null,
  commercial: ProducerCommercialNetworkDto | null,
  map: ProducerMapControlDto | null,
  supply: ProducerSupplyLogisticsDto | null,
): RelationalCommercialInsight[] {
  const out: RelationalCommercialInsight[] = [];

  for (const item of intelligence?.insights ?? []) {
    out.push({
      id: item.id,
      text: sanitizeInsight(`${item.title} — ${item.detail}`),
      priority: item.severity,
    });
  }

  const bouake = commercial?.regions?.find((r) => r.name === "Bouaké");
  if (bouake && bouake.growthPct >= 8) {
    out.push({
      id: "derived-bouake",
      text: "La demande augmente fortement à Bouaké.",
      priority: "medium",
    });
  }

  const yamCorridor = map?.corridors?.find((c) => c.label.toLowerCase().includes("yamoussoukro"));
  if (yamCorridor && (yamCorridor.tension === "high" || (supply?.slowedCorridors ?? 0) > 0)) {
    out.push({
      id: "derived-yam",
      text: "Le corridor Abidjan → Yamoussoukro ralentit.",
      priority: "high",
    });
  }

  const korhogo = commercial?.regions?.find((r) => r.name === "Korhogo");
  if (korhogo && korhogo.growthPct >= 12) {
    out.push({
      id: "derived-north",
      text: "Les grossistes du nord accélèrent leurs commandes.",
      priority: "medium",
    });
  }

  if (!out.length) {
    out.push({
      id: "default-1",
      text: "Le réseau reste actif — surveillez les corridors à forte croissance.",
      priority: "low",
    });
  }

  return out.slice(0, 8);
}

export function buildTerritories(map: ProducerMapControlDto | null): RelationalTerritoryZone[] {
  const regions = map?.regions?.length ? map.regions : PRODUCER_REGIONS;
  const maxVol = Math.max(...regions.map((r) => r.orderVolume7d), 1);
  return regions.map((r) => ({
    id: r.id,
    name: r.name,
    coveragePct: Math.round((r.wholesalers + r.retailers) / 4),
    growthPct: r.growthPct,
    tension: r.tension,
    lat: r.lat,
    lng: r.lng,
  }));
}

export function buildProductRotation(products: ProducerProductTrendDto[] | null, marketing: ProducerMarketingActivationDto | null) {
  const list = products?.length ? products : marketing?.products ?? [];
  return list.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    momentum: p.momentum,
    demandPressure: p.demandPressure,
    rotation: (p.demandPressure >= 70 ? "rapide" : p.demandPressure >= 45 ? "normale" : "lente") as
      | "rapide"
      | "normale"
      | "lente",
  }));
}

export function buildRelationalCommercialView(args: {
  commercial: ProducerCommercialNetworkDto | null;
  partners: ProducerPartnerDto[] | null;
  orders: ProducerOrderSummaryDto | null;
  map: ProducerMapControlDto | null;
  supply: ProducerSupplyLogisticsDto | null;
  marketing: ProducerMarketingActivationDto | null;
  products: ProducerProductTrendDto[] | null;
  intelligence: ProducerDataIntelligenceDto | null;
  network: ProducerNetworkActivityDto | null;
}): RelationalCommercialWorkspaceView {
  const partners = mapPartnersToRows(args.commercial, args.partners);
  const segments = {
    actifs: partners.filter((p) => p.segment === "actif").length,
    croissance: partners.filter((p) => p.segment === "croissance").length,
    silencieux: partners.filter((p) => p.segment === "silencieux").length,
    nouveaux: partners.filter((p) => p.segment === "nouveau").length,
    critiques: partners.filter((p) => p.segment === "critique").length,
    dependances: partners.filter((p) => p.segment === "dependance").length,
  };

  const regions = args.commercial?.regions?.length ? args.commercial.regions : PRODUCER_REGIONS;
  const corridors = buildCorridors(args.map, args.supply);

  return {
    partners,
    partnerSegments: segments,
    orderFlows: buildOrderFlows(args.orders, args.commercial, args.supply),
    corridors,
    activityByCity: regions.map((r) => ({
      city: r.name,
      orders7d: r.orderVolume7d,
      growthPct: r.growthPct,
    })),
    activityByCorridor: corridors.map((c) => ({
      corridor: c.label,
      orders7d: Math.round((args.orders?.totalOrders7d ?? 0) / Math.max(corridors.length, 1)),
    })),
    recentOrdersLabel: `${(args.orders?.totalOrders7d ?? args.commercial?.totalOrders7d ?? 0).toLocaleString("fr-FR")} commandes / 7j`,
    networkGrowthPct: args.network?.growthPct ?? args.commercial?.averageGrowthPct ?? 0,
    silentZones: regions.filter((r) => r.growthPct < 8).map((r) => r.name),
    timeline: [
      { id: "t1", label: "Pic commandes Abidjan", value: "↑ 12%", at: "Il y a 2 h" },
      { id: "t2", label: "Activation Korhogo", value: "94% objectif", at: "Il y a 5 h" },
      { id: "t3", label: "Flux Yamoussoukro", value: "Surveillance", at: "Aujourd'hui" },
      { id: "t4", label: "Réseau global", value: `${args.network?.activePartners ?? 0} partenaires`, at: "7 jours" },
    ],
    products: buildProductRotation(args.products, args.marketing),
    territories: buildTerritories(args.map),
    dominatedCities: regions
      .filter((r) => r.orderVolume7d >= 5000)
      .map((r) => r.name),
    weakZones: regions.filter((r) => r.growthPct < 8).map((r) => r.name),
    missingCorridors: ["Man · Odienné"].filter(
      () => !corridors.some((c) => c.label.toLowerCase().includes("odienné")),
    ),
    insights: buildHumanInsights(args.intelligence, args.commercial, args.map, args.supply),
  };
}
