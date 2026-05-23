/** Instruction 20.46 — normalized producer cockpit DTOs (no technical layer jargon). */

export type ProducerDataSource = "live" | "fallback" | "mixed";

export type ProducerIndustrialDiagnostics = {
  apiLatencyMs?: number;
  lastSuccessfulSyncAt?: string | null;
  upstreamPaths?: string[];
  [key: string]: unknown;
};

export type ProducerIndustrialEnvelope<T> = {
  dataSource: ProducerDataSource;
  generatedAt: string;
  organizationId: string;
  fallbackUsed: boolean;
  fallbackReasons: string[];
  diagnostics: ProducerIndustrialDiagnostics;
  payload: T;
};

export type ProducerIndustrialOverviewDto = {
  networkStability: number;
  activePartners: number;
  criticalCorridors: number;
  headline: string;
};

export type ProducerExecutiveDto = {
  networkStability: number;
  activePartners: number;
  criticalCorridors: number;
  strategicSignals: number;
  economicActivityIndex: number;
  majorRisks: number;
  distributionHealth: number;
  networkResilience: number;
};

export type ProducerCommercialNetworkDto = {
  totalOrders7d: number;
  activeZones: number;
  weakRegions: number;
  averageGrowthPct: number;
  regions: ProducerMapRegionDto[];
  topWholesalers: ProducerPartnerDto[];
  recentPartners: ProducerPartnerDto[];
};

export type ProducerMarketingActivationDto = {
  trendingProducts: number;
  demandPressurePct: number;
  activationCorridors: number;
  campaignRotationPct: number;
  products: ProducerProductTrendDto[];
};

export type ProducerSupplyLogisticsDto = {
  logisticFlowsActive: number;
  tensionZones: number;
  slowedCorridors: number;
  supplyPressure: number;
  criticalDependencies: number;
  distributionActivity: number;
};

export type ProducerFinanceCollectionsDto = {
  networkFinancialStability: number;
  collections7dXof: number;
  atRiskPartners: number;
  paymentDelaysDays: number;
  economicExposureXof: number;
  paymentPressure: number;
  atRiskPartnerList: ProducerPartnerDto[];
};

export type ProducerDataIntelligenceDto = {
  insights: ProducerIntelligenceInsightDto[];
};

export type ProducerIntelligenceInsightDto = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
};

export type ProducerMapRegionDto = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  wholesalers: number;
  retailers: number;
  orderVolume7d: number;
  growthPct: number;
  tension: "low" | "medium" | "high";
};

export type ProducerMapCorridorDto = {
  id: string;
  label: string;
  tension: "low" | "medium" | "high";
};

export type ProducerMapControlDto = {
  regions: ProducerMapRegionDto[];
  corridors: ProducerMapCorridorDto[];
};

export type ProducerAlertDto = {
  id: string;
  level: "critical" | "warning" | "info";
  pole?: string;
  zone?: string;
  message: string;
  suggestedAction?: string;
};

export type ProducerPartnerDto = {
  id: string;
  name: string;
  type: "wholesaler" | "retailer";
  regionId: string;
  orders7d: number;
  revenueXof: number;
  risk: "stable" | "watch" | "elevated";
};

export type ProducerProductTrendDto = {
  id: string;
  name: string;
  category: string;
  momentum: "rising" | "stable" | "cooling";
  demandPressure: number;
};

export type ProducerOrderSummaryDto = {
  totalOrders7d: number;
  pendingCount: number;
  fulfilledCount: number;
};

export type ProducerNetworkActivityDto = {
  activePartners: number;
  orders7d: number;
  growthPct: number;
};
