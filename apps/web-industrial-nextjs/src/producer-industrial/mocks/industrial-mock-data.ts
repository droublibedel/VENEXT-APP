/**
 * Instruction 20.45 — realistic industrial demo data (Côte d'Ivoire network).
 */

export type ProducerRegion = {
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

export type ProducerPartner = {
  id: string;
  name: string;
  type: "wholesaler" | "retailer";
  regionId: string;
  orders7d: number;
  revenueXof: number;
  risk: "stable" | "watch" | "elevated";
};

export type ProducerProductSignal = {
  id: string;
  name: string;
  category: string;
  momentum: "rising" | "stable" | "cooling";
  demandPressure: number;
};

export const PRODUCER_DEMO_ORGANIZATION_ID = "31111111-1111-1111-1111-111111111101";

export const PRODUCER_REGIONS: ProducerRegion[] = [
  {
    id: "abidjan",
    name: "Abidjan",
    lat: 5.36,
    lng: -4.01,
    wholesalers: 42,
    retailers: 318,
    orderVolume7d: 18420,
    growthPct: 12.4,
    tension: "medium",
  },
  {
    id: "bouake",
    name: "Bouaké",
    lat: 7.69,
    lng: -5.03,
    wholesalers: 18,
    retailers: 124,
    orderVolume7d: 6210,
    growthPct: 8.1,
    tension: "low",
  },
  {
    id: "korhogo",
    name: "Korhogo",
    lat: 9.45,
    lng: -5.63,
    wholesalers: 11,
    retailers: 76,
    orderVolume7d: 3890,
    growthPct: 15.2,
    tension: "medium",
  },
  {
    id: "san-pedro",
    name: "San Pedro",
    lat: 4.75,
    lng: -6.64,
    wholesalers: 9,
    retailers: 52,
    orderVolume7d: 2940,
    growthPct: 6.8,
    tension: "low",
  },
  {
    id: "yamoussoukro",
    name: "Yamoussoukro",
    lat: 6.82,
    lng: -5.28,
    wholesalers: 14,
    retailers: 98,
    orderVolume7d: 5120,
    growthPct: 9.5,
    tension: "high",
  },
];

export const PRODUCER_TOP_WHOLESALERS: ProducerPartner[] = [
  { id: "w1", name: "Société Agro Nord", type: "wholesaler", regionId: "abidjan", orders7d: 842, revenueXof: 48_200_000, risk: "stable" },
  { id: "w2", name: "Distrib Korhogo Centrale", type: "wholesaler", regionId: "korhogo", orders7d: 612, revenueXof: 31_400_000, risk: "stable" },
  { id: "w3", name: "Grossistes Bouaké Union", type: "wholesaler", regionId: "bouake", orders7d: 588, revenueXof: 29_800_000, risk: "watch" },
  { id: "w4", name: "Port Supply San Pedro", type: "wholesaler", regionId: "san-pedro", orders7d: 421, revenueXof: 22_100_000, risk: "stable" },
  { id: "w5", name: "Réseau Yamoussoukro Est", type: "wholesaler", regionId: "yamoussoukro", orders7d: 398, revenueXof: 19_600_000, risk: "elevated" },
];

export const PRODUCER_RECENT_PARTNERS: ProducerPartner[] = [
  { id: "r1", name: "Boutique Plateau 12", type: "retailer", regionId: "abidjan", orders7d: 28, revenueXof: 1_240_000, risk: "stable" },
  { id: "r2", name: "Marché Adjamé Express", type: "retailer", regionId: "abidjan", orders7d: 34, revenueXof: 1_890_000, risk: "stable" },
  { id: "r3", name: "Corner Shop Korhogo Nord", type: "retailer", regionId: "korhogo", orders7d: 19, revenueXof: 820_000, risk: "watch" },
];

export const PRODUCER_PRODUCT_SIGNALS: ProducerProductSignal[] = [
  { id: "p1", name: "Huile palme 1L", category: "Agro", momentum: "rising", demandPressure: 78 },
  { id: "p2", name: "Riz parfumé 25kg", category: "Agro", momentum: "rising", demandPressure: 72 },
  { id: "p3", name: "Boisson énergisante", category: "FMCG", momentum: "stable", demandPressure: 54 },
  { id: "p4", name: "Savon ménager", category: "Hygiène", momentum: "cooling", demandPressure: 38 },
];

export const PRODUCER_EXECUTIVE_SUMMARY = {
  networkStability: 86,
  activePartners: 694,
  criticalCorridors: 3,
  strategicSignals: 7,
  economicActivityIndex: 74,
  majorRisks: 2,
  distributionHealth: 81,
  networkResilience: 88,
};

export const PRODUCER_SUPPLY_SUMMARY = {
  logisticFlowsActive: 24,
  tensionZones: 2,
  slowedCorridors: 1,
  supplyPressure: 62,
  criticalDependencies: 4,
  distributionActivity: 91,
};

export const PRODUCER_FINANCE_SUMMARY = {
  networkFinancialStability: 79,
  collections7dXof: 412_000_000,
  atRiskPartners: 5,
  paymentDelaysDays: 12,
  economicExposureXof: 89_000_000,
  paymentPressure: 58,
};

export const PRODUCER_INTELLIGENCE_INSIGHTS = [
  {
    id: "i1",
    severity: "high" as const,
    title: "Tension corridor Yamoussoukro",
    detail: "Pression supply et retards encaissements corrélés sur 3 grossistes.",
  },
  {
    id: "i2",
    severity: "medium" as const,
    title: "Croissance Korhogo",
    detail: "Demande huile et riz en hausse — capacité distribution à surveiller.",
  },
  {
    id: "i3",
    severity: "low" as const,
    title: "Réseau Abidjan stable",
    detail: "Stabilité relationnelle élevée, rotation commerciale normale.",
  },
  {
    id: "i4",
    severity: "medium" as const,
    title: "Signal macro réseau",
    detail: "Gouvernance corridor : coordination exécutive recommandée sous 72h.",
  },
];

export const PRODUCER_ALERTS = [
  { id: "a1", level: "critical" as const, message: "Retard livraison corridor Yamoussoukro — 2 lots" },
  { id: "a2", level: "warning" as const, message: "Pression paiement — Grossistes Bouaké Union" },
  { id: "a3", level: "info" as const, message: "Activation promotionnelle Korhogo — objectif 94%" },
];

export function getRegionById(id: string): ProducerRegion | undefined {
  return PRODUCER_REGIONS.find((r) => r.id === id);
}

export function formatXof(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M XOF`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k XOF`;
  return `${amount} XOF`;
}
