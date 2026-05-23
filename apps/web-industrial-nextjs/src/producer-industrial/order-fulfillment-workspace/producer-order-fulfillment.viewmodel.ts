import type {
  ProducerAlertDto,
  ProducerCommercialNetworkDto,
  ProducerDataIntelligenceDto,
  ProducerExecutiveDto,
  ProducerMapControlDto,
  ProducerNetworkActivityDto,
  ProducerOrderSummaryDto,
  ProducerSupplyLogisticsDto,
} from "../data/producer-industrial-data.types";
import { PRODUCER_ALERTS, PRODUCER_REGIONS, PRODUCER_TOP_WHOLESALERS } from "../mocks/industrial-mock-data";
import type {
  ProducerCorridorExecution,
  ProducerFlowCard,
  ProducerIncidentRow,
  ProducerOperationalInsight,
  ProducerOrderBucket,
  ProducerOrderFulfillmentView,
  ProducerOrderRow,
  ProducerProofRow,
  ProducerDeliveryMetric,
} from "./producer-order-fulfillment.types";

const FORBIDDEN =
  /observatory|executive supervision|governance instability|dependency concentration|systemic|fulfillmentPressure|supplyStress|dto|prisma/i;

function sanitize(text: string): string {
  if (FORBIDDEN.test(text)) return "Signal opérationnel à suivre sur le réseau.";
  return text;
}

function corridorLabel(name: string): string {
  if (name === "Abidjan") return "Hub Abidjan";
  if (name === "Yamoussoukro") return "Abidjan → Yamoussoukro";
  if (name === "Korhogo") return "Corridor nord";
  return `Axe ${name}`;
}

export function buildOrderBuckets(
  orders: ProducerOrderSummaryDto | null,
  supply: ProducerSupplyLogisticsDto | null,
  commercial: ProducerCommercialNetworkDto | null,
): ProducerOrderBucket[] {
  const total = orders?.totalOrders7d ?? commercial?.totalOrders7d ?? 0;
  const pending = orders?.pendingCount ?? Math.round(total * 0.08);
  const fulfilled = orders?.fulfilledCount ?? Math.round(total * 0.92);
  const critical = Math.max(1, Math.round(pending * 0.15));
  const slowed = supply?.slowedCorridors ?? 1;
  const riskZones =
    commercial?.regions?.filter((r) => r.tension === "high").map((r) => r.name) ?? ["Yamoussoukro"];

  return [
    {
      id: "active",
      label: "Commandes actives",
      count: pending,
      volume: pending,
      stability: 82,
      trend: "hausse",
      zones: commercial?.regions?.slice(0, 2).map((r) => r.name) ?? ["Abidjan"],
      tone: "signal",
    },
    {
      id: "pending",
      label: "En attente",
      count: Math.round(pending * 0.4),
      volume: Math.round(pending * 0.4),
      stability: 74,
      trend: "stable",
      zones: ["Bouaké", "Korhogo"],
      tone: "neutral",
    },
    {
      id: "critical",
      label: "Critiques",
      count: critical,
      volume: critical,
      stability: 48,
      trend: "baisse",
      zones: riskZones,
      tone: "caution",
    },
    {
      id: "slowed",
      label: "Ralenties",
      count: slowed * 12,
      volume: slowed * 120,
      stability: 55,
      trend: "baisse",
      zones: riskZones,
      tone: "caution",
    },
    {
      id: "done",
      label: "Terminées",
      count: fulfilled,
      volume: fulfilled,
      stability: 91,
      trend: "hausse",
      zones: commercial?.regions?.map((r) => r.name).slice(0, 3) ?? PRODUCER_REGIONS.map((r) => r.name),
      tone: "signal",
    },
    {
      id: "corridor-risk",
      label: "Corridor à risque",
      count: Math.max(supply?.tensionZones ?? 1, 1) * 8,
      volume: Math.round(total * 0.05),
      stability: 52,
      trend: "baisse",
      zones: riskZones,
      tone: "caution",
    },
  ];
}

export function buildOrderRows(commercial: ProducerCommercialNetworkDto | null): ProducerOrderRow[] {
  const partners = commercial?.topWholesalers?.length
    ? commercial.topWholesalers
    : PRODUCER_TOP_WHOLESALERS;
  const regions = commercial?.regions?.length ? commercial.regions : PRODUCER_REGIONS;

  return partners.slice(0, 24).map((p, i) => {
    const city = regions.find((r) => r.id === p.regionId)?.name ?? p.regionId;
    const delayDays = p.risk === "elevated" ? 4 : p.risk === "watch" ? 2 : 0;
    const priority = p.risk === "elevated" ? "critique" : p.risk === "watch" ? "warning" : "stable";
    return {
      id: p.id,
      reference: `CMD-${2400 + i}`,
      partner: p.name,
      city,
      status: delayDays > 2 ? "En retard" : delayDays > 0 ? "Sous surveillance" : "En cours",
      corridor: corridorLabel(city),
      volume: p.orders7d,
      delayDays,
      priority,
    };
  });
}

export function buildFulfillmentFlows(
  supply: ProducerSupplyLogisticsDto | null,
  orders: ProducerOrderSummaryDto | null,
): ProducerFlowCard[] {
  const pressure = supply?.supplyPressure ?? 58;
  return [
    {
      id: "progress",
      title: "Progression exécution",
      detail: "Tension exécution maîtrisée sur le réseau pilote",
      progressPct: Math.max(20, 100 - pressure),
      tone: "signal",
    },
    {
      id: "fluid",
      title: "Corridors fluides",
      detail: `${Math.max(0, (supply?.logisticFlowsActive ?? 20) - (supply?.slowedCorridors ?? 1))} flux sans ralentissement`,
      tone: "signal",
    },
    {
      id: "congestion",
      title: "Zones congestionnées",
      detail:
        supply && supply.tensionZones > 0
          ? `${supply.tensionZones} zone(s) sous charge — flux ralentis`
          : "Charge réseau équilibrée",
      tone: supply && supply.tensionZones > 0 ? "caution" : "neutral",
    },
    {
      id: "slow",
      title: "Ralentissements",
      detail: `${supply?.slowedCorridors ?? 0} corridor(s) en rythme réduit`,
      tone: "caution",
    },
    {
      id: "hubs",
      title: "Hubs actifs",
      detail: `${supply?.logisticFlowsActive ?? 24} points d'exécution actifs`,
      tone: "neutral",
    },
    {
      id: "network",
      title: "Exécution réseau",
      detail: `${(orders?.fulfilledCount ?? 0).toLocaleString("fr-FR")} commandes honorées / 7j`,
      tone: "signal",
    },
  ];
}

export function buildDeliveryMetrics(
  supply: ProducerSupplyLogisticsDto | null,
  executive: ProducerExecutiveDto | null,
): ProducerDeliveryMetric[] {
  return [
    {
      id: "processing",
      label: "Temps moyen de traitement",
      value: supply ? `${Math.round(12 + supply.supplyPressure / 10)} h` : "14 h",
      hint: "Indicateur charge réseau",
    },
    {
      id: "delivery",
      label: "Délais livraison",
      value: supply && supply.slowedCorridors > 0 ? "+1,5 j" : "Dans les délais",
    },
    {
      id: "stability",
      label: "Stabilité exécution",
      value: `${executive?.networkStability ?? 86}%`,
    },
    {
      id: "performant",
      label: "Corridors performants",
      value: `${Math.max(1, (supply?.logisticFlowsActive ?? 20) - (supply?.slowedCorridors ?? 1))}`,
    },
    {
      id: "slow-zones",
      label: "Zones lentes",
      value: `${supply?.tensionZones ?? 0}`,
    },
  ];
}

export function buildIncidents(
  alerts: ProducerAlertDto[] | null,
  supply: ProducerSupplyLogisticsDto | null,
  map: ProducerMapControlDto | null,
): ProducerIncidentRow[] {
  const fromAlerts = (alerts?.length ? alerts : PRODUCER_ALERTS.map((a) => ({
    id: a.id,
    level: a.level,
    message: a.message,
    zone: "réseau",
    suggestedAction: "Vérifier le corridor",
  }))).map((a, i) => ({
    id: a.id,
    title: sanitize(a.message),
    zone: a.zone ?? "Réseau CI",
    corridor: map?.corridors[i % Math.max(map.corridors.length, 1)]?.label ?? "Corridor principal",
    priority: (a.level === "critical" ? "critique" : a.level === "warning" ? "warning" : "stable") as
      | "critique"
      | "warning"
      | "stable",
    action: a.suggestedAction ?? "Coordonner avec le grossiste terrain",
  }));

  if (supply && supply.tensionZones > 0) {
    fromAlerts.push({
      id: "supply-tension",
      title: "Tension supply sur corridor sensible",
      zone: "Centre",
      corridor: "Abidjan → Yamoussoukro",
      priority: "warning",
      action: "Prioriser les lots critiques",
    });
  }

  return fromAlerts.slice(0, 10);
}

export function buildProofs(commercial: ProducerCommercialNetworkDto | null): ProducerProofRow[] {
  const partners = [
    ...(commercial?.topWholesalers ?? PRODUCER_TOP_WHOLESALERS).slice(0, 4),
    ...(commercial?.recentPartners ?? []).slice(0, 2),
  ];
  const statuses: ProducerProofRow["status"][] = ["reçu", "confirmé", "validé", "anomalie", "manquant"];

  return partners.map((p, i) => {
    const city = PRODUCER_REGIONS.find((r) => r.id === p.regionId)?.name ?? p.regionId;
    return {
      id: `proof-${p.id}`,
      label: `Lot ${240 + i}`,
      partner: p.name,
      city,
      status: statuses[i % statuses.length]!,
      at: i === 4 ? "En attente" : `Il y a ${i + 1} h`,
    };
  });
}

export function buildCorridorExecution(map: ProducerMapControlDto | null): ProducerCorridorExecution[] {
  const corridors = map?.corridors?.length
    ? map.corridors
    : [
        { id: "c1", label: "Abidjan → Yamoussoukro", tension: "high" as const },
        { id: "c2", label: "Corridor nord", tension: "medium" as const },
      ];

  return corridors.map((c) => {
    const executionPct = c.tension === "high" ? 62 : c.tension === "medium" ? 78 : 92;
    const stability = 100 - executionPct + 20;
    let status: ProducerCorridorExecution["status"] = "stable";
    if (executionPct < 70) status = "sature";
    else if (executionPct >= 85) status = "performant";
    else if (c.tension === "high") status = "tension";
    return {
      id: c.id,
      label: c.label,
      executionPct,
      stability: Math.min(99, stability),
      status,
      territory: c.label.split("→")[0]?.trim() ?? "Réseau CI",
    };
  });
}

export function buildOperationalInsights(
  intelligence: ProducerDataIntelligenceDto | null,
  supply: ProducerSupplyLogisticsDto | null,
  commercial: ProducerCommercialNetworkDto | null,
  alerts: ProducerAlertDto[] | null,
): ProducerOperationalInsight[] {
  const out: ProducerOperationalInsight[] = [];

  const bouake = commercial?.regions?.find((r) => r.name === "Bouaké");
  if (bouake) {
    out.push({
      id: "i-bouake",
      text: "Les livraisons ralentissent vers Bouaké.",
      priority: supply && supply.slowedCorridors > 0 ? "high" : "medium",
    });
  }

  out.push({
    id: "i-north",
    text: "Le corridor nord reste stable.",
    priority: "low",
  });

  if ((commercial?.totalOrders7d ?? 0) > 10000) {
    out.push({
      id: "i-wholesale",
      text: "Les commandes grossistes augmentent.",
      priority: "medium",
    });
  }

  for (const item of intelligence?.insights?.slice(0, 2) ?? []) {
    out.push({
      id: `intel-${item.id}`,
      text: sanitize(`${item.title}. ${item.detail}`),
      priority: item.severity,
    });
  }

  const criticalAlert = alerts?.find((a) => a.level === "critical");
  if (criticalAlert) {
    out.push({
      id: "alert-derived",
      text: sanitize(criticalAlert.message),
      priority: "high",
    });
  }

  if (!out.length) {
    out.push({
      id: "default",
      text: "L'exécution réseau reste sous contrôle — surveillez les corridors en tension.",
      priority: "low",
    });
  }

  return out.slice(0, 8);
}

export function buildOrderFulfillmentView(args: {
  orders: ProducerOrderSummaryDto | null;
  network: ProducerNetworkActivityDto | null;
  supply: ProducerSupplyLogisticsDto | null;
  map: ProducerMapControlDto | null;
  alerts: ProducerAlertDto[] | null;
  commercial: ProducerCommercialNetworkDto | null;
  intelligence: ProducerDataIntelligenceDto | null;
  executive: ProducerExecutiveDto | null;
}): ProducerOrderFulfillmentView {
  const executionPressure = args.supply?.supplyPressure ?? 58;
  return {
    orderBuckets: buildOrderBuckets(args.orders, args.supply, args.commercial),
    orderRows: buildOrderRows(args.commercial),
    fulfillmentFlows: buildFulfillmentFlows(args.supply, args.orders),
    deliveryMetrics: buildDeliveryMetrics(args.supply, args.executive),
    deliveryByCity: (args.commercial?.regions ?? PRODUCER_REGIONS).map((r) => ({
      city: r.name,
      avgDays: r.tension === "high" ? 3.2 : r.tension === "medium" ? 2.1 : 1.4,
      status: r.tension === "high" ? "Lent" : r.tension === "medium" ? "Stable" : "Rapide",
    })),
    incidents: buildIncidents(args.alerts, args.supply, args.map),
    proofs: buildProofs(args.commercial),
    corridors: buildCorridorExecution(args.map),
    map: args.map,
    insights: buildOperationalInsights(args.intelligence, args.supply, args.commercial, args.alerts),
    networkStability: args.executive?.networkStability ?? args.network?.growthPct ?? 86,
    executionPressure,
  };
}
