/**
 * Instruction 20.46 — map technical backend shapes to producer-facing DTOs.
 */

import {
  PRODUCER_EXECUTIVE_SUMMARY,
  PRODUCER_FINANCE_SUMMARY,
  PRODUCER_PRODUCT_SIGNALS,
  PRODUCER_RECENT_PARTNERS,
  PRODUCER_REGIONS,
  PRODUCER_SUPPLY_SUMMARY,
  PRODUCER_TOP_WHOLESALERS,
} from "../mocks/industrial-mock-data";

import type {
  ProducerAlertDto,
  ProducerCommercialNetworkDto,
  ProducerDataIntelligenceDto,
  ProducerDataSource,
  ProducerExecutiveDto,
  ProducerFinanceCollectionsDto,
  ProducerMapControlDto,
  ProducerMapRegionDto,
  ProducerMarketingActivationDto,
  ProducerNetworkActivityDto,
  ProducerOrderSummaryDto,
  ProducerPartnerDto,
  ProducerProductTrendDto,
  ProducerIndustrialOverviewDto,
  ProducerSupplyLogisticsDto,
} from "./producer-industrial-data.types";

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

export function mapStrategicObservatoryToExecutive(
  raw: Record<string, unknown> | null,
  base: ProducerExecutiveDto = { ...PRODUCER_EXECUTIVE_SUMMARY },
): ProducerExecutiveDto {
  if (!raw) return base;
  const systemic = (raw.systemicPressure ?? raw.networkPressure) as Record<string, unknown> | undefined;
  const governance = raw.governancePriority as Record<string, unknown> | undefined;
  return {
    networkStability: num(systemic?.score ?? systemic?.networkStability, base.networkStability),
    activePartners: num(raw.activePartnerCount ?? raw.partnerCount, base.activePartners),
    criticalCorridors: num(raw.criticalCorridorCount ?? governance?.criticalCorridors, base.criticalCorridors),
    strategicSignals: num(raw.strategicSignalCount ?? raw.signalCount, base.strategicSignals),
    economicActivityIndex: num(raw.economicActivityIndex ?? systemic?.activityIndex, base.economicActivityIndex),
    majorRisks: num(raw.majorRiskCount ?? raw.riskCount, base.majorRisks),
    distributionHealth: num(raw.distributionHealth ?? raw.healthScore, base.distributionHealth),
    networkResilience: num(raw.networkResilience ?? raw.resilienceScore, base.networkResilience),
  };
}

export function mapSupplyFlowToSupplyDto(
  raw: Record<string, unknown> | null,
  base: ProducerSupplyLogisticsDto = { ...PRODUCER_SUPPLY_SUMMARY },
): ProducerSupplyLogisticsDto {
  if (!raw) return base;
  const pressure = raw.pressureScore ?? raw.supplyPressure;
  return {
    logisticFlowsActive: num(raw.activeFlowCount ?? raw.flowCount, base.logisticFlowsActive),
    tensionZones: num(raw.tensionZoneCount ?? raw.highPressureZones, base.tensionZones),
    slowedCorridors: num(raw.slowedCorridorCount ?? raw.bottleneckCount, base.slowedCorridors),
    supplyPressure: num(pressure, base.supplyPressure),
    criticalDependencies: num(raw.criticalDependencyCount ?? raw.dependencyCount, base.criticalDependencies),
    distributionActivity: num(raw.distributionActivity ?? raw.activityScore, base.distributionActivity),
  };
}

export function mapOrdersSnapshotToFinance(
  raw: Record<string, unknown> | null,
  base: ProducerFinanceCollectionsDto,
): ProducerFinanceCollectionsDto {
  if (!raw) return base;
  const totals = raw.totals as Record<string, unknown> | undefined;
  return {
    ...base,
    collections7dXof: num(totals?.revenueXof ?? totals?.amountXof, base.collections7dXof),
    atRiskPartners: num(raw.atRiskPartnerCount ?? raw.riskCount, base.atRiskPartners),
    paymentDelaysDays: num(raw.averageDelayDays ?? raw.paymentDelayDays, base.paymentDelaysDays),
    economicExposureXof: num(totals?.exposureXof ?? raw.exposureXof, base.economicExposureXof),
    paymentPressure: num(raw.paymentPressure ?? raw.pressureScore, base.paymentPressure),
    networkFinancialStability: num(raw.financialStability ?? raw.stabilityScore, base.networkFinancialStability),
  };
}

export function mapCommercialNetworkBundle(
  raw: Record<string, unknown> | null,
): ProducerCommercialNetworkDto | null {
  if (!raw) return null;
  const territories = Array.isArray(raw.territories) ? raw.territories : Array.isArray(raw.zones) ? raw.zones : null;
  if (!territories?.length) return null;

  const regions: ProducerMapRegionDto[] = territories.slice(0, 12).map((t, i) => {
    const row = t as Record<string, unknown>;
    const fallback = PRODUCER_REGIONS[i % PRODUCER_REGIONS.length]!;
    return {
      id: str(row.id ?? row.territoryId, fallback.id),
      name: str(row.name ?? row.label, fallback.name),
      lat: num(row.lat, fallback.lat),
      lng: num(row.lng, fallback.lng),
      wholesalers: num(row.wholesalerCount ?? row.wholesalers, fallback.wholesalers),
      retailers: num(row.retailerCount ?? row.retailers, fallback.retailers),
      orderVolume7d: num(row.orderVolume7d ?? row.volume7d, fallback.orderVolume7d),
      growthPct: num(row.growthPct ?? row.growth, fallback.growthPct),
      tension: (row.tension === "high" || row.tension === "medium" ? row.tension : "low") as "low" | "medium" | "high",
    };
  });

  const totalOrders7d = regions.reduce((s, r) => s + r.orderVolume7d, 0);
  return {
    totalOrders7d,
    activeZones: regions.length,
    weakRegions: regions.filter((r) => r.growthPct < 8).length,
    averageGrowthPct: regions.length ? regions.reduce((s, r) => s + r.growthPct, 0) / regions.length : 0,
    regions,
    topWholesalers: PRODUCER_TOP_WHOLESALERS.map((p) => ({ ...p })),
    recentPartners: PRODUCER_RECENT_PARTNERS.map((p) => ({ ...p })),
  };
}

export function mapPartnersFromGraph(raw: Record<string, unknown> | null): ProducerPartnerDto[] | null {
  const nodes = Array.isArray(raw?.nodes) ? raw!.nodes : Array.isArray(raw?.partners) ? raw!.partners : null;
  if (!nodes?.length) return null;
  return nodes.slice(0, 20).map((n, i) => {
    const row = n as Record<string, unknown>;
    const fb = PRODUCER_TOP_WHOLESALERS[i % PRODUCER_TOP_WHOLESALERS.length]!;
    const riskRaw = str(row.risk ?? row.riskLevel, fb.risk);
    const risk = riskRaw === "elevated" || riskRaw === "watch" ? riskRaw : "stable";
    return {
      id: str(row.id, fb.id),
      name: str(row.name ?? row.label, fb.name),
      type: row.type === "retailer" ? "retailer" : "wholesaler",
      regionId: str(row.regionId ?? row.territoryId, fb.regionId),
      orders7d: num(row.orders7d ?? row.orderCount, fb.orders7d),
      revenueXof: num(row.revenueXof ?? row.revenue, fb.revenueXof),
      risk,
    };
  });
}

export function mapProductsFromSignals(raw: Record<string, unknown> | null): ProducerProductTrendDto[] | null {
  const items = Array.isArray(raw?.products) ? raw!.products : Array.isArray(raw?.signals) ? raw!.signals : null;
  if (!items?.length) return null;
  return items.slice(0, 12).map((p, i) => {
    const row = p as Record<string, unknown>;
    const fb = PRODUCER_PRODUCT_SIGNALS[i % PRODUCER_PRODUCT_SIGNALS.length]!;
    const momentumRaw = str(row.momentum ?? row.trend, fb.momentum);
    const momentum =
      momentumRaw === "rising" || momentumRaw === "cooling" ? momentumRaw : ("stable" as const);
    return {
      id: str(row.id ?? row.productId, fb.id),
      name: str(row.name ?? row.productName, fb.name),
      category: str(row.category, fb.category),
      momentum,
      demandPressure: num(row.demandPressure ?? row.pressure, fb.demandPressure),
    };
  });
}

export function mapGeoAndSupplyToMap(
  geo: Record<string, unknown> | null,
  supply: Record<string, unknown> | null,
): ProducerMapControlDto {
  const commercial = mapCommercialNetworkBundle(geo);
  const regions = commercial?.regions?.length
    ? commercial.regions
    : PRODUCER_REGIONS.map((r) => ({ ...r }));

  const corridorSource = Array.isArray(supply?.criticalCorridors)
    ? supply!.criticalCorridors
    : Array.isArray(supply?.corridors)
      ? supply!.corridors
      : [];

  const corridors =
    corridorSource.length > 0
      ? corridorSource.slice(0, 8).map((c, i) => {
          const row = c as Record<string, unknown>;
          return {
            id: str(row.id, `corridor-${i}`),
            label: str(row.label ?? row.name, `Corridor ${i + 1}`),
            tension: (row.tension === "high" || row.tension === "medium" ? row.tension : "low") as
              | "low"
              | "medium"
              | "high",
          };
        })
      : [
          { id: "c-yam", label: "Corridor Yamoussoukro", tension: "high" as const },
          { id: "c-kor", label: "Corridor Korhogo", tension: "medium" as const },
        ];

  return { regions, corridors };
}

export function mapMonitoringToAlerts(raw: Record<string, unknown> | null): ProducerAlertDto[] | null {
  const items = Array.isArray(raw?.alerts) ? raw!.alerts : Array.isArray(raw?.signals) ? raw!.signals : null;
  if (!items?.length) return null;
  return items.slice(0, 12).map((a, i) => {
    const row = a as Record<string, unknown>;
    const levelRaw = str(row.level ?? row.severity, "info");
    const level =
      levelRaw === "critical" || levelRaw === "warning" ? levelRaw : ("info" as const);
    return {
      id: str(row.id, `alert-${i}`),
      level,
      message: str(row.message ?? row.title, "Signal réseau à examiner"),
      pole: str(row.pole ?? row.domain, "réseau"),
      zone: str(row.zone ?? row.territory, ""),
      suggestedAction: str(row.suggestedAction ?? row.action, "Ouvrir le tableau de bord du pôle"),
    };
  });
}

export function mapObservatoryToIntelligence(
  raw: Record<string, unknown> | null,
): ProducerDataIntelligenceDto | null {
  const items = Array.isArray(raw?.insights) ? raw!.insights : Array.isArray(raw?.signals) ? raw!.signals : null;
  if (!items?.length) return null;
  return {
    insights: items.slice(0, 8).map((item, i) => {
      const row = item as Record<string, unknown>;
      const sevRaw = str(row.severity ?? row.level, "medium");
      const severity = sevRaw === "high" || sevRaw === "low" ? sevRaw : ("medium" as const);
      return {
        id: str(row.id, `insight-${i}`),
        severity,
        title: str(row.title ?? row.headline, "Signal réseau"),
        detail: str(row.detail ?? row.summary, "Analyse en cours sur la couverture relationnelle."),
      };
    }),
  };
}

export function mapExecutiveToOverview(exec: ProducerExecutiveDto): ProducerIndustrialOverviewDto {
  return {
    networkStability: exec.networkStability,
    activePartners: exec.activePartners,
    criticalCorridors: exec.criticalCorridors,
    headline: "Pilotage réseau producteur",
  };
}

export function mapOrdersSnapshotSummary(raw: Record<string, unknown> | null): ProducerOrderSummaryDto | null {
  if (!raw) return null;
  const totals = raw.totals as Record<string, unknown> | undefined;
  const totalOrders7d = num(totals?.orderCount7d ?? totals?.orders7d ?? raw.orderCount7d, 0);
  if (!totalOrders7d) return null;
  return {
    totalOrders7d,
    pendingCount: num(totals?.pendingCount ?? raw.pendingCount, Math.round(totalOrders7d * 0.08)),
    fulfilledCount: num(totals?.fulfilledCount ?? raw.fulfilledCount, Math.round(totalOrders7d * 0.92)),
  };
}

export function mapNetworkActivity(
  commercial: ProducerCommercialNetworkDto | null,
  orders: ProducerOrderSummaryDto | null,
): ProducerNetworkActivityDto | null {
  if (!commercial && !orders) return null;
  return {
    activePartners: PRODUCER_EXECUTIVE_SUMMARY.activePartners,
    orders7d: orders?.totalOrders7d ?? commercial?.totalOrders7d ?? 0,
    growthPct: commercial?.averageGrowthPct ?? 0,
  };
}

export function mapMarketingFromProducts(products: ProducerProductTrendDto[]): ProducerMarketingActivationDto {
  const rising = products.filter((p) => p.momentum === "rising").length;
  const avgPressure = products.length
    ? Math.round(products.reduce((s, p) => s + p.demandPressure, 0) / products.length)
    : 0;
  return {
    trendingProducts: rising,
    demandPressurePct: avgPressure,
    activationCorridors: PRODUCER_REGIONS.length,
    campaignRotationPct: 94,
    products,
  };
}

export function resolveFinanceBase(): ProducerFinanceCollectionsDto {
  return {
    ...PRODUCER_FINANCE_SUMMARY,
    atRiskPartnerList: PRODUCER_TOP_WHOLESALERS.filter((p) => p.risk !== "stable").map((p) => ({ ...p })),
  };
}

export function inferDataSource(liveParts: boolean, fallbackParts: boolean): ProducerDataSource {
  if (liveParts && fallbackParts) return "mixed";
  if (liveParts) return "live";
  return "fallback";
}
