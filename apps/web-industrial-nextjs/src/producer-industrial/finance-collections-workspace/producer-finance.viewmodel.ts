import type {
  ProducerAlertDto,
  ProducerCommercialNetworkDto,
  ProducerDataIntelligenceDto,
  ProducerFinanceCollectionsDto,
  ProducerMapControlDto,
  ProducerMapRegionDto,
  ProducerNetworkActivityDto,
  ProducerOrderSummaryDto,
  ProducerPartnerDto,
  ProducerSupplyLogisticsDto,
} from "../data/producer-industrial-data.types";
import { formatXof, PRODUCER_REGIONS, PRODUCER_TOP_WHOLESALERS } from "../mocks/industrial-mock-data";
import type {
  FinanceCollectionRow,
  FinanceCoverageBlock,
  FinanceInsight,
  FinanceOverviewMetric,
  FinancePartnerRiskItem,
  FinanceStabilityBlock,
  ProducerFinanceWorkspaceView,
} from "./producer-finance.types";

const FORBIDDEN =
  /governance|orchestration|observatory|synthesis|systemic collapse|systemicPressure|systemicExposure|executiveExposure|executive escalation|executive instability|strategicAlignment|governancePriority|macro supervision|dto|prisma/i;

export function sanitizeFinanceText(text: string): string {
  if (FORBIDDEN.test(text)) return "Signal financier à suivre sur le réseau.";
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

function partnersSource(
  finance: ProducerFinanceCollectionsDto | null,
  commercial: ProducerCommercialNetworkDto | null,
): ProducerPartnerDto[] {
  const list = [
    ...(finance?.atRiskPartnerList ?? []),
    ...(commercial?.topWholesalers ?? PRODUCER_TOP_WHOLESALERS),
    ...(commercial?.recentPartners ?? []),
  ];
  const seen = new Set<string>();
  return list.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

export function buildFinanceOverview(
  finance: ProducerFinanceCollectionsDto | null,
  commercial: ProducerCommercialNetworkDto | null,
  network: ProducerNetworkActivityDto | null,
  regions: ProducerMapRegionDto[],
): FinanceOverviewMetric[] {
  const partners = partnersSource(finance, commercial);
  const stable = partners.filter((p) => p.risk === "stable").length;
  const watch = partners.filter((p) => p.risk !== "stable").length;
  const topTerritory = [...regions].sort((a, b) => b.orderVolume7d - a.orderVolume7d)[0];
  const globalStability = finance?.networkFinancialStability ?? 80;

  return [
    {
      id: "stability",
      label: "Stabilité encaissements",
      value: `${globalStability}%`,
      tone: globalStability >= 75 ? "signal" : "caution",
    },
    {
      id: "inflow",
      label: "Flux entrants",
      value: formatXof(finance?.collections7dXof ?? 0),
      tone: "signal",
    },
    { id: "stable", label: "Partenaires stables", value: String(stable), tone: "signal" },
    {
      id: "watch",
      label: "Partenaires à surveiller",
      value: String(finance?.atRiskPartners ?? watch),
      tone: watch > 0 ? "caution" : "neutral",
    },
    {
      id: "delays",
      label: "Retards moyens",
      value: `${finance?.paymentDelaysDays ?? 0} j`,
      tone: (finance?.paymentDelaysDays ?? 0) > 5 ? "caution" : "neutral",
    },
    {
      id: "activity",
      label: "Activité financière réseau",
      value: `${finance?.paymentPressure ?? 0}%`,
    },
    {
      id: "territory",
      label: "Territoires performants",
      value: topTerritory?.name ?? "—",
      tone: "signal",
    },
    {
      id: "global",
      label: "Stabilité globale",
      value: `${Math.round(100 - (finance?.paymentPressure ?? 0) / 3)}%`,
    },
  ];
}

export function buildCollectionRows(
  finance: ProducerFinanceCollectionsDto | null,
  commercial: ProducerCommercialNetworkDto | null,
): FinanceCollectionRow[] {
  const partners = partnersSource(finance, commercial);
  const regions = commercial?.regions?.length ? commercial.regions : PRODUCER_REGIONS;

  return partners.map((p) => {
    const city = regions.find((r) => r.id === p.regionId)?.name ?? p.regionId;
    const stability = p.risk === "stable" ? 88 : p.risk === "watch" ? 62 : 42;
    const activity: FinanceCollectionRow["activity"] =
      p.orders7d >= 400 ? "forte" : p.orders7d >= 150 ? "moyenne" : "faible";
    let status: FinanceCollectionRow["status"] = "stable";
    if (p.risk === "elevated") status = "critique";
    else if (p.risk === "watch") status = "surveiller";
    return {
      id: p.id,
      partner: p.name,
      city,
      volume: formatXof(p.revenueXof),
      stability,
      delays: p.risk === "stable" ? "0-2 j" : p.risk === "watch" ? "3-7 j" : "8+ j",
      activity,
      evolution: p.orders7d >= 400 ? "Hausse" : "Stable",
      status,
    };
  });
}

export function buildPaymentStability(
  finance: ProducerFinanceCollectionsDto | null,
  map: ProducerMapControlDto | null,
  regions: ProducerMapRegionDto[],
): FinanceStabilityBlock[] {
  const stableCorridors = map?.corridors?.filter((c) => c.tension === "low").length ?? 0;
  const sensitive = map?.corridors?.filter((c) => c.tension !== "low").length ?? 0;
  const topRegion = [...regions].sort((a, b) => b.growthPct - a.growthPct)[0];

  return [
    {
      id: "stable",
      label: "Paiements stables",
      value: `${finance?.networkFinancialStability ?? 0}%`,
      detail: "Encaissements réguliers sur le réseau",
      tone: "signal",
    },
    {
      id: "slow",
      label: "Ralentissements",
      value: String(sensitive),
      detail: "Corridors ou partenaires à relancer",
      tone: sensitive > 0 ? "caution" : "neutral",
    },
    {
      id: "pressure",
      label: "Pression encaissement",
      value: `${finance?.paymentPressure ?? 0}%`,
      detail: "Tension sur les délais de paiement",
      tone: (finance?.paymentPressure ?? 0) > 55 ? "caution" : "neutral",
    },
    {
      id: "corridors",
      label: "Corridors sensibles",
      value: String(sensitive),
      detail: `${stableCorridors} corridor(s) stable(s)`,
      tone: "neutral",
    },
    {
      id: "regional",
      label: "Stabilité régionale",
      value: topRegion?.name ?? "CI",
      detail: topRegion ? `+${topRegion.growthPct}% activité locale` : undefined,
      tone: "signal",
    },
  ];
}

export function buildPartnerRisks(
  finance: ProducerFinanceCollectionsDto | null,
  commercial: ProducerCommercialNetworkDto | null,
): FinancePartnerRiskItem[] {
  const partners = partnersSource(finance, commercial);
  const regions = commercial?.regions?.length ? commercial.regions : PRODUCER_REGIONS;
  const out: FinancePartnerRiskItem[] = [];

  for (const p of partners) {
    const city = regions.find((r) => r.id === p.regionId)?.name ?? p.regionId;
    let category: FinancePartnerRiskItem["category"] = "fiable";
    if (p.risk === "elevated") category = "critique";
    else if (p.risk === "watch") category = "ralenti";
    else if (p.orders7d < 150) category = "irrégulier";
    out.push({
      id: p.id,
      name: p.name,
      city,
      category,
      note:
        category === "fiable"
          ? "Encaissements réguliers"
          : category === "critique"
            ? "Risque opérationnel à traiter"
            : "Suivi recommandé",
    });
  }
  return out.slice(0, 12);
}

export function buildFinanceCoverage(
  finance: ProducerFinanceCollectionsDto | null,
  regions: ProducerMapRegionDto[],
  map: ProducerMapControlDto | null,
): FinanceCoverageBlock[] {
  const under = regions.filter((r) => r.growthPct < 8 || r.tension === "high").length;
  const profitable = map?.corridors?.filter((c) => c.tension === "low").length ?? 0;
  const stablePartners = partnersSource(finance, null).filter((p) => p.risk === "stable").length;

  return [
    {
      id: "network",
      label: "Couverture financière réseau",
      value: `${finance?.networkFinancialStability ?? 0}%`,
      tone: "signal",
    },
    {
      id: "under",
      label: "Zones sous-performantes",
      value: String(under),
      tone: under > 0 ? "caution" : "neutral",
    },
    {
      id: "corridors",
      label: "Corridors rentables",
      value: String(profitable),
      tone: "signal",
    },
    {
      id: "activity",
      label: "Activité financière",
      value: formatXof(finance?.collections7dXof ?? 0),
    },
    {
      id: "partners",
      label: "Stabilité partenaires",
      value: `${stablePartners} stable(s)`,
      tone: "signal",
    },
  ];
}

export function buildFinanceInsights(
  finance: ProducerFinanceCollectionsDto | null,
  commercial: ProducerCommercialNetworkDto | null,
  regions: ProducerMapRegionDto[],
  intelligence: ProducerDataIntelligenceDto | null,
  alerts: ProducerAlertDto[] | null,
): FinanceInsight[] {
  const out: FinanceInsight[] = [];
  const topPartner = commercial?.topWholesalers?.[0] ?? partnersSource(finance, commercial)[0];
  if (topPartner) {
    out.push({
      id: "perf",
      line1: `${topPartner.name} — partenaire performant.`,
      line2: `${formatXof(topPartner.revenueXof)} encaissé / période`,
      priority: "low",
    });
  }
  const slow = partnersSource(finance, commercial).find((p) => p.risk === "watch");
  if (slow) {
    out.push({
      id: "slow",
      line1: `Ralentissement observé — ${slow.name}.`,
      line2: "Relance encaissement recommandée",
      priority: "medium",
    });
  }
  const strong = [...regions].sort((a, b) => b.orderVolume7d - a.orderVolume7d)[0];
  if (strong) {
    out.push({
      id: "zone",
      line1: `${strong.name} — zone forte en encaissements.`,
      line2: "Couverture financière soutenue",
      priority: "low",
    });
  }
  if ((finance?.paymentPressure ?? 0) > 55) {
    out.push({
      id: "tension",
      line1: "Tension financière sur certains partenaires.",
      line2: `${finance?.atRiskPartners ?? 0} partenaire(s) à surveiller`,
      priority: "high",
    });
  }
  out.push({
    id: "opp",
    line1: "Opportunité : renforcer les partenaires stables en croissance.",
    line2: "Réseau prêt pour accélération encaissements",
    priority: "low",
  });
  for (const a of alerts?.filter((x) => x.level !== "info").slice(0, 1) ?? []) {
    out.push({
      id: `alert-${a.id}`,
      line1: sanitizeFinanceText(a.message).slice(0, 64),
      line2: a.suggestedAction ?? "Suivi terrain",
      priority: a.level === "critical" ? "high" : "medium",
    });
  }
  for (const item of intelligence?.insights?.slice(0, 1) ?? []) {
    out.push({
      id: `intel-${item.id}`,
      line1: sanitizeFinanceText(item.title),
      line2: sanitizeFinanceText(item.detail).slice(0, 72),
      priority: item.severity,
    });
  }
  return out.slice(0, 8);
}

export function buildProducerFinanceView(args: {
  finance: ProducerFinanceCollectionsDto | null;
  orders: ProducerOrderSummaryDto | null;
  commercial: ProducerCommercialNetworkDto | null;
  network: ProducerNetworkActivityDto | null;
  map: ProducerMapControlDto | null;
  alerts: ProducerAlertDto[] | null;
  intelligence: ProducerDataIntelligenceDto | null;
  supply: ProducerSupplyLogisticsDto | null;
}): ProducerFinanceWorkspaceView {
  const map = buildMapWithMan(args.map);
  const regions = enrichMapRegions(map);

  return {
    overview: buildFinanceOverview(args.finance, args.commercial, args.network, regions),
    collections: buildCollectionRows(args.finance, args.commercial),
    stability: buildPaymentStability(args.finance, map, regions),
    partnerRisks: buildPartnerRisks(args.finance, args.commercial),
    coverage: buildFinanceCoverage(args.finance, regions, map),
    insights: buildFinanceInsights(
      args.finance,
      args.commercial,
      regions,
      args.intelligence,
      args.alerts,
    ),
    map,
    cities: regions.map((r) => r.name),
  };
}
