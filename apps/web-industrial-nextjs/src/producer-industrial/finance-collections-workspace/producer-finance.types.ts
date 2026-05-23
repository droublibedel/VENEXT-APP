import type { ProducerDataSource, ProducerMapControlDto } from "../data/producer-industrial-data.types";

export type FinancePanelProps = {
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
};

export type FinanceOverviewMetric = {
  id: string;
  label: string;
  value: string;
  tone?: "neutral" | "signal" | "caution";
};

export type FinanceCollectionRow = {
  id: string;
  partner: string;
  city: string;
  volume: string;
  stability: number;
  delays: string;
  activity: "forte" | "moyenne" | "faible";
  evolution: string;
  status: "stable" | "surveiller" | "critique";
};

export type FinanceStabilityBlock = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  tone?: "signal" | "caution" | "neutral";
};

export type FinancePartnerRiskItem = {
  id: string;
  name: string;
  city: string;
  category: "fiable" | "ralenti" | "critique" | "irrégulier";
  note: string;
};

export type FinanceCoverageBlock = {
  id: string;
  label: string;
  value: string;
  tone?: "signal" | "caution" | "neutral";
};

export type FinanceInsight = {
  id: string;
  line1: string;
  line2?: string;
  priority: "high" | "medium" | "low";
};

export type ProducerFinanceWorkspaceView = {
  overview: FinanceOverviewMetric[];
  collections: FinanceCollectionRow[];
  stability: FinanceStabilityBlock[];
  partnerRisks: FinancePartnerRiskItem[];
  coverage: FinanceCoverageBlock[];
  insights: FinanceInsight[];
  map: ProducerMapControlDto | null;
  cities: string[];
};
