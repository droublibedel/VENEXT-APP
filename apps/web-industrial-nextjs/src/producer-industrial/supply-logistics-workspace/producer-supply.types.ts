import type { ProducerDataSource, ProducerMapControlDto } from "../data/producer-industrial-data.types";

export type SupplyPanelProps = {
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
};

export type SupplyOverviewMetric = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "signal" | "caution";
};

export type SupplyCorridorRow = {
  id: string;
  label: string;
  status: "fluide" | "ralenti" | "tension";
  transportActivity: number;
  executionStability: number;
  logisticsPressure: string;
};

export type SupplyFlowRow = {
  id: string;
  label: string;
  speed: "rapide" | "ralenti" | "stable";
  congestion: string;
  delayRisk: string;
  corridorNote: string;
};

export type SupplyHubRow = {
  id: string;
  hub: string;
  city: string;
  activity: "forte" | "moyenne" | "faible";
  stability: number;
  flux: number;
  execution: number;
  growth: string;
  status: "actif" | "stable" | "sous pression" | "à surveiller";
};

export type SupplyDeliveryTensionItem = {
  id: string;
  label: string;
  detail: string;
  tone?: "caution" | "signal" | "neutral";
};

export type SupplyInsight = {
  id: string;
  line1: string;
  line2?: string;
  priority: "high" | "medium" | "low";
};

export type ProducerSupplyWorkspaceView = {
  overview: SupplyOverviewMetric[];
  corridors: SupplyCorridorRow[];
  flows: SupplyFlowRow[];
  hubs: SupplyHubRow[];
  deliveryTension: SupplyDeliveryTensionItem[];
  insights: SupplyInsight[];
  map: ProducerMapControlDto | null;
  topHubWeek: string;
  cities: string[];
};
