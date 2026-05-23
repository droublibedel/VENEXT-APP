import type { ProducerDataSource, ProducerMapControlDto } from "../data/producer-industrial-data.types";

export type TerritoryPanelProps = {
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
};

export type TerritoryOverviewMetric = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "signal" | "caution";
};

export type TerritoryCorridorRow = {
  id: string;
  label: string;
  status: "actif" | "ralenti" | "tension" | "stable";
  activityPct: number;
  stability: number;
  coverage: string;
};

export type TerritoryCityActivity = {
  id: string;
  city: string;
  commercialActivity: number;
  ordersActivity: number;
  networkActivity: number;
  growthPct: number;
  trend: "hausse" | "stable" | "baisse";
};

export type TerritoryDistributorRow = {
  id: string;
  distributor: string;
  city: string;
  activity: "forte" | "moyenne" | "faible";
  stability: number;
  orders: number;
  coverage: number;
  growth: string;
  status: "actif" | "stable" | "ralentissement" | "sous-exploité";
};

export type TerritoryRegionBlock = {
  id: string;
  region: string;
  growthPct: number;
  activity: number;
  availability: string;
  stability: number;
  tension: string;
};

export type TerritoryOpportunity = {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
};

export type TerritoryInsight = {
  id: string;
  line1: string;
  line2?: string;
  priority: "high" | "medium" | "low";
};

export type ProducerTerritoryWorkspaceView = {
  overview: TerritoryOverviewMetric[];
  corridors: TerritoryCorridorRow[];
  cityActivity: TerritoryCityActivity[];
  distributors: TerritoryDistributorRow[];
  regions: TerritoryRegionBlock[];
  opportunities: TerritoryOpportunity[];
  insights: TerritoryInsight[];
  map: ProducerMapControlDto | null;
  topZoneWeek: string;
  cities: string[];
};
