import type { ProducerDataSource, ProducerMapControlDto } from "../data/producer-industrial-data.types";

export type FulfillmentPanelProps = {
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
};

export type ProducerOrderBucket = {
  id: string;
  label: string;
  count: number;
  volume: number;
  stability: number;
  trend: "hausse" | "baisse" | "stable";
  zones: string[];
  tone: "neutral" | "signal" | "caution";
};

export type ProducerOrderRow = {
  id: string;
  reference: string;
  partner: string;
  city: string;
  status: string;
  corridor: string;
  volume: number;
  delayDays: number;
  priority: "critique" | "warning" | "stable";
};

export type ProducerFlowCard = {
  id: string;
  title: string;
  detail: string;
  progressPct?: number;
  tone: "neutral" | "signal" | "caution";
};

export type ProducerDeliveryMetric = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

export type ProducerIncidentRow = {
  id: string;
  title: string;
  zone: string;
  corridor: string;
  priority: "critique" | "warning" | "stable";
  action: string;
};

export type ProducerProofRow = {
  id: string;
  label: string;
  partner: string;
  city: string;
  status: "reçu" | "confirmé" | "validé" | "anomalie" | "manquant";
  at: string;
};

export type ProducerCorridorExecution = {
  id: string;
  label: string;
  executionPct: number;
  stability: number;
  status: "sature" | "performant" | "stable" | "tension";
  territory: string;
};

export type ProducerOperationalInsight = {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
};

export type ProducerOrderFulfillmentView = {
  orderBuckets: ProducerOrderBucket[];
  orderRows: ProducerOrderRow[];
  fulfillmentFlows: ProducerFlowCard[];
  deliveryMetrics: ProducerDeliveryMetric[];
  deliveryByCity: { city: string; avgDays: number; status: string }[];
  incidents: ProducerIncidentRow[];
  proofs: ProducerProofRow[];
  corridors: ProducerCorridorExecution[];
  map: ProducerMapControlDto | null;
  insights: ProducerOperationalInsight[];
  networkStability: number;
  executionPressure: number;
};
