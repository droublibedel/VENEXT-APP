/**
 * Instruction 20.46 — secure mock fallback (demo-safe, producer language).
 */

import {
  PRODUCER_ALERTS,
  PRODUCER_DEMO_ORGANIZATION_ID,
  PRODUCER_EXECUTIVE_SUMMARY,
  PRODUCER_FINANCE_SUMMARY,
  PRODUCER_INTELLIGENCE_INSIGHTS,
  PRODUCER_PRODUCT_SIGNALS,
  PRODUCER_RECENT_PARTNERS,
  PRODUCER_REGIONS,
  PRODUCER_SUPPLY_SUMMARY,
  PRODUCER_TOP_WHOLESALERS,
} from "../mocks/industrial-mock-data";

import { createProducerEnvelope } from "./producer-industrial-data-status";
import type {
  ProducerAlertDto,
  ProducerCommercialNetworkDto,
  ProducerDataIntelligenceDto,
  ProducerExecutiveDto,
  ProducerFinanceCollectionsDto,
  ProducerIndustrialEnvelope,
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

export const PRODUCER_FALLBACK_ORG_ID = PRODUCER_DEMO_ORGANIZATION_ID;

function fallbackReason(reason: string) {
  return [reason];
}

function toPartnerDto(p: {
  id: string;
  name: string;
  type: "wholesaler" | "retailer";
  regionId: string;
  orders7d: number;
  revenueXof: number;
  risk: "stable" | "watch" | "elevated";
}): ProducerPartnerDto {
  return { ...p };
}

function toRegionDto(r: (typeof PRODUCER_REGIONS)[number]): ProducerMapRegionDto {
  return { ...r };
}

function toProductDto(p: (typeof PRODUCER_PRODUCT_SIGNALS)[number]): ProducerProductTrendDto {
  return { ...p };
}

export function fallbackProducerOverview(
  organizationId = PRODUCER_FALLBACK_ORG_ID,
  reason = "demo_enriched",
): ProducerIndustrialEnvelope<ProducerIndustrialOverviewDto> {
  return createProducerEnvelope({
    organizationId,
    dataSource: "fallback",
    fallbackUsed: true,
    fallbackReasons: fallbackReason(reason),
    payload: {
      networkStability: PRODUCER_EXECUTIVE_SUMMARY.networkStability,
      activePartners: PRODUCER_EXECUTIVE_SUMMARY.activePartners,
      criticalCorridors: PRODUCER_EXECUTIVE_SUMMARY.criticalCorridors,
      headline: "Réseau Côte d'Ivoire — démonstration enrichie",
    },
  });
}

export function fallbackProducerExecutive(
  organizationId = PRODUCER_FALLBACK_ORG_ID,
  reason = "demo_enriched",
): ProducerIndustrialEnvelope<ProducerExecutiveDto> {
  return createProducerEnvelope({
    organizationId,
    dataSource: "fallback",
    fallbackUsed: true,
    fallbackReasons: fallbackReason(reason),
    payload: { ...PRODUCER_EXECUTIVE_SUMMARY },
  });
}

export function fallbackProducerCommercialNetwork(
  organizationId = PRODUCER_FALLBACK_ORG_ID,
  reason = "demo_enriched",
): ProducerIndustrialEnvelope<ProducerCommercialNetworkDto> {
  const regions = PRODUCER_REGIONS.map(toRegionDto);
  const totalOrders7d = regions.reduce((s, r) => s + r.orderVolume7d, 0);
  return createProducerEnvelope({
    organizationId,
    dataSource: "fallback",
    fallbackUsed: true,
    fallbackReasons: fallbackReason(reason),
    payload: {
      totalOrders7d,
      activeZones: regions.length,
      weakRegions: regions.filter((r) => r.growthPct < 8).length,
      averageGrowthPct: regions.reduce((s, r) => s + r.growthPct, 0) / regions.length,
      regions,
      topWholesalers: PRODUCER_TOP_WHOLESALERS.map(toPartnerDto),
      recentPartners: PRODUCER_RECENT_PARTNERS.map(toPartnerDto),
    },
  });
}

export function fallbackProducerMarketingActivation(
  organizationId = PRODUCER_FALLBACK_ORG_ID,
  reason = "demo_enriched",
): ProducerIndustrialEnvelope<ProducerMarketingActivationDto> {
  const products = PRODUCER_PRODUCT_SIGNALS.map(toProductDto);
  const rising = products.filter((p) => p.momentum === "rising").length;
  const avgPressure = Math.round(products.reduce((s, p) => s + p.demandPressure, 0) / products.length);
  return createProducerEnvelope({
    organizationId,
    dataSource: "fallback",
    fallbackUsed: true,
    fallbackReasons: fallbackReason(reason),
    payload: {
      trendingProducts: rising,
      demandPressurePct: avgPressure,
      activationCorridors: PRODUCER_REGIONS.length,
      campaignRotationPct: 94,
      products,
    },
  });
}

export function fallbackProducerSupplyLogistics(
  organizationId = PRODUCER_FALLBACK_ORG_ID,
  reason = "demo_enriched",
): ProducerIndustrialEnvelope<ProducerSupplyLogisticsDto> {
  return createProducerEnvelope({
    organizationId,
    dataSource: "fallback",
    fallbackUsed: true,
    fallbackReasons: fallbackReason(reason),
    payload: { ...PRODUCER_SUPPLY_SUMMARY },
  });
}

export function fallbackProducerFinanceCollections(
  organizationId = PRODUCER_FALLBACK_ORG_ID,
  reason = "demo_enriched",
): ProducerIndustrialEnvelope<ProducerFinanceCollectionsDto> {
  const atRiskPartnerList = PRODUCER_TOP_WHOLESALERS.filter((p) => p.risk !== "stable").map(toPartnerDto);
  return createProducerEnvelope({
    organizationId,
    dataSource: "fallback",
    fallbackUsed: true,
    fallbackReasons: fallbackReason(reason),
    payload: {
      ...PRODUCER_FINANCE_SUMMARY,
      atRiskPartnerList,
    },
  });
}

export function fallbackProducerDataIntelligence(
  organizationId = PRODUCER_FALLBACK_ORG_ID,
  reason = "demo_enriched",
): ProducerIndustrialEnvelope<ProducerDataIntelligenceDto> {
  return createProducerEnvelope({
    organizationId,
    dataSource: "fallback",
    fallbackUsed: true,
    fallbackReasons: fallbackReason(reason),
    payload: {
      insights: PRODUCER_INTELLIGENCE_INSIGHTS.map((i) => ({ ...i })),
    },
  });
}

export function fallbackProducerMapControl(
  organizationId = PRODUCER_FALLBACK_ORG_ID,
  reason = "demo_enriched",
): ProducerIndustrialEnvelope<ProducerMapControlDto> {
  return createProducerEnvelope({
    organizationId,
    dataSource: "fallback",
    fallbackUsed: true,
    fallbackReasons: fallbackReason(reason),
    payload: {
      regions: PRODUCER_REGIONS.map(toRegionDto),
      corridors: [
        { id: "c-yam", label: "Corridor Yamoussoukro", tension: "high" as const },
        { id: "c-kor", label: "Corridor Korhogo", tension: "medium" as const },
        { id: "c-abj", label: "Corridor Abidjan", tension: "medium" as const },
      ],
    },
  });
}

export function fallbackProducerAlerts(
  organizationId = PRODUCER_FALLBACK_ORG_ID,
  reason = "demo_enriched",
): ProducerIndustrialEnvelope<ProducerAlertDto[]> {
  return createProducerEnvelope({
    organizationId,
    dataSource: "fallback",
    fallbackUsed: true,
    fallbackReasons: fallbackReason(reason),
    payload: PRODUCER_ALERTS.map((a) => ({
      id: a.id,
      level: a.level,
      message: a.message,
      pole: "réseau",
      suggestedAction: "Consulter le pôle concerné",
    })),
  });
}

export function fallbackProducerPartners(
  organizationId = PRODUCER_FALLBACK_ORG_ID,
  reason = "demo_enriched",
): ProducerIndustrialEnvelope<ProducerPartnerDto[]> {
  return createProducerEnvelope({
    organizationId,
    dataSource: "fallback",
    fallbackUsed: true,
    fallbackReasons: fallbackReason(reason),
    payload: [...PRODUCER_TOP_WHOLESALERS, ...PRODUCER_RECENT_PARTNERS].map(toPartnerDto),
  });
}

export function fallbackProducerProducts(
  organizationId = PRODUCER_FALLBACK_ORG_ID,
  reason = "demo_enriched",
): ProducerIndustrialEnvelope<ProducerProductTrendDto[]> {
  return createProducerEnvelope({
    organizationId,
    dataSource: "fallback",
    fallbackUsed: true,
    fallbackReasons: fallbackReason(reason),
    payload: PRODUCER_PRODUCT_SIGNALS.map(toProductDto),
  });
}

export function fallbackProducerOrdersSummary(
  organizationId = PRODUCER_FALLBACK_ORG_ID,
  reason = "demo_enriched",
): ProducerIndustrialEnvelope<ProducerOrderSummaryDto> {
  const total = PRODUCER_REGIONS.reduce((s, r) => s + r.orderVolume7d, 0);
  return createProducerEnvelope({
    organizationId,
    dataSource: "fallback",
    fallbackUsed: true,
    fallbackReasons: fallbackReason(reason),
    payload: {
      totalOrders7d: total,
      pendingCount: Math.round(total * 0.08),
      fulfilledCount: Math.round(total * 0.92),
    },
  });
}

export function fallbackProducerNetworkActivity(
  organizationId = PRODUCER_FALLBACK_ORG_ID,
  reason = "demo_enriched",
): ProducerIndustrialEnvelope<ProducerNetworkActivityDto> {
  const total = PRODUCER_REGIONS.reduce((s, r) => s + r.orderVolume7d, 0);
  const avgGrowth = PRODUCER_REGIONS.reduce((s, r) => s + r.growthPct, 0) / PRODUCER_REGIONS.length;
  return createProducerEnvelope({
    organizationId,
    dataSource: "fallback",
    fallbackUsed: true,
    fallbackReasons: fallbackReason(reason),
    payload: {
      activePartners: PRODUCER_EXECUTIVE_SUMMARY.activePartners,
      orders7d: total,
      growthPct: avgGrowth,
    },
  });
}
