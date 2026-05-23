import type { ProducerDataSource } from "../data/producer-industrial-data.types";

export type CatalogPanelProps = {
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
};

export type CatalogOverviewMetric = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "signal" | "caution";
};

export type CatalogProductRow = {
  id: string;
  product: string;
  category: string;
  rotation: "rapide" | "normale" | "lente";
  demand: number;
  availability: "bonne" | "moyenne" | "faible";
  growth: string;
  cityCoverage: number;
  status: "actif" | "tension" | "ralentissement" | "dormant";
};

export type CatalogDemandZone = {
  id: string;
  label: string;
  pressurePct: number;
  trend: "hausse" | "stable" | "baisse";
  risk: "rupture" | "tension" | "stable";
};

export type CatalogRotationBucket = {
  id: string;
  label: string;
  count: number;
  examples: string[];
};

export type CatalogRecommendation = {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
};

export type CatalogProductInsight = {
  id: string;
  line1: string;
  line2?: string;
  priority: "high" | "medium" | "low";
};

export type ProducerCatalogWorkspaceView = {
  overview: CatalogOverviewMetric[];
  products: CatalogProductRow[];
  categories: string[];
  cities: string[];
  demandZones: CatalogDemandZone[];
  rotationBuckets: CatalogRotationBucket[];
  recommendations: CatalogRecommendation[];
  insights: CatalogProductInsight[];
  topProductWeek: string;
  catalogStability: number;
  networkAvailability: number;
};
