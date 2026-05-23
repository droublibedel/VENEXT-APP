import type { ProducerDataSource, ProducerMapControlDto } from "../data/producer-industrial-data.types";

export type MarketingPanelProps = {
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
};

export type MarketingOverviewMetric = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "signal" | "caution";
};

export type MarketingCampaignRow = {
  id: string;
  label: string;
  status: "performante" | "faible" | "stable";
  zone: string;
  activityPct: number;
  stability: number;
  distributorActivity: string;
};

export type MarketingProductMomentumRow = {
  id: string;
  product: string;
  category: string;
  momentum: "accélère" | "stable" | "ralentit";
  demandPressure: number;
  status: "pic" | "surveiller" | "stable";
};

export type MarketingDistributorActivationRow = {
  id: string;
  distributor: string;
  city: string;
  activationActivity: "forte" | "moyenne" | "faible";
  growth: string;
  orders: number;
  productsPushed: number;
  stability: number;
  status: "actif" | "stable" | "ralentissement" | "à relancer";
};

export type MarketingPressureBlock = {
  id: string;
  label: string;
  value: string;
  tone?: "signal" | "caution" | "neutral";
};

export type MarketingInsight = {
  id: string;
  line1: string;
  line2?: string;
  priority: "high" | "medium" | "low";
};

export type MarketingOpportunity = {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
};

export type ProducerMarketingWorkspaceView = {
  overview: MarketingOverviewMetric[];
  campaigns: MarketingCampaignRow[];
  productMomentum: MarketingProductMomentumRow[];
  distributors: MarketingDistributorActivationRow[];
  pressure: MarketingPressureBlock[];
  opportunities: MarketingOpportunity[];
  insights: MarketingInsight[];
  map: ProducerMapControlDto | null;
  topActivationWeek: string;
  cities: string[];
  categories: string[];
};
