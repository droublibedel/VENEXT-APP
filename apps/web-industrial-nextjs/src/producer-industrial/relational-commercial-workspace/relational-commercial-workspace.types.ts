import type { ProducerDataSource } from "../data/producer-industrial-data.types";

export type RelationalPanelStatus = {
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
  refresh: () => void;
};

export type RelationalPartnerRow = {
  id: string;
  partner: string;
  city: string;
  activity: "forte" | "moyenne" | "faible";
  stability: number;
  orders: number;
  trend: "hausse" | "baisse" | "stable";
  corridor: string;
  segment: "actif" | "croissance" | "silencieux" | "nouveau" | "critique" | "dependance";
};

export type RelationalOrderFlowCard = {
  id: string;
  title: string;
  detail: string;
  tone: "neutral" | "caution" | "signal";
  volume?: number;
};

export type RelationalCorridorRow = {
  id: string;
  label: string;
  status: "tension" | "stable" | "croissance" | "dependant" | "critique";
  pressurePct: number;
  orders7d?: number;
};

export type RelationalActivityPoint = {
  id: string;
  label: string;
  value: string;
  at: string;
};

export type RelationalTerritoryZone = {
  id: string;
  name: string;
  coveragePct: number;
  growthPct: number;
  tension: "low" | "medium" | "high";
  lat: number;
  lng: number;
};

export type RelationalCommercialInsight = {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
};

export type RelationalCommercialWorkspaceView = {
  partners: RelationalPartnerRow[];
  partnerSegments: {
    actifs: number;
    croissance: number;
    silencieux: number;
    nouveaux: number;
    critiques: number;
    dependances: number;
  };
  orderFlows: RelationalOrderFlowCard[];
  corridors: RelationalCorridorRow[];
  activityByCity: { city: string; orders7d: number; growthPct: number }[];
  activityByCorridor: { corridor: string; orders7d: number }[];
  recentOrdersLabel: string;
  networkGrowthPct: number;
  silentZones: string[];
  timeline: RelationalActivityPoint[];
  products: {
    id: string;
    name: string;
    category: string;
    momentum: "rising" | "stable" | "cooling";
    demandPressure: number;
    rotation: "rapide" | "normale" | "lente";
  }[];
  territories: RelationalTerritoryZone[];
  dominatedCities: string[];
  weakZones: string[];
  missingCorridors: string[];
  insights: RelationalCommercialInsight[];
};
