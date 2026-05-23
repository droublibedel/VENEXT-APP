import type {
  ProducerAlertDto,
  ProducerCommercialNetworkDto,
  ProducerDataIntelligenceDto,
  ProducerMapControlDto,
  ProducerMapRegionDto,
  ProducerMarketingActivationDto,
  ProducerNetworkActivityDto,
  ProducerOrderSummaryDto,
  ProducerSupplyLogisticsDto,
} from "../data/producer-industrial-data.types";
import { PRODUCER_REGIONS } from "../mocks/industrial-mock-data";
import type {
  ProducerSupplyWorkspaceView,
  SupplyCorridorRow,
  SupplyDeliveryTensionItem,
  SupplyFlowRow,
  SupplyHubRow,
  SupplyInsight,
  SupplyOverviewMetric,
} from "./producer-supply.types";

const FORBIDDEN =
  /governance|orchestration|observatory|synthesis|systemic collapse|systemicPressure|systemicExposure|executiveExposure|strategicAlignment|governancePriority|macro supervision|dto|prisma/i;

export function sanitizeSupplyText(text: string): string {
  if (FORBIDDEN.test(text)) return "Signal logistique à suivre sur le réseau.";
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

export function buildSupplyOverview(
  supply: ProducerSupplyLogisticsDto | null,
  regions: ProducerMapRegionDto[],
  map: ProducerMapControlDto | null,
  network: ProducerNetworkActivityDto | null,
  orders: ProducerOrderSummaryDto | null,
): { metrics: SupplyOverviewMetric[]; topHubWeek: string } {
  const stableCorridors = map?.corridors?.filter((c) => c.tension === "low").length ?? 1;
  const activeHubs = regions.filter((r) => r.orderVolume7d > 2500).length;
  const topHub = [...regions].sort((a, b) => b.orderVolume7d - a.orderVolume7d)[0];
  const executionSpeed = Math.round(100 - (supply?.supplyPressure ?? 50) / 2);
  const stability = Math.round(90 - (supply?.tensionZones ?? 0) * 8);

  const metrics: SupplyOverviewMetric[] = [
    {
      id: "flows",
      label: "Flux actifs",
      value: String(supply?.logisticFlowsActive ?? 0),
      tone: "signal",
    },
    { id: "hubs", label: "Hubs logistiques actifs", value: String(activeHubs), tone: "signal" },
    { id: "stable", label: "Corridors stables", value: String(stableCorridors) },
    {
      id: "delivery",
      label: "Tensions livraison",
      value: String(supply?.tensionZones ?? 0),
      tone: (supply?.tensionZones ?? 0) > 0 ? "caution" : "neutral",
    },
    {
      id: "availability",
      label: "Disponibilité réseau",
      value: `${supply?.distributionActivity ?? 0}%`,
    },
    { id: "speed", label: "Vitesse exécution", value: `${executionSpeed}%`, tone: "signal" },
    { id: "stability", label: "Stabilité supply", value: `${stability}%` },
    {
      id: "week",
      label: "Activité semaine",
      value: `${(orders?.totalOrders7d ?? network?.orders7d ?? 0).toLocaleString("fr-FR")} cmd`,
      tone: "signal",
    },
  ];

  return { metrics, topHubWeek: topHub?.name ?? "Abidjan" };
}

export function buildSupplyCorridors(
  map: ProducerMapControlDto | null,
  supply: ProducerSupplyLogisticsDto | null,
): SupplyCorridorRow[] {
  const corridors = map?.corridors ?? [];
  if (!corridors.length) {
    return [
      {
        id: "default",
        label: "Réseau logistique national",
        status: "fluide",
        transportActivity: 78,
        executionStability: 82,
        logisticsPressure: "Modérée",
      },
    ];
  }
  return corridors.map((c, i) => {
    const slowed = supply?.slowedCorridors && i < supply.slowedCorridors;
    let status: SupplyCorridorRow["status"] = "fluide";
    if (c.tension === "high" || slowed) status = "tension";
    else if (c.tension === "medium" || slowed) status = "ralenti";
    return {
      id: c.id,
      label: c.label,
      status,
      transportActivity: c.tension === "high" ? 52 : c.tension === "medium" ? 70 : 88,
      executionStability: c.tension === "high" ? 55 : 84,
      logisticsPressure:
        c.tension === "high" ? "Élevée" : c.tension === "medium" ? "Modérée" : "Faible",
    };
  });
}

export function buildSupplyFlows(
  regions: ProducerMapRegionDto[],
  supply: ProducerSupplyLogisticsDto | null,
  map: ProducerMapControlDto | null,
): SupplyFlowRow[] {
  const critical = map?.corridors?.filter((c) => c.tension === "high").length ?? 0;
  return regions.map((r) => {
    let speed: SupplyFlowRow["speed"] = "stable";
    if (r.growthPct >= 10 && r.tension !== "high") speed = "rapide";
    else if (r.tension === "high" || r.growthPct < 7) speed = "ralenti";
    return {
      id: r.id,
      label: `Flux ${r.name}`,
      speed,
      congestion: r.tension === "high" ? "Congestion locale" : "Fluide",
      delayRisk: r.tension === "high" ? "Risque retard" : "Faible",
      corridorNote:
        critical > 0 && r.tension === "high"
          ? "Corridor sensible"
          : speed === "rapide"
            ? "Exécution stable"
            : "À surveiller",
    };
  });
}

export function buildSupplyHubs(regions: ProducerMapRegionDto[]): SupplyHubRow[] {
  return regions.map((r) => {
    const flux = Math.round((r.wholesalers + r.retailers) / 2);
    const execution = Math.min(99, Math.round(r.orderVolume7d / 200));
    const activity: SupplyHubRow["activity"] =
      r.orderVolume7d >= 5000 ? "forte" : r.orderVolume7d >= 2500 ? "moyenne" : "faible";
    const stability = r.tension === "high" ? 58 : r.tension === "medium" ? 72 : 88;
    let status: SupplyHubRow["status"] = "stable";
    if (r.tension === "high") status = "sous pression";
    else if (r.orderVolume7d >= 5000) status = "actif";
    else if (r.tension === "medium") status = "à surveiller";
    return {
      id: r.id,
      hub: `Hub ${r.name}`,
      city: r.name,
      activity,
      stability,
      flux,
      execution,
      growth: `+${r.growthPct}%`,
      status,
    };
  });
}

export function buildDeliveryTension(
  supply: ProducerSupplyLogisticsDto | null,
  regions: ProducerMapRegionDto[],
  alerts: ProducerAlertDto[] | null,
  map: ProducerMapControlDto | null,
): SupplyDeliveryTensionItem[] {
  const out: SupplyDeliveryTensionItem[] = [];
  if ((supply?.slowedCorridors ?? 0) > 0) {
    out.push({
      id: "slow",
      label: "Ralentissements corridor",
      detail: `${supply?.slowedCorridors} corridor(s) en ralentissement cette semaine.`,
      tone: "caution",
    });
  }
  const highTension = regions.filter((r) => r.tension === "high");
  for (const r of highTension) {
    out.push({
      id: `hub-${r.id}`,
      label: `Hub sous pression · ${r.name}`,
      detail: "Tension livraison locale — prioriser l'exécution terrain.",
      tone: "caution",
    });
  }
  const sensitive = map?.corridors?.filter((c) => c.tension !== "low") ?? [];
  if (sensitive.length) {
    out.push({
      id: "corridor",
      label: "Corridors sensibles",
      detail: `${sensitive.length} axe(s) à suivre pour éviter les retards.`,
      tone: "signal",
    });
  }
  for (const a of alerts?.filter((x) => x.level !== "info").slice(0, 2) ?? []) {
    out.push({
      id: `alert-${a.id}`,
      label: sanitizeSupplyText(a.message).slice(0, 48),
      detail: a.suggestedAction ?? "Exécution terrain à confirmer",
      tone: a.level === "critical" ? "caution" : "neutral",
    });
  }
  if (!out.length) {
    out.push({
      id: "ok",
      label: "Exécution terrain stable",
      detail: "Aucune tension livraison majeure signalée.",
      tone: "signal",
    });
  }
  return out.slice(0, 8);
}

export function buildSupplyInsights(
  regions: ProducerMapRegionDto[],
  supply: ProducerSupplyLogisticsDto | null,
  map: ProducerMapControlDto | null,
  intelligence: ProducerDataIntelligenceDto | null,
): SupplyInsight[] {
  const out: SupplyInsight[] = [];
  const topHub = [...regions].sort((a, b) => b.orderVolume7d - a.orderVolume7d)[0];
  if (topHub) {
    out.push({
      id: "hub",
      line1: `${topHub.name} — hub logistique le plus actif.`,
      line2: `${topHub.orderVolume7d.toLocaleString("fr-FR")} commandes / 7j`,
      priority: "low",
    });
  }
  const stable = map?.corridors?.find((c) => c.tension === "low");
  if (stable) {
    out.push({
      id: "corridor",
      line1: `Corridor stable : ${stable.label}.`,
      line2: "Flux soutenu sur l'axe",
      priority: "low",
    });
  }
  if ((supply?.tensionZones ?? 0) > 0) {
    out.push({
      id: "tension",
      line1: `${supply?.tensionZones} zone(s) sous tension livraison.`,
      line2: "Prioriser les hubs concernés",
      priority: "medium",
    });
  }
  const slow = regions.find((r) => r.tension === "high");
  if (slow) {
    out.push({
      id: "slow",
      line1: `Ralentissement logistique autour de ${slow.name}.`,
      line2: "Opportunité de fluidifier les flux",
      priority: "medium",
    });
  }
  out.push({
    id: "opp",
    line1: "Opportunité : renforcer les hubs secondaires en croissance.",
    line2: "Couverture logistique à étendre",
    priority: "low",
  });
  for (const item of intelligence?.insights?.slice(0, 1) ?? []) {
    out.push({
      id: `intel-${item.id}`,
      line1: sanitizeSupplyText(item.title),
      line2: sanitizeSupplyText(item.detail).slice(0, 72),
      priority: item.severity,
    });
  }
  return out.slice(0, 8);
}

export function buildProducerSupplyView(args: {
  supply: ProducerSupplyLogisticsDto | null;
  orders: ProducerOrderSummaryDto | null;
  map: ProducerMapControlDto | null;
  network: ProducerNetworkActivityDto | null;
  commercial: ProducerCommercialNetworkDto | null;
  intelligence: ProducerDataIntelligenceDto | null;
  marketing: ProducerMarketingActivationDto | null;
  alerts: ProducerAlertDto[] | null;
}): ProducerSupplyWorkspaceView {
  const map = buildMapWithMan(args.map);
  const regions = enrichMapRegions(map);
  const overviewBlock = buildSupplyOverview(
    args.supply,
    regions,
    map,
    args.network,
    args.orders,
  );

  return {
    overview: overviewBlock.metrics,
    corridors: buildSupplyCorridors(map, args.supply),
    flows: buildSupplyFlows(regions, args.supply, map),
    hubs: buildSupplyHubs(regions),
    deliveryTension: buildDeliveryTension(args.supply, regions, args.alerts, map),
    insights: buildSupplyInsights(regions, args.supply, map, args.intelligence),
    map,
    topHubWeek: overviewBlock.topHubWeek,
    cities: regions.map((r) => r.name),
  };
}
