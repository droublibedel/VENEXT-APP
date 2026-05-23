import type { ProducerDataSource, ProducerMapControlDto } from "../data/producer-industrial-data.types";

export type IntelligencePanelProps = {
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
};

export type IntelligenceOverviewMetric = {
  id: string;
  label: string;
  value: string;
  tone?: "neutral" | "signal" | "caution";
};

export type NetworkSignalCard = {
  id: string;
  line1: string;
  line2?: string;
  tone?: "signal" | "caution" | "neutral";
};

export type MarketAttentionItem = {
  id: string;
  label: string;
  detail: string;
  tone?: "signal" | "caution" | "neutral";
};

export type StrategicSuggestion = {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
};

export type ActivityAnomaly = {
  id: string;
  label: string;
  detail: string;
  tone?: "caution" | "neutral" | "signal";
};

export type PriorityInsight = {
  id: string;
  line1: string;
  line2?: string;
  priority: "high" | "medium" | "low";
};

export type PresenceMessage = {
  id: string;
  text: string;
};

export type ProducerIntelligenceWorkspaceView = {
  overview: IntelligenceOverviewMetric[];
  networkSignals: NetworkSignalCard[];
  marketAttention: MarketAttentionItem[];
  suggestions: StrategicSuggestion[];
  anomalies: ActivityAnomaly[];
  priorityInsights: PriorityInsight[];
  presence: PresenceMessage[];
  map: ProducerMapControlDto | null;
};
